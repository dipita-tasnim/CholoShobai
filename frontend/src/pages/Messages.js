import React, { useState } from 'react';
import { useMessage } from '../contexts/MessageContext';
import ConversationList from '../components/messages/ConversationList';
import ChatWindow from '../components/messages/ChatWindow';
import '../styles/Messages.css';

const Messages = () => {
    const { currentChat, loading, error } = useMessage();
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    // Handle window resize
    React.useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="messages-container">
            <div className={`messages-sidebar ${isMobileView && currentChat ? 'hidden' : ''}`}>
                <ConversationList />
            </div>
            <div className={`messages-main ${isMobileView && !currentChat ? 'hidden' : ''}`}>
                {currentChat ? (
                    <ChatWindow />
                ) : (
                    <div className="no-chat-selected">
                        <h2>Select a conversation to start chatting</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages; 