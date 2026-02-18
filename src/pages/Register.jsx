import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Register() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const actionCodeSettings = {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
    };

    const handleSendLink = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);

            // Save email and purpose in localStorage for when user returns via link
            localStorage.setItem('emailForSignIn', email);
            localStorage.setItem('emailVerifyPurpose', 'register');

            setEmailSent(true);
        } catch (err) {
            console.error('Send verification link error:', err);
            if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/missing-email') {
                setError('Email is required.');
            } else {
                setError(err.message || 'Failed to send verification email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="container-sm">
                <div className="card">
                    <div className="card-header text-center">
                        <h1 style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            🗳️ IITK Election Commission
                        </h1>
                        <p className="text-muted">Student Registration</p>
                    </div>

                    <div className="card-body">
                        {error && <div className="alert alert-error">{error}</div>}

                        {!emailSent ? (
                            <form onSubmit={handleSendLink}>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <div className="form-help">We'll send a verification link to your email</div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Verification Link'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center">
                                <div className="alert alert-success">
                                    ✅ Verification link sent to <strong>{email}</strong>
                                </div>
                                <p className="text-muted" style={{ margin: '1rem 0' }}>
                                    Check your inbox (and spam folder) and click the verification link to continue registration.
                                </p>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => { setEmailSent(false); setError(''); }}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    Use a different email
                                </button>
                            </div>
                        )}

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
