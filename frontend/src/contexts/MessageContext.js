import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const MessageContext = createContext();

export const useMessage = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/messages/conversations');
            setConversations(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch conversations');
        } finally {
            setLoading(false);
        }
    };

    // Fetch messages for a specific conversation
    const fetchMessages = async (userId) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/messages/${userId}`);
            setMessages(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    // Send a message
    const sendMessage = async (receiverId, content) => {
        try {
            const response = await axios.post('/api/messages/send', {
                receiverId,
                content
            });
            setMessages(prev => [...prev, response.data]);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send message');
            throw err;
        }
    };

    // Mark messages as read
    const markAsRead = async (userId) => {
        try {
            await axios.put(`/api/messages/read/${userId}`);
        } catch (err) {
            console.error('Failed to mark messages as read:', err);
        }
    };

    // Set current chat and fetch messages
    const setChat = async (user) => {
        setCurrentChat(user);
        await fetchMessages(user._id);
        await markAsRead(user._id);
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const value = {
        conversations,
        currentChat,
        messages,
        loading,
        error,
        sendMessage,
        setChat,
        fetchConversations
    };

    return (
        <MessageContext.Provider value={value}>
            {children}
        </MessageContext.Provider>
    );
}; 