import { Box } from '@mui/material';
import EventLayout from '../components/eventLayout/EventLayout';
import styles from './EventHomePage.module.scss';
import { useParams, useNavigate } from 'react-router-dom';
import AvatarBanner from '../components/avatar-banner/AvatarBanner';
import PlannedEventCard from '../components/planned-event-card/PlannedEventCard';
import ChecklistProgressCard from '../components/checklist-progress-card/ChecklistProgressCard';
import EventHomeMenu from '../components/event-home-menu/EventHomeMenu';

const EventHomePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Temporary mock data; replace with API when available
  const event = {
    id: eventId || '1',
    title: 'Fashion Expo 2025',
    dateFrom: '12.05.2025',
    dateTo: '16.05.2025',
    readiness: 45,
    logoUrl: '/assets/logo192.png',
    daysLeft: 32,
  };

  return (
    <EventLayout
      left={
        <Box className={styles.leftContainer}>
          <AvatarBanner />
          <PlannedEventCard event={event} onSelect={() => navigate('/dashboard')} />
          <ChecklistProgressCard
            readiness={event.readiness}
            daysLeft={event.daysLeft}
            onChecklistClick={() => navigate(`/event/${event.id}/checklist`)}
          />
        </Box>
      }
      right={<Box className={styles.rightContainer}><EventHomeMenu id={event.id} /></Box>}
      colorLeft="#eceef0"
    />
  );
};

export default EventHomePage;


