import { join } from 'node:path';
import { Module } from './Module';

const XRAY_TRACING_DEFINITION = {
    type: 'object',
    properties: {
        type: { const: 'xray-tracing' },
        overrides: { type: 'object' },
    },
    additionalProperties: false,
} as const;

export class XRayTracing extends Module {
    public static override type = 'xray-tracing';
    public static override schema = XRAY_TRACING_DEFINITION;

    protected static override path = join(
        import.meta.dirname,
        '../modules/xray-tracing.yml',
    );
}
