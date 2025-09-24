import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Menu from '../../components/menu/Menu';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';

import {
  Avatar,
  Box,
  Container,
  CircularProgress,
  Alert,
  //useMediaQuery,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { ReactComponent as LogoutIcon } from '../../assets/log-out.svg';
import styles from './EventsPage_.module.scss';
import EventsPageIcon from '../../assets/eventIcon.png';
import { ReactComponent as BackIcon } from '../../assets/back.svg';
import UserAvatar from '../../assets/7bb764a0137abc7a8142b6438e529133@2x.png';
import Applause from '../../assets/applause.png';
import { ReactComponent as UsersIcon } from '../../assets/addIcon.svg';
import { Exhibition, fetchExhibitions, getBrandingFileUrl, catalogAPI } from '../../services/api';
import { getEventAssets } from '../../helpers/getEventAssets';
import CustomField from '../../components/customField/CustomField';
import AddEventModal from '../../components/addEventModal/AddEventModal_';
import { fieldOptions as fallbackFieldOptions } from '../../helpers/mockData';
import { OptionType } from '../../components/customField/CustomField';
import EventCardPage from '../eventCardPage/EventCardPage';




const EventsPage_: React.FC = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [isAddEventModalOpen,setIsAddEventModalOpen]=useState<boolean>(false);
  const [selectedExhibition,setSelectedExhibition]=useState<Exhibition>();
  const [loading, setLoading] = useState<boolean>(false); // na starcie true
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const [selectedField,setSelectedField]=useState<string>('all')  
  const [eventFieldOptions, setEventFieldOptions] = useState<OptionType[]>([{ value: 'all', label: 'Wszystkie' }, ...fallbackFieldOptions.filter(o => o.value !== 'all')]);


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

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);
  
  useEffect(() => {
    loadExhibitions();
    const loadEventFields = async () => {
      if (!token) return;
      try {
        const list = await catalogAPI.listEventFields(token);
        const opts: OptionType[] = [
          { value: 'all', label: 'Wszystkie' },
          ...list.map(i => ({ value: i.event_field, label: i.event_field }))
        ];
        setEventFieldOptions(opts);
      } catch (_) {
        setEventFieldOptions([{ value: 'all', label: 'Wszystkie' }, ...fallbackFieldOptions.filter(o => o.value !== 'all')]);
      }
    };
    loadEventFields();
  }, [loadExhibitions, token]);

  const handleSelectFieldOfExhibitions = useCallback(
  (value: string) => {
    setSelectedField(value);
  },[]);

 // TO DOO  filtrowanie nadchodzących eventów
const filteredEvents = useMemo(() => {
  if (selectedField === "all") {
    return exhibitions; // pokaż wszystkie
  }
  return null
  //TODOO FILTR PO BRANŻY
  // return exhibitions.filter(
  //   (event) => event.industry === selectedField 
  // );
}, [exhibitions, selectedField]);

const formatDateRange = useCallback((startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const format = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return `${format(start)} - ${format(end)}`;
}, []);

//TODO nadchodzące wydarzenia jakie są kryteria jak poniżej to ok:
  const currentEvents = exhibitions.filter(event => 
    new Date(event.start_date) >= new Date() || event.status === 'active'
  );

