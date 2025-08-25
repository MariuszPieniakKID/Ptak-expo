import { Box } from '@mui/material';
import EventLayout from '../../components/event-layout/EventLayout';
import AvatarBanner from '../../components/avatar-banner/AvatarBanner';
import PlannedEventCard from '../../components/planned-event-card/PlannedEventCard';
import ChecklistProgressCard from '../../components/checklist-progress-card/ChecklistProgressCard';
import { useNavigate, useParams } from 'react-router-dom';
import { mockEvents, mockNews } from '../../mocks';
import styles from './EventNews.module.scss';
import Footer from '../../components/footer/Footer';
import News from '../../components/news/News';

const EventNews = () => {
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
          {/* todo get news by id and remove mock */}
          <News news={mockNews} />
          <Footer />
        </Box>
      }
      colorLeft="#eceef0"
    />
  );
};

export default EventNews;
