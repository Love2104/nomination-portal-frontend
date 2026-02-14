// Get current user from localStorage
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    // console.log('getCurrentUser raw:', userStr);
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            // console.log('getCurrentUser parsed:', user);
            return user;
        } catch (error) {
            console.error('getCurrentUser parse error:', error);
            return null;
        }
    }
    return null;
};

// Get auth token
export const getToken = () => {
    return localStorage.getItem('token');
};

// Set auth data
export const setAuthData = (token, user) => {
    console.log('setAuthData called', { token: !!token, user });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

// Clear auth data
export const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return !!getToken();
};

// Check user role
export const hasRole = (role) => {
    const user = getCurrentUser();
    return user?.role === role;
};

// Check if user is candidate
export const isCandidate = () => {
    return hasRole('candidate');
};

// Check if user is superadmin
export const isSuperadmin = () => {
    return hasRole('superadmin');
};
