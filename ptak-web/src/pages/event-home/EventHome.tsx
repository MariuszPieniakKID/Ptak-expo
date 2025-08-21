import { Box } from '@mui/material';
import EventLayout from '../../components/event-layout/EventLayout';
import AvatarBanner from '../../components/avatar-banner/AvatarBanner';
import PlannedEventCard from '../../components/planned-event-card/PlannedEventCard';
import { useParams } from 'react-router-dom';
import { mockEvents } from '../../mocks';
import styles from './EventHome.module.scss';

const EventHome = () => {
  const { id } = useParams();

  return (
    <EventLayout
      left={
        <Box gap={2} className={styles.container}>
          <AvatarBanner />
          <PlannedEventCard event={mockEvents.find((x) => x.id === id)!} />
        </Box>
      }
      right={<Box>elo</Box>}
      colorLeft="#eceef0"
    />
  );
};

export default EventHome;