//Dane do modalu dodania eventu
  const handleOpenModal = useCallback(() => {
    setIsAddEventModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddEventModalOpen(false);
  }, []);

  const handleEventAdded = useCallback(() => {
    setIsAddEventModalOpen(false);
    loadExhibitions(); 
  }, [loadExhibitions]);

  // Obsługa pojedyńczego eventu
  const handleSelectEvent=(exhibition:Exhibition)=>{
   setSelectedExhibition(exhibition);
  }
 return (
    <>
    <Box className={styles.eventsPage}>
      <Box>
        <Box className={styles._exhibitorsNavigationContainer}>
          <Box className={styles._header}>
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
            <Box className={styles._welcomeMessage}>
              <Box 
                className={styles._backContainer}
                onClick={ () => {navigate(-1)}}
              >
                <BackIcon className={styles._backIcon} />
                <CustomTypography className={styles.backText}> wstecz </CustomTypography>
              </Box>
              <Box className={styles._logedUserInfo}>
                <Avatar 
                  src={UserAvatar} 
                  alt={user?.firstName || 'User'} 
                  className={styles._avatar} 
                  onClick={()=>console.log("")}
                />
                <Box> 
                  <CustomTypography className={styles._welcomeMessageTitle}> Dzień dobry, {user?.firstName || 'Użytkowniku'} 
                  <img
                    src={Applause}
                    alt='Applause'
                    className={styles._applausepng}
                  />
                  </CustomTypography>
                  <CustomTypography className={styles._welcomeMessageText}>Sprawdź co możesz dzisiaj zrobić!</CustomTypography>
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
          <Box className={styles._tableHeader}>
            <Box className={styles._titleTableContainer}>
              <Box className={styles._userTitle}>
                <img src={EventsPageIcon} alt="Wydarzenia" className={styles._titleIcon} />
                <CustomTypography className={styles.pageTitle}>Wydarzenia</CustomTypography>              
              </Box>
              <Box className={styles.breadcrumbs}>
                
                     {selectedExhibition
                     ?<Breadcrumbs aria-label="breadcrumb">
                        <Link onClick={() => navigate('/dashboard')}> Home</Link>
                        <Link onClick={()=>setSelectedExhibition(undefined)}> Wydarzenia</Link>
                        <CustomTypography className={styles.linkEnd}>{selectedExhibition.name}</CustomTypography>
                     </Breadcrumbs>
                     :<Breadcrumbs aria-label="breadcrumb">
                        <Link onClick={() => navigate('/dashboard')}> Home</Link>
                        <CustomTypography className={styles.linkEnd}>Wydarzenia</CustomTypography>
                       </Breadcrumbs>
                     }
                
              </Box>
            </Box>
          {!selectedExhibition
            ?<Box
              className={styles.addEventsContainer}
              onClick={handleOpenModal}
            >
              <UsersIcon className={styles.addEventIcon} />
              <CustomTypography className={styles.addEventText}> + dodaj wydarzenie </CustomTypography>    
            </Box>
            :null
          } 
          </Box>   

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading 
        ? 
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
         : 
          <>
           {selectedExhibition
           ? <EventCardPage event={selectedExhibition}/>
           : <>
              <Box className={styles.currentEvents}>
                  <CustomTypography className={styles.sectionTitle}>Nadchodzące Wydarzenia:</CustomTypography>
                  <Box className={styles.eventsCardWrapper}>
                  {currentEvents
                  ?
                  currentEvents.map((exhibition)=> {
                      const { background, logo } = getEventAssets(exhibition.name);
                      const hasCustomLogo = Boolean(exhibition.event_logo_file_name && token);
                      const eventLogoUrl = hasCustomLogo
                        ? getBrandingFileUrl(null, exhibition.event_logo_file_name as string, token as string)
                        : logo;

                      return (
                          <Box 
                          key={exhibition.id} 
                          className={styles.singleEventCard}
                          >
                            <Box className={styles.logoOnPhoto}>
                              {!hasCustomLogo && (
                                <img 
                                  src={background} 
                                  alt={exhibition.name} 
                                  className={styles.eventImgBackground} 
                                />
                              )}
                              <Box>
                                <img 
                                  src={eventLogoUrl} 
                                  alt={`${exhibition.name} logo`} 
                                  className={styles.eventLogo} 
                                />
                              </Box>
                            </Box>

                            <Box className={styles.eventInfo}>
                              <CustomTypography className={styles.eventInfoData}>
                                {formatDateRange(exhibition.start_date, exhibition.end_date)}
                              </CustomTypography>
                              <CustomTypography className={styles.eventInfoTitle}>
                                {exhibition.name}
                              </CustomTypography>
                              <Box className={styles.action}>
                                <Box 
                                className={styles.actionButton}
                                onClick={() => handleSelectEvent(exhibition)}
                                >
                                  <CustomTypography className={styles.chooseText}>wybierz</CustomTypography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                      )
                    })
                  :<CustomTypography className={styles.noData}>Brak danych</CustomTypography>
                  }

                  </Box>
              </Box>

              <Box className={styles.filteredEvents}>
                  <CustomTypography className={styles.sectionTitle}>Pozostałe wydarzenia:</CustomTypography>
                  <Box className={styles.selectTypeRow}>
                    <Box className={styles.columnLabel}>
                      <CustomTypography className={styles.selectField}>Wybierz branżę:</CustomTypography> 
                    </Box>
                    <Box className={styles.columnSelect}>
                      <CustomField
                        type="text"
                        value={selectedField}
                        onChange={e => handleSelectFieldOfExhibitions(e.target.value)}
                        placeholder="Wszystkie"
                        options={eventFieldOptions}
                        forceSelectionFromOptions
                        fullWidth
                        className={styles.selectBox}
                      />
                    </Box>

                  </Box>
                  
                  <Box className={styles.eventsCardWrapper}>

                  {filteredEvents
                  ? 

                    filteredEvents.map((exhibition)=> {
                      const { background, logo } = getEventAssets(exhibition.name);
                      const hasCustomLogo = Boolean(exhibition.event_logo_file_name && token);
                      const eventLogoUrl = hasCustomLogo
                        ? getBrandingFileUrl(null, exhibition.event_logo_file_name as string, token as string)
                        : logo;

                      return (
                          <Box 
                          key={exhibition.id} 
                          className={styles.singleEventCard}>
                            <Box className={styles.logoOnPhoto}>
                              {!hasCustomLogo && (
                                <img 
                                  src={background} 
                                  alt={exhibition.name} 
                                  className={styles.eventImgBackground} 
                                />
                              )}
                              <Box>
                                <img 
                                  src={eventLogoUrl} 
                                  alt={`${exhibition.name} logo`} 
                                  className={styles.eventLogo} 
                                />
                              </Box>
                            </Box>

                            <Box className={styles.eventInfo}>
                              <CustomTypography className={styles.eventInfoData}>
                                {formatDateRange(exhibition.start_date, exhibition.end_date)}
                              </CustomTypography>
                              <CustomTypography className={styles.eventInfoTitle}>
                                {exhibition.name}
                              </CustomTypography>
                              <Box className={styles.action}>
                                <Box 
                                className={styles.actionButton}
                                onClick={() => handleSelectEvent(exhibition)}
                                >
                                  <CustomTypography className={styles.chooseText}>wybierz</CustomTypography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                      )
                      
                    })
                  :<CustomTypography className={styles.noData}>Brak danych</CustomTypography>
                  }

                  </Box>
              </Box>
              <Box 
                className={styles.backContainerFooter}
                onClick={ () => navigate(-1)}
                sx={{paddingBottom:'2em'}}
                >
                <BackIcon className={styles.backIconFooter} />
                <CustomTypography className={styles.backTextFooter}> wstecz </CustomTypography>
              </Box>
           </>
           }
          
          </>
        }
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

export default EventsPage_; 