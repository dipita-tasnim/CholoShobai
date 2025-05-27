import React, { useState, useRef, useEffect } from 'react';
import { useMessage } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/ChatWindow.css';

const ChatWindow = () => {
    const { currentChat, messages, sendMessage } = useMessage();
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendMessage(currentChat._id, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="chat-user-info">
                    <img
                        src={currentChat.profilePicture || '/default-avatar.png'}
                        alt={currentChat.name}
                        className="chat-avatar"
                    />
                    <h3>{currentChat.name}</h3>
                </div>
                {isMobileView && (
                    <button
                        className="back-button"
                        onClick={() => setCurrentChat(null)}
                    >
                        Back
                    </button>
                )}
            </div>

            <div className="messages-container">
                {messages.map((message) => {
                    const isOwnMessage = message.sender._id === user._id;

                    return (
                        <div
                            key={message._id}
                            className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                        >
                            <div className="message-content">
                                <p>{message.content}</p>
                                <span className="message-time">
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button
                    type="submit"
                    className="send-button"
                    disabled={!newMessage.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatWindow; 