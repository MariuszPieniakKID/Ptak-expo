# RAPORT: Problem z grafikami w JSON

## Data: 2025-10-06

## PROBLEM

JSON z publicznego endpointu `/public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.json` zwraca grafiki jako **ogromne stringi base64** zamiast URL-i.

### Przykład:
```json
{
  "logoUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAeAB4AAD...[SETKI KB DANYCH]..."
}
```

### Konsekwencje:
1. ❌ JSON ma kilka MB na każdego wystawcę
2. ❌ Wolne ładowanie i parsowanie
3. ❌ Niemożliwe bezpośrednie pobranie grafiki przez zewnętrzne systemy
4. ❌ Marketing materials (np. `/uploads/marketing-materials/benefit-1759388705632-28627868.svg`) zwracają 404
5. ❌ Brak publicznego endpointu do pobrania grafik bez tokenu JWT

## ROZWIĄZANIE

### 1. Dodać publiczny endpoint do serwowania grafik
**Plik:** `ptak-expo-backend/src/routes/public.js`

Dodać endpoint:
```javascript
// GET /public/images/:type/:filename
// Serwuje obrazy bez wymagania autentykacji
router.get('/images/:type/:filename', async (req, res) => {
  // Pobiera plik z odpowiedniego katalogu uploads/
});
```

### 2. Zmienić katalog aby zwracał URL-e zamiast base64
**Plik:** `ptak-expo-backend/src/routes/public.js` (linia ~428)

Zmienić z:
```javascript
logoUrl: exhibitor.logo || null
```

Na:
```javascript
logoUrl: exhibitor.logo 
  ? (exhibitor.logo.startsWith('data:') 
      ? exhibitor.logo 
      : `${siteLink}/public/images/catalog/${exhibitor.id}/${exhibitor.logo}`)
  : null
```

### 3. Dodać obsługę plików statycznych
**Plik:** `ptak-expo-backend/src/index.js`

Dodać przed routing:
```javascript
// Serwuj pliki uploads jako statyczne (tylko odczyt)
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '1d', // Cache na 1 dzień
  setHeaders: (res, path) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
```

## TESTOWANE URL-E

### ✅ DZIAŁA:
1. https://backend-production-df8c.up.railway.app/api/v1/exhibitor-branding/serve/global/4e4b468e-125a-486c-bc80-b2194db0841a_1759478288613.webp
   - Status: 200 OK
   - Content-Type: image/webp

2. https://backend-production-df8c.up.railway.app/public/exhibitions/2/exhibitors/1108.json
   - Status: 200 OK
   - Ale logo jako base64!

### ❌ NIE DZIAŁA:
1. https://backend-production-df8c.up.railway.app/uploads/marketing-materials/benefit-1759388705632-28627868.svg
   - Status: 404
   - Przyczyna: Brak konfiguracji express.static()

## PRZYKŁADOWE LINKI DO SPRAWDZENIA (po fix-ie):

1. Logo wystawcy:
   `https://backend-production-df8c.up.railway.app/public/images/catalog/1108/logo.jpg`

2. Marketing material:
   `https://backend-production-df8c.up.railway.app/uploads/marketing-materials/benefit-1759388705632-28627868.svg`

3. Branding file (global):
   `https://backend-production-df8c.up.railway.app/api/v1/exhibitor-branding/serve/global/4e4b468e-125a-486c-bc80-b2194db0841a_1759478288613.webp`

## PRIORYTETY:

1. 🔴 **KRYTYCZNE:** Dodać serwowanie plików uploads/ jako statyczne
2. 🟠 **WAŻNE:** Zmienić JSON aby zwracał URL-e zamiast base64
3. 🟡 **ŚREDNIE:** Dodać cache headers dla performance

---

**STATUS:** Do implementacji

