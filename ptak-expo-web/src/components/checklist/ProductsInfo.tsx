import { Box, Typography } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import config from "../../config/config";

export default function ProductsInfo() {
	var {checklist} = useChecklist();
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
			
			// Generate proper image URL
			const imageUrl = cp.img
				? (cp.img.startsWith('data:') || cp.img.startsWith('http')
					? cp.img
					: cp.img.startsWith('uploads/')
						? `${config.API_BASE_URL}/${cp.img}`
						: `${config.API_BASE_URL}/uploads/${cp.img}`)
				: '/assets/placeholder-product.png'; // fallback image
			
			return (
				<Box display={"flex"} alignItems="center" gap="10px" marginY="16px" width="100%" key={`${cp.name}-${i}`}>
					<Box component="img"  sx={{ width: 40, height: 40, objectFit: "cover", objectPosition: "center", borderRadius: "20px" }} src={imageUrl} alt=""/>
					<Box flex="1 1 auto" minWidth={0}>
						<Typography fontSize={16} fontWeight={"bold"}>{cp.name}</Typography>
						<Typography fontSize={13} color="rgba(111, 111, 111, 1)" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" >{cp.description}</Typography>
						{tagsArr.length > 0 && (
							<Typography fontSize={12} color="var(--color-darkslategray)">Tagi: {tagsArr.join(', ')}</Typography>
						)}
					</Box>
				</Box>
			)
		})}
	</ChecklistCard>)
}
