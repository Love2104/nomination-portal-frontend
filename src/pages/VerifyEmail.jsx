import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../utils/api';
import { setAuthData } from '../utils/auth';

export default function VerifyEmail() {
    const [formData, setFormData] = useState({
        password: '',
        name: '',
        rollNo: '',
        department: '',
        phone: ''
    });
    const [email, setEmail] = useState('');
    const [firebaseToken, setFirebaseToken] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    // On mount: verify the email link
    useEffect(() => {
        const verifyEmailLink = async () => {
            try {
                if (!isSignInWithEmailLink(auth, window.location.href)) {
                    setError('Invalid or expired verification link.');
                    setLoading(false);
                    return;
                }

                // Get email from localStorage (saved before sending link)
                let storedEmail = localStorage.getItem('emailForSignIn');

                // If email is missing (e.g. user opened link on different device)
                if (!storedEmail) {
                    storedEmail = window.prompt('Please enter your email for verification:');
                    if (!storedEmail) {
                        setError('Email is required to complete verification.');
                        setLoading(false);
                        return;
                    }
                }

                // Complete Firebase sign-in
                const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
                const token = await result.user.getIdToken();

                setEmail(storedEmail);
                setFirebaseToken(token);
                setEmailVerified(true);

                // Check purpose
                const purpose = localStorage.getItem('emailVerifyPurpose') || 'register';

                if (purpose === 'reset') {
                    // Redirect to reset password with token
                    localStorage.setItem('resetFirebaseToken', token);
                    localStorage.setItem('resetEmail', storedEmail);
                    navigate('/forgot-password?verified=true');
                    return;
                }

                // Clear the stored email
                localStorage.removeItem('emailForSignIn');
                localStorage.removeItem('emailVerifyPurpose');

                setSuccess('Email verified! Complete your registration below.');
            } catch (err) {
                console.error('Email verification error:', err);
                if (err.code === 'auth/invalid-action-code') {
                    setError('This verification link has expired or already been used. Please request a new one.');
                } else {
                    setError(err.message || 'Verification failed. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        verifyEmailLink();
    }, [navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await api.post('/auth/register-with-token', {
                idToken: firebaseToken,
                email,
                ...formData
            });

            setAuthData(response.data.token, response.data.user);
            navigate('/');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <div>
                    <div className="spinner"></div>
                    <p className="text-muted" style={{ marginTop: '1rem' }}>Verifying your email...</p>
                </div>
            </div>
        );
    }

    if (!emailVerified) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
                <div className="container-sm">
                    <div className="card">
                        <div className="card-body text-center">
                            {error && <div className="alert alert-error">{error}</div>}
                            <p className="text-muted mt-md">
                                <Link to="/register" style={{ color: 'var(--primary)' }}>← Back to Register</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="container-sm">
                <div className="card">
                    <div className="card-header text-center">
                        <h1 style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            🗳️ IITK Election Commission
                        </h1>
                        <p className="text-muted">Complete Registration</p>
                    </div>

                    <div className="card-body">
                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                            ✅ Email verified: <strong>{email}</strong>
                        </div>

                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength="6"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Your full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Roll Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Your roll number"
                                    value={formData.rollNo}
                                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Your department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="10-digit phone number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    pattern="[0-9]{10}"
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                                {submitting ? 'Registering...' : 'Complete Registration'}
                            </button>
                        </form>

                        <div className="text-center mt-md">
                            <p className="text-muted">
                                Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login here</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
