const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        index: true
    },
    studentName: {
        type: String,
        required: true
    },
    deviceSN: {
        type: String,
        required: true
    },
    dateTime: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        default: 'Check In'
    },
    verifyMode: {
        type: String,
        default: 'Unknown'
    },
    rawData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
attendanceSchema.index({ studentId: 1, dateTime: -1 });
attendanceSchema.index({ dateTime: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

