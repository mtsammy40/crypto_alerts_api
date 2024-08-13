export default {
    type: 'object',
    properties: {
        pair: {type: 'string'},
        type: {type: 'string', enum: ['gt_price', 'lt_price']},
        price: {
            type: 'object',
            properties: {
                current: {type: 'number'},
                value: {type: 'number'},
            },
        },
        notification: {
            type: 'object',
            properties: {
                channel: {type: 'string', enum: ['email']},
                address: {type: 'string'},
            },
        },
    },
    required: ['pair', 'type', 'price', 'notification'],
    additionalProperties: false,
}