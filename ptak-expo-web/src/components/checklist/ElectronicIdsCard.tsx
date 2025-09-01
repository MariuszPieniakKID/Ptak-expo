import { Box, createTheme, TextField, ThemeProvider, Typography, Button } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import api from '../../services/api';
import { useParams } from 'react-router-dom';
const boxSx = {
	backgroundColor: '#fff',
	padding: "40px",
	margin:"0px -16px",
	borderRadius: "20px",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	color: 'var(--color-darkslategray)',
	// Ensure no background visuals bleed into the form
	background: 'none',
	backgroundImage: 'none', // ensure no background overlay image
	backgroundRepeat: 'no-repeat',
	backgroundSize: 'contain',
	// Prevent any absolute decorative images from overlapping inputs
	position: 'relative',
	overflow: 'hidden',
	zIndex: 1,
}; 
const theme = createTheme({
	palette: { mode: 'light' }
});

type Person = { id: number; full_name: string; position: string | null; email: string | null; created_at: string };

function AddElectronicId({ eventId }: { eventId: number }) {
	const React = require('react') as typeof import('react');
	const [fullName, setFullName] = React.useState('');
	const [email, setEmail] = React.useState('');
	const [position, setPosition] = React.useState('');
	const [saving, setSaving] = React.useState(false);
	const [people, setPeople] = React.useState<Person[]>([]);
	const loadPeople = React.useCallback(async () => {
		try {
			const res = await api.get(`/api/v1/exhibitors/me/people`, { params: { exhibitionId: eventId } });
			const list = Array.isArray(res.data?.data) ? res.data.data as Person[] : [];
			setPeople(list);
		} catch {}
	}, [eventId]);
	React.useEffect(() => { loadPeople(); }, [loadPeople]);
	const handleSave = async () => {
		if (!fullName.trim()) return;
		try {
			setSaving(true);
			await api.post('/api/v1/exhibitors/me/people', { fullName, position, email, exhibitionId: eventId });
			setFullName(''); setEmail(''); setPosition('');
			await loadPeople();
		} finally {
			setSaving(false);
		}
	};
	return (
		<ThemeProvider theme={theme}>
			<Box sx={boxSx} >
				<Typography color={'var(--color-darkslategray)'}> E-Identyfikator </Typography>
				<TextField label="Imię i nazwisko" variant="standard" fullWidth value={fullName} onChange={(e) => setFullName(e.target.value)} />
				<TextField label="Email" variant="standard" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
				<TextField label="Stanowisko" variant="standard" fullWidth value={position} onChange={(e) => setPosition(e.target.value)} />
				<Box mt={2} width="100%">
					<Button variant="contained" color="secondary" onClick={handleSave} disabled={saving || !fullName.trim()} fullWidth>
						Zapisz osobę
					</Button>
				</Box>
				<Box mt={3} width="100%">
					<Typography fontSize={16}>Osoby dla tego wydarzenia</Typography>
					{people.map(p => (
						<Box key={p.id} display="flex" justifyContent="space-between" mt={1}>
							<Typography color={'var(--color-darkslategray)'}>{p.full_name}</Typography>
							<Typography color={'var(--color-gray-100)'}>{p.position || ''}</Typography>
						</Box>
					))}
					{people.length === 0 && (<Typography color="#bbb" mt={1}>Brak osób</Typography>)}
				</Box>
			</Box>
		</ThemeProvider>
	)

}

export default function ElectronicIdsCard() {
	const {filled} = useChecklist();
	const { eventId } = useParams();
	const eventIdNum = Number(eventId) || 0;

	return (
	<ChecklistCard icon={
			<img src={`/assets/checklist-step-4.svg`} alt=""></img>} 
			title={<Typography fontSize={16}> Generuj E-identyfikatory </Typography>} checked={filled[3]}> 
			<AddElectronicId eventId={eventIdNum} />
		</ChecklistCard>
	)
}