# 📱 Instrukcja Testowania Aplikacji Mobilnych PTAK EXPO

Szczegółowa instrukcja testowania funkcjonalności logowania w aplikacjach mobilnych na platformach Android i iOS.

## 📋 Wymagania Wstępne

### Ogólne:
- Node.js 16+ zainstalowany
- Backend API uruchomiony na `http://localhost:3001`
- Projekt aplikacji mobilnej pobrany i zależności zainstalowane (`npm install`)

### Android:
- Android Studio zainstalowane
- Android SDK skonfigurowane
- Emulator Android lub fizyczne urządzenie Android

### iOS:
- macOS
- Xcode zainstalowane
- iOS Simulator lub fizyczne urządzenie iOS
- Apple Developer Account (dla fizycznych urządzeń)

---

## 🤖 Testowanie na Android

### Opcja 1: Emulator Android Studio

#### Krok 1: Przygotowanie emulatora
1. Otwórz **Android Studio**
2. Przejdź do **Tools** → **AVD Manager**
3. Kliknij **Create Virtual Device**
4. Wybierz urządzenie (np. **Pixel 6**)
5. Wybierz wersję systemu (zalecane **API 30+**)
6. Kliknij **Finish** i uruchom emulator

#### Krok 2: Uruchomienie aplikacji
```bash
# Z katalogu głównego projektu
cd PtakExpoMobile

# Uruchomienie aplikacji na emulatorze
npx react-native run-android
```

#### Krok 3: Testowanie logowania
1. Aplikacja powinna automatycznie otworzyć się na emulatorze
2. Zobaczysz ekran logowania z logo **PTAK EXPO**
3. Wprowadź dane testowe:
   - **Email:** `test@test.com`
   - **Hasło:** `test123`
4. Kliknij **"Zaloguj się"**
5. **Oczekiwany rezultat:** Przekierowanie na dashboard z komunikatem **"Witaj w aplikacji PTAK EXPO"**

### Opcja 2: Fizyczne urządzenie Android

#### Krok 1: Przygotowanie urządzenia
1. Na urządzeniu Android przejdź do **Ustawienia** → **O telefonie**
2. Klikaj **Numer kompilacji** 7 razy, aby włączyć **Opcje deweloperskie**
3. Wróć do **Ustawienia** → **Opcje deweloperskie**
4. Włącz **Debugowanie USB**
5. Podłącz telefon do komputera kablem USB

#### Krok 2: Weryfikacja połączenia
```bash
# Sprawdź czy urządzenie jest wykryte
adb devices
# Powinno pokazać Twoje urządzenie
```

#### Krok 3: Uruchomienie aplikacji
```bash
cd PtakExpoMobile
npx react-native run-android
```

#### Krok 4: Testowanie logowania
1. Aplikacja automatycznie zainstaluje się i uruchomi na telefonie
2. Wprowadź dane testowe: `test@test.com` / `test123`
3. Sprawdź czy wyświetla się komunikat powitalny

### Opcja 3: Instalacja z pliku APK

#### Generowanie APK:
```bash
cd PtakExpoMobile/android
./gradlew assembleRelease
```

#### Lokalizacja pliku APK:
```
PtakExpoMobile/android/app/build/outputs/apk/release/app-release.apk
```

#### Instalacja na urządzeniu:
```bash
# Przez ADB
adb install android/app/build/outputs/apk/release/app-release.apk

# Lub skopiuj plik APK na telefon i zainstaluj ręcznie
```

---

## 🍎 Testowanie na iOS

### Opcja 1: Symulator Xcode

#### Krok 1: Instalacja podów (jednorazowo)
```bash
cd PtakExpoMobile/ios
pod install
cd ..
```

#### Krok 2: Uruchomienie na symulatorze
```bash
# Uruchomienie domyślnego symulatora
npx react-native run-ios

# Lub wybór konkretnego symulatora
npx react-native run-ios --simulator="iPhone 14"
```

#### Krok 3: Testowanie logowania
1. Symulator iOS otworzy się automatycznie z aplikacją
2. Zobaczysz ekran logowania PTAK EXPO
3. Wprowadź dane: `test@test.com` / `test123`
4. Sprawdź komunikat powitalny na dashboardzie

### Opcja 2: Fizyczne urządzenie iOS

#### Krok 1: Konfiguracja projektu w Xcode
```bash
# Otwórz projekt w Xcode
cd PtakExpoMobile
xed -b ios
```

