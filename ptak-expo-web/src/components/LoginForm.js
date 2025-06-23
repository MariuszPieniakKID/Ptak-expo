import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const LoginForm = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(credentials);
      
      if (result.success) {
        onLoginSuccess?.(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Wystąpił nieoczekiwany błąd podczas logowania');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = () => {
    setCredentials({
      email: 'test@test.com',
      password: 'test123'
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f5f5'
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', m: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              PTAK EXPO
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Portal dla Wystawców
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Adres email"
              name="email"
              type="email"
              value={credentials.email}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="email"
              disabled={loading}
            />
            
            <TextField
              fullWidth
              label="Hasło"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={loading}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              size="large"
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                'Zaloguj się'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link href="#" variant="body2">
                Nie pamiętasz hasła?
              </Link>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3, p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Dane testowe:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                Email: test@test.com<br />
                Hasło: test123
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleTestLogin}
                sx={{ mt: 1 }}
                disabled={loading}
              >
                Użyj danych testowych
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm; 