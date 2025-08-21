import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  ListItemButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import MailIcon from '@mui/icons-material/Mail';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import logo from '../../assets/images/logo.png';
import styles from './Header.module.scss';

type NavItem = {
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: 'Home', icon: <HomeIcon /> },
  { label: 'Aktualności', icon: <ArticleIcon /> },
  { label: 'E-Identyfikator', icon: <FingerprintIcon /> },
  { label: 'Checklista targowa', icon: <ListAltIcon /> },
  { label: 'Portal dokumentów', icon: <DescriptionIcon /> },
  { label: 'Materiały marketingowe', icon: <ImageIcon /> },
  { label: 'Informacje targowe', icon: <InfoIcon /> },
  { label: 'Generator zaproszeń', icon: <MailIcon /> },
];

const Header: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <AppBar position="static" className={styles.appbar}>
      <Toolbar className={styles.toolbar}>
        {/* Desktop */}
        {!isMobile && (
          <Box className={styles.navItems}>
            <Box className={styles.logo}>
              <img src={logo} alt="Logo" />
            </Box>
            {navItems.map((item, index) => (
              <Box
                key={item.label}
                className={`${styles.navItem} ${index === activeIndex ? styles.active : ''}`}
                onClick={() => setActiveIndex(index)}
              >
                {item.icon}
                <Typography variant="caption">{item.label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Mobile */}
        {isMobile && (
          <>
            <Box className={styles.menuIconContainer}>
              <Box className={styles.logo}>
                <img src={logo} alt="Logo" />
              </Box>
              <IconButton onClick={handleDrawerToggle}>
                <MenuIcon />
              </IconButton>
            </Box>

            <Drawer anchor="left" open={mobileOpen} onClose={handleDrawerToggle}>
              <List>
                {navItems.map((item, index) => (
                  <ListItem key={item.label} disablePadding>
                    <ListItemButton
                      selected={activeIndex === index}
                      onClick={() => setActiveIndex(index)}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Drawer>
          </>
        )}

        {/* Logout */}
        <IconButton>
          <PowerSettingsNewIcon color="action" />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
