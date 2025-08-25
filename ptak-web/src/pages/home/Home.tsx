import { useEffect, useState } from 'react';
import PlannedEventCard, { type Event } from '../../components/planned-event-card/PlannedEventCard';
import { mockEvents } from '../../mocks';
import { Box, Button, Grid, Typography } from '@mui/material';
import AvatarBanner from '../../components/avatar-banner/AvatarBanner';
import logo from '../../assets/images/logo.png';
import styles from './Home.module.scss';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/footer/Footer';

const Home = () => {
  const { t } = useTranslation('home');
  const [events, setEvents] = useState<Event[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    //todo remove mocks and create api call
    setEvents(mockEvents);
  }, []);

  return (
    <Box className={styles.background}>
      <Grid container className={styles.header}>
        <Grid className={styles.avatar} size={{ xs: 6, sm: 3 }}>
          <AvatarBanner />
        </Grid>
        <Grid className={styles.logo} size={{ xs: 6, sm: 3 }}>
          <img src={logo} alt="Logo" />
        </Grid>
        <Grid size={{ sm: 3 }} display={{ xs: 'none', md: 'inline-block' }}></Grid>
      </Grid>
      <Box className={styles.children}>
        <Box className={styles.title}>
          <Typography>{t('plannedEvents')}</Typography>
        </Box>
        <Box mt={2}>
          <Grid container spacing={2}>
            {events?.map((event) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={event.id}>
                <PlannedEventCard
                  detailed
                  event={event}
                  onSelect={() => {
                    navigate(`/event/${event.id}/home`);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
        <Box mt={6}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              navigate('/calendar');
            }}
          >
            {t('seeCalendar')}
          </Button>
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};
export default Home;
