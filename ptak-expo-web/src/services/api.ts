import axios, { AxiosInstance, AxiosResponse } from 'axios';
import config from '../config/config';

interface LoginCredentials {
  email: string;
  password: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: any): any => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: any) => {
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
  // Exhibitor login (for ptak-expo-web)
  login: (credentials: LoginCredentials): Promise<AxiosResponse<ApiResponse>> => 
    api.post('/api/v1/auth/exhibitor-login', credentials),
  
  // Verify token
  verify: (): Promise<AxiosResponse<ApiResponse>> => 
    api.get('/api/v1/auth/verify'),
  
  // Logout
  logout: (): Promise<AxiosResponse<ApiResponse>> => 
    api.post('/api/v1/auth/logout'),
  
  // Test endpoint
  test: (): Promise<AxiosResponse<ApiResponse>> => 
    api.get('/api/v1/auth/test'),
};

// Health check
export const healthAPI = {
  check: (): Promise<AxiosResponse<ApiResponse>> => 
    api.get('/api/v1/health'),
};

export default api;