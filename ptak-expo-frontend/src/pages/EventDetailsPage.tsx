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
  const { token, logout } = useAuth();

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

  const [activeCategory, setActiveCategory] = useState<string>('catalog');

  const categories = [
    { id: 'catalog', name: 'Wpis do katalogu', icon: 'catalog' },
    { id: 'documents', name: 'Dokumenty', icon: 'documents' },
    { id: 'invitations', name: 'Zaproszenia', icon: 'invitations' },
    { id: 'schedule', name: 'Plan wydarzeń', icon: 'schedule' },
    { id: 'badges', name: 'Identyfikatory', icon: 'badges' },
    { id: 'awards', name: 'Nagrody Targowe', icon: 'awards' },
  ];

  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  const renderCategoryIcon = (iconType: string) => {
    const iconProps = { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none" };
    
    switch (iconType) {
      case 'catalog':
        return (
          <svg {...iconProps}>
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#6F87F6"/>
          </svg>
        );
      case 'documents':
        return (
          <svg {...iconProps}>
            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5Z" fill="#6F87F6"/>
          </svg>
        );
      case 'invitations':
        return (
          <svg {...iconProps}>
            <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#6F87F6"/>
          </svg>
        );
      case 'schedule':
        return (
          <svg {...iconProps}>
            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 6C13.93 6 15.5 7.57 15.5 9.5S13.93 13 12 13S8.5 11.43 8.5 9.5S10.07 6 12 6ZM19 19H5V17.5C5 15.56 8.94 14.5 12 14.5S19 15.56 19 17.5V19Z" fill="#6F87F6"/>
          </svg>
        );
      case 'badges':
        return (
          <svg {...iconProps}>
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#6F87F6"/>
          </svg>
        );
      case 'awards':
        return (
          <svg {...iconProps}>
            <path d="M12 2L15.09 8.26L22 9L17 13.74L18.18 20.66L12 17.27L5.82 20.66L7 13.74L2 9L8.91 8.26L12 2Z" fill="#6F87F6"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'catalog':
        return (
          <Box className={styles.catalogContent}>
            <CustomTypography fontSize="0.875rem" fontWeight={500} color="#fc8a06">
              Wpis do katalogu targowego
            </CustomTypography>
            
            <Box className={styles.catalogDetails}>
              <Box className={styles.catalogField}>
                <CustomTypography className={styles.catalogFieldLabel}>
                  Nazwa Firmy:
                </CustomTypography>
                <CustomTypography className={styles.catalogFieldValue}>
                  {exhibitor.companyName}
                </CustomTypography>
              </Box>
              
              <Box className={styles.catalogField}>
                <CustomTypography className={styles.catalogFieldLabel}>
                  Logotyp
                </CustomTypography>
              </Box>
              
              <Box className={styles.catalogField}>
                <CustomTypography className={styles.catalogFieldLabel}>
                  Opis:
                </CustomTypography>
                <CustomTypography className={styles.catalogFieldValue}>
                  {exhibitor.companyName} to firma, która oferuje rozwiązania dla różnych typów budynków, takich jak hotele, biurowce i domy mieszkalne.
                </CustomTypography>
              </Box>
              
              <Box className={styles.catalogField}>
                <CustomTypography className={styles.catalogFieldLabel}>
                  Dane kontaktowe:
                </CustomTypography>
                <CustomTypography className={styles.catalogFieldValue}>
                  {exhibitor.contactPerson}
                </CustomTypography>
                <CustomTypography className={styles.catalogFieldValue}>
                  e-mail: {exhibitor.email}
                </CustomTypography>
                <CustomTypography className={styles.catalogFieldValue}>
                  tel: {exhibitor.phone}
                </CustomTypography>
              </Box>
              
              <Box className={styles.catalogField}>
                <CustomTypography className={styles.catalogFieldLabel}>
                  Strona www:
                </CustomTypography>
                <CustomTypography className={styles.catalogFieldValue}>
                  https://www.{exhibitor.companyName.toLowerCase().replace(/\s+/g, '')}.com
                </CustomTypography>
              </Box>
              
              <Box className={styles.socialMediaSection}>
                <CustomTypography className={styles.catalogFieldLabel}>
                  Social Media
                </CustomTypography>
                <Box className={styles.socialMediaGrid}>
                  <CustomTypography className={styles.catalogFieldValue}>
                    www. facebook/{exhibitor.companyName.toLowerCase().replace(/\s+/g, '')}
                  </CustomTypography>
                  <CustomTypography className={styles.catalogFieldValue}>
                    YouTube
                  </CustomTypography>
                  <CustomTypography className={styles.catalogFieldValue}>
                    Linked-In
                  </CustomTypography>
                  <CustomTypography className={styles.catalogFieldValue}>
                    Instagram
                  </CustomTypography>
                </Box>
              </Box>
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
        );
      
      case 'documents':
        return (
          <Box className={styles.documentsSection}>
            <CustomTypography fontSize="0.875rem" fontWeight={500} color="#2e2e38">
              Materiały do pobrania (3)
            </CustomTypography>
            
            <Box className={styles.documentsList}>
              <Box className={styles.documentItem}>
                <CustomTypography fontSize="0.6875rem" color="#2e2e38">
                  Katalog {exhibitor.companyName}.pdf
                </CustomTypography>
                <span className={styles.documentType}>PDF</span>
              </Box>
              <Box className={styles.documentItem}>
                <CustomTypography fontSize="0.6875rem" color="#2e2e38">
                  Cennik {exhibitor.companyName}.pdf
                </CustomTypography>
                <span className={styles.documentType}>PDF</span>
              </Box>
              <Box className={styles.documentItem}>
                <CustomTypography fontSize="0.6875rem" color="#2e2e38">
                  Broszura produktowa.pdf
                </CustomTypography>
                <span className={styles.documentType}>PDF</span>
              </Box>
            </Box>
          </Box>
        );
      
      default:
        return (
          <Box className={styles.emptyState}>
            <CustomTypography fontSize="1rem" color="#6f6f6f">
              Zawartość dla kategorii "{categories.find(c => c.id === activeCategory)?.name}"
            </CustomTypography>
            <CustomTypography fontSize="0.875rem" color="#6f6f6f">
              Ta sekcja będzie dostępna wkrótce.
            </CustomTypography>
          </Box>
        );
    }
  };

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
            <Avatar src={UserAvatar} alt="User" className={styles.userAvatar} />
            <Box className={styles.userText}>
              <CustomTypography fontSize="1rem" fontWeight={500} color="#2e2e38">
                Dzień dobry, Administratorze
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

        {/* Main Card */}
        <Box className={styles.mainCard}>
          {/* Exhibitor Info Section */}
          <Box className={styles.exhibitorCard}>
            <Box className={styles.cardHeader}>
              <Box>
                <CustomTypography fontSize="1rem" fontWeight={500} color="#2e2e38">
                  Nazwa Wystawcy:
                </CustomTypography>
                <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                  {exhibitor.companyName}
                </CustomTypography>
              </Box>
              <Box>
                <CustomTypography fontSize="0.6875rem" color="#6f6f6f">
                  Dane kontakowe:
                </CustomTypography>
                <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                  {exhibitor.contactPerson}
                </CustomTypography>
              </Box>
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

          {/* Categories Menu */}
          <Box className={styles.categoriesMenu}>
            {categories.map((category) => (
              <Box
                key={category.id}
                className={`${styles.categoryItem} ${activeCategory === category.id ? styles.active : ''}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                <Box className={styles.categoryIcon}>
                  {renderCategoryIcon(category.icon)}
                </Box>
                <CustomTypography fontSize="0.875rem" color="inherit">
                  {category.name}
                </CustomTypography>
              </Box>
            ))}
          </Box>

          {/* Content Layout - Two Columns */}
          <Box className={styles.contentLayout}>
            {/* Left Column - Event Card */}
            <Box className={styles.eventCardSection}>
              <Box className={styles.eventCard}>
                <img 
                  src="/assets/4515f4ed2e86e01309533e2483db0fd4@2x.png" 
                  alt="Event" 
                  className={styles.eventImage} 
                />
                <Box className={styles.eventInfo}>
                  <CustomTypography fontSize="0.9375rem" fontWeight={500} color="#2e2e38">
                    {exhibition.name}
                  </CustomTypography>
                  <CustomTypography fontSize="0.9375rem" color="#2e2e38">
                    {formatDateRange(exhibition.start_date, exhibition.end_date)}
                  </CustomTypography>
                </Box>
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

            {/* Right Column - Category Content */}
            <Box className={styles.categoryContent}>
              {renderCategoryContent()}
            </Box>
          </Box>
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