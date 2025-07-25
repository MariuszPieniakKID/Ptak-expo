# PTAK EXPO - Instrukcja Setup Środowiska Deweloperskiego (Windows)

## Przegląd Projektu

Projekt PTAK EXPO składa się z trzech głównych części:
- **Backend** (`ptak-expo-backend/`) - Node.js + Express + PostgreSQL (port 3001)
- **Frontend Admin** (`ptak-expo-frontend/`) - React + TypeScript + SCSS (port 3000)
- **Mobile App** (`PtakExpo-IOS/`) - React Native + TypeScript

## Wymagania Systemowe

### Wymagane Oprogramowanie:
- **Node.js v20.19.1** lub nowszy
- **npm** (instalowane z Node.js)
- **PostgreSQL 15** lub nowszy
- **Git for Windows**
- **Visual Studio Code** (zalecany)
- **PowerShell 5.1** lub nowszy

### System Operacyjny:
- **Windows 10/11** (głównie wspierany)
- Windows Server 2019+ (opcjonalnie)

## Krok 1: Instalacja Node.js

1. **Pobierz Node.js**:
   - Idź na https://nodejs.org/
   - Pobierz wersję LTS (Long Term Support)
   - Uruchom installer jako administrator

2. **Weryfikacja**:
   ```cmd
   node --version
   npm --version
   ```

## Krok 2: Instalacja PostgreSQL

1. **Pobierz PostgreSQL**:
   - Idź na https://www.postgresql.org/download/windows/
   - Pobierz PostgreSQL 15.x installer
   - Uruchom jako administrator

2. **Konfiguracja podczas instalacji**:
   ```
   - Hasło dla postgres: postgres
   - Port: 5432 (domyślny)
   - Locale: Polish, Poland lub English
   - Zainstaluj pgAdmin (opcjonalnie)
   ```

3. **Dodaj do PATH**:
   ```cmd
   # Dodaj do zmiennych środowiskowych PATH:
   C:\Program Files\PostgreSQL\15\bin
   ```

4. **Test i utworzenie bazy**:
   ```cmd
   # Otwórz Command Prompt jako administrator
   psql -U postgres
   # Wpisz hasło: postgres
   
   # W psql:
   CREATE DATABASE ptak_expo_dev;
   \q
   ```

## Krok 3: Instalacja Git

1. **Pobierz Git**:
   - Idź na https://git-scm.com/download/win
   - Pobierz Git for Windows
   - Uruchom installer

2. **Konfiguracja**:
   ```cmd
   git config --global user.name "Twoje Imię"
   git config --global user.email "twoj.email@example.com"
   ```

## Krok 4: Klonowanie Repozytorium

```cmd
# Klonowanie repozytorium
git clone [URL_REPOZYTORIUM]
cd Ptak-expo

# Sprawdzenie struktury
dir
```

## Krok 5: Automatyczna Konfiguracja

```cmd
# Uruchomienie skryptu PowerShell
powershell -ExecutionPolicy Bypass -File developer-setup\setup.ps1
```

**Lub wykonaj kroki manualne poniżej:**

## Krok 6: Konfiguracja Backend (Manualna)

```cmd
# Przejście do katalogu backend
cd ptak-expo-backend

# Instalacja zależności
npm install

# Skopiowanie pliku .env
copy ..\developer-setup\.env.example .env

# Edycja pliku .env
notepad .env
```

## Krok 7: Import Bazy Danych

```cmd
# Import danych z dump
psql -U postgres -d ptak_expo_dev -f ..\developer-setup\ptak_expo_dev_dump.sql

# Weryfikacja importu
psql -U postgres -d ptak_expo_dev -c "SELECT COUNT(*) FROM users;"
```

## Krok 8: Konfiguracja Frontend

```cmd
# Przejście do katalogu frontend
cd ..\ptak-expo-frontend

# Instalacja zależności
npm install

# Skopiowanie pliku konfiguracji
copy ..\developer-setup\config.example.ts src\config\config.ts
```

## Krok 9: Uruchomienie Projektu

### Opcja 1: Dwa terminale Command Prompt

