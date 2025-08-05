import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/loginPage/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExhibitorDashboardPage from './pages/ExhibitorDashboardPage';
import './global.scss';

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
            
            {/* Protected Dashboard page - All authenticated users */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            {/* Protected Exhibitor Dashboard page - All authenticated users */}
            <Route path="/event/:eventId" element={
              <ProtectedRoute>
                <ExhibitorDashboardPage />
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