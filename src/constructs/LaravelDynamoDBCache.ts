import { join } from 'node:path';
import { Module } from './Module';

const LARAVEL_DYNAMODB_CACHE_DEFINITION = {
    type: 'object',
    properties: {
        type: { const: 'laravel-dynamodb-cache' },
        overrides: { type: 'object' },
    },
    additionalProperties: false,
} as const;

export class LaravelDynamoDBCache extends Module {
    public static override type = 'laravel-dynamodb-cache';
    public static override schema = LARAVEL_DYNAMODB_CACHE_DEFINITION;

    protected static override path = join(
        import.meta.dirname,
        '../modules/laravel-dynamodb-cache.yml',
    );
}
