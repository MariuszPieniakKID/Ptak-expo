import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/Menu';
import styles from './DashboardPage.module.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToUsers = () => {
    navigate('/uzytkownicy');
  };

  const navigateToExhibitors = () => {
    console.log('Navigate to Wystawcy');
  };

  const navigateToEvents = () => {
    console.log('Navigate to Wydarzenia');
  };

  const navigateToDatabase = () => {
    console.log('Navigate to Baza Danych');
  };
  
  return (
    <div className={styles.web136620}>
      <img className={styles.maskGroup28} alt="" src="/assets/mask-group-28@2x.png" />
      <div className={styles.web136620Child}></div>
      <div className={styles.web136620Item}></div>
      <div className={styles.web136620Inner}></div>
      <div className={styles.rectangleDiv}></div>
      
      {/* Wystawcy section */}
      <div className={styles.wystawcyParent} onClick={navigateToExhibitors}>
        <div className={styles.wystawcy}>Wystawcy</div>
        <img className={styles.maskGroup6} alt="" src="/assets/mask-group-6@2x.png" />
      </div>
      
      {/* Wydarzenia section */}
      <div className={styles.wydarzeniaParent} onClick={navigateToEvents}>
        <div className={styles.wystawcy}>Wydarzenia</div>
        <img className={styles.maskGroup5} alt="" src="/assets/mask-group-5@2x.png" />
      </div>
      
      {/* Footer kontakt */}
      <div className={styles.kontakt}>
        Kontakt • Polityka prywatności • www.warsawexpo.eu
      </div>
      
      {/* Wyloguj section */}
      <div className={styles.groupParent} onClick={handleLogout}>
        <img className={styles.groupChild} alt="" src="/assets/group-872.svg" />
        <div className={styles.wyloguj}>Wyloguj</div>
      </div>
      
      {/* Logo */}
      <div className={styles.groupDiv}></div>
      
      {/* User greeting section */}
      <div className={styles.dzieDobryJoannaParent}>
        <div className={styles.dzieDobryJoanna}>
          Dzień dobry, {user?.firstName || 'Użytkowniku'}
        </div>
        <img
          className={styles.bb764a0137abc7a8142b6438e52913Icon}
          alt=""
          src="/assets/7bb764a0137abc7a8142b6438e529133@2x.png"
        />
        <div className={styles.sprawdCoMoesz}>
          Sprawdź co możesz dzisiaj zrobić!
        </div>
        <img className={styles.groupItem} alt="" src="/assets/group-27@2x.png" />
      </div>
      
      {/* Dolny rząd - biały prostokąt po prawej */}
      <div className={styles.web136620Child1}></div>
      
      {/* Użytkownicy section - w dolnym prawym prostokącie */}
      <div className={styles.uytkownicyParent} onClick={navigateToUsers}>
        <div className={styles.wystawcy}>Użytkownicy</div>
        <img
          className={styles.maskGroup51}
          alt=""
          src="/assets/mask-group-51@2x.png"
        />
      </div>
      
      {/* Menu component */}
      <Menu />
      
      {/* Dolny rząd - biały prostokąt po lewej */}
      <div className={styles.web136620Child2}></div>
      
      {/* Baza Danych section - w dolnym lewym prostokącie */}
      <div className={styles.bazaDanychParent} onClick={navigateToDatabase}>
        <div className={styles.wystawcy}>Baza Danych</div>
        <div className={styles.maskGroup61}></div>
      </div>
      <img className={styles.bazaIcon} alt="" src="/assets/baza@2x.png" />
    </div>
  );
};

export default DashboardPage; 