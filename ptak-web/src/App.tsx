import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import Home from './pages/home/Home';
import Login from './pages/login/Login';
import { AuthProvider } from './contexts/auth/AuthProvider';
import './i18n';
import { ThemeProvider } from '@mui/material';
import theme from './styles/theme';
import Calendar from './pages/calendar/Calendar';
import EventHome from './pages/event-home/EventHome';
import EventNews from './pages/event-news/EventNews';
import EventIdentifier from './pages/event-identifier/EventIdentifier';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route path="/event/:id">
            <Route
              path="home"
              element={
                <ProtectedRoute>
                  <EventHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="news"
              element={
                <ProtectedRoute>
                  <EventNews />
                </ProtectedRoute>
              }
            />
            <Route
              path="identifier"
              element={
                <ProtectedRoute>
                  <EventIdentifier />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/login" element={<Login />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
