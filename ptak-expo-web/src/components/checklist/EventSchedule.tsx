import { IconButton, Typography } from "@mui/material";
import { useChecklist } from "../../contexts/ChecklistContext";
import ChecklistCard from "./checklistCard";
import AddEvent from "./EditEvent";
import { useState } from "react";
import { Add } from "@mui/icons-material";
import EventInfoBox from "./EventInfoBox";

export default function EventSchedule() {
	const {filled, checklist} = useChecklist();
	var [showAdd, setShowAdd] = useState(false);
	return (
		<ChecklistCard 
				title={<Typography fontSize={16}>Plan wydarzeń na stoisku ({checklist.events.length})</Typography>} 
				icon={<img src={`/assets/checklist-step-5.svg`} alt=""></img>} 
				checked={filled[4]}
		>
			{checklist.events.map(e => <EventInfoBox event={e}/>)}

			{!showAdd && <><IconButton onClick={() => setShowAdd(true)}><Add/></IconButton> Dodaj wydarzenie</>}
			{showAdd && <AddEvent key={checklist.events.length} onClose={() => setShowAdd(false)}/>}
		</ChecklistCard>)
}