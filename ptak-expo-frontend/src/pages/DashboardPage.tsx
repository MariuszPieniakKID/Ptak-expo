import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/Menu';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';
import {
  Container,
  Card,
  CardContent,
  Box,
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

interface DashboardItem {
  title: string;
  icon: string;
  handler: string;
}

const dashboardItems: DashboardItem[] = [
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
    navigateToExhibitors: useCallback(() => navigate('/wystawcy'), [navigate]),
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
              <CustomTypography fontSize="1.5rem" fontWeight={600}>
                Dzień dobry, {user?.firstName || 'Użytkowniku'}
              </CustomTypography>
              <CustomTypography fontSize="0.875rem" color="#6c757d" fontWeight={400}>
                Sprawdź co możesz dzisiaj zrobić!
              </CustomTypography>
            </Box>
          </Box>
          <CustomButton
            variant="outlined"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            className={styles.logoutButton}
            bgColor="transparent"
            textColor="#6F87F6"
            width="auto"
            height="auto"
            sx={{
              border: '1px solid #6F87F6',
              '&:hover': {
                backgroundColor: '#6F87F6',
                color: '#fff',
              },
            }}
          >
            Wyloguj
          </CustomButton>
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3,
            justifyContent: 'center'
          }}
        >
          {dashboardItems.map((item: DashboardItem) => (
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
                  <CustomTypography fontSize="1.25rem" fontWeight={600}>
                    {item.title}
                  </CustomTypography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>
      <Box className={styles.footer}>
        <CustomTypography fontSize="0.75rem" color="#a7a7a7" fontWeight={400}>
          Kontakt • Polityka prywatności • www.warsawexpo.eu
        </CustomTypography>
      </Box>
    </Box>
  );
};

export default DashboardPage; 