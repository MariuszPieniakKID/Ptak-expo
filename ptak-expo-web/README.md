# PTAK EXPO - Aplikacja WWW

Portal webowy dla wystawców systemu PTAK EXPO.

## 🚀 Szybki start

### Wymagania
- Node.js 16+
- npm lub yarn
- Backend API działający na porcie 3001

### Instalacja

```bash
# Instalacja zależności
npm install

# Uruchomienie w trybie deweloperskim
npm start

# Budowanie wersji produkcyjnej
npm run build
```

## 🔧 Konfiguracja

Utwórz plik `.env` w głównym katalogu:

```env
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_APP_NAME=PTAK EXPO
```

## 🔐 Logowanie

Aplikacja używa danych testowych:
- **Email:** `test@test.com`
- **Hasło:** `test123`

## 📱 Funkcjonalności

### ✅ Zaimplementowane:
- Logowanie użytkowników
- Dashboard główny z komunikatem powitalnym
- Wylogowanie
- Responsywny design
- Walidacja formularzy

### 🔄 W planach:
- Zarządzanie dokumentami
- Materiały marketingowe
- System komunikatów
- Generator zaproszeń
- Panel administracyjny

## 🗂️ Struktura projektu

```
src/
├── components/         # Komponenty UI
│   ├── LoginForm.js   # Formularz logowania
│   └── Dashboard.js   # Dashboard główny
├── contexts/          # React Contexts
│   └── AuthContext.js # Zarządzanie stanem autoryzacji
├── services/          # Komunikacja z API
│   └── api.js        # Konfiguracja axios
├── pages/             # Strony aplikacji
├── hooks/             # Custom hooks
└── utils/             # Funkcje pomocnicze
```

## 🎨 Technologie

- **React 18** - Framework frontendowy
- **Material-UI** - Komponenty UI
- **React Router** - Routing
- **Axios** - HTTP client
- **Context API** - Zarządzanie stanem

## 🧪 Testowanie

```bash
# Uruchomienie testów
npm test

# Testowanie logowania
1. Uruchom backend na porcie 3001
2. Uruchom frontend: npm start
3. Przejdź do http://localhost:3000
4. Użyj danych testowych: test@test.com / test123
```

## 🚀 Deployment

### Vercel (Zalecane)

```bash
# Instalacja Vercel CLI
npm install -g vercel

# Deploy
vercel

# Konfiguracja zmiennych środowiskowych w Vercel:
# REACT_APP_API_URL - URL do backend API
```

### Inne platformy

```bash
# Budowanie aplikacji
npm run build

# Pliki gotowe do deployment w folderze build/
```

## 🔄 API Integration

Aplikacja komunikuje się z backend API poprzez:
- `POST /api/v1/auth/login` - Logowanie
- `GET /api/v1/auth/verify` - Weryfikacja tokenu
- `POST /api/v1/auth/logout` - Wylogowanie

## 📋 TODO

- [ ] Implementacja reset hasła
- [ ] Moduł dokumentów
- [ ] Moduł materiałów marketingowych
- [ ] System powiadomień
- [ ] Generator zaproszeń
- [ ] Panel administracyjny
- [ ] Testy jednostkowe
- [ ] PWA features
- [ ] Internationalization (i18n)
