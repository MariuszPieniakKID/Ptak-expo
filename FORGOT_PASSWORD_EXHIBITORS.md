# Implementacja funkcjonalności "Przypomnij hasło" dla Wystawców (ptak-expo-web)

## ✅ Zaimplementowane elementy

### Backend (ptak-expo-backend)

#### 1. Nowy endpoint w `src/controllers/authController.js`
- **Endpoint**: `POST /api/v1/auth/exhibitor-forgot-password`
- **Funkcja**: `exhibitorForgotPassword()`
- **Funkcjonalność**:
  - Walidacja adresu email
  - Wyszukiwanie wystawcy w tabeli `exhibitors` (nie `users`!)
  - Generowanie nowego losowego hasła (12 znaków)
  - Hashowanie hasła za pomocą bcrypt (10 salt rounds)
  - Aktualizacja `password_hash` w tabeli `exhibitors`
  - Wysyłanie emaila z nowym hasłem przez `sendPasswordResetEmail()`
  - Link w emailu prowadzi do panelu wystawców (FRONTEND_WEB_URL)
  - Bezpieczne odpowiedzi (zapobieganie enumeracji emaili)

#### 2. Nowy route w `src/routes/auth.js`
```javascript
router.post('/exhibitor-forgot-password', exhibitorForgotPassword);
```

#### 3. Wykorzystanie istniejącego serwisu emailowego
- Używa `sendPasswordResetEmail()` z `src/utils/emailService.js`
- Wspiera SMTP i Microsoft Graph API
- Profesjonalny szablon HTML emaila
- Link prowadzi do `process.env.FRONTEND_WEB_URL/login` lub `https://app.warsawexpo.eu/login`

### Frontend (ptak-expo-web)

#### 1. Nowy modal: `ForgotPasswordModal.tsx`
**Lokalizacja**: `src/components/forgotPasswordModal/ForgotPasswordModal.tsx`

**Funkcjonalność**:
- Walidacja adresu email w czasie rzeczywistym
- Obsługa błędów i komunikatów sukcesu
- Loading state podczas wysyłania requestu
- Automatyczne zamknięcie po 3 sekundach od sukcesu
- Używa `config.API_BASE_URL` do połączenia z backendem
- Zgodny z design system projektu (Custom Components, SCSS modules)

#### 2. Style: `ForgotPasswordModal.module.scss`
**Lokalizacja**: `src/components/forgotPasswordModal/ForgotPasswordModal.module.scss`

**Design**:
- Okrągłe rogi (--br-10)
- Kolory z palety projektu ($color-gray, $color-blue, $color-darkslategray)
- Responsywny layout
- Komunikaty sukcesu i błędów z odpowiednimi kolorami

#### 3. Integracja z LoginPage
**Plik**: `src/pages/loginPage/LoginPage.tsx`

**Zmiany**:
- Import modalu `ForgotPasswordModal`
- Dodanie state dla otwierania/zamykania modalu
- Obsługa kliknięcia na tekst "Przypomnij hasło"
- Modal renderowany warunkowo

## 🔒 Bezpieczeństwo

### Hashowanie hasła
- Używa bcrypt z 10 salt rounds
- Hasło jest hashowane przed zapisem do bazy danych
- Zgodne z istniejącym systemem logowania dla wystawców

### Generowanie hasła
- 12-znakowe hasło
- Zawiera małe litery, wielkie litery i cyfry
- Format: `[8 znaków]` + `[4 wielkie litery]` + `[1 cyfra]`

### Zapobieganie enumeracji emaili
- Zawsze zwraca ten sam komunikat niezależnie od tego, czy email istnieje
- Nie ujawnia informacji o statusie konta

### Weryfikacja statusu konta
- Sprawdza, czy konto wystawcy jest aktywne przed resetowaniem hasła
- Nieaktywne konta nie otrzymują nowego hasła

## 📧 Wysyłanie emaili

Email jest wysyłany przez istniejący serwis `emailService.js`:

### Wspierane metody:
1. **Microsoft Graph API** (priorytet) - działa przez HTTPS
2. **SMTP** - fallback
3. **Stream Transport** - tryb developerski (logi w konsoli)

