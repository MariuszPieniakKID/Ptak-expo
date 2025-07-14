# Instrukcja Testów Aplikacji Mobilnej Ptak-expo

## 🚀 Aplikacja Gotowa do Testów!

Aplikacja mobilna Ptak-expo jest gotowa do testów na urządzeniach mobilnych za pomocą Expo Go.

## 📱 Testowanie przez Expo Go

### Krok 1: Pobierz Expo Go
- **iOS**: Pobierz z App Store: [Expo Go](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: Pobierz z Google Play: [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Krok 2: Skanuj Kod QR
Otwórz aplikację Expo Go i zeskanuj poniższy kod QR:

```
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █ ██▀▀█▄▄██ ▄▄▄▄▄ █
█ █   █ █  ▀█ ▀█ ▄█ █   █ █
█ █▄▄▄█ █▀  █▄ ▀▄██ █▄▄▄█ █
█▄▄▄▄▄▄▄█▄█ ▀▄█ ▀ █▄▄▄▄▄▄▄█
█ ▄█▀  ▄▀▀█▄█▄█▄▀▄██ ▀▄▄ ▄█
█▀ ▄█▄█▄▄▄ ▄█▀█▀ ▀▀ █▄  ▀██
█  ▀▄█ ▄ ▄█▀▄ ▀▄▀▄▀▄▀▀▄ ▀██
███▀▄█ ▄▀▀█  ▄██▄▄▄█▄▀ ▀███
█▄▄▄▄▄▄▄█ ▄▄▀▀█▄▄ ▄▄▄ ▀ ▄▄█
█ ▄▄▄▄▄ █▀▀▀ █▄█▀ █▄█ ▀▀▀▀█
█ █   █ █▄▄▀ ▀█▄█▄▄ ▄▄▀ ▀▀█
█ █▄▄▄█ █▀▄█ ███▄██▄▀█▀▀ ██
█▄▄▄▄▄▄▄█▄█▄███▄████▄▄▄▄▄▄█
```

**Lub wprowadź ręcznie URL:**
```
exp://192.168.100.190:8081
```

### Krok 3: Przetestuj Aplikację
Po uruchomieniu aplikacji w Expo Go, przetestuj:

1. **Ekran Logowania**:
   - Walidację emaila i hasła
   - Komunikaty błędów w języku polskim
   - Przycisk "Zaloguj się"

2. **Integrację z Railway Backend**:
   - Logowanie z prawdziwymi danymi z bazy danych
   - Backend URL: `https://backend-production-df8c.up.railway.app/api/v1`

3. **Funkcjonalności**:
   - Persystencja sesji (AsyncStorage)
   - Automatyczne wylogowanie przy błędach 401
   - Obsługa błędów połączenia

## 🔧 Dane Testowe

Aplikacja łączy się z prawdziwym backendem Railway, więc używaj:
- **Email**: Prawdziwy email użytkownika w bazie danych
- **Hasło**: Prawdziwe hasło użytkownika

## 🌐 Architektura

- **Frontend**: React Native + Expo
- **Backend**: https://backend-production-df8c.up.railway.app
- **Baza danych**: PostgreSQL na Railway
- **Autoryzacja**: JWT tokens w AsyncStorage

## 📊 Status Deploymentu

- ✅ **Kod wypchnięty na GitHub**: https://github.com/MariuszPieniakKID/Ptak-expo
- ✅ **Backend działający na Railway**: https://backend-production-df8c.up.railway.app
- ✅ **API skonfigurowane w aplikacji mobilnej**
- ✅ **Expo Go gotowe do testów**

## 🚨 Rozwiązywanie Problemów

### Problem: Aplikacja nie może się połączyć
- Sprawdź czy urządzenie jest w tej samej sieci WiFi
- Sprawdź czy serwer Expo jest uruchomiony (port 8081)

### Problem: Błąd logowania
- Sprawdź czy backend Railway jest dostępny
- Sprawdź czy używasz prawdziwych danych z bazy danych

### Problem: Błąd ładowania assetów
- Pliki graficzne zostały przemianowane na prostsze nazwy
- Background: `background.png`
- Logo: `logo.png`

## 📞 Kontakt

W razie problemów z testami, skontaktuj się z deweloperem z informacjami o:
- Typ urządzenia (iOS/Android)
- Wersja Expo Go
- Komunikat błędu (jeśli występuje)

---

**Ostatnia aktualizacja**: 14 lipca 2025, 21:40
**Commit**: 1b53a41 - Fix mobile app asset loading and prepare for Railway deployment 