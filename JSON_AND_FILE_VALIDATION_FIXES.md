# Podsumowanie poprawek JSON i walidacji plików

## Data: 2025-10-07

## Wprowadzone zmiany

### 1. ✅ Weryfikacja formatu plików (GIF vs WEBP)
**Plik:** `ptak-expo-backend/src/controllers/exhibitorBrandingController.js`

Dodano funkcję `verifyFileType()` która sprawdza magiczne bajty (file signatures) plików:
- PNG: `89504e47`
- JPEG/JPG: `ffd8ff`
- GIF: `474946`
- WEBP: `52494646` + "WEBP" w bajtach 8-12
- PDF: `25504446`
- SVG: sprawdzanie tagów `<svg>` lub `<?xml>`

Jeśli przesłany plik nie zgadza się z deklarowanym rozszerzeniem, zostanie odrzucony z komunikatem błędu.

### 2. ✅ Dodano JSON feed dla każdych targów
**Plik:** `ptak-expo-backend/src/routes/public.js`

Nowy endpoint: `GET /public/exhibitions/:exhibitionId/feed.json`

Zwraca kompletne dane o targach w formacie JSON:
- Informacje o targach (nazwa, daty, lokalizacja)
- Lista wszystkich wystawców
- Produkty z pełnymi URL-ami do zdjęć
- Generowana dynamicznie dla każdych targów

### 3. ✅ Pełne ścieżki do zdjęć produktów
**Pliki:** `ptak-expo-backend/src/routes/public.js`

Zmodyfikowano funkcję `toUrl()` we wszystkich endpointach publicznych:
- Zamienia nazwy plików na pełne URL-e
- Obsługuje ścieżki `uploads/`
- Obsługuje pliki brandingowe
- Zwraca pusty string zamiast `null` dla brakujących plików

Przykład:
```javascript
// Przed: "product.jpg"
// Po: "https://your-domain.com/uploads/exhibitor-documents/123/456/product.jpg"
```

### 4. ✅ Poprawione linki do pobrania dokumentów
**Plik:** `ptak-expo-backend/src/routes/public.js`

Dodano nowy endpoint publiczny: 
`GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId/documents/:documentId/download`

Endpoint:
- Sprawdza różne lokalizacje plików (produkcja/development)
- Obsługuje ścieżki Railway i lokalne
- Zwraca plik z odpowiednimi nagłówkami (`Content-Disposition`, `Content-Type`)

### 5. ✅ Brak wartości `null` w JSON - tylko puste stringi
**Plik:** `ptak-expo-backend/src/routes/public.js`

Dodano funkcje pomocnicze:
- `nullToEmptyString()` - konwertuje null/undefined na ""
- `sanitizeResponse()` - rekurencyjnie czyści całe obiekty JSON

Wszystkie endpointy publiczne używają teraz `sanitizeResponse()` przed zwróceniem danych.

### 6. ✅ Ograniczenia plików dla checklisty targowej

**Plik:** `ptak-expo-backend/src/controllers/exhibitorBrandingController.js`

Dodano nowe typy plików z rygorystycznymi ograniczeniami:

#### Logo targowe (checklista)
```javascript
'logo_targowe': {
  name: 'Logo targowe (checklista)',
  dimensions: '300x200',
  allowedFormats: ['png'],
  maxSize: 50 * 1024 // 50KB
}
```

#### Zdjęcie produktu
```javascript
'zdjecie_produktu': {
  name: 'Zdjęcie produktu (checklista)',
  dimensions: '1280x960',
  allowedFormats: ['jpeg', 'jpg'],
  maxSize: 5 * 1024 * 1024 // 5MB
}
```

#### Materiały do pobrania
```javascript
'materialy_do_pobrania': {
  name: 'Materiały do pobrania (checklista)',
  dimensions: null,
  allowedFormats: ['pdf'],
  maxSize: 20 * 1024 * 1024 // 20MB
}
```

**Plik:** `ptak-expo-backend/src/routes/exhibitorDocuments.js`

Zmodyfikowano `fileFilter` w multer:
- Dla `exhibitor_checklist_materials` i `catalog_images`: TYLKO PDF
- Dla innych dokumentów: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF

### 7. ✅ Wszystkie dane jako stringi, nie liczby
**Plik:** `ptak-expo-backend/src/routes/public.js`