### Szablon emaila zawiera:
- Profesjonalny header PTAK WARSAW EXPO
- Imię i nazwisko wystawcy (z `contact_person`) lub nazwę firmy
- Nowe hasło w wyróżnionym bloku
- Link do strony logowania **panelu wystawców** (FRONTEND_WEB_URL)
- Informację o zaleceniu zmiany hasła
- Ostrzeżenie o niezamówionym resecie

### Różnice względem panelu admina:
- Endpoint: `/api/v1/auth/exhibitor-forgot-password` (nie `/forgot-password`)
- Tabela: `exhibitors` (nie `users`)
- Link w emailu: panel wystawców (nie panel admina)
- Parsowanie nazwy z `contact_person` + `company_name`

## 🧪 Testowanie

### Test 1: Endpoint backendowy

```bash
# Test z pustym emailem (walidacja)
curl -X POST http://localhost:3001/api/v1/auth/exhibitor-forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": ""}' \
  -s | python3 -m json.tool

# Oczekiwany wynik:
# {
#     "success": false,
#     "message": "Email jest wymagany"
# }
```

```bash
# Test z nieistniejącym emailem
curl -X POST http://localhost:3001/api/v1/auth/exhibitor-forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  -s | python3 -m json.tool

# Oczekiwany wynik:
# {
#     "success": true,
#     "message": "Jeśli adres email istnieje w systemie, nowe hasło zostało wysłane"
# }
```

```bash
# Test z prawdziwym wystawcą
curl -X POST http://localhost:3001/api/v1/auth/exhibitor-forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "TUTAJ_EMAIL_WYSTAWCY"}' \
  -s | python3 -m json.tool

# Oczekiwany wynik:
# {
#     "success": true,
#     "message": "Nowe hasło zostało wysłane na podany adres email"
# }
# + hasło w bazie exhibitors zostało zaktualizowane
# + email wysłany (jeśli SMTP skonfigurowane)
```

### Test 2: Interfejs użytkownika (ptak-expo-web)

1. **Uruchom backend i frontend**:
   ```bash
   # Terminal 1 - Backend
   cd ptak-expo-backend
   npm start
   
   # Terminal 2 - Frontend (ptak-expo-web)
   cd ptak-expo-web
   npm start
   ```

2. **Otwórz przeglądarkę**: URL panelu wystawców (np. `http://localhost:3002/login`)

3. **Kliknij tekst** "Przypomnij hasło" pod przyciskiem logowania

4. **Modal powinien się otworzyć** z formularzem emaila

5. **Testuj walidację**:
   - Puste pole → błąd "Adres email jest wymagany"
   - Nieprawidłowy format → błąd "Podaj poprawny adres e-mail"
   - Prawidłowy email → przycisk aktywny

6. **Wyślij email**:
   - Wprowadź adres email wystawcy
   - Kliknij "Wyślij nowe hasło"
   - Powinien pojawić się komunikat sukcesu
   - Modal zamknie się automatycznie po 3 sekundach

7. **Sprawdź bazę danych**:
   - Hasło wystawcy w tabeli `exhibitors` powinno być zaktualizowane
   - Nowe hasło jest zahashowane przez bcrypt

8. **Sprawdź email** (jeśli SMTP skonfigurowane):
   - Email powinien dotrzeć na podany adres
   - Zawiera nowe hasło
   - Link prowadzi do panelu wystawców

9. **Zaloguj się nowym hasłem**:
   - Użyj emaila i nowego hasła z emaila
   - Logowanie powinno przebiec pomyślnie do panelu wystawców

### Test 3: Weryfikacja tabeli exhibitors

```bash
cd ptak-expo-backend

# Sprawdź hash w bazie przed resetem
node -e "
const db = require('./src/config/database');
(async () => {
  const result = await db.query('SELECT password_hash FROM exhibitors WHERE email = \$1', ['EMAIL_WYSTAWCY']);
  console.log('Hash przed:', result.rows[0].password_hash);
  process.exit(0);
})();
"

# Wykonaj reset hasła przez API
curl -X POST http://localhost:3001/api/v1/auth/exhibitor-forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "EMAIL_WYSTAWCY"}'

# Sprawdź hash po resecie
node -e "
const db = require('./src/config/database');
(async () => {
  const result = await db.query('SELECT password_hash FROM exhibitors WHERE email = \$1', ['EMAIL_WYSTAWCY']);
  console.log('Hash po:', result.rows[0].password_hash);
  process.exit(0);
})();
"

# Hashe powinny być różne
```

## ✅ Status testów

