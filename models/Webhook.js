import mongoose from 'mongoose';

const WebhookSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    events: [{
        type: String,
        enum: ['attendance', 'device_status', 'user_enrolled']
    }],
    secret: {
        type: String,
        default: ''
    },
    active: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

WebhookSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Webhook', WebhookSchema);


