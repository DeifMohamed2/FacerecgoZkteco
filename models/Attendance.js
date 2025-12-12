const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        ref: 'Student'
    },
    studentName: {
        type: String,
        required: true
    },
    dateTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        default: 'Present'
    },
    verifyMethod: {
        type: String,
        default: 'N/A'
    },
    deviceSN: {
        type: String,
        default: 'Unknown'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
attendanceSchema.index({ studentId: 1, dateTime: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

