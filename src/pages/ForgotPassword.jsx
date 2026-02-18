import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../utils/api';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isVerified = searchParams.get('verified') === 'true';

    const [step, setStep] = useState(isVerified ? 2 : 1);
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [firebaseToken, setFirebaseToken] = useState('');

    // If redirected from VerifyEmail with verified=true
    useEffect(() => {
        if (isVerified) {
            const token = localStorage.getItem('resetFirebaseToken');
            const storedEmail = localStorage.getItem('resetEmail');
            if (token && storedEmail) {
                setFirebaseToken(token);
                setEmail(storedEmail);
                setStep(2);
            } else {
                setError('Verification expired. Please try again.');
                setStep(1);
            }
        }
    }, [isVerified]);

    const actionCodeSettings = {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // First check if user exists in our DB
            await api.post('/auth/check-email', { email });

            // Send Firebase email link
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);

            localStorage.setItem('emailForSignIn', email);
            localStorage.setItem('emailVerifyPurpose', 'reset');

            setMessage(`Verification link sent to ${email}. Check your inbox and click the link to reset your password.`);
        } catch (err) {
            console.error('Forgot password error:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError(err.message || 'Failed to send verification link. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await api.post('/auth/reset-password-with-token', {
                idToken: firebaseToken,
                email,
                newPassword
            });

            // Clean up
            localStorage.removeItem('resetFirebaseToken');
            localStorage.removeItem('resetEmail');
            localStorage.removeItem('emailForSignIn');
            localStorage.removeItem('emailVerifyPurpose');

            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
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
                            🔐 Password Reset
                        </h1>
                        <p className="text-muted">
                            {step === 1 ? 'Enter your email to receive verification link' : 'Enter your new password'}
                        </p>
                    </div>

                    <div className="card-body">
                        {error && <div className="alert alert-error">{error}</div>}
                        {message && <div className="alert alert-success">{message}</div>}

                        {step === 1 ? (
                            <form onSubmit={handleEmailSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Verification Link'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetSubmit}>
                                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                                    ✅ Email verified: <strong>{email}</strong>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-input"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength="6"
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '10px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem',
                                                color: '#666'
                                            }}
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? "👁️" : "🔒"}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Resetting Password...' : 'Reset Password'}
                                </button>
                            </form>
                        )}

                        <div className="text-center mt-md">
                            <p className="text-muted">
                                <Link to="/login" style={{ color: 'var(--primary)' }}>Back to Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
