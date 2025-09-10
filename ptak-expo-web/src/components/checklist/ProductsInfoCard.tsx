import { Box, IconButton, Typography } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import { Add } from "@mui/icons-material";
import { useState } from "react";
import EditProduct from "./EditProduct";

export default function ProductsInfo() {
	var {checklist, removeProduct} = useChecklist();
	var [showAdd, setShowAdd] = useState(false);
	const [editIndex, setEditIndex] = useState<number | null>(null);
	return (
	<ChecklistCard 
			icon={<img src={`/assets/checklist-step-1.svg`} alt=""></img>}
			title={<Typography fontSize={16}>Prezentowane produkty ({checklist.products.length})</Typography>}
			checked={checklist.products.length > 0}
		>
		{checklist.products.map(cp => {
			const i = checklist.products.indexOf(cp);
			const raw = (cp as any).tags;
			const tagsArr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(',').map(s => s.trim()).filter(Boolean) : []);
			return (
				<Box display={"flex"} alignItems="center" gap="10px" marginY="16px" width="100%" key={`${cp.name}-${i}`}>
					<Box component="img"  sx={{ width: 40, height: 40, objectFit: "cover", objectPosition: "center", borderRadius: "20px" }}src={cp.img} alt=""/>
					<Box flex="1 1 auto" minWidth={0}>
						<Typography fontSize={16} fontWeight={"bold"} onClick={() => setEditIndex(i)} sx={{ cursor: 'pointer' }}>{cp.name}</Typography>
						<Typography fontSize={13} color="rgba(111, 111, 111, 1)" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" onClick={() => setEditIndex(i)} sx={{ cursor: 'pointer' }} >{cp.description}</Typography>
						{tagsArr.length > 0 && (
							<Typography fontSize={12} color="var(--color-darkslategray)">Tagi: {tagsArr.join(', ')}</Typography>
						)}
					</Box>
					<IconButton aria-label="Usuń" onClick={() => { if (window.confirm('Czy na pewno chcesz usunąć ten produkt?')) removeProduct(i); }}>
						<img src="/assets/delete_confirm.svg" alt="Usuń" width={20} height={20} />
					</IconButton>
				</Box>
			)
		})}
		{!showAdd && <><IconButton onClick={() => setShowAdd(true)}><Add/></IconButton> Dodaj produkt</>}
		{showAdd && <EditProduct key={`add-${checklist.products.length}`} onClose={() => setShowAdd(false)}/>}
		{editIndex !== null && <EditProduct key={`edit-${editIndex}`} productNum={editIndex} onClose={() => setEditIndex(null)} />}
	</ChecklistCard>)
}