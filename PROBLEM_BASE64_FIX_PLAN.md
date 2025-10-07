# Problem Base64 - Plan Naprawy

## 🚨 Wykryty Problem

### Lokalizacje w kodzie gdzie zapisujemy base64:

1. **ptak-expo-web/src/components/checklist/CompanyInfo.tsx** (linia 154)
   - Logo firmy w checkliście
   - Używa `FileReader.readAsDataURL(file)`
   - Zapisuje przez `POST /api/v1/catalog/:exhibitionId`

2. **ptak-expo-web/src/components/checklist/EditProduct.tsx** (linia 30)
   - Obrazy produktów
   - Używa `FileReader.readAsDataURL(file)`
   - Zapisuje przez `POST /api/v1/catalog/:exhibitionId/products`

### Dane w produkcji (Railway):

- **Wszystkie** obrazy produktów są w base64
- Logo firm prawdopodobnie też w base64
- Endpoint JSON zwraca base64 zamiast URLi
- Przykład: `https://backend-production-df8c.up.railway.app/public/exhibitions/5/exhibitors.json`

## 🎯 Rozwiązanie

### Opcja 1: Użyć exhibitor-documents (ZALECANE)

**Backend:** Endpoint już istnieje i nie wymaga admin:
```
POST /api/v1/exhibitor-documents/:exhibitorId/:exhibitionId/upload
```

**Parametry:**
- `document` (file) - plik do uploadu
- `title` - tytuł
- `category` - 'inne_dokumenty' (dla obrazów katalogu)
- `documentSource` - 'exhibitor_checklist_materials'

**Frontend ptak-expo-web:**
1. Dodać helper funkcję `uploadCatalogImage()` w api.ts
2. Zmienić `CompanyInfo.tsx` i `EditProduct.tsx` żeby używały upload
3. Zwrócona nazwa pliku jest zapisywana w catalog entry

### Opcja 2: Dodać dedykowany endpoint (LEPSZE)

**Backend:** Nowy endpoint specjalnie dla obrazów katalogu:
```javascript
// W routes/catalog.js dodać:
router.post('/:exhibitionId/upload-image', verifyToken, requireExhibitorOrAdmin, upload.single('image'), async (req, res) => {
  // Upload image do uploads/catalog-images/
  // Return: { success: true, fileName: 'image123.png', url: '...' }
});
```

**Frontend:**
```typescript
// W ptak-expo-web/src/services/api.ts:
export const catalogAPI = {
  uploadImage: async (exhibitionId: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post(`/api/v1/catalog/${exhibitionId}/upload-image`, formData);
    return res.data.fileName; // Zwraca nazwę pliku
  }
};
```

## 📝 Kroki implementacji (Opcja 2 - zalecane):

### Backend:

1. ✅ Dodać endpoint `/api/v1/catalog/:exhibitionId/upload-image`
2. ✅ Upload do `uploads/catalog-images/{exhibitorId}/`
3. ✅ Zwrócić nazwę pliku
4. ✅ Dodać endpoint do serwowania: `/api/v1/catalog/serve/:fileName`

### Frontend ptak-expo-web:

1. ✅ Dodać `catalogAPI.uploadImage()` w `src/services/api.ts`
2. ✅ Zmienić `CompanyInfo.tsx`:
   - Zamiast `readAsDataURL()` użyć `uploadImage()`
   - Zapisać nazwę pliku w `logo` field
3. ✅ Zmienić `EditProduct.tsx`:
   - Zamiast `readAsDataURL()` użyć `uploadImage()`
   - Zapisać nazwę pliku w `img` field

### Migracja danych:

```sql
-- Znaleźć wszystkie base64:
SELECT id, exhibitor_id, logo 
FROM exhibitor_catalog_entries 
WHERE logo LIKE 'data:%';

SELECT id, exhibitor_id, products 
FROM exhibitor_catalog_entries 
WHERE products::text LIKE '%data:image%';
```

**Skrypt migracyjny:** (Node.js)
```javascript
const entries = await db.query(`SELECT id, exhibitor_id, products FROM exhibitor_catalog_entries WHERE products::text LIKE '%data:image%'`);

for (const entry of entries.rows) {
  const products = entry.products;
  for (let i = 0; i < products.length; i++) {
    if (products[i].img && products[i].img.startsWith('data:')) {
      // Decode base64
      const base64Data = products[i].img.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Save as file
      const fileName = `product_${entry.id}_${i}_${Date.now()}.png`;
      fs.writeFileSync(`uploads/catalog-images/${fileName}`, buffer);
      
      // Update DB
      products[i].img = fileName;
    }
  }
  
  await db.query(`UPDATE exhibitor_catalog_entries SET products = $1 WHERE id = $2`, [JSON.stringify(products), entry.id]);
}
```

## ⚠️ Uwagi:

1. **Nie używać branding API** - wymaga requireAdmin
2. **exhibitor-documents działa** ale jest przeznaczony dla dokumentów, nie obrazów
3. **Dedykowany endpoint** jest najlepszy - jasny cel, łatwa walidacja
4. **Migracja** powinna być uruchomiona raz po wdrożeniu nowego kodu

## 🎯 Priorytet:

1. **NAJPIERW:** Naprawić frontend żeby nie zapisywał nowego base64
2. **POTEM:** Zmigrować istniejące dane
3. **NA KOŃCU:** Zaktualizować dokumentację

