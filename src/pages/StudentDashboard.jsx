import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('candidates'); // candidates, my-requests

    // Data State
    const [candidates, setCandidates] = useState([]);
    const [myRequests, setMyRequests] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal State
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedRole, setSelectedRole] = useState('proposer');
    const [modalOpen, setModalOpen] = useState(false);
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 'candidates') {
                const [candidatesRes, requestsRes] = await Promise.all([
                    api.get('/nominations'),
                    api.get('/supporters/my-requests')
                ]);
                setCandidates(candidatesRes.data.nominations);
                setMyRequests(requestsRes.data.requests);
            } else {
                const response = await api.get('/supporters/my-requests');
                setMyRequests(response.data.requests);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleBecomeCandidate = async () => {
        if (!window.confirm('Are you sure you want to become a candidate? This will change your role.')) return;
        try {
            const response = await api.post('/auth/become-candidate');
            updateUser(response.data.user);
            navigate('/candidate');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to become candidate');
        }
    };

    const openRequestModal = (candidate) => {
        setSelectedCandidate(candidate);
        setSelectedRole('proposer');
        setModalOpen(true);
        setError('');
        setSuccess('');
    };

    const closeRequestModal = () => {
        setModalOpen(false);
        setSelectedCandidate(null);
    };

    const handleRequestSupport = async (e) => {
        e.preventDefault();
        setRequesting(true);
        setError('');

        try {
            await api.post('/supporters/request', {
                candidateId: selectedCandidate.candidate.id,
                role: selectedRole
            });
            setSuccess(`Request sent to ${selectedCandidate.candidate.name} successfully!`);
            closeRequestModal();
            fetchData(); // Refresh data to show updated status
        } catch (err) {
            console.error('Request support error:', err);
            setError(err.response?.data?.message || 'Failed to send request');
        } finally {
            setRequesting(false);
        }
    };

    // Helper to check if already requested
    const hasRequested = (candidateId) => {
        return myRequests.some(req => req.candidate?.id === candidateId || req.candidateId === candidateId);
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="container">
                {/* Header */}
                <div className="flex-between mb-lg">
                    <div>
                        <h1>Student Dashboard</h1>
                        <p className="text-muted">Welcome, {user?.name}</p>
                    </div>
                    <div className="flex gap-sm">
                        <button onClick={handleBecomeCandidate} className="btn btn-primary">
                            Become a Candidate
                        </button>
                        <button onClick={handleLogout} className="btn btn-secondary">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {error && <div className="alert alert-error mb-md">{error}</div>}
                {success && <div className="alert alert-success mb-md">{success}</div>}

                {/* Tabs */}
                <div className="flex gap-sm mb-lg">
                    <button
                        className={`btn ${activeTab === 'candidates' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('candidates')}
                    >
                        Browse Candidates
                    </button>
                    <button
                        className={`btn ${activeTab === 'my-requests' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('my-requests')}
                    >
                        My Requests
                    </button>
                </div>

                {/* Candidates List */}
                {activeTab === 'candidates' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">All Candidates</h3>
                            <p className="text-muted">Browse candidates and request supporter roles</p>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="loading-container"><div className="spinner"></div></div>
                            ) : candidates.length === 0 ? (
                                <p className="text-center text-muted">No candidates found.</p>
                            ) : (
                                <div className="grid grid-2">
                                    {candidates.map((nomination) => (
                                        <div key={nomination.id} className="card border-light p-md">
                                            <div className="flex-between items-start">
                                                <div>
                                                    <h4>{nomination.candidate?.name}</h4>
                                                    <p className="text-muted text-sm">{nomination.candidate?.department} • {nomination.candidate?.rollNo}</p>
                                                </div>
                                                {hasRequested(nomination.candidate?.id) && (
                                                    <span className="badge badge-success">Requested</span>
                                                )}
                                            </div>

                                            <div className="mt-sm mb-md">
                                                <p><strong>Running for:</strong></p>
                                                <ul className="pl-md">
                                                    {nomination.positions?.map((pos, idx) => (
                                                        <li key={idx} className="text-sm">{pos}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="flex gap-sm text-sm text-muted mb-md">
                                                <span>Proposers: {nomination.proposerCount}</span>
                                                <span>Seconders: {nomination.seconderCount}</span>
                                                <span>Campaigners: {nomination.campaignerCount}</span>
                                            </div>

                                            <button
                                                className="btn btn-outline btn-sm w-100"
                                                onClick={() => openRequestModal(nomination)}
                                                disabled={hasRequested(nomination.candidate?.id)}
                                            >
                                                {hasRequested(nomination.candidate?.id) ? 'Request Sent' : 'Request Supporter Role'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* My Requests Tab */}
                {activeTab === 'my-requests' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">My Sent Requests</h3>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="loading-container"><div className="spinner"></div></div>
                            ) : myRequests.length === 0 ? (
                                <p className="text-muted">You haven't sent any requests yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Candidate</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Date sent</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myRequests.map(req => (
                                                <tr key={req.id}>
                                                    <td>{req.candidate?.name}</td>
                                                    <td>
                                                        <span className="badge badge-info">{req.role}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${req.status === 'accepted' ? 'badge-success' :
                                                                req.status === 'rejected' ? 'badge-error' : 'badge-warning'
                                                            }`}>
                                                            {req.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Request Modal */}
                {modalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Support {selectedCandidate?.candidate?.name}</h3>
                                <button onClick={closeRequestModal} className="btn-close">&times;</button>
                            </div>
                            <form onSubmit={handleRequestSupport} className="modal-body">
                                <p className="mb-md">Select the role you want to apply for:</p>

                                <div className="form-group">
                                    <label className="radio-label block mb-sm p-sm border rounded cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="proposer"
                                            checked={selectedRole === 'proposer'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                        <span className="ml-sm font-bold">Proposer</span>
                                        <p className="text-sm text-muted ml-lg">Vouches for the candidate's nomination.</p>
                                    </label>

                                    <label className="radio-label block mb-sm p-sm border rounded cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="seconder"
                                            checked={selectedRole === 'seconder'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                        <span className="ml-sm font-bold">Seconder</span>
                                        <p className="text-sm text-muted ml-lg">Seconds the proposal for nomination.</p>
                                    </label>

                                    <label className="radio-label block mb-sm p-sm border rounded cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="campaigner"
                                            checked={selectedRole === 'campaigner'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                        <span className="ml-sm font-bold">Campaigner</span>
                                        <p className="text-sm text-muted ml-lg">Helps in the election campaign.</p>
                                    </label>
                                </div>

                                <div className="flex gap-sm justify-end mt-lg">
                                    <button type="button" onClick={closeRequestModal} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={requesting}>
                                        {requesting ? 'Sending...' : 'Send Request'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
