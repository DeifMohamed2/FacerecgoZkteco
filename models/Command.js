import mongoose from 'mongoose';

const CommandSchema = new mongoose.Schema({
    deviceSN: {
        type: String,
        required: true,
        index: true
    },
    command: {
        type: String,
        required: true
    },
    args: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    processed: {
        type: Boolean,
        default: false,
        index: true
    },
    processedAt: {
        type: Date,
        default: null
    },
    response: {
        type: String,
        default: null
    }
});

// Compound index for efficient querying
CommandSchema.index({ deviceSN: 1, processed: 1, createdAt: 1 });

export default mongoose.model('Command', CommandSchema);


