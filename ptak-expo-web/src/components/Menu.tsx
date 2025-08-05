import { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Menu.module.css';
import Logo from '../assets/group-257@3x.png';

export type MenuType = {
  className?: string;
  onMenuClick?: (page: string) => void;
  onLogout?: () => void;
};

const navItems = [
  { text: 'Home', key: 'home' },
  { text: 'Aktualności', key: 'news' },
  // { text: 'E-Identyfikator', key: 'id' },
  { text: 'Checklista targowa', key: 'checklist' },
  { text: 'Portal dokumentów', key: 'documents' },
  { text: 'Materiały Marketingowe', key: 'materials' },
  { text: 'Informacje targowe', key: 'info' },
  // { text: 'Generator zaproszeń', key: 'invitations' },
];

const Menu: FunctionComponent<MenuType> = ({ 
  className = '',
  onMenuClick,
  onLogout
}) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const handleMenuItemClick = (key: string) => {
    if (onMenuClick) {
      onMenuClick(key);
    }
    console.log(`Menu clicked: ${key}`);
  };

  return (
    <div className={`${styles.appBar} ${className}`}>
      <div className={styles.toolbar}>
        <div className={styles.navLogo}>
          <img
            src={Logo}
            alt="Ptak Expo Logo"
            className={styles.logo}
            onClick={handleLogoClick}
          />
        </div>
        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={styles.navButton}
              onClick={() => handleMenuItemClick(item.key)}
            >
              <span className={styles.buttonText}>
                {item.text}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.navIcon}>
          {onLogout && (
            <button className={styles.logoutButton} onClick={onLogout}>
              <img className={styles.logoutIcon} alt="" src="/group-872.svg" />
              <span className={styles.logoutText}>Wyloguj</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;