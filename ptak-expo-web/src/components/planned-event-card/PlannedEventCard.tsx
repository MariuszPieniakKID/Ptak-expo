import { Card, CardContent, Typography, Box, Chip, Avatar, Link } from '@mui/material';
import { brandingAPI } from '../../services/api';
import styles from './PlannedEventCard.module.scss';

export interface EventData {
  id: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  readiness: number;
  logoUrl: string;
}

interface PlannedEventCardProps {
  event: EventData;
  onSelect?: () => void;
}

const PlannedEventCard: React.FC<PlannedEventCardProps> = ({ event, onSelect }) => {
  const getReadinessClass = (value: number) => {
    if (value <= 30) return styles.red;
    if (value <= 55) return styles.orange;
    return styles.green;
  };

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.logoBox}>
          <Avatar 
            className={styles.avatar} 
            variant="rounded" 
            src={(event as any).event_logo_file_name ? brandingAPI.serveGlobalUrl((event as any).event_logo_file_name) : event.logoUrl} 
            alt={event.title} 
          />
        </Box>
        <Box className={styles.titleBox}>
          <Box>
            <Typography variant="body2" color="text.info" className={styles.date}>
              {event.dateFrom} – {event.dateTo}
            </Typography>
            <Typography variant="subtitle1" className={styles.title}>
              {event.title}
            </Typography>
          </Box>
          <Box className={styles.boxLink}>
            {/* Hide readiness visually, keep DOM minimal for future use */}
            <Chip
              label={`${event.readiness}%`}
              className={`${styles.readiness} ${getReadinessClass(event.readiness)}`}
              sx={{ visibility: 'hidden' }}
            />
            <Link onClick={onSelect} className={styles.selectBtn} color="text.primary">
              Zmień
            </Link>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PlannedEventCard;


