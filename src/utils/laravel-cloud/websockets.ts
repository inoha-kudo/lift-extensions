import { request } from './request';

type Cluster = {
    id: string;
    relationships: { applications: { data: { id: string }[] } };
};

const applicationPath = (cluster: Cluster) =>
    `/websocket-applications/${cluster.relationships.applications.data[0].id}`;

export const websockets = {
    clusters: {
        find: async (name: string) => {
            for (let page = 1; ; page++) {
                const candidates = await request(
                    'GET',
                    `/websocket-servers?include=applications&page=${page}`,
                );
                const cluster = candidates.find(
                    (candidate: { attributes: { name: string } }) =>
                        candidate.attributes.name === name,
                );

                if (cluster !== undefined || candidates.length === 0) {
                    return cluster;
                }
            }
        },
        create: (attributes: object) =>
            request('POST', '/websocket-servers?include=applications', {
                type: 'reverb',
                ...attributes,
            }),
        update: (cluster: Cluster, attributes: object) =>
            request('PATCH', `/websocket-servers/${cluster.id}`, attributes),
        delete: (cluster: Cluster) =>
            request('DELETE', `/websocket-servers/${cluster.id}`),
    },
    applications: {
        get: (cluster: Cluster) => request('GET', applicationPath(cluster)),
        update: (cluster: Cluster, attributes: object) =>
            request('PATCH', applicationPath(cluster), attributes),
    },
};