**Terminal 1 - Backend:**
```cmd
cd ptak-expo-backend
npm start
```

**Terminal 2 - Frontend:**
```cmd
cd ptak-expo-frontend
npm start
```

### Opcja 2: PowerShell Script

```cmd
powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1
```

## Krok 10: Weryfikacja

### Sprawdzenie czy wszystko działa:

1. **Backend API:** http://localhost:3001/
2. **Frontend:** http://localhost:3000/
3. **Login:** admin@ptak-expo.com / admin123

### Testy API:
```cmd
# Test połączenia z API (potrzebny curl lub PowerShell)
curl http://localhost:3001/

# Lub w PowerShell:
Invoke-RestMethod -Uri "http://localhost:3001/" -Method Get
```

## Troubleshooting Windows

### Błąd: "Port 3001 is already in use"
```cmd
# Sprawdź co używa portu
netstat -ano | findstr :3001

# Zabij proces (zastąp PID właściwym numerem)
taskkill /PID [PID] /F
```

### Błąd: "Cannot connect to database"
```cmd
# Sprawdź status usługi PostgreSQL
sc query postgresql-x64-15

# Uruchom usługę
net start postgresql-x64-15

# Lub przez Services.msc
services.msc
```

### Błąd: "Module not found"
```cmd
# Czyszczenie cache i reinstalacja
rmdir /s node_modules
del package-lock.json
npm install
```

### Błąd: "Execution Policy"
```cmd
# Zmień politykę wykonywania PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problemy z CORS
- Sprawdź czy backend działa na porcie 3001
- Sprawdź plik `src\config\config.ts` w frontend
- Wyłącz tymczasowo Windows Defender/Firewall

## Przydatne Komendy Windows

### Sprawdzenie statusu portów:
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### Sprawdzenie procesów Node.js:
```cmd
tasklist | findstr node
```

### Zabicie procesów:
```cmd
taskkill /IM node.exe /F
taskkill /PID [PID] /F
```

### Backup bazy danych:
```cmd
pg_dump -U postgres ptak_expo_dev > backup_%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%.sql
```

### Restore bazy danych:
```cmd
psql -U postgres -d ptak_expo_dev -f backup_file.sql
```

## Konfiguracja Visual Studio Code

### Instalacja rozszerzeń:
1. Otwórz VS Code
2. Ctrl+Shift+X (Extensions)
3. Zainstaluj:
   - TypeScript and JavaScript Language Features
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - PostgreSQL (SQLTools)

### Ustawienia workspace:
Stwórz `.vscode\settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "terminal.integrated.defaultProfile.windows": "Command Prompt"
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
   - Zmiany w bazie danych: edytuj `src\config\database.js`
   - Testuj lokalnie: `npm start`
   - Sync Railway: `npm run sync-railway-db`
   - Commit i push

## Użytkownicy Testowi

W bazie danych znajdują się następujący użytkownicy:

| Email | Hasło | Rola |
|-------|-------|------|
| admin@ptak-expo.com | admin123 | admin |
| user1@example.com | user123 | user |
| user2@example.com | user123 | user |

## Struktura Projektu

```
Ptak-expo\
├── ptak-expo-backend\          # Backend API
│   ├── src\
│   │   ├── config\
│   │   ├── controllers\
│   │   ├── routes\
│   │   └── database\
│   ├── package.json
│   └── .env
├── ptak-expo-frontend\         # Frontend Admin Panel
│   ├── src\
│   │   ├── components\
│   │   ├── pages\
│   │   ├── services\
│   │   └── styles\
│   └── package.json
└── PtakExpo-IOS\              # Mobile App
    ├── src\
    └── package.json
```

## Kontakt i Pomoc

- **Repository:** [URL_REPOZYTORIUM]
- **Dokumentacja:** `\docs\`
- **Issues:** Zgłaszaj problemy przez GitHub Issues

## Changelog

- **v1.0** - Pierwsza wersja instrukcji setup
- **v1.1** - Dodano skrypty automatyzujące
- **v1.2** - Dodano sekcję troubleshooting
- **v1.3** - Dostosowano do Windows 