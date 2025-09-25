import {ThemeProvider, Typography} from "@mui/material";
import {blackTheme} from "./ElectronicIdsCard";
import ChecklistCard from "./checklistCard";
import {useChecklist} from "../../contexts/ChecklistContext";

export default function InvitesCard() {
  const {checklist, filled} = useChecklist();
  return (
    <ThemeProvider theme={blackTheme}>
      <ChecklistCard
        title={
          <Typography fontSize={16} color="#2E2E38" fontWeight={700}>
            Wysłane zaproszenia ({checklist.sentInvitesCount}/
            {checklist.availableInvitesCount})
          </Typography>
        }
        icon={<img src={`/assets/checklist-step-1.svg`} alt="" />}
        checked={filled[2]}
      >
        <></>
      </ChecklistCard>
    </ThemeProvider>
  );
}
