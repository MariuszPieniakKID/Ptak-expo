import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   
   const [error, setError] = useState('');
   const [emailError, setEmailError] = useState('');
   const [passwordError, setPasswordError] = useState('');
   const navigate = useNavigate();
   const { login, isAuthenticated } = useAuth();

  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  // Redirect if already authenticated
   useEffect(() => {
     if (isAuthenticated) {
       navigate('/dashboard');
     }
   }, [isAuthenticated, navigate]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let valid = true;

    if (!email) {
    setEmailError('Podaj adres e-mail');
    valid = false;
    } else if (!validateEmail(email)) {
    setEmailError('Podaj poprawny adres e-mail np.: email@gmail.pl');
    valid = false;
    } else {
    setEmailError('');
    }

    if (!password) {
    setPasswordError('Podaj hasło');
    valid = false;
    } else {
    setPasswordError('');
    }

    if (!valid) return;

    setLoading(true);

    try {
      const result = await login({email, password});
      
      if (result.success) {
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
  }, [email, password, login, navigate]);

  return (
    <div className={styles.loginContainer}>
      <img className={styles.image35Icon} alt="" src="/assets/image-35@2x.png" />
      <div className={styles.web13662Child} />
      <div className={styles.web13662Item} />
      <div className={styles.web13662Inner} />
      <div className={styles.loginDataContainer}>
       
        <div className={styles.title}><p>Panel <br/>Wystawcy</p></div>
        <div className={styles.loginTitle}><p>Logowanie</p></div>
       <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              if (!validateEmail(e.target.value)) {
                setEmailError('Podaj poprawny adres e-mail');
              } else {
                setEmailError('');
              }}}
             placeholder={isFocusedEmail ? "" : "adres@gmail.com"}
             className={styles.inputData}
             onFocus={() => setIsFocusedEmail(true)}
             onBlur={() => setIsFocusedEmail(false)}
          />
          {!emailError && (<div className={styles.inputDescription}>Adres E-mail</div>   )} 
          {emailError && (<div className={styles.errorInputMessage}>{emailError}</div>)}
  
         <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('')}}
            placeholder={isFocusedPassword ? "" : "*******"}
            className={styles.inputData}
            onFocus={() => setIsFocusedPassword(true)}
            onBlur={() => setIsFocusedPassword(false)}
          />
          {!passwordError && (<div className={styles.inputDescription}>Hasło</div> )} 
          {passwordError  && (<div className={styles.errorInputMessage}>{passwordError }</div>)}

          <div className={styles.buttonContainer}>
            {error && (<div className={styles.errorMessage}>{error}</div>)}
            {loading 
              ?  
              <div className={styles.spinner}></div>
              :
              <button
                type="submit"
                className={styles.logButton}
                disabled={loading
                  || emailError !== '' 
                  || passwordError !== ''
                  || email===""
                  || password===""
                  || error !==""
                  }
                >
                {loading ? 'Logowanie...' : 'Zaloguj się'}
              </button>}
            <div className={styles.remindMePassword}>Przypomnij hasło</div>
          </div>
        </form>
      </div>  
    </div>
  );
};

export default memo(LoginPage); 