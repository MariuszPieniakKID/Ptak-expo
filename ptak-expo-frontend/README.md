# PTAK EXPO Frontend

Frontend aplikacji do zarządzania targami PTAK EXPO - React + TypeScript.

## Instalacja

```bash
npm install
cp env.example .env.local
npm start
```

Aplikacja dostępna na http://localhost:3000

## Konfiguracja

Utwórz `.env.local`:

```env
REACT_APP_API_URL=http://localhost:3001
```

## Struktura projektu

```
src/
├── components/     # Reużywalne komponenty
├── pages/          # Widoki aplikacji
├── contexts/       # React Context (Auth)
├── services/       # API calls
└── assets/         # Obrazy, ikony
```

## Główne technologie

- React 18 + TypeScript
- Material-UI
- React Router
- Sass/SCSS

## Logowanie testowe

- Admin: `admin@ptak-expo.com` / `admin123`
- User: `test@test.com` / `test123`

## Deployment

Deployment przez Railway - push do main triggeru automatyczny build.

## Troubleshooting

Problem z JWT? Wyczyść localStorage i zaloguj się ponownie.

API nie odpowiada? Sprawdź czy backend działa na porcie 3001.
