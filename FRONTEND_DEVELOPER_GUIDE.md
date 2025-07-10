# 🚀 PTAK EXPO - Instrukcja dla Frontend Developer

## 📋 Przegląd Projektu

**PTAK EXPO** to aplikacja do zarządzania wystawami z systemem logowania i panelem administracyjnym. Składa się z:
- **Backend**: Node.js/Express API (port 3001)
- **Frontend**: React/TypeScript (port 3000)  
- **Baza danych**: PostgreSQL
- **Deployment**: Railway Cloud Platform

## 🔧 Setup Środowiska

### 1. Git Setup

```bash
# Sklonuj repozytorium
git clone https://github.com/MariuszPieniakKID/Ptak-expo.git
cd Ptak-expo

# Sprawdź branche
git branch -a
git checkout main
```

### 2. Instalacja Node.js i npm

Wymagane wersje:
- **Node.js**: v20.19.1 lub nowszy
- **npm**: v10 lub nowszy

```bash
# Sprawdź wersje
node --version
npm --version
```

### 3. Instalacja zależności

```bash
# Frontend
cd ptak-expo-frontend
npm install

# Backend (dla pełnego developmentu)
cd ../ptak-expo-backend
npm install
```

### 4. Zmienne środowiskowe

Utwórz plik `.env` w `ptak-expo-frontend/`:

```env
REACT_APP_API_URL=http://localhost:3001
```

Utwórz plik `.env` w `ptak-expo-backend/`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ptak_expo
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

## 🏃‍♂️ Uruchomienie Aplikacji

### Opcja 1: Tylko Frontend (zalecane dla frontend developera)

```bash
# Terminal 1 - Frontend
cd ptak-expo-frontend
npm start
# Aplikacja: http://localhost:3000
```

**Backend z production:** Aplikacja automatycznie połączy się z backend na Railway:
- API URL: `https://backend-production-097b.up.railway.app`

### Opcja 2: Pełny stack lokalnie

```bash
# Terminal 1 - Backend
cd ptak-expo-backend
npm start
# API: http://localhost:3001

# Terminal 2 - Frontend  
cd ptak-expo-frontend
npm start
# Aplikacja: http://localhost:3000
```

## 🔐 Dane Testowe

### Konta do logowania:

1. **Admin główny:**
   - Email: `admin@ptak-expo.com`
   - Hasło: `admin123`

2. **Admin testowy:**
   - Email: `test.admin@ptak-expo.com`
   - Hasło: `test123`

3. **Użytkownik testowy:**
   - Email: `test@test.com`
   - Hasło: `test123`

## 🌐 Linki Production

- **Frontend**: https://frontend-production-fb96.up.railway.app
- **Backend**: https://backend-production-097b.up.railway.app
- **Health Check**: https://backend-production-097b.up.railway.app/api/v1/health

## 📁 Struktura Projektu

```
ptak-expo-frontend/
├── src/
│   ├── components/          # Komponenty wielokrotnego użytku
│   │   ├── Menu.tsx        # Globalne menu nawigacyjne
│   │   └── Menu.module.css
│   ├── contexts/           # Context API
│   │   └── AuthContext.tsx # Zarządzanie stanem logowania
│   ├── pages/              # Strony aplikacji
│   │   ├── LoginPage.tsx   # 🎯 DO POPRAWY
│   │   ├── DashboardPage.tsx # 🎯 DO POPRAWY
│   │   └── UsersPage.tsx   # 🎯 DO POPRAWY
│   ├── services/           # API calls
│   │   └── api.ts          # Konfiguracja API
│   └── types/              # TypeScript definitions
│       └── index.ts        # Typy User, AuthContext
├── public/                 # Statyczne pliki
└── package.json
```

## 🎯 Zadania do Wykonania

### 1. 🔐 Strona Logowania (`LoginPage.tsx`)

#### Problemy do naprawienia:
- [ ] **Responsywność**: Strona nie jest responsywna na urządzeniach mobilnych
- [ ] **Styling**: Poprawić wygląd zgodnie z brandingiem PTAK EXPO
- [ ] **UX**: Dodać lepsze komunikaty błędów
- [ ] **Walidacja**: Dodać walidację formularza po stronie frontendu
- [ ] **Loading state**: Dodać spinner podczas logowania

#### Pliki do edycji:
- `src/pages/LoginPage.tsx`
- `src/pages/LoginPage.module.css`

#### Funkcjonalności:
- Formularz logowania (email + hasło)
- Komunikaty błędów z API
- Przekierowanie po udanym logowaniu
- Integracja z `AuthContext`

### 2. 🏠 Dashboard (`DashboardPage.tsx`)

