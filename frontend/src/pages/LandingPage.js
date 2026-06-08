import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/*  Top-right login/signup buttons */}
      <div className="top-buttons">
        <button onClick={() => navigate('/login')}>Login</button>
        <button onClick={() => navigate('/registration')}>Sign Up</button>
      </div>

      <h1>Welcome to Cholo Shobai 👋</h1>
      <p>Your companion for smarter, safer, and more affordable travel.</p>
     
      
    {/*  New Feature Section */}
    <div className="features-section">
        <h2>What Cholo Shobai can do?</h2>
        <ul className="features-list">
          <li>🚗 Post a ride and find a travel partner</li>
          <li>📅 Book a seat & join planned rides</li>
          <li>📍 Match preferences based on gender, timing & more</li>
        </ul>
      </div>
    </div>
  );
};

export default LandingPage; 