import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decoded = jwtDecode(storedToken);
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    console.log('Token expired');
                    localStorage.removeItem('token');
                    setUser(null);
                    setToken(null);
                } else {
                    setUser({
                        _id: decoded._id,
                        email: decoded.email,
                        role: decoded.role,
                        name: decoded.name
                    });
                    setToken(storedToken);
                }
            } catch (error) {
                console.error('Error decoding token:', error);
                localStorage.removeItem('token');
                setUser(null);
                setToken(null);
            }
        }
        setLoading(false);
    }, []);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        const decoded = jwtDecode(newToken);
        setUser({
            _id: decoded._id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name
        });
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};