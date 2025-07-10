# PTAK EXPO Frontend

Frontend aplikacji do zarządzania targami PTAK EXPO zbudowany w React + TypeScript.

## 🚀 Szybki start

### Wymagania
- Node.js 16+ 
- npm lub yarn
- Backend API (ptak-expo-backend)

### Instalacja

1. **Zainstaluj zależności:**
```bash
npm install
```

2. **Skonfiguruj zmienne środowiskowe:**
```bash
# Skopiuj przykładowy plik środowiskowy
cp env.example .env.local

# Edytuj .env.local i ustaw:
REACT_APP_API_URL=http://localhost:3001
```

3. **Uruchom aplikację:**
```bash
# Tryb deweloperski
npm start

# Aplikacja będzie dostępna na http://localhost:3000
```

### Budowanie

```bash
# Budowa dla produkcji
npm run build

# Serwowanie zbudowanej aplikacji
npx serve -s build
```

## 🔧 Konfiguracja

### Zmienne środowiskowe

Utwórz plik `.env.local` z następującymi zmiennymi:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001

# Environment
REACT_APP_ENV=development

# Feature flags
REACT_APP_DEBUG=true
REACT_APP_ENABLE_LOGGING=true
```

### Dla Railway deployment

Railway automatycznie ustawi `REACT_APP_API_URL` na URL backendu.

## 🏗️ Architektura

### Struktura folderów

```
src/
├── components/         # Komponenty wielokrotnego użytku
│   ├── Menu.tsx       # Globalne menu nawigacyjne
│   ├── AddUserModal.tsx # Modal dodawania użytkowników
│   └── ProtectedRoute.tsx # Komponent zabezpieczający trasy
├── contexts/          # React Context providers
│   └── AuthContext.tsx # Kontekst autentykacji
├── pages/             # Komponenty stron
│   ├── LoginPage.tsx  # Strona logowania
│   ├── DashboardPage.tsx # Panel główny
│   └── UsersPage.tsx  # Zarządzanie użytkownikami
├── config/            # Konfiguracja aplikacji
│   └── config.ts      # Centralna konfiguracja
└── assets/            # Statyczne zasoby
```

### Funkcjonalności

- **Autentykacja** - JWT z automatycznym odświeżaniem
- **Zarządzanie użytkownikami** - CRUD operacje dla administratorów
- **Responsywny design** - Dostosowany do różnych rozmiarów ekranów
- **Optymalizacja wydajności** - Lazy loading, memoization, retry logic

## 🔐 Autentykacja

### Dane testowe

- **Admin:** `admin@ptak-expo.com` / `admin123`
- **Testowy użytkownik:** `test@test.com` / `test123`

### Funkcje zabezpieczeń

- JWT token z automatycznym odświeżaniem
- Automatyczne wylogowanie przy wygaśnięciu tokenu  
- Zabezpieczenie tras wymagających uprawnień administratora
- Retry logic dla zapytań API

## 🎨 Optymalizacje

### Wydajność

- **Lazy Loading** - Komponenty ładowane na żądanie
- **React.memo** - Optymalizacja re-renderów
- **useCallback** - Memoizacja funkcji
- **Code splitting** - Automatyczne dzielenie kodu

### TypeScript

- **Strict mode** - Włączony dla lepszej kontroli typów
- **Dokładne typy** - Precyzyjne definicje interfejsów
- **Automatyczne wykrywanie błędów** - Wczesne wykrywanie problemów

## 🔧 Troubleshooting

### Częste problemy

1. **Błąd JWT "invalid signature"**
   - Sprawdź czy backend ma ustawiony stały `JWT_SECRET`
   - Wyczyść localStorage i zaloguj się ponownie

2. **Problemy z połączeniem API**
   - Sprawdź czy backend działa na porcie 3001
   - Zweryfikuj `REACT_APP_API_URL` w `.env.local`

3. **Błędy TypeScript**
   - Sprawdź czy wszystkie typy są prawidłowo zdefiniowane
   - Użyj `npm run build` aby wykryć błędy

### Logi debugowania

Aplikacja automatycznie loguje informacje w trybie deweloperskim:
- Konfiguracja środowiskowa
- Zapytania API z retry logic
- Błędy autentykacji

## 📝 Dostępne komendy

```bash
# Instalacja
npm install

# Uruchomienie w trybie deweloperskim
npm start

# Budowanie
npm run build

# Testy
npm test

# Analiza bundle'a
npm run build && npx serve -s build
```

## 🚀 Deployment

### Railway
1. Połącz repozytorium z Railway
2. Ustaw zmienne środowiskowe w Railway dashboard
3. Railway automatycznie zbuduje i wdroży aplikację

### Inne platformy
1. Zbuduj aplikację: `npm run build`
2. Wdróż folder `build/` na serwer statyczny
3. Ustaw prawidłowe zmienne środowiskowe

## 🔄 Wersjonowanie

Projekt używa semantic versioning. Aktualna wersja jest dostępna w `package.json`.

## 🤝 Wsparcie

W przypadku problemów sprawdź:
1. Logi w konsoli przeglądarki
2. Network tab w Developer Tools
3. Konfigurację zmiennych środowiskowych
