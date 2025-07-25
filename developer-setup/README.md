# PTAK EXPO - Developer Setup Kit

Ten katalog zawiera wszystkie narzędzia i instrukcje potrzebne do skonfigurowania środowiska deweloperskiego dla nowego programisty.

## Szybki Start

1. **Przeczytaj instrukcje**: `DEVELOPER_SETUP_GUIDE.md`
2. **Uruchom automatyczny setup**: `./setup.sh`
3. **Przetestuj instalację**: `./test-setup.sh`
4. **Uruchom projekt**: `./start-dev.sh`

## Zawartość Katalogu

### Dokumentacja
- `DEVELOPER_SETUP_GUIDE.md` - Pełna instrukcja setup (START TUTAJ!)
- `README.md` - Ten plik

### Pliki Konfiguracyjne
- `.env.example` - Przykładowy plik środowiskowy dla backend
- `config.example.ts` - Przykładowy plik konfiguracji dla frontend

### Baza Danych
- `ptak_expo_dev_dump.sql` - Dump bazy danych z danymi testowymi

### Skrypty
- `setup.sh` - Automatyczna konfiguracja projektu
- `test-setup.sh` - Test czy instalacja przebiegła pomyślnie
- `start-dev.sh` - Uruchomienie środowiska deweloperskiego
- `restart-dev.sh` - Restart serwisów
- `clean-cache.sh` - Czyszczenie cache i reinstalacja
- `reset-database.sh` - Reset bazy danych

## Instrukcje Użycia

### Dla Nowego Developera

```bash
# 1. Sklonuj repozytorium
git clone [URL_REPO]
cd Ptak-expo

# 2. Zainstaluj PostgreSQL (jeśli nie masz)
brew install postgresql@15
brew services start postgresql@15

# 3. Uruchom automatyczny setup
chmod +x developer-setup/setup.sh
./developer-setup/setup.sh

# 4. Przetestuj instalację
./developer-setup/test-setup.sh

# 5. Uruchom projekt
./developer-setup/start-dev.sh
```

### Dostępne Komendy

```bash
# Uruchomienie projektu
./developer-setup/start-dev.sh

# Restart serwisów
./developer-setup/restart-dev.sh

# Czyszczenie cache
./developer-setup/clean-cache.sh

# Reset bazy danych
./developer-setup/reset-database.sh

# Test instalacji
./developer-setup/test-setup.sh
```

## Loginy Testowe

- **Admin**: admin@ptak-expo.com / admin123
- **User**: user1@example.com / user123

## Porty

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

## Pomoc

Jeśli napotkasz problemy:

1. Sprawdź `DEVELOPER_SETUP_GUIDE.md` - sekcja "Troubleshooting"
2. Uruchom `./test-setup.sh` aby zdiagnozować problem
3. Sprawdź czy PostgreSQL działa: `brew services list | grep postgresql`
4. Sprawdź czy porty są wolne: `lsof -i :3000,3001`

## Wymagania Systemowe

- Node.js v20.19.1+
- PostgreSQL 12+
- macOS/Linux/Windows (WSL)
- Git

## Struktura Projektu

```
Ptak-expo/
├── ptak-expo-backend/          # Node.js + Express API
├── ptak-expo-frontend/         # React + TypeScript Admin Panel
├── PtakExpo-IOS/              # React Native Mobile App
└── developer-setup/           # Narzędzia setup (ten katalog)
```

## Workflow

1. Twórz nowy branch dla każdej funkcji
2. Testuj lokalnie przed commit
3. Używaj opisowych nazw commitów
4. Regularnie sync z main branch

---

**Autor**: PTAK EXPO Development Team  
**Wersja**: 1.0  
**Data**: $(date +%Y-%m-%d)
