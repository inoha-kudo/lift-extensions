export type Serverless = {
    configurationInput: Record<string, unknown>;
    extendConfiguration: (
        configurationPathKeys: string[],
        value: unknown,
    ) => void;
    service: {
        provider: {
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
