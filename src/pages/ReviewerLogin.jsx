import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ReviewerLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        phase: 'phase1'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { loginReviewer } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await loginReviewer(formData.username, formData.password, formData.phase);
            navigate('/reviewer');
        } catch (err) {
            console.error('Reviewer login error:', err);
            setError(err.response?.data?.message || 'Login failed');
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
                        <p className="text-muted">Reviewer Login</p>
                    </div>

                    <div className="card-body">
                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Phase</label>
                                <select
                                    className="form-select"
                                    value={formData.phase}
                                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                                    required
                                >
                                    <option value="phase1">Phase 1</option>
                                    <option value="phase2">Phase 2</option>
                                    <option value="final">Final</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Reviewer username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Reviewer password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Logging in...' : 'Login as Reviewer'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
