const mongoose = require('mongoose');

// Stores a pending email verification code. Documents auto-expire after 10
// minutes via the TTL index on createdAt, so stale codes clean themselves up.
const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        index: true
    },
    otpHash: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // seconds (10 minutes)
    }
});

module.exports = mongoose.model('Otp', otpSchema);
