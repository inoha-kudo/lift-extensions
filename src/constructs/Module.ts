import { readFileSync } from 'node:fs';
import { createDefu } from 'defu';
import { parse } from 'yaml';
import type { Serverless } from '../types/serverless';

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

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const defu = createDefu((obj, key, value) => {
    if (Array.isArray(obj[key]) && Array.isArray(value)) {
        obj[key] = value;

        return true;
    }
});

export class Module {
    public static type = 'module';
    public static schema = MODULE_DEFINITION;

    static initialize({ configurationInput: config }: Serverless) {
        const constructs = config.constructs;

        if (!isRecord(constructs)) {
            return;
        }

        for (const [id, construct] of Object.entries(constructs)) {
            if (!isRecord(construct) || construct.type !== this.type) {
                continue;
            }

            const moduleConfig = parse(
                readFileSync(String(construct.path), 'utf-8'),
            );

            if (!isRecord(moduleConfig)) {
                continue;
            }

            const overrides = isRecord(construct.overrides)
                ? construct.overrides
                : {};

            Object.assign(config, defu(overrides, config, moduleConfig));

            delete constructs[id];
        }
    }

    static create() {
        return {};
    }
}
