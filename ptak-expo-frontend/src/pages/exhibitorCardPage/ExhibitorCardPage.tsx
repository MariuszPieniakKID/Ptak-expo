import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Menu from '../../components/menu/Menu';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import { fetchExhibitor, deleteExhibitor, Exhibitor } from '../../services/api';
import {
  Box,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { ReactComponent as LogoutIcon } from '../../assets/log-out.svg';
import styles from './ExhibitorCardPage.module.scss';
import ExhibitorsPageIcon from '../../assets/mask-group-6@2x.png';
import EventImage1 from '../../assets/image-35@2x.png';
import EventImage2 from '../../assets/mask-group-28@2x.png';

const ExhibitorCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const loadExhibitor = useCallback(async (): Promise<void> => {
    if (!token || !id) {
      setError('Brak autoryzacji lub nieprawidłowe ID wystawcy.');
      logout();
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const fetchedExhibitor = await fetchExhibitor(parseInt(id), token);
      setExhibitor(fetchedExhibitor);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać danych wystawcy');
      if (err.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, id, logout, navigate]);

  useEffect(() => {
    loadExhibitor();
  }, [loadExhibitor]);

  const handleBack = useCallback(() => {
    navigate('/wystawcy');
  }, [navigate]);

  const handleDeleteExhibitor = useCallback(async () => {
    if (!token || !exhibitor) return;
    
    if (window.confirm(`Czy na pewno chcesz usunąć wystawcę "${exhibitor.companyName}"?`)) {
      try {
        await deleteExhibitor(exhibitor.id, token);
        navigate('/wystawcy');
      } catch (err: any) {
        setError(err.message || 'Błąd podczas usuwania wystawcy');
      }
    }
  }, [exhibitor, token, navigate]);

  const handleAddEvent = useCallback(() => {
    console.log('Add event for exhibitor:', exhibitor?.id);
    // In real app would open modal or navigate to add event page
  }, [exhibitor]);

  const handleSelectEvent = useCallback((eventId: number) => {
    if (exhibitor) {
      navigate(`/wystawcy/${exhibitor.id}/wydarzenie/${eventId}`);
    }
  }, [exhibitor, navigate]);

  const formatDateRange = useCallback((startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startFormatted = start.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const endFormatted = end.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    return `${startFormatted}-${endFormatted}`;
  }, []);

  const getEventImage = useCallback((index: number): string => {
    // Rotate between available images
    return index % 2 === 0 ? EventImage1 : EventImage2;
  }, []);

  const getEventReadiness = useCallback((eventId: number): number => {
    // Mock readiness based on event ID - in real app would come from API
    return eventId % 3 === 0 ? 21 : 65;
  }, []);

  if (loading) {
    return (
      <>
      <Box className={styles.exhibitorCardPage}>
        <Box>
          <Box className={styles.exhibitorCardNavigationContainer}>
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
            </Box>
          </Box>
          <Container   
           maxWidth={false}  
           sx={{ maxWidth: '78%' }}
           className={styles.contentWrapper}
           >
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
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
  }

  if (error || !exhibitor) {
    return (
      <>
      <Box className={styles.exhibitorCardPage}>
        <Box>
          <Box className={styles.exhibitorCardNavigationContainer}>
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
            </Box>
          </Box>
          <Container   
           maxWidth={false}  
           sx={{ maxWidth: '78%' }}
           className={styles.contentWrapper}
           >
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || 'Nie znaleziono wystawcy'}
            </Alert>
            <CustomButton
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              bgColor="#6F87F6"
              textColor="#fff"
              width="auto"
              height="40px"
            >
              Wróć do listy wystawców
            </CustomButton>
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
  }

  return (
    <>
    <Box className={styles.exhibitorCardPage}>
      <Box>
        <Box className={styles.exhibitorCardNavigationContainer}>
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
          </Box>
        </Box>
        <Container   
         maxWidth={false}  
         sx={{ maxWidth: '78%' }}
         className={styles.contentWrapper}
         >
        {/* Header with back button */}
        <Box className={styles.header}>
          <CustomButton
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            bgColor="transparent"
            textColor="#6F87F6"
            width="auto"
            height="40px"
            sx={{
              border: '1px solid #6F87F6',
              '&:hover': {
                backgroundColor: '#6F87F6',
                color: '#fff',
              },
            }}
          >
            wstecz
          </CustomButton>
        </Box>

        {/* Breadcrumbs */}
        <Box className={styles.breadcrumbs}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" onClick={() => navigate('/dashboard')}>
              Home
            </Link>
            <Link underline="hover" color="inherit" onClick={() => navigate('/wystawcy')}>
              Baza wystawców
            </Link>
            <CustomTypography color="#6f6f6f">
              {exhibitor.companyName}
            </CustomTypography>
          </Breadcrumbs>
        </Box>

        {/* Page Title */}
        <Box className={styles.pageTitle}>
          <div className={styles.titleContainer}>
            <img src={ExhibitorsPageIcon} alt="Wystawcy" className={styles.titleIcon} />
            <CustomTypography fontSize="1.125rem" fontWeight={600} color="#5041d0">
              Wystawcy
            </CustomTypography>
          </div>
        </Box>

        {/* Exhibitor Card */}
        <Card className={styles.exhibitorCard}>
          <CardContent className={styles.cardContent}>
            <Box className={styles.exhibitorInfo}>
              <Box className={styles.leftSection}>
                <Box className={styles.infoGroup}>
                  <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                    Nazwa Wystawcy:
                  </CustomTypography>
                  <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                    {exhibitor.companyName}
                  </CustomTypography>
                </Box>
                <Box className={styles.infoGroup}>
                  <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                    NIP: {exhibitor.nip}
                  </CustomTypography>
                </Box>
                <Box className={styles.infoGroup}>
                  <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                    Adres: {exhibitor.address}, {exhibitor.postalCode} {exhibitor.city}
                  </CustomTypography>
                </Box>
              </Box>

              <Box className={styles.rightSection}>
                <Box className={styles.infoGroup}>
                  <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                    Dane kontakowe:
                  </CustomTypography>
                  <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                    {exhibitor.contactPerson}
                  </CustomTypography>
                </Box>
                <Box className={styles.infoGroup}>
                  <CustomTypography fontSize="0.6875rem" color="#a7a7a7">
                    e-mail:
                  </CustomTypography>
                  <CustomTypography fontSize="0.9375rem" color="#2e2e38">
                    {exhibitor.email}
                  </CustomTypography>
                </Box>
                <Box className={styles.infoGroup}>
                  <CustomTypography fontSize="0.6875rem" color="#a7a7a7">
                    Tel.:
                  </CustomTypography>
                  <CustomTypography fontSize="0.9375rem" color="#2e2e38">
                    {exhibitor.phone}
                  </CustomTypography>
                </Box>
              </Box>

              <Box className={styles.actionSection}>
                <CustomButton
                  onClick={handleDeleteExhibitor}
                  startIcon={<DeleteIcon />}
                  bgColor="transparent"
                  textColor="#c7353c"
                  width="auto"
                  height="32px"
                  fontSize="0.8125rem"
                  sx={{
                    textDecoration: 'underline',
                    '&:hover': {
                      backgroundColor: '#c7353c',
                      color: '#fff',
                    },
                  }}
                >
                  usuń
                </CustomButton>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Planned Events Section */}
        <Box className={styles.eventsSection}>
          <Box className={styles.eventsSectionHeader}>
            <CustomTypography fontSize="0.6875rem" color="#2e2e38" fontWeight={500}>
              Zaplanowane wydarzenia wystawcy:
            </CustomTypography>
            <CustomButton
              onClick={handleAddEvent}
              startIcon={<AddIcon />}
              bgColor="transparent"
              textColor="#2e2e38"
              width="auto"
              height="32px"
              fontSize="0.8125rem"
              sx={{
                textDecoration: 'underline',
                '&:hover': {
                  backgroundColor: '#6F87F6',
                  color: '#fff',
                },
              }}
            >
              dodaj wydarzenie
            </CustomButton>
          </Box>

          <Box className={styles.eventsGrid}>
            {exhibitor.events && exhibitor.events.length > 0 ? (
              exhibitor.events.map((event, index) => {
                const readiness = getEventReadiness(event.id);
                return (
                  <Card key={event.id} className={styles.eventCard}>
                    <CardContent className={styles.eventContent}>
                      <Box className={styles.eventImageContainer}>
                        <img 
                          src={getEventImage(index)} 
                          alt={event.name}
                          className={styles.eventImage}
                        />
                      </Box>
                      <Box className={styles.eventInfo}>
                        <CustomTypography fontSize="0.875rem" fontWeight={500} color="#2e2e38">
                          {event.name}
                        </CustomTypography>
                        <CustomTypography fontSize="0.875rem" color="#2e2e38">
                          {formatDateRange(event.start_date, event.end_date)}
                        </CustomTypography>
                        <Box className={styles.eventActions}>
                          <CustomButton
                            onClick={() => handleSelectEvent(event.id)}
                            bgColor="#6F87F6"
                            textColor="#fff"
                            width="auto"
                            height="32px"
                            fontSize="0.875rem"
                          >
                            wybierz
                          </CustomButton>
                        </Box>
                      </Box>
                      <Box className={styles.readinessSection}>
                        <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                          Gotowość:
                        </CustomTypography>
                        <Box className={styles.readinessBar}>
                          <Box 
                            className={styles.readinessProgress}
                            style={{ 
                              width: `${readiness}%`,
                              backgroundColor: readiness > 50 ? '#99e307' : '#ec6a3a'
                            }}
                          >
                            <CustomTypography fontSize="1rem" fontWeight={700} color="#fff">
                              {readiness}%
                            </CustomTypography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CustomTypography fontSize="0.875rem" color="#6f6f6f">
                  Brak zaplanowanych wydarzeń dla tego wystawcy
                </CustomTypography>
              </Box>
            )}
          </Box>
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

export default ExhibitorCardPage; 