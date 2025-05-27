const express = require('express');
const {
    createRating,
    getUserRatings,
    deleteRating
} = require('../controllers/ratingController');
const { authUser } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authUser);

// Create a rating
router.post('/', createRating);

// Get ratings for a specific user
router.get('/user/:userId', getUserRatings);

// Delete a rating
router.delete('/:id', deleteRating);

module.exports = router;