const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// An announcement broadcast by an admin, or a system alert raised for admins.
const notificationSchema = new Schema({
    title: {
        type: String,
        trim: true
    },
    // 'all' is seen by everyone, 'admin' only by admin accounts.
    audience: {
        type: String,
        enum: ['all', 'admin'],
        default: 'all',
        index: true
    },
    // Where the notification came from, used for the label in the bell.
    type: {
        type: String,
        enum: ['announcement', 'new_user'],
        default: 'announcement'
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdByName: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
