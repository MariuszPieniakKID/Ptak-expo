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
    const token = localStorage.getItem('authToken');
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
      // Token expired or invalid - clear auth data with correct keys
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Use React Router navigation instead of hard redirect to prevent loops
      console.log('401 Unauthorized - token expired or invalid');
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

// Exhibitions API methods
export const exhibitionsAPI = {
  // Get exhibitor's events
  getMyEvents: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/api/v1/exhibitions/user-events'),
  // Get single exhibition by id
  getById: (id: number): Promise<AxiosResponse<any>> =>
    api.get(`/api/v1/exhibitions/${id}`),
};

// Trade Info API methods (viewer for exhibitors)
export const tradeInfoAPI = {
  get: (exhibitionId: number): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/api/v1/trade-info/${exhibitionId}`),
  downloadPlan: (exhibitionId: number, spaceId: string): Promise<AxiosResponse<Blob>> =>
    api.get(`/api/v1/trade-info/${exhibitionId}/download/${spaceId}`, { responseType: 'blob' }),
};

// Branding files (global per exhibition)
export interface BrandingFilesResponse {
  success: boolean;
  exhibitorId: number;
  exhibitionId: number;
  files: Record<string, {
    id: number;
    fileType: string;
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    dimensions: string | null;
    createdAt: string;
    updatedAt?: string;
  }>;
}

export const brandingAPI = {
  getGlobal: (exhibitionId: number): Promise<AxiosResponse<BrandingFilesResponse>> =>
    api.get(`/api/v1/exhibitor-branding/global/${exhibitionId}`),
  serveGlobalUrl: (fileName: string): string => {
    const base = `${config.API_BASE_URL}/api/v1/exhibitor-branding/serve/global/${encodeURIComponent(fileName)}`;
    const token = localStorage.getItem('authToken');
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },
};

// Health check
export const healthAPI = {
  check: (): Promise<AxiosResponse<ApiResponse>> => 
    api.get('/api/v1/health'),
};

export default api;