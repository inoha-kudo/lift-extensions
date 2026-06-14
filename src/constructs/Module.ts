import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createDefu } from 'defu';
import { parse } from 'yaml';
import type { Serverless } from '../types/serverless';
import { cloudformationTags } from '../utils/cloudformation-schema';

const MODULE_DEFINITION = {
    type: 'object',
    properties: {
        type: { const: 'module' },
        path: { type: 'string' },
        overrides: { type: 'object' },
    },
    required: ['path'],
    additionalProperties: false,
} as const;

type ConstructSchema = {
    type: 'object';
    [key: string]: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const replaceDefu = createDefu((obj, key, value) => {
    if (Array.isArray(obj[key]) && Array.isArray(value)) {
        obj[key] = value;

        return true;
    }
});

const defu = createDefu((obj, key, value, namespace) => {
    if (
        namespace === 'provider.iam.role' &&
        (key === 'managedPolicies' || key === 'statements')
    ) {
        return;
    }

    if (Array.isArray(obj[key]) && Array.isArray(value)) {
        obj[key] = value;

        return true;
    }
});

export class Module {
    public static type = 'module';
    public static schema: ConstructSchema = MODULE_DEFINITION;

    protected static path?: string;

    static initialize(serverless: Serverless) {
        const config = serverless.configurationInput;

        if (!isRecord(config.constructs)) {
            return;
        }

        for (const [id, construct] of Object.entries(config.constructs)) {
            if (!isRecord(construct) || construct.type !== this.type) {
                continue;
            }

            const path = this.path ?? String(construct.path);
            const file = statSync(path).isDirectory()
                ? join(path, 'index.yml')
                : path;

            const moduleConfig = parse(readFileSync(file, 'utf-8'), {
                customTags: cloudformationTags,
            });

            if (!isRecord(moduleConfig)) {
                continue;
            }

            const { [id]: _, ...constructs } = config.constructs;

            const merged = replaceDefu(
                isRecord(construct.overrides) ? construct.overrides : {},
                defu({ ...config, constructs }, moduleConfig),
            );

            for (const [key, value] of Object.entries(merged)) {
                serverless.extendConfiguration([key], value);
            }
        }
    }

    static create() {
        return {};
    }
}
