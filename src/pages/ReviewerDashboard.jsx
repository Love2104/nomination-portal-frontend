import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function ReviewerDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [manifestos, setManifestos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Selected manifesto for review (full-page view)
    const [selectedManifesto, setSelectedManifesto] = useState(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchManifestos();
    }, []);

    const fetchManifestos = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reviewers/manifestos');
            // Backend returns { data, manifestos } – prefer explicit manifestos
            setManifestos(response.data.manifestos || response.data.data || []);
        } catch (err) {
            console.error('Fetch manifestos error:', err);
            setError('Failed to load manifestos. Ensure you are logged in as a reviewer.');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (manifestoId) => {
        setCommentsLoading(true);
        try {
            const response = await api.get(`/reviewers/comments/${manifestoId}`);
            setComments(response.data.comments || response.data.data || []);
        } catch (err) {
            console.error('Fetch comments error:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    const openReview = (manifesto) => {
        setSelectedManifesto(manifesto);
        setComment('');
        setComments([]);
        fetchComments(manifesto.id);
    };

    const closeReview = () => {
        setSelectedManifesto(null);
        setComments([]);
        setComment('');
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            const response = await api.post('/reviewers/comments', {
                manifestoId: selectedManifesto.id,
                comment
            });
            const newComment = response.data.comment || response.data.data;
            setComments([newComment, ...comments]);
            setComment('');
        } catch (err) {
            console.error('Add comment error:', err);
            alert(err.response?.data?.message || 'Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Fetch PDF as blob when manifesto is selected (bypasses IDM interception)
    useEffect(() => {
        if (!selectedManifesto) {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
                setPdfBlobUrl(null);
            }
            return;
        }
        setPdfLoading(true);
        api.get(`/manifestos/view/${selectedManifesto.id}`, { responseType: 'blob' })
            .then(response => {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                setPdfLoading(false);
            })
            .catch(err => {
                console.error('PDF load error:', err);
                setPdfLoading(false);
            });
        return () => {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        };
    }, [selectedManifesto]);

    // ── FULL-PAGE PDF + COMMENTS VIEW ──
    if (selectedManifesto) {
        const pdfUrl = selectedManifesto.fileUrl;
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Top Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1.5rem',
                    background: 'var(--bg-secondary, #1a1a2e)',
                    borderBottom: '1px solid var(--border-color, #333)',
                    gap: '1rem',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={closeReview} className="btn btn-secondary btn-sm">
                            ← Back to List
                        </button>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>
                                📄 {selectedManifesto.Nomination?.candidate?.name}
                            </h3>
                            <span className="text-muted text-sm">
                                {selectedManifesto.Nomination?.candidate?.department} • {selectedManifesto.Nomination?.candidate?.rollNo} • {selectedManifesto.phase?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                    >
                        ↗ Open in New Tab
                    </a>
                </div>

                {/* Split Pane: PDF (left) + Comments (right) */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* LEFT: PDF Viewer */}
                    <div style={{ flex: '1 1 65%', borderRight: '1px solid var(--border-color, #333)', display: 'flex', flexDirection: 'column' }}>
                        {pdfLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
                                <p>Loading PDF...</p>
                            </div>
                        ) : pdfBlobUrl ? (
                            <iframe
                                src={pdfBlobUrl}
                                title="Manifesto PDF"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    background: '#f5f5f5'
                                }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ff5555' }}>
                                <p>Failed to load PDF. <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#66aaff' }}>Open directly</a></p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Comments Panel */}
                    <div style={{
                        flex: '1 1 35%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-primary, #0f0f23)',
                        minWidth: '320px',
                        maxWidth: '480px'
                    }}>
                        {/* Comments Header */}
                        <div style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--border-color, #333)',
                            flexShrink: 0
                        }}>
                            <h4 style={{ margin: 0 }}>💬 Review Comments</h4>
                            <span className="text-muted text-sm">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Comments List - scrollable */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1rem 1.25rem'
                        }}>
                            {commentsLoading ? (
                                <div className="text-center p-md">
                                    <div className="spinner"></div>
                                    <p className="text-muted text-sm mt-sm">Loading comments...</p>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center p-lg" style={{ opacity: 0.6 }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                                    <p className="text-muted text-sm">No comments yet. Be the first to review!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {comments.map(c => (
                                        <div key={c.id} style={{
                                            padding: '0.75rem 1rem',
                                            background: 'var(--bg-secondary, #1a1a2e)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color, #333)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                <strong style={{ fontSize: '0.85rem' }}>{c.reviewerName}</strong>
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    {new Date(c.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{c.comment || c.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Comment Form - pinned to bottom */}
                        <form
                            onSubmit={handleAddComment}
                            style={{
                                padding: '1rem 1.25rem',
                                borderTop: '1px solid var(--border-color, #333)',
                                flexShrink: 0,
                                background: 'var(--bg-secondary, #1a1a2e)'
                            }}
                        >
                            <textarea
                                className="form-textarea"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Write your review comment..."
                                required
                                style={{
                                    resize: 'vertical',
                                    minHeight: '80px',
                                    maxHeight: '150px',
                                    marginBottom: '0.5rem',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting || !comment.trim()}
                                style={{ width: '100%' }}
                            >
                                {submitting ? 'Posting...' : '💬 Post Comment'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ── MANIFESTO LIST VIEW ──
    return (
        <div style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="container">
                {/* Header */}
                <div className="flex-between mb-lg">
                    <div>
                        <h1>Reviewer Dashboard</h1>
                        <p className="text-muted">Phase: <span className="badge badge-info">{user?.phase?.toUpperCase()}</span> | Reviewer: {user?.username}</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>

                {error && <div className="alert alert-error mb-md">{error}</div>}

                {/* Manifestos Grid */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Manifestos to Review</h3>
                        <p className="text-muted">Click on a manifesto to view the PDF and add inline comments</p>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="loading-container"><div className="spinner"></div></div>
                        ) : manifestos.length === 0 ? (
                            <div className="text-center p-lg">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📄</div>
                                <p className="text-muted">No manifestos found for this phase.</p>
                            </div>
                        ) : (
                            <div className="grid grid-2">
                                {manifestos.map(manifesto => (
                                    <div
                                        key={manifesto.id}
                                        className="card border-light p-md"
                                        onClick={() => openReview(manifesto)}
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div className="flex-between items-start mb-sm">
                                            <div>
                                                <h4 style={{ margin: 0 }}>{manifesto.nomination?.user?.name}</h4>
                                                <p className="text-muted text-sm">{manifesto.nomination?.user?.department} • {manifesto.nomination?.user?.rollNo}</p>
                                            </div>
                                            <span className="badge badge-primary">{manifesto.phase?.toUpperCase()}</span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem',
                                            background: 'var(--bg-secondary, #1a1a2e)',
                                            borderRadius: '6px',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <span style={{ fontSize: '1.5rem' }}>📄</span>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{manifesto.fileName}</p>
                                                <p className="text-muted" style={{ margin: 0, fontSize: '0.75rem' }}>
                                                    Uploaded: {new Date(manifesto.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem',
                                            color: 'var(--primary, #667eea)',
                                            fontSize: '0.85rem',
                                            fontWeight: 600
                                        }}>
                                            📖 Click to Review & Comment
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
