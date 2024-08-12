export default {
    type: 'object',
    properties: {
        _id: {type: 'string'},
        pair: {type: 'string'},
        displayName: {type: 'string'},
        additionalProperties: false,
    },
    required: ['pair', 'displayName'],
}