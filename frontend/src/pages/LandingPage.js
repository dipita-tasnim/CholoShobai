import React from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Post a ride',
    text: 'Share your route and time, and let others heading the same way join you.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    title: 'Join a ride',
    text: 'Find someone already going your way and travel together to split the cost.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Match your preferences',
    text: 'Choose by gender, time, and route, with verified and rated members only.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-brand">CholoShobai</div>
        <div className="landing-nav-actions">
          <button className="lp-btn lp-btn-ghost" onClick={() => navigate('/login')}>Login</button>
          <button className="lp-btn lp-btn-primary" onClick={() => navigate('/registration')}>Sign Up</button>
        </div>
      </nav>

      <header className="landing-hero">
        <h1>Find people going your way</h1>
        <p>
          CholoShobai connects you with others heading the same direction, so you can travel
          together, cheaper and safer. We do not provide vehicles, we help you find each other.
        </p>
        <div className="hero-actions">
          <button className="lp-btn lp-btn-lg lp-btn-white" onClick={() => navigate('/registration')}>
            Get Started
          </button>
          <button className="lp-btn lp-btn-lg lp-btn-outline-white" onClick={() => navigate('/login')}>
            I already have an account
          </button>
        </div>
      </header>

      <section className="landing-section">
        <h2>What you can do</h2>
        <p className="section-sub">Everything you need to share the journey.</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-trust">
        <h2>Travel with confidence</h2>
        <p>
          Every member signs up with email verification, and a ratings and feedback system keeps
          the community trustworthy, so you always know who you are travelling with.
        </p>
      </section>

      <footer className="landing-footer">
        <div className="footer-brand">CholoShobai</div>
        <p>Making everyday travel cheaper, safer, and more connected.</p>
        <p className="footer-contact">
          Questions or feedback? Email us at{' '}
          <a href="mailto:tasnim.dipita@gmail.com">contact@choloshobai.app</a>
        </p>
        <p className="footer-copy">© 2026 CholoShobai. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
