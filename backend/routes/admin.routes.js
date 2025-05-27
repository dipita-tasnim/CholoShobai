const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authUser } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

// All admin routes require authentication and admin role
router.use(authUser);
router.use(isAdmin);

// Get all users
router.get('/users', adminController.getAllUsers);

// Get all ratings
router.get('/ratings', adminController.getAllRatings);

// Delete a user
router.delete('/users/:userId', adminController.deleteUser);

// Delete a rating
router.delete('/ratings/:ratingId', adminController.deleteRating);

// Make a user an admin
router.put('/users/:userId/make-admin', adminController.makeAdmin);

// Remove admin privileges
router.put('/users/:userId/remove-admin', adminController.removeAdmin);

module.exports = router;