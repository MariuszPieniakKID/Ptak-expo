import { Box } from '@mui/material';
import EventLayout from '../components/eventLayout/EventLayout';
import LeftColumn from '../components/event-left/LeftColumn';
import { useParams } from 'react-router-dom';
import styles from './EventHomePage.module.scss';
import News, { type NewsItem } from '../components/news/News';

const mockNews: NewsItem[] = [
  { id: 1, title: 'Zmiana statusu zaproszenia', description: 'Potwierdzono zaproszenie jako VIP', category: 'Portal dokumentów', date: new Date() },
  { id: 2, title: 'Portal dokumentów', description: 'Nowe dokumenty do akceptacji', category: 'Dokumenty', date: new Date() },
  { id: 3, title: 'Zmiany organizacyjne', description: 'Zmiana godzin biura targowego', category: 'Organizacja', date: new Date('2025-08-20') },
];

const EventNewsPage = () => {
  const { eventId } = useParams();

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || '0'} />}
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


