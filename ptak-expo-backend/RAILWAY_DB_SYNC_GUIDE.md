# 🚀 Railway Database Sync Guide

## Automatyczny sposób synchronizacji bazy danych z Railway

### 📋 Przygotowanie (jednorazowe)
1. Upewnij się, że Railway CLI jest zainstalowane i zalogowane
2. Sprawdź że jesteś w katalogu `ptak-expo-backend`

### ⚡ Szybka synchronizacja po zmianach w bazie danych

**Krok 1: Wprowadź zmiany w pliku `src/config/database.js`**
- Dodaj nowe tabele
- Zmień strukturę istniejących tabel
- Dodaj nowe dane testowe

**Krok 2: Przetestuj lokalnie**
```bash
npm start
```

**Krok 3: Zsynchronizuj z Railway**
```bash
npm run sync-railway-db
```

### 🔧 Alternatywny sposób (bezpośredni)
```bash
node sync-railway-db.js
```

### 📊 Co robi skrypt sync-railway-db.js?

1. **Pobiera Railway database URL** - automatycznie przez Railway CLI
2. **Łączy się z Railway database** - używa PUBLIC_URL
3. **Wykonuje inicjalizację bazy** - wywołuje `initializeDatabase()`
4. **Tworzy/aktualizuje tabele** - `CREATE TABLE IF NOT EXISTS`
5. **Dodaje dane testowe** - `INSERT ... ON CONFLICT DO NOTHING`

### ✅ Oczekiwany output:
```
🚀 RAILWAY DATABASE SYNC SCRIPT
================================
🔍 Step 1: Getting Railway database URL...
✅ Railway database URL obtained
🔍 Step 2: Connecting to Railway database...
🔍 Step 3: Initializing Railway database...
🔍 Starting database initialization...
🔍 Testing database connection...
💾 Connected to PostgreSQL database
✅ Database connection test successful
🔍 Creating users table...
🔍 Creating exhibitors table...
🔍 Creating exhibitor_events table...
✅ Database tables initialized successfully
✅ SUCCESS: Railway database synchronized!
📊 All tables and data have been updated on Railway
```

### 🚨 Troubleshooting

**Problem**: Railway CLI nie jest zalogowany
**Rozwiązanie**: `railway login`

**Problem**: Brak dostępu do Backend service
**Rozwiązanie**: `railway service Backend`

**Problem**: Błąd połączenia z bazą danych
**Rozwiązanie**: Sprawdź czy Railway projekt jest aktywny

### 🔄 Workflow dla nowych tabel/pól

1. **Edytuj** `src/config/database.js`
2. **Testuj lokalnie** `npm start`
3. **Sync Railway** `npm run sync-railway-db`
4. **Commit zmiany** `git add . && git commit -m "feat: Add new database schema"`
5. **Push do main** `git push origin main`

### 📝 Automatyzacja przez Git Hook (opcjonalnie)

Dodaj do `.git/hooks/pre-push`:
```bash
#!/bin/bash
cd ptak-expo-backend
npm run sync-railway-db
```

### 🎯 Zalety tego rozwiązania:

- ✅ **Szybkie** - jedna komenda
- ✅ **Automatyczne** - nie wymaga ręcznego kopiowania URL
- ✅ **Bezpieczne** - używa istniejącej logiki inicjalizacji
- ✅ **Powtarzalne** - można uruchomić wielokrotnie
- ✅ **Logowanie** - dokładne logi co się dzieje
- ✅ **Error handling** - wyraźne komunikaty o błędach

### 📚 Przykład użycia:

```bash
# 1. Dodajesz nową tabelę 'events' do database.js
# 2. Testujesz lokalnie
npm start

# 3. Synchronizujesz z Railway
npm run sync-railway-db

# 4. Committujesz zmiany
git add .
git commit -m "feat: Add events table"
git push origin main
```

### 💡 Wskazówki:

- Uruchamiaj sync po każdej zmianie w database.js
- Skrypt jest bezpieczny - można go uruchomić wielokrotnie
- Nie nadpisuje istniejących danych (ON CONFLICT DO NOTHING)
- Automatycznie tworzy nowe tabele i pola 