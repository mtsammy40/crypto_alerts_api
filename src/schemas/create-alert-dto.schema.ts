export default {
    type: 'object',
    properties: {
        pair: {type: 'string'},
        type: {type: 'string', enum: ['gt_price']},
        price: {
            type: 'object',
            properties: {
                current: {type: 'integer'},
                value: {type: 'integer'},
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