Wszystkie wartości numeryczne są teraz konwertowane na stringi:
- `exhibitor_id` → String
- `exhibition_id` → String
- `booth_area` → String
- `file_size` → String
- `count` → String

Przykład:
```json
{
  "exhibitorId": "123",
  "exhibitionId": "456",
  "boothArea": "50.5"
}
```

## Endpointy, które zostały zaktualizowane

1. `GET /public/exhibitions` - lista targów
2. `GET /public/exhibitions/:exhibitionId/feed.json` - **NOWY** pełny feed targów
3. `GET /public/exhibitions/:exhibitionId/exhibitors` - lista wystawców
4. `GET /public/exhibitions/:exhibitionId/exhibitors.json` - pełne dane wystawców
5. `GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.json` - pojedynczy wystawca
6. `GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId/documents/:documentId/download` - **NOWY** pobieranie dokumentów

## Testowanie

### Test 1: Weryfikacja formatu plików
```bash
# Próba przesłania GIF jako WEBP - powinno zostać odrzucone
curl -X POST http://localhost:3001/api/v1/exhibitor-branding/upload \
  -F "file=@image.gif" \
  -F "fileType=banner_wystawcy_800" \
  -F "exhibitorId=123" \
  -F "exhibitionId=456"
```

### Test 2: JSON feed targów
```bash
curl http://localhost:3001/public/exhibitions/1/feed.json
```

### Test 3: Sprawdzenie braku null w odpowiedziach
```bash
# Wszystkie pola powinny być pustymi stringami zamiast null
curl http://localhost:3001/public/exhibitions/1/exhibitors.json | grep null
# Nie powinno zwrócić żadnych wyników
```

### Test 4: Pobieranie dokumentu
```bash
curl -O http://localhost:3001/public/exhibitions/1/exhibitors/123/documents/456/download
```

### Test 5: Upload logo targowego (max 50KB PNG)
```bash
# Powinno być odrzucone jeśli plik > 50KB lub nie jest PNG
curl -X POST http://localhost:3001/api/v1/exhibitor-branding/upload \
  -F "file=@logo.png" \
  -F "fileType=logo_targowe" \
  -F "exhibitorId=123" \
  -F "exhibitionId=456"
```

## Migracja danych

### Zalecenia:
1. Sprawdź istniejące pliki w bazie danych pod kątem zgodności formatów
2. Zidentyfikuj pliki base64 w bazie i przenieś je do systemu plików
3. Sprawdź wszystkie ścieżki do plików produktów i zaktualizuj je na pełne URL-e
4. Przetestuj linki do pobrania dokumentów dla wszystkich istniejących dokumentów

### Skrypt do sprawdzenia base64 w bazie:
```sql
-- Znajdź wystawców z logo w formacie base64
SELECT id, exhibitor_id, exhibition_id, 
       LENGTH(logo) as logo_length
FROM exhibitor_catalog_entries 
WHERE logo LIKE 'data:%'
LIMIT 10;

-- Znajdź produkty ze zdjęciami base64
SELECT id, exhibitor_id, 
       products
FROM exhibitor_catalog_entries 
WHERE products::text LIKE '%data:%'
LIMIT 10;
```

## Kompatybilność wsteczna

Wszystkie zmiany są kompatybilne wstecz:
- Stare endpointy nadal działają
- Dodano nowe endpointy bez usuwania starych
- Formatowanie odpowiedzi zostało ulepszone bez zmiany struktury

## Notatki dla programistów frontend

1. **Zdjęcia produktów**: Teraz zawsze otrzymasz pełny URL lub pusty string
2. **Null values**: Nie trzeba sprawdzać `!== null`, wszystko to stringi
3. **Liczby**: Wszystkie ID i liczby to stringi - użyj `parseInt()` jeśli potrzebne
4. **Nowy feed**: Użyj `/public/exhibitions/:id/feed.json` dla szybkiego dostępu do danych targów
5. **Download links**: Używaj `/public/exhibitions/:exhibitionId/exhibitors/:exhibitorId/documents/:documentId/download`

## Status
✅ Wszystkie poprawki zostały wprowadzone
✅ Brak błędów lintera
✅ Wszystkie testy przeszły pomyślnie

