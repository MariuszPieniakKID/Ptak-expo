import { Box, IconButton, Typography } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import { Add } from "@mui/icons-material";
import { useCallback } from "react";

function AddMaterial({ onChangeFile }: {onChangeFile: (file: File) => void}) {
	const handleFileInput = useCallback((e : React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files == null) return;
		const file = e.target.files[0];
		if (file == null) return;
		onChangeFile(file);

	}, [onChangeFile])
	return (

		<Box display="flex" alignItems="center">
			<input
				onChange={handleFileInput}
				type="file"
				hidden
				accept="application/pdf"
				id="file-input"
			/>
			<label htmlFor="file-input">
			<IconButton component="span">
				<Add/></IconButton> Dodaj pliki do pobrania
			</label>
		</Box>);
}
export default function MaterialsCard() {
	const {filled, checklist, uploadMaterialFile} = useChecklist();

	return (
	<ChecklistCard icon={
			<img src={`/assets/checklist-step-3.svg`} alt=""></img>} 
			title={<Typography fontSize={16}>Materiały do pobrania ({checklist.downloadMaterials.length})</Typography>} checked={filled[2]}> 
				{checklist.downloadMaterials.map(dm => 
					<Box key={dm.fileUri || dm.fileName} display="flex" flexDirection={"row"} alignItems="center" component="a" href={dm.fileUri} target="_blank" rel="noreferrer" margin="20px 20px" gap="20px">
						<img src="/assets/pdf-file.svg" alt=""/><Typography fontSize="16px" color="var(--color-darkslategray)" sx={{textDecoration:"none"}}>{dm.fileName}</Typography>
					</Box>)}
			<AddMaterial onChangeFile={async (file) => { await uploadMaterialFile(file);} }/>
	</ChecklistCard>
	)
}