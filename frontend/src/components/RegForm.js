import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE } from "../config";

const RegForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [step, setStep] = useState("details"); // "details" or "verify"
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    // Step 1: validate the form, then request an email verification code.
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError(null);
        setInfo(null);

        if (firstname.trim().length < 3) {
            setError("First name must be at least 3 characters.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/users/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const json = await response.json();

            if (!response.ok) {
                setError(json.errors?.[0]?.msg || json.message || "Could not send verification code.");
                return;
            }

            setStep("verify");
            // In development (no email configured) the server returns the code.
            if (json.devOtp) {
                setInfo(`Development mode: your code is ${json.devOtp}`);
            } else {
                setInfo(`We sent a 6 digit code to ${email}. Enter it below to finish.`);
            }
        } catch (err) {
            console.error('send-otp error:', err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: submit the code with the details to create the account.
    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        setError(null);

        if (!otp.trim()) {
            setError("Please enter the verification code.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstname, lastname, email, password, otp: otp.trim() })
            });
            const json = await response.json();

            if (!response.ok) {
                setError(json.errors?.[0]?.msg || json.message || "Registration failed.");
                return;
            }

            login(json.token);
            navigate('/home');
        } catch (err) {
            console.error('register error:', err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Resend a fresh code.
    const handleResend = async () => {
        setError(null);
        setInfo(null);
        setOtp("");
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/users/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const json = await response.json();
            if (!response.ok) {
                setError(json.message || "Could not resend code.");
                return;
            }
            setInfo(json.devOtp ? `Development mode: your code is ${json.devOtp}` : `A new code has been sent to ${email}.`);
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Redirect if already logged in
    if (localStorage.getItem('token')) {
        return <Navigate to="/home" />;
    }

    return (
        <form className="registration" onSubmit={step === "details" ? handleSendOtp : handleVerifyAndRegister}>
            <h3>Create Your Profile</h3>

            {error && <div className="error">{error}</div>}
            {info && <div className="info-message" style={{
                background: '#e0f2fe', color: '#075985', padding: '10px 12px',
                borderRadius: '8px', marginBottom: '10px', fontSize: '14px'
            }}>{info}</div>}

            {step === "details" ? (
                <>
                    <label>First Name:</label>
                    <input type="text" onChange={(e) => setFirstname(e.target.value)} value={firstname} required />

                    <label>Last Name:</label>
                    <input type="text" onChange={(e) => setLastname(e.target.value)} value={lastname} required />

                    <label>Email:</label>
                    <input type="email" onChange={(e) => setEmail(e.target.value)} value={email} required />

                    <label>Password:</label>
                    <input type="password" onChange={(e) => setPassword(e.target.value)} value={password} required />

                    <button className="register-button" disabled={loading}>
                        {loading ? "Sending code..." : "Send Verification Code"}
                    </button>
                </>
            ) : (
                <>
                    <label>Verification Code:</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6 digit code"
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        value={otp}
                        required
                    />

                    <button className="register-button" disabled={loading}>
                        {loading ? "Verifying..." : "Verify & Create Account"}
                    </button>

                    <div style={{ marginTop: '12px', fontSize: '14px', display: 'flex', gap: '14px', justifyContent: 'center' }}>
                        <span
                            style={{ color: '#2563eb', cursor: 'pointer' }}
                            onClick={loading ? undefined : handleResend}
                        >
                            Resend code
                        </span>
                        <span
                            style={{ color: '#6b7280', cursor: 'pointer' }}
                            onClick={() => { setStep("details"); setError(null); setInfo(null); setOtp(""); }}
                        >
                            Edit details
                        </span>
                    </div>
                </>
            )}
        </form>
    );
};

export default RegForm;
