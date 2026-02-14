import axios from 'axios';

const api = axios.create({
    baseURL: 'https://nomination-portal-backend.onrender.com/api', // Updated to Render backend
    headers: {
        'Content-Type': 'application/json'
    }
});

console.log('API Config Loaded:', api.defaults.baseURL); // Cache Buster: 2026-02-14T16:55


// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Ignore 401s from login endpoints to avoid infinite loops/reloads on failed login
        const isLoginRequest = error.config?.url?.includes('/login');

        if (error.response?.status === 401 && !isLoginRequest) {
            console.warn('API 401 Interceptor triggered. URL:', error.config?.url);
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
