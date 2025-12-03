import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    deviceSN: {
        type: String,
        required: true,
        index: true
    },
    empId: {
        type: String,
        required: true,
        index: true
    },
    raw: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    time: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        default: null
    },
    verify: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound index for common queries
AttendanceSchema.index({ deviceSN: 1, time: -1 });
AttendanceSchema.index({ empId: 1, time: -1 });
AttendanceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // Optional: TTL index for 1 year retention

export default mongoose.model('Attendance', AttendanceSchema);


