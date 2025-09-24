import { Box, Button, createTheme, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableRow, TextField, ThemeProvider, Typography } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import { EidType, ElectrionicId } from "../../services/checkListApi";
import { useState } from "react";
import { eidTypes, getEidTypeString } from "../../shared/EventUtils";
const boxSx = {
	backgroundColor: '#fff',
	padding: "40px",
	margin:"0px -16px",
	borderRadius: "20px",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	color: 'var(--color-darkslategray)',
	gap: "10px",
	position: 'relative',
	zIndex: 1,
	overflow: 'hidden'
}; 
export const blackTheme = createTheme({
	palette: { mode: 'light' }
});
const emptyId : ElectrionicId = {
	email: "",
	name: "",
	type: EidType.TECH_WORKER,
}

function AddElectronicId() {
	const { addElectronicId } = useChecklist()
	const [editedId, setEditedId] = useState(emptyId);
	const isValidEmail = editedId.email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(editedId.email);
	const isValid = editedId.name && editedId.email && editedId.type >= 0 && isValidEmail;
	return (
		<ThemeProvider theme={blackTheme}>
			<Box sx={boxSx} >
				{/* Usunięto grafikę/logo z formularza e-identyfikatorów */}
				<Typography> E-Identyfikator </Typography>
				<TextField label="Imię nazwisko gościa" variant="standard" fullWidth 
					value={editedId.name} onChange = {e => setEditedId({...editedId, name: e.target.value})}/>
				<TextField label="Email" variant="standard" fullWidth
					error={!isValidEmail} helperText={!isValidEmail && "To nie jest poprawny adres e-mail"}
					value={editedId.email} onChange = {e => setEditedId({...editedId, email: e.target.value})}/>
				<FormControl variant="standard" fullWidth>
					<InputLabel id="event-type-label">Określ typ wydarzenia</InputLabel>
					<Select
						labelId="event-type-label"
						id="event-type-select"
						value={editedId.type}
						onChange={e => setEditedId({...editedId, type: eidTypes[+e.target.value]})}
						label="Określ typ wydarzenia"
						fullWidth
					>
						{eidTypes.map((d, i) => <MenuItem value={i} key={String(d)}>{getEidTypeString(d)}</MenuItem>)}
					</Select>
				</FormControl>
				<Button variant="contained" fullWidth disabled = {!isValid} onClick={() => {addElectronicId(editedId); setEditedId(emptyId)}}>Generuj i wyślij</Button>

			</Box>
		</ThemeProvider>
	)

}

export default function ElectronicIdsCard() {
	const {filled, checklist} = useChecklist();

	return (
	<ChecklistCard icon={
			<img src={`/assets/checklist-step-6.svg`} alt=""></img>} 
			title={<Typography fontSize={16}> Generuj E-identyfikatory ({checklist.electrionicIds.length})</Typography>} checked={filled[5]}> 
			<AddElectronicId />
			<Table>
				<TableBody>
					{checklist.electrionicIds.map((eid, i) => 
						<TableRow key={`${eid.email}-${i}`}>
							<TableCell>{i+1}</TableCell>
							<TableCell>{eid.name}</TableCell>
							<TableCell>{eid.email}</TableCell>
							<TableCell>{getEidTypeString(eid.type)}</TableCell>
							<TableCell>
								{eid.accessCode ? <Typography fontSize={10} sx={{ whiteSpace: 'nowrap' }}>{eid.accessCode}</Typography> : null}
							</TableCell>
						</TableRow>)}

				</TableBody>
			</Table>

		</ChecklistCard>
	)
}