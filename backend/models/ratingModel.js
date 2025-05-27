const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ratingSchema = new Schema({
    ratedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    raterUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 300
    }
}, { timestamps: true });

// Prevent duplicate ratings from the same user
ratingSchema.index({ ratedUserId: 1, raterUserId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);