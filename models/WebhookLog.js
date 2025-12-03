import mongoose from 'mongoose';

const WebhookLogSchema = new mongoose.Schema({
    webhookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Webhook',
        required: true
    },
    url: {
        type: String,
        required: true
    },
    event: {
        type: String,
        required: true
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    statusCode: {
        type: Number,
        default: null
    },
    response: {
        type: String,
        default: null
    },
    retries: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    processedAt: {
        type: Date,
        default: null
    }
});

WebhookLogSchema.index({ webhookId: 1, createdAt: -1 });
WebhookLogSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('WebhookLog', WebhookLogSchema);


