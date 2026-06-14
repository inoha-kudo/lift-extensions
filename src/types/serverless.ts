export type Serverless = {
    configurationInput: Record<string, unknown>;
    extendConfiguration: (
        configurationPathKeys: string[],
        value: unknown,
    ) => void;
    service: {
        provider: {
            iam?: { role?: string | { statements?: object[] } };
            iamRoleStatements?: object[];
        };
    };
};
