const mongoose = require('mongoose');
const Message = require('../models/Message'); // Your Message model
const Ride = require('../models/rideModel'); // Your Ride model

// Get messages for a specific ride
const getMessagesForRide = async (req, res) => {
    const { rideId } = req.params;
    const userId = req.user._id; // Get user ID from authenticated user (set by authUser middleware)

    if (!mongoose.Types.ObjectId.isValid(rideId)) {
        return res.status(404).json({ message: 'Invalid ride ID' });
    }

    try {
        // Check if the authenticated user is a confirmed participant or the ride owner
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found.' });
        }

        // Assuming your rideModel.js has a joinedUserIds array with a 'user' field and 'status' field
        const isConfirmedParticipant = ride.joinedUserIds.some(participant =>
             participant.user && participant.user.toString() === userId.toString() && participant.status === 'confirmed'
        );

        // Also check if the user is the ride owner (ride.user_id)
        const isRideOwner = ride.user_id && ride.user_id.toString() === userId.toString();

        if (!isConfirmedParticipant && !isRideOwner) {
            return res.status(403).json({ message: 'Not authorized to view messages for this ride.' });
        }

        // Fetch messages if authorized
        const messages = await Message.find({ ride: rideId })
            .populate({
                path: 'sender',
                select: 'fullname email',
                model: 'User'
            })
            .sort('timestamp');

        // Format messages to ensure consistent structure
        const formattedMessages = messages.map(message => ({
            ...message.toObject(),
            sender: {
                _id: message.sender._id,
                email: message.sender.email,
                fullname: {
                    firstname: message.sender.fullname.firstname,
                    lastname: message.sender.fullname.lastname
                }
            }
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

// Create a new message (This is primarily handled by sockets, but a controller function might be useful for consistency or future features)
// const createMessage = async (req, res) => { /* ... */ };

module.exports = { getMessagesForRide /*, createMessage */ }; 