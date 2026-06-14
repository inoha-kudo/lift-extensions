import { AwsProvider } from 'serverless-lift/dist/src/providers/AwsProvider.js';
import { FunctionRole, Module } from './constructs';
import type { Serverless } from './types/serverless';

export default class LiftExtensionsPlugin {
    constructor(serverless: Serverless) {
        AwsProvider.registerConstructs(FunctionRole, Module);

        for (const providerClass of AwsProvider.getAllConstructClasses()) {
            providerClass.initialize?.(serverless);
        }
    }
}
