# API Wystawców - Instrukcja Użytkowania

## Publiczne Endpointy JSON dla Wystawców

### 1. Pobranie wszystkich wystawców dla wystawy (podstawowe dane)

**Endpoint:**
```
GET /public/exhibitions/:exhibitionId/exhibitors
```

**Opis:**
Zwraca listę wszystkich wystawców przypisanych do wystawy z podstawowymi danymi katalogowymi.

**Parametry:**
- `exhibitionId` (number) - ID wystawy

**Przykład:**
```bash
curl https://your-domain.com/public/exhibitions/1/exhibitors
```

**Odpowiedź:**
```json
{
  "success": true,
  "exhibitionId": 1,
  "exhibitors": [
    {
      "exhibitor_id": 123,
      "name": "Firma ABC Sp. z o.o.",
      "description": "Opis firmy...",
      "contact_info": "Jan Kowalski",
      "website": "https://example.com",
      "socials": {},
      "contact_email": "kontakt@example.com",
      "catalog_tags": "technologia, innowacje",
      "products": [...],
      "logoUrl": "https://your-domain.com/api/v1/exhibitor-branding/serve/global/logo123.png",
      "hallName": "Hala A",
      "standNumber": "123",
      "boothArea": 25.5,
      "nip": "1234567890",
      "address": "ul. Przykładowa 1",
      "postalCode": "00-001",
      "city": "Warszawa"
    }
  ]
}
```

---

### 2. Pobranie wszystkich wystawców dla wystawy (pełne dane) - NOWY ENDPOINT

**Endpoint:**
```
GET /public/exhibitions/:exhibitionId/exhibitors.json
```

**Opis:**
Zwraca pełne dane wszystkich wystawców przypisanych do wystawy, włączając:
- Informacje katalogowe (nazwa, logo, opis, kontakt)
- Produkty
- Wydarzenia targowe
- Dokumenty (z linkami do pobierania)
- Osoby (e-identyfikatory)
- Dane stoiska (hala, numer, powierzchnia)

**Parametry:**
- `exhibitionId` (number) - ID wystawy

**Przykład:**
```bash
curl https://your-domain.com/public/exhibitions/1/exhibitors.json
```

**Odpowiedź:**
```json
{
  "success": true,
  "exhibitionId": 1,
  "count": 50,
  "exhibitors": [
    {
      "exhibitorId": 123,
      "companyInfo": {
        "name": "Firma ABC Sp. z o.o.",
        "displayName": "ABC Company",
        "logoUrl": "https://your-domain.com/api/v1/exhibitor-branding/serve/global/logo123.png",
        "description": "Jesteśmy liderem w...",
        "whyVisit": "Odwiedź nas aby...",
        "contactInfo": "Jan Kowalski",
        "website": "https://example.com",
        "socials": {
          "facebook": "https://facebook.com/abc",
          "linkedin": "https://linkedin.com/company/abc"
        },
        "contactEmail": "kontakt@example.com",
        "catalogTags": "technologia, innowacje",
        "brands": "BrandA, BrandB",
        "industries": "IT, Electronics"
      },
      "exhibitor": {
        "nip": "1234567890",
        "address": "ul. Przykładowa 1",
        "postalCode": "00-001",
        "city": "Warszawa"
      },
      "stand": {
        "hallName": "Hala A",
        "standNumber": "123",
        "boothArea": 25.5
      },
      "products": [
        {
          "id": 1,
          "name": "Produkt 1",
          "description": "Opis produktu",
          "img": "https://...",
          "tags": ["tag1", "tag2"]
        }
      ],
      "events": [
        {
          "id": 456,
          "exhibition_id": 1,
          "exhibitor_id": 123,
          "name": "Prezentacja produktu",
          "event_date": "2025-10-15",
          "start_time": "10:00",
          "end_time": "11:00",
          "hall": "Hala A",
          "organizer": "Firma ABC",
          "description": "Zaprezentujemy nasz nowy produkt",
          "type": "Prezentacje produktów / marek",
          "link": "https://example.com/event",
          "created_at": "2025-01-01T10:00:00Z",
          "updated_at": "2025-01-02T10:00:00Z"
        }
      ],
      "documents": [
        {
          "id": 789,
          "title": "Katalog produktów",
          "description": "Katalog 2025",
          "category": "katalogi",
          "fileName": "katalog_2025.pdf",
          "originalName": "Katalog 2025.pdf",
          "fileSize": 1024000,
          "mimeType": "application/pdf",
          "createdAt": "2025-01-01T10:00:00Z",
          "downloadUrl": "https://your-domain.com/public/exhibitions/1/exhibitors/123/documents/789/download"
        }
      ],
      "people": [
        {
          "id": 321,
          "full_name": "Jan Kowalski",
          "position": "Przedstawiciel",
          "email": "jan.kowalski@example.com",
          "created_at": "2025-01-01T10:00:00Z"
        }
      ]
    }
  ]
}
```

