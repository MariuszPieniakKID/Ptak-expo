import { Card, CardContent, Typography, Box, Chip, Avatar, Link } from '@mui/material';
import styles from './PlannedEventCard.module.scss';
import { useTranslation } from 'react-i18next';

export interface Event {
  id: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  readiness: number;
  logoUrl: string;
  daysLeft: number;
}

interface PlannedEventCardProps {
  event: Event;
  onSelect?: () => void;
  detailed?: boolean;
}

const PlannedEventCard: React.FC<PlannedEventCardProps> = ({
  event,
  onSelect,
  detailed = false,
}) => {
  const { t } = useTranslation('common');
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
            src={event.logoUrl}
            alt={`${event.title} logo`}
          />
          {detailed && (
            <Box>
              <Typography variant="body2">{t('readiness')}</Typography>
              <Chip
                label={`${event.readiness}%`}
                className={`${styles.readiness} ${getReadinessClass(event.readiness)}`}
              />
            </Box>
          )}
        </Box>
        <Box className={styles.titleBox}>
          <Box>
            {!detailed && (
              <Typography variant="subtitle2" color={'text.secondary'}>
                {t('yourEvent')}
              </Typography>
            )}
            <Typography variant="body2" color="text.info" className={styles.date}>
              {event.dateFrom} – {event.dateTo}
            </Typography>
            <Typography variant="subtitle1" className={styles.title}>
              {event.title}
            </Typography>
          </Box>
          {/* //todo */}
          <Box className={styles.boxLink}>
            {detailed ? (
              <Link onClick={onSelect} className={styles.selectBtn} color="text.primary">
                {t('select')}
              </Link>
            ) : (
              <Link onClick={onSelect} className={styles.selectBtn} color="text.primary">
                {t('change')}
              </Link>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PlannedEventCard;
