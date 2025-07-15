import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/Menu';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Avatar,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import styles from './DashboardPage.module.scss';

// Import images
import ExhibitorsIcon from '../assets/mask-group-6@2x.png';
import EventsIcon from '../assets/mask-group-5@2x.png';
import UsersIcon from '../assets/mask-group-51@2x.png';
import DatabaseIcon from '../assets/baza@2x.png';
import UserAvatar from '../assets/7bb764a0137abc7a8142b6438e529133@2x.png';

const dashboardItems = [
  {
    title: 'Wystawcy',
    icon: ExhibitorsIcon,
    handler: 'navigateToExhibitors',
  },
  {
    title: 'Wydarzenia',
    icon: EventsIcon,
    handler: 'navigateToEvents',
  },
  {
    title: 'Użytkownicy',
    icon: UsersIcon,
    handler: 'navigateToUsers',
  },
  {
    title: 'Baza Danych',
    icon: DatabaseIcon,
    handler: 'navigateToDatabase',
  },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handlers: { [key: string]: () => void } = {
    navigateToUsers: useCallback(() => navigate('/uzytkownicy'), [navigate]),
    navigateToExhibitors: useCallback(() => console.log('Navigate to Wystawcy'), []),
    navigateToEvents: useCallback(() => console.log('Navigate to Wydarzenia'), []),
    navigateToDatabase: useCallback(() => console.log('Navigate to Baza Danych'), []),
  };

  return (
    <Box className={styles.dashboardPage}>
      <Menu />
      <Container maxWidth="lg" className={styles.contentWrapper}>
        <Box className={styles.header}>
          <Box className={styles.welcomeMessage}>
            <Avatar src={UserAvatar} alt={user?.firstName || 'User'} className={styles.avatar} />
            <Box>
              <Typography variant="h5" component="h1">
                Dzień dobry, {user?.firstName || 'Użytkowniku'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sprawdź co możesz dzisiaj zrobić!
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            className={styles.logoutButton}
          >
            Wyloguj
          </Button>
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3,
            justifyContent: 'center'
          }}
        >
          {dashboardItems.map((item) => (
            <Box
              key={item.title}
              sx={{
                flex: '1 1 300px',
                minWidth: '300px',
                maxWidth: '400px'
              }}
            >
              <Card className={styles.card} onClick={handlers[item.handler]}>
                <CardContent className={styles.cardContent}>
                  <img src={item.icon} alt={item.title} className={styles.cardIcon} />
                  <Typography variant="h6" component="h2">
                    {item.title}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>
      <Box className={styles.footer}>
        <Typography variant="caption">
          Kontakt • Polityka prywatności • www.warsawexpo.eu
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardPage; 