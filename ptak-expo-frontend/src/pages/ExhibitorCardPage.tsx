import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/menu/Menu';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';
import { fetchExhibitor, deleteExhibitor, Exhibitor } from '../services/api';
import AssignEventModal from '../components/AssignEventModal';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import styles from './ExhibitorCardPage.module.scss';

// Import images from assets
import ExhibitorsPageIcon from '../assets/mask-group-6@2x.png';


const ExhibitorCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
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
    if (!token || !exhibitor) {
      setError('Brak autoryzacji lub danych wystawcy');
      return;
    }

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
    setAssignModalOpen(true);
  }, []);

  const handleAssignSuccess = useCallback((exhibitionName: string) => {
    // Reload exhibitor data to show new assignment
    loadExhibitor();
    
    // Show success message
    alert(`Wystawca "${exhibitor?.companyName}" został pomyślnie przypisany do wydarzenia "${exhibitionName}"`);
  }, [loadExhibitor, exhibitor]);

  const handleCloseAssignModal = useCallback(() => {
    setAssignModalOpen(false);
  }, []);

  const handleSelectEvent = useCallback((eventId: number) => {
    if (exhibitor) {
      navigate(`/wystawcy/${exhibitor.id}/wydarzenie/${eventId}`);
    }
  }, [exhibitor, navigate]);

  // Helper function to format event dates
  const formatEventDates = (startDate: string, endDate: string) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return `${formatDate(startDate)}-${formatDate(endDate)}`;
  };

  if (loading) {
    return (
      <Box className={styles.exhibitorCardPage}>
        <Box className={styles.header}>
          <Menu />
        </Box>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !exhibitor) {
    return (
      <Box className={styles.exhibitorCardPage}>
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
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
    );
  }

  return (
    <>
    <Box className={styles.exhibitorCardPage}>
      {/* Header Section - same structure as other pages */}
      <Box className={styles.dashboardNavigationContainer}>
        <Box className={styles.header}>
          <Menu />
        </Box>
      </Box> 
      
      {/* Logout Button - fixed position */}
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

      {/* Main Content - use Container like other pages */}
      <Container   
        maxWidth={false}  
        sx={{ maxWidth: '90%' }}
        className={styles.contentWrapper}
      >
        {/* Title Section */}
        <Box className={styles.titleSection}>
          <Box className={styles.titleContainer}>
            <img src={ExhibitorsPageIcon} alt="Wystawcy" className={styles.titleIcon} />
            <CustomTypography fontSize="1.125rem" fontWeight={500} color="#5041d0">
              Wystawcy
            </CustomTypography>
          </Box>
          <CustomTypography fontSize="0.6875rem" color="#6f6f6f" className={styles.breadcrumb}>
            Home / Baza wystawców / {exhibitor.companyName}
          </CustomTypography>
        </Box>

        {/* Main Card */}
        <Box className={styles.mainCard}>
          {/* Exhibitor Details Section */}
          <Box className={styles.exhibitorSection}>
            <Box className={styles.exhibitorCard}>
              <Box className={styles.exhibitorHeader}>
                <Box className={styles.nameSection}>
                  <CustomTypography fontSize="1rem" fontWeight={500} color="#2e2e38">
                    Nazwa Wystawcy:
                  </CustomTypography>
                  <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                    {exhibitor.companyName}
                  </CustomTypography>
                </Box>
                
                <Box className={styles.contactSection}>
                  <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                    Dane kontakowe:
                  </CustomTypography>
                  <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                    {exhibitor.contactPerson}
                  </CustomTypography>
                </Box>
              </Box>

              <Box className={styles.contactDetails}>
                <Box className={styles.emailRow}>
                  <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                    e-mail:
                  </CustomTypography>
                  <CustomTypography fontSize="0.9375rem" color="#2e2e38">
                    {exhibitor.email}
                  </CustomTypography>
                </Box>
                
                <Box className={styles.phoneRow}>
                  <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                    Tel.:
                  </CustomTypography>
                  <CustomTypography fontSize="0.9375rem" color="#2e2e38">
                    {exhibitor.phone}
                  </CustomTypography>
                  <CustomButton
                    onClick={handleDeleteExhibitor}
                    bgColor="transparent"
                    textColor="#ff4444"
                    width="auto"
                    height="24px"
                    fontSize="0.6875rem"
                    className={styles.deleteButton}
                    startIcon={<DeleteIcon sx={{ fontSize: '1rem' }} />}
                  >
                    usuń
                  </CustomButton>
                </Box>
              </Box>

              <Box className={styles.addressSection}>
                <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                  NIP: {exhibitor.nip}
                </CustomTypography>
                <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                  Adres: {exhibitor.address}, {exhibitor.postalCode} {exhibitor.city}
                </CustomTypography>
              </Box>
            </Box>

            {/* Categories Section */}
            <Box className={styles.categoriesSection}>
              <Box className={styles.categoryItem}>
                <Box className={styles.categoryIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#6F87F6"/>
                  </svg>
                </Box>
                <CustomTypography fontSize="0.875rem" color="#2e2e38">
                  Wpis do katalogu
                </CustomTypography>
              </Box>
              
              <Box className={styles.categoryItem}>
                <Box className={styles.categoryIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5Z" fill="#6F87F6"/>
                  </svg>
                </Box>
                <CustomTypography fontSize="0.875rem" color="#2e2e38">
                  Dokumenty
                </CustomTypography>
              </Box>
              
              <Box className={styles.categoryItem}>
                <Box className={styles.categoryIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#6F87F6"/>
                  </svg>
                </Box>
                <CustomTypography fontSize="0.875rem" color="#2e2e38">
                  Zaproszenia
                </CustomTypography>
              </Box>
              
              <Box className={styles.categoryItem}>
                <Box className={styles.categoryIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 6C13.93 6 15.5 7.57 15.5 9.5S13.93 13 12 13S8.5 11.43 8.5 9.5S10.07 6 12 6ZM19 19H5V17.5C5 15.56 8.94 14.5 12 14.5S19 15.56 19 17.5V19Z" fill="#6F87F6"/>
                  </svg>
                </Box>
                <CustomTypography fontSize="0.875rem" color="#2e2e38">
                  Plan wydarzeń
                </CustomTypography>
              </Box>
              
              <Box className={styles.categoryItem}>
                <Box className={styles.categoryIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#6F87F6"/>
                  </svg>
                </Box>
                <CustomTypography fontSize="0.875rem" color="#2e2e38">
                  Identyfikatory
                </CustomTypography>
              </Box>
              
              <Box className={styles.categoryItem}>
                <Box className={styles.categoryIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9L17 13.74L18.18 20.66L12 17.27L5.82 20.66L7 13.74L2 9L8.91 8.26L12 2Z" fill="#6F87F6"/>
                  </svg>
                </Box>
                <CustomTypography fontSize="0.875rem" color="#2e2e38">
                  Nagrody Targowe
                </CustomTypography>
              </Box>
            </Box>
          </Box>

          {/* Events Section */}
          <Box className={styles.eventsSection}>
            <CustomTypography fontSize="1rem" fontWeight={500} color="#2e2e38" className={styles.eventsTitle}>
              Wydarzenie:
            </CustomTypography>
            
            {exhibitor.events && exhibitor.events.length > 0 ? (
              <Box className={styles.eventsContainer}>
                {exhibitor.events.map((event) => (
                  <Box 
                    key={event.id} 
                    className={styles.eventCard}
                    onClick={() => handleSelectEvent(event.id)}
                  >
                    <img 
                      src="/assets/4515f4ed2e86e01309533e2483db0fd4@2x.png" 
                      alt="Event" 
                      className={styles.eventImage}
                    />
                    <Box className={styles.eventContent}>
                      <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                        {event.name}
                      </CustomTypography>
                      <CustomTypography fontSize="0.9375rem" color="#2e2e38">
                        {formatEventDates(event.start_date, event.end_date)}
                      </CustomTypography>
                    </Box>
                    <Box className={styles.readinessSection}>
                      <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                        Gotowość:
                      </CustomTypography>
                      <Box className={styles.readinessBar}>
                        <CustomTypography fontSize="1rem" fontWeight={700} color="#fff">
                          21%
                        </CustomTypography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box className={styles.noEventsContainer}>
                <CustomTypography fontSize="0.875rem" color="#6f6f6f">
                  Brak przypisanych wydarzeń
                </CustomTypography>
              </Box>
            )}

            <CustomButton
              onClick={handleAddEvent}
              bgColor="#6F87F6"
              textColor="#fff"
              width="auto"
              height="40px"
              fontSize="0.875rem"
              className={styles.addEventButton}
              startIcon={<AddIcon />}
            >
              🎯 Dodaj wydarzenie
            </CustomButton>
          </Box>
        </Box>
      </Container>
      
      <Box className={styles.footer}>
        <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
          Kontakt • Polityka prywatności • www.warsawexpo.eu
        </CustomTypography>
      </Box>
    </Box>
    
    {/* Assign Event Modal */}
    {exhibitor && (
      <AssignEventModal
        open={assignModalOpen}
        onClose={handleCloseAssignModal}
        exhibitorId={exhibitor.id}
        exhibitorName={exhibitor.companyName}
        onAssignSuccess={handleAssignSuccess}
        existingEventIds={exhibitor.events?.map(event => event.id) || []}
      />
    )}
    </>
  );
};

export default ExhibitorCardPage;