import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [activeRideId, setActiveRideId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const socketRef = useRef(null);
    const { user, token } = useAuth(); // Get user and token from your AuthContext
    const messagesRef = useRef([]);
    const reconnectAttempts = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;

    // Keep messagesRef in sync with messages state
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Move fetchMessages outside the useEffect to make it reusable
    const fetchMessages = useCallback(async (rideId) => {
        try {
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
            console.log('Fetching messages for ride:', {
                rideId,
                currentUser: user?.email,
                userId: user?._id
            });

            const response = await fetch(`${backendUrl}/api/messages/${rideId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched messages:', {
                count: data.length,
                currentUser: user?.email,
                userId: user?._id
            });
            
            // Validate and format messages
            const validMessages = data
                .filter(message => 
                    message && 
                    message.sender && 
                    message.sender._id
                )
                .map(message => {
                    // Extract sender name from the message
                    let senderName = '';
                    if (message.sender.fullname) {
                        if (typeof message.sender.fullname === 'string') {
                            senderName = message.sender.fullname;
                        } else {
                            senderName = `${message.sender.fullname.firstname || ''} ${message.sender.fullname.lastname || ''}`.trim();
                        }
                    } else if (message.sender.name) {
                        senderName = message.sender.name;
                    }

                    return {
                        ...message,
                        sender: {
                            _id: message.sender._id,
                            email: message.sender.email,
                            fullname: {
                                firstname: senderName.split(' ')[0] || '',
                                lastname: senderName.split(' ').slice(1).join(' ') || ''
                            }
                        }
                    };
                })
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            console.log('Formatted messages:', {
                count: validMessages.length,
                currentUser: user?.email,
                userId: user?._id
            });
            setMessages(validMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
        }
    }, [token, user]);

    const connectSocket = useCallback(() => {
        if (!user?._id || !token) {
            console.log("Cannot connect socket - missing user ID or token:", {
                userId: user?._id,
                hasToken: !!token,
                user: user
            });
            return null;
        }

        // Force disconnect any existing socket
        if (socketRef.current) {
            console.log('Force disconnecting existing socket');
            socketRef.current.disconnect();
            socketRef.current = null;
            setConnectionStatus('disconnected');
            setMessages([]);
        }

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
        console.log('Creating new socket connection:', {
            userId: user._id,
            email: user.email,
            backendUrl
        });

        const newSocket = io(backendUrl, {
            auth: {
                token: token
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: true,
            query: {
                userId: user._id,
                email: user.email
            }
        });

        // Store user info on socket instance
        newSocket.userId = user._id;
        newSocket.userEmail = user.email;
        newSocket.userName = user.name;

        newSocket.on('connect', () => {
            console.log('Socket connected:', {
                socketId: newSocket.id,
                userId: user._id,
                email: user.email,
                name: user.name
            });
            setConnectionStatus('connected');
            reconnectAttempts.current = 0;

            if (activeRideId) {
                console.log('Joining ride chat after connection:', {
                    rideId: activeRideId,
                    userId: user._id,
                    email: user.email,
                    name: user.name
                });
                newSocket.emit('joinRideChat', activeRideId);
                fetchMessages(activeRideId);
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', {
                reason,
                userId: user._id,
                email: user.email,
                name: user.name
            });
            setConnectionStatus('disconnected');
            setMessages([]); // Clear messages on disconnect

            if (reason !== 'io client disconnect' && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts.current += 1;
                console.log(`Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
                setTimeout(() => {
                    if (socketRef.current && socketRef.current.userId === user._id) {
                        socketRef.current.connect();
                    }
                }, 1000 * reconnectAttempts.current);
            }
        });

        newSocket.on('receiveMessage', (message) => {
            if (!message || !message.sender || !message.sender._id) {
                console.error('Received invalid message:', message);
                return;
            }

            // Verify the message is for the current user's socket
            if (socketRef.current?.userId !== user._id) {
                console.log('Ignoring message for different user:', {
                    messageUserId: message.sender._id,
                    currentUserId: user._id,
                    currentUser: user.email
                });
                return;
            }

            console.log('Received message:', {
                messageId: message._id,
                senderId: message.sender._id,
                content: message.content,
                currentUser: user.email,
                sender: message.sender
            });

            setMessages(prevMessages => {
                // Drop our own optimistic "temp" message that this real message replaces
                const withoutTemp = prevMessages.filter(m =>
                    !(typeof m._id === 'string' &&
                      m._id.startsWith('temp_') &&
                      m.sender?._id === message.sender._id &&
                      m.content === message.content)
                );

                // Check for duplicate message (already received via socket)
                if (withoutTemp.some(m => m._id === message._id)) {
                    console.log('Duplicate message detected, ignoring:', message._id);
                    return withoutTemp;
                }

                // Ensure sender information is properly structured
                const validMessage = {
                    ...message,
                    sender: {
                        _id: message.sender._id,
                        email: message.sender.email,
                        fullname: {
                            firstname: message.sender.fullname?.firstname || message.sender.name?.split(' ')[0] || '',
                            lastname: message.sender.fullname?.lastname || message.sender.name?.split(' ')[1] || ''
                        }
                    }
                };

                console.log('Adding new message:', {
                    messageId: validMessage._id,
                    senderId: validMessage.sender._id,
                    senderName: `${validMessage.sender.fullname.firstname} ${validMessage.sender.fullname.lastname}`,
                    content: validMessage.content,
                    timestamp: validMessage.timestamp,
                    currentUser: user.email
                });

                return [...withoutTemp, validMessage].sort(
                    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                );
            });
        });

        return newSocket;
    }, [user, token, activeRideId]);

    const sendMessage = (content) => {
        if (!socketRef.current?.connected || !activeRideId || !content.trim() || !user?._id) {
            console.error('Cannot send message:', {
                socketConnected: socketRef.current?.connected,
                activeRideId,
                contentLength: content.trim().length,
                userId: user?._id,
                user: user
            });
            return;
        }

        // Verify we're using the correct socket for the current user
        if (socketRef.current.userId !== user._id) {
            console.error('Socket user mismatch:', {
                socketUserId: socketRef.current.userId,
                currentUserId: user._id,
                currentUser: user.email
            });
            return;
        }

        // Get the current user's name
        let firstName = '';
        let lastName = '';
        if (user.fullname) {
            if (typeof user.fullname === 'string') {
                const nameParts = user.fullname.split(' ');
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ') || '';
            } else {
                firstName = user.fullname.firstname || '';
                lastName = user.fullname.lastname || '';
            }
        } else if (user.name) {
            const nameParts = user.name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        }

        const messageData = {
            rideId: activeRideId,
            content: content.trim(),
            sender: {
                _id: user._id,
                email: user.email,
                fullname: {
                    firstname: firstName,
                    lastname: lastName
                }
            },
            timestamp: new Date().toISOString()
        };

        console.log('Sending message:', {
            ...messageData,
            socketId: socketRef.current.id,
            currentUser: user.email,
            senderName: `${firstName} ${lastName}`.trim()
        });

        // Add message to local state immediately
        const tempMessage = {
            _id: `temp_${Date.now()}`,
            ...messageData
        };

        setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const existingIndex = updatedMessages.findIndex(m => m._id === tempMessage._id);
            if (existingIndex === -1) {
                updatedMessages.push(tempMessage);
                updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            }
            return updatedMessages;
        });

        socketRef.current.emit('sendMessage', messageData);
    };

    // Handle socket connection
    useEffect(() => {
        console.log('Auth state changed:', {
            hasUser: !!user,
            userId: user?._id,
            hasToken: !!token,
            user: user
        });

        // Force cleanup of existing socket
        if (socketRef.current) {
            console.log('Cleaning up existing socket for user change');
            socketRef.current.disconnect();
            socketRef.current = null;
            setConnectionStatus('disconnected');
            setMessages([]);
        }

        // Create new socket if we have user and token
        if (user?._id && token) {
            console.log('Creating new socket for user:', {
                userId: user._id,
                email: user.email,
                name: user.name || user.fullname
            });
            const socket = connectSocket();
            if (socket) {
                socketRef.current = socket;
            }
        }

        return () => {
            if (socketRef.current) {
                console.log('Cleaning up socket on unmount');
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnectionStatus('disconnected');
                setMessages([]);
            }
        };
    }, [user?._id, token, connectSocket]);

    // Handle ride changes separately
    useEffect(() => {
        if (!socketRef.current?.connected || !activeRideId || !user?._id) {
            console.log('Cannot join ride chat:', {
                socketConnected: socketRef.current?.connected,
                hasActiveRide: !!activeRideId,
                hasUser: !!user?._id,
                userId: user?._id,
                currentUser: user?.email
            });
            return;
        }

        console.log('Joining ride chat:', {
            rideId: activeRideId,
            userId: user._id,
            socketId: socketRef.current.id,
            currentUser: user.email
        });

        // Clear messages before joining new ride
        setMessages([]);
        socketRef.current.emit('joinRideChat', activeRideId);
        fetchMessages(activeRideId);

        return () => {
            if (socketRef.current?.connected) {
                console.log('Leaving ride chat:', {
                    rideId: activeRideId,
                    userId: user._id,
                    currentUser: user.email
                });
                socketRef.current.emit('leaveRideChat', activeRideId);
                setMessages([]); // Clear messages when leaving
            }
        };
    }, [activeRideId, user?._id, fetchMessages]);

    // Add a status check for the socket in the returned value
    return (
        <ChatContext.Provider value={{ 
            activeRideId, 
            setActiveRideId, 
            messages, 
            sendMessage, 
            socket: socketRef.current,
            connectionStatus,
            currentUser: user // Expose current user
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext); 