const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        length: 4
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Student', studentSchema);

