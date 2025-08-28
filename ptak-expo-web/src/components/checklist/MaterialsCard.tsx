import { Box, Button, IconButton, Typography } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import { Add } from "@mui/icons-material";
import { useCallback, useState } from "react";

function AddMaterial({ onChange }: {onChange: (name: string, uri: string) => void}) {
	const handleFileInput = useCallback((e : React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files == null) return;
		const file = e.target.files[0];
		if (file == null) return;
		const reader = new FileReader();
		reader.onload = le => {
			onChange(file.name, le.target?.result?.toString() || ""); 
		};
    reader.readAsDataURL(file);

	}, [onChange])
	return (
		<Box display="flex" alignItems="center">
			<Button
				component="label"
				fullWidth
			>
				Dodaj materiał
				<input
					onChange={handleFileInput}
					type="file"
					hidden
					accept="application/pdf"
				/>
			</Button>
		</Box>);
}
export default function MaterialsCard() {
	const {filled, checklist, addMaterial} = useChecklist();
	var [showAdd, setShowAdd] = useState(false);

	return (
	<ChecklistCard icon={
			<img src={`/assets/checklist-step-3.svg`} alt=""></img>} 
			title={<Typography fontSize={16}>Materiały do pobrania ({checklist.downloadMaterials.length})</Typography>} checked={filled[4]}> 
				{checklist.downloadMaterials.map(dm => 
					<Box display="flex" flexDirection={"row"} alignItems="center" component="a" href={dm.fileUri} target="_blank" rel="noreferrer" margin="20px 20px" gap="20px">
						<img src="/assets/pdf-file.svg" alt=""/><Typography fontSize="16px" color="var(--color-darkslategray)" sx={{textDecoration:"none"}}>{dm.fileName}</Typography>
					</Box>)}
			{!showAdd && <><IconButton onClick={() => setShowAdd(true)}><Add/></IconButton> Dodaj pliki do pobrania</>}
			{showAdd && <AddMaterial key={checklist.products.length} onChange={(fileName, fileUri) => { addMaterial({fileName, fileUri}); setShowAdd(false);} }/>}
	</ChecklistCard>
	)
}