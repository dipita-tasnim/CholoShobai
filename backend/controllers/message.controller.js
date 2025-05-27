const Message = require('../models/message.model');
const User = require('../models/user.model');

// Get all conversations for the current user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get all unique users the current user has conversed with
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' }
                }
            }
        ]);

        // Get user details for each conversation
        const populatedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const user = await User.findById(conv._id).select('name email profilePicture');
                return {
                    user,
                    lastMessage: conv.lastMessage
                };
            })
        );

        res.json(populatedConversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const otherUserId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'name profilePicture')
        .populate('receiver', 'name profilePicture');

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user._id;

        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        });

        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name profilePicture')
            .populate('receiver', 'name profilePicture');

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const otherUserId = req.params.userId;

        await Message.updateMany(
            {
                sender: otherUserId,
                receiver: userId,
                isRead: false
            },
            {
                isRead: true
            }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};