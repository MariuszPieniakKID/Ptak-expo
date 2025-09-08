import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductInfo } from "../../services/checkListApi"
import { Autocomplete, Box, Button, Chip, TextField } from "@mui/material";
import config from "../../config/config";
import { useChecklist } from "../../contexts/ChecklistContext";

const emptyProduct: ProductInfo = {
	description: "",
	img: "",
	name: "",
	tags: []
}
export default function EditProduct({productNum, onClose} :{productNum?: number, onClose: () => void}) {
	const {checklist, addProduct, updateProduct} = useChecklist()
	const product = checklist.products[typeof productNum === 'number' ? productNum : -1];
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
					const base = config.API_BASE_URL || (window as any).API_BASE_URL || '';
					const url = q
						? `${base}/api/v1/catalog/tags?query=${encodeURIComponent(q)}`
						: `${base}/api/v1/catalog/tags`;
					const res = await fetch(url, {
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

	useEffect(() => {
		// Prefetch most popular tags when opening the editor
		debouncedFetch("");
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		fullWidth
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
		{editedProduct.img && (
			<Box sx={{ maxWidth: 240 }}>
				<Box component="img" src={editedProduct.img} alt="Zdjęcie produktu" sx={{ display: 'block', width: '100%', height: 'auto', maxHeight: 180, objectFit: 'contain', borderRadius: 1, border: '1px solid #eee' }} />
			</Box>
		)}
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
			if (typeof productNum === 'number' && productNum >= 0) {
				updateProduct(productNum, { ...editedProduct });
			} else {
				addProduct({...editedProduct}); 
			}
			onClose();
		}} disabled={!canSave} fullWidth>Zapisz</Button> 
	</Box>
}