# PTAK EXPO - Przydatne Komendy dla Developera (Windows)

## Komendy Podstawowe

### Sprawdzenie Statusu Projektu
```cmd
# Sprawdź czy porty są zajęte
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Sprawdź status usługi PostgreSQL
sc query postgresql-x64-15
# lub
net start postgresql-x64-15

# Sprawdź czy baza danych istnieje
psql -U postgres -l | findstr ptak_expo_dev
```

### Uruchomienie Projektu
```cmd
# Opcja 1: Automatyczny skrypt PowerShell
powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1

# Opcja 2: Manualne uruchomienie
# Terminal 1 (Command Prompt):
cd ptak-expo-backend
npm start

# Terminal 2 (Command Prompt):
cd ptak-expo-frontend
npm start
```

### Zatrzymanie Serwisów
```cmd
# Zabij wszystkie procesy Node.js
taskkill /IM node.exe /F

# Zabij procesy na konkretnych portach
# Sprawdź PID:
netstat -ano | findstr :3000
netstat -ano | findstr :3001
# Zabij process:
taskkill /PID [PID] /F

# Lub użyj Ctrl+C w terminalach
```

## Komendy Bazy Danych

### Podstawowe Operacje
```cmd
# Połącz się z bazą danych
psql -U postgres -d ptak_expo_dev

# Sprawdź tabele
psql -U postgres -d ptak_expo_dev -c "\dt"

# Sprawdź użytkowników
psql -U postgres -d ptak_expo_dev -c "SELECT * FROM users;"

# Sprawdź wystawców
psql -U postgres -d ptak_expo_dev -c "SELECT * FROM exhibitors;"
```

### Backup i Restore
```cmd
# Stwórz backup z datą
pg_dump -U postgres ptak_expo_dev > backup_%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%.sql

# Stwórz backup z timestampem
pg_dump -U postgres ptak_expo_dev > backup_%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%_%TIME:~0,2%%TIME:~3,2%.sql

# Restore z backupu
psql -U postgres -d ptak_expo_dev -f backup_file.sql

# Reset bazy do stanu początkowego
powershell -ExecutionPolicy Bypass -File developer-setup\reset-database.ps1
```

## Komendy Debugowania

### Sprawdzenie Logów
```cmd
# Logi backend (w czasie rzeczywistym)
cd ptak-expo-backend
npm start

# Logi PostgreSQL (Windows)
# Sprawdź lokalizację logów:
pg_config --sysconfdir
# Zwykle: C:\Program Files\PostgreSQL\15\data\log\
```

### Sprawdzenie API
```cmd
# Test połączenia (curl dla Windows)
curl http://localhost:3001/

# Test logowania
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"admin@ptak-expo.com\", \"password\": \"admin123\"}"

# Test endpoint wystawców
curl http://localhost:3001/api/exhibitors

# Test endpoint wystaw
curl http://localhost:3001/api/exhibitions
```

### PowerShell API Tests
```powershell
# Test połączenia
Invoke-RestMethod -Uri "http://localhost:3001/" -Method Get

# Test logowania
$body = @{
    email = "admin@ptak-expo.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"

# Test endpoint wystawców
Invoke-RestMethod -Uri "http://localhost:3001/api/exhibitors" -Method Get
```

## Komendy Rozwoju

### Zarządzanie Zależnościami
```cmd
# Instalacja nowych pakietów
cd ptak-expo-backend
npm install [package-name]

cd ptak-expo-frontend
npm install [package-name]

# Aktualizacja zależności
npm update

# Sprawdzenie outdated pakietów
npm outdated

# Czyszczenie cache
npm cache clean --force
```

### Zarządzanie Kodem
```cmd
# Sprawdź status Git
git status

# Stwórz nowy branch
git checkout -b feature/nazwa-funkcji

# Commit zmian
git add .
git commit -m "feat: opis zmian"

# Push do zdalnego repozytorium
git push origin feature/nazwa-funkcji

# Sync z main branch
git checkout main
git pull origin main
git checkout feature/nazwa-funkcji
git merge main
```

## Komendy Testowania

### Testowanie Manualne
```cmd
# Test czy wszystko działa
powershell -ExecutionPolicy Bypass -File developer-setup\test-setup.ps1

# Test tylko backend
cd ptak-expo-backend
timeout /t 10 npm start

# Test tylko frontend
cd ptak-expo-frontend
npm start
```

### Testowanie Funkcjonalności
```cmd
# Test tworzenia użytkownika
curl -X POST http://localhost:3001/api/users ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}"

# Test tworzenia wystawcy
curl -X POST http://localhost:3001/api/exhibitors ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"name\": \"Test Exhibitor\", \"email\": \"exhibitor@test.com\"}"
```

## Komendy Troubleshooting

### Problemy z Portami
```cmd
# Sprawdź co używa portu 3000
netstat -ano | findstr :3000

# Sprawdź co używa portu 3001
netstat -ano | findstr :3001

# Zabij proces na porcie (zastąp PID)
taskkill /PID [PID] /F

# Zabij wszystkie procesy Node.js
taskkill /IM node.exe /F
```

### Problemy z Bazą Danych
```cmd
# Sprawdź status usługi PostgreSQL
sc query postgresql-x64-15

# Uruchom usługę PostgreSQL
net start postgresql-x64-15

# Zatrzymaj usługę PostgreSQL
net stop postgresql-x64-15

# Sprawdź połączenie
psql -U postgres -c "SELECT version();"

# Sprawdź czy port 5432 jest otwarty
netstat -ano | findstr :5432
```

