
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/loginPage/LoginPage';
import _LoginPage from './pages/loginPage/_LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import './global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Default route - redirect to dashboard if authenticated, login if not */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Login page */}
            <Route path="/login" element={<LoginPage />} />
            {/* Login page2 */}
            <Route path="/login2" element={<_LoginPage />} />
            
            {/* Protected Dashboard page - Admin only */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            {/* Protected Users page - Admin only */}
            <Route path="/uzytkownicy" element={
              <ProtectedRoute requiredRole="admin">
                <UsersPage />
              </ProtectedRoute>
            } />
            
            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
