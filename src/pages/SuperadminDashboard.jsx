import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function SuperadminDashboard() {
    const [activeTab, setActiveTab] = useState('deadlines');
    const navigate = useNavigate();
    const { logout } = useAuth();

    // State for configuration
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // State for statistics
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchConfig();
        if (activeTab === 'statistics') {
            fetchStats();
        }
    }, [activeTab]);

    const fetchConfig = async () => {
        try {
            const response = await api.get('/superadmin/config');
            setConfig(formatConfigDates(response.data.config));
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch config:', err);
            setError('Failed to load system configuration');
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/superadmin/statistics');
            // Backend returns { data, statistics } – prefer statistics if present
            setStats(response.data.statistics || response.data.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    // Helper to format dates for datetime-local input
    const formatConfigDates = (configData) => {
        if (!configData) return null;
        const formatted = { ...configData };
        const dateFields = [
            'nominationStart', 'nominationEnd',
            'campaignerStart', 'campaignerEnd',
            'manifestoPhase1Start', 'manifestoPhase1End',
            'manifestoPhase2Start', 'manifestoPhase2End',
            'manifestoFinalStart', 'manifestoFinalEnd'
        ];

        dateFields.forEach(field => {
            if (formatted[field]) {
                formatted[field] = new Date(formatted[field]).toISOString().slice(0, 16);
            }
        });
        return formatted;
    };

    const handleInputChange = (e, section = null) => {
        const { name, value } = e.target;
        if (section) {
            setConfig({
                ...config,
                [section]: {
                    ...config[section],
                    [name]: value
                }
            });
        } else {
            setConfig({
                ...config,
                [name]: value
            });
        }
    };

    const saveConfig = async (endpoint, data) => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.put(`/superadmin/config/${endpoint}`, data);
            setConfig(formatConfigDates(response.data.config));
            setSuccess('Configuration saved successfully');
        } catch (err) {
            console.error('Save error:', err);
            setError(err.response?.data?.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleExport = async (type) => {
        try {
            const response = await api.get(`/superadmin/export/${type}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Export error:', err);
            setError('Failed to download export');
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    return (
        <div style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="container">
                {/* Header */}
                <div className="flex-between mb-lg">
                    <div>
                        <h1>Superadmin Dashboard</h1>
                        <p className="text-muted">System Configuration & Management</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>

                {/* Notifications */}
                {error && <div className="alert alert-error mb-md">{error}</div>}
                {success && <div className="alert alert-success mb-md">{success}</div>}

                {/* Tabs */}
                <div className="flex gap-sm mb-lg" style={{ flexWrap: 'wrap' }}>
                    {['deadlines', 'limits', 'nominations', 'admins', 'reviewers', 'statistics', 'export'].map(tab => (
                        <button
                            key={tab}
                            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setActiveTab(tab); setError(''); setSuccess(''); }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Deadlines Tab */}
                {activeTab === 'deadlines' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Deadline Management</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={(e) => { e.preventDefault(); saveConfig('deadlines', config); }}>
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Nomination Start</label>
                                        <input type="datetime-local" className="form-input" name="nominationStart" value={config?.nominationStart || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Nomination End</label>
                                        <input type="datetime-local" className="form-input" name="nominationEnd" value={config?.nominationEnd || ''} onChange={handleInputChange} />
                                    </div>

                                    {/* Proposer/Seconder use the same window as nomination (read-only info) */}
                                    <div className="form-group">
                                        <label className="form-label">Proposer/Seconder Start</label>
                                        <input type="datetime-local" className="form-input" value={config?.nominationStart || ''} readOnly />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Proposer/Seconder End</label>
                                        <input type="datetime-local" className="form-input" value={config?.nominationEnd || ''} readOnly />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Campaigning Start</label>
                                        <input type="datetime-local" className="form-input" name="campaignerStart" value={config?.campaignerStart || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Campaigning End</label>
                                        <input type="datetime-local" className="form-input" name="campaignerEnd" value={config?.campaignerEnd || ''} onChange={handleInputChange} />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Manifesto Phase 1 Start</label>
                                        <input type="datetime-local" className="form-input" name="manifestoPhase1Start" value={config?.manifestoPhase1Start || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Manifesto Phase 1 End</label>
                                        <input type="datetime-local" className="form-input" name="manifestoPhase1End" value={config?.manifestoPhase1End || ''} onChange={handleInputChange} />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Manifesto Phase 2 Start</label>
                                        <input type="datetime-local" className="form-input" name="manifestoPhase2Start" value={config?.manifestoPhase2Start || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Manifesto Phase 2 End</label>
                                        <input type="datetime-local" className="form-input" name="manifestoPhase2End" value={config?.manifestoPhase2End || ''} onChange={handleInputChange} />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Final Manifesto Start</label>
                                        <input type="datetime-local" className="form-input" name="manifestoFinalStart" value={config?.manifestoFinalStart || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Final Manifesto End</label>
                                        <input type="datetime-local" className="form-input" name="manifestoFinalEnd" value={config?.manifestoFinalEnd || ''} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary mt-md" disabled={saving}>
                                    {saving ? 'Saving...' : 'Update Deadlines'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Limits Tab */}
                {activeTab === 'limits' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Supporter Limits Configuration</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={(e) => { e.preventDefault(); saveConfig('limits', config); }}>
                                <div className="grid grid-3">
                                    <div className="form-group">
                                        <label className="form-label">Max Proposers</label>
                                        <input type="number" className="form-input" name="maxProposers" value={config?.maxProposers || ''} onChange={handleInputChange} min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Max Seconders</label>
                                        <input type="number" className="form-input" name="maxSeconders" value={config?.maxSeconders || ''} onChange={handleInputChange} min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Max Campaigners</label>
                                        <input type="number" className="form-input" name="maxCampaigners" value={config?.maxCampaigners || ''} onChange={handleInputChange} min="0" />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary mt-md" disabled={saving}>
                                    {saving ? 'Saving...' : 'Update Limits'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Nominations Tab */}
                {activeTab === 'nominations' && (
                    <NominationsTab setError={setError} setSuccess={setSuccess} />
                )}

                {/* Admins Tab */}
                {activeTab === 'admins' && (
                    <AdminsTab setError={setError} setSuccess={setSuccess} />
                )}

                {/* Reviewers Tab */}
                {activeTab === 'reviewers' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Reviewer Credentials</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                saveConfig('reviewers', {
                                    phase1: config.phase1ReviewerCredentials,
                                    phase2: config.phase2ReviewerCredentials,
                                    final: config.finalReviewerCredentials
                                });
                            }}>
                                <div className="grid grid-3">
                                    <div className="card p-sm bg-light">
                                        <h4>Phase 1 Reviewer</h4>
                                        <div className="form-group mt-sm">
                                            <label className="form-label">Username</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="username"
                                                value={config?.phase1ReviewerCredentials?.username || ''}
                                                onChange={(e) => handleInputChange(e, 'phase1ReviewerCredentials')}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Password</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="password"
                                                value={config?.phase1ReviewerCredentials?.password || ''}
                                                onChange={(e) => handleInputChange(e, 'phase1ReviewerCredentials')}
                                            />
                                        </div>
                                    </div>

                                    <div className="card p-sm bg-light">
                                        <h4>Phase 2 Reviewer</h4>
                                        <div className="form-group mt-sm">
                                            <label className="form-label">Username</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="username"
                                                value={config?.phase2ReviewerCredentials?.username || ''}
                                                onChange={(e) => handleInputChange(e, 'phase2ReviewerCredentials')}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Password</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="password"
                                                value={config?.phase2ReviewerCredentials?.password || ''}
                                                onChange={(e) => handleInputChange(e, 'phase2ReviewerCredentials')}
                                            />
                                        </div>
                                    </div>

                                    <div className="card p-sm bg-light">
                                        <h4>Final Reviewer</h4>
                                        <div className="form-group mt-sm">
                                            <label className="form-label">Username</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="username"
                                                value={config?.finalReviewerCredentials?.username || ''}
                                                onChange={(e) => handleInputChange(e, 'finalReviewerCredentials')}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Password</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="password"
                                                value={config?.finalReviewerCredentials?.password || ''}
                                                onChange={(e) => handleInputChange(e, 'finalReviewerCredentials')}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary mt-md" disabled={saving}>
                                    {saving ? 'Saving...' : 'Update Credentials'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'statistics' && (
                    <div className="card">
                        <div className="card-header flex-between">
                            <h3 className="card-title">System Statistics</h3>
                            <button onClick={fetchStats} className="btn btn-secondary btn-sm">Refresh Stats</button>
                        </div>
                        <div className="card-body">
                            {!stats ? <p>Loading statistics...</p> : (
                                <div className="grid grid-2">
                                    <div className="card bg-light p-md">
                                        <h4>Users</h4>
                                        <p>Total Users: <strong>{stats.users.total}</strong></p>
                                        <p>Candidates: <strong>{stats.users.candidates}</strong></p>
                                        <p>Students: <strong>{stats.users.students}</strong></p>
                                    </div>
                                    <div className="card bg-light p-md">
                                        <h4>Nominations</h4>
                                        <p>Total Nominations: <strong>{stats.nominations.total}</strong></p>
                                        <p>Pending: <strong>{stats.nominations.pending}</strong></p>
                                        <p>Accepted: <strong>{stats.nominations.accepted}</strong></p>
                                    </div>
                                    <div className="card bg-light p-md">
                                        <h4>Supporters</h4>
                                        <p>Total Requests: <strong>{stats.supporters.total}</strong></p>
                                        <p>Accepted: <strong>{stats.supporters.accepted}</strong></p>
                                        <p>Pending: <strong>{stats.supporters.pending}</strong></p>
                                    </div>
                                    <div className="card bg-light p-md">
                                        <h4>Manifestos</h4>
                                        <p>Total Uploads: <strong>{stats.manifestos.total}</strong></p>
                                        <p>Phase 1: <strong>{stats.manifestos.phase1}</strong></p>
                                        <p>Phase 2: <strong>{stats.manifestos.phase2}</strong></p>
                                        <p>Final: <strong>{stats.manifestos.final}</strong></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Export Tab */}
                {activeTab === 'export' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Data Export</h3>
                            <p className="text-muted">Download system data as CSV files</p>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-2">
                                <div className="card p-md border-light">
                                    <h4>Candidates Data</h4>
                                    <p className="text-muted mb-sm">Export list of all candidates and their nomination status</p>
                                    <button onClick={() => handleExport('candidates')} className="btn btn-outline">Download CSV</button>
                                </div>
                                <div className="card p-md border-light">
                                    <h4>Supporters Data</h4>
                                    <p className="text-muted mb-sm">Export all supporter requests and their status</p>
                                    <button onClick={() => handleExport('supporters')} className="btn btn-outline">Download CSV</button>
                                </div>
                                <div className="card p-md border-light">
                                    <h4>Manifestos Data</h4>
                                    <p className="text-muted mb-sm">Export list of uploaded manifestos</p>
                                    <button onClick={() => handleExport('manifestos')} className="btn btn-outline">Download CSV</button>
                                </div>
                                <div className="card p-md border-light">
                                    <h4>Comments Data</h4>
                                    <p className="text-muted mb-sm">Export reviewer comments</p>
                                    <button onClick={() => handleExport('comments')} className="btn btn-outline">Download CSV</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function NominationsTab({ setError, setSuccess }) {
    const [nominations, setNominations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNominations();
    }, []);

    const fetchNominations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/superadmin/nominations');
            setNominations(response.data.nominations);
        } catch (err) {
            console.error('Fetch nominations error:', err);
            setError('Failed to load nominations');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyBox = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this nomination?`)) return;

        try {
            await api.put(`/superadmin/nominations/${id}/verify`, { status });
            setSuccess(`Nomination ${status} successfully`);
            fetchNominations();
        } catch (err) {
            console.error('Verify error:', err);
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Nomination Verification</h3>
                <p className="text-muted">Verify or reject submitted nominations</p>
            </div>
            <div className="card-body">
                {loading ? (
                    <div className="loading-container"><div className="spinner"></div></div>
                ) : nominations.length === 0 ? (
                    <p className="text-muted text-center">No submitted nominations pending verification.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Roll No</th>
                                    <th>Positions</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nominations.map(nom => (
                                    <tr key={nom.id}>
                                        <td>{nom.candidate?.name}</td>
                                        <td>{nom.candidate?.rollNo}</td>
                                        <td>{nom.positions?.join(', ')}</td>
                                        <td>
                                            <span className={`badge ${nom.status === 'ACCEPTED' ? 'badge-success' :
                                                nom.status === 'REJECTED' || nom.status === 'rejected' ? 'badge-error' : 'badge-warning'
                                                }`}>
                                                {nom.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            {nom.status === 'submitted' && (
                                                <div className="flex gap-sm">
                                                    <button
                                                        onClick={() => handleVerifyBox(nom.id, 'ACCEPTED')}
                                                        className="btn btn-success btn-sm"
                                                    >
                                                        Verify
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerifyBox(nom.id, 'REJECTED')}
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

            </div >
        </div >
    );
}

function AdminsTab({ setError, setSuccess }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/superadmin/users');
            setUsers(response.data.data || []);
        } catch (err) {
            console.error('Fetch users error:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleMakeAdmin = async (userId) => {
        if (!window.confirm('Make this user an admin? They will have nomination management permissions.')) return;
        setSavingId(userId);
        setError('');
        setSuccess('');
        try {
            await api.post('/superadmin/create-admin', { userId });
            setSuccess('Admin role assigned successfully');
            await fetchUsers();
        } catch (err) {
            console.error('Create admin error:', err);
            setError(err.response?.data?.message || 'Failed to assign admin role');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Admin Accounts</h3>
                <p className="text-muted">
                    Promote existing registered users to <strong>Admin</strong>. Admins log in with their normal email/password.
                </p>
            </div>
            <div className="card-body">
                {loading ? (
                    <div className="loading-container"><div className="spinner"></div></div>
                ) : users.length === 0 ? (
                    <p className="text-muted text-center">No users found.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Roll No</th>
                                    <th>Department</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>{u.rollNo}</td>
                                        <td>{u.department}</td>
                                        <td>
                                            <span className="badge">
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            {u.role === 'ADMIN' || u.role === 'SUPERADMIN' ? (
                                                <span className="text-muted text-sm">Already {u.role}</span>
                                            ) : (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleMakeAdmin(u.id)}
                                                    disabled={savingId === u.id}
                                                >
                                                    {savingId === u.id ? 'Assigning...' : 'Make Admin'}
                                                </button>
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
    );
}
