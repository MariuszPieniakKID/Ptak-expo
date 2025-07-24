# PTAK EXPO - Przydatne Komendy dla Developera

## Komendy Podstawowe

### Sprawdzenie Statusu Projektu
```bash
# Sprawdź czy porty są zajęte
lsof -i :3000,3001

# Sprawdź status PostgreSQL
brew services list | grep postgresql
# lub Linux:
sudo service postgresql status

# Sprawdź czy baza danych istnieje
psql -U postgres -l | grep ptak_expo_dev
```

### Uruchomienie Projektu
```bash
# Opcja 1: Automatyczny skrypt
./developer-setup/start-dev.sh

# Opcja 2: Manualne uruchomienie
# Terminal 1:
cd ptak-expo-backend && npm start

# Terminal 2:
cd ptak-expo-frontend && npm start
```

### Zatrzymanie Serwisów
```bash
# Zabij wszystkie procesy Node.js
pkill -f "node"

# Zabij procesy na konkretnych portach
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Lub użyj Ctrl+C w terminalach
```

## Komendy Bazy Danych

### Podstawowe Operacje
```bash
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
```bash
# Stwórz backup
pg_dump -U postgres ptak_expo_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore z backupu
psql -U postgres -d ptak_expo_dev -f backup_file.sql

# Reset bazy do stanu początkowego
./developer-setup/reset-database.sh
```

## Komendy Debugowania

### Sprawdzenie Logów
```bash
# Logi backend (w czasie rzeczywistym)
cd ptak-expo-backend && npm start | tee backend.log

# Logi PostgreSQL
tail -f /usr/local/var/log/postgresql@15.log  # macOS
tail -f /var/log/postgresql/postgresql-*.log  # Linux
```

### Sprawdzenie API
```bash
# Test połączenia
curl http://localhost:3001/

# Test logowania
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ptak-expo.com", "password": "admin123"}'

# Test endpoint wystawców
curl http://localhost:3001/api/exhibitors

# Test endpoint wystaw
curl http://localhost:3001/api/exhibitions
```

## Komendy Rozwoju

### Zarządzanie Zależnościami
```bash
# Instalacja nowych pakietów
cd ptak-expo-backend && npm install [package-name]
cd ptak-expo-frontend && npm install [package-name]

# Aktualizacja zależności
npm update

# Sprawdzenie outdated pakietów
npm outdated

# Czyszczenie cache
npm cache clean --force
```

### Zarządzanie Kodem
```bash
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
```bash
# Test czy wszystko działa
./developer-setup/test-setup.sh

# Test tylko backend
cd ptak-expo-backend && timeout 10s npm start

# Test tylko frontend
cd ptak-expo-frontend && npm start
```

### Testowanie Funkcjonalności
```bash
# Test tworzenia użytkownika
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Test tworzenia wystawcy
curl -X POST http://localhost:3001/api/exhibitors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Test Exhibitor", "email": "exhibitor@test.com"}'
```

## Komendy Troubleshooting

### Problemy z Portami
```bash
# Sprawdź co używa portu 3000
lsof -i :3000

# Sprawdź co używa portu 3001
lsof -i :3001

# Zabij proces na porcie
lsof -ti:3001 | xargs kill -9
```

### Problemy z Bazą Danych
```bash
# Restart PostgreSQL
brew services restart postgresql@15  # macOS
sudo service postgresql restart       # Linux

# Sprawdź czy serwis działa
brew services list | grep postgresql
sudo service postgresql status

# Sprawdź połączenie
psql -U postgres -c "SELECT version();"
```

### Problemy z Node.js
```bash
# Sprawdź wersję Node.js
node --version

# Sprawdź wersję npm
npm --version

# Sprawdź listę procesów Node.js
ps aux | grep node

# Czyszczenie cache npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Komendy Deployment

### Synchronizacja z Railway
```bash
# Sync zmian w bazie danych
cd ptak-expo-backend
npm run sync-railway-db

# Sprawdź status Railway
railway status

# Logi z Railway
railway logs
```

### Przygotowanie do Deployment
```bash
# Build frontend
cd ptak-expo-frontend
npm run build

# Sprawdź build
ls -la build/

# Test produkcyjny
npm run build && serve -s build -l 3000
```

## Skróty Klawiszowe

W terminalach:
- `Ctrl+C` - Zatrzymaj aktualny proces
- `Ctrl+Z` - Zawieś proces
- `Ctrl+D` - Wyjdź z terminala/bazy danych
- `Ctrl+R` - Szukaj w historii komend

W psql:
- `\q` - Wyjdź z psql
- `\dt` - Pokaż tabele
- `\d table_name` - Pokaż strukturę tabeli
- `\l` - Pokaż bazy danych
- `\c database_name` - Połącz z bazą danych

---

**Tip**: Dodaj te komendy do aliasów w `.zshrc` lub `.bashrc` dla szybszego dostępu!

```bash
# Przykładowe aliasy
alias ptak-start="./developer-setup/start-dev.sh"
alias ptak-test="./developer-setup/test-setup.sh"
alias ptak-reset="./developer-setup/reset-database.sh"
alias ptak-clean="./developer-setup/clean-cache.sh"
```
