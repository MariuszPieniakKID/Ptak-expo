# 🚀 PTAK EXPO - Quick Start Guide (Windows)

## 📋 Dla Nowego Developera - 5 minut setup!

### 1️⃣ Wymagania (sprawdź czy masz)
- ✅ **Node.js 20.19.1+** (https://nodejs.org/)
- ✅ **PostgreSQL 15+** (https://www.postgresql.org/download/windows/)
- ✅ **Git for Windows** (https://git-scm.com/download/win)
- ✅ **Windows 10/11**
- ✅ **PowerShell 5.1+**

### 2️⃣ Szybki test wymagań
```cmd
powershell -ExecutionPolicy Bypass -File developer-setup\check-requirements.ps1
```

### 3️⃣ Automatyczny setup
```cmd
powershell -ExecutionPolicy Bypass -File developer-setup\setup.ps1
```

### 4️⃣ Test instalacji
```cmd
powershell -ExecutionPolicy Bypass -File developer-setup\test-setup.ps1
```

### 5️⃣ Uruchomienie
```cmd
powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1
```

## 🎯 Gotowe! Otwórz:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Login**: admin@ptak-expo.com / admin123

## 🔧 Przydatne komendy

```cmd
# Restart serwisów
powershell -ExecutionPolicy Bypass -File developer-setup\restart-dev.ps1

# Czyszczenie cache
powershell -ExecutionPolicy Bypass -File developer-setup\clean-cache.ps1

# Reset bazy danych
powershell -ExecutionPolicy Bypass -File developer-setup\reset-database.ps1
```

## 🚨 Problemy?

### Porty zajęte:
```cmd
# Sprawdź PID procesu
netstat -ano | findstr :3001
# Zabij proces
taskkill /PID [PID] /F
```

### Baza nie działa:
```cmd
# Sprawdź usługę PostgreSQL
sc query postgresql-x64-15
# Uruchom usługę
net start postgresql-x64-15
```

### Brak modułów:
```cmd
powershell -ExecutionPolicy Bypass -File developer-setup\clean-cache.ps1
```

### Problemy z PowerShell:
```cmd
# Zmień politykę wykonywania
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🛠️ Alternatywne uruchomienie (manualne)

### Terminal 1 - Backend:
```cmd
cd ptak-expo-backend
npm start
```

### Terminal 2 - Frontend:
```cmd
cd ptak-expo-frontend
npm start
```

## 📚 Pełna dokumentacja

- `DEVELOPER_SETUP_GUIDE_WINDOWS.md` - Szczegółowe instrukcje
- `DEVELOPER_COMMANDS_WINDOWS.md` - Wszystkie przydatne komendy
- `README.md` - Przegląd katalogu

## 🔍 Diagnostyka

### Sprawdzenie Node.js:
```cmd
node --version
npm --version
```

### Sprawdzenie PostgreSQL:
```cmd
psql --version
psql -U postgres -c "SELECT version();"
```

### Sprawdzenie Git:
```cmd
git --version
```

---

**Potrzebujesz pomocy?** Sprawdź sekcję Troubleshooting w `DEVELOPER_SETUP_GUIDE_WINDOWS.md`

**Polecane**: Zainstaluj **Windows Terminal** dla lepszego doświadczenia z terminalem! 