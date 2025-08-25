import { Card, Button, Typography, Box, Chip } from '@mui/material';
import ChecklistIcon from '@mui/icons-material/Checklist';
import styles from './ChecklistProgressCard.module.scss';

type ChecklistProgressCardProps = {
  daysLeft: number;
  readiness: number;
  onChecklistClick: () => void;
};

const ChecklistProgressCard: React.FC<ChecklistProgressCardProps> = ({ daysLeft, readiness, onChecklistClick }) => {
  return (
    <Card className={styles.card}>
      <Chip label={`Do wydarzenia: ${daysLeft} dni`} className={styles.daysChip} color="secondary" />
      <Typography variant="h6" gutterBottom>
        {readiness >= 70 ? 'Prawie gotowe!' : readiness >= 30 ? 'W połowie drogi' : 'Zacznijmy!'}
      </Typography>
      <Box className={styles.readinessContainer}>
        <Typography variant="h6" gutterBottom>
          Gotowość
        </Typography>
        <Chip label={`${readiness}%`} size="medium" sx={{ borderRadius: 3 }} />
      </Box>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Uzupełnij wymagane informacje i dokumenty, żeby być gotowym na targi.
      </Typography>
      <Box className={styles.progressBarWrapper}>
        {Array.from({ length: 40 }, (_, i) => {
          const filled = (i / 40) * 100 < readiness;
          return <Box key={i} className={`${styles.segment} ${filled ? styles.filled : ''}`} />;
        })}
      </Box>
      <Button variant="contained" fullWidth startIcon={<ChecklistIcon />} onClick={onChecklistClick} color="secondary">
        Przejdź do checklisty
      </Button>
    </Card>
  );
};

export default ChecklistProgressCard;


