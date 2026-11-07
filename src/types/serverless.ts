export type Serverless = {
    configurationInput: Record<string, unknown>;
    getProvider: (name: 'aws') => { getAccountId: () => Promise<string> };
    extendConfiguration: (
        configurationPathKeys: string[],
        value: unknown,
    ) => void;
    service: {
        provider: {
            compiledCloudFormationTemplate: {
                Mappings?: Record<string, unknown>;
            };
            environment?: Record<string, unknown>;
            iam?: {
                role?:
                    | string
                    | {
                          managedPolicies?: (string | object)[];
                          statements?: object[];
                      };
            };
            iamManagedPolicies?: (string | object)[];
            iamRoleStatements?: object[];
        };
    };
};
