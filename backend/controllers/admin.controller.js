const userModel = require('../models/user.model');
const Rating = require('../models/ratingModel');
const Ride = require('../models/rideModel');
const Message = require('../models/Message');
const AuditLog = require('../models/auditLog.model');
const Notification = require('../models/notification.model');
const { sendBroadcastEmail } = require('../services/mail.service');
const mongoose = require('mongoose');

// Record an administrative action. Failures here must never break the main action.
const logAction = async (req, action, targetType, targetId, details) => {
    try {
        await AuditLog.create({
            action,
            performedBy: req.user._id,
            performedByName: req.user.fullname
                ? `${req.user.fullname.firstname} ${req.user.fullname.lastname || ''}`.trim()
                : undefined,
            targetType,
            targetId: targetId ? String(targetId) : undefined,
            details
        });
    } catch (err) {
        console.error('Failed to write audit log:', err.message);
    }
};

// Dashboard overview: aggregated counts, recent activity and top routes.
exports.getStats = async (req, res) => {
    try {
        const since = new Date();
        since.setDate(since.getDate() - 6);
        since.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            totalAdmins,
            flaggedUsers,
            totalRides,
            openRides,
            closedRides,
            totalRatings,
            totalMessages,
            avgAgg,
            ratingDistAgg,
            ridesByDayAgg,
            topRoutesAgg
        ] = await Promise.all([
            userModel.countDocuments(),
            userModel.countDocuments({ role: 'admin' }),
            userModel.countDocuments({ status: { $in: ['suspended', 'banned'] } }),
            Ride.countDocuments(),
            Ride.countDocuments({ status: 'open' }),
            Ride.countDocuments({ status: 'closed' }),
            Rating.countDocuments(),
            Message.countDocuments(),
            Rating.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
            Rating.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }]),
            Ride.aggregate([
                { $match: { createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Ride.aggregate([
                { $group: { _id: { from: '$startingPoint', to: '$destination' }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        // Build a continuous 7 day series so the chart has no gaps.
        const dayCounts = {};
        ridesByDayAgg.forEach(d => { dayCounts[d._id] = d.count; });
        const ridesLast7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            ridesLast7Days.push({ date: key, count: dayCounts[key] || 0 });
        }

        // Rating distribution as a fixed 1..5 array.
        const distMap = {};
        ratingDistAgg.forEach(r => { distMap[r._id] = r.count; });
        const ratingDistribution = [1, 2, 3, 4, 5].map(score => ({
            score,
            count: distMap[score] || 0
        }));

        const topRoutes = topRoutesAgg.map(r => ({
            from: r._id.from,
            to: r._id.to,
            count: r.count
        }));

        res.status(200).json({
            totalUsers,
            totalAdmins,
            flaggedUsers,
            totalRides,
            openRides,
            closedRides,
            totalRatings,
            totalMessages,
            averageRating: avgAgg.length ? Number(avgAgg[0].avg.toFixed(2)) : 0,
            ratingDistribution,
            ridesLast7Days,
            topRoutes
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
};

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

// Get all rides with owner details and joined counts
exports.getAllRides = async (req, res) => {
    try {
        const rides = await Ride.find()
            .populate('user_id', 'fullname.firstname fullname.lastname email')
            .sort({ createdAt: -1 })
            .lean();

        const shaped = rides.map(r => ({
            ...r,
            joinedCount: Array.isArray(r.joinedUserIds) ? r.joinedUserIds.length : 0,
            confirmedCount: Array.isArray(r.joinedUserIds)
                ? r.joinedUserIds.filter(j => j.status === 'confirmed').length
                : 0
        }));

        res.status(200).json(shaped);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch rides", error: error.message });
    }
};

// Full profile of a single user: their rides and ratings.
exports.getUserDetail = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const [rides, ratingsReceived, ratingsGiven] = await Promise.all([
            Ride.find({ user_id: userId }).sort({ createdAt: -1 }).lean(),
            Rating.find({ ratedUserId: userId })
                .populate('raterUserId', 'fullname.firstname fullname.lastname')
                .sort({ createdAt: -1 }),
            Rating.find({ raterUserId: userId })
                .populate('ratedUserId', 'fullname.firstname fullname.lastname')
                .sort({ createdAt: -1 })
        ]);

        const avgRating = ratingsReceived.length
            ? Number((ratingsReceived.reduce((s, r) => s + r.rating, 0) / ratingsReceived.length).toFixed(2))
            : 0;

        res.status(200).json({
            user,
            rides,
            ratingsReceived,
            ratingsGiven,
            stats: {
                ridesCreated: rides.length,
                ratingsReceived: ratingsReceived.length,
                ratingsGiven: ratingsGiven.length,
                averageRating: avgRating
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user detail", error: error.message });
    }
};

// Delete a user and all associated data (ratings, rides)
exports.deleteUser = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === 'admin') {
            await session.abortTransaction();
            return res.status(403).json({ message: "Cannot delete admin users" });
        }

        await Rating.deleteMany({ raterUserId: userId }, { session });
        await Rating.deleteMany({ ratedUserId: userId }, { session });
        await Ride.deleteMany({ user_id: userId }, { session });
        await userModel.findByIdAndDelete(userId, { session });

        await session.commitTransaction();

        await logAction(req, 'Deleted user', 'user', userId,
            `${user.fullname.firstname} ${user.fullname.lastname || ''}`.trim());

        res.status(200).json({ message: "User and all associated data deleted successfully" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Failed to delete user", error: error.message });
    } finally {
        session.endSession();
    }
};

// Suspend, ban or reactivate a user
exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        if (!['active', 'suspended', 'banned'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const target = await userModel.findById(userId);
        if (!target) {
            return res.status(404).json({ message: "User not found" });
        }
        if (target.role === 'admin') {
            return res.status(403).json({ message: "Cannot change status of admin users" });
        }

        target.status = status;
        await target.save();

        await logAction(req, `Set user status to ${status}`, 'user', userId,
            `${target.fullname.firstname} ${target.fullname.lastname || ''}`.trim());

        const safe = target.toObject();
        delete safe.password;
        res.status(200).json({ message: `User status updated to ${status}`, user: safe });
    } catch (error) {
        res.status(500).json({ message: "Failed to update user status", error: error.message });
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

        await logAction(req, 'Deleted rating', 'rating', ratingId,
            `Score ${rating.rating}`);

        res.status(200).json({ message: "Rating deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete rating", error: error.message });
    }
};

// Open or close a ride
exports.updateRideStatus = async (req, res) => {
    try {
        const { rideId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(rideId)) {
            return res.status(400).json({ message: "Invalid ride ID" });
        }
        if (!['open', 'closed'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const ride = await Ride.findByIdAndUpdate(rideId, { status }, { new: true });
        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }

        await logAction(req, `Set ride status to ${status}`, 'ride', rideId,
            `${ride.startingPoint} to ${ride.destination}`);

        res.status(200).json({ message: `Ride ${status}`, ride });
    } catch (error) {
        res.status(500).json({ message: "Failed to update ride status", error: error.message });
    }
};

// Delete a ride and its chat messages
exports.deleteRide = async (req, res) => {
    try {
        const { rideId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(rideId)) {
            return res.status(400).json({ message: "Invalid ride ID" });
        }

        const ride = await Ride.findByIdAndDelete(rideId);
        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }

        await Message.deleteMany({ ride: rideId });

        await logAction(req, 'Deleted ride', 'ride', rideId,
            `${ride.startingPoint} to ${ride.destination}`);

        res.status(200).json({ message: "Ride and its messages deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete ride", error: error.message });
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

        await logAction(req, 'Promoted user to admin', 'user', userId,
            `${user.fullname.firstname} ${user.fullname.lastname || ''}`.trim());

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

        await logAction(req, 'Removed admin privileges', 'user', userId,
            `${user.fullname.firstname} ${user.fullname.lastname || ''}`.trim());

        res.status(200).json({ message: "Admin privileges removed", user });
    } catch (error) {
        res.status(500).json({ message: "Failed to update user role", error: error.message });
    }
};

// Recent administrative actions
exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch audit logs", error: error.message });
    }
};

// Send a global announcement to all users (in-app, optionally by email too)
exports.createNotification = async (req, res) => {
    try {
        const { title, message, sendEmail } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message is required" });
        }

        const notification = await Notification.create({
            title: title ? title.trim() : undefined,
            message: message.trim(),
            createdBy: req.user._id,
            createdByName: req.user.fullname
                ? `${req.user.fullname.firstname} ${req.user.fullname.lastname || ''}`.trim()
                : undefined
        });

        await logAction(req, 'Sent notification', 'user', notification._id, (title || message).slice(0, 60));

        let emailResult = null;
        if (sendEmail) {
            const users = await userModel.find({ status: { $ne: 'banned' } }).select('email');
            const recipients = users.map((u) => u.email).filter(Boolean);
            try {
                emailResult = await sendBroadcastEmail(recipients, title, message.trim());
            } catch (err) {
                console.error('Broadcast email error:', err.message);
                emailResult = { error: err.message };
            }
        }

        res.status(201).json({ notification, emailResult });
    } catch (error) {
        res.status(500).json({ message: "Failed to send notification", error: error.message });
    }
};

// All notifications (for admin management)
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid notification ID" });
        }
        const notification = await Notification.findByIdAndDelete(id);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        await logAction(req, 'Deleted notification', 'user', id, (notification.title || notification.message).slice(0, 60));
        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete notification", error: error.message });
    }
};
