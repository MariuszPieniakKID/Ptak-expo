import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate} from 'react-router-dom';
 import { 
       Exhibitor,
       fetchExhibitor, 
       deleteExhibitor, 
//     // Exhibitor 
} from '../../services/api';

import { useAuth } from '../../contexts/AuthContext';
import Menu from '../../components/menu/Menu';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';

import {
  Avatar,
  Box,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Link,
  Breadcrumbs,
} from '@mui/material';
// import DeleteIcon from '@mui/icons-material/Delete';
import { ReactComponent as LogoutIcon } from '../../assets/log-out.svg';
import styles from './ExhibitorCardPageShort.module.scss';
import ExhibitorsPageIcon from '../../assets/mask-group-6@2x.png';
import { ReactComponent as BackIcon } from '../../assets/back.svg';
import { ReactComponent as WastebasketIcon } from '../../assets/wastebasket.svg';
import { ReactComponent as KeyIcon } from '../../assets/keyIcon.svg';
import { ReactComponent as AddIcon } from '../../assets/addIcon.svg';
import UserAvatar from '../../assets/7bb764a0137abc7a8142b6438e529133@2x.png';
import Applause from '../../assets/applause.png';
import SingleEventCard from '../../components/singleEventCard/SingleEventCard';
// import EventImage1 from '../../assets/image-35@2x.png';
// import EventImage2 from '../../assets/mask-group-28@2x.png';


// const hardcorExhibition {
//   id: number;
//   name: string;
//   description?: string;
//   start_date: string;
//   end_date: string;
//   location?: string;
//   status: string;
//   created_at: string;
//   updated_at: string;
// }


