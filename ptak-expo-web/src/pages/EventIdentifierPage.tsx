import { Box } from '@mui/material';
import EventLayout from '../components/eventLayout/EventLayout';
import AvatarBanner from '../components/avatar-banner/AvatarBanner';
import PlannedEventCard from '../components/planned-event-card/PlannedEventCard';
import ChecklistProgressCard from '../components/checklist-progress-card/ChecklistProgressCard';
import IdentifierCard, { type Identifier } from '../components/identifierCard/IdentifierCard';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './EventHomePage.module.scss';

const mockEvent = {
  id: '1', title: 'International Trade Fair', dateFrom: '11.03.2026', dateTo: '15.03.2026', readiness: 65, logoUrl: '/assets/logo192.png', daysLeft: 365,
};

const mockIdentifier: Identifier = {
  id: '1', eventName: 'Warsaw Industry Week', dateFrom: '11.03.2026', dateTo: '15.03.2026', time: '6:00–23:00', type: 'Wystawca', location: 'Hala A, B, C, G', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=54637-22-22', headerImageUrl: '/assets/background.png', logoUrl: '/assets/logo192.png'
};

const EventIdentifierPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = { ...mockEvent, id: eventId || '1' };
  const identifier = { ...mockIdentifier, id: event.id };

  return (
    <EventLayout
      left={
        <Box className={styles.leftContainer}>
          <AvatarBanner />
          <PlannedEventCard event={event} />
          <ChecklistProgressCard readiness={event.readiness} daysLeft={event.daysLeft} onChecklistClick={() => navigate(`/event/${event.id}/checklist`)} />
        </Box>
      }
      right={<Box className={styles.rightContainer}><IdentifierCard data={identifier} /></Box>}
      colorRight="#5a6ec8"
      colorLeft="#2E2E38"
    />
  );
};

export default EventIdentifierPage;


