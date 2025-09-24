import { ThemeProvider, Typography, Box } from "@mui/material";
import { blackTheme } from "./ElectronicIdsCard";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";

export default function InvitesCard() {
	const {checklist, filled} = useChecklist();
	return (
		<ThemeProvider theme={blackTheme}>
		<ChecklistCard 
				title={<Typography fontSize={16}>Wysłane zaproszenia ({checklist.sentInvitesCount}/{checklist.availableInvitesCount})</Typography>} 
				icon={<img src={`/assets/checklist-step-1.svg`} alt=""/>}
				checked={filled[3]}
			>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
				{Array.isArray(checklist.sentInvites) && checklist.sentInvites.length > 0 ? (
					checklist.sentInvites.slice(0, 5).map((row) => (
						<Box key={row.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #2f2f35' }}>
							<Typography fontSize={12} sx={{ mr: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								{(row.recipientName || row.recipientEmail) + (row.recipientName ? `, ${row.invitationType}` : ` (${row.invitationType})`)}
							</Typography>
							<Typography fontSize={12} sx={{ color: '#6F87F6' }}>{row.status}</Typography>
						</Box>
					))
				) : (
					<Typography fontSize={12} sx={{ color: '#A7A7A7' }}>Brak wysłanych zaproszeń</Typography>
				)}
			</Box>
		</ChecklistCard>

		</ThemeProvider>
	);
}