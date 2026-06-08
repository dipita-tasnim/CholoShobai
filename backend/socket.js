const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const Message = require('./models/Message'); // Our new Message model
const User = require('./models/user.model'); // Your existing User model
const Ride = require('./models/rideModel'); // Your existing Ride model

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Or your frontend origin
            methods: ["GET", "POST"]
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        connectTimeout: 10000,
        transports: ['websocket', 'polling']
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token; // Assuming token is sent in auth header
        if (!token) {
            console.error('Socket authentication error: No token provided');
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded._id);
            if (!user) {
                console.error('Socket authentication error: User not found for id', decoded._id);
                return next(new Error('Authentication error: User not found'));
            }
            socket.user = user;
            console.log(`Socket authenticated successfully for user: ${user._id} (${user.email})`);
            next();
        } catch (err) {
            console.error('Socket authentication error:', err.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.email}`);

        // Handle reconnection
        socket.on('reconnect', (attemptNumber) => {
            console.log(`User ${socket.user.email} reconnected after ${attemptNumber} attempts`);
        });

        // Join a ride-specific chat room
        socket.on('joinRideChat', (rideId) => {
            console.log(`User ${socket.user.email} joining ride chat: ${rideId}`);
            socket.join(rideId);
        });

        socket.on('leaveRideChat', (rideId) => {
            console.log(`User ${socket.user.email} leaving ride chat: ${rideId}`);
            socket.leave(rideId);
        });

        // Handle new messages
        socket.on('sendMessage', async ({ rideId, content }) => {
            console.log(`Received sendMessage event for ride: ${rideId}`);
            const token = socket.handshake.auth.token;
            if (!token) {
                console.error('sendMessage error: No token provided with message');
                return socket.emit('messageError', 'Authentication token missing.');
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const senderUser = await User.findById(decoded._id);
                if (!senderUser) {
                    console.error('sendMessage error: User not found for id from token', decoded._id);
                    return socket.emit('messageError', 'Authenticated user not found.');
                }
                 console.log(`Message sender identified as: ${senderUser._id} (${senderUser.email})`);

                if (!rideId || !content) {
                    return socket.emit('messageError', 'Ride ID and content are required.');
                }

                // Fetch ride details to check participation status
                const ride = await Ride.findById(rideId);
                if (!ride) {
                    console.error('sendMessage error: Ride not found for id', rideId);
                    return socket.emit('messageError', 'Ride not found.');
                }

                const userId = senderUser._id; // Use the re-verified user ID

                // Check if the user is the ride owner or a confirmed participant
                const isRideOwner = ride.user_id && ride.user_id.toString() === userId.toString();
                const isConfirmedParticipant = ride.joinedUserIds.some(participant =>
                    // Ensure participant.user exists and match IDs
                    participant.user && participant.user.toString() === userId.toString() && participant.status === 'confirmed'
                );

                if (!isRideOwner && !isConfirmedParticipant) {
                     console.warn(`sendMessage unauthorized: User ${userId} is not owner or confirmed participant for ride ${rideId}`);
                    return socket.emit('messageError', 'Not authorized to send messages to this ride chat.');
                }

                // User is authorized, create and save the message
                const message = new Message({
                    ride: rideId,
                    sender: userId, // Save with the correct sender ID
                    content: content,
                });

                await message.save();
                console.log('Message saved with ID:', message._id);

                // Populate sender info with a fresh query
                const populatedMessage = await Message.findById(message._id)
                    .populate({
                        path: 'sender',
                        select: 'fullname email',
                        model: 'User'
                    });

                if (!populatedMessage || !populatedMessage.sender) {
                    console.error('Failed to populate message sender information');
                    return socket.emit('messageError', 'Failed to process message');
                }

                // Log the populated message for debugging
                console.log('Populated message before formatting:', populatedMessage);

                // Ensure the sender object has the correct structure
                const formattedMessage = {
                    ...populatedMessage.toObject(),
                    sender: {
                        _id: populatedMessage.sender._id,
                        email: populatedMessage.sender.email,
                        fullname: {
                            firstname: populatedMessage.sender.fullname.firstname,
                            lastname: populatedMessage.sender.fullname.lastname
                        }
                    }
                };

                // Log the formatted message for debugging
                console.log('Formatted message to be emitted:', formattedMessage);

                // Emit the message to all users in the ride's chat room
                io.to(rideId).emit('receiveMessage', formattedMessage);
                console.log(`Message emitted to ride room ${rideId}`);

            } catch (error) {
                console.error('Error handling sendMessage event:', error);
                socket.emit('messageError', 'Failed to process message');
            }
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`User ${socket.user.email} disconnected. Reason: ${reason}`);
        });

        socket.on('error', (error) => {
            console.error(`Socket error for user ${socket.user.email}:`, error);
        });
    });
};

const getIo = () => io;

module.exports = { initializeSocket, getIo }; 