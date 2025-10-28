import React, { FunctionComponent} from 'react';
import { NavLink, useNavigate, useResolvedPath, useMatch } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box, IconButton} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import styles from './Menu.module.scss';

import Logo from '../../assets/group-257@3x.png';
import { ReactComponent as HomeIcon } from '../../assets/group-5.svg';
import { ReactComponent as UsersIcon } from '../../assets/group-30485.svg';
import { ReactComponent as EventsIcon } from '../../assets/group-30487.svg';
import { ReactComponent as ExhibitorsIcon } from '../../assets/group-30486.svg';
import { ReactComponent as DatabaseIcon } from '../../assets/group-30484.svg';

import MenuMobile from '../menu_mobile/Menu_mobile';
import { useMediaQuery } from '@mui/material';


export type MenuType = {
  className?: string;
};

const navItems = [
    { text: 'Home', path: '/dashboard', icon: <HomeIcon /> },
    { text: 'Baza Wydarzeń', path: '/wydarzenia', icon: <EventsIcon /> },
    { text: 'Baza wystawców', path: '/wystawcy', icon: <ExhibitorsIcon /> },
    { text: 'Użytkownicy', path: '/uzytkownicy', icon: <UsersIcon /> },
    { text: 'Baza danych', path: '/baza-danych', icon: <DatabaseIcon /> },
];

const CustomNavLink: FunctionComponent<{ 
  to: string; 
  children: React.ReactNode; 
  startIcon:React.ReactElement<React.HTMLAttributes<SVGElement>>}> 
  = ({ 
  to, 
  children, 
  startIcon 
}) => {
    const resolved = useResolvedPath(to);
    const match = useMatch({ path: resolved.pathname, end: true });


  return (
    <Button
      component={NavLink}
      to={to}
      className={match ? `${styles.navButton} ${styles.active}` : styles.navButton}
      sx={{ 
        flexDirection: 'column', 
        color: 'inherit', 
        paddingY: 1 
      }}
    >
      {React.cloneElement(startIcon, { style: { fill: 'currentColor', fontSize: 28, marginBottom: 4 },})}
      <span className={styles.buttonText} style={{ color: 'inherit' }}>
        {children}
      </span>
    </Button>
  );
};

const Menu: FunctionComponent<MenuType> = ({ 
  className = '' 
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();
  return (
    <>
    {!isMobile?<AppBar position="static" className={`${styles.appBar} ${className}`}>
      <Toolbar className={styles.toolbar}>
        <Box className={styles.navLogo}> <img
          src={Logo}
          alt="PTAK WARSAW EXPO Logo"
          className={styles.logo}
          onClick={() => navigate('/dashboard')}
        />
        </Box>
        <Box className={styles.navLinks}>
          {navItems.map((item) => (
            <CustomNavLink 
              key={item.text} 
              to={item.path} 
              startIcon={item.icon}>
              {item.text}
            </CustomNavLink>
          ))}
        </Box>
        <Box className={styles.navIcon}>
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
    </AppBar>:<MenuMobile />}
    </>
  );
};

export default Menu;
