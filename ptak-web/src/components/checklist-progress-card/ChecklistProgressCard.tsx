import { Card, Button, Typography, Box, Chip } from '@mui/material';
import ChecklistIcon from '@mui/icons-material/Checklist';
import styles from './ChecklistProgressCard.module.scss';
import { useTranslation } from 'react-i18next';

type ChecklistProgressCardProps = {
  daysLeft: number;
  readiness: number;
  onChecklistClick: () => void;
};

const ChecklistProgressCard: React.FC<ChecklistProgressCardProps> = ({
  daysLeft,
  readiness,
  onChecklistClick,
}) => {
  const { t } = useTranslation('common');
  const getMessage = () => {
    if (readiness === 100) return t('progress.full');
    if (readiness >= 70) return t('progress.almost');
    if (readiness >= 30) return t('progress.halfway');
    return t('progress.low');
  };

  const getChipColor = () => {
    if (readiness === 100) return 'success';
    if (readiness >= 70) return 'info';
    if (readiness >= 30) return 'warning';
    return 'error';
  };

  return (
    <Card className={styles.card}>
      <Chip
        label={t('event.daysLeft', { count: daysLeft })}
        className={styles.daysChip}
        color="secondary"
      />

      <Typography variant="h6" gutterBottom>
        {getMessage()}
      </Typography>

      <Box className={styles.readinessContainer}>
        <Typography variant="h6" gutterBottom>
          {t('progress.readiness')}
        </Typography>
        <Chip
          label={`${readiness}%`}
          color={getChipColor()}
          size="medium"
          sx={{ borderRadius: 3 }}
        />
      </Box>

      <Typography variant="body1" color="textSecondary" gutterBottom>
        {t('progress.description')}
      </Typography>

      <Box className={styles.progressBarWrapper}>
        {Array.from({ length: 40 }, (_, i) => {
          const filled = (i / 40) * 100 < readiness;
          return (
            <Box
              key={i}
              className={`${styles.segment} ${filled ? styles.filled : ''}`}
              style={{
                backgroundColor: `hsl(${(i / 40) * 120}, 100%, 45%)`,
              }}
            />
          );
        })}
      </Box>

      <Button
        variant="contained"
        fullWidth
        startIcon={<ChecklistIcon />}
        onClick={onChecklistClick}
        color="secondary"
      >
        {t('progress.goChecklist')}
      </Button>
    </Card>
  );
};

export default ChecklistProgressCard;
