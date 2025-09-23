import { ThemeProvider, Typography, Button, Box } from "@mui/material";
import { blackTheme } from "./ElectronicIdsCard";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import { useNavigate, useParams } from "react-router-dom";

export default function InvitesCard() {
	const {checklist, filled} = useChecklist();
	const navigate = useNavigate();
	const { eventId } = useParams();
	return (
		<ThemeProvider theme={blackTheme}>
		<ChecklistCard 
				title={<Typography fontSize={16}>Wysłane zaproszenia ({checklist.sentInvitesCount}/{checklist.availableInvitesCount})</Typography>} 
				icon={<img src={`/assets/checklist-step-1.svg`} alt=""/>}
				checked={filled[2]}
			>
			<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
				<Button size="small" variant="outlined" onClick={() => navigate(`/event/${eventId}/invitations`)}>
					Zobacz listę i wyślij
				</Button>
			</Box>
		</ChecklistCard>

		</ThemeProvider>
	);
}