
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.scss';
import LoginPage from './pages/loginPage/LoginPage';
import DashboardPage from './pages/dashboardPage/DashboardPage';
import UsersPage from './pages/usersPage/UsersPage';
import ExhibitorsPage from './pages/exshibitorsPage/ExhibitorsPage'
import ExhibitorCardPage from './pages/exhibitorCardPage/ExhibitorCardPageShort';
import EventsPageAlt from './pages/eventsPage/EventsPage_';
import DatabasePage from './pages/databasePage/DatabasePage';
import ApiDocsPage from './pages/ApiDocsPage';
import RssEventsPage from './pages/rss/RssEventsPage';
import RssEventExhibitorsPage from './pages/rss/RssEventExhibitorsPage';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/uzytkownicy" element={
              <ProtectedRoute requiredRole="admin">
                <UsersPage />
              </ProtectedRoute>
            } />
            <Route path="/baza-danych" element={
              <ProtectedRoute requiredRole="admin">
                <DatabasePage />
              </ProtectedRoute>
            } />
            
            <Route path="/wystawcy" element={
              <ProtectedRoute requiredRole="admin">
                <ExhibitorsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/wystawcy/:id" element={
              <ProtectedRoute requiredRole="admin">
                <ExhibitorCardPage />
              </ProtectedRoute>
            } />
      
            <Route path="/wydarzenia" element={
              <ProtectedRoute requiredRole="admin">
                <EventsPageAlt />
              </ProtectedRoute>
            } />
            <Route path="/api-docs" element={
              <ProtectedRoute requiredRole="admin">
                <ApiDocsPage />
              </ProtectedRoute>
            } />

            {/* RSS pages - public access */}
            <Route path="/rss" element={<RssEventsPage />} />
            <Route path="/rss/event/:id" element={<RssEventExhibitorsPage />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
