import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/menu/Menu';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';
import CustomLink from '../components/customLink/CustomLink';
// import TradeInfo from '../components/TradeInfo';
import TradeFairInformationContent from '../components/eventComponents/tradeFairInformation/tradeFairInformationContent/TradeFairInformationContent';
import BrandingContent from '../components/eventComponents/branding/brandingContent/BrandingContent';
// import Invitations from '../components/Invitations';
import InvitationsContent from '../components/eventComponents/invitations/invitationsContent/InvitationsContent';
import TradeFairEventsContent from '../components/eventComponents/tradeFairEvents/tradeFairEventsContent/TradeFairEventsContent';
import PushNotificationContent from '../components/eventComponents/pushNotification/pushNotificationContent/PushNotificationContent';
import { getBrandingFileUrl } from '../services/api';
import { 
  fetchExhibition, 
  Exhibition, 
  getBrandingFiles, 
  BrandingFilesResponse,
  deleteExhibition 
} from '../services/api';
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
import { ReactComponent as LogoutIcon } from '../assets/log-out.svg';
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
  const { id } = useParams<{ id: string }>();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [brandingFiles, setBrandingFiles] = useState<BrandingFilesResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  // trade events state moved to TradeFairEventsContent
  // dateOnly/timeHM moved with trade events
  // trade events form options moved to TradeFairEventsContent
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const loadExhibition = useCallback(async (): Promise<void> => {
    if (!id) {
      setError('Nieprawidłowe ID wydarzenia.');
      return;
    }

    try {
      setLoading(true);
      const fetchedExhibition = await fetchExhibition(parseInt(id), token || undefined);
      setExhibition(fetchedExhibition);
      setError('');
      
      // Load branding files for current user
      if (token && user) {
        // Call after loadBrandingFiles is defined
        const exhibitorId = null; // Global event files
        setTimeout(() => loadBrandingFiles(exhibitorId, fetchedExhibition.id), 0);
      }
      // trade events are handled inside TradeFairEventsContent
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać danych wydarzenia');
      if (err.message.includes('401') && token) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, user, logout, navigate]);

  useEffect(() => {
    loadExhibition();
  }, [loadExhibition]);

  const handleBack = useCallback(() => {
    navigate('/wydarzenia');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

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

  // Load branding files for current user
  const loadBrandingFiles = useCallback(async (exhibitorId: number | null, exhibitionId: number) => {
    if (!token) {
      return;
    }

    try {
      const files = await getBrandingFiles(exhibitorId, exhibitionId, token);
      setBrandingFiles(files);
    } catch (error: any) {
      console.error('Error loading branding files:', error);
      if (error.message.includes('401')) {
        logout();
        navigate('/login');
      }
    }
  }, [token, logout, navigate]);

  // (branding Tab moved to BrandingContent component)

  // Handle exhibition deletion
  const handleDeleteExhibition = useCallback(async () => {
    if (!exhibition || !token || !id) {
      setError('Brak danych wydarzenia lub autoryzacji');
      return;
    }

    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć wydarzenie "${exhibition.name}"?\n\n` +
      `⚠️ UWAGA: Ta operacja:\n` +
      `• Usunie WSZYSTKIE dane wydarzenia z bazy danych\n` +
      `• Usunie WSZYSTKIE pliki z dysku\n` +
      `• Usunie wszystkich wystawców przypisanych do wydarzenia\n` +
      `• Usunie wszystkie zaproszenia i informacje targowe\n\n` +
      `Ta operacja jest NIEODWRACALNA!`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError('');
      
      await deleteExhibition(parseInt(id), token);
      
      alert(`Wydarzenie "${exhibition.name}" zostało całkowicie usunięte.`);
      navigate('/wydarzenia');
      
    } catch (err: any) {
      console.error('Error deleting exhibition:', err);
      setError(err.message || 'Błąd podczas usuwania wydarzenia');
      
      if (err.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setDeleteLoading(false);
    }
  }, [exhibition, token, id, navigate, logout]);

  // trade events handlers moved to TradeFairEventsContent

  if (loading) {
    return (
      <>
      <Box className={styles.eventDetailPage}>
        <Box>
          <Box className={styles.eventDetailNavigationContainer}>
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

  if (error || !exhibition) {
    return (
      <>
      <Box className={styles.eventDetailPage}>
        <Box>
          <Box className={styles.eventDetailNavigationContainer}>
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
    <Box className={styles.eventDetailPage}>
      <Box>
        <Box className={styles.eventDetailNavigationContainer}>
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
        {/* Header with back link */}
        <Box className={styles.pageHeaderRow}>
          <Box className={styles.titleContainer}>
            <img src={EventsPageIcon} alt="Wydarzenia" className={styles.titleIcon} />
            <CustomTypography fontSize="2rem" fontWeight={600}>
              Szczegóły Wydarzenia
            </CustomTypography>
          </Box>
          <CustomLink
            onClick={(e) => { e.preventDefault(); handleBack(); }}
            fontSize="0.875rem"
            fontWeight={400}
            color="#6F87F6"
            hoverColor="#5041d0"
            className={styles.backLink}
          >
            Wróć do listy
          </CustomLink>
        </Box>

        {/* Main content with two columns */}
        <Box className={styles.mainContent}>
          {/* Left column - Event Card */}
          <Box className={styles.leftColumn}>
            <Card className={styles.eventCard}>
              <CardContent className={styles.eventContent}>
                <Box className={styles.eventImage}>
                  <img
                    src={brandingFiles?.files['event_logo'] && token ? getBrandingFileUrl(null, brandingFiles.files['event_logo'].fileName, token) : '/assets/zrzut-ekranu-2025059-o-135948@2x.png'}
                    alt={exhibition.name}
                    className={styles.eventImg}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    id="event-logo-input"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !exhibition || !token) return;
                      try {
                        // Reuse upload API for global file with new fileType
                        const { uploadBrandingFile } = await import('../services/api');
                        await uploadBrandingFile(file, null, exhibition.id, 'event_logo', token);
                        loadBrandingFiles(null, exhibition.id);
                      } catch (err) {
                        console.error('Upload event logo failed', err);
                      }
                    }}
                  />
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = document.getElementById('event-logo-input') as HTMLInputElement | null;
                      input?.click();
                    }}
                    sx={{ position: 'absolute', top: 8, right: 8, cursor: 'pointer', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '12px', padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    edycja
                  </Box>
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
                  
                  {/* Delete Exhibition Button */}
                  <Box sx={{ mt: 2 }}>
                    <CustomButton
                      onClick={handleDeleteExhibition}
                      disabled={deleteLoading}
                      bgColor="#dc3545"
                      textColor="#fff"
                      width="auto"
                      height="36px"
                      fontSize="0.75rem"
                      sx={{
                        '&:hover': {
                          backgroundColor: '#c82333',
                        },
                        '&:disabled': {
                          backgroundColor: '#6c757d',
                          cursor: 'not-allowed',
                        },
                      }}
                    >
                      {deleteLoading ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1, color: '#fff' }} />
                          Usuwanie...
                        </>
                      ) : (
                        '🗑️ Usuń wydarzenie'
                      )}
                    </CustomButton>
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
                {exhibition && (
                  <BrandingContent event={exhibition} />
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {exhibition && (
                  <TradeFairInformationContent event={exhibition} />
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {exhibition && (
                  <InvitationsContent event={exhibition} />
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                {exhibition && (
                  <TradeFairEventsContent event={exhibition} />
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={4}>
                {exhibition && (
                  <PushNotificationContent event={exhibition} />
                )}
              </TabPanel>
            </Box>
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

export default EventDetailPage; 