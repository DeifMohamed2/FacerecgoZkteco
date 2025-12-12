const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        required: true,
        unique: true
    },
    deviceName: {
        type: String,
        default: 'Unknown Device'
    },
    ipAddress: {
        type: String
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    pendingCommands: [{
        command: String,
        data: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Device', deviceSchema);

