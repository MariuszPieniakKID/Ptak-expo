# 🏢 PTAK EXPO - System Zarządzania Targami

Kompletny system aplikacji targowej PTAK EXPO składający się z backendu API, aplikacji webowej i mobilnej.

## 🚀 Przegląd Systemu

System PTAK EXPO składa się z następujących komponentów:

1. **Backend API** (Node.js) - Obsługa logiki biznesowej i danych
2. **Aplikacja WWW** (React) - Portal webowy dla wystawców
3. **Aplikacja Mobilna** (React Native) - Aplikacja na iOS i Android
4. **Baza Danych** (PostgreSQL) - Przechowywanie danych systemowych

## 📁 Struktura Projektu

```
Ptak-expo/
├── ptak-expo-backend/     # Backend API (Node.js)
├── ptak-expo-web/         # Aplikacja WWW (React)
├── PtakExpoMobile/        # Aplikacja mobilna (React Native)
├── docs/                  # Dokumentacja
├── spec/                  # Specyfikacja projektowa
└── README.md             # Ten plik
```

## 🔐 Dane Testowe

Wszystkie aplikacje używają tych samych danych testowych:
- **Email:** `test@test.com`
- **Hasło:** `test123`

## ⚡ Szybki Start

### 1. Backend API

```bash
cd ptak-expo-backend
npm install
npm run dev
```

Backend uruchomi się na `http://localhost:3001`

### 2. Aplikacja WWW

```bash
cd ptak-expo-web
npm install
npm start
```

Aplikacja uruchomi się na `http://localhost:3000`

### 3. Aplikacja Mobilna

```bash
cd PtakExpoMobile
npm install

# Android
npx react-native run-android

# iOS (tylko macOS)
npx react-native run-ios
```

## 🗄️ Konfiguracja Bazy Danych

### Neon.tech PostgreSQL

1. Utwórz konto na [neon.tech](https://neon.tech)
2. Utwórz nową bazę danych
3. Skopiuj connection string
4. Zaktualizuj plik `.env` w katalogu `ptak-expo-backend`:

```env
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
```

### Automatyczna inicjalizacja tabel

Backend automatycznie utworzy potrzebne tabele przy pierwszym uruchomieniu:
- `users` - Użytkownicy systemu
- `exhibitions` - Targi/wydarzenia
- `documents` - Dokumenty
- `marketing_materials` - Materiały marketingowe
- `communications` - Komunikaty
- `invitations` - Zaproszenia

## 🚀 Deployment

### Vercel (Aplikacja WWW)

```bash
# Instalacja Vercel CLI
npm install -g vercel

# Deploy aplikacji WWW
cd ptak-expo-web
vercel

# Skonfiguruj zmienne środowiskowe w Vercel dashboard:
# REACT_APP_API_URL - URL do backend API
```

### Backend Deployment

Backend można wdrożyć na:
- **Heroku**
- **Railway**
- **DigitalOcean**
- **AWS**
- **Azure**

Przykład dla Railway:

```bash
# Instalacja Railway CLI
npm install -g @railway/cli

# Deploy
cd ptak-expo-backend
railway deploy
```

## 📱 Funkcjonalności Systemu

### ✅ Zaimplementowane:

#### Wszystkie aplikacje:
- ✅ Logowanie użytkowników z danymi testowymi
- ✅ Dashboard z komunikatem powitalnym "Witaj w aplikacji PTAK EXPO"
- ✅ Wylogowanie
- ✅ Autoryzacja JWT
- ✅ Responsywny design

#### Backend:
- ✅ RESTful API
- ✅ Struktura bazy danych PostgreSQL
- ✅ Middleware autoryzacji
- ✅ Wersjonowanie API (/api/v1/)

### 🔄 Planowane funkcjonalności:

- 📄 **Moduł Dokumentów** - Zarządzanie dokumentami targowymi
- 📢 **Materiały Marketingowe** - Biblioteka zasobów promocyjnych
- 🔔 **System Komunikatów** - Powiadomienia i wiadomości
- 👥 **Generator Zaproszeń** - Zarządzanie gośćmi
- 👑 **Panel Administracyjny** - Zarządzanie systemem
- 📊 **Raportowanie** - Analityka i eksport danych
- 🔄 **Integracje** - Systemy zewnętrzne

## 🎯 Architektura Systemu

```mermaid
graph TB
    subgraph "Frontend"
        A[Aplikacja WWW<br/>React]
        B[Aplikacja Mobilna<br/>React Native]
    end
    
    subgraph "Backend"
        C[API Server<br/>Node.js + Express]
        D[Baza Danych<br/>PostgreSQL]
    end
    
    subgraph "Deployment"
        E[Vercel<br/>WWW]
        F[Railway/Heroku<br/>Backend]
        G[Neon.tech<br/>Database]
    end
    
    A --> C
    B --> C
    C --> D
    
    E -.-> A
    F -.-> C
    G -.-> D
```

## 🧪 Testowanie Systemu

### 1. Test Backend API

```bash
# Health check
curl http://localhost:3001/api/v1/health

# Test logowania
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### 2. Test Aplikacji WWW

1. Otwórz `http://localhost:3000`
2. Zaloguj się danymi: `test@test.com` / `test123`
3. Sprawdź komunikat powitalny

### 3. Test Aplikacji Mobilnej

1. Uruchom aplikację na emulatorze/urządzeniu
2. Zaloguj się danymi: `test@test.com` / `test123`
3. Sprawdź komunikat powitalny

## 🔧 Zmienne Środowiskowe

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
TEST_EMAIL=test@test.com
TEST_PASSWORD=test123
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_APP_NAME=PTAK EXPO
```

## 👥 Zespół Deweloperski

Projekt przygotowany do pracy zespołowej:
- 🔀 Git branching strategy
- 📝 Dokumentacja API
- 🧪 Środowiska testowe
- 🚀 Automatyzacja deploymentu

## 🆘 Wsparcie

### Dokumentacja szczegółowa:
- [Backend README](./ptak-expo-backend/README.md)
- [Frontend README](./ptak-expo-web/README.md)
- [Mobile README](./PtakExpoMobile/README.md)

### Specyfikacja projektowa:
- [Wprowadzenie i założenia](./spec/Wprowadzenie%20i%20założenia.txt)
- [Analiza UX/UI](./spec/Analiza%20grafik%20UX_UI%20–%20opis%20ekranów%20WWW.txt)
- [Panel administracyjny](./spec/_Panel%20administracyjny.txt)
- [User Stories](./spec/user%20strory.txt)

## 📊 Status Development

| Komponent | Status | Wersja |
|-----------|---------|---------|
| Backend API | ✅ Gotowy | 1.0.0 |
| Aplikacja WWW | ✅ Gotowy | 1.0.0 |
| Aplikacja Mobilna | ✅ Gotowy | 1.0.0 |
| Baza Danych | ✅ Gotowy | 1.0.0 |
| Deployment | 🔄 Konfiguracja | - |

---

**PTAK EXPO System** - Nowoczesne rozwiązanie dla zarządzania targami i wystawcami. 