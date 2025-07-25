import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/Menu';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';
import { fetchExhibition, Exhibition } from '../services/api';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styles from './EventDetailPage.module.scss';

// Import images
import EventsPageIcon from '../assets/mask-group-5@2x.png';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const loadExhibition = useCallback(async (): Promise<void> => {
    if (!eventId) {
      setError('Nieprawidłowe ID wydarzenia.');
      return;
    }

    try {
      setLoading(true);
      const fetchedExhibition = await fetchExhibition(parseInt(eventId), token || undefined);
      setExhibition(fetchedExhibition);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać danych wydarzenia');
      if (err.message.includes('401') && token) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [eventId, token, logout, navigate]);

  useEffect(() => {
    loadExhibition();
  }, [loadExhibition]);

  const handleBack = useCallback(() => {
    navigate('/wydarzenia');
  }, [navigate]);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

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

  if (loading) {
    return (
      <Box className={styles.eventDetailPage}>
        <Menu />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !exhibition) {
    return (
      <Box className={styles.eventDetailPage}>
        <Menu />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Nie znaleziono wydarzenia'}
          </Alert>
          <CustomButton
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            bgColor="#6F87F6"
            textColor="#fff"
            width="auto"
            height="40px"
          >
            Wróć do listy wydarzeń
          </CustomButton>
        </Container>
      </Box>
    );
  }

  return (
    <Box className={styles.eventDetailPage}>
      <Menu />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header with back button */}
        <Box className={styles.header}>
          <Box className={styles.titleContainer}>
            <img src={EventsPageIcon} alt="Wydarzenia" className={styles.titleIcon} />
            <CustomTypography fontSize="2rem" fontWeight={600}>
              Szczegóły Wydarzenia
            </CustomTypography>
          </Box>
          <CustomButton
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
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
            Wróć do listy
          </CustomButton>
        </Box>

        {/* Main content with two columns */}
        <Box className={styles.mainContent}>
          {/* Left column - Event Card */}
          <Box className={styles.leftColumn}>
            <Card className={styles.eventCard}>
              <CardContent className={styles.eventContent}>
                <Box className={styles.eventImage}>
                  <img
                    src="/assets/zrzut-ekranu-2025059-o-135948@2x.png"
                    alt={exhibition.name}
                    className={styles.eventImg}
                  />
                </Box>
                <Box className={styles.eventInfo}>
                  <Box sx={{ mb: 2 }}>
                    <CustomTypography fontSize="1.5rem" fontWeight={600}>
                      {exhibition.name}
                    </CustomTypography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <CustomTypography fontSize="1rem" color="#6c757d">
                      {formatDateRange(exhibition.start_date, exhibition.end_date)}
                    </CustomTypography>
                  </Box>
                  {exhibition.location && (
                    <Box sx={{ mb: 1 }}>
                      <CustomTypography fontSize="1rem" color="#6c757d">
                        📍 {exhibition.location}
                      </CustomTypography>
                    </Box>
                  )}
                  {exhibition.description && (
                    <Box sx={{ mt: 2 }}>
                      <CustomTypography fontSize="0.875rem" color="#6c757d">
                        {exhibition.description}
                      </CustomTypography>
                    </Box>
                  )}
                  <Box sx={{ mt: 2, p: 1, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <CustomTypography fontSize="0.75rem" color="#6c757d">
                      Status: <strong>{exhibition.status}</strong>
                    </CustomTypography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Right column - Tabbed content */}
          <Box className={styles.rightColumn}>
            <Box className={styles.tabsContainer}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                className={styles.tabs}
                sx={{
                  '& .MuiTab-root': {
                    color: '#6c757d',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    minWidth: 'auto',
                    padding: '12px 16px',
                  },
                  '& .Mui-selected': {
                    color: '#6F87F6 !important',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#6F87F6',
                  },
                }}
              >
                <Tab label="Branding wystawcy" />
                <Tab label="Informacje targowe" />
                <Tab label="Zaproszenia" />
                <Tab label="Wydarzenia targowe" />
                <Tab label="Powiadomienia Push" />
              </Tabs>

              {/* Tab panels */}
              <TabPanel value={activeTab} index={0}>
                <Box className={styles.tabContent}>
                  <CustomTypography fontSize="1.25rem" fontWeight={600} sx={{ mb: 2 }}>
                    Branding wystawcy
                  </CustomTypography>
                  <Box className={styles.brandingSection}>
                    <CustomTypography fontSize="1rem" sx={{ mb: 2 }}>
                      Materiały brandingowe i promocyjne dla wydarzenia
                    </CustomTypography>
                    
                    <Box className={styles.brandingCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Logotypy i grafiki
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Dodaj logotypy wystawców i materiały promocyjne
                      </CustomTypography>
                      <CustomButton
                        bgColor="#6F87F6"
                        textColor="#fff"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                      >
                        Zarządzaj materiałami
                      </CustomButton>
                    </Box>

                    <Box className={styles.brandingCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Katalog wystawców
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Przygotuj i zarządzaj katalogiem wszystkich wystawców
                      </CustomTypography>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                        sx={{ border: '1px solid #6F87F6' }}
                      >
                        Edytuj katalog
                      </CustomButton>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box className={styles.tabContent}>
                  <CustomTypography fontSize="1.25rem" fontWeight={600} sx={{ mb: 2 }}>
                    Informacje targowe
                  </CustomTypography>
                  <Box className={styles.tradeInfoSection}>
                    <CustomTypography fontSize="1rem" sx={{ mb: 2 }}>
                      Szczegółowe informacje o targach i warunkach uczestnictwa
                    </CustomTypography>
                    
                    <Box className={styles.infoCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Regulamin targów
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Warunki uczestnictwa i przepisy targowe
                      </CustomTypography>
                      <CustomButton
                        bgColor="#6F87F6"
                        textColor="#fff"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                      >
                        Pobierz regulamin
                      </CustomButton>
                    </Box>

                    <Box className={styles.infoCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Plan hal i stoiska
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Mapa hal targowych i rozmieszczenie stoisk
                      </CustomTypography>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                        sx={{ border: '1px solid #6F87F6' }}
                      >
                        Zobacz plan
                      </CustomButton>
                    </Box>

                    <Box className={styles.infoCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Harmonogram wydarzenia
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Szczegółowy plan dni targowych
                      </CustomTypography>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                        sx={{ border: '1px solid #6F87F6' }}
                      >
                        Zobacz harmonogram
                      </CustomButton>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box className={styles.tabContent}>
                  <CustomTypography fontSize="1.25rem" fontWeight={600} sx={{ mb: 2 }}>
                    Zaproszenia
                  </CustomTypography>
                  <Box className={styles.invitationsSection}>
                    <CustomTypography fontSize="1rem" sx={{ mb: 2 }}>
                      Zarządzaj zaproszeniami dla wystawców i gości
                    </CustomTypography>
                    
                    <Box className={styles.invitationCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Zaproszenia dla wystawców
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Wyślij zaproszenia do zarejestrowanych wystawców
                      </CustomTypography>
                      <CustomButton
                        bgColor="#6F87F6"
                        textColor="#fff"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                      >
                        Wyślij zaproszenia
                      </CustomButton>
                    </Box>

                    <Box className={styles.invitationCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Zaproszenia VIP
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Specjalne zaproszenia dla gości VIP
                      </CustomTypography>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                        sx={{ border: '1px solid #6F87F6' }}
                      >
                        Zarządzaj VIP
                      </CustomButton>
                    </Box>

                    <Box className={styles.invitationCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Szablony zaproszeń
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Edytuj i personalizuj szablony zaproszeń  
                      </CustomTypography>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                        sx={{ border: '1px solid #6F87F6' }}
                      >
                        Edytuj szablony
                      </CustomButton>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <Box className={styles.tabContent}>
                  <CustomTypography fontSize="1.25rem" fontWeight={600} sx={{ mb: 2 }}>
                    Wydarzenia targowe
                  </CustomTypography>
                  <Box className={styles.tradeEventsSection}>
                    <CustomTypography fontSize="1rem" sx={{ mb: 2 }}>
                      Dodatkowe wydarzenia i aktywności podczas targów
                    </CustomTypography>
                    
                    <Box className={styles.eventCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Konferencje i seminaria
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Organizuj prezentacje i wykłady branżowe
                      </CustomTypography>
                      <CustomButton
                        bgColor="#6F87F6"
                        textColor="#fff"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                      >
                        Dodaj wydarzenie
                      </CustomButton>
                    </Box>

                    <Box className={styles.eventCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Networking
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Wydarzenia networkingowe dla uczestników
                      </CustomTypography>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                        sx={{ border: '1px solid #6F87F6' }}
                      >
                        Organizuj networking
                      </CustomButton>
                    </Box>

                    <Box className={styles.eventCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Konkursy i nagrody
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Zagosuj konkursy dla wystawców
                      </CustomTypography>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                        sx={{ border: '1px solid #6F87F6' }}
                      >
                        Zarządzaj konkursami
                      </CustomButton>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={4}>
                <Box className={styles.tabContent}>
                  <CustomTypography fontSize="1.25rem" fontWeight={600} sx={{ mb: 2 }}>
                    Powiadomienia Push
                  </CustomTypography>
                  <Box className={styles.notificationsSection}>
                    <CustomTypography fontSize="1rem" sx={{ mb: 2 }}>
                      Wyślij powiadomienia do uczestników wydarzenia
                    </CustomTypography>
                    
                    <Box className={styles.notificationCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Ogłoszenia targowe
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Informacje o rozpoczęciu, przerwach i zakończeniu
                      </CustomTypography>
                      <CustomButton
                        bgColor="#6F87F6"
                        textColor="#fff"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                      >
                        Wyślij ogłoszenie
                      </CustomButton>
                    </Box>

                    <Box className={styles.notificationCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Przypomnienia
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Automatyczne przypomnienia o ważnych terminach
                      </CustomTypography>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                        sx={{ border: '1px solid #6F87F6' }}
                      >
                        Ustaw przypomnienia
                      </CustomButton>
                    </Box>

                    <Box className={styles.notificationCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Wydarzenia specjalne
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d" sx={{ mb: 2 }}>
                        Powiadomienia o konkursach i dodatkowych atrakcjach
                      </CustomTypography>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="36px"
                        fontSize="0.75rem"
                        sx={{ border: '1px solid #6F87F6' }}
                      >
                        Powiadom o wydarzenia
                      </CustomButton>
                    </Box>

                    <Box className={styles.notificationHistory}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500} sx={{ mb: 1 }}>
                        Historia powiadomień
                      </CustomTypography>
                      <Box className={styles.historyList}>
                        <Box className={styles.historyItem}>
                          <CustomTypography fontSize="0.75rem" sx={{ mb: 0.5 }}>
                            "Rozpoczęcie rejestracji na targi" - wysłano 2 dni temu
                          </CustomTypography>
                          <CustomTypography fontSize="0.65rem" color="#6c757d">
                            Dostarczono do 156 odbiorców
                          </CustomTypography>
                        </Box>
                        <Box className={styles.historyItem}>
                          <CustomTypography fontSize="0.75rem" sx={{ mb: 0.5 }}>
                            "Przypomnienie o terminie zgłoszeń" - wysłano 5 dni temu
                          </CustomTypography>
                          <CustomTypography fontSize="0.65rem" color="#6c757d">
                            Dostarczono do 203 odbiorców
                          </CustomTypography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default EventDetailPage; 