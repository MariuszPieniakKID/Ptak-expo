import { Box, Chip, Grid, Typography } from "@mui/material";
import { EventInfo } from "../../services/checkListApi";
import { getEventKindString } from "../../shared/EventUtils";
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, m, d] = date.split('-').map(x => +x);
	const monthStr = months[m - 1];
	const day = d.toString();
	return <Box width="40px" height="40px" borderRadius="20px" display="flex" flexDirection="column" alignItems="center" sx={{backgroundColor: "#89F4C9"}}>
		<Typography component="div" fontSize="20px" margin="-3px 0 0 0" >{day}</Typography>
		<Typography component="div" margin="-5px 0 0 0" fontSize="12px">{monthStr}</Typography>
	</Box>
}

export default function EventInfoBox({event}: {event: EventInfo}) {
	return <Grid container marginY="20px">
			<Grid size={2} display="flex" flexDirection="column" alignItems="center">
				<DateCircle date={event.date}/>
			</Grid> 
			<Grid size={10}>
				<Chip variant="outlined" color="primary" label={getEventKindString(event.kind)} size="small"/>
				<Typography fontSize="16px" fontWeight="bold" marginTop="5px">{event.name}</Typography>
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