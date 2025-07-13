import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './LoginPage.module.css';

const _LoginPage: React.FC = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
  const navigate = useNavigate();
   const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
   useEffect(() => {
     if (isAuthenticated) {
       navigate('/dashboard');
     }
   }, [isAuthenticated, navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
  }, [email, password, login, navigate]);

  return (
    <div className={styles.loginContainer}>
     {/* <div className={styles.web13662}>  */}
       {/* <img className={styles.image35Icon} alt="" src="/assets/image-35@2x.png" />  */}
       {/* <div className={styles.web13662Child} />
      <div className={styles.web13662Item} />
      <div className={styles.web13662Inner} /> */}
      <div className={styles.adresmailcomParent}>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adres@mail.com"
            className={styles.adresmailcom}
            required
          />
          <div className={styles.adresEMail}>Adres E-mail</div>
          <div className={styles.groupChild} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="*******"
            className={styles.div}
            required
          />
          <div className={styles.haso}>Hasło</div>
          <div className={styles.groupItem} />
          <img className={styles.path10Icon} alt="" src="/assets/path-10.svg" />
          <button
            type="submit"
            className={styles.zalogujSi}
            disabled={loading}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
          <div className={styles.logowanie}>Logowanie</div>
          <div className={styles.przypomnijHaso}>Przypomnij hasło</div>
          <div className={styles.panelWystawcy}>
            <p className={styles.panel}>Panel</p>
            <p className={styles.panel}>Wystawcy</p>
          </div>
          
          {error && (
            <div style={{ 
              position: 'absolute', 
              top: '320px', 
              left: '20px', 
              color: '#c7353c', 
              fontSize: '12px',
              zIndex: 10
            }}>
              {error}
            </div>
          )}
        </form>
      </div> 
    </div> 
  );
};

export default memo(_LoginPage); 