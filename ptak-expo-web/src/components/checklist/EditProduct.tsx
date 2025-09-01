import { useCallback, useEffect, useState } from "react";
import { ProductInfo } from "../../services/checkListApi"
import { Box, Button, TextField, Typography } from "@mui/material";
import { useChecklist } from "../../contexts/ChecklistContext";

const emptyProduct: ProductInfo = {
	description: "",
	img: "",
	name: "",
	tags: []
}
export default function EditProduct({productNum, onClose} :{productNum?: number, onClose: () => void}) {
	const {checklist, addProduct} = useChecklist()
	const product = checklist.products[productNum || -1];
	const [editedProduct, setEditedProduct] = useState<ProductInfo>(emptyProduct)
	const [tagsText, setTagsText] = useState<string>("")
	const canSave = editedProduct.description && editedProduct.img && editedProduct.name;
	useEffect(() => { 
		setEditedProduct(product || emptyProduct);
		setTagsText(((product?.tags) || []).join(", "));
	}, [product]);
	const handleFileInput = useCallback((e : React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files == null) return;
		const file = e.target.files[0];
		if (file == null) return;
		const reader = new FileReader();
		reader.onload = le => {
			setEditedProduct({...editedProduct, img: le.target?.result?.toString() || ""}); // set <img src> to file content
		};
    reader.readAsDataURL(file);

	}, [editedProduct])
	return <Box display="flex" flexDirection="column" gap="10px">
	<TextField 
			label="Nazwa" 
			value={editedProduct.name} 
			fullWidth
			onChange={e => setEditedProduct({...editedProduct, name: e.target.value})}
		/>
	<TextField 
			label="Opis" 
			fullWidth
			multiline
			value={editedProduct.description} 
			onChange={e => setEditedProduct({...editedProduct, description: e.target.value})}
		/>
	<TextField 
			label="Tagi (oddzielone przecinkami)" 
			fullWidth
			placeholder="np. dom, drewniany, premium"
			value={tagsText}
			onChange={e => setTagsText(e.target.value)}
		/>
		{(editedProduct.tags && editedProduct.tags.length > 0) && (
			<Typography variant="caption" color="text.secondary">Tagi: {(editedProduct.tags || []).join(', ')}</Typography>
		)}
		{editedProduct.img && <img src={editedProduct.img} alt="Zdjęcie produktu"/>}
		<Button
			component="label"
			fullWidth
		>
			Dodaj zdjęcie produktu
			<input
			onChange={handleFileInput}
				type="file"
				hidden
				accept="image/*"
			/>
		</Button>
		{/* TODO support update */}
		<Button onClick={()=> { 
			const tags = tagsText.split(',').map(s => s.trim()).filter(Boolean);
			addProduct({...editedProduct, tags}); 
			onClose();
		}} disabled={!canSave} fullWidth>Zapisz</Button> 
	</Box>
}