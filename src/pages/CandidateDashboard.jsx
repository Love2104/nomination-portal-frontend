import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const POSITIONS = [
    "President, Students' Gymkhana",
    "General Secretary, Media and Culture",
    "General Secretary, Science and Technology",
    "General Secretary, Games and Sports",
    "UG Senator",
    "PG Senator"
];

export default function CandidateDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('nomination'); // nomination, supporters, manifestos
    const navigate = useNavigate();

    // Nomination State
    const [nomination, setNomination] = useState(null);
    const [selectedPositions, setSelectedPositions] = useState([]);
    const [nominationLoading, setNominationLoading] = useState(true);
    const [nominationError, setNominationError] = useState('');
    const [nominationSuccess, setNominationSuccess] = useState('');

    // Supporters State
    const [supporters, setSupporters] = useState([]);
    const [supportersLoading, setSupportersLoading] = useState(false);
    const [supporterError, setSupporterError] = useState('');
    const [supporterSuccess, setSupporterSuccess] = useState('');

    useEffect(() => {
        if (activeTab === 'nomination') {
            fetchNomination();
        } else if (activeTab === 'supporters') {
            fetchSupporters();
        }
    }, [activeTab]);

    // --- Nomination Functions ---
    const fetchNomination = async () => {
        setNominationLoading(true);
        try {
            const response = await api.get('/nominations/my-nomination');
            setNomination(response.data.nomination);
            setSelectedPositions(response.data.nomination.positions || []);
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error('Fetch nomination error:', err);
                setNominationError('Failed to load nomination details');
            }
            setNomination(null);
        } finally {
            setNominationLoading(false);
        }
    };

    const handlePositionChange = (position) => {
        if (selectedPositions.includes(position)) {
            setSelectedPositions(selectedPositions.filter(p => p !== position));
        } else {
            setSelectedPositions([...selectedPositions, position]);
        }
    };

    const handleSaveNomination = async (e) => {
        e.preventDefault();
        setNominationError('');
        setNominationSuccess('');

        if (selectedPositions.length === 0) {
            setNominationError('Please select at least one position');
            return;
        }

        try {
            let response;
            if (nomination) {
                // Update existing
                response = await api.put(`/nominations/${nomination.id}`, { positions: selectedPositions });
                setNominationSuccess('Nomination updated (Draft)');
            } else {
                // Create new
                response = await api.post('/nominations', { positions: selectedPositions });
                setNominationSuccess('Nomination created (Draft)');
            }
            setNomination(response.data.nomination);
        } catch (err) {
            console.error('Save nomination error:', err);
            setNominationError(err.response?.data?.message || 'Failed to save nomination');
        }
    };

    const handleSubmitNomination = async () => {
        if (!window.confirm('Are you sure you want to submit? You cannot edit after submission.')) return;

        setNominationError('');
        try {
            const response = await api.post(`/nominations/${nomination.id}/submit`);
            setNomination(response.data.nomination);
            setNominationSuccess('Nomination submitted successfully!');
        } catch (err) {
            console.error('Submit nomination error:', err);
            setNominationError(err.response?.data?.message || 'Failed to submit nomination');
        }
    };

    // --- Supporter Functions ---
    const fetchSupporters = async () => {
        setSupportersLoading(true);
        try {
            const response = await api.get(`/supporters/candidate/${user.id}`);
            // Backend returns { data, requests } – prefer explicit requests
            setSupporters(response.data.requests || response.data.data || []);
        } catch (err) {
            console.error('Fetch supporters error:', err);
            setSupporterError('Failed to load supporter requests');
        } finally {
            setSupportersLoading(false);
        }
    };

    const handleSupporterAction = async (requestId, action) => {
        setSupporterError('');
        setSupporterSuccess('');
        try {
            if (action === 'accept') {
                await api.put(`/supporters/${requestId}/accept`);
                setSupporterSuccess('Supporter request accepted');
            } else {
                await api.put(`/supporters/${requestId}/reject`);
                setSupporterSuccess('Supporter request rejected');
            }
            fetchSupporters(); // Reload list
        } catch (err) {
            console.error(`${action} supporter error:`, err);
            setSupporterError(err.response?.data?.message || `Failed to ${action} request`);
        }
    };

    // --- Logout ---
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isLocked = ['submitted', 'locked', 'verified', 'rejected'].includes(nomination?.status);

    return (
        <div style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="container">
                {/* Header */}
                <div className="flex-between mb-lg">
                    <div>
                        <h1>Candidate Dashboard</h1>
                        <p className="text-muted">Welcome, {user?.name}</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-sm mb-lg">
                    <button
                        className={`btn ${activeTab === 'nomination' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setActiveTab('nomination'); setNominationError(''); setNominationSuccess(''); }}
                    >
                        Nomination
                    </button>
                    <button
                        className={`btn ${activeTab === 'supporters' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setActiveTab('supporters'); setSupporterError(''); setSupporterSuccess(''); }}
                    >
                        Supporters
                    </button>
                    <button
                        className={`btn ${activeTab === 'manifestos' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('manifestos')}
                    >
                        Manifestos
                    </button>
                </div>

                {/* Nomination Tab */}
                {activeTab === 'nomination' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Nomination Form</h3>
                            <p className="text-muted">File your nomination for election positions</p>
                        </div>
                        <div className="card-body">
                            {nominationLoading ? (
                                <div className="loading-container"><div className="spinner"></div></div>
                            ) : (
                                <>
                                    {nominationError && <div className="alert alert-error mb-md">{nominationError}</div>}
                                    {nominationSuccess && <div className="alert alert-success mb-md">{nominationSuccess}</div>}

                                    {nomination && <div className={`badge ${isLocked ? 'badge-success' : 'badge-warning'} mb-md`}>
                                        Status: {nomination.status.toUpperCase()}
                                    </div>}

                                    {isLocked ? (
                                        <div className="text-center p-lg border rounded bg-light">
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                                                {nomination.status === 'verified' ? '✅' :
                                                    nomination.status === 'rejected' ? '❌' : '📝'}
                                            </div>
                                            <h3>
                                                {nomination.status === 'verified' ? 'Nomination Verified' :
                                                    nomination.status === 'rejected' ? 'Nomination Rejected' : 'Nomination Submitted'}
                                            </h3>
                                            <p className="text-muted mb-md">
                                                {nomination.status === 'verified' ? 'Your nomination has been verified and accepted.' :
                                                    nomination.status === 'rejected' ? 'Your nomination has been rejected. Please contact the Election Commission.' :
                                                        'Your nomination has been submitted and is pending verification by the Superadmin.'}
                                            </p>
                                            <div className={`badge ${nomination.status === 'verified' ? 'badge-success' :
                                                nomination.status === 'rejected' ? 'badge-error' : 'badge-warning'
                                                } mb-md`} style={{ fontSize: '1.2rem' }}>
                                                Status: {nomination.status.toUpperCase()}
                                            </div>
                                            <div className="text-left mt-md p-md bg-white rounded border">
                                                <strong>Selected Positions:</strong>
                                                <ul className="mt-sm pl-md">
                                                    {selectedPositions.map(p => (
                                                        <li key={p}>{p}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSaveNomination}>
                                            <div className="form-group">
                                                <label className="form-label">Select Position(s)</label>
                                                <div className="grid grid-2">
                                                    {POSITIONS.map(position => (
                                                        <div key={position} className="flex gap-sm items-center p-sm border rounded">
                                                            <input
                                                                type="checkbox"
                                                                id={position}
                                                                checked={selectedPositions.includes(position)}
                                                                onChange={() => handlePositionChange(position)}
                                                            />
                                                            <label htmlFor={position} style={{ cursor: 'pointer' }}>{position}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-sm mt-md">
                                                <button type="submit" className="btn btn-primary" disabled={nominationLoading}>
                                                    {nomination ? 'Update Draft' : 'Save Draft'}
                                                </button>
                                                {nomination && (
                                                    <button type="button" onClick={handleSubmitNomination} className="btn btn-success">
                                                        Final Submit
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Supporters Tab */}
                {activeTab === 'supporters' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Supporter Management</h3>
                            <p className="text-muted">Manage supporter requests from students</p>
                        </div>
                        <div className="card-body">
                            {supporterError && <div className="alert alert-error mb-md">{supporterError}</div>}
                            {supporterSuccess && <div className="alert alert-success mb-md">{supporterSuccess}</div>}

                            {supportersLoading ? (
                                <div className="loading-container"><div className="spinner"></div></div>
                            ) : supporters.length === 0 ? (
                                <p className="text-muted text-center">No supporter requests yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Roll No</th>
                                                <th>Requested Role</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {supporters.map(request => (
                                                <tr key={request.id}>
                                                    <td>{request.student?.name}</td>
                                                    <td>{request.student?.rollNo}</td>
                                                    <td>
                                                        <span className={`badge ${request.role === 'proposer' ? 'badge-primary' :
                                                            request.role === 'seconder' ? 'badge-info' : 'badge-secondary'
                                                            }`}>
                                                            {request.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${request.status === 'accepted' ? 'badge-success' :
                                                            request.status === 'rejected' ? 'badge-error' : 'badge-warning'
                                                            }`}>
                                                            {request.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {request.status === 'pending' && (
                                                            <div className="flex gap-sm">
                                                                <button
                                                                    onClick={() => handleSupporterAction(request.id, 'accept')}
                                                                    className="btn btn-success btn-sm"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSupporterAction(request.id, 'reject')}
                                                                    className="btn btn-error btn-sm"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Manifestos Tab */}
                {activeTab === 'manifestos' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Manifesto Upload</h3>
                            <p className="text-muted">Upload manifestos for each election phase</p>
                        </div>
                        <div className="card-body">
                            {['phase1', 'phase2', 'final'].map(phase => (
                                <ManifestoUploadSection
                                    key={phase}
                                    phase={phase}
                                    nominationId={nomination?.id}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component for Manifesto Upload
function ManifestoUploadSection({ phase, nominationId }) {
    const [manifesto, setManifesto] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [commentsVisible, setCommentsVisible] = useState(false);

    useEffect(() => {
        if (nominationId) {
            fetchManifestoData();
        }
    }, [nominationId, phase]);

    const fetchManifestoData = async () => {
        try {
            const res = await api.get(`/manifestos/${nominationId}/${phase}`);
            const m = res.data.manifesto || res.data.data || null;
            setManifesto(m);
            if (m) {
                fetchComments(m.id);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error('Fetch manifesto error:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (manifestoId) => {
        try {
            const res = await api.get(`/reviewers/comments/${manifestoId}`);
            setComments(res.data.comments || res.data.data || []);
        } catch (err) {
            console.error('Fetch comments error:', err);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file only.');
            return;
        }

        const formData = new FormData();
        formData.append('manifesto', file);
        formData.append('phase', phase);

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/manifestos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const m = res.data.manifesto || res.data.data || null;
            setManifesto(m);
            setSuccess('Manifesto uploaded successfully!');
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Failed to upload manifesto');
        } finally {
            setUploading(false);
        }
    };

    const phaseTitle = phase === 'phase1' ? 'Phase 1 Draft' :
        phase === 'phase2' ? 'Phase 2 Revised' : 'Final Submission';

    return (
        <div className="card border-light p-md mb-md">
            <div className="flex-between mb-sm">
                <h4>{phaseTitle}</h4>
                {manifesto && <span className="badge badge-success">Uploaded</span>}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="flex gap-md items-center flex-wrap">
                <div className="flex-grow">
                    {manifesto ? (
                        <div className="flex gap-sm items-center">
                            <a href={manifesto.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                                View Uploaded PDF
                            </a>
                            <span className="text-muted text-sm">
                                Uploaded: {new Date(manifesto.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    ) : (
                        <p className="text-muted text-sm">No file uploaded yet.</p>
                    )}
                </div>

                <div>
                    <label className="btn btn-primary btn-sm cursor-pointer">
                        {uploading ? 'Uploading...' : (manifesto ? 'Upload New Version' : 'Upload PDF')}
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* Comments Section */}
            {manifesto && (
                <div className="mt-md">
                    <button
                        className="text-primary text-sm bg-transparent border-none cursor-pointer"
                        onClick={() => setCommentsVisible(!commentsVisible)}
                    >
                        {commentsVisible ? 'Hide Comments' : `View Reviewer Comments (${comments.length})`}
                    </button>

                    {commentsVisible && (
                                            <div className="mt-sm bg-light p-sm rounded">
                                                {comments.length === 0 ? (
                                                    <p className="text-sm text-muted">No comments yet.</p>
                                                ) : (
                                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                                        {comments.map(c => (
                                                            <li key={c.id} className="mb-sm border-bottom pb-sm last:border-none">
                                                                <div className="flex-between">
                                                                    <strong>{c.reviewerName}</strong>
                                                                    <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-sm mt-xs">{c.comment || c.content}</p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                    )}
                </div>
            )}
        </div>
    );
}
