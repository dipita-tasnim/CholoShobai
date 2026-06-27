const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Records administrative actions for accountability and review.
const auditLogSchema = new Schema({
    action: {
        type: String,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    performedByName: {
        type: String
    },
    targetType: {
        type: String,
        enum: ['user', 'ride', 'rating'],
        required: true
    },
    targetId: {
        type: String
    },
    details: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
