import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatList from './ChatList';
import './Chat.css';

const STATUS_LABEL = {
    connected: 'Connected',
    connecting: 'Connecting…',
    error: 'Connection error',
    disconnected: 'Disconnected',
};

const ChatWindow = ({ activeRide }) => {
    const { activeRideId, sendMessage, connectionStatus } = useChat();
    const [messageInput, setMessageInput] = useState('');
    const [error, setError] = useState('');

    const handleSendMessage = (e) => {
        e.preventDefault();
        setError('');

        if (!messageInput.trim()) {
            setError('Message cannot be empty');
            return;
        }
        if (!activeRideId) {
            setError('No active ride selected');
            return;
        }
        if (connectionStatus !== 'connected') {
            setError('Not connected to chat server');
            return;
        }

        try {
            sendMessage(messageInput);
            setMessageInput('');
        } catch (err) {
            setError('Failed to send message');
            console.error('Error sending message:', err);
        }
    };

    return (
        <div className="chat-window">
            {activeRideId ? (
                <>
                    <div className="chat-header">
                        <div className="chat-header-title">
                            {activeRide ? (
                                <>
                                    <span>{activeRide.startingPoint}</span>
                                    <span className="arrow">→</span>
                                    <span>{activeRide.destination}</span>
                                </>
                            ) : (
                                <span>Ride Chat</span>
                            )}
                        </div>
                        <span className={`connection-status ${connectionStatus}`}>
                            {STATUS_LABEL[connectionStatus] || connectionStatus}
                        </span>
                    </div>

                    {error && <div className="chat-error">{error}</div>}

                    <div className="chat-area">
                        <ChatList />
                    </div>

                    <form onSubmit={handleSendMessage} className="message-input-area">
                        <input
                            type="text"
                            placeholder="Type a message…"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            disabled={connectionStatus !== 'connected'}
                        />
                        <button
                            type="submit"
                            disabled={connectionStatus !== 'connected' || !messageInput.trim()}
                        >
                            Send
                        </button>
                    </form>
                </>
            ) : (
                <div className="no-chat-selected">
                    <div style={{ fontSize: '2.2rem' }}>💬</div>
                    <div>Select a ride to start chatting</div>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
