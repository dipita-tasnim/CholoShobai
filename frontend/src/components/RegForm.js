import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";  // <-- added Navigate


const RegForm = () => {
    const navigate = useNavigate();

    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const user = { firstname, lastname, email, password };
    
        try {
            const response = await fetch('/users/register', {
                method: 'POST',
                body: JSON.stringify(user),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            // Check if response is JSON
            let json;
            try {
                json = await response.json();
            } catch (err) {
                throw new Error('Invalid JSON response');
            }
    
            if (!response.ok) {
                setError(json.errors?.[0]?.msg || json.message || "Registration failed");
                return;
            }
    
            localStorage.setItem('token', json.token);
            setFirstname('');
            setLastname('');
            setEmail('');
            setPassword('');
            setError(null);
            console.log('New User added', json);
    
            // Navigate to profile or another page after successful registration
            navigate('/MyProfile');
        } catch (err) {
            console.error('Error:', err);
            setError("Something went wrong. Please try again.");
        }
    };

    // Redirect if already logged in
    if (localStorage.getItem('token')) {
        return <Navigate to="/home" />;
    }

    return (
        <form className="registration" onSubmit={handleSubmit}>
            <h3>Create Your Profile</h3>

            {error && <div className="error">{error}</div>}

            <label>First Name:</label>
            <input
                type="text"
                onChange={(e) => setFirstname(e.target.value)}
                value={firstname}
                required
            />

            <label>Last Name:</label>
            <input
                type="text"
                onChange={(e) => setLastname(e.target.value)}
                value={lastname}
                required
            />

            <label>Email:</label>
            <input
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
            />

            <label>Password:</label>
            <input
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
            />

            <button className="register-button">Sign Up</button>
        </form>
    );
};

export default RegForm;
