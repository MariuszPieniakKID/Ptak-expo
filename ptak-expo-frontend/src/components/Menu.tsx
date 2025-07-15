import React, { FunctionComponent } from 'react';
import { NavLink, useNavigate, useResolvedPath, useMatch } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box, IconButton } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import styles from './Menu.module.scss';

import Logo from '../assets/group-257@3x.png';
import { ReactComponent as HomeIcon } from '../assets/group-4.svg';
import { ReactComponent as UsersIcon } from '../assets/group-30483.svg';
import { ReactComponent as EventsIcon } from '../assets/group-30441.svg';
import { ReactComponent as ExhibitorsIcon } from '../assets/group-872.svg';
import { ReactComponent as DatabaseIcon } from '../assets/group-1012.svg';


export type MenuType = {
  className?: string;
};

const navItems = [
    { text: 'Home', path: '/dashboard', icon: <HomeIcon /> },
    { text: 'Użytkownicy', path: '/uzytkownicy', icon: <UsersIcon /> },
    { text: 'Baza wystawców', path: '/wystawcy', icon: <ExhibitorsIcon /> },
    { text: 'Baza Wydarzeń', path: '/wydarzenia', icon: <EventsIcon /> },
    { text: 'Baza danych', path: '/baza-danych', icon: <DatabaseIcon /> },
];

const CustomNavLink: FunctionComponent<{ to: string; children: React.ReactNode; startIcon: React.ReactNode }> = ({ to, children, startIcon }) => {
    const resolved = useResolvedPath(to);
    const match = useMatch({ path: resolved.pathname, end: true });

    return (
        <Button
            component={NavLink}
            to={to}
            className={match ? `${styles.navButton} ${styles.active}` : styles.navButton}
            startIcon={startIcon}
        >
            {children}
        </Button>
    );
};

const Menu: FunctionComponent<MenuType> = ({ className = '' }) => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" className={`${styles.appBar} ${className}`}>
      <Toolbar className={styles.toolbar}>
        <img
          src={Logo}
          alt="Ptak Expo Logo"
          className={styles.logo}
          onClick={() => navigate('/dashboard')}
        />
        <Box className={styles.navLinks}>
          {navItems.map((item) => (
            <CustomNavLink key={item.text} to={item.path} startIcon={item.icon}>
                {item.text}
            </CustomNavLink>
          ))}
        </Box>
        <Box>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Menu;
