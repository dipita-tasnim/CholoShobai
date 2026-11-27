import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { installFetchTracker } from './utils/loadingTracker';

// Must run before any component makes a request.
installFetchTracker();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


