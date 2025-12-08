import { Box, Chip, Grid, IconButton, Typography } from "@mui/material";
import { EventInfo } from "../../services/checkListApi";
import { getEventKindString } from "../../shared/EventUtils";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useChecklist } from "../../contexts/ChecklistContext";
import styles from "../../pages/ChecklistPage.module.scss";
const months = [
  "sty",
  "lut",
  "mar",
  "kwi",
  "maj",
  "cze",
  "lip",
  "sie",
  "wrz",
  "paź",
  "lis",
  "gru",
];
function DateCircle({ date }: { date: string }) {
  console.log("[DateCircle] Received date:", date);

  // Ensure date is in YYYY-MM-DD format
  // Handle both ISO format (2025-10-07T00:00:00.000Z) and simple format (2025-10-07)
  let normalizedDate = date;
  if (!date || typeof date !== "string") {
    console.warn("[DateCircle] Invalid date:", date);
    normalizedDate = new Date().toISOString().slice(0, 10);
  } else if (date.includes("T")) {
    // ISO format - extract just the date part
    normalizedDate = date.slice(0, 10);
  }

  const parts = normalizedDate.split("-");
  const [year, m, d] = parts.map((x) => +x);

  console.log("[DateCircle] Parsed parts:", { parts, year, m, d });

  const monthStr = months[m - 1] || "err";
  const day = d && !isNaN(d) ? d.toString() : "?";

  return (
    <Box
      width="40px"
      height="40px"
      borderRadius="20px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ backgroundColor: "#89F4C9" }}
    >
      <Typography
        component="div"
        fontSize="14px"
        fontWeight={500}
        margin="-3px 0 0 0"
      >
        {day}
      </Typography>
      <Typography component="div" margin="-7px 0 0 0" fontSize="11px">
        {monthStr}
      </Typography>
    </Box>
  );
}

export default function EventInfoBox({
  event,
  index,
  onEdit,
}: {
  event: EventInfo;
  index: number;
  onEdit: (index: number) => void;
}) {
  const { removeEvent } = useChecklist();
  const isAgendaEvent = event.isFromAgenda === true;

  return (
    <Grid container marginY="20px">
      <Grid
        size={2}
        display="flex"
        flexDirection="column"
        alignItems="center"
        paddingTop="10px"
      >
        <DateCircle date={event.date} />
        <div className={styles.eventTimeContainer}>
          <Typography fontSize="16px">
            {" "}
            {event.startTime.slice(0, event.startTime.length - 3)} &ndash;{" "}
            {event.endTime.slice(0, event.endTime.length - 3)}{" "}
          </Typography>
        </div>
      </Grid>
      <Grid size={isAgendaEvent ? 10 : 9.5}>
        <Chip
          variant="outlined"
          color="primary"
          label={getEventKindString(event.kind)}
          size="small"
        />
        <Typography
          fontSize="16px"
          fontWeight="bold"
          marginTop="10px"
          marginBottom="10px"
        >
          {event.name}
        </Typography>
        {isAgendaEvent && (
          <Chip
            label="Z agendy"
            size="small"
            sx={{
              ml: 1,
              backgroundColor: "#6F87F6",
              color: "#fff",
              fontSize: "0.7rem",
            }}
          />
        )}
      </Grid>
      {!isAgendaEvent && (
        <Grid
          size={0.5}
          display="flex"
          justifyContent="flex-end"
          alignItems="flex-start"
          gap={1}
        >
          <IconButton
            size="small"
            onClick={() => onEdit(index)}
            aria-label="Edytuj"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => removeEvent(index)}
            aria-label="Usuń"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Grid>
      )}
      <Grid
        size={2}
        display="flex"
        marginTop="10px"
        flexDirection="column"
        alignItems="center"
      ></Grid>
      <Grid size={10} marginTop="10px">
        <Typography fontSize="16px" color="#A7A7A7">
          {event.description}
        </Typography>
      </Grid>
    </Grid>
  );
}
