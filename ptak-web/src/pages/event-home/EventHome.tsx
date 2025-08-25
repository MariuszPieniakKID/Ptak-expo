import { Box } from '@mui/material';
import EventLayout from '../../components/event-layout/EventLayout';
import AvatarBanner from '../../components/avatar-banner/AvatarBanner';
import PlannedEventCard from '../../components/planned-event-card/PlannedEventCard';
import { useNavigate, useParams } from 'react-router-dom';
import { mockEvents } from '../../mocks';
import styles from './EventHome.module.scss';
import ChecklistProgressCard from '../../components/checklist-progress-card/ChecklistProgressCard';
import EventHomeMenu from '../../components/event-home-menu/EventHomeMenu';
import Footer from '../../components/footer/Footer';

const EventHome = () => {
  const { id } = useParams();
  //todo get event by id and remove mock
  const event = mockEvents.find((x) => x.id === id)!;
  const navigate = useNavigate();
  return (
    <EventLayout
      left={
        <Box className={styles.leftContainer}>
          <AvatarBanner />
          <PlannedEventCard event={event} />
          <ChecklistProgressCard
            readiness={event.readiness}
            daysLeft={event.daysLeft}
            onChecklistClick={() => {
              navigate(`/event/${event.id}/checklist`);
            }}
          />
        </Box>
      }
      right={
        <Box className={styles.rightContainer}>
          <EventHomeMenu id={event.id} /> <Footer />
        </Box>
      }
      colorLeft="#eceef0"
    />
  );
};

export default EventHome;
