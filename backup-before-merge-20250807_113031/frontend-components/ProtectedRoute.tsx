import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const [countdown, setCountdown] = useState(5);

  // Auto-logout logic moved to top level
  useEffect(() => {
    // Only start countdown if user is authenticated but doesn't have required role
    if (isAuthenticated && requiredRole && user?.role !== requiredRole) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    
    // Return undefined when condition is not met
    return undefined;
  }, [isAuthenticated, user?.role, requiredRole, logout]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Ładowanie...
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific role is required, check if user has that role
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        fontSize: '18px',
        backgroundColor: '#f8f9fa',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>🚫 Brak uprawnień</h2>
          <p style={{ marginBottom: '10px' }}>Nie masz uprawnień do tego zasobu.</p>
          <p style={{ marginBottom: '10px' }}>Wymagana rola: <strong>{requiredRole}</strong></p>
          <p style={{ marginBottom: '20px' }}>Twoja rola: <strong>{user?.role}</strong></p>
          
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '5px',
            padding: '15px',
            marginTop: '20px'
          }}>
            <p style={{ margin: 0, color: '#856404' }}>
              Zostaniesz automatycznie wylogowany za: <strong>{countdown}</strong> sekund
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute; 