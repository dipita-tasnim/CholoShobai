const Rating = require('../models/ratingModel');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Create a new rating
const createRating = async (req, res) => {
    try {
        const { ratedUserId, rating, comment } = req.body;
        const raterUserId = req.user._id;

        // Prevent users from rating themselves
        if (ratedUserId === raterUserId.toString()) {
            return res.status(400).json({ error: 'You cannot rate yourself' });
        }

        // Check if the rated user exists
        const userExists = await User.findById(ratedUserId);
        if (!userExists) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if rating already exists from this user
        const existingRating = await Rating.findOne({ ratedUserId, raterUserId });
        
        if (existingRating) {
            // Update existing rating
            existingRating.rating = rating;
            existingRating.comment = comment;
            await existingRating.save();
            return res.status(200).json(existingRating);
        }

        // Create new rating
        const newRating = await Rating.create({
            ratedUserId,
            raterUserId,
            rating,
            comment
        });

        res.status(201).json(newRating);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get ratings for a specific user
const getUserRatings = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(404).json({ error: 'Invalid user ID' });
        }

        const ratings = await Rating.find({ ratedUserId: userId })
            .populate('raterUserId', 'fullname.firstname fullname.lastname')
            .sort({ createdAt: -1 });

        // Calculate average rating
        let averageRating = 0;
        if (ratings.length > 0) {
            const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
            averageRating = sum / ratings.length;
        }

        res.status(200).json({
            ratings,
            averageRating: parseFloat(averageRating.toFixed(1)),
            count: ratings.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a rating (only the rater can delete their own rating)
const deleteRating = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Invalid rating ID' });
        }

        const rating = await Rating.findById(id);

        if (!rating) {
            return res.status(404).json({ error: 'Rating not found' });
        }

        // Check if user is authorized to delete this rating
        if (rating.raterUserId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this rating' });
        }

        await Rating.findByIdAndDelete(id);
        res.status(200).json({ message: 'Rating deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createRating,
    getUserRatings,
    deleteRating
};