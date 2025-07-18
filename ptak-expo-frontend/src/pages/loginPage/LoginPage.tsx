import React, { useState, useEffect, useCallback, ChangeEvent} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {Box,CircularProgress} from '@mui/material';
import styles from './LoginPage.module.scss';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomField from '../../components/customField/CustomField';
import CustomButton from '../../components/customButton/CustomButton';
import CustomLink from '../../components/customLink/CustomLink';


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
      setEmailError('Adres email jesy wymnagany');
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
  
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (validateEmail(newEmail)) {
      setError('');
    }
  };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {

  const newPassword = e.target.value;
  setPassword(newPassword);

  if (validatePassword(newPassword)) {
    setError('');
  }
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
    <>
    <div className={styles.loginContainer}>
      <div className={styles.contextContainer}>
      <div className={styles.logo} />
      <Box className={styles.loginBox}>
        <CustomTypography className={styles.adminTitle}>Panel <br/> Administratora</CustomTypography>
       
        <CustomTypography fontSize='1rem'>Logowanie</CustomTypography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          className={styles.form}
          noValidate> 
          <CustomField
            label="Adres E-mail"
            type="email"
            value={email}
            onChange={handleEmailChange}
            error={!!emailError}
            errorMessage={emailError}
            placeholder="adres@mail.com"
            fullWidth
            margin="none"
          />
          <CustomField
            label="Hasło"
            placeholder="*****"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            error={!!passwordError}
            errorMessage={passwordError}
            fullWidth
            margin="none"
          />
          <Box className={styles.buttonContainer}>
            {error && 
            (<CustomTypography    
              fontSize={`1rem`}
              fontWeight={300}
              color={`#c7353c`}
              >{error}</CustomTypography>)
            }
            {loading ? (
              <CircularProgress
                size={60}
                thickness={5}
                sx={{ color: '#6F87F6' }}
              />
            ) : (
              <CustomButton
              type="submit"
              disabled={loading || !!emailError || !!passwordError || !email || !password || !!error} 
              >
                Zaloguj się
              </CustomButton>
            )}
            <CustomLink
              href="#"
              className={styles.remindMePassword}
              fontWeight={300}
              fontSize={'0.79'}
              underline
            >Przypomnij hasło
            </CustomLink>
          </Box>
        </Box>
      </Box>
      </div>
    </div>
    <div className={styles.filtr}>
      <div className={styles.filtrGray}/>
      <div className={styles.filtrBlue}/>
    </div>
    </>
  );
};

export default LoginPage; 