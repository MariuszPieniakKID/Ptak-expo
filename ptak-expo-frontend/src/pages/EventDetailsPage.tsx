import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/menu/Menu';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';
import { fetchExhibitor, fetchExhibition, Exhibitor, Exhibition } from '../services/api';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import styles from './EventDetailsPage.module.scss';

// Import images from assets
import ExhibitorsPageIcon from '../assets/mask-group-6@2x.png';
import BackgroundImage from '../assets/mask-group-28@2x.png';
import UserAvatar from '../assets/7bb764a0137abc7a8142b6438e529133@2x.png';
import NotificationIcon from '../assets/group-27@2x.png';

interface EventDetailsPageProps {}

const EventDetailsPage: React.FC<EventDetailsPageProps> = () => {
  const { exhibitorId, eventId } = useParams<{ exhibitorId: string; eventId: string }>();
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const loadData = useCallback(async (): Promise<void> => {
    if (!token || !exhibitorId || !eventId) {
      setError('Brak autoryzacji lub nieprawidłowe parametry.');
      logout();
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Pobierz dane wystawcy i wydarzenia równocześnie
      const [fetchedExhibitor, fetchedExhibition] = await Promise.all([
        fetchExhibitor(parseInt(exhibitorId), token),
        fetchExhibition(parseInt(eventId), token)
      ]);
      
      setExhibitor(fetchedExhibitor);
      setExhibition(fetchedExhibition);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać danych wystawcy lub wydarzenia');
      if (err.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, exhibitorId, eventId, logout, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = useCallback(() => {
    navigate(`/wystawcy/${exhibitorId}`);
  }, [navigate, exhibitorId]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleCatalogPreview = useCallback(() => {
    console.log('Preview catalog for exhibitor:', exhibitor?.id);
  }, [exhibitor]);

  const handleSendReminder = useCallback(() => {
    console.log('Send reminder to exhibitor:', exhibitor?.id);
  }, [exhibitor]);

  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (loading) {
    return (
      <Box className={styles.eventDetailsPage}>
        <Menu />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !exhibitor || !exhibition) {
    return (
      <Box className={styles.eventDetailsPage}>
        <Menu />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Nie znaleziono wystawcy lub wydarzenia'}
          </Alert>
          <CustomButton
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            bgColor="#6F87F6"
            textColor="#fff"
            width="auto"
            height="40px"
          >
            Wróć do karty wystawcy
          </CustomButton>
        </Container>
      </Box>
    );
  }

  return (
    <Box className={styles.eventDetailsPage}>
      {/* Background Image */}
      <img src={BackgroundImage} alt="" className={styles.backgroundImage} />
      
      {/* Header Section */}
      <Box className={styles.headerSection}>
        {/* Menu Component */}
        <Menu />
        
        {/* User Info and Logout */}
        <Box className={styles.userSection}>
          <Box className={styles.userInfo}>
            <Avatar src={UserAvatar} alt={user?.firstName || 'User'} className={styles.userAvatar} />
            <Box className={styles.userText}>
              <CustomTypography fontSize="1rem" fontWeight={500} color="#2e2e38">
                Dzień dobry, {user?.firstName || 'Użytkowniku'}
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Sprawdź co możesz dzisiaj zrobić!
              </CustomTypography>
            </Box>
            <img src={NotificationIcon} alt="Notification" className={styles.notificationIcon} />
          </Box>
          <CustomButton
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            bgColor="transparent"
            textColor="#2b2b2d"
            width="auto"
            height="auto"
            fontSize="0.75rem"
            className={styles.logoutButton}
          >
            Wyloguj
          </CustomButton>
        </Box>

        {/* Back Button */}
        <CustomButton
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          bgColor="transparent"
          textColor="#2e2e38"
          width="auto"
          height="auto"
          fontSize="0.8125rem"
          className={styles.backButton}
        >
          wstecz
        </CustomButton>
      </Box>

      {/* Main Content */}
      <Box className={styles.mainContent}>
        {/* Page Title */}
        <Box className={styles.pageTitle}>
          <Box className={styles.titleContainer}>
            <img src={ExhibitorsPageIcon} alt="Wystawcy" className={styles.titleIcon} />
            <CustomTypography fontSize="1.125rem" fontWeight={500} color="#5041d0">
              Wystawcy
            </CustomTypography>
          </Box>
        </Box>

        {/* Breadcrumbs */}
        <Box className={styles.breadcrumbs}>
          <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
            Home / Baza wystawców / {exhibitor.companyName} / {exhibition.name}
          </CustomTypography>
        </Box>

        {/* Event Title */}
        <Box className={styles.eventTitle}>
          <CustomTypography fontSize="1rem" fontWeight={500} color="#2e2e38">
            Wydarzenie: {exhibition.name}
          </CustomTypography>
        </Box>

        {/* Exhibitor Info Card */}
        <Box className={styles.exhibitorCard}>
          <Box className={styles.cardHeader}>
            <CustomTypography fontSize="1rem" fontWeight={500} color="#2e2e38">
              Nazwa Wystawcy:
            </CustomTypography>
            <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
              Dane kontakowe:
            </CustomTypography>
          </Box>
          
          <Box className={styles.cardContent}>
            <Box className={styles.companyInfo}>
              <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                {exhibitor.companyName}
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                {exhibitor.contactPerson}
              </CustomTypography>
            </Box>
            
            <Box className={styles.contactInfo}>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                e-mail:
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#2e2e38">
                {exhibitor.email}
              </CustomTypography>
            </Box>
            
            <Box className={styles.additionalInfo}>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Tel.: {exhibitor.phone}
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                NIP: {exhibitor.nip}
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Adres: {exhibitor.address}, {exhibitor.postalCode} {exhibitor.city}
              </CustomTypography>
            </Box>
          </Box>
        </Box>

        {/* Event Details Section */}
        <Box className={styles.eventSection}>
          <Box className={styles.eventCard}>
            <img src="/assets/4515f4ed2e86e01309533e2483db0fd4@2x.png" alt="Event" className={styles.eventImage} />
            <Box className={styles.eventInfo}>
              <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                {exhibition.name}
              </CustomTypography>
              <CustomTypography fontSize="0.9375rem" color="#2e2e38">
                {formatDateRange(exhibition.start_date, exhibition.end_date)}
              </CustomTypography>
              <Box className={styles.readinessInfo}>
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
          </Box>
        </Box>

        {/* Catalog Entry Section */}
        <Box className={styles.catalogSection}>
          <CustomTypography fontSize="0.875rem" fontWeight={500} color="#fc8a06" className={styles.catalogTitle}>
            Wpis do katalogu
          </CustomTypography>
          
          <Box className={styles.catalogContent}>
            <Box className={styles.catalogLeft}>
              <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                Wpis do katalogu targowego
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Logotyp
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Opis: {exhibitor.companyName} to firma, która oferuje rozwiązania dla różnych typów budynków, takich jak hotele, biurowce i domy mieszkalne.
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Strona www: https://www.mtbmodules.com
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Social Media
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                www. facebook/mtbmodules
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Linked-In
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                YouTube
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Instagram
              </CustomTypography>
            </Box>
            
            <CustomButton
              onClick={handleCatalogPreview}
              bgColor="#6F87F6"
              textColor="#fff"
              width="auto"
              height="32px"
              fontSize="0.6875rem"
              className={styles.previewButton}
            >
              Podejrzyj wygląd wpisu do katalogu
            </CustomButton>
          </Box>
        </Box>

        {/* Products Section */}
        <Box className={styles.productsSection}>
          <CustomTypography fontSize="0.875rem" fontWeight={500} color="#2e2e38">
            Prezentowane produkty (2)
          </CustomTypography>
          
          <Box className={styles.productCard}>
            <img src="/assets/bd9ccd78fffaf95a88c164facb6148a3@2x.png" alt="Product" className={styles.productImage} />
            <Box className={styles.productInfo}>
              <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                MTB ONE
              </CustomTypography>
              <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                Przedstawiamy Państwu ofertę na zakup nowoczesnego domu 35m2 z antresolą. W skład oferty wchodzą wszystkie elementy sprefabrykowane w naszej fabryce. Montaż domu odbywa się za pomocą dołączonej instrukcji, w której szczegółowo, krok po kroku, opisaliśmy każdy etap prac, wraz ze spisem materiałów potrzebnym w danym etapie.
              </CustomTypography>
              <Box className={styles.productTags}>
                <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                  Tagi produktowe:
                </CustomTypography>
                <Box className={styles.tags}>
                  <span className={styles.tag}>dom modułowy</span>
                  <span className={styles.tag}>keramzytobeton</span>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Documents Section */}
        <Box className={styles.documentsSection}>
          <CustomTypography fontSize="0.875rem" fontWeight={500} color="#2e2e38">
            Materiały do pobrania (3)
          </CustomTypography>
          
          <Box className={styles.documentsList}>
            <Box className={styles.documentItem}>
              <CustomTypography fontSize="0.6875rem" color="#2e2e38">
                Katalog MtbOne.pdf
              </CustomTypography>
              <span className={styles.documentType}>PDF</span>
            </Box>
            <Box className={styles.documentItem}>
              <CustomTypography fontSize="0.6875rem" color="#2e2e38">
                Katalog MtbTwo.pdf
              </CustomTypography>
              <span className={styles.documentType}>PDF</span>
            </Box>
            <Box className={styles.documentItem}>
              <CustomTypography fontSize="0.6875rem" color="#2e2e38">
                Cennik MTB.pdf
              </CustomTypography>
              <span className={styles.documentType}>PDF</span>
            </Box>
          </Box>
        </Box>

        {/* Categories Section */}
        <Box className={styles.categoriesSection}>
          <Box className={styles.categoryItem}>
            <CustomTypography fontSize="0.875rem" color="#2e2e38">
              Dokumenty
            </CustomTypography>
          </Box>
          <Box className={styles.categoryItem}>
            <CustomTypography fontSize="0.875rem" color="#2e2e38">
              Plan wydarzeń
            </CustomTypography>
          </Box>
          <Box className={styles.categoryItem}>
            <CustomTypography fontSize="0.875rem" color="#2e2e38">
              Zaproszenia
            </CustomTypography>
          </Box>
          <Box className={styles.categoryItem}>
            <CustomTypography fontSize="0.875rem" color="#2e2e38">
              Identyfikatory
            </CustomTypography>
          </Box>
          <Box className={styles.categoryItem}>
            <CustomTypography fontSize="0.875rem" color="#2e2e38">
              Nagrody Targowe
            </CustomTypography>
          </Box>
        </Box>

        {/* Reminder Section */}
        <Box className={styles.reminderSection}>
          <CustomButton
            onClick={handleSendReminder}
            bgColor="#6F87F6"
            textColor="#fff"
            width="auto"
            height="40px"
            fontSize="0.6875rem"
            className={styles.reminderButton}
          >
            Przypomnij wystawcy o uzupełnieniu katalogu
          </CustomButton>
        </Box>
      </Box>

      {/* Footer */}
      <Box className={styles.footer}>
        <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
          Kontakt • Polityka prywatności • www.warsawexpo.eu
        </CustomTypography>
      </Box>
    </Box>
  );
};

export default EventDetailsPage; 