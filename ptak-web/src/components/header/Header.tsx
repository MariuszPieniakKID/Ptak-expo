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
import { useLocation, useNavigate, useParams } from 'react-router-dom';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  getUrl: (id: string) => string;
};

const navItems: NavItem[] = [
  { label: 'Home', icon: <HomeIcon />, getUrl: (id) => `/event/${id}/home` },
  { label: 'Aktualności', icon: <ArticleIcon />, getUrl: (id) => `/event/${id}/news` },
  {
    label: 'E-Identyfikator',
    icon: <FingerprintIcon />,
    getUrl: (id) => `/event/${id}/identifier`,
  },
  { label: 'Checklista targowa', icon: <ListAltIcon />, getUrl: (id) => `/event/${id}/checklist` },
  {
    label: 'Portal dokumentów',
    icon: <DescriptionIcon />,
    getUrl: (id) => `/event/${id}/documents`,
  },
  {
    label: 'Materiały marketingowe',
    icon: <ImageIcon />,
    getUrl: (id) => `/event/${id}/marketing`,
  },
  { label: 'Informacje targowe', icon: <InfoIcon />, getUrl: (id) => `/event/${id}/info` },
  { label: 'Generator zaproszeń', icon: <MailIcon />, getUrl: (id) => `/event/${id}/invites` },
];

const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDrawer = useMediaQuery('(max-width:1260px)');
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = navItems.findIndex((item) =>
    id ? location.pathname.startsWith(item.getUrl(id)) : false,
  );

  console.log(activeIndex);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <AppBar position="static" className={styles.appbar}>
      <Toolbar className={styles.toolbar}>
        {/* Desktop */}
        {!isDrawer && (
          <Box className={styles.navItems}>
            <Box className={styles.logo}>
              <img src={logo} alt="Logo" />
            </Box>
            {navItems.map((item, index) => (
              <Box
                key={item.label}
                className={`${styles.navItem} ${index == activeIndex ? styles.active : ''}`}
                onClick={() => id && navigate(item.getUrl(id))}
              >
                {item.icon}
                <Typography
                  variant="caption"
                  textAlign={'center'}
                  fontSize={{
                    lg: '10px',
                    xl: '13px',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Mobile */}
        {isDrawer && (
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
                      onClick={() => id && navigate(item.getUrl(id))}
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
