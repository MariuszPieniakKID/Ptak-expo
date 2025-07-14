import axios from 'axios';
import config from '../config/config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${config.API_BASE_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Login
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Verify token
  verify: () => api.get('/auth/verify'),
  
  // Logout
  logout: () => api.post('/auth/logout'),
  
  // Test endpoint
  test: () => api.get('/auth/test'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api; 