import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const MessageSystem = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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
            const response = await axios.get('/api/messages/user-messages', {
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

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        setError(null);
        setSuccess(null);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/messages/send-to-all-admins', {
                content: newMessage
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            setNewMessage('');
            setSuccess(`Message sent successfully to ${response.data.adminCount} admin(s)`);
            fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            setError(error.response?.data?.error || 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading messages...</div>;
    }

    return (
        <div className="message-system">
            <h2>Messages to Admins</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            {/* Message Form */}
            <form onSubmit={sendMessage} className="message-form">
                <div className="message-info">
                    <p>Your message will be sent to all administrators</p>
                </div>
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message to admins..."
                    required
                    disabled={isSending}
                />
                <button type="submit" disabled={isSending}>
                    {isSending ? 'Sending...' : 'Send Message to All Admins'}
                </button>
            </form>

            {/* Messages List */}
            <div className="messages-list">
                {messages.length === 0 ? (
                    <div className="no-messages">No messages yet</div>
                ) : (
                    messages.map(message => (
                        <div 
                            key={message._id} 
                            className={`message ${message.sender._id === userId ? 'sent' : 'received'}`}
                        >
                            <div className="message-header">
                                <span>
                                    {message.sender._id === userId ? 'You' : 'Admin'}
                                </span>
                                <span>{new Date(message.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="message-content">{message.content}</div>
                            {!message.isRead && message.sender._id === userId && (
                                <div className="message-status">Sent</div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MessageSystem;