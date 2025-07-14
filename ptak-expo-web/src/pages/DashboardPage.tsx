import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Open Sans, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h1 style={{
          color: '#2e2e38',
          marginBottom: '20px',
          fontSize: '24px'
        }}>
          ✅ Logowanie zakończone sukcesem!
        </h1>
        
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #c8e6c9'
        }}>
          <p style={{
            color: '#2e7d32',
            margin: '0',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Witaj w aplikacji PTAK EXPO Web!
          </p>
        </div>

        {user && (
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <h3 style={{
              color: '#2e2e38',
              marginBottom: '10px',
              fontSize: '18px'
            }}>
              Informacje o użytkowniku:
            </h3>
            <p style={{ margin: '5px 0', color: '#555' }}>
              <strong>Email:</strong> {user.email}
            </p>
            <p style={{ margin: '5px 0', color: '#555' }}>
              <strong>Imię:</strong> {user.firstName}
            </p>
            <p style={{ margin: '5px 0', color: '#555' }}>
              <strong>Nazwisko:</strong> {user.lastName}
            </p>
            <p style={{ margin: '5px 0', color: '#555' }}>
              <strong>Rola:</strong> {user.role}
            </p>
            {user.companyName && (
              <p style={{ margin: '5px 0', color: '#555' }}>
                <strong>Firma:</strong> {user.companyName}
              </p>
            )}
          </div>
        )}

        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <p style={{
            color: '#856404',
            margin: '0',
            fontSize: '14px'
          }}>
            <strong>Informacja:</strong> To jest tymczasowa strona po logowaniu. 
            Dashboard będzie wkrótce rozwinięty o dodatkowe funkcjonalności.
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#7788ef',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '5px',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'Open Sans, sans-serif',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#6677d9';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#7788ef';
          }}
        >
          Wyloguj się
        </button>
      </div>
    </div>
  );
};

export default DashboardPage; 