### Problemy z Node.js
```cmd
# Sprawdź wersję Node.js
node --version

# Sprawdź wersję npm
npm --version

# Sprawdź procesy Node.js
tasklist | findstr node

# Czyszczenie cache npm
npm cache clean --force
rmdir /s node_modules
del package-lock.json
npm install
```

### Problemy z PowerShell
```cmd
# Sprawdź politykę wykonywania
Get-ExecutionPolicy

# Zmień politykę (w PowerShell jako administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Uruchom skrypt z bypass
powershell -ExecutionPolicy Bypass -File script.ps1
```

## Komendy Deployment

### Synchronizacja z Railway
```cmd
# Sync zmian w bazie danych
cd ptak-expo-backend
npm run sync-railway-db

# Sprawdź status Railway (jeśli zainstalowany)
railway status

# Logi z Railway
railway logs
```

### Przygotowanie do Deployment
```cmd
# Build frontend
cd ptak-expo-frontend
npm run build

# Sprawdź build
dir build\

# Test produkcyjny (potrzebny serve)
npm install -g serve
npm run build
serve -s build -l 3000
```

## Komendy Systemowe Windows

### Zarządzanie Usługami
```cmd
# Lista wszystkich usług
sc query

# Sprawdź konkretną usługę
sc query postgresql-x64-15

# Uruchom usługę
net start postgresql-x64-15

# Zatrzymaj usługę
net stop postgresql-x64-15

# Otwórz manager usług
services.msc
```

### Monitorowanie Systemu
```cmd
# Sprawdź wykorzystanie procesora i pamięci
tasklist /fo table

# Sprawdź konkretny proces
tasklist | findstr node

# Sprawdź dysk
dir C:\ | findstr "bytes free"

# Sprawdź użycie portów
netstat -ano
```

### Zarządzanie Plikami
```cmd
# Kopiowanie plików
copy source.txt destination.txt

# Przenoszenie plików
move source.txt destination.txt

# Usuwanie katalogów
rmdir /s /q folder_name

# Znajdź pliki
dir /s *.json
```

## PowerShell Komendy Zaawansowane

### Zarządzanie Procesami
```powershell
# Pokaż procesy Node.js
Get-Process | Where-Object {$_.Name -like "*node*"}

# Zabij procesy Node.js
Get-Process -Name "node" | Stop-Process -Force

# Monitoruj procesy
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
```

### Zarządzanie Sieciami
```powershell
# Sprawdź połączenia sieciowe
Get-NetTCPConnection | Where-Object {$_.LocalPort -eq 3000}

# Test połączenia
Test-NetConnection -ComputerName localhost -Port 3001

# Sprawdź interfejsy sieciowe
Get-NetAdapter
```

### Zarządzanie Plikami
```powershell
# Znajdź pliki
Get-ChildItem -Path . -Recurse -Filter "*.json"

# Szukaj w zawartości plików
Select-String -Path "*.js" -Pattern "console.log"

# Sprawdź rozmiar katalogów
Get-ChildItem | Measure-Object -Property Length -Sum
```

## Skróty Klawiszowe

### Command Prompt:
- `Ctrl+C` - Zatrzymaj aktualny proces
- `Ctrl+Z` - Kończy input (EOF)
- `F7` - Historia komend
- `Tab` - Autocomplete
- `Ctrl+L` - Wyczyść ekran (w niektórych terminalach)

### PowerShell:
- `Ctrl+C` - Zatrzymaj aktualny proces
- `Ctrl+Break` - Zatrzymaj wykonywanie
- `Tab` - Autocomplete
- `Ctrl+R` - Szukaj w historii
- `Clear-Host` - Wyczyść ekran

### W psql:
- `\q` - Wyjdź z psql
- `\dt` - Pokaż tabele
- `\d table_name` - Pokaż strukturę tabeli
- `\l` - Pokaż bazy danych
- `\c database_name` - Połącz z bazą danych

## Przydatne Aliasy

### Dodaj do PowerShell Profile:
```powershell
# Sprawdź lokalizację profilu
$PROFILE

# Edytuj profil
notepad $PROFILE

# Dodaj aliasy:
Set-Alias -Name ptak-start -Value "powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1"
Set-Alias -Name ptak-test -Value "powershell -ExecutionPolicy Bypass -File developer-setup\test-setup.ps1"
Set-Alias -Name ptak-clean -Value "powershell -ExecutionPolicy Bypass -File developer-setup\clean-cache.ps1"
Set-Alias -Name ptak-reset -Value "powershell -ExecutionPolicy Bypass -File developer-setup\reset-database.ps1"
```

### Dodaj do Command Prompt (doskey):
```cmd
# Stwórz plik batch z aliasami
doskey ptak-start=powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1
doskey ptak-test=powershell -ExecutionPolicy Bypass -File developer-setup\test-setup.ps1
doskey ptak-clean=powershell -ExecutionPolicy Bypass -File developer-setup\clean-cache.ps1
doskey ptak-reset=powershell -ExecutionPolicy Bypass -File developer-setup\reset-database.ps1
```

## Dodatkowe Narzędzia Windows

### Przydatne Oprogramowanie:
- **Windows Terminal** - Lepszy terminal
- **Git Bash** - Unix-like terminal
- **Chocolatey** - Package manager dla Windows
- **Scoop** - Alternatywny package manager
- **HeidiSQL** - GUI dla PostgreSQL
- **Postman** - Testowanie API

### Instalacja przez Chocolatey:
```cmd
# Zainstaluj Chocolatey
# Sprawdź: https://chocolatey.org/install

# Zainstaluj narzędzia
choco install nodejs postgresql git vscode curl
```

---

**Tip**: Używaj Windows Terminal zamiast Command Prompt - ma lepsze funkcje i wsparcie dla PowerShell! 