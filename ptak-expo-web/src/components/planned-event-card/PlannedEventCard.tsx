import { Card, CardContent, Typography, Box, Chip, Avatar, Link } from '@mui/material';
import { brandingAPI } from '../../services/api';
import { useEffect, useState } from 'react';
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
  preferTileLogo?: boolean; // prefer logo_kolowe_tlo_kafel on dashboard; false on inner pages
}

const PlannedEventCard: React.FC<PlannedEventCardProps> = ({ event, onSelect, preferTileLogo = true }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const resolve = async () => {
      try {
        const res = await brandingAPI.getGlobal(Number(event.id));
        const files = res.data?.files || {};
        const fileObj = preferTileLogo
          ? (files['logo_kolowe_tlo_kafel'] || files['event_logo'] || null)
          : (files['event_logo'] || null);
        const file = fileObj && (Array.isArray(fileObj) ? fileObj[0] : fileObj);
        if (file?.fileName && mounted) setLogoUrl(brandingAPI.serveGlobalUrl(file.fileName));
      } catch {
        if (mounted) setLogoUrl(null);
      }
    };
    resolve();
    return () => { mounted = false; };
  }, [event.id, preferTileLogo]);
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
            src={logoUrl || ((event as any).event_logo_file_name ? brandingAPI.serveGlobalUrl((event as any).event_logo_file_name) : event.logoUrl)}
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
            <Chip
              label={`${event.readiness}%`}
              className={`${styles.readiness} ${getReadinessClass(event.readiness)}`}
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


