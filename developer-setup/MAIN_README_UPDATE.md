# Aktualizacja do README.md projektu

Dodaj następującą sekcję do głównego README.md projektu:

```markdown
## 🚀 Quick Start dla Nowego Developera

### Automatyczny Setup (5 minut)
```bash
# 1. Sklonuj repozytorium
git clone [URL_REPOZYTORIUM]
cd Ptak-expo

# 2. Sprawdź wymagania
./developer-setup/check-requirements.sh

# 3. Automatyczna konfiguracja
./developer-setup/setup.sh

# 4. Uruchom projekt
./developer-setup/start-dev.sh
```

### Dostęp do Aplikacji
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Login**: admin@ptak-expo.com / admin123

### Dokumentacja dla Developera
- [`developer-setup/QUICK_START.md`](developer-setup/QUICK_START.md) - 5-minutowy przewodnik
- [`developer-setup/DEVELOPER_SETUP_GUIDE.md`](developer-setup/DEVELOPER_SETUP_GUIDE.md) - Pełna instrukcja
- [`developer-setup/DEVELOPER_COMMANDS.md`](developer-setup/DEVELOPER_COMMANDS.md) - Przydatne komendy
- [`developer-setup/README.md`](developer-setup/README.md) - Przegląd narzędzi

### Przydatne Skrypty
```bash
./developer-setup/start-dev.sh          # Uruchom projekt
./developer-setup/restart-dev.sh        # Restart serwisów
./developer-setup/clean-cache.sh        # Wyczyść cache
./developer-setup/reset-database.sh     # Reset bazy danych
./developer-setup/test-setup.sh         # Test instalacji
```

### Wymagania Systemowe
- Node.js 20.19.1+
- PostgreSQL 12+
- Git
- macOS/Linux (Windows WSL)

### Problemy?
Sprawdź sekcję Troubleshooting w [`developer-setup/DEVELOPER_SETUP_GUIDE.md`](developer-setup/DEVELOPER_SETUP_GUIDE.md)
```

## Dodatkowe Zmiany

### 1. Dodaj do .gitignore (jeśli nie ma):
```
# Developer setup files
developer-setup/logs/
developer-setup/tmp/
```

### 2. Dodaj do package.json (root):
```json
{
  "scripts": {
    "dev-setup": "./developer-setup/setup.sh",
    "dev-start": "./developer-setup/start-dev.sh",
    "dev-test": "./developer-setup/test-setup.sh"
  }
}
```

### 3. Dodaj do docs/
- Link do `developer-setup/` w głównej dokumentacji
- Sekcja "Onboarding" w zespołowych dokumentach
