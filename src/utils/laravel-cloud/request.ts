import ServerlessError from 'serverless-lift/dist/src/utils/error.js';

const apiToken = () => {
    const token = process.env.LARAVEL_CLOUD_API_TOKEN;

    if (!token) {
        throw new ServerlessError(
            'No Laravel Cloud API token was found. Set the LARAVEL_CLOUD_API_TOKEN environment variable.',
            'LIFT_INVALID_CONSTRUCT_CONFIGURATION',
        );
    }

    return token;
};

const messageOf = (text: string) => {
    try {
        return JSON.parse(text).message;
    } catch {
        return undefined;
    }
};

export const request = async (method: string, path: string, body?: object) => {
    for (let attempt = 1; ; attempt++) {
        const response = await fetch(`https://cloud.laravel.com/api${path}`, {
            method,
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${apiToken()}`,
                'Content-Type': 'application/json',
            },
            body: body && JSON.stringify(body),
            redirect: 'manual',
        });

        if (response.ok) {
            return response.status === 204
                ? undefined
                : (await response.json()).data;
        }

        const text = await response.text();

        if (!text.includes('already in progress') || attempt === 10) {
            const message = messageOf(text);

            throw new ServerlessError(
                `Laravel Cloud ${method} ${path} failed with HTTP ${response.status}${message ? `: ${message}` : ''}`,
                'LIFT_LARAVEL_CLOUD_REQUEST_FAILED',
            );
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
};
