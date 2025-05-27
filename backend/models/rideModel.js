const mongoose = require('mongoose');

const Schema = mongoose.Schema

const rideSchema = new Schema({
    startingPoint: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    availableSlots: {
        type: String,
        required: true
    },
    preference: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["open", "closed"],
        default: "closed"
    },

    user_id: { // renamed from createdBy to match controller
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    joinedUserIds: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
        }
    ],

}, { timestamps: true }) //timestamps should be included as second argumnt for taking the updated data by time


module.exports = mongoose.model('Ride', rideSchema)

