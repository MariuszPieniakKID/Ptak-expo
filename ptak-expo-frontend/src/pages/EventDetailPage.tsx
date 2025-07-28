import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/menu/Menu';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';
import BrandingFileUpload from '../components/BrandingFileUpload';
import { 
  fetchExhibition, 
  Exhibition, 
  getBrandingFiles, 
  BrandingFilesResponse 
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
  const [brandingLoading, setBrandingLoading] = useState<boolean>(false);
  const [brandingError, setBrandingError] = useState<string>('');
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
        const exhibitorId = user.role === 'admin' ? 2 : user.id;
        setTimeout(() => loadBrandingFiles(exhibitorId, fetchedExhibition.id), 0);
      }
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
  const loadBrandingFiles = useCallback(async (exhibitorId: number, exhibitionId: number) => {
    if (!token) {
      setBrandingError('Brak autoryzacji - zaloguj się ponownie');
      return;
    }
    
    setBrandingLoading(true);
    setBrandingError('');
    
    try {
      const files = await getBrandingFiles(exhibitorId, exhibitionId, token);
      setBrandingFiles(files);
    } catch (error: any) {
      setBrandingError(error.message || 'Błąd podczas ładowania plików');
      console.error('Error loading branding files:', error);
      
      // If 401, logout user
      if (error.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setBrandingLoading(false);
    }
  }, [token, logout, navigate]);

  // Handle upload success - reload files
  const handleUploadSuccess = useCallback(() => {
    if (exhibition && token && user) {
      const exhibitorId = user.role === 'admin' ? 2 : user.id;
      loadBrandingFiles(exhibitorId, exhibition.id);
    }
  }, [exhibition, token, user]);

  // Handle upload error
  const handleUploadError = useCallback((error: string) => {
    setBrandingError(error);
  }, []);

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
                  <CustomTypography fontSize="1.25rem" fontWeight={600}>
                    Branding wystawcy
                  </CustomTypography>
                  
                  {brandingError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {brandingError}
                    </Alert>
                  )}
                  
                  {brandingLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box className={styles.brandingSection}>
                      <CustomTypography fontSize="1rem">
                        Materiały brandingowe i promocyjne dla wydarzenia
                      </CustomTypography>
                      
                      {/* Branding file upload components */}
                    {exhibition && brandingFiles && user && (
                      <BrandingFileUpload
                        fileType="kolorowe_tlo_logo_wydarzenia"
                        title="Kolorowe tło z logiem wydarzenia (E-Identyfikator wystawcy)"
                        description="Format: png, jpg"
                        dimensions="305x106"
                        allowedFormats={['png', 'jpg', 'jpeg']}
                        maxSize={5 * 1024 * 1024}
                        exhibitorId={user.role === 'admin' ? 2 : user.id}
                        exhibitionId={exhibition.id}
                        existingFile={brandingFiles.files['kolorowe_tlo_logo_wydarzenia'] || null}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        onDeleteSuccess={handleUploadSuccess}
                      />
                    )}

                    {/* Tło wydarzenia z logiem (E-zaproszenia) */}
                    {exhibition && brandingFiles && user && (
                      <BrandingFileUpload
                        fileType="tlo_wydarzenia_logo_zaproszenia"
                        title="Tło wydarzenia z logiem (E-zaproszenia)"
                        description="Format: png, svg"
                        dimensions="152x106"
                        allowedFormats={['png', 'svg']}
                        maxSize={5 * 1024 * 1024}
                        exhibitorId={user.role === 'admin' ? 2 : user.id}
                        exhibitionId={exhibition.id}
                        existingFile={brandingFiles.files['tlo_wydarzenia_logo_zaproszenia'] || null}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        onDeleteSuccess={handleUploadSuccess}
                      />
                    )}

                    {/* Białe Logo (E-Identyfikator) */}
                    {exhibition && brandingFiles && user && (
                      <BrandingFileUpload
                        fileType="biale_logo_identyfikator"
                        title="Białe Logo (E-Identyfikator)"
                        description="Format: png, svg"
                        dimensions="104x34"
                        allowedFormats={['png', 'svg']}
                        maxSize={5 * 1024 * 1024}
                        exhibitorId={user.role === 'admin' ? 2 : user.id}
                        exhibitionId={exhibition.id}
                        existingFile={brandingFiles.files['biale_logo_identyfikator'] || null}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        onDeleteSuccess={handleUploadSuccess}
                      />
                    )}

                    {/* Banner dla wystawcy z miejscem na logo (800x800) */}
                    {exhibition && brandingFiles && user && (
                      <BrandingFileUpload
                        fileType="banner_wystawcy_800"
                        title="Banner dla wystawcy z miejscem na logo"
                        description="Format: png, jpg"
                        dimensions="800x800"
                        allowedFormats={['png', 'jpg', 'jpeg']}
                        maxSize={10 * 1024 * 1024}
                        exhibitorId={user.role === 'admin' ? 2 : user.id}
                        exhibitionId={exhibition.id}
                        existingFile={brandingFiles.files['banner_wystawcy_800x800'] || null}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        onDeleteSuccess={handleUploadSuccess}
                      />
                    )}

                    {/* Banner dla wystawcy z miejscem na logo (1200x1200) */}
                    {exhibition && brandingFiles && user && (
                      <BrandingFileUpload
                        fileType="banner_wystawcy_1200"
                        title="Banner dla wystawcy z miejscem na logo (duży)"
                        description="Format: png, jpg"
                        dimensions="1200x1200"
                        allowedFormats={['png', 'jpg', 'jpeg']}
                        maxSize={15 * 1024 * 1024}
                        exhibitorId={user.role === 'admin' ? 2 : user.id}
                        exhibitionId={exhibition.id}
                        existingFile={brandingFiles.files['banner_wystawcy_1200x1200'] || null}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        onDeleteSuccess={handleUploadSuccess}
                      />
                    )}

                    {/* Logo PTAK EXPO */}
                    {exhibition && brandingFiles && user && (
                      <BrandingFileUpload
                        fileType="logo_ptak_expo"
                        title="Logo PTAK EXPO"
                        description="Format: png, jpg"
                        dimensions="200x200"
                        allowedFormats={['png', 'jpg', 'jpeg']}
                        maxSize={5 * 1024 * 1024}
                        exhibitorId={user.role === 'admin' ? 2 : user.id}
                        exhibitionId={exhibition.id}
                        existingFile={brandingFiles.files['logo_ptak_expo'] || null}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        onDeleteSuccess={handleUploadSuccess}
                      />
                    )}

                    {/* Dokumenty brandingowe dla wystawcy */}
                    {exhibition && brandingFiles && user && (
                      <BrandingFileUpload
                        fileType="dokumenty_brandingowe"
                        title="Dokumenty brandingowe dla wystawcy"
                        description="Format: PDF"
                        dimensions={null}
                        allowedFormats={['pdf']}
                        maxSize={20 * 1024 * 1024}
                        exhibitorId={user.role === 'admin' ? 2 : user.id}
                        exhibitionId={exhibition.id}
                        existingFile={brandingFiles.files['dokumenty_brandingowe'] || null}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        onDeleteSuccess={handleUploadSuccess}
                      />
                    )}

                    {/* Przycisk Zapisz */}
                    <Box className={styles.saveButtonContainer}>
                      <CustomButton
                        bgColor="#6F87F6"
                        textColor="#fff"
                        width="120px"
                        height="40px"
                        fontSize="0.875rem"
                      >
                        Zapisz
                      </CustomButton>
                    </Box>
                  </Box>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box className={styles.tabContent}>
                  <CustomTypography fontSize="1.25rem" fontWeight={600}>
                    Informacje targowe
                  </CustomTypography>
                  <Box className={styles.tradeInfoSection}>
                    <CustomTypography fontSize="1rem">
                      Szczegółowe informacje o targach i warunkach uczestnictwa
                    </CustomTypography>
                    
                    <Box className={styles.infoCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Regulamin targów
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Plan hal i stoiska
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Harmonogram wydarzenia
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                  <CustomTypography fontSize="1.25rem" fontWeight={600}>
                    Zaproszenia
                  </CustomTypography>
                  <Box className={styles.invitationsSection}>
                    <CustomTypography fontSize="1rem">
                      Zarządzaj zaproszeniami dla wystawców i gości
                    </CustomTypography>
                    
                    <Box className={styles.invitationCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Zaproszenia dla wystawców
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Zaproszenia VIP
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Szablony zaproszeń
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                  <CustomTypography fontSize="1.25rem" fontWeight={600}>
                    Wydarzenia targowe
                  </CustomTypography>
                  <Box className={styles.tradeEventsSection}>
                    <CustomTypography fontSize="1rem">
                      Dodatkowe wydarzenia i aktywności podczas targów
                    </CustomTypography>
                    
                    <Box className={styles.eventCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Konferencje i seminaria
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Networking
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Konkursy i nagrody
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                  <CustomTypography fontSize="1.25rem" fontWeight={600}>
                    Powiadomienia Push
                  </CustomTypography>
                  <Box className={styles.notificationsSection}>
                    <CustomTypography fontSize="1rem">
                      Wyślij powiadomienia do uczestników wydarzenia
                    </CustomTypography>
                    
                    <Box className={styles.notificationCard}>
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Ogłoszenia targowe
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Przypomnienia
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Wydarzenia specjalne
                      </CustomTypography>
                      <CustomTypography fontSize="0.75rem" color="#6c757d">
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
                      <CustomTypography fontSize="0.875rem" fontWeight={500}>
                        Historia powiadomień
                      </CustomTypography>
                      <Box className={styles.historyList}>
                        <Box className={styles.historyItem}>
                          <CustomTypography fontSize="0.75rem">
                            "Rozpoczęcie rejestracji na targi" - wysłano 2 dni temu
                          </CustomTypography>
                          <CustomTypography fontSize="0.65rem" color="#6c757d">
                            Dostarczono do 156 odbiorców
                          </CustomTypography>
                        </Box>
                        <Box className={styles.historyItem}>
                          <CustomTypography fontSize="0.75rem">
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