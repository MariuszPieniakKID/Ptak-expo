# Swagger API Documentation - PTAK EXPO Backend

**Ostatnia aktualizacja:** 25 listopada 2024  
**Wersja API:** 2.0.0

---

## 🔗 Linki do dokumentacji

### Swagger UI (Interaktywna dokumentacja)
```
Produkcja:  https://backend-production-df8c.up.railway.app/api-docs
Lokalnie:   http://localhost:3001/api-docs
```

### Surowe pliki
```
YAML:  https://backend-production-df8c.up.railway.app/swagger.yaml
JSON:  https://backend-production-df8c.up.railway.app/api-docs.json
```

### Plik w repozytorium
```
Path: ptak-expo-backend/swagger.yaml
```

---

## 📚 Co zawiera Swagger?

### ✅ Wszystkie główne endpointy (2024-11-25)

| Kategoria | Endpointy | Opis |
|-----------|-----------|------|
| **Auth** | `/api/v1/auth/*` | Logowanie, weryfikacja tokenów |
| **Exhibitors** | `/api/v1/exhibitors/*` | Zarządzanie wystawcami |
| **Exhibitions** | `/api/v1/exhibitions/*` | Zarządzanie wystawami |
| **Users** | `/api/v1/users/*` | Zarządzanie użytkownikami (admin) |
| **Documents** | `/api/v1/exhibitor-documents/*` | Dokumenty wystawców |
| **Branding** | `/api/v1/exhibitor-branding/*` | Pliki brandingowe |
| **Trade Info** | `/api/v1/trade-info/*` | Informacje targowe |
| **Trade Events** | `/api/v1/trade-events/*` | Wydarzenia targowe |
| **Invitations** | `/api/v1/invitations/*` | Zaproszenia |
| **QR Verify** | `/api/v1/qr-verify/:code` | Weryfikacja kodów QR |
| **QR Codes** | `/api/v1/qr-codes/*` | Pobieranie kodów QR (JSON/PNG/ZIP) |
| **Identifiers** | `/api/v1/identifiers/*` | Generowanie PDF identyfikatorów |
| **Bulk Emails** | `/api/v1/bulk-emails/*` | Masowa wysyłka emaili |
| **Password Reset** | `/api/v1/password-reset/*` | Resetowanie haseł |
| **News** | `/api/v1/news/*` | Aktualności |
| **Admin** | `/api/v1/admin/*` | Panel admina, statystyki |
| **Activity Logs** | `/api/v1/activity-logs` | Logi aktywności |
| **Diagnostics** | `/api/v1/diagnostics/*` | Diagnostyka systemu |
| **Migrations** | `/api/v1/migrations/*` | Migracje bazy danych |
| **Public** | `/public/*` | Publiczne API (katalog, RSS) |

---

## 🔐 Autoryzacja

### Bearer Token (JWT)
Większość endpointów wymaga autoryzacji przez JWT token:

```http
Authorization: Bearer <your_jwt_token>
```

### Jak uzyskać token?

#### 1. Logowanie jako wystawca (Panel Wystawcy)
```bash
curl -X POST https://backend-production-df8c.up.railway.app/api/v1/auth/exhibitor-login \
  -H "Content-Type: application/json" \
  -d '{"email": "wystawca@example.com", "password": "password123"}'
```

#### 2. Logowanie jako admin
```bash
curl -X POST https://backend-production-df8c.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ptak-expo.com", "password": "admin_password"}'
```

**Odpowiedź:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@ptak-expo.com",
    "role": "admin"
  }
}
```

### Przykład użycia tokena
```bash
curl -X GET https://backend-production-df8c.up.railway.app/api/v1/exhibitors/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📖 Przykłady użycia

### 1. Weryfikacja kodu QR (publiczne API)
```bash
curl -X GET "https://backend-production-df8c.up.railway.app/api/v1/qr-verify/WARIW0017w1606650512109rnd795935650512109"
```

### 2. Pobranie kodu QR jako PNG
```bash
curl -X GET "https://backend-production-df8c.up.railway.app/api/v1/qr-codes/person/123?format=image" \
  -o qr-code.png
```

### 3. Pobranie wszystkich kodów QR z wystawy jako ZIP
```bash
curl -X GET "https://backend-production-df8c.up.railway.app/api/v1/qr-codes/exhibition/17?format=zip" \
  -o qr-codes.zip
```

### 4. Pobranie identyfikatora PDF
```bash
curl -X GET "https://backend-production-df8c.up.railway.app/api/v1/identifiers/person/123" \
  -o identyfikator.pdf
```

### 5. Lista wystawców dla wystawy (publiczne API)
```bash
curl -X GET "https://backend-production-df8c.up.railway.app/public/exhibitions/17/exhibitors"
```

### 6. Wysłanie emaili powitalnych (admin)
```bash
curl -X POST "https://backend-production-df8c.up.railway.app/api/v1/bulk-emails/send-welcome-by-exhibition" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exhibitionId": 17}'
```

---

## 🌐 Publiczne endpointy (bez autoryzacji)

Te endpointy nie wymagają tokena JWT:

