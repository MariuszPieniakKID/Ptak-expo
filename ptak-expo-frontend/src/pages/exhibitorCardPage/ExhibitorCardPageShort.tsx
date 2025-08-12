import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import { 
       Exhibitor,
       fetchExhibitor, 
       deleteExhibitor, 
} from '../../services/api';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import { useAuth } from '../../contexts/AuthContext';
import Menu from '../../components/menu/Menu';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import { ReactComponent as  CatalogEntryIcon} from '../../assets/catalog_entryIcon.svg';
import { ReactComponent as  DocumentsIcon} from '../../assets/documentsIcon.svg';
import { ReactComponent as  InvitationsIcon} from '../../assets/invitationsIcon.svg';
import { ReactComponent as  EventScheduleIcon} from '../../assets/event_scheduleIcon.svg';
import { ReactComponent as  BadgesIcon} from '../../assets/BadgesIcon.svg';
import { ReactComponent as  TradeAwardcIcon} from '../../assets/trade_fair_awardsIcon.svg';



import {
  Avatar,
  Box,
  Container,
  //Paper,
  CircularProgress,
  Alert,
  Link,
  Breadcrumbs,
  // TabContext,
  // TabList,
  Tab,
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
import ExhibitorWithEvent from '../../components/exhibitorWithEvent/ExhibitorWithEvent';
// ExhibitorWithEventDetails from '../../components/_exhibitorWithEventDetails/ExhibitorWithEventDetails';




const ExhibitorCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const {token, user, logout } = useAuth();
  const [value, setValue] = React.useState(0);
  const [selectedEvent,setSelectedEvent]=useState<number | null>(null)

  
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
      console.log(`setExhibitor: ${exhibitor}`);
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
    if (!window.confirm(`Czy na pewno chcesz usunąć wystawcę "${exhibitor.companyName}"?`)) return;
    try {
      await deleteExhibitor(exhibitor.id, token);
      navigate('/wystawcy');
    } catch (err: any) {
      setError(err.message || 'Błąd podczas usuwania wystawcy');
    }
  }, [exhibitor, token, navigate]);

  const handleAddEvent = useCallback(() => {
    // placeholder: open modal or navigate
  }, []);

  const handleSelectEvent = useCallback((eventId: number) => {
    if (exhibitor) {
      //navigate(`/wystawcy/${exhibitor.id}/wydarzenie/${eventId}`);
      setSelectedEvent(eventId);

    }
  }, [exhibitor]);

  const handleDeleteEventFromExhibitor=useCallback((eventId:number,exhibitorId:number)=>{
    // placeholder: implement API call
  },[]);


    const getEventImage = useCallback((index: number): number => {
      // Rotate between available images
      return index % 2 === 0 ? 1: 2;
    }, []);

  const getEventReadiness = useCallback((eventId: number): number => {
    return eventId % 3 === 0 ? 21 : 65;
  }, []);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ padding: '24px 0px' }}>{children}</Box>}
      </div>
    );
  }

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const renderSelectedEvent = () => {
    if (selectedEvent !== null && exhibitor?.events) {
      return exhibitor.events
        .filter(event => event.id === selectedEvent)
        .map((event, index) => (
          <Box key={event.id} className={styles.eventBusinessCard}>
            <CustomTypography className={styles.selestedTitleWrapper}>Wydarzenie:</CustomTypography>
            <SingleEventCard
              id={event.id}
              exhibitorId={exhibitor.id}
              iconId={getEventImage(index)}
              event_readiness={getEventReadiness(event.id)}
              title={event.name}
              start_date={event.start_date}
              end_date={event.end_date}
              handleSelectEvent={handleSelectEvent}
              handleDeleteEventFromExhibitor={handleDeleteEventFromExhibitor}
            />
          </Box>
        ));
    }
    return <CustomTypography>Nie wybrano wydarzenia</CustomTypography>;
  };
 
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
                                    <CustomTypography  className={styles.infoGroupValue_cn}>{exhibitor?.companyName}</CustomTypography>
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
                         {(exhibitor?.events && exhibitor.events.length > 0 )
                            ? <CustomTypography  className={styles.titleForAllPlanedExhibitions}>  Zaplanowane wydarzenie wystawcy:</CustomTypography>
                            : <CustomTypography className={styles.noEvents}>Brak zaplanowanych wydarzeń wystawcy</CustomTypography>}  
                        </Box>
                        <Box className={styles.sectionAction}>
                            <Box className={styles.actionButton} onClick={()=>{console.log("Klik: wyślij nowe hasło")}}>
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
                     && ( exhibitor.events.map((event,index) =>              
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
                        ))}

                </Box>


            {selectedEvent === null
             ? <></>
             : <Box className={styles.singleEventInfo} sx={{flexGrow: 1,width:'100%',bgcolor: 'background.paper'}}>
                <Box>
                  <Tabs
                          value={value}
                          onChange={handleChange}
                          variant="scrollable"
                          scrollButtons="auto"
                          allowScrollButtonsMobile
                          aria-label="visible arrows tabs example"
                          slotProps={{
                            scrollButtons: {
                              disableRipple: true,
                            },
                          }}
                          sx={{
                            minHeight: 48,
                            '& .MuiTabs-indicator': {
                              display: 'none',
                            },
                            '& .MuiTabs-scroller': {
                              overflowX: 'auto !important',
                            },
                            '& .MuiTab-root': {
                              flex: 1,
                              minWidth: 190,
                              marginRight: 1.5,
                              textTransform: 'none',
                              fontSize: 15,
                              fontWeight: 400,
                              color: 'black',
                              minHeight: '48px',
                              whiteSpace: 'nowrap',
                              transition: 'color 0.2s, border-bottom 0.2s, background-color 0.2s',
                              borderBottom: '2px solid transparent',
                              '&:hover': {
                                color: '#FC8A06',
                              },
                              '&.Mui-selected': {
                                color: '#FC8A06',
                              },



                              '@media (max-width:600px)': {
                                '& .tab-label-text': {
                                  display: 'none !important',
                                },
                                  flex: 'unset',
                                  //minWidth: '4em',
                                    minWidth: 60, // ✅ szerokość minimalna na mobile
                                  paddingLeft: 0,
                                  paddingRight: 0,
                                  justifyContent: 'center', // wycentrowanie ikony
                                
                                '&:hover': {
                                  borderBottom: '2px solid #FC8A06',
                                  color: '#FC8A06',
                                  backgroundColor: 'transparent',
                                },
                                '&.Mui-selected': {
                                  borderBottom: '2px solid #FC8A06',
                                  color: '#FC8A06',
                                },
                              },

                            },
                            '& .MuiTab-root:last-child': {
                              marginRight: 0,
                            },
                            '& .MuiTab-wrapper': {
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: '8px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0, 
                              '& svg': {
                                flexShrink: 0, 
                              },
                              '@media (max-width:600px)': {
                                '& .tab-label-text': {
                                  display: 'none !important',
                                },
                              },
                            },
                            '& .tab-label-text': {
                              display: 'inline-block',
                              borderBottom: '2px solid transparent',
                              paddingBottom: '1px',
                              transition: 'border-bottom 0.2s, color 0.2s',
                            },
                            '& .Mui-selected .tab-label-text': {
                              borderBottom: '2px solid #FC8A06',
                              color: '#FC8A06',
                              whiteSpace: 'nowrap',
                            // Media query ukrywające label w mobile
                              '@media (max-width:600px)': {
                                '& .tab-label-text': {
                                  display: 'none !important',
                                },
                                '& .Mui-selected .tab-label-text': {
                                  borderBottom: '2px solid transparent', // usuwamy podkreślenie z tekstu w mobile
                                },
                              }},
                            [`& .${tabsClasses.scrollButtons}`]: {
                              '&.Mui-disabled': {
                                opacity: 0.3,
                              },
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.04)',
                              },
                            },
                          }}
                        >
                          <Tab
                            disableRipple
                            icon={<CatalogEntryIcon />}
                            iconPosition="start"
                            label={<span className="tab-label-text">Wpisz do katalogu</span>}
                            {...a11yProps(0)}
                          />
                          <Tab
                            disableRipple
                            icon={<DocumentsIcon />}
                            iconPosition="start"
                            label={<span className="tab-label-text">Dokumenty</span>}
                            {...a11yProps(1)}
                          />
                          <Tab
                            disableRipple
                            icon={<InvitationsIcon />}
                            iconPosition="start"
                            label={<span className="tab-label-text">Zaproszenia</span>}
                            {...a11yProps(2)}
                          />
                          <Tab
                            disableRipple
                            icon={<EventScheduleIcon />}
                            iconPosition="start"
                            label={<span className="tab-label-text">Plan wydarzeń</span>}
                            {...a11yProps(3)}
                          />
                          <Tab
                            disableRipple
                            icon={<BadgesIcon />}
                            iconPosition="start"
                            label={<span className="tab-label-text">Identyfikatory</span>}
                            {...a11yProps(4)}
                          />
                          <Tab
                            disableRipple
                            icon={<TradeAwardcIcon />}
                            iconPosition="start"
                            label={<span className="tab-label-text">Nagrody Targowe</span>}
                            {...a11yProps(5)}
                          />
                  </Tabs>
                </Box>
                <CustomTabPanel value={value} index={0}>
                  <Box className={styles.tabPaperContainer}>
                    <Box className={styles.leftContainer}>{renderSelectedEvent()}</Box>
                    <Box className={styles.rightContainer}>{exhibitor ? <ExhibitorWithEvent exhibitorId={exhibitor.id} exhibitor={exhibitor} /> : null}</Box>
                  </Box>
                </CustomTabPanel>
                      <CustomTabPanel value={value} index={1}>2</CustomTabPanel>
                      <CustomTabPanel value={value} index={2}>3</CustomTabPanel>
                      <CustomTabPanel value={value} index={3}>4</CustomTabPanel>
                      <CustomTabPanel value={value} index={4}>5</CustomTabPanel>
                      <CustomTabPanel value={value} index={5}>6</CustomTabPanel>
                    </Box>}

            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} 

            {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
            ) : <></>} 
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
