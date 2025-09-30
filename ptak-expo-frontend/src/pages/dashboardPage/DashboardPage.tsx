import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Menu from '../../components/menu/Menu';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import {
  Container,
  Card,
  CardContent,
  Box,
  Avatar,
} from '@mui/material';
import styles from './DashboardPage.module.scss';

// Import images
// import BackGroundPhotoM from '../../assets/tlo_m.png';
// import BackGroundPhoto from '../../assets/tlo.png';
import ExhibitorsIcon from '../../assets/exhibitorsIcon.png';
import EventsIcon from '../../assets/eventsIcon.png';
import UsersIcon from '../../assets/mask-group-51@2x.png';
import DatabaseIcon from '../../assets/databaseIcon.png';
import UserAvatar from '../../assets/7bb764a0137abc7a8142b6438e529133@2x.png';
import { ReactComponent as LogoutIcon2 } from '../../assets/log-out.svg';
import Applause from '../../assets/applause.png';

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
    title: 'Baza Danych',
    icon: DatabaseIcon,
    handler: 'navigateToDatabase',
  },  {
    title: 'Użytkownicy',
    icon: UsersIcon,
    handler: 'navigateToUsers',
  },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user,  logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handlers: { [key: string]: () => void } = {
    navigateToUsers: useCallback(() => navigate('/uzytkownicy'), [navigate]),
    navigateToExhibitors: useCallback(() => navigate('/wystawcy'), [navigate]),
    navigateToEvents: useCallback(() => navigate('/wydarzenia'), [navigate]),
    navigateToDatabase: useCallback(() => navigate('/baza-danych'), [navigate]),
  };

  return (
    <>
    <Box className={styles.dashboardPage}>
      <Box>
      <Box className={styles.dashboardNavigationContainer}>
        <Box className={styles.header}>
          <Menu/> 
          <CustomButton 
          disableRipple
          textColor='#060606ff'
          fontSize="0.75em;"
          className={styles.logOutButton}
          onClick={handleLogout}
          icon={<LogoutIcon2 style={{ color: "#6F6F6F", height:"1.25em"}}/>} 
          iconPosition="top" 
          withBorder={false}
          width="auto"
          height="auto"
          sx={{ 
              backgroundColor:'transparent',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#060606ff',
              },
            }}
        >
          Wyloguj
          </CustomButton>
          <Box className={styles.welcomeMessage}>
            <Avatar 
              src={(user as any)?.avatarUrl || UserAvatar}
              alt={user?.firstName || 'User'} 
              className={styles.avatar} 
              onClick={()=>console.log("")}
            />
            <Box> 
              <CustomTypography className={styles.welcomeMessageTitle}> Dzień dobry, {user?.firstName || 'Użytkowniku'} 
                <img
                  src={Applause}
                  alt='Applause'
                  className={styles.applausepng}
                 />
              </CustomTypography>
              <CustomTypography className={styles.welcomeMessageText}>Sprawdź co możesz dzisiaj zrobić!</CustomTypography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Container   
       maxWidth={false}  
       sx={{ maxWidth: '78%' }}
       className={styles.contentWrapper}
       >
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            minWidth: '100%',
            gap: '1em',
            '@media (max-width: 480px)': {
             gridTemplateColumns: '1fr',
             }
          }}
        > 
          {dashboardItems.map((item: DashboardItem) => (
            <Box key={item.title}>
              <Card className={styles.card} onClick={handlers[item.handler]}>
                <CardContent className={styles.cardContent}>
                  <img src={item.icon} alt={item.title} className={styles.cardIcon} />
                  <CustomTypography className={styles.cardTitle}>
                    {item.title}
                  </CustomTypography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>
      </Box>
      <Box className={styles.footer}>
        <CustomTypography className={styles.cc}>
          Kontakt • Polityka prywatności • www.warsawexpo.eu
        </CustomTypography>
      </Box>
    </Box>
    
     <Box className={styles.filtr}>
      <Box className={styles.filtrGray}/>
      <Box className={styles.filtrBlue}/>
    </Box>
    </>
  );
};

export default DashboardPage; 