# Instrukcja Testów Aplikacji Mobilnej Ptak-expo

## 🚀 Aplikacja Dostępna Publicznie na Railway!

Aplikacja mobilna Ptak-expo została skonfigurowana do deploymentu na Railway i jest dostępna jako PWA (Progressive Web App) dla wszystkich użytkowników.

## 🌐 Dostęp do Aplikacji

### Opcja 1: Bezpośredni dostęp przez przeglądarkę
Po wdrożeniu na Railway aplikacja będzie dostępna pod adresem:
```
https://ptak-expo-mobile-web-production.up.railway.app
```

### Opcja 2: Testowanie lokalnie
Jeśli chcesz testować lokalnie, zobacz sekcję "Testowanie Lokalne" poniżej.

## 📱 Funkcjonalności

### Dostępne przez przeglądarkę:
- ✅ **Pełny ekran logowania** z walidacją
- ✅ **Integracja z Railway Backend** 
- ✅ **Responsywny design** dla urządzeń mobilnych
- ✅ **PWA support** - można zainstalować jako app na telefonie
- ✅ **Persystencja sesji** (localStorage)

### Bezpieczeństwo:
- ✅ **HTTPS** na Railway
- ✅ **CORS** skonfigurowane
- ✅ **Health check** endpoint: `/api/health`

## 🔧 Dane Testowe

Aplikacja łączy się z prawdziwym backendem Railway:
- **Backend URL**: `https://backend-production-df8c.up.railway.app/api/v1`
- **Email**: Prawdziwy email użytkownika w bazie danych
- **Hasło**: Prawdziwe hasło użytkownika

## 🏗️ Architektura Railway

```
Frontend Mobile Web (Railway)
│
├── Express 4.x Server
├── React Native Web Build
├── Static Assets (PNG, JS, CSS)
│
└── API Calls to Backend
    │
    └── Backend (Railway)
        │
        └── PostgreSQL Database
```

## 📊 Status Deploymentu

- ✅ **Kod wypchnięty na GitHub**: https://github.com/MariuszPieniakKID/Ptak-expo
- ✅ **Railway.toml skonfigurowany**
- ✅ **Express server gotowy**
- ✅ **Web build automatyczny**
- ✅ **Health check endpoint**
- ✅ **Production ready**

## 🔗 Linki

- **GitHub Repository**: https://github.com/MariuszPieniakKID/Ptak-expo
- **Backend API**: https://backend-production-df8c.up.railway.app
- **Mobile Web App**: https://ptak-expo-mobile-web-production.up.railway.app
- **Health Check**: https://ptak-expo-mobile-web-production.up.railway.app/api/health

## 📞 Testowanie Lokalne

Jeśli chcesz testować lokalnie:

```bash
# Sklonuj repository
git clone https://github.com/MariuszPieniakKID/Ptak-expo.git
cd Ptak-expo/PtakExpoMobile

# Zainstaluj zależności
npm install

# Zbuduj aplikację web
npm run build

# Uruchom serwer
npm start
```

Aplikacja będzie dostępna na `http://localhost:3000`

## 🚨 Rozwiązywanie Problemów

### Problem: Aplikacja nie ładuje się
- Sprawdź czy Railway deployment jest aktywny
- Sprawdź health check endpoint
- Sprawdź console przeglądarki

### Problem: Błąd logowania
- Sprawdź czy backend Railway jest dostępny
- Sprawdź Network tab w przeglądarce
- Sprawdź czy używasz prawdziwych danych

### Problem: Błąd CORS
- Aplikacja jest skonfigurowana z właściwymi headerami CORS
- Sprawdź czy backend akceptuje requests z frontend domeny

## 🎯 Następne Kroki

1. **Deploy na Railway**: Po stworzeniu Railway projektu
2. **Konfiguracja domeny**: Opcjonalnie dodaj custom domain
3. **Monitoring**: Sprawdź logi i metryki na Railway
4. **Aktualizacje**: Automatyczne deploymenty z GitHub

---

**Ostatnia aktualizacja**: 14 lipca 2025, 21:53
**Commit**: ee543c5 - Configure Railway deployment for mobile web app
**Status**: Gotowe do Railway deployment 