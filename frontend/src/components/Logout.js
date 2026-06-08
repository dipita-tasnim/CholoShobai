// components/Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // Clear auth context state + localStorage (also tears down the chat socket)
    logout();
    localStorage.removeItem('user');

    // Redirect to landing/login
    navigate('/welcome');
  }, [navigate, logout]);

  return null;
};

export default Logout;

