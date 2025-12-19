import { Card, Button, Typography, Box, Chip } from "@mui/material";
import ChecklistIcon from "@mui/icons-material/Checklist";
import styles from "./ChecklistProgressCard.module.scss";
import ProgressBar from "../progress-bar/ProgressBar";

type ChecklistProgressCardProps = {
  daysLeft: number;
  onChecklistClick: () => void;
  readiness?: number;
};

const ChecklistProgressCard: React.FC<ChecklistProgressCardProps> = ({
  daysLeft,
  onChecklistClick,
  readiness = 0,
}) => {
  const getReadinessClass = (value: number) => {
    if (value <= 30) return styles.red;
    if (value <= 55) return styles.orange;
    return styles.green;
  };
  return (
    <Card className={styles.card}>
      <Chip
        label={`Do wydarzenia: ${daysLeft} dni`}
        className={styles.daysChip}
        color="secondary"
      />
      <Box display="flex">
        <Typography variant="h6" gutterBottom>
          Lista zadań
        </Typography>
        <Chip
          label={`${readiness}%`}
          className={`${styles.readiness} ${getReadinessClass(readiness)}`}
        />
      </Box>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Uzupełnij wymagane informacje i dokumenty, żeby być gotowym na targi.
      </Typography>
      <Box className={styles.readinessContainer}>
        <ProgressBar percentage={readiness} />
      </Box>
      <Button
        variant="contained"
        fullWidth
        startIcon={<ChecklistIcon />}
        onClick={onChecklistClick}
        color="secondary"
      >
        Przejdź do checklisty
      </Button>
    </Card>
  );
};

export default ChecklistProgressCard;
