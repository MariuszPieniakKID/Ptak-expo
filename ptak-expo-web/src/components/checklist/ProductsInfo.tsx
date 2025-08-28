import { Box, Typography } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";

export default function ProductsInfo() {
	var {checklist} = useChecklist();
	return (
	<ChecklistCard 
			icon={<img src={`/assets/checklist-step-1.svg`} alt=""></img>}
			title={<Typography fontSize={16}>Prezentowane produkty ({checklist.products.length})</Typography>}
			checked={checklist.products.length > 0}
		>
		{checklist.products.map(cp => 
		<Box display={"flex"} alignItems="center" gap="10px" marginY="16px" width="100%">
			<Box component="img"  sx={{ width: 40, height: 40, objectFit: "cover", objectPosition: "center", borderRadius: "20px" }}src={cp.img} alt=""/>
			<Box flex="1 1 auto" minWidth={0}>
				<Typography fontSize={16} fontWeight={"bold"}>{cp.name}</Typography>
				<Typography fontSize={13} color="rgba(111, 111, 111, 1)" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" >{cp.description}</Typography>
			</Box>
		</Box>
	)}
	</ChecklistCard>)
}
