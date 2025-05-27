import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useEffect } from 'react';

const LoginForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/home');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const user = { email, password };

            const response = await fetch('/users/login', {
                method: 'POST',
                body: JSON.stringify(user),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.message || "Login failed");
            }

            // Store token and user info
            localStorage.setItem('token', json.token);
            localStorage.setItem('user', JSON.stringify(json.user));

            // Clear form
            setEmail('');
            setPassword('');
            setError(null);

            // Redirect to home
            navigate('/home');
        } catch (err) {
            setError(err.message || "An error occurred during login");
        } finally {
            setIsLoading(false);
        }
    };

    if (localStorage.getItem('token')) {
        return <Navigate to="/home" />;
    }

    return (
        <div className="login-container">
            <form className="login" onSubmit={handleSubmit}>
                <h3>Login</h3>

                {error && <div className="error">{error}</div>}    

                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                        disabled={isLoading}
                    />    
                </div>

                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"  
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        required
                        disabled={isLoading}
                    />
                </div>

                <button 
                    className="login-button" 
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
