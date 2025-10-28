import React, { FunctionComponent,useState} from 'react';
import { NavLink, useResolvedPath, useMatch } from 'react-router-dom';
import { Button, Box, Drawer } from '@mui/material';
import styles from './Menu_mobile.module.scss';

import { ReactComponent as HomeIcon } from '../../assets/group-5.svg';
import { ReactComponent as UsersIcon } from '../../assets/group-30485.svg';
import { ReactComponent as EventsIcon } from '../../assets/group-30487.svg';
import { ReactComponent as ExhibitorsIcon } from '../../assets/group-30486.svg';
import { ReactComponent as DatabaseIcon } from '../../assets/group-30484.svg';




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

const CustomNavLinkMobilke: FunctionComponent<{ 
  to: string; 
  children: React.ReactNode; 
  startIcon: React.ReactElement<React.HTMLAttributes<SVGElement>> 
}> = ({ to, children, startIcon }) => {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: true });

  return (
    <Button
      component={NavLink}
      to={to}
      onClick={(e) => {e.currentTarget.blur()}}
      className={match ? `${styles.navButtonm} ${styles.active}` : styles.navButtonm}
      sx={{ }}
      startIcon={React.cloneElement(startIcon, { style: {fill: 'currentColor',paddingLeft:'0.6em'} })}
    >
      <span  className={styles.buttonMobileText}>{children}</span>
    </Button>
  );
};

const MenuMobile: FunctionComponent<MenuType> = ({ 
  className = '' 
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
        {!drawerOpen && (
        <Box
            onMouseEnter={() => setDrawerOpen(true)}
            onClick={() => setDrawerOpen(true)}
            sx={{ }}
            className={styles.menuBarHandle}
        />
        )}


      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
             sx: { 
                borderRadius: '16px 16px 16px 16px', 
                padding: '0px',
                margin:'0em auto 2em auto',
                width:'96%',
                height:'5em',  
                '@media (max-width: 480px)': {
                    width:'100%', 
                    margin:'0em auto 1em auto',
                 },
                 '@media (max-width: 320px)': {
                    width:'100%', 
                    margin:'0em auto 1em auto',
                    height:'3em', 
                 },
                } 
            }}
        className={`${styles.drawerm} ${className}`}
      >        
        <Box 
        onMouseLeave={() => setDrawerOpen(false)}
        className={`${styles.menuMobileWrapper} ${drawerOpen ? styles.open : ''}`}
        sx={{ }}
        
        >
          {navItems.map((item) => (
            <CustomNavLinkMobilke
              key={item.text} 
              to={item.path} 
              startIcon={item.icon}
            >
              {item.text}
            </CustomNavLinkMobilke>
          ))}
        </Box>
      </Drawer>
    </>
  );
};

export default MenuMobile;
