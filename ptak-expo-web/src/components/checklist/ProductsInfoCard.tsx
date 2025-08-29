import { Box, IconButton, Typography } from "@mui/material";
import ChecklistCard from "./ChecklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import { Add } from "@mui/icons-material";
import { useState } from "react";
import EditProduct from "./EditProduct";

export default function ProductsInfo() {
	var {checklist} = useChecklist();
	var [showAdd, setShowAdd] = useState(false);
	return (
	<ChecklistCard 
			icon={<img src={`/assets/checklist-step-1.svg`} alt=""></img>}
			title={<Typography fontSize={16}>Prezentowane produkty ({checklist.products.length})</Typography>}
			checked={checklist.products.length > 0}
		>
		{checklist.products.map(cp => 
		<Box display={"flex"} alignItems="center" gap="10px" marginY="16px" width="100%" key={cp.name}>
			<Box component="img"  sx={{ width: 40, height: 40, objectFit: "cover", objectPosition: "center", borderRadius: "20px" }}src={cp.img} alt=""/>
			<Box flex="1 1 auto" minWidth={0}>
				<Typography fontSize={16} fontWeight={"bold"}>{cp.name}</Typography>
				<Typography fontSize={13} color="rgba(111, 111, 111, 1)" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" >{cp.description}</Typography>
			</Box>
		</Box>
	)}
	{!showAdd && <><IconButton onClick={() => setShowAdd(true)}><Add/></IconButton> Dodaj produkt</>}
	{showAdd && <EditProduct key={checklist.products.length} onClose={() => setShowAdd(false)}/>}
	</ChecklistCard>)
}