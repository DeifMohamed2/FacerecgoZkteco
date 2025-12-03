import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        default: ''
    },
    cardNo: {
        type: String,
        default: '',
        index: true
    },
    faceTemplateId: {
        type: String,
        default: ''
    },
    devices: [{
        type: String
    }],
    meta: {
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
UserSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('User', UserSchema);


