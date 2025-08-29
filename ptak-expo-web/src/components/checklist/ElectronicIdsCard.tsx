import { Box, createTheme, FormControl, InputLabel, MenuItem, Select, TextField, ThemeProvider, Typography } from "@mui/material";
import ChecklistCard from "./ChecklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
const boxSx = {
	backgroundColor: 'var(--color-darkslategray)',
	padding: "40px",
	margin:"0px -16px",
	borderRadius: "20px",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	color: "white"
}; 
const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

function AddElectronicId() {
	const { checklist } = useChecklist()
	return (
		<ThemeProvider theme={theme}>
			<Box sx={boxSx} >
				{checklist.companyInfo.logo && <img src={checklist.companyInfo.logo} alt="Logo firmy" className="eid-img-logo" />}
				<Typography> E-Identyfikator </Typography>
				<TextField label="Imię nazwisko gościa" variant="standard" fullWidth/>
				<TextField label="Email" variant="standard" fullWidth/>
				<FormControl variant="standard" fullWidth>
					<InputLabel id="position-label">Stanowisko</InputLabel>
					<Select
						labelId="position-label"
						id="position-select"
						/*value={}
						onChange={e => setEditedEvent({...editedEvent, date: e.target.value})}
						label="Data"*/
					>
						<MenuItem value="" disabled>Wybierz</MenuItem>
					</Select>
				</FormControl>

			</Box>
		</ThemeProvider>
	)

}

export default function ElectronicIdsCard() {
	const {filled} = useChecklist();

	return (
	<ChecklistCard icon={
			<img src={`/assets/checklist-step-4.svg`} alt=""></img>} 
			title={<Typography fontSize={16}> Generuj E-identyfikatory </Typography>} checked={filled[3]}> 
			<AddElectronicId />

			None
	</ChecklistCard>
	)
}