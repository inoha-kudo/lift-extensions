import { CfnOutput, Fn } from 'aws-cdk-lib';
import type { Construct as CdkConstruct } from 'constructs';
import type { FromSchema } from 'json-schema-to-ts';
import { AwsConstruct } from 'serverless-lift/dist/src/constructs/abstracts/index.js';
import type { AwsProvider } from 'serverless-lift/dist/src/providers/index.js';
import { ensureNameMaxLength } from 'serverless-lift/dist/src/utils/naming.js';
import type { Serverless } from '../types/serverless';
import { websockets } from '../utils/laravel-cloud/websockets';

const LARAVEL_CLOUD_REVERB_DEFINITION = {
    type: 'object',
    properties: {
        type: { const: 'laravel-cloud-reverb' },
        maxConnections: { type: 'integer' },
        allowedOrigins: {
            type: 'array',
            items: { type: 'string' },
        },
        pingInterval: { type: 'integer', minimum: 1, maximum: 60 },
        activityTimeout: { type: 'integer', minimum: 1, maximum: 60 },
    },
    required: ['maxConnections', 'allowedOrigins'],
    additionalProperties: false,
} as const;

type Configuration = FromSchema<typeof LARAVEL_CLOUD_REVERB_DEFINITION>;

const MAPPING = 'LaravelCloudReverb';

export class LaravelCloudReverb extends AwsConstruct {
    public static type = 'laravel-cloud-reverb';
    public static schema = LARAVEL_CLOUD_REVERB_DEFINITION;

    private static serverless: Serverless;

    private readonly allowedOriginsOutput;

    static initialize(serverless: Serverless) {
        this.serverless = serverless;
    }

    constructor(
        scope: CdkConstruct,
        id: string,
        private readonly configuration: Configuration,
        private readonly provider: AwsProvider,
    ) {
        super(scope, id);

        this.allowedOriginsOutput = new CfnOutput(this, 'AllowedOrigins', {
            value: Fn.join(',', configuration.allowedOrigins),
        });

        const slsProvider = LaravelCloudReverb.serverless.service.provider;

        slsProvider.environment = {
            BROADCAST_CONNECTION: 'reverb',
            REVERB_APP_ID: { 'Fn::FindInMap': [MAPPING, 'Values', 'Id'] },
            REVERB_APP_KEY: { 'Fn::FindInMap': [MAPPING, 'Values', 'Key'] },
            REVERB_APP_SECRET: {
                'Fn::FindInMap': [MAPPING, 'Values', 'Secret'],
            },
            REVERB_HOST: { 'Fn::FindInMap': [MAPPING, 'Values', 'Host'] },
            REVERB_PORT: 443,
            REVERB_SCHEME: 'https',
            ...slsProvider.environment,
        };
    }

    async preDeploy() {
        const name = await this.name();
        const { maxConnections } = this.configuration;
        const cluster =
            (await websockets.clusters.find(name)) ??
            (await websockets.clusters.create({
                name,
                region: this.provider.region,
                max_connections: maxConnections,
            }));

        if (cluster.attributes.max_connections !== maxConnections) {
            await websockets.clusters.update(cluster, {
                max_connections: maxConnections,
            });
        }

        const { attributes: application } =
            await websockets.applications.get(cluster);
        const cfTemplate =
            LaravelCloudReverb.serverless.service.provider
                .compiledCloudFormationTemplate;

        cfTemplate.Mappings = {
            ...cfTemplate.Mappings,
            [MAPPING]: {
                Values: {
                    Id: application.app_id,
                    Key: application.key,
                    Secret: application.secret,
                    Host: cluster.attributes.hostname,
                },
            },
        };
    }

    async postDeploy() {
        const cluster = await websockets.clusters.find(await this.name());
        const allowedOrigins = await this.provider.getStackOutput(
            this.allowedOriginsOutput,
        );

        await websockets.applications.update(cluster, {
            allowed_origins: allowedOrigins?.split(','),
            ping_interval: this.configuration.pingInterval,
            activity_timeout: this.configuration.activityTimeout,
        });
    }

    async preRemove() {
        const cluster = await websockets.clusters.find(await this.name());

        if (cluster !== undefined) {
            await websockets.clusters.delete(cluster);
        }
    }

    outputs() {
        return {};
    }

    extend() {
        return {};
    }

    private async name() {
        const { stackName, region } = this.provider;
        const accountId = await LaravelCloudReverb.serverless
            .getProvider('aws')
            .getAccountId();

        return ensureNameMaxLength(
            `${stackName}-${this.node.id}-${region}-${accountId}`.toLowerCase(),
            40,
        );
    }
}
