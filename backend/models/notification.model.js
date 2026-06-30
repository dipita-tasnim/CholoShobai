const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// A global announcement broadcast by an admin to all users.
const notificationSchema = new Schema({
    title: {
        type: String,
        trim: true
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