---

### 3. Pobranie pojedynczego wystawcy (pełne dane)

**Endpoint:**
```
GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.json
```

**Opis:**
Zwraca pełne dane pojedynczego wystawcy dla danej wystawy.

**Parametry:**
- `exhibitionId` (number) - ID wystawy
- `exhibitorId` (number) - ID wystawcy

**Przykład:**
```bash
curl https://your-domain.com/public/exhibitions/1/exhibitors/123.json
```

**Odpowiedź:**
```json
{
  "success": true,
  "exhibitionId": 1,
  "exhibitorId": 123,
  "companyInfo": {
    "name": "Firma ABC Sp. z o.o.",
    "displayName": "ABC Company",
    "logoUrl": "https://your-domain.com/api/v1/exhibitor-branding/serve/global/logo123.png",
    ...
  },
  "exhibitor": {
    "nip": "1234567890",
    ...
  },
  "stand": {
    "hallName": "Hala A",
    ...
  },
  "products": [...],
  "events": [...],
  "documents": [...]
}
```

---

## Logotypy i Grafiki

### Format przechowywania
System **nie przechowuje** grafik jako base64 w bazie danych. Wszystkie obrazy są przechowywane jako pliki i zwracane jako **URLe**.

### Rodzaje URLi zwracanych przez API:

1. **Pełny URL (external)**
   ```
   https://external-domain.com/logo.png
   ```
   - Zwracany "as-is" jeśli logo jest przechowywane zewnętrznie

2. **URL do pliku w katalogu uploads**
   ```
   https://your-domain.com/uploads/branding/logo123.png
   ```
   - Dla plików przechowywanych lokalnie

3. **URL do endpointu branding**
   ```
   https://your-domain.com/api/v1/exhibitor-branding/serve/global/logo123.png
   ```
   - Dla plików przechowywanych w systemie brandingu

### Base64 (przestarzałe)
Jeśli w bazie danych znajduje się wartość `data:image/...` (base64), API zwraca `null` i loguje ostrzeżenie:
```
[public] Found base64 logo, should be migrated to file storage
```

**Zalecenie:** Wszystkie loga base64 powinny zostać zmigowane do przechowywania jako pliki.

---

## Przykłady użycia

### JavaScript/Node.js
```javascript
// Pobranie wszystkich wystawców (pełne dane)
const response = await fetch('https://your-domain.com/public/exhibitions/1/exhibitors.json');
const data = await response.json();

console.log(`Znaleziono ${data.count} wystawców`);
data.exhibitors.forEach(exhibitor => {
  console.log(`${exhibitor.companyInfo.name} - Stoisko: ${exhibitor.stand.standNumber}`);
  console.log(`Logo: ${exhibitor.companyInfo.logoUrl}`);
  console.log(`Produkty: ${exhibitor.products.length}`);
  console.log(`Wydarzenia: ${exhibitor.events.length}`);
});
```

### cURL
```bash
# Lista podstawowa
curl -s https://your-domain.com/public/exhibitions/1/exhibitors | jq '.exhibitors[] | {name, standNumber, logoUrl}'

# Pełne dane wszystkich wystawców
curl -s https://your-domain.com/public/exhibitions/1/exhibitors.json | jq '.exhibitors[] | {name: .companyInfo.name, stand: .stand.standNumber, products: (.products | length)}'

# Pojedynczy wystawca
curl -s https://your-domain.com/public/exhibitions/1/exhibitors/123.json | jq '.companyInfo'
```

