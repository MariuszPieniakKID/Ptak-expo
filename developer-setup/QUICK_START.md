# 🚀 PTAK EXPO - Quick Start Guide

## 📋 Dla Nowego Developera - 5 minut setup!

### 1️⃣ Wymagania (sprawdź czy masz)
- ✅ Node.js 20.19.1+
- ✅ PostgreSQL 12+
- ✅ Git
- ✅ macOS/Linux (Windows WSL)

### 2️⃣ Szybki test wymagań
```bash
./developer-setup/check-requirements.sh
```

### 3️⃣ Automatyczny setup
```bash
./developer-setup/setup.sh
```

### 4️⃣ Test instalacji
```bash
./developer-setup/test-setup.sh
```

### 5️⃣ Uruchomienie
```bash
./developer-setup/start-dev.sh
```

## 🎯 Gotowe! Otwórz:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Login**: admin@ptak-expo.com / admin123

## 🔧 Przydatne komendy

```bash
# Restart serwisów
./developer-setup/restart-dev.sh

# Czyszczenie cache
./developer-setup/clean-cache.sh

# Reset bazy danych
./developer-setup/reset-database.sh
```

## 🚨 Problemy?

1. **Port zajęty**: `lsof -ti:3001 | xargs kill -9`
2. **Baza nie działa**: `brew services restart postgresql@15`
3. **Brak modułów**: `./developer-setup/clean-cache.sh`

## 📚 Pełna dokumentacja

- `DEVELOPER_SETUP_GUIDE.md` - Szczegółowe instrukcje
- `DEVELOPER_COMMANDS.md` - Wszystkie przydatne komendy
- `README.md` - Przegląd katalogu

---

**Potrzebujesz pomocy?** Sprawdź sekcję Troubleshooting w `DEVELOPER_SETUP_GUIDE.md`
