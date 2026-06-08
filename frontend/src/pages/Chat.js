import React, { useEffect, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import ChatWindow from '../components/chat/ChatWindow';
import '../components/chat/Chat.css';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an AuthContext

const ChatPage = () => {
    const { activeRideId, setActiveRideId } = useChat();
    const { user, token } = useAuth();
    const [joinedRides, setJoinedRides] = useState([]);
    const [loadingRides, setLoadingRides] = useState(true);
    const [errorRides, setErrorRides] = useState(null);

    useEffect(() => {
        if (!user || !token) {
            // Handle case where user is not logged in
            setLoadingRides(false);
            return;
        }

        const fetchJoinedRides = async () => {
            try {
                setLoadingRides(true);
                setErrorRides(null);
                // /api/rides/mychats returns rides where the user is the owner OR a confirmed participant
                const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000'}/api/rides/mychats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // Backend already filters to chat-eligible rides; use as-is.
                setJoinedRides(data);
            } catch (error) {
                console.error('Error fetching joined rides:', error);
                setErrorRides('Failed to load your rides.');
            } finally {
                setLoadingRides(false);
            }
        };

        fetchJoinedRides();

    }, [user, token]); // Refetch rides if user or token changes

    // Automatically set the active ride to the first joined ride if none is selected
    useEffect(() => {
        if (!activeRideId && joinedRides.length > 0) {
            setActiveRideId(joinedRides[0]._id);
        }
    }, [joinedRides, activeRideId, setActiveRideId]);


    return (
        <div className="chat-page">
            <h2>Ride Chats</h2>
            <div className="chat-container">
                <div className="rides-list-container">
                    <h3>Your Joined Rides (Confirmed)</h3>
                    {loadingRides && <p>Loading rides...</p>}
                    {errorRides && <p style={{ color: 'red' }}>{errorRides}</p>}
                    {!loadingRides && joinedRides.length === 0 && <p>No joined rides with active chats.</p>}
                    
                    {!loadingRides && joinedRides.length > 0 && (
                        <div className="rides-list">
                            {joinedRides.map(ride => {
                                const initials = `${(ride.startingPoint || '?')[0] || ''}${(ride.destination || '?')[0] || ''}`.toUpperCase();
                                return (
                                    <div
                                        key={ride._id}
                                        className={`ride-item ${activeRideId === ride._id ? 'active' : ''}`}
                                        onClick={() => setActiveRideId(ride._id)}
                                    >
                                        <div className="ride-avatar">{initials}</div>
                                        <div className="ride-info">
                                            <div className="ride-route">
                                                <span>{ride.startingPoint}</span>
                                                <span className="arrow">→</span>
                                                <span>{ride.destination}</span>
                                            </div>
                                            <div className="ride-meta">{ride.date} · {ride.time}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <ChatWindow activeRide={joinedRides.find(r => r._id === activeRideId)} />
            </div>
        </div>
    );
};

export default ChatPage; 