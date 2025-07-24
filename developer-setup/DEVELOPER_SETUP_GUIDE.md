# PTAK EXPO - Instrukcja Setup Środowiska Deweloperskiego

## Przegląd Projektu

Projekt PTAK EXPO składa się z trzech głównych części:
- **Backend** (`ptak-expo-backend/`) - Node.js + Express + PostgreSQL (port 3001)
- **Frontend Admin** (`ptak-expo-frontend/`) - React + TypeScript + SCSS (port 3000)
- **Mobile App** (`PtakExpo-IOS/`) - React Native + TypeScript

## Wymagania Systemowe

### Wymagane Oprogramowanie:
- Node.js v20.19.1 lub nowszy
- npm lub yarn
- PostgreSQL 12 lub nowszy
- Git
- Visual Studio Code (lub inny edytor)

### System Operacyjny:
- macOS (zalecany)
- Linux
- Windows z WSL

## Krok 1: Instalacja PostgreSQL

### macOS (Homebrew):
```bash
# Instalacja PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Dodanie PostgreSQL do PATH
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Tworzenie użytkownika i bazy danych
createuser -s postgres
psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
createdb -U postgres ptak_expo_dev
```

### Linux (Ubuntu/Debian):
```bash
# Instalacja PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Konfiguracja
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres';
CREATE DATABASE ptak_expo_dev;
\q
```

### Windows:
1. Pobierz i zainstaluj PostgreSQL z https://www.postgresql.org/download/windows/
2. Podczas instalacji ustaw hasło dla użytkownika postgres: `postgres`
3. Utwórz bazę danych `ptak_expo_dev`

## Krok 2: Klonowanie Repozytorium

```bash
# Klonowanie repozytorium
git clone [URL_REPOZYTORIUM]
cd Ptak-expo

# Sprawdzenie struktury
ls -la
```

## Krok 3: Automatyczna Konfiguracja

Uruchom skrypt automatycznej konfiguracji:

```bash
# Nadanie uprawnień wykonywalnych
chmod +x developer-setup/setup.sh

# Uruchomienie skryptu
./developer-setup/setup.sh
```

**Lub wykonaj kroki manualne poniżej:**

## Krok 4: Konfiguracja Backend (Manualna)

```bash
# Przejście do katalogu backend
cd ptak-expo-backend

# Instalacja zależności
npm install

# Skopiowanie pliku .env
cp ../developer-setup/.env.example .env

# Edycja pliku .env jeśli potrzeba
nano .env
```

## Krok 5: Import Bazy Danych

```bash
# Import danych z dump
psql -U postgres -d ptak_expo_dev -f ../developer-setup/ptak_expo_dev_dump.sql

# Weryfikacja importu
psql -U postgres -d ptak_expo_dev -c "SELECT COUNT(*) FROM users;"
```

## Krok 6: Konfiguracja Frontend

```bash
# Przejście do katalogu frontend
cd ../ptak-expo-frontend

# Instalacja zależności
npm install

# Skopiowanie pliku konfiguracji
cp ../developer-setup/config.example.ts src/config/config.ts
```

## Krok 7: Uruchomienie Projektu

### Otwieranie w 2 terminalach:

**Terminal 1 - Backend:**
```bash
cd ptak-expo-backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd ptak-expo-frontend
npm start
```

### Lub użycie skryptu:

```bash
# Uruchomienie wszystkich serwisów
./developer-setup/start-dev.sh
```

## Krok 8: Weryfikacja

### Sprawdzenie czy wszystko działa:

1. **Backend API:** http://localhost:3001/
2. **Frontend:** http://localhost:3000/
3. **Login:** admin@ptak-expo.com / admin123

### Testy API:
```bash
# Test połączenia z API
curl http://localhost:3001/

# Test logowania
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ptak-expo.com", "password": "admin123"}'
```

## Struktura Projektu

```
Ptak-expo/
├── ptak-expo-backend/          # Backend API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── database/
│   ├── package.json
│   └── .env
├── ptak-expo-frontend/         # Frontend Admin Panel
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
└── PtakExpo-IOS/              # Mobile App
    ├── src/
    └── package.json
```

## Użytkownicy Testowi

W bazie danych znajdują się następujący użytkownicy:

| Email | Hasło | Rola |
|-------|-------|------|
| admin@ptak-expo.com | admin123 | admin |
| user1@example.com | user123 | user |
| user2@example.com | user123 | user |

## Skrypty Pomocnicze

### Restart projektu:
```bash
./developer-setup/restart-dev.sh
```

### Czyszczenie cache:
```bash
./developer-setup/clean-cache.sh
```

### Restart bazy danych:
```bash
./developer-setup/reset-database.sh
```

### Synchronizacja z Railway:
```bash
cd ptak-expo-backend
npm run sync-railway-db
```

## Troubleshooting

### Błąd: "Port 3001 is already in use"
```bash
# Zabicie procesów na porcie 3001
lsof -ti:3001 | xargs kill -9
```

### Błąd: "Cannot connect to database"
```bash
# Restart PostgreSQL
brew services restart postgresql@15  # macOS
sudo service postgresql restart       # Linux
```

### Błąd: "Module not found"
```bash
# Czyszczenie cache i reinstalacja
rm -rf node_modules package-lock.json
npm install
```

### Problemy z CORS
- Sprawdź czy backend działa na porcie 3001
- Sprawdź plik `src/config/config.ts` w frontend

## Konfiguracja IDE

### Visual Studio Code - Rozszerzenia:
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Ustawienia workspace:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Workflow Deweloperski

1. **Praca z kodem:**
   - Zawsze twórz nowy branch przed rozpoczęciem pracy
   - Używaj opisowych nazw commitów
   - Regularnie pushuj zmiany

2. **Testowanie:**
   - Zawsze testuj zmiany lokalnie
   - Sprawdź czy backend i frontend działają razem
   - Przetestuj na różnych rozdzielczościach

3. **Deployment:**
   - Zmiany w bazie danych: edytuj `src/config/database.js`
   - Testuj lokalnie: `npm start`
   - Sync Railway: `npm run sync-railway-db`
   - Commit i push

## Przydatne Komendy

```bash
# Sprawdzenie statusu portów
lsof -i :3000,3001

# Sprawdzenie logów bazy danych
tail -f /usr/local/var/log/postgresql@15.log

# Sprawdzenie statusu serwisów
brew services list | grep postgresql

# Backup bazy danych
pg_dump ptak_expo_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore bazy danych
psql -U postgres -d ptak_expo_dev -f backup_file.sql
```

## Kontakt i Pomoc

- **Repository:** [URL_REPOZYTORIUM]
- **Dokumentacja:** `/docs/`
- **Issues:** Zgłaszaj problemy przez GitHub Issues

## Changelog

- **v1.0** - Pierwsza wersja instrukcji setup
- **v1.1** - Dodano skrypty automatyzujące
- **v1.2** - Dodano sekcję troubleshooting 