import { Exhibition,} from '../../services/api';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import { ReactComponent as  CatalogEntryIcon} from '../../assets/catalog_entryIcon.svg';
import { ReactComponent as  DocumentsIcon} from '../../assets/documentsIcon.svg';
import { ReactComponent as  InvitationsIcon} from '../../assets/invitationsIcon.svg';
import { ReactComponent as  EventScheduleIcon} from '../../assets/event_scheduleIcon.svg';
import { ReactComponent as  PushNotificationIcon} from '../../assets/pushNotificationsIcon.svg';

import {Box, Tab} from '@mui/material';
import styles from './EventCardPage.module.scss';
import { useState } from 'react';
import CustomTypography from '../../components/customTypography/CustomTypography';
import SingleEventCard from '../../components/singleEventCard/SingleEventCard';
import Branding from '../../components/eventComponents/branding/Branding';
import TradeFairInformation from '../../components/eventComponents/tradeFairInformation/TradeFairInformation';
import Invitations from '../../components/eventComponents/invitations/Invitations';
import TradeFairEvents from '../../components/eventComponents/tradeFairEvents/TradeFairEvents';
import PushNotification from '../../components/eventComponents/pushNotification/PushNotification';


type EventCardPagetProps = {
  event: Exhibition;
};


function EventCardPage({ event }: EventCardPagetProps) {

  const [value, setValue] = useState(0);
  

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

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };



  const renderEvent = (event: any) => {
  if (event) {
    return  <Box className={styles.eventBusinessCard}>
            <CustomTypography className={styles.selestedTitleWrapper}>Wydarzenie:</CustomTypography>
            <SingleEventCard 
              id={event.id}
              exhibitorId={0}
              iconId={1}
              event_readiness={0}
              title={event.name}
              start_date={event.start_date}
              end_date={event.end_date}
              handleSelectEvent={()=>console.log('')}
              handleDeleteEventFromExhibitor={()=>console.log('')}
              showDelete={false}
              showSelect={false}
              showEdit={true}
            />
          </Box>;
  } else {
    return <CustomTypography>Nie wybrano wydarzenia</CustomTypography>;
  }
};
  
 return (
    <Box className={styles.tableHeader}>
       <Box className={styles.singleEventInfo} sx={{flexGrow: 1,width:'100%',bgcolor: 'background.paper'}}>
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
                                label={<span className="tab-label-text">Branding wystawy</span>}
                                {...a11yProps(0)}
                                 sx={{
                                  marginBottom: '-1rem'
                                }}
                            />
                            <Tab
                                disableRipple
                                icon={<DocumentsIcon />}
                                iconPosition="start"
                                label={<span className="tab-label-text">Informacje targowe</span>}
                                {...a11yProps(1)}
                                 sx={{
                                  marginBottom: '-1rem'
                                }}
                            />
                            <Tab
                                disableRipple
                                icon={<InvitationsIcon />}
                                iconPosition="start"
                                label={<span className="tab-label-text">Zaproszenia</span>}
                                {...a11yProps(2)}
                                 sx={{
                                  marginBottom: '-1rem'
                                }}
                            />
                            <Tab
                                disableRipple
                                icon={<EventScheduleIcon />}
                                iconPosition="start"
                                label={<span className="tab-label-text">Wydarzenia targowe</span>}
                                {...a11yProps(3)}
                                 sx={{
                                  marginBottom: '-1rem'
                                }}
                            />
                            <Tab
                                disableRipple
                                icon={<PushNotificationIcon />}
                                iconPosition="start"
                                label={<span className="tab-label-text">Powiadomienia Push</span>}
                                {...a11yProps(4)}
                                sx={{
                                  marginBottom: '-1rem'
                                }}
                            />
                    </Tabs>
                    </Box>
                    <CustomTabPanel value={value} index={0}>
                    <Box className={styles.tabPaperContainer}>
                        <Box className={styles.leftContainer}>{renderEvent(event)}</Box>
                        <Box className={styles.rightContainer}>{event ? <Branding alwaysExpanded event={event}/>: null}</Box>
                    </Box>
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={1}>
                    <Box className={styles.tabPaperContainer}>
                        <Box className={styles.leftContainer}>{renderEvent(event)}</Box>
                        <Box className={styles.rightContainer}>{event ? <TradeFairInformation alwaysExpanded event={event}/>: null}</Box>
                    </Box>                  
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={2}>
                    <Box className={styles.tabPaperContainer}>
                        <Box className={styles.leftContainer}>{renderEvent(event)}</Box>
                        <Box className={styles.rightContainer}>{event ? <Invitations alwaysExpanded event={event}/>: null}</Box>
                    </Box>                    
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={3}>
                    <Box className={styles.tabPaperContainer}>
                        <Box className={styles.leftContainer}>{renderEvent(event)}</Box>
                        <Box className={styles.rightContainer}>{event ? <TradeFairEvents alwaysExpanded event={event}/>: null}</Box>
                    </Box>
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={4}>
                    <Box className={styles.tabPaperContainer}>
                        <Box className={styles.leftContainer}>{renderEvent(event)}</Box>
                        <Box className={styles.rightContainer}>{event ? <PushNotification alwaysExpanded event={event} />: null}</Box>
                    </Box>  
                    </CustomTabPanel>
        </Box>
    </Box> 
  );
};


export default EventCardPage;