import { useEffect, useMemo, useState } from "react";
import { EventInfo, EventKind, EventType } from "../../services/checkListApi"
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useChecklist } from "../../contexts/ChecklistContext";
import { eventKinds, eventTypes, getEventKindString, getEventTypeString } from "../../shared/EventUtils";

const emptyEvent: EventInfo = {
	name: "",
	date: "",
	description: "",
	startTime: "",
	endTime: "",
	kind: EventKind.PRESENTATION,
	type: EventType.OPEN
}
const startDate = "2025-10-20";
const endDate = "2025-11-04";
function getDatesBetween(startDate: string, endDate: string) {
  const dates = [];
  let current = new Date(startDate + "T00:00:00Z");

  while (current <= new Date(endDate + "T00:00:00Z")) {
    dates.push(current.toISOString().split('T')[0]); // YYYY-MM-DD
    current = new Date(current.valueOf() + 24 * 60 * 60 * 1000);
  }

  return dates;
}
const times: string[] = [];
for(let i = 8; i <= 21; i++) {
	const h = i.toString().padStart(2, "0");
	times.push(h+":00");
	times.push(h+":30");
}




export default function EditEvent({eventNum, onClose} :{eventNum?: number, onClose: () => void}) {
	const {checklist, addEvent} = useChecklist();
	const event = checklist.events[eventNum || -1];
	const [editedEvent, setEditedEvent] = useState<EventInfo>(emptyEvent);
	const dates = useMemo(() => getDatesBetween(startDate, endDate), [])
	const canSave = 
		editedEvent.description && 
		editedEvent.date && 
		editedEvent.startTime && 
		editedEvent.endTime && 
		editedEvent.name &&
		editedEvent.startTime < editedEvent.endTime;
	useEffect(() => setEditedEvent(event || emptyEvent), [event]);
	return <Grid container spacing={2} component="form">
		<Grid size={6}>
			<TextField 
					label="Nazwa wydarzenia" 
					value={editedEvent.name} 
					fullWidth
					variant="standard"
					onChange={e => setEditedEvent({...editedEvent, name: e.target.value})}
				/>
			</Grid>
		<Grid size={6}/>
		<Grid size={2}>
			<FormControl variant="standard" fullWidth>
        <InputLabel id="date-label">Data</InputLabel>
        <Select
          labelId="date-label"
          id="date-select"
          value={editedEvent.date}
          onChange={e => setEditedEvent({...editedEvent, date: e.target.value})}
          label="Data"
        >
					<MenuItem value="">Wybierz</MenuItem>
					{dates.map(d => <MenuItem value={d} key={d}>{d}</MenuItem>)}
        </Select>
      </FormControl>
		</Grid>
		<Grid size={2}>
			<FormControl variant="standard" fullWidth>
        <InputLabel id="start-time-label">Początek</InputLabel>
        <Select
          labelId="start-time-label"
          id="start-time-select"
          value={editedEvent.startTime}
					fullWidth
          onChange={e => setEditedEvent({...editedEvent, startTime: e.target.value})}
          label="Początek"
        >
					<MenuItem value="">Wybierz</MenuItem>
					{times.map(d => <MenuItem value={d} key={d}>{d}</MenuItem>)}
        </Select>
      </FormControl>
		</Grid>
		<Grid size={2}>
			<FormControl variant="standard" fullWidth>
        <InputLabel id="end-time-label">Koniec</InputLabel>
        <Select
					inputProps={{fullWidth: true}}
          labelId="end-time-label"
          id="end-time-select"
          value={editedEvent.endTime}
          onChange={e => setEditedEvent({...editedEvent, endTime: e.target.value})}
          label="Koniec"
        >
					<MenuItem value="">Wybierz</MenuItem>
					{times.map(d => <MenuItem value={d} key={d}>{d}</MenuItem>)}
        </Select>
      </FormControl>
		</Grid>
		<Grid size={12}>
			<TextField 
					label="Opis wydarzenia" 
					fullWidth
					variant="standard"
					minRows={3}
					multiline
					value={editedEvent.description} 
					onChange={e => setEditedEvent({...editedEvent, description: e.target.value})}
				/>
		</Grid>
		<Grid size={6}>
			<FormControl variant="standard" fullWidth>
        <InputLabel id="event-type-label">Określ typ wydarzenia</InputLabel>
        <Select
					inputProps={{fullWidth: true}}
          labelId="event-type-label"
          id="event-type-select"
          value={editedEvent.type}
          onChange={e => setEditedEvent({...editedEvent, type: eventTypes[+e.target.value]})}
          label="Określ typ wydarzenia"
        >
					{eventTypes.map((d, i) => <MenuItem value={i} key={d}>{getEventTypeString(d)}</MenuItem>)}
        </Select>
      </FormControl>
		</Grid>
		<Grid size={6}/>
		<Grid size={6}>
			<FormControl variant="standard" fullWidth>
        <InputLabel id="event-type-label">Określ rodzaj wydarzenia</InputLabel>
        <Select
					inputProps={{fullWidth: true}}
          labelId="event-kind-label"
          id="event-kind-select"
          value={eventKinds.indexOf(editedEvent.kind)}
          onChange={e => setEditedEvent({...editedEvent, kind: eventKinds[+e.target.value]})}
          label="Określ typ wydarzenia"
        >
					{eventKinds.map((d, i) => <MenuItem value={i} key={d}>{getEventKindString(d)}</MenuItem>)}
        </Select>
      </FormControl>
		</Grid>
		{/* TODO support update */}
		<Button onClick={()=> { addEvent(editedEvent); onClose();}} disabled={!canSave} fullWidth>Zapisz</Button> 
	</Grid>
}