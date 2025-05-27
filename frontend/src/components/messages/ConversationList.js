import React from 'react';
import { useMessage } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/ConversationList.css';

const ConversationList = () => {
    const { conversations, currentChat, setChat } = useMessage();
    const { user } = useAuth();

    return (
        <div className="conversation-list">
            <div className="conversation-list-header">
                <h2>Messages</h2>
            </div>
            <div className="conversations">
                {conversations.map((conversation) => {
                    const otherUser = conversation.user;
                    const lastMessage = conversation.lastMessage;
                    const isActive = currentChat?._id === otherUser._id;

                    return (
                        <div
                            key={otherUser._id}
                            className={`conversation-item ${isActive ? 'active' : ''}`}
                            onClick={() => setChat(otherUser)}
                        >
                            <div className="conversation-avatar">
                                <img
                                    src={otherUser.profilePicture || '/default-avatar.png'}
                                    alt={otherUser.name}
                                />
                            </div>
                            <div className="conversation-info">
                                <div className="conversation-header">
                                    <h3>{otherUser.name}</h3>
                                    {lastMessage && (
                                        <span className="conversation-time">
                                            {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    )}
                                </div>
                                <div className="conversation-preview">
                                    {lastMessage && (
                                        <p className={!lastMessage.isRead && lastMessage.sender._id !== user._id ? 'unread' : ''}>
                                            {lastMessage.sender._id === user._id ? 'You: ' : ''}
                                            {lastMessage.content}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ConversationList; 