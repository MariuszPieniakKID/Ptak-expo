import {Card, Button, Typography, Chip} from "@mui/material";
import styles from "./ChecklistProgressCard.module.scss";
import CalendarCheckIcon from "../../assets/calendar-check.png";
import {progressBellColors} from "./constants";

type ChecklistProgressCardProps = {
  daysLeft: number;
  onChecklistClick: () => void;
  progressPercent?: number;
};

const ChecklistProgressCard: React.FC<ChecklistProgressCardProps> = ({
  daysLeft,
  onChecklistClick,
  progressPercent = 80,
}) => {
  const progressBell = new Array(50).fill(null).map((_, index) => {
    const isActive = index * 2 >= progressPercent;

    return (
      <div
        className={styles.progressBellItem}
        key={`bell_${index}`}
        style={{
          backgroundColor: isActive ? "#b0b0b0" : progressBellColors[index],
        }}
      ></div>
    );
  });

  return (
    <Card className={styles.card}>
      <Chip
        label={
          <>
            Do wydarzenia: <b>{daysLeft} dni</b>
          </>
        }
        className={styles.daysChip}
        color="secondary"
      />
      {/* Hide readiness headline for now */}
      <div className={styles.progressWrapper}>
        <Typography variant="h6" className={styles.title}>
          Lista zadań
        </Typography>
        <div className={styles.progressText}>{`${progressPercent}%`}</div>
      </div>
      <Typography
        variant="body1"
        color="textSecondary"
        gutterBottom
        fontSize={13}
      >
        Uzupełnij wymagane informacje i dokumenty, żeby być gotowym na targi.
      </Typography>
      <div className={styles.progressBell}>{progressBell}</div>
      <Button
        variant="contained"
        fullWidth
        startIcon={
          <img
            src={CalendarCheckIcon}
            alt="Ikona kalendarza"
            height={20}
            width="auto"
          />
        }
        onClick={onChecklistClick}
        color="secondary"
        className={styles.button}
      >
        Idź do checklisty
      </Button>
    </Card>
  );
};

export default ChecklistProgressCard;
