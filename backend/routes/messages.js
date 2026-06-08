const express = require('express');
const { getMessagesForRide, createMessage } = require('../controllers/messageController'); // We will create this controller
const { authUser } = require('../middlewares/auth.middleware');
const Ride = require('../models/rideModel'); // Your existing Ride model

const router = express.Router();

router.use(authUser); // All message routes require authentication

// GET messages for a specific ride
router.get('/:rideId', getMessagesForRide);

// POST a new message (although we are using sockets for this, having an HTTP endpoint can be useful)
// router.post('/', createMessage);

module.exports = router; 