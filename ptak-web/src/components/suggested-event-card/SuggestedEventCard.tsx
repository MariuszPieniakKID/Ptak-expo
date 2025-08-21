import { Box, Card, Grid, Link, Tooltip, Typography } from '@mui/material';
import styles from './SuggestedEventCard.module.scss';
import type { Event } from '../planned-event-card/PlannedEventCard';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { useTranslation } from 'react-i18next';

interface SuggestedEventCardProps {
  event: Event;
}

const SuggestedEventCard: React.FC<SuggestedEventCardProps> = ({ event }) => {
  const { t } = useTranslation('calendar');
  return (
    <Card className={styles.card}>
      <Grid container spacing={2}>
        <Grid size={{ sm: 4 }} display={{ xs: 'none', sm: 'inline-block' }}>
          <Box className={styles.logoImg} component="img" src={event.logoUrl} alt={event.title} />
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Box className={styles.titleBox}>
            <Box>
              <Typography variant="body2" color="text.secondary" className={styles.date}>
                {event.dateFrom} – {event.dateTo}
              </Typography>

              <Tooltip title={event.title} arrow>
                <Typography variant="subtitle1" className={styles.title}>
                  {event.title}
                </Typography>
              </Tooltip>
            </Box>

            <Box className={styles.actions}>
              <Link href="#" underline="hover" className={styles.actionLink}>
                <PersonOutlineIcon className={styles.icon} />
                {t('register')}
              </Link>

              <Link href="#" underline="hover" className={styles.actionLink}>
                <ConfirmationNumberOutlinedIcon className={styles.icon} />
                {t('downloadTicket')}
              </Link>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

export default SuggestedEventCard;
