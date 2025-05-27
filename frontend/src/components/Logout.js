// components/Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear login info (localStorage/sessionStorage or state)
    localStorage.removeItem('token');

    // Redirect to landing/login
    navigate('/welcome');
  }, [navigate]);

  return null;
};

export default Logout;

