# Instrukcja testowania aplikacji Ptak Expo przez Expo Go

## Krok 1: Pobierz Expo Go na iPhone

1. Otwórz **App Store** na iPhone
2. Wyszukaj **"Expo Go"**
3. Pobierz i zainstaluj aplikację Expo Go (darmowa)

## Krok 2: Uruchom serwer Expo (już uruchomiony)

Serwer Expo development jest już uruchomiony w tle. Jeśli potrzebujesz go ponownie uruchomić:

```bash
cd /Users/kid/Ptak-expo/PtakExpoMobile
npx expo start
```

## Krok 3: Połącz się z Expo Go

### Metoda 1: QR Code
1. Otwórz aplikację **Expo Go** na iPhone
2. Kliknij **"Scan QR Code"**
3. Zeskanuj kod QR z terminala na komputerze
4. Aplikacja automatycznie się załaduje

### Metoda 2: Link URL
1. Otwórz aplikację **Expo Go** na iPhone
2. Kliknij **"Enter URL manually"**
3. Wpisz adres URL z terminala (np. `exp://192.168.1.100:8081`)
4. Kliknij **"Connect"**

### Metoda 3: Przez Safari
1. Otwórz **Safari** na iPhone
2. Wpisz adres URL z terminala
3. Kliknij link **"Open with Expo Go"**

## Krok 4: Testowanie aplikacji

### Dane testowe do logowania:
```
Email: admin@ptakexpo.pl
Hasło: admin123
```

### Funkcjonalności do przetestowania:
- ✅ Ekran logowania z walidacją
- ✅ Komunikaty błędów
- ✅ Logowanie do backend Railway
- ✅ Dashboard użytkownika
- ✅ Wylogowanie

## Krok 5: Live Reload

Aplikacja automatycznie się przeładuje po zmianie kodu:
- Zmień kod w VS Code
- Zapisz plik
- Aplikacja na iPhone automatycznie się zaktualizuje

## Rozwiązywanie problemów

### Problem: "Unable to connect to development server"
```bash
# Sprawdź adres IP komputera
ifconfig | grep "inet "

# Ponownie uruchom serwer
npx expo start --clear
```

### Problem: "Network error"
1. Upewnij się, że iPhone i komputer są w tej samej sieci WiFi
2. Sprawdź czy firewall nie blokuje portu 8081
3. Spróbuj uruchomić z opcją tunelu: `npx expo start --tunnel`

### Problem: "Expo Go crashed"
1. Zamknij i ponownie otwórz Expo Go
2. Wyczyść cache: `npx expo start --clear`
3. Sprawdź logi błędów w terminalu

## Przydatne komendy

```bash
# Uruchom z tunelem (jeśli są problemy z siecią)
npx expo start --tunnel

# Wyczyść cache
npx expo start --clear

# Sprawdź status
npx expo doctor

# Zatrzymaj serwer
Ctrl + C
```

## Zaawansowane funkcje

### Debugowanie
1. Wstrząśnij iPhone podczas działania aplikacji
2. Wybierz **"Debug Remote JS"**
3. Otwórz Chrome DevTools na komputerze

### Hot Reload
- Zapisz plik → Aplikacja automatycznie się przeładuje
- Nie musisz restartować aplikacji

### Element Inspector
1. Wstrząśnij iPhone
2. Wybierz **"Toggle Element Inspector"**
3. Dotknij elementu na ekranie żeby zobaczyć jego właściwości

---

## 🎯 Gotowe do testowania!

1. **Expo Go** zainstalowany na iPhone ✅
2. **Serwer Expo** uruchomiony ✅
3. **Aplikacja** skonfigurowana ✅
4. **Backend** połączony (Railway) ✅

**Zeskanuj kod QR lub wpisz URL z terminala i testuj aplikację!** 📱

---
*Stworzone dla projektu Ptak Expo - wersja mobilna* 