import { FunctionComponent, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Menu.module.css";

export type MenuType = {
  className?: string;
};

const Menu: FunctionComponent<MenuType> = ({ className = "" }) => {
  const navigate = useNavigate();
  
  const handleHomeClick = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);
  
  const handleUsersClick = useCallback(() => {
    navigate('/uzytkownicy');
  }, [navigate]);
  
  const handleExhibitorsClick = useCallback(() => {
    console.log('Navigate to Wystawcy');
  }, []);
  
  const handleEventsClick = useCallback(() => {
    console.log('Navigate to Wydarzenia');
  }, []);
  
  const handleDatabaseClick = useCallback(() => {
    console.log('Navigate to Baza Danych');
  }, []);
  
  return (
    <div className={[styles.component5040, className].join(" ")}>
      <div className={styles.component5040Child} />
      <div className={styles.component5040Inner}>
        <div className={styles.groupChild} />
      </div>
      <div className={styles.component5040Item} />
      <div className={styles.homeParent}>
        <div className={styles.home} onClick={handleHomeClick} style={{cursor: 'pointer'}}>Home</div>
        <img className={styles.groupItem} alt="" src="/assets/group-4.svg" />
        <div className={styles.bazaWystawcw} onClick={handleExhibitorsClick} style={{cursor: 'pointer'}}>Baza wystawców</div>
        <div className={styles.bazaWydarze} onClick={handleEventsClick} style={{cursor: 'pointer'}}>Baza Wydarzeń</div>
        <div className={styles.path11682Parent}>
          <img className={styles.path11682Icon} alt="" src="/assets/path-11682.svg" />
          <img className={styles.path11683Icon} alt="" src="/assets/path-11683.svg" />
          <img className={styles.path11684Icon} alt="" src="/assets/path-11684.svg" />
          <img className={styles.path11685Icon} alt="" src="/assets/path-11685.svg" />
        </div>
        <img className={styles.groupInner} alt="" src="/assets/group-30441.svg" />
        <img className={styles.ellipseIcon} alt="" src="/assets/ellipse-64.svg" />
        <div className={styles.rectangleDiv} />
        <div className={styles.uytkownicy} onClick={handleUsersClick} style={{cursor: 'pointer'}}>Użytkownicy</div>
        <img className={styles.groupIcon} alt="" src="/assets/group-30483.svg" />
        <div className={styles.bazaDanych} onClick={handleDatabaseClick} style={{cursor: 'pointer'}}>Baza danych</div>
      </div>
    </div>
  );
};

export default memo(Menu);
