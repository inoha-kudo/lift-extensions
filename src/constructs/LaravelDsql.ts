import { join } from 'node:path';
import { Module } from './Module';

const LARAVEL_DSQL_DEFINITION = {
    type: 'object',
    properties: {
        type: { const: 'laravel-dsql' },
        overrides: { type: 'object' },
    },
    additionalProperties: false,
} as const;

export class LaravelDsql extends Module {
    public static override type = 'laravel-dsql';
    public static override schema = LARAVEL_DSQL_DEFINITION;

    protected static override path = join(
        import.meta.dirname,
        '../modules/laravel-dsql.yml',
    );
}
