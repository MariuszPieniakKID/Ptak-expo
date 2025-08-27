import { ReactNode } from "react";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

export default function ChecklistCard({children, title} : {children: ReactNode, title: ReactNode}) {
	return <Accordion sx={{
		borderRadius: "20px",
		'&:before': {
				display: 'none',
		}}}>
			<AccordionSummary 
				slotProps={{content: {sx: {alignItems: "center", gap: "10px"}}}}
				expandIcon={<ExpandMore />}
			>
				{title}
			</AccordionSummary>
			<AccordionDetails>{children}</AccordionDetails>
		</Accordion>
}