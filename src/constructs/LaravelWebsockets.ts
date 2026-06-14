import { join } from 'node:path';
import { Module } from './Module';

const LARAVEL_WEBSOCKETS_DEFINITION = {
    type: 'object',
    properties: {
        type: { const: 'laravel-websockets' },
        overrides: { type: 'object' },
    },
    additionalProperties: false,
} as const;

export class LaravelWebsockets extends Module {
    public static override type = 'laravel-websockets';
    public static override schema = LARAVEL_WEBSOCKETS_DEFINITION;

    protected static override path = join(
        import.meta.dirname,
        '../modules/laravel-websockets.yml',
    );
}
