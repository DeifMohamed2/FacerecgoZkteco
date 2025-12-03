import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        index: true
    },
    resource: {
        type: String,
        required: true
    },
    resourceId: {
        type: String,
        default: null
    },
    userId: {
        type: String,
        default: null
    },
    ip: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', AuditLogSchema);


