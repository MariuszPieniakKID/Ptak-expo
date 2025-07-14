import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './DashboardPage.module.css';
import groupLogo from '../assets/group-257@3x.png';

const DashboardPage: React.FC = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleCalendarClick = () => {
    // Placeholder for calendar functionality
    console.log('Calendar clicked');
  };

  const handleEventSelect = (eventTitle: string) => {
    // Placeholder for event selection
    console.log(`Event selected: ${eventTitle}`);
  };

  return (
    <div className={styles.dashboard}>
      <img className={styles.image35Icon} alt="" src="/image-35@2x.png" />
      <div className={styles.dashboardChild} />
      <div className={styles.dashboardItem} />
      <img className={styles.dashboardInner} alt="" src={groupLogo} />
      
      {/* Logout button */}
      <button className={styles.logoutButton} onClick={handleLogout}>
        <span>Wyloguj</span>
      </button>
      
      <div className={styles.twojeZaplanowaneWydarzenia}>
        Twoje zaplanowane wydarzenia:
      </div>
      
      <div className={styles.path10Parent} onClick={handleCalendarClick}>
        <img className={styles.path10Icon} alt="" src="/path-10.svg" />
        <div className={styles.zobaczKalendariumPtak}>
          Zobacz kalendarium Ptak Warsaw Expo
        </div>
      </div>
      
      <div className={styles.kontakt}>
        Kontakt • Polityka prywatności • www.warsawexpo.eu
      </div>
      
      {/* Event 1 */}
      <div className={styles.groupParent}>
        <div className={styles.groupContainer}>
          <div className={styles.internationalTradeFairForBParent}>
            <div className={styles.internationalTradeFair}>
              International Trade Fair for Building Technologies and Materials
            </div>
            <div className={styles.div}>11.03.2026-15.03.2026</div>
          </div>
          <div 
            className={styles.wybierz}
            onClick={() => handleEventSelect("International Trade Fair for Building Technologies and Materials")}
          >
            wybierz
          </div>
          <img className={styles.image29Icon} alt="" src="/image-29@2x.png" />
        </div>
        <div className={styles.wrapper}>
          <b className={styles.b}>65%</b>
        </div>
        <div className={styles.gotowo}>Gotowość:</div>
      </div>
      
      {/* Event 2 */}
      <div className={styles.groupDiv}>
        <div className={styles.groupContainer}>
          <div className={styles.internationalTradeFairForBParent}>
            <div className={styles.internationalTradeFair}>
              International Trade Fair for Building Technologies and Materials
            </div>
            <div className={styles.div}>11.03.2026-15.03.2026</div>
          </div>
          <div 
            className={styles.wybierz}
            onClick={() => handleEventSelect("International Trade Fair for Building Technologies and Materials")}
          >
            wybierz
          </div>
          <img className={styles.image29Icon} alt="" src="/image-29@2x.png" />
        </div>
        <div className={styles.wrapper}>
          <b className={styles.b}>65%</b>
        </div>
        <div className={styles.gotowo}>Gotowość:</div>
      </div>
      
      {/* Event 3 */}
      <div className={styles.groupParent2}>
        <div className={styles.groupParent3}>
          <div className={styles.internationalTradeFairForBParent}>
            <div className={styles.internationalTradeFair}>
              International Trade Fair for Building Technologies and Materials
            </div>
            <div className={styles.div}>11.03.2026-15.03.2026</div>
          </div>
          <div 
            className={styles.wybierz}
            onClick={() => handleEventSelect("International Trade Fair for Building Technologies and Materials")}
          >
            wybierz
          </div>
          <img
            className={styles.image29Icon}
            alt=""
            src="/4515f4ed2e86e01309533e2483db0fd4@2x.png"
          />
        </div>
        <div className={styles.groupParent4}>
          <div className={styles.frame}>
            <b className={styles.b}>21%</b>
          </div>
          <div className={styles.gotowo2}>Gotowość:</div>
        </div>
      </div>
      
      {/* User greeting */}
      <div className={styles.dzieDobryUserParent}>
        <div className={styles.dzieDobryUser}>
          Dzień dobry, {user?.firstName || 'Użytkowniku'}
        </div>
        <img
          className={styles.bb764a0137abc7a8142b6438e52913Icon}
          alt=""
          src="/7bb764a0137abc7a8142b6438e529133@2x.png"
        />
        <div className={styles.sprawdCoMoesz}>
          Sprawdź co możesz dzisiaj zrobić!
        </div>
        <img className={styles.groupChild} alt="" src="/group-27@2x.png" />
      </div>
    </div>
  );
};

export default DashboardPage; 