// Base URL for the backend API.
//
// In development this is an empty string, so calls like `${API_BASE}/users/login`
// stay relative ("/users/login") and go through the dev proxy in package.json.
//
// In production (Vercel), set the environment variable REACT_APP_BACKEND_URL to
// your deployed backend URL, for example https://choloshobai-backend.onrender.com
// and every request will be sent there.
export const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Socket.io cannot use a relative URL, so it falls back to the local backend
// during development. Everything else should use API_BASE.
export const SOCKET_URL = API_BASE || 'http://localhost:4000';