#### Krok 2: Konfiguracja urządzenia
1. W Xcode przejdź do **Product** → **Destination**
2. Wybierz swoje podłączone urządzenie iOS
3. W sekcji **Signing & Capabilities**:
   - Wybierz swój **Team** (Apple Developer Account)
   - Sprawdź **Bundle Identifier** (musi być unikalny)

#### Krok 3: Uruchomienie na urządzeniu
1. Kliknij przycisk **Run (▶️)** w Xcode
2. Aplikacja zostanie zainstalowana na urządzeniu
3. **Pierwsze uruchomienie:** Na urządzeniu przejdź do **Ustawienia** → **Ogólne** → **Zarządzanie urządzeniami** i zweryfikuj aplikację

#### Krok 4: Testowanie logowania
1. Uruchom aplikację na urządzeniu
2. Wprowadź dane testowe
3. Sprawdź działanie logowania

### Opcja 3: TestFlight

#### Krok 1: Archive aplikacji
1. W Xcode wybierz **Product** → **Archive**
2. Po zakończeniu kliknij **Distribute App**
3. Wybierz **App Store Connect**
4. Upload do App Store Connect

#### Krok 2: Konfiguracja w App Store Connect
1. Zaloguj się do [App Store Connect](https://appstoreconnect.apple.com)
2. Dodaj aplikację do TestFlight
3. Dodaj testerów (email adresy)

#### Krok 3: Testowanie przez TestFlight
1. Testerzy otrzymają zaproszenie email
2. Pobranie aplikacji TestFlight
3. Instalacja aplikacji PTAK EXPO przez TestFlight
4. Testowanie funkcjonalności logowania

---

## ✅ Scenariusz Testowy Logowania

### Test Case 1: Pomyślne logowanie
**Kroki:**
1. Uruchom aplikację
2. Wprowadź email: `test@test.com`
3. Wprowadź hasło: `test123`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- ✅ Przekierowanie na dashboard
- ✅ Wyświetlenie komunikatu "Witaj w aplikacji PTAK EXPO"
- ✅ Wyświetlenie danych użytkownika testowego
- ✅ Dostęp do menu głównego

### Test Case 2: Nieprawidłowe dane
**Kroki:**
1. Wprowadź nieprawidłowy email
2. Wprowadź nieprawidłowe hasło
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- ✅ Wyświetlenie komunikatu błędu
- ✅ Pozostanie na ekranie logowania

### Test Case 3: Wylogowanie
**Kroki:**
1. Po zalogowaniu kliknij przycisk "Wyloguj"
2. Potwierdź wylogowanie

**Oczekiwany rezultat:**
- ✅ Powrót do ekranu logowania
- ✅ Wyczyszczenie danych użytkownika

---

## 🐛 Rozwiązywanie Problemów

### Android:

#### Metro bundler nie startuje:
```bash
npx react-native start --reset-cache
```

#### Build fails:
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

#### Urządzenie nie zostaje wykryte:
```bash
adb kill-server
adb start-server
adb devices
```

### iOS:

#### CocoaPods issues:
```bash
cd ios
rm -rf Pods
pod install --repo-update
cd ..
```

#### Build fails:
```bash
# Wyczyść build cache w Xcode
Product → Clean Build Folder
```

#### Simulator nie startuje:
```bash
# Reset symulatora
npx react-native run-ios --reset-cache
```

---

## 📊 Checklist Testowy

### Pre-test:
- [ ] Backend API działa (`http://localhost:3001/api/v1/health`)
- [ ] Aplikacja mobilna została zbudowana bez błędów
- [ ] Emulator/urządzenie jest gotowy

### Test logowania:
- [ ] Formularz logowania wyświetla się poprawnie
- [ ] Pola input działają (email, hasło)
- [ ] Przycisk "Użyj danych testowych" działa
- [ ] Logowanie z poprawnymi danymi przekierowuje na dashboard
- [ ] Komunikat "Witaj w aplikacji PTAK EXPO" jest widoczny
- [ ] Wylogowanie działa poprawnie

### Post-test:
- [ ] Aplikacja nie crashuje
- [ ] Nawigacja działa płynnie  
- [ ] Performance jest zadowalający

---

## 📞 Wsparcie

W przypadku problemów:
1. Sprawdź logi w terminalu
2. Sprawdź czy backend API odpowiada
3. Sprawdź połączenie sieciowe (localhost vs IP dla fizycznych urządzeń)
4. Sprawdź dokumentację React Native

---

**Powodzenia w testowaniu aplikacji PTAK EXPO! 🚀** 