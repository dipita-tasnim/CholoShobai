const userModel = require('../models/user.model');
const Rating = require('../models/ratingModel');
const Ride = require('../models/rideModel');
const mongoose = require('mongoose');

// Get all user information for admin dashboard
exports.getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
};

// Get all ratings for admin to review
exports.getAllRatings = async (req, res) => {
    try {
        const ratings = await Rating.find()
            .populate('ratedUserId', 'fullname.firstname fullname.lastname email')
            .populate('raterUserId', 'fullname.firstname fullname.lastname email')
            .sort({ createdAt: -1 });
        
        res.status(200).json(ratings);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch ratings", error: error.message });
    }
};

// Delete a user and all associated data (ratings, rides)
exports.deleteUser = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent deleting an admin user
        if (user.role === 'admin') {
            return res.status(403).json({ message: "Cannot delete admin users" });
        }

        // Delete all ratings given by this user
        await Rating.deleteMany({ raterUserId: userId }, { session });
        
        // Delete all ratings received by this user
        await Rating.deleteMany({ ratedUserId: userId }, { session });
        
        // Delete all rides created by this user
        await Ride.deleteMany({ user_id: userId }, { session });
        
        // Delete the user
        await userModel.findByIdAndDelete(userId, { session });
        
        await session.commitTransaction();
        
        res.status(200).json({ message: "User and all associated data deleted successfully" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Failed to delete user", error: error.message });
    } finally {
        session.endSession();
    }
};

// Delete a specific rating
exports.deleteRating = async (req, res) => {
    try {
        const { ratingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(ratingId)) {
            return res.status(400).json({ message: "Invalid rating ID" });
        }

        const rating = await Rating.findByIdAndDelete(ratingId);
        
        if (!rating) {
            return res.status(404).json({ message: "Rating not found" });
        }

        res.status(200).json({ message: "Rating deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete rating", error: error.message });
    }
};

// Make a user an admin
exports.makeAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { role: 'admin' },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User promoted to admin successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Failed to update user role", error: error.message });
    }
};

// Remove admin privileges
exports.removeAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { role: 'user' },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Admin privileges removed", user });
    } catch (error) {
        res.status(500).json({ message: "Failed to update user role", error: error.message });
    }
};