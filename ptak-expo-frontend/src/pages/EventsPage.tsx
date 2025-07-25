import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/menu/Menu';
import AddEventModal from '../components/AddEventModal';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';
import { fetchExhibitions, Exhibition } from '../services/api';
import {
  Box,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ReactComponent as LogoutIcon } from '../assets/log-out.svg';
import styles from './EventsPage.module.scss';
import EventsPageIcon from '../assets/mask-group-5@2x.png';

const EventsPage: React.FC = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const loadExhibitions = useCallback(async (): Promise<void> => {
    if (!token) {
      setError('Brak autoryzacji. Proszę się zalogować.');
      logout();
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const fetchedExhibitions = await fetchExhibitions(token);
      setExhibitions(fetchedExhibitions);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać wydarzeń');
      if (err.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    loadExhibitions();
  }, [loadExhibitions]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleOpenModal = useCallback(() => {
    setIsAddEventModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddEventModalOpen(false);
  }, []);

  const handleEventAdded = useCallback(() => {
    setIsAddEventModalOpen(false);
    loadExhibitions(); // Odśwież listę wydarzeń po dodaniu nowego
  }, [loadExhibitions]);

  const handleEventClick = useCallback((eventId: number) => {
    navigate(`/wydarzenia/${eventId}`);
  }, [navigate]);

  const formatDateRange = useCallback((startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startFormatted = start.toLocaleDateString('pl-PL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    const endFormatted = end.toLocaleDateString('pl-PL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    return `${startFormatted} - ${endFormatted}`;
  }, []);

  const upcomingEvents = exhibitions.filter(event => 
    new Date(event.start_date) >= new Date() || event.status === 'active'
  );

  if (loading) {
    return (
      <Box className={styles.eventsPage}>
        <Menu />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={styles.eventsPage}>
        <Menu />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <>
    <Box className={styles.eventsPage}>
      <Box>
        <Box className={styles.eventsNavigationContainer}>
          <Box className={styles.header}>
            <Menu /> 
            <CustomButton 
              disableRipple
              textColor='#060606ff'
              fontSize="0.75em;"
              className={styles.logOutButton}
              onClick={handleLogout}
              icon={<LogoutIcon style={{ color: "#6F6F6F", height:"1.25em"}}/>} 
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
            <Box className={styles.titleContainer}>
              <img src={EventsPageIcon} alt="Wydarzenia" className={styles.titleIcon} />
              <Box>
                <CustomTypography className={styles.pageTitle}>
                  Baza wydarzeń
                </CustomTypography>
                <CustomTypography className={styles.pageSubtitle}>
                  Zarządzaj wszystkimi wydarzeniami
                </CustomTypography>
              </Box>
            </Box>
          </Box>
        </Box>
        <Container   
         maxWidth={false}  
         sx={{ maxWidth: '78%' }}
         className={styles.contentWrapper}
         >
          <Box className={styles.actionButtonsContainer}>
            <CustomButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenModal}
              bgColor="#6F87F6"
              textColor="#fff"
              width="auto"
              height="auto"
              sx={{ padding: '10px 20px' }}
            >
              Dodaj wydarzenie
            </CustomButton>
          </Box>

        <Box sx={{ mb: 3 }}>
          <CustomTypography fontSize="1.5rem" fontWeight={500}>
            Nadchodzące Wydarzenia:
          </CustomTypography>
        </Box>

        <Box className={styles.eventsGrid}>
          {upcomingEvents.map((exhibition) => (
            <Card 
              key={exhibition.id} 
              className={styles.eventCard}
              onClick={() => handleEventClick(exhibition.id)}
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent className={styles.eventContent}>
                <Box className={styles.eventImage}>
                  <img
                    src="/assets/zrzut-ekranu-2025059-o-135948@2x.png"
                    alt={exhibition.name}
                    className={styles.eventImg}
                  />
                </Box>
                                 <Box className={styles.eventInfo}>
                   <Box sx={{ mb: 1 }}>
                     <CustomTypography fontSize="1.25rem" fontWeight={600}>
                       {exhibition.name}
                     </CustomTypography>
                   </Box>
                   <Box sx={{ mb: 1 }}>
                     <CustomTypography fontSize="0.875rem" color="#6c757d">
                       {formatDateRange(exhibition.start_date, exhibition.end_date)}
                     </CustomTypography>
                   </Box>
                   {exhibition.location && (
                     <Box sx={{ mb: 1 }}>
                       <CustomTypography fontSize="0.875rem" color="#6c757d">
                         📍 {exhibition.location}
                       </CustomTypography>
                     </Box>
                   )}
                   {exhibition.description && (
                     <CustomTypography fontSize="0.875rem" color="#6c757d">
                       {exhibition.description}
                     </CustomTypography>
                   )}
                 </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

          {upcomingEvents.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CustomTypography fontSize="1.125rem" color="#6c757d">
                Brak nadchodzących wydarzeń
              </CustomTypography>
            </Box>
          )}
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
    
    <AddEventModal
      isOpen={isAddEventModalOpen}
      onClose={handleCloseModal}
      onEventAdded={handleEventAdded}
    />
    </>
  );
};

export default EventsPage; 