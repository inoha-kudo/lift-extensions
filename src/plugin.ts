import { AwsProvider } from 'serverless-lift/dist/src/providers/AwsProvider.js';
import {
    FunctionRole,
    LaravelDsql,
    LaravelDynamoDbCache,
    LaravelWebsockets,
    Module,
    XRayTracing,
} from './constructs';
import type { Serverless } from './types/serverless';

export default class LiftExtensionsPlugin {
    constructor(serverless: Serverless) {
        AwsProvider.registerConstructs(
            FunctionRole,
            LaravelDsql,
            LaravelDynamoDbCache,
            LaravelWebsockets,
            Module,
            XRayTracing,
        );

        for (const providerClass of AwsProvider.getAllConstructClasses()) {
            providerClass.initialize?.(serverless);
        }
    }
}
