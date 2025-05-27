const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const messageController = require('../controllers/message.controller');

// Get all conversations for the current user
router.get('/conversations', auth, messageController.getConversations);

// Get messages between two users
router.get('/:userId', auth, messageController.getMessages);

// Send a message
router.post('/send', auth, messageController.sendMessage);

// Mark messages as read
router.put('/read/:userId', auth, messageController.markAsRead);

module.exports = router;