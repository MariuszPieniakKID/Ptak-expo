import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import config from '../config/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Debug logging
  console.log('🔧 AuthContext config:', {
    API_BASE_URL: config.API_BASE_URL,
    DEBUG: config.DEBUG
  });

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      await authAPI.verify();
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        // Verify token validity
        verifyToken();
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, [verifyToken, logout]);

  const login = async (email, password) => {
    try {
      console.log('🔄 Attempting login with API URL:', config.API_BASE_URL);
      console.log('🔄 Login data - email:', email, 'password length:', password?.length);
      
      const credentials = { email, password };
      const response = await authAPI.login(credentials);
      const { user: userData, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('✅ Login successful');
      return true;  // Return boolean for consistency with TypeScript version
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('API URL used:', config.API_BASE_URL);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return false;  // Return boolean for consistency
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 