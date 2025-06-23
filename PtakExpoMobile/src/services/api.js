import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - change this to your backend URL
const BASE_URL = 'http://localhost:3001/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
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
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      try {
        await AsyncStorage.multiRemove(['token', 'user']);
      } catch (storageError) {
        console.error('Error removing data from AsyncStorage:', storageError);
      }
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