#### Problemy do naprawienia:
- [ ] **Layout kafelków**: Obecnie poprawione, ale może wymagać dalszego dopracowania
- [ ] **Responsywność**: Dostosować do różnych rozdzielczości
- [ ] **Interaktywność**: Dodać hover effects na kafelkach
- [ ] **Funkcjonalność**: Zaimplementować brakujące akcje kafelków:
  - Wystawcy (obecnie tylko console.log)
  - Wydarzenia (obecnie tylko console.log)  
  - Baza Danych (obecnie tylko console.log)
- [ ] **Przycisk wyloguj**: Poprawić pozycjonowanie i widoczność

#### Pliki do edycji:
- `src/pages/DashboardPage.tsx`
- `src/pages/DashboardPage.module.css`

#### Funkcjonalności:
- 4 kafelki: Wystawcy, Wydarzenia, Użytkownicy, Baza Danych
- Nawigacja do podstron
- Wylogowanie użytkownika
- Wyświetlanie informacji o zalogowanym użytkowniku

### 3. 👥 Strona Użytkowników (`UsersPage.tsx`)

#### Problemy do naprawienia:
- [ ] **ESLint Warning**: Naprawić warning o useEffect dependency
- [ ] **Tabela użytkowników**: Poprawić styling i responsywność
- [ ] **Akcje**: Dodać akcje dla użytkowników (edycja, usuwanie)
- [ ] **Filtrowanie**: Dodać możliwość filtrowania/wyszukiwania
- [ ] **Paginacja**: Dodać paginację dla dużej ilości użytkowników
- [ ] **Sortowanie**: Dodać sortowanie po kolumnach

#### Pliki do edycji:
- `src/pages/UsersPage.tsx`
- `src/pages/UsersPage.module.css`

#### Funkcjonalności:
- Lista wszystkich użytkowników
- Wyświetlanie: ID, Imię, Nazwisko, Email, Rola
- Tylko dla adminów (sprawdzana rola)

## 🔌 API Endpoints

### Autoryzacja:
```typescript
POST /api/v1/auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }

POST /api/v1/auth/logout
Header: Authorization: Bearer {token}
```

### Użytkownicy:
```typescript
GET /api/v1/users
Header: Authorization: Bearer {token}
Response: User[]

POST /api/v1/users/create-admin
Header: Authorization: Bearer {token}
Body: { email: string, password: string, firstName: string, lastName: string }
```

### Typy TypeScript:
```typescript
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'exhibitor' | 'guest';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
```

## 🎨 Design Guidelines

### Kolory:
- **Główny**: #c7353c (czerwony PTAK EXPO)
- **Tło**: #f5f5f5
- **Tekst**: #2e2e38
- **Akcenty**: #fff (biały)

### Czcionki:
- **Główna**: "Roc Grotesk", sans-serif
- **Pomocnicza**: "Open Sans", sans-serif

### Referencje designu:
Sprawdź folder `web1366-extracted/` dla oryginalnych projektów stron.

## 🚦 Workflow

### 1. Praca z Git:
```bash
# Utwórz nowy branch dla swojej pracy
git checkout -b feature/frontend-improvements

# Pracuj na zmianach
git add .
git commit -m "Frontend: Opis zmian"

# Wypchaj zmiany
git push origin feature/frontend-improvements
```

### 2. Testowanie:
```bash
# Uruchom aplikację lokalnie
npm start

# Testuj na różnych rozdzielczościach
# Sprawdź responsywność
# Przetestuj wszystkie funkcjonalności
```

### 3. Deployment:
- **Automatyczny**: Po merge do `main` Railway automatycznie deployuje
- **Manual**: Można deployować przez Railway CLI

## 🐛 Częste Problemy

### 1. Port zajęty:
```bash
# Zabij proces na porcie
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### 2. ESLint Warnings:
```bash
# Napraw automatycznie
npm run lint --fix
```

### 3. TypeScript Errors:
```bash
# Sprawdź typy
npx tsc --noEmit
```

## 📞 Pomoc

### Kontakt:
- **Główny Developer**: [Twój kontakt]
- **Repository**: https://github.com/MariuszPieniakKID/Ptak-expo
- **Issues**: Zgłaszaj problemy przez GitHub Issues

### Przydatne komendy:
```bash
# Sprawdź status git
git status

# Zobacz logi
git log --oneline -10

# Przywróć zmiany
git restore [file]

# Sprawdź zmiany
git diff
```

## 🎯 Priorytety

1. **Wysokie**: Naprawienie ESLint warning w UsersPage.tsx
2. **Wysokie**: Responsywność LoginPage
3. **Średnie**: Implementacja brakujących funkcjonalności Dashboard
4. **Średnie**: Poprawa UI/UX wszystkich stron
5. **Niskie**: Dodanie nowych funkcjonalności

---

**Powodzenia w developmencie! 🚀** 