# PTAK EXPO - Developer Setup Kit (Windows)

Ten katalog zawiera wszystkie narzędzia i instrukcje potrzebne do skonfigurowania środowiska deweloperskiego dla nowego programisty na **Windows**.

## 🚀 Szybki Start

### Dla Windows:
1. **Przeczytaj instrukcje**: `DEVELOPER_SETUP_GUIDE_WINDOWS.md`
2. **Uruchom automatyczny setup**: `powershell -ExecutionPolicy Bypass -File setup.ps1`
3. **Przetestuj instalację**: `powershell -ExecutionPolicy Bypass -File test-setup.ps1`
4. **Uruchom projekt**: `powershell -ExecutionPolicy Bypass -File start-dev.ps1`

### Dla macOS/Linux:
1. **Przeczytaj instrukcje**: `DEVELOPER_SETUP_GUIDE.md`
2. **Uruchom automatyczny setup**: `./setup.sh`
3. **Przetestuj instalację**: `./test-setup.sh`
4. **Uruchom projekt**: `./start-dev.sh`

## 📁 Zawartość Katalogu

### Dokumentacja Windows
- `DEVELOPER_SETUP_GUIDE_WINDOWS.md` - Pełna instrukcja dla Windows
- `QUICK_START_WINDOWS.md` - 5-minutowy przewodnik Windows
- `DEVELOPER_COMMANDS_WINDOWS.md` - Komendy Windows/PowerShell
- `README_WINDOWS.md` - Ten plik

### Dokumentacja macOS/Linux
- `DEVELOPER_SETUP_GUIDE.md` - Pełna instrukcja Unix-like
- `QUICK_START.md` - 5-minutowy przewodnik Unix-like
- `DEVELOPER_COMMANDS.md` - Komendy Bash/Unix
- `README.md` - README Unix-like

### Pliki Konfiguracyjne
- `.env.example` - Przykładowy plik środowiskowy dla backend
- `config.example.ts` - Przykładowy plik konfiguracji dla frontend

### Baza Danych
- `ptak_expo_dev_dump.sql` - Dump bazy danych z danymi testowymi

### Skrypty Windows (PowerShell)
- `setup.ps1` - Automatyczna konfiguracja projektu
- `test-setup.ps1` - Test czy instalacja przebiegła pomyślnie
- `start-dev.ps1` - Uruchomienie środowiska deweloperskiego
- `restart-dev.ps1` - Restart serwisów
- `clean-cache.ps1` - Czyszczenie cache i reinstalacja
- `reset-database.ps1` - Reset bazy danych
- `check-requirements.ps1` - Sprawdzenie wymagań systemu

### Skrypty Unix-like (Bash)
- `setup.sh` - Automatyczna konfiguracja projektu
- `test-setup.sh` - Test czy instalacja przebiegła pomyślnie
- `start-dev.sh` - Uruchomienie środowiska deweloperskiego
- `restart-dev.sh` - Restart serwisów
- `clean-cache.sh` - Czyszczenie cache i reinstalacja
- `reset-database.sh` - Reset bazy danych
- `check-requirements.sh` - Sprawdzenie wymagań systemu

### Inne
- `index.html` - Dashboard developerski
- `MAIN_README_UPDATE.md` - Instrukcje aktualizacji głównego README

## 🖥️ Instrukcje Użycia dla Windows

### Dla Nowego Developera

```cmd
# 1. Sklonuj repozytorium
git clone [URL_REPO]
cd Ptak-expo

# 2. Zainstaluj wymagane oprogramowanie:
# - Node.js 20.19.1+ z https://nodejs.org/
# - PostgreSQL 15+ z https://www.postgresql.org/download/windows/
# - Git for Windows z https://git-scm.com/download/win

# 3. Uruchom automatyczny setup
powershell -ExecutionPolicy Bypass -File developer-setup\setup.ps1

# 4. Przetestuj instalację
powershell -ExecutionPolicy Bypass -File developer-setup\test-setup.ps1

# 5. Uruchom projekt
powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1
```

### Dostępne Komendy Windows