const ExhibitorCardPageShort: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  
  const handleLogout = useCallback(() => {
    console.log(`exhibitor: exhibitor${exhibitor}`)
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

  const handleDeleteEventFromExhibitor=useCallback((eventId:number,exhibitorId:number)=>{
    console.log(`Usuń z palety wystawców nr ${exhibitorId} event o Id ${eventId}`)

  },[exhibitor]);


    const getEventImage = useCallback((index: number): number => {
      // Rotate between available images
      return index % 2 === 0 ? 1: 2;
    }, []);



  const getEventReadiness = useCallback((eventId: number): number => {
    // Mock readiness based on event ID - in real app would come from API
    return eventId % 3 === 0 ? 21 : 65;
  }, []);
 
 return (
    <>
    <Box className={styles.pageContainer}>
      <Box>
        <Box className={styles.pageNavigationContainer}>
          <Box className={styles.pageHeader}>
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
            <Box className={styles.welcomeMessage}>
              <Box 
                className={styles.backContainer}
                onClick={handleBack}
              >
                <BackIcon className={styles.backIcon} />
                <CustomTypography className={styles.backText}> wstecz </CustomTypography>
              </Box>
              <Box className={styles.logedUserInfo}>
                <Avatar 
                  src={UserAvatar} 
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
        </Box>
        <Container  
          maxWidth={false}  
          sx={{ maxWidth: '90%' }}
          className={styles.contentWrapper}
        > 
            <Box className={styles.tableHeader}>
                <Box className={styles.titleTableContainer}>
                    <Box className={styles.pageTitleContainer}>
                        <img src={ExhibitorsPageIcon} alt="Wystawcy" className={styles.pageIcon} />
                        <CustomTypography className={styles.pageTitle}>Wystawcy</CustomTypography>              
                    </Box>
                    <Box className={styles.breadcrumbs}>
                        <Breadcrumbs aria-label="breadcrumb">
                            <Link onClick={() => navigate('/dashboard')}>Home</Link>
                            <Link onClick={() => navigate('/wystawcy')}>Baza wystawców</Link>
                            <CustomTypography className={styles.linkEnd}>
                                {exhibitor?.companyName}

                            </CustomTypography>
                        </Breadcrumbs>
                    </Box>
                </Box>
                <Box className={styles.exhibitionData}>
                   <Box className={styles.exhibitorCard}>
                        <Box className={styles.exhibitorCardData}>
                           <Box className={styles.box}>
                                <Box className={styles.infoGroup}>
                                    <CustomTypography  className={styles.infoGroupLabel} >Nazwa Wystawcy:</CustomTypography>
                                    <CustomTypography  className={styles.infoGroupValue} >{exhibitor?.companyName}</CustomTypography>
                                </Box>
                                <Box className={styles.infoGroup}>
                                    <CustomTypography  className={styles.infoGroupLabel} >NIP:</CustomTypography>
                                    <CustomTypography  className={styles.infoGroupLabel}> {exhibitor?.nip}</CustomTypography>
                                </Box>
                            </Box>
                            <Box className={styles.box}>
                                <Box className={styles.infoGroup}>
                                    <CustomTypography  className={styles.infoGroupLabel}>Dane kontaktowe:</CustomTypography>
                                    <CustomTypography  className={styles.infoGroupValue}>{exhibitor?.contactPerson}</CustomTypography>
                                </Box>
                                <Box className={styles.infoGroup}>
                                    <CustomTypography  className={styles.infoGroupLabel}> Adres:  </CustomTypography>
                                    <CustomTypography  className={styles.infoGroupLabel}> {exhibitor?.address}, {exhibitor?.postalCode} {exhibitor?.city}</CustomTypography>
                                </Box>
                            </Box>
                            <Box className={styles.box}>
                                <Box className={styles.infoGroup}>
                                    <CustomTypography  className={styles.infoGroupLabel}>e-mail:</CustomTypography>
                                    <CustomTypography  className={styles.infoGroupValue}>{exhibitor?.email}</CustomTypography>
                                </Box>
                                <Box className={styles.infoGroup}>
                                    <CustomTypography  className={styles.infoGroupLabel}>tel.:</CustomTypography>
                                    <CustomTypography  className={styles.infoGroupValue}>{exhibitor?.phone}</CustomTypography>
                                </Box>
                            </Box>
                        </Box>
                        <Box className={styles.exhibitorCardAction}>
                            <Box 
                            className={styles.actionButton}
                            onClick={handleDeleteExhibitor}
                            >
                                <WastebasketIcon 
                                className={styles.wastebasketIcon} 
                                />
                                <CustomTypography className={styles.wastebasketText}> usuń </CustomTypography>
                            </Box>
                        </Box> 
                   </Box>
                </Box>
                <Box className={styles.infoRow}>
                    <Box className={styles.row}>
                        <Box className={styles.sectionTitle}>
                            <CustomTypography  className={styles.titleForAllPlanedExhibitions} >Zaplanowane wydarzenie wystawcy:</CustomTypography>
                        </Box>
                        <Box className={styles.sectionAction}>
                            <Box className={styles.actionButton} onClick={()=>{console.log("Klik: wyśloij nowe hasło")}}>
                                    <KeyIcon className={styles.keyIcon} />
                                    <CustomTypography className={styles.wastebasketText}> wyślij nowe hasło </CustomTypography>
                            </Box>
                            <Box className={styles.actionButton} onClick={handleAddEvent}>
                                <AddIcon className={styles.addIcon} />
                                <CustomTypography className={styles.wastebasketText}> + dodaj wydarzenie </CustomTypography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <Box className={styles.allExhibitions}>
                     {exhibitor?.events && exhibitor.events.length > 0 
                     ? ( exhibitor.events.map((event,index) => 
                        <SingleEventCard 
                          id={event.id}
                          exhibitorId={exhibitor.id}
                          iconId={getEventImage(index)}
                          event_readiness={getEventReadiness(event.id)}
                          key={event.id} 
                          title={event.name}
                          start_date={event.start_date}
                          end_date={event.end_date}
                          handleSelectEvent={handleSelectEvent}
                          handleDeleteEventFromExhibitor={handleDeleteEventFromExhibitor}
                           />
                        ))
                     :<></>}

                </Box>
                            
            </Box>   

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
            ) : (
            <Paper className={styles._tableContainer}>


            </Paper>
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
    </>
  );
};

export default ExhibitorCardPageShort; 