import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AdminMessageSystem = () => {
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserId(decoded.id);
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }
        fetchMessages();
        // Set up polling to fetch messages every 30 seconds
        const interval = setInterval(fetchMessages, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/messages/admin-messages', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMessages(response.data.messages);
            setLoading(false);
            setError(null);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setError('Failed to load messages. Please try again.');
            setLoading(false);
        }
    };

    const sendReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() || !selectedUser) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/messages/send', {
                receiverId: selectedUser,
                content: replyContent
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setReplyContent('');
            setSelectedUser(null);
            fetchMessages();
        } catch (error) {
            console.error('Error sending reply:', error);
            setError('Failed to send reply. Please try again.');
        }
    };

    const markAsRead = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/messages/mark-read/${messageId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchMessages();
        } catch (error) {
            console.error('Error marking message as read:', error);
            setError('Failed to mark message as read. Please try again.');
        }
    };

    if (loading) {
        return <div className="loading">Loading messages...</div>;
    }

    return (
        <div className="admin-message-system">
            {error && <div className="error-message">{error}</div>}
            
            <div className="messages-list">
                {messages.length === 0 ? (
                    <div className="no-messages">No messages yet</div>
                ) : (
                    messages.map(message => (
                        <div 
                            key={message._id} 
                            className={`message ${message.sender?._id === userId ? 'sent' : 'received'}`}
                        >
                            <div className="message-header">
                                <span>
                                    From: {message.sender?.fullname?.firstname || 'Unknown'} {message.sender?.fullname?.lastname || ''}
                                </span>
                                <span>{new Date(message.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="message-content">{message.content}</div>
                            <div className="message-actions">
                                {!message.isRead && message.receiver?._id === userId && (
                                    <button 
                                        className="mark-read-button"
                                        onClick={() => markAsRead(message._id)}
                                    >
                                        Mark as Read
                                    </button>
                                )}
                                {message.sender?._id !== userId && (
                                    <button 
                                        className="reply-button"
                                        onClick={() => setSelectedUser(message.sender?._id)}
                                    >
                                        Reply
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedUser && (
                <form onSubmit={sendReply} className="reply-form">
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Type your reply..."
                        required
                    />
                    <div className="reply-form-buttons">
                        <button type="submit" className="send-button">Send Reply</button>
                        <button 
                            type="button" 
                            className="cancel-button"
                            onClick={() => {
                                setSelectedUser(null);
                                setReplyContent('');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AdminMessageSystem;