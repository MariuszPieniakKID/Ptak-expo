import { Box } from '@mui/material';
import EventLayout from '../../components/event-layout/EventLayout';
import AvatarBanner from '../../components/avatar-banner/AvatarBanner';
import PlannedEventCard from '../../components/planned-event-card/PlannedEventCard';
import ChecklistProgressCard from '../../components/checklist-progress-card/ChecklistProgressCard';
import { useNavigate, useParams } from 'react-router-dom';
import { mockEvents, mockIdentifiers } from '../../mocks';
import styles from './EventIdentifier.module.scss';
import Footer from '../../components/footer/Footer';
import IdentifierCard from '../../components/identifier-card/IdentifierCard';

const EventIdentifier = () => {
  const { id } = useParams();
  //todo get event by id and remove mock
  const event = mockEvents.find((x) => x.id === id)!;
  //todo get identifier data by id and remove mock
  const identifier = mockIdentifiers.find((x) => x.id === id)!;
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
          <Footer />
        </Box>
      }
      right={
        <Box className={styles.rightContainer}>
          <IdentifierCard data={identifier} />
        </Box>
      }
      colorRight="#5a6ec8"
      colorLeft="#2E2E38"
    />
  );
};

export default EventIdentifier;
