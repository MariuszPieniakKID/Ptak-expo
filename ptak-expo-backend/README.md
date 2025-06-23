# PTAK EXPO Backend API

Backend API dla systemu zarządzania targami PTAK EXPO.

## 🚀 Szybki start

### Wymagania
- Node.js 16+ 
- PostgreSQL (Neon.tech)
- npm lub yarn

### Instalacja

```bash
# Instalacja zależności
npm install

# Kopiowanie i konfiguracja zmiennych środowiskowych
cp .env.example .env
# Edytuj plik .env i dodaj swoje dane

# Uruchomienie w trybie deweloperskim
npm run dev

# Uruchomienie w trybie produkcyjnym
npm start
```

### Konfiguracja bazy danych

1. Utwórz bazę danych PostgreSQL na [Neon.tech](https://neon.tech)
2. Skopiuj connection string do pliku `.env` jako `DATABASE_URL`
3. Uruchom aplikację - tabele zostaną utworzone automatycznie

## 📋 API Endpoints

### Autoryzacja

#### `POST /api/v1/auth/login`
Logowanie użytkownika

**Request:**
```json
{
  "email": "test@test.com",
  "password": "test123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logowanie zakończone pomyślnie",
  "user": {
    "id": 1,
    "email": "test@test.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "exhibitor",
    "companyName": "Test Company"
  },
  "token": "jwt_token_here"
}
```

#### `GET /api/v1/auth/verify`
Weryfikacja tokenu JWT

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### `POST /api/v1/auth/logout`
Wylogowanie użytkownika

#### `GET /api/v1/auth/test`
Test endpoint do sprawdzenia działania autoryzacji

### Health Check

#### `GET /api/v1/health`
Status zdrowia API

## 🔐 Dane testowe

Domyślne dane testowe do logowania:
- **Email:** `test@test.com`
- **Hasło:** `test123`

Te dane można zmienić w pliku `.env`:
```env
TEST_EMAIL=test@test.com
TEST_PASSWORD=test123
```

## 🗄️ Struktura bazy danych

### Tabele:
- `users` - Użytkownicy systemu (wystawcy, administratorzy)
- `exhibitions` - Targi/wydarzenia
- `documents` - Dokumenty
- `marketing_materials` - Materiały marketingowe
- `communications` - Komunikaty
- `invitations` - Zaproszenia

### Role użytkowników:
- `exhibitor` - Wystawca
- `admin` - Administrator
- `guest` - Gość

## 🔧 Zmienne środowiskowe

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Test User Credentials
TEST_EMAIL=test@test.com
TEST_PASSWORD=test123
```

## 📁 Struktura projektu

```
src/
├── config/         # Konfiguracja (baza danych, itp.)
├── controllers/    # Kontrolery API
├── middleware/     # Middleware
├── models/         # Modele danych
├── routes/         # Definicje tras
├── utils/          # Narzędzia pomocnicze
└── index.js        # Główny plik aplikacji
```

## 🧪 Testowanie

```bash
# Test podstawowej funkcjonalności
curl http://localhost:3001/api/v1/health

# Test logowania z danymi testowymi
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## 🔄 Wersjonowanie API

API używa wersjonowania przez ścieżkę URL:
- Aktualna wersja: `/api/v1/`
- Przyszłe wersje: `/api/v2/`, itd.

## 🚦 Status kody

- `200` - Sukces
- `400` - Błąd żądania (nieprawidłowe dane)
- `401` - Brak autoryzacji
- `404` - Nie znaleziono
- `500` - Błąd serwera

## 🛠️ Rozwój

Aplikacja jest przygotowana do rozwoju w następujących kierunkach:
- Pełne CRUD dla wszystkich encji
- Uploadowanie plików
- Powiadomienia push
- System zaproszeń
- Panel administracyjny
- Integracje zewnętrzne 