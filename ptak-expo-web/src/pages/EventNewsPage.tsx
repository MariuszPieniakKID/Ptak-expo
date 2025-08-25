import { Box } from '@mui/material';
import EventLayout from '../components/eventLayout/EventLayout';
import AvatarBanner from '../components/avatar-banner/AvatarBanner';
import PlannedEventCard from '../components/planned-event-card/PlannedEventCard';
import ChecklistProgressCard from '../components/checklist-progress-card/ChecklistProgressCard';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './EventHomePage.module.scss';
import News, { type NewsItem } from '../components/news/News';

const mockEvent = {
  id: '1',
  title: 'International Trade Fair',
  dateFrom: '11.03.2026',
  dateTo: '15.03.2026',
  readiness: 65,
  logoUrl: '/assets/logo192.png',
  daysLeft: 365,
};

const mockNews: NewsItem[] = [
  { id: 1, title: 'Zmiana statusu zaproszenia', description: 'Potwierdzono zaproszenie jako VIP', category: 'Portal dokumentów', date: new Date() },
  { id: 2, title: 'Portal dokumentów', description: 'Nowe dokumenty do akceptacji', category: 'Dokumenty', date: new Date() },
  { id: 3, title: 'Zmiany organizacyjne', description: 'Zmiana godzin biura targowego', category: 'Organizacja', date: new Date('2025-08-20') },
];

const EventNewsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = { ...mockEvent, id: eventId || '1' };

  return (
    <EventLayout
      left={
        <Box className={styles.leftContainer}>
          <AvatarBanner />
          <PlannedEventCard event={event} />
          <ChecklistProgressCard
            readiness={event.readiness}
            daysLeft={event.daysLeft}
            onChecklistClick={() => navigate(`/event/${event.id}/checklist`)}
          />
        </Box>
      }
      right={
        <Box className={styles.rightContainer}>
          <Box className="children">
            <News news={mockNews} />
          </Box>
        </Box>
      }
      colorLeft="#eceef0"
    />
  );
};

export default EventNewsPage;


