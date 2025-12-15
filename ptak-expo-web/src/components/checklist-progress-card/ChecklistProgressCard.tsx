import { Card, Button, Typography, Box, Chip } from '@mui/material';
import ChecklistIcon from '@mui/icons-material/Checklist';
import styles from './ChecklistProgressCard.module.scss';

type ChecklistProgressCardProps = {
  daysLeft: number;
  onChecklistClick: () => void;
  readiness?: number;
};

const ChecklistProgressCard: React.FC<ChecklistProgressCardProps> = ({ daysLeft, onChecklistClick, readiness = 0 }) => {
  return (
    <Card className={styles.card}>
      <Chip label={`Do wydarzenia: ${daysLeft} dni`} className={styles.daysChip} color="secondary" />
      <Typography variant="h6" gutterBottom>
        Lista zadań
      </Typography>
      <Box className={styles.readinessContainer}>
        <Typography variant="h4" gutterBottom color="primary">
          {readiness}%
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Gotowość do targów
        </Typography>
      </Box>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Uzupełnij wymagane informacje i dokumenty, żeby być gotowym na targi.
      </Typography>
      <Button variant="contained" fullWidth startIcon={<ChecklistIcon />} onClick={onChecklistClick} color="secondary">
        Przejdź do checklisty
      </Button>
    </Card>
  );
};

export default ChecklistProgressCard;


