export default {
    type: 'object',
    properties: {
        id: { type: 'string', nullable: true },
        pair: { type: 'string' },
        status: { type: 'string', enum: ['active', 'triggered', 'cancelled'] },
        type: { type: 'string', enum: ['gt_price', 'lt_price'] },
        price: {
            type: 'object',
            properties: {
                currency: {type: 'number'},
                value: {type: 'number'},
                at_trigger: {type: 'number'},
            },
        },
        notification: {
            type: 'object',
            properties: {
                channel: {type: 'string', enum: ['email']},
                address: {type: 'string'},
                subscriber_id: {type: 'string'},
            },
        },
        created_at: { type: 'string', nullable: false },
        additionalProperties: false,
    },
    required: ['pair', 'status', 'type','price','notification', 'created_at'],
}