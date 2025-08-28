import { ReactNode } from "react";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { ApplyGreenCheck } from "./ApplyGreenCheck";

export default function ChecklistCard({children, title, icon, checked} : {children: ReactNode, title: ReactNode, icon: ReactNode, checked: boolean}) {
	return <Accordion sx={{
		borderRadius: "20px",
		'&:before': {
				display: 'none',
		}}}>
			<AccordionSummary 
				slotProps={{content: {sx: {alignItems: "center", gap: "10px"}}}}
				expandIcon={<ExpandMore />}
			>
				<ApplyGreenCheck checked={checked} nomargin>{icon}</ApplyGreenCheck>
				{title}
			</AccordionSummary>
			<AccordionDetails>{children}</AccordionDetails>
		</Accordion>
}