| Endpoint | Opis |
|----------|------|
| `GET /public/exhibitions` | Lista wszystkich wystaw |
| `GET /public/exhibitions/:id/exhibitors` | Wystawcy dla wystawy |
| `GET /public/exhibitions/:id/exhibitors.json` | Feed JSON z wystawcami |
| `GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.json` | Pojedynczy wystawca (JSON) |
| `GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.rss` | Pojedynczy wystawca (RSS) |
| `GET /public/rss` | Globalny feed RSS |
| `GET /api/v1/qr-verify/:code` | Weryfikacja kodu QR |
| `GET /api/v1/qr-codes/person/:id` | Kod QR osoby |
| `GET /api/v1/identifiers/person/:id` | Identyfikator PDF |

---

## 🛠️ Jak korzystać ze Swagger UI?

### 1. Otwórz Swagger UI
```
https://backend-production-df8c.up.railway.app/api-docs
```

### 2. Autoryzacja w Swagger UI
1. Kliknij przycisk **"Authorize"** (górny prawy róg lub ikona kłódki)
2. W polu **"bearerAuth (http, Bearer)"** wpisz tylko TOKEN (bez słowa "Bearer")
3. Kliknij **"Authorize"**
4. Kliknij **"Close"**

### 3. Testowanie endpointów
1. Wybierz endpoint z listy (np. `GET /api/v1/exhibitors/me`)
2. Kliknij **"Try it out"**
3. Wypełnij parametry (jeśli są wymagane)
4. Kliknij **"Execute"**
5. Zobacz odpowiedź w sekcji **"Responses"**

---

## 📦 Export do Postman / Insomnia

### Import z URL
```
https://backend-production-df8c.up.railway.app/api-docs.json
```

### Import z pliku
1. Pobierz `swagger.yaml` z repozytorium
2. W Postman: `Import → File → Upload Files → swagger.yaml`
3. W Insomnia: `Import/Export → Import Data → From File → swagger.yaml`

---

## 📄 Dodatkowa dokumentacja

Dla szczegółowej dokumentacji specyficznych funkcji, zobacz:

### **API_QR_VERIFICATION.md** ✅ 
Pełna dokumentacja QR:
- Weryfikacja kodów
- Pobieranie jako JSON/PNG/ZIP
- Identyfikatory PDF
- Przykłady w cURL, JavaScript, Python, C#, Java

**Path:** `/API_QR_VERIFICATION.md`

### **QR_CODE_FORMAT.md** ✅
Szczegółowy opis formatu kodów QR:
- Struktura kodu (wersja 2.0)
- Algorytm generowania
- Przykłady implementacji
- Kompatybilność wsteczna

**Path:** `/QR_CODE_FORMAT.md`

---

## ⚙️ Deployment & Środowiska

### Produkcja (Railway)
```
Base URL:     https://backend-production-df8c.up.railway.app
Swagger UI:   https://backend-production-df8c.up.railway.app/api-docs
Health:       https://backend-production-df8c.up.railway.app/api/v1/health
```

### Lokalne (Development)
```
Base URL:     http://localhost:3001
Swagger UI:   http://localhost:3001/api-docs
Health:       http://localhost:3001/api/v1/health
```

### Uruchomienie lokalnie
```bash
cd ptak-expo-backend
npm install
npm start
```

Swagger UI będzie dostępny automatycznie na `http://localhost:3001/api-docs`

---

## 🔍 Wyszukiwanie w Swagger UI

Swagger UI ma wbudowane wyszukiwanie:
1. Kliknij na dowolny tag (np. "QR", "Exhibitors")
2. Użyj **Ctrl+F** (Windows) lub **Cmd+F** (Mac) aby szukać w treści
3. Filtry według tagów są po lewej stronie

---

## 📊 Statystyki

| Metryka | Wartość |
|---------|---------|
| **Wersja API** | 2.0.0 |
| **Liczba endpointów** | ~100+ |
| **Liczba tagów** | 21 |
| **Rozmiar pliku** | 1065 linii |
| **Ostatnia aktualizacja** | 25.11.2024 |

---

## ❓ FAQ

### Q: Czy Swagger jest zawsze aktualny?
**A:** Tak, od 25.11.2024 Swagger zawiera wszystkie endpointy. Jest synchronizowany z kodem.

### Q: Jak zgłosić brakujący endpoint?
**A:** Otwórz issue w repozytorium lub skontaktuj się z zespołem deweloperskim.

### Q: Czy mogę używać Swagger w narzędziach?
**A:** Tak! Export do Postman, Insomnia, curl, czy innych narzędzi jest w pełni wspierany.

### Q: Co jeśli endpoint zwraca 401 Unauthorized?
**A:** Sprawdź czy:
1. Token jest poprawny i nie wygasł
2. Użyłeś autoryzacji w Swagger UI (przycisk "Authorize")
3. Twój token ma odpowiednie uprawnienia (admin vs exhibitor)

### Q: Gdzie znajdę przykłady w innych językach?
**A:** Zobacz `API_QR_VERIFICATION.md` - zawiera przykłady w JavaScript, Python, C#, Java, cURL.

---

## 📞 Kontakt

Jeśli masz pytania dotyczące API lub potrzebujesz pomocy:
- Sprawdź dokumentację w `API_QR_VERIFICATION.md`
- Sprawdź format kodów QR w `QR_CODE_FORMAT.md`
- Skontaktuj się z zespołem deweloperskim

---

**Powodzenia w pracy z API!** 🚀