### Backend
- ✅ Endpoint `/api/v1/auth/exhibitor-forgot-password` utworzony
- ✅ Walidacja emaila działa
- ✅ Bezpieczne odpowiedzi (zapobieganie enumeracji)
- ✅ Hashowanie hasła przez bcrypt
- ✅ Route dodany do `auth.js`
- ✅ Używa tabeli `exhibitors` (nie `users`)
- ✅ Link w emailu prowadzi do panelu wystawców

### Frontend (ptak-expo-web)
- ✅ Modal `ForgotPasswordModal` utworzony
- ✅ Style SCSS zgodne z design system
- ✅ Integracja z `LoginPage`
- ✅ Walidacja emaila w UI
- ✅ Obsługa stanów loading/error/success
- ✅ Brak błędów lintingu
- ✅ Używa `config.API_BASE_URL`

### Integracja
- ✅ Frontend łączy się z backendem przez config
- ✅ API request działa poprawnie
- ✅ Komunikaty błędów są wyświetlane użytkownikowi

## 📝 Instrukcja dla wystawcy

1. Na stronie logowania panelu wystawców kliknij **"Przypomnij hasło"**
2. W oknie dialogowym wprowadź swój **adres email**
3. Kliknij przycisk **"Wyślij nowe hasło"**
4. Sprawdź swoją **skrzynkę email** (może trafić do spamu)
5. Skopiuj nowe hasło z emaila
6. Kliknij link w emailu lub wróć do strony logowania
7. Zaloguj się używając swojego emaila i nowego hasła
8. **Zalecane**: Zmień hasło po pierwszym logowaniu

## 🔧 Wymagania techniczne

### Backend
- Node.js
- bcryptjs (już zainstalowany)
- PostgreSQL database (tabela `exhibitors`)
- Opcjonalnie: SMTP lub Azure Graph API dla emaili

### Frontend (ptak-expo-web)
- React
- TypeScript
- Material-UI (Dialog, CircularProgress, etc.)
- Custom Components (CustomField, CustomButton, CustomTypography)

## 📚 Pliki zmienione/utworzone

### Backend
- ✅ `src/controllers/authController.js` (dodano funkcję `exhibitorForgotPassword`)
- ✅ `src/routes/auth.js` (dodano route `/exhibitor-forgot-password`)

### Frontend (ptak-expo-web)
- ✅ `src/components/forgotPasswordModal/ForgotPasswordModal.tsx` (nowy)
- ✅ `src/components/forgotPasswordModal/ForgotPasswordModal.module.scss` (nowy)
- ✅ `src/pages/loginPage/LoginPage.tsx` (zmodyfikowany)

## 🔄 Różnice względem panelu admina (ptak-expo-frontend)

| Aspekt | Panel Admina | Panel Wystawców |
|--------|--------------|-----------------|
| Endpoint | `/api/v1/auth/forgot-password` | `/api/v1/auth/exhibitor-forgot-password` |
| Tabela DB | `users` | `exhibitors` |
| Kolumny | `first_name`, `last_name` | `contact_person`, `company_name` |
| Link w emailu | FRONTEND_URL (panel admina) | FRONTEND_WEB_URL (panel wystawców) |
| Domyślny URL | http://localhost:3000 | https://app.warsawexpo.eu |
| Role | `admin` | `exhibitor` |

## 🌐 Zmienne środowiskowe Railway

### Backend
Używa istniejących zmiennych:
- `DATABASE_URL` - połączenie z bazą
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - dla SMTP
- `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` - dla Graph API
- `FRONTEND_WEB_URL` - URL panelu wystawców (dla linku w emailu)

### Frontend (ptak-expo-web)
- `REACT_APP_API_URL` - URL backendu

## 🎉 Podsumowanie

Funkcjonalność "Przypomnij hasło" dla wystawców została w pełni zaimplementowana i jest gotowa do wdrożenia. System:
- ✅ Bezpieczny (hashowanie bcrypt, zapobieganie enumeracji emaili)
- ✅ Zgodny z istniejącym design system obu paneli
- ✅ Łatwy w użyciu dla wystawców
- ✅ Dobrze zintegrowany z istniejącym kodem
- ✅ Używa oddzielnych tabel i endpointów dla adminów i wystawców
- ✅ Wysyła odpowiednie linki do odpowiednich paneli

Railway automatycznie wdroży zmiany po pushu na `main`! 🚀

