import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Link,
} from '@mui/material';
import styles from './LoginPage.module.scss';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Podaj adres e-mail');
      return false;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setEmailError('Podaj poprawny adres e-mail np.: email@gmail.com');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Podaj hasło');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);

      if (!isEmailValid || !isPasswordValid) return;

      setLoading(true);

      try {
        const success = await login(email, password);
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Nieprawidłowy email lub hasło. Spróbuj ponownie.');
        }
      } catch (err) {
        setError('Błąd logowania. Sprawdź dane i spróbuj ponownie.');
        console.error('Login error:', err);
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, navigate]
  );

  return (
    <div className={styles.loginContainer}>
      <div className={styles.logo} />
      <Box className={styles.loginBox}>
        <Typography variant="h1" className={styles.title}>
          Panel <br />
          Administratora
        </Typography>
        <Typography variant="h2" className={styles.loginTitle}>
          Logowanie
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          className={styles.form}
          noValidate
        >
          <TextField
            label="Adres E-mail"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            error={!!emailError}
            helperText={emailError}
            fullWidth
          />
          <TextField
            label="Hasło"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validatePassword(e.target.value);
            }}
            error={!!passwordError}
            helperText={passwordError}
            fullWidth
          />

          <Box className={styles.buttonContainer}>
            {error && (
              <Typography color="error" className={styles.errorMessage}>
                {error}
              </Typography>
            )}
            {loading ? (
              <CircularProgress />
            ) : (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !!emailError || !!passwordError || !email || !password}
              >
                Zaloguj się
              </Button>
            )}
            <Link href="#" className={styles.remindMePassword}>
              Przypomnij hasło
            </Link>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default LoginPage; 