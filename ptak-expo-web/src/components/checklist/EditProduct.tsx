import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductInfo } from "../../services/checkListApi"
import { Autocomplete, Box, Button, Chip, TextField } from "@mui/material";
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
	const [tagOptions, setTagOptions] = useState<string[]>([]);
	const canSave = editedProduct.description && editedProduct.img && editedProduct.name;
	useEffect(() => { 
		setEditedProduct(product || emptyProduct);
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

	const debouncedFetch = useMemo(() => {
		let t: any;
		return (q: string) => {
			clearTimeout(t);
			t = setTimeout(async () => {
				try {
					const token = localStorage.getItem('authToken') || '';
					const res = await fetch(`${(window as any).API_BASE_URL || ''}/api/v1/catalog/tags?query=${encodeURIComponent(q)}`, {
						headers: { Authorization: `Bearer ${token}` }
					});
					if (res.ok) {
						const json = await res.json();
						const arr = Array.isArray(json.data) ? json.data.map((r: any) => String(r.tag)) : [];
						setTagOptions(arr);
					}
				} catch {}
			}, 250);
		};
	}, []);

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
	<Autocomplete
		multiple
		freeSolo
		options={tagOptions}
		value={editedProduct.tags || []}
		onInputChange={(_, q) => debouncedFetch(q)}
		onChange={(_, value) => setEditedProduct({ ...editedProduct, tags: (value as string[]).map(v => String(v).trim()).filter(Boolean) })}
		renderTags={(value: readonly string[], getTagProps) =>
			value.map((option: string, index: number) => (
				<Chip variant="outlined" label={option} {...getTagProps({ index })} />
			))
		}
		renderInput={(params) => (
			<TextField
				{...(params as any)}
				size="small"
				label="Tagi (wybierz z listy lub wpisz)"
				placeholder="np. dom, drewniany, premium"
			/>
		)}
	/>
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
		<Button onClick={()=> { 
			addProduct({...editedProduct}); 
			onClose();
		}} disabled={!canSave} fullWidth>Zapisz</Button> 
	</Box>
}