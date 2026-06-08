import React, { useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import './Chat.css';

// Deterministic avatar color from a string (e.g. user id)
const AVATAR_COLORS = [
    '#2563EB', '#7C3AED', '#DB2777', '#DC2626', '#EA580C',
    '#CA8A04', '#16A34A', '#0891B2', '#4F46E5', '#0D9488'
];
const colorFor = (key = '') => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initialsOf = (first = '', last = '') => {
    const f = (first || '').trim();
    const l = (last || '').trim();
    return ((f[0] || '') + (l[0] || '')).toUpperCase() || '?';
};

const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatList = () => {
    const { messages, activeRideId } = useChat();
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!activeRideId) {
        return <div className="chat-list"><div className="chat-empty">Select a ride to see messages</div></div>;
    }

    return (
        <div className="chat-list">
            {messages.length === 0 && (
                <div className="chat-empty">No messages yet — say hello! 👋</div>
            )}
            {messages.map((message) => {
                const isOwnMessage = message.sender._id === user._id;
                const first = message.sender.fullname?.firstname || '';
                const last = message.sender.fullname?.lastname || '';
                const name = `${first} ${last}`.trim() || 'Unknown';
                return (
                    <div
                        key={message._id}
                        className={`chat-message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                    >
                        {!isOwnMessage && (
                            <div className="msg-avatar" style={{ background: colorFor(message.sender._id) }}>
                                {initialsOf(first, last)}
                            </div>
                        )}
                        <div className="msg-body">
                            {!isOwnMessage && <span className="message-sender">{name}</span>}
                            <div className="bubble">
                                <span className="message-content">{message.content}</span>
                            </div>
                            <span className="message-time">{formatTime(message.timestamp)}</span>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatList;
