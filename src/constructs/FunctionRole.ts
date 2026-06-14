import type { CfnResource } from 'aws-cdk-lib';
import type { CfnRole } from 'aws-cdk-lib/aws-iam';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import type { Construct as CdkConstruct } from 'constructs';
import type { FromSchema } from 'json-schema-to-ts';
import { AwsConstruct } from 'serverless-lift/dist/src/constructs/abstracts/index.js';
import type { AwsProvider } from 'serverless-lift/dist/src/providers/index.js';
import ServerlessError from 'serverless-lift/dist/src/utils/error.js';

const FUNCTION_ROLE_DEFINITION = {
    type: 'object',
    properties: {
        type: { const: 'function-role' },
        function: { type: 'string' },
        statements: {
            type: 'array',
            items: { type: 'object' },
        },
    },
    required: ['function'],
    additionalProperties: false,
} as const;

type Configuration = FromSchema<typeof FUNCTION_ROLE_DEFINITION>;

export class FunctionRole extends AwsConstruct {
    public static type = 'function-role';
    public static schema = FUNCTION_ROLE_DEFINITION;

    private readonly role: Role;

    constructor(
        scope: CdkConstruct,
        id: string,
        configuration: Configuration,
        provider: AwsProvider,
    ) {
        super(scope, id);

        const slsFunction = provider.getFunction(configuration.function);

        if (!slsFunction) {
            throw new ServerlessError(
                `Invalid configuration in 'constructs.${id}': function '${configuration.function}' is not defined.`,
                'LIFT_INVALID_CONSTRUCT_CONFIGURATION',
            );
        }

        this.role = new Role(this, 'Role', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole',
                ),
            ],
        });

        if (configuration.statements?.length) {
            const cfnRole = this.role.node.defaultChild as CfnRole;
            cfnRole.addPropertyOverride('Policies', [
                {
                    PolicyName: 'InlinePolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: configuration.statements,
                    },
                },
            ]);
        }

        slsFunction.role = this.role.roleArn;
    }

    outputs(): Record<string, () => Promise<string | undefined>> {
        return {};
    }

    extend(): Record<string, CfnResource> {
        return {
            role: this.role.node.defaultChild as CfnRole,
        };
    }
}
