import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
    sn: { 
        type: String, 
        required: true, 
        unique: true,
        index: true
    },
    name: {
        type: String,
        default: ''
    },
    ip: {
        type: String,
        default: ''
    },
    port: {
        type: Number,
        default: 80
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    public: {
        type: Boolean,
        default: false
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

// Update updatedAt on save
DeviceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Device', DeviceSchema);


