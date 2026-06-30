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
        <div className="landing-brand">
          <img
            src={`${process.env.PUBLIC_URL}/logo1.png`}
            alt="CholoShobai"
            className="brand-logo"
          />
          <span>CholoShobai</span>
        </div>
        <div className="landing-nav-actions">
          <button className="lp-btn lp-btn-ghost" onClick={() => navigate('/login')}>Login</button>
          <button className="lp-btn lp-btn-primary" onClick={() => navigate('/registration')}>Sign Up</button>
        </div>
      </nav>

      <header className="landing-hero">
        <h1>Find companion going your way</h1>
        <p>
          CholoShobai helps you to find each other heading the same direction, so you can travel
          together, cheaper and safer. 
        </p>
        <div className="hero-actions">
          <button className="lp-btn lp-btn-lg lp-btn-white" onClick={() => navigate('/registration')}>
            Get Started
          </button>
          <button className="lp-btn lp-btn-lg lp-btn-outline-white" onClick={() => navigate('/login')}>
            I already have an account
          </button>
        </div>

        <div className="hero-illustration" aria-hidden="true">
          <svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg">
            {/* the shared route */}
            <path
              d="M 60 150 C 200 50, 440 50, 580 150"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="2 12"
            >
              <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.9s" repeatCount="indefinite" />
            </path>

            {/* start point */}
            <g transform="translate(60,150)">
              <circle r="13" fill="#ffffff" />
              <circle r="5" fill="#0F172A" />
            </g>
            {/* destination point */}
            <g transform="translate(580,150)">
              <circle r="13" fill="#ffffff" />
              <circle r="5" fill="#2563EB" />
            </g>

            {/* first traveller */}
            <g>
              <circle cx="0" cy="-10" r="5" fill="#ffffff" />
              <rect x="-5" y="-5" width="10" height="14" rx="5" fill="#60A5FA" />
              <animateMotion dur="4.5s" repeatCount="indefinite" rotate="0" path="M 60 150 C 200 50, 440 50, 580 150" />
            </g>

            {/* second traveller, just behind */}
            <g>
              <circle cx="0" cy="-10" r="5" fill="#ffffff" />
              <rect x="-5" y="-5" width="10" height="14" rx="5" fill="#FBBF24" />
              <animateMotion dur="4.5s" begin="0.7s" repeatCount="indefinite" rotate="0" path="M 60 150 C 200 50, 440 50, 580 150" />
            </g>
          </svg>
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
