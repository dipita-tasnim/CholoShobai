const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authUser } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

// All admin routes require authentication and admin role
router.use(authUser);
router.use(isAdmin);

// Dashboard overview stats
router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId/detail', adminController.getUserDetail);
router.delete('/users/:userId', adminController.deleteUser);
router.put('/users/:userId/make-admin', adminController.makeAdmin);
router.put('/users/:userId/remove-admin', adminController.removeAdmin);
router.put('/users/:userId/status', adminController.updateUserStatus);

// Rides
router.get('/rides', adminController.getAllRides);
router.put('/rides/:rideId/status', adminController.updateRideStatus);
router.delete('/rides/:rideId', adminController.deleteRide);

// Ratings
router.get('/ratings', adminController.getAllRatings);
router.delete('/ratings/:ratingId', adminController.deleteRating);

// Audit log
router.get('/audit', adminController.getAuditLogs);

// Notifications (global announcements)
router.post('/notifications', adminController.createNotification);
router.get('/notifications', adminController.getNotifications);
router.delete('/notifications/:id', adminController.deleteNotification);

module.exports = router;
