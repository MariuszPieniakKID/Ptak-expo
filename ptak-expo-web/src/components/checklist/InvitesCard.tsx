import { ThemeProvider, Typography } from "@mui/material";
import { blackTheme } from "./ElectronicIdsCard";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";

export default function InvitesCard() {
	const {checklist, filled} = useChecklist();
	return (
		<ThemeProvider theme={blackTheme}>
		<ChecklistCard 
				title={<Typography fontSize={16}>Wysłane zaproszenia ({checklist.sentInvitesCount}/{checklist.availableInvitesCount})</Typography>} 
				icon={<span />}
				checked={filled[2]}
		>
		</ChecklistCard>

		</ThemeProvider>
	);
}