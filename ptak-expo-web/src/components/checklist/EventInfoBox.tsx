import { Box, Chip, Grid, IconButton, Typography } from "@mui/material";
import { EventInfo } from "../../services/checkListApi";
import { getEventKindString } from "../../shared/EventUtils";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useChecklist } from "../../contexts/ChecklistContext";
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
]
function DateCircle({date}: {date: string}) {
	console.log('[DateCircle] Received date:', date);
	
	// Ensure date is in YYYY-MM-DD format
	let normalizedDate = date;
	if (!date || typeof date !== 'string') {
		console.warn('[DateCircle] Invalid date:', date);
		normalizedDate = new Date().toISOString().slice(0, 10);
	}
	
	const parts = normalizedDate.split('-');
	const [year, m, d] = parts.map(x => +x);
	
	console.log('[DateCircle] Parsed parts:', { parts, year, m, d });
	
	const monthStr = months[m - 1] || 'err';
	const day = (d && !isNaN(d)) ? d.toString() : '?';
	
	return <Box width="40px" height="40px" borderRadius="20px" display="flex" flexDirection="column" alignItems="center" sx={{backgroundColor: "#89F4C9"}}>
		<Typography component="div" fontSize="20px" margin="-3px 0 0 0" >{day}</Typography>
		<Typography component="div" margin="-5px 0 0 0" fontSize="12px">{monthStr}</Typography>
	</Box>
}

export default function EventInfoBox({event, index, onEdit}: {event: EventInfo, index: number, onEdit: (index: number) => void}) {
    const { removeEvent } = useChecklist();
    return <Grid container marginY="20px">
			<Grid size={2} display="flex" flexDirection="column" alignItems="center">
				<DateCircle date={event.date}/>
			</Grid> 
            <Grid size={9.5}>
				<Chip variant="outlined" color="primary" label={getEventKindString(event.kind)} size="small"/>
				<Typography fontSize="16px" fontWeight="bold" marginTop="5px">{event.name}</Typography>
			</Grid> 
            <Grid size={0.5} display="flex" justifyContent="flex-end" alignItems="flex-start" gap={1}>
                <IconButton size="small" onClick={() => onEdit(index)} aria-label="Edytuj">
                    <EditIcon fontSize="small"/>
                </IconButton>
                <IconButton size="small" onClick={() => removeEvent(index)} aria-label="Usuń">
                    <DeleteIcon fontSize="small"/>
                </IconButton>
            </Grid>
			<Grid size={12} height="20px"/>
			<Grid size={2} display="flex" flexDirection="column" alignItems="center">
				<Typography fontSize="16px"> {event.startTime} &ndash; {event.endTime} </Typography>
			</Grid> 
            <Grid size={10}>
				<Typography fontSize="16px">{event.description}</Typography>
			</Grid> 
		</Grid>
}