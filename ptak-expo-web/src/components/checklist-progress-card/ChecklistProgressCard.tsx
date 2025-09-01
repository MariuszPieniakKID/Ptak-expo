import { Card, Button, Typography, Box, Chip } from '@mui/material';
import ChecklistIcon from '@mui/icons-material/Checklist';
import styles from './ChecklistProgressCard.module.scss';

type ChecklistProgressCardProps = {
  daysLeft: number;
  onChecklistClick: () => void;
};

const ChecklistProgressCard: React.FC<ChecklistProgressCardProps> = ({ daysLeft, onChecklistClick }) => {
  return (
    <Card className={styles.card}>
      <Chip label={`Do wydarzenia: ${daysLeft} dni`} className={styles.daysChip} color="secondary" />
      {/* Hide readiness headline for now */}
      <Typography variant="h6" gutterBottom>
        Lista zadań
      </Typography>
      {/* Hide readiness percentage UI */}
      <Box className={styles.readinessContainer}>
        <Typography variant="h6" gutterBottom>
          
        </Typography>
      </Box>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Uzupełnij wymagane informacje i dokumenty, żeby być gotowym na targi.
      </Typography>
      {/* Progress bar hidden */}
      <Button variant="contained" fullWidth startIcon={<ChecklistIcon />} onClick={onChecklistClick} color="secondary">
        Przejdź do checklisty
      </Button>
    </Card>
  );
};

export default ChecklistProgressCard;


