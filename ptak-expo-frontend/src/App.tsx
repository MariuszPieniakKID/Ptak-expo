

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/loginPage/LoginPage';
import DashboardPage from './pages/dashboardPage/DashboardPage';
import UsersPage from './pages/usersPage/UsersPage';
import ExhibitorsPage from './pages/exshibitorsPage/ExhibitorsPage'
import ExhibitorCardPage from './pages/exhibitorCardPage/ExhibitorCardPageShort';
import ApiDocsPage from './pages/ApiDocsPage';
import './App.scss';
import EventsPageAlt from './pages/eventsPage/EventsPage_';
import DatabasePage from './pages/databasePage/DatabasePage';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            {/* Default route - redirect to dashboard if authenticated, login if not */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Login page */}
            <Route path="/login" element={<LoginPage />} />
            
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
            {/* Protected Database page - Admin only */}
            <Route path="/baza-danych" element={
              <ProtectedRoute requiredRole="admin">
                <DatabasePage />
              </ProtectedRoute>
            } />
            
            {/* Protected Exhibitors page - Admin only */}
            <Route path="/wystawcy" element={
              <ProtectedRoute requiredRole="admin">
                <ExhibitorsPage />
              </ProtectedRoute>
            } />
            
            {/* Protected Exhibitor Card page - Admin only */}
            <Route path="/wystawcy/:id" element={
              <ProtectedRoute requiredRole="admin">
                <ExhibitorCardPage />
              </ProtectedRoute>
            } />
      
            {/* Protected Events page - Admin only */}
            <Route path="/wydarzenia" element={
              <ProtectedRoute requiredRole="admin">
                <EventsPageAlt />
              </ProtectedRoute>
            } />
            {/* API Docs */}
            <Route path="/api-docs" element={
              <ProtectedRoute requiredRole="admin">
                <ApiDocsPage />
              </ProtectedRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
