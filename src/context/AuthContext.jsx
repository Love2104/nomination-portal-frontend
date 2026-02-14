import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import { setAuthData, clearAuthData, getCurrentUser, getToken } from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = getToken();
            const storedUser = getCurrentUser();

            if (token && storedUser) {
                try {
                    // Optional: Verify token with backend
                    // const response = await api.get('/auth/profile');
                    // setUser(response.data.user);

                    // For now, trust local storage but we could verify
                    setUser(storedUser);
                } catch (err) {
                    console.error('Auth verification failed:', err);
                    logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            setAuthData(token, user);
            setUser(user);
            return user;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        clearAuthData();
        setUser(null);
    };

    // Update user role (e.g. becoming a candidate)
    const updateUser = (userData) => {
        setUser(userData);
        const token = getToken();
        setAuthData(token, userData);
    };

    const loginReviewer = async (username, password, phase) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/reviewers/login', { username, password, phase });
            const { token, reviewer } = response.data;
            const userData = { ...reviewer, role: 'reviewer' }; // Normalize role

            setAuthData(token, userData);
            setUser(userData);
            return userData;
        } catch (err) {
            setError(err.response?.data?.message || 'Reviewer login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, loginReviewer, logout, updateUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
