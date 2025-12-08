import { IconButton, Typography } from "@mui/material";
import { useChecklist } from "../../contexts/ChecklistContext";
import ChecklistCard from "./checklistCard";
import AddEvent from "./EditEvent";
import { useState } from "react";
import { Add } from "@mui/icons-material";
import EventInfoBox from "./EventInfoBox";
import styles from "../../pages/ChecklistPage.module.scss";

export default function EventSchedule() {
  const { filled, checklist } = useChecklist();
  var [showAdd, setShowAdd] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  return (
    <ChecklistCard
      secondaryBackground
      title={
        <Typography fontSize={16} color="#2E2E38" fontWeight={700}>
          Plan wydarzeń na stoisku ({checklist.events.length})
        </Typography>
      }
      icon={<img src={`/assets/checklist-step-5.svg`} alt=""></img>}
      checked={filled[4]}
    >
      {checklist.events.map((e, i) => (
        <EventInfoBox
          key={`${e.name}-${e.date}-${e.startTime}-${i}`}
          event={e}
          index={i}
          onEdit={(idx) => setEditingIndex(idx)}
        />
      ))}

      {!showAdd && editingIndex === null && (
        <>
          <IconButton
            className={styles.addProductButton}
            onClick={() => setShowAdd(true)}
          >
            <Add className={styles.addProductButtonIcon} />
          </IconButton>
          <span className={styles.addProductText}>dodaj wydarzenie</span>
        </>
      )}
      {showAdd && (
        <AddEvent
          key={`add-${checklist.events.length}`}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editingIndex !== null && (
        <AddEvent
          key={`edit-${editingIndex}`}
          eventNum={editingIndex}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </ChecklistCard>
  );
}
