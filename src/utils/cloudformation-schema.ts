import type { CollectionTag, ScalarTag } from 'yaml';

const FUNCTION_NAMES = [
    'And',
    'Base64',
    'Cidr',
    'Condition',
    'Equals',
    'FindInMap',
    'GetAtt',
    'GetAZs',
    'GetStackOutput',
    'If',
    'ImportValue',
    'Join',
    'Not',
    'Or',
    'Ref',
    'Select',
    'Split',
    'Sub',
    'Transform',
];

export const cloudformationTags = FUNCTION_NAMES.flatMap(
    (name): [ScalarTag, CollectionTag, CollectionTag] => {
        const functionName = ['Ref', 'Condition'].includes(name)
            ? name
            : `Fn::${name}`;

        return [
            {
                tag: `!${name}`,
                resolve: (value) => {
                    if (name === 'GetAtt') {
                        const [first, ...tail] = value.split('.');

                        return { [functionName]: [first, tail.join('.')] };
                    }

                    return { [functionName]: value };
                },
            },
            {
                tag: `!${name}`,
                collection: 'seq',
                resolve: (value) => ({ [functionName]: value.toJSON() }),
            },
            {
                tag: `!${name}`,
                collection: 'map',
                resolve: (value) => ({ [functionName]: value.toJSON() }),
            },
        ];
    },
);