```cmd
# Uruchomienie projektu
powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1

# Restart serwisów
powershell -ExecutionPolicy Bypass -File developer-setup\restart-dev.ps1

# Czyszczenie cache
powershell -ExecutionPolicy Bypass -File developer-setup\clean-cache.ps1

# Reset bazy danych
powershell -ExecutionPolicy Bypass -File developer-setup\reset-database.ps1

# Test instalacji
powershell -ExecutionPolicy Bypass -File developer-setup\test-setup.ps1

# Sprawdzenie wymagań
powershell -ExecutionPolicy Bypass -File developer-setup\check-requirements.ps1
```

## 🔧 Loginy Testowe

- **Admin**: admin@ptak-expo.com / admin123
- **User**: user1@example.com / user123

## 🌐 Porty

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

## 🆘 Pomoc Windows

Jeśli napotkasz problemy:

1. **Sprawdź** `DEVELOPER_SETUP_GUIDE_WINDOWS.md` - sekcja "Troubleshooting Windows"
2. **Uruchom** `powershell -ExecutionPolicy Bypass -File developer-setup\test-setup.ps1` aby zdiagnozować problem
3. **Sprawdź** czy PostgreSQL działa: `sc query postgresql-x64-15`
4. **Sprawdź** czy porty są wolne: `netstat -ano | findstr :3000` i `netstat -ano | findstr :3001`

### Najczęstsze problemy Windows:

#### PowerShell Execution Policy
```cmd
# Błąd: "cannot be loaded because running scripts is disabled"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Lub uruchom z bypass:
powershell -ExecutionPolicy Bypass -File script.ps1
```

#### Port zajęty
```cmd
# Sprawdź PID procesu
netstat -ano | findstr :3001

# Zabij proces
taskkill /PID [PID] /F
```

#### PostgreSQL nie działa
```cmd
# Sprawdź usługę
sc query postgresql-x64-15

# Uruchom usługę
net start postgresql-x64-15
```

## 📋 Wymagania Systemowe

### Windows:
- **OS**: Windows 10/11 lub Windows Server 2019+
- **PowerShell**: 5.1 lub nowszy
- **Node.js**: v20.19.1+
- **PostgreSQL**: 15+
- **Git**: Git for Windows
- **RAM**: 8GB+ zalecane
- **Dysk**: 10GB+ wolnego miejsca

### macOS/Linux:
- **OS**: macOS 10.15+ lub Linux (Ubuntu 20.04+)
- **Shell**: Bash/Zsh
- **Node.js**: v20.19.1+
- **PostgreSQL**: 12+
- **Git**: Git CLI
- **RAM**: 8GB+ zalecane
- **Dysk**: 10GB+ wolnego miejsca

## 🏗️ Struktura Projektu

```
Ptak-expo\
├── ptak-expo-backend\          # Node.js + Express API
├── ptak-expo-frontend\         # React + TypeScript Admin Panel
├── PtakExpo-IOS\              # React Native Mobile App
└── developer-setup\           # Narzędzia setup (ten katalog)
    ├── Windows Files (.ps1)
    ├── Unix Files (.sh)
    └── Documentation (.md)
```

## 🔄 Workflow Windows

1. **Twórz** nowy branch dla każdej funkcji
2. **Testuj** lokalnie przed commit:
   ```cmd
   powershell -ExecutionPolicy Bypass -File developer-setup\test-setup.ps1
   ```
3. **Używaj** opisowych nazw commitów
4. **Regularnie** sync z main branch

## 🛠️ Przydatne Narzędzia Windows

### Polecane:
- **Windows Terminal** - Lepszy terminal niż Command Prompt
- **Git Bash** - Unix-like terminal na Windows
- **VS Code** - Edytor kodu z extensions pack dla JS/TS
- **HeidiSQL** - GUI dla PostgreSQL
- **Postman** - Testowanie API

### Instalacja przez Chocolatey:
```cmd
# Zainstaluj Chocolatey z https://chocolatey.org/install
choco install nodejs postgresql git vscode
```

---

**Autor**: PTAK EXPO Development Team  
**Wersja**: 1.0 (Windows Edition)  
**Data**: 2024-07-18  
**Platforma**: Windows 10/11, Windows Server 2019+ 