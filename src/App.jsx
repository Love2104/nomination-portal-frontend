import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import StudentDashboard from './pages/StudentDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import SuperadminDashboard from './pages/SuperadminDashboard';
import ReviewerLogin from './pages/ReviewerLogin';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ForgotPassword from './pages/ForgotPassword';

// Public Route (redirects if already logged in)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    if (isAuthenticated) {
        // Redirect based on role (normalize to lowercase for Prisma enum)
        const role = user?.role?.toLowerCase();
        switch (role) {
            case 'superadmin': return <Navigate to="/superadmin" replace />;
            case 'candidate': return <Navigate to="/candidate" replace />;
            case 'reviewer': return <Navigate to="/reviewer" replace />;
            default: return <Navigate to="/student" replace />;
        }
    }

    return children;
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.role?.toLowerCase() !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Dashboard Router - redirects based on role
const DashboardRouter = () => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    switch (user.role?.toLowerCase()) {
        case 'superadmin':
            return <Navigate to="/superadmin" replace />;
        case 'candidate':
            return <Navigate to="/candidate" replace />;
        case 'reviewer':
            return <Navigate to="/reviewer" replace />;
        default:
            return <Navigate to="/student" replace />;
    }
};

function AppContent() {
    return (
        <div className="app">
            <Routes>
                {/* Public Routes */}
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/reviewer/login" element={<ReviewerLogin />} />

                {/* Dashboard Router */}
                <Route path="/" element={<DashboardRouter />} />

                {/* Protected Routes */}
                <Route
                    path="/student"
                    element={
                        <ProtectedRoute>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/candidate"
                    element={
                        <ProtectedRoute requiredRole="candidate">
                            <CandidateDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/superadmin"
                    element={
                        <ProtectedRoute requiredRole="superadmin">
                            <SuperadminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/reviewer"
                    element={
                        <ProtectedRoute>
                            <ReviewerDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
