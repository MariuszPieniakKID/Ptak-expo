import { useEffect, useState } from "react";
import { EventInfo, EventKind, EventType, getEventKindString } from "../../services/checkListApi"
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Alert } from "@mui/material";
import { useChecklist } from "../../contexts/ChecklistContext";
import { eventTypes, getEventTypeString } from "../../shared/EventUtils";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const emptyEvent: EventInfo = {
	name: "",
	date: "",
	description: "",
	startTime: "",
	endTime: "",
	kind: EventKind.PRESENTATION,
	type: EventType.OPEN
}
// Previously used to generate a list of dates; replaced by DateCalendar
const times: string[] = [];
for(let i = 8; i <= 21; i++) {
	const h = i.toString().padStart(2, "0");
	times.push(h+":00");
	times.push(h+":30");
}




export default function EditEvent({eventNum, onClose} :{eventNum?: number, onClose: () => void}) {
    const {checklist, addEvent, updateEvent} = useChecklist();
    const effectiveIndex = (typeof eventNum === 'number') ? eventNum : -1;
    const event = checklist.events[effectiveIndex];
	const [editedEvent, setEditedEvent] = useState<EventInfo>(emptyEvent);
	const [saveError, setSaveError] = useState("");
	const [saving, setSaving] = useState(false);
	const canSave = 
		editedEvent.description && 
		editedEvent.date && 
		editedEvent.startTime && 
		editedEvent.endTime && 
		editedEvent.name &&
		editedEvent.startTime < editedEvent.endTime;
    useEffect(() => setEditedEvent(event || emptyEvent), [event]);
    const kindOptions: EventKind[] = [
        EventKind.PRESENTATION,
        EventKind.LIVE,
        EventKind.WORKSHOP,
        EventKind.EDUCATION,
        EventKind.SETUP,
        EventKind.TEARDOWN,
    ];
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
			<LocalizationProvider dateAdapter={AdapterDayjs}>
				<DatePicker 
					value={editedEvent.date ? dayjs(editedEvent.date) : null}
					onChange={(val:any) => setEditedEvent({...editedEvent, date: val ? val.format('YYYY-MM-DD') : ''})}
					format={'YYYY-MM-DD'}
				/>
			</LocalizationProvider>
		</Grid>
		<Grid size={2}>
			<FormControl variant="standard" fullWidth>
        <InputLabel id="start-time-label">Początek</InputLabel>
        <Select
          labelId="start-time-label"
          id="start-time-select"
          value={editedEvent.startTime}
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
          labelId="event-kind-label"
          id="event-kind-select"
          value={kindOptions.indexOf(editedEvent.kind)}
          onChange={e => setEditedEvent({...editedEvent, kind: kindOptions[+e.target.value]})}
          label="Określ typ wydarzenia"
        >
                    {kindOptions.map((d, i) => <MenuItem value={i} key={d}>{getEventKindString(d)}</MenuItem>)}
        </Select>
      </FormControl>
		</Grid>
    {saveError ? <Grid size={12}><Alert severity="error">{saveError}</Alert></Grid> : null}
		<Button onClick={async ()=> { 
        setSaveError("");
        setSaving(true);
        try { 
          if (typeof eventNum === 'number') {
            await updateEvent(eventNum, editedEvent);
          } else {
            await addEvent(editedEvent);
          }
          onClose();
        } catch (e: any) {
          setSaveError(e?.message || "Nie udało się dodać wydarzenia");
        } finally {
          setSaving(false);
        }
      }} disabled={!canSave || saving}>{typeof eventNum === 'number' ? 'Zapisz zmiany' : 'Zapisz'}</Button> 
	</Grid>
}