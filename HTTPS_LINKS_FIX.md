# Poprawki HTTPS dla linków w API i dodanie podglądu dokumentów

## Data: 2025-10-17

## Wprowadzone zmiany

### 1. Wymuszenie HTTPS dla wszystkich publicznych URLi

**Problem:** 
Linki w JSON API (do logo, produktów, dokumentów) były generowane z `req.protocol` który mógł zwracać `http://` zamiast `https://`, nawet na produkcji gdzie ruch przechodzi przez HTTPS proxy.

**Rozwiązanie:**
Zmieniono wszystkie wystąpienia:
```javascript
const siteLink = req.protocol + '://' + req.get('host');
```

Na:
```javascript
// Force HTTPS for all public URLs (even if request came via HTTP proxy)
const siteLink = 'https://' + req.get('host');
```

**Pliki zmodyfikowane:**
- `/ptak-expo-backend/src/routes/public.js` - 8 wystąpień w różnych endpointach

**Dotknięte endpointy:**
1. `GET /public/exhibitions/:exhibitionId/feed.json` - feed wystawy (logo i produkty)
2. `GET /public/exhibitions/:exhibitionId/exhibitors` - lista wystawców z katalogiem
3. `GET /public/exhibitions/:exhibitionId/exhibitors.json` - JSON feed wszystkich wystawców
4. `GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId` - szczegóły wystawcy
5. `GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.json` - JSON pojedynczego wystawcy
6. `GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.rss` - RSS feed wystawcy
7. Endpointy dokumentów (download, view)

**Efekt:**
Wszystkie linki w odpowiedziach API teraz zawierają `https://` zamiast `http://`:
- Logo wystawców: `https://exhibitorlist.eu/uploads/...` lub `https://exhibitorlist.eu/api/v1/exhibitor-branding/...`
- Obrazy produktów: `https://exhibitorlist.eu/uploads/...`
- Dokumenty: `https://exhibitorlist.eu/public/exhibitions/.../documents/.../download`

### 2. Dodanie endpointu do podglądu dokumentów

**Problem:**
Dokumenty były dostępne tylko do pobrania (download), nie było możliwości ich podglądu w przeglądarce.

**Rozwiązanie:**
Dodano nowy endpoint równoległy do istniejącego `/download`:

```
GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId/documents/:documentId/view
```

**Różnice między `/download` a `/view`:**
- `/download` - wymusza pobranie pliku (`Content-Disposition: attachment`)
- `/view` - wyświetla plik w przeglądarce (`Content-Disposition: inline`)

**Przykład:**
```
Download: https://exhibitorlist.eu/public/exhibitions/1/exhibitors/42/documents/123/download
View: https://exhibitorlist.eu/public/exhibitions/1/exhibitors/42/documents/123/view
```

### 3. Aktualizacja JSON odpowiedzi z dokumentami

Wszystkie endpointy zwracające dokumenty teraz zawierają dwa URLe:

```json
{
  "id": "123",
  "title": "Cennik 2025",
  "description": "...",
  "category": "marketing",
  "fileName": "cennik_2025.pdf",
  "originalName": "Cennik 2025.pdf",
  "fileSize": "1234567",
  "mimeType": "application/pdf",
  "createdAt": "2025-10-17T12:00:00.000Z",
  "downloadUrl": "https://exhibitorlist.eu/public/exhibitions/1/exhibitors/42/documents/123/download",
  "viewUrl": "https://exhibitorlist.eu/public/exhibitions/1/exhibitors/42/documents/123/view",
  "fileUrl": "https://exhibitorlist.eu/public/exhibitions/1/exhibitors/42/documents/123/download"
}
```

**Uwaga:** Pole `fileUrl` zachowane dla backward compatibility (wskazuje na `downloadUrl`).

### 4. Aktualizacja RSS feedu

RSS feed wystawcy również zawiera teraz link do podglądu w opisie dokumentu:

```xml
<item>
  <title>Cennik 2025</title>
  <link>https://.../download</link>
  <description>Opis | Kategoria: marketing | Podgląd: https://.../view</description>
  <enclosure url="https://.../download" length="1234567" type="application/pdf" />
</item>
```

## Testy

### Test HTTPS w logo i produktach:
```bash
curl https://exhibitorlist.eu/public/exhibitions/1/exhibitors.json | jq '.exhibitors[0] | {logoUrl, products: .products[0].img}'
```

Oczekiwany wynik: wszystkie URLe zaczynają się od `https://`

### Test podglądu dokumentu:
```bash
# Pobierz listę dokumentów
curl https://exhibitorlist.eu/public/exhibitions/1/exhibitors/42.json | jq '.documents[0] | {downloadUrl, viewUrl}'

# Test podglądu (powinien wyświetlić PDF w przeglądarce)
curl -I https://exhibitorlist.eu/public/exhibitions/1/exhibitors/42/documents/123/view
# Sprawdź: Content-Disposition: inline

# Test pobierania (powinien wymusić download)
curl -I https://exhibitorlist.eu/public/exhibitions/1/exhibitors/42/documents/123/download
# Sprawdź: Content-Disposition: attachment
```

## Backward Compatibility

✅ **Zachowana pełna kompatybilność wsteczna:**
- Pole `fileUrl` w dokumentach nadal istnieje (wskazuje na `downloadUrl`)
- Istniejący endpoint `/download` działa bez zmian
- Stare linki HTTP będą przekierowane na HTTPS przez serwer (jeśli jest skonfigurowany)

## Wpływ na aplikacje

### ptak-expo-web (panel wystawcy)
Może zacząć używać `viewUrl` do podglądu dokumentów zamiast tylko pobierania.

### ptak-expo-frontend (panel admina)
Może dodać przycisk "Podgląd" obok "Pobierz" dla dokumentów.

### Aplikacje mobilne / zewnętrzne
Wszystkie linki teraz używają HTTPS, co zwiększa bezpieczeństwo i unika ostrzeżeń o mixed content.

## Deployment

Zmiany wymagają tylko redeployu backendu (`ptak-expo-backend`).
Nie są wymagane migracje bazy danych ani zmiany w konfiguracji.

---

**Status:** ✅ Zakończone i wypchniete na `main`
**Tester:** Należy przetestować na staging/produkcji czy wszystkie linki używają HTTPS

