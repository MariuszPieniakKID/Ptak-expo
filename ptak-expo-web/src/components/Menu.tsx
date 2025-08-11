import { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box, useMediaQuery } from '@mui/material';
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
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const handleMenuItemClick = (key: string) => {
    if (onMenuClick) {
      onMenuClick(key);
    }
  };

  return (
    <>
      {!isMobile ? (
        <AppBar position="sticky" className={`${styles.appBar} ${className}`}>
          <Toolbar className={styles.toolbar}>
            <Box className={styles.navLogo}>
              <img
                src={Logo}
                alt="Ptak Expo Logo"
                className={styles.logo}
                onClick={handleLogoClick}
              />
            </Box>
            <Box className={styles.navLinks}>
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  onClick={() => handleMenuItemClick(item.key)}
                  className={styles.navButton}
                  sx={{ flexDirection: 'column', color: 'inherit', paddingY: 1 }}
                >
                  <span className={styles.buttonText}>{item.text}</span>
                </Button>
              ))}
            </Box>
            <Box className={styles.navIcon}>
              {onLogout && (
                <button className={styles.logoutButton} onClick={onLogout}>
                  <img className={styles.logoutIcon} alt="" src="/group-872.svg" />
                  <span className={styles.logoutText}>Wyloguj</span>
                </button>
              )}
            </Box>
          </Toolbar>
        </AppBar>
      ) : null}
    </>
  );
};

export default Menu;