### Python
```python
import requests

# Pobranie wszystkich wystawców
response = requests.get('https://your-domain.com/public/exhibitions/1/exhibitors.json')
data = response.json()

for exhibitor in data['exhibitors']:
    print(f"{exhibitor['companyInfo']['name']}")
    print(f"  Logo URL: {exhibitor['companyInfo']['logoUrl']}")
    print(f"  Produktów: {len(exhibitor['products'])}")
    print(f"  Wydarzeń: {len(exhibitor['events'])}")
    print()
```

---

## Uwagi techniczne

1. **Wydajność:**
   - Endpoint `.json` (pełne dane) wykonuje wiele zapytań do bazy danych (dla każdego wystawcy pobiera wydarzenia, dokumenty, osoby)
   - Dla dużej liczby wystawców może trwać dłużej niż podstawowy endpoint
   - Rozważ cache'owanie odpowiedzi

2. **Encoding:**
   - Wszystkie odpowiedzi JSON są zwracane z nagłówkiem `Content-Type: application/json; charset=utf-8`
   - Polskie znaki są poprawnie kodowane

3. **Dostęp:**
   - Endpointy są **publiczne** i nie wymagają autoryzacji
   - Dane są dostępne tylko dla wystawców przypisanych do danej wystawy

4. **Wersjonowanie:**
   - Endpointy znajdują się w przestrzeni `/public/exhibitions/`
   - W przyszłości mogą zostać dodane wersjonowane endpointy (np. `/api/v2/`)

---

## ⚠️ Problem: Checklisty zapisują base64

**Status bieżący:**
Komponent `CompanyInfo.tsx` (checklisty web) używa `FileReader.readAsDataURL()` co generuje base64 i zapisuje przez endpoint:
```
POST /api/v1/catalog/:exhibitionId
```

który przyjmuje pole `logo` jako string i zapisuje bezpośrednio do `exhibitor_catalog_entries.logo`.

**Zalecenie: Migracja**
System powinien zostać zmieniony żeby:

1. **Frontend (ptak-expo-web):**
   - Zmienić `ImageEdit` w `CompanyInfo.tsx` żeby uploadował plik przez branding API
   - Zamiast `readAsDataURL()` użyć `uploadBrandingFile()` z `fileType: 'logo'`
   - Zapisać w katalogu nazwę pliku zamiast base64

2. **Backend:**
   - Logo powinno być przechowywane jako nazwa pliku (np. `logo_123456.png`)
   - URL generowany dynamicznie przez API (już działa w public endpoints)

3. **Migracja danych:**
   - Odczytaj wszystkie rekordy `exhibitor_catalog_entries` gdzie `logo LIKE 'data:%'`
   - Dla każdego: dekoduj base64, zapisz jako plik, upload przez branding API
   - Zaktualizuj rekord z nazwą pliku zamiast base64

**Skrypt migracyjny** (przykład):
```javascript
// TODO: Implement migration script for base64 logos
// 1. Query: SELECT id, exhibitor_id, logo FROM exhibitor_catalog_entries WHERE logo LIKE 'data:%'
// 2. For each:
//    a) Decode base64: const buffer = Buffer.from(base64Data, 'base64')
//    b) Save as file: fs.writeFileSync(tempPath, buffer)
//    c) Upload via branding API: uploadBrandingFile(file, exhibitorId, null, 'logo', adminToken)
//    d) Update DB: UPDATE exhibitor_catalog_entries SET logo = 'filename.png' WHERE id = ...
// 3. Verify all logos accessible via URL
```

**Dlaczego to ważne:**
- Base64 w bazie zwiększa rozmiar (~33% większy niż binarne)
- Wolniejsze zapytania i transfer
- Brak cache'owania po stronie przeglądarki
- Problemy z CDN i optymalizacją obrazów

---

## Wsparcie

W razie problemów lub pytań:
- Sprawdź logi backendu dla szczegółów błędów
- Upewnij się że `exhibitionId` i `exhibitorId` są poprawne
- Sprawdź czy wystawca jest przypisany do wystawy w tabeli `exhibitor_events`

