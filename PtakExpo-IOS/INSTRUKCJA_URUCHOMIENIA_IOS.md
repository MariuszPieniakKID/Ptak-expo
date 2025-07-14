# Instrukcja uruchomienia aplikacji Ptak Expo na iPhone

## Wymagania systemowe

### Na macOS:
- **Xcode 14.0+** (z App Store)
- **Node.js 18+** (sprawdź: `node --version`)
- **CocoaPods** (instalacja: `sudo gem install cocoapods`)
- **React Native CLI** (instalacja: `npm install -g react-native-cli`)
- **iOS Simulator** (wbudowany w Xcode)

### Na iPhone:
- **iPhone z iOS 13.0+**
- **Kabel USB do podłączenia iPhone**
- **Włączony tryb Developer** na iPhone

## Krok 1: Przygotowanie środowiska

### 1.1 Instalacja Xcode
```bash
# Pobierz Xcode z App Store (darmowy)
# Uruchom Xcode i zaakceptuj licencję
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### 1.2 Instalacja CocoaPods
```bash
sudo gem install cocoapods
```

### 1.3 Sprawdzenie Node.js
```bash
node --version  # Wymagane: 18+
npm --version   # Wymagane: 8+
```

## Krok 2: Przygotowanie projektu

### 2.1 Przejdź do katalogu projektu
```bash
cd /Users/kid/Ptak-expo/PtakExpo-IOS
```

### 2.2 Instalacja zależności
```bash
npm install
```

### 2.3 Instalacja dependencji iOS
```bash
cd ios
pod install
cd ..
```

## Krok 3: Konfiguracja iPhone

### 3.1 Włączenie trybu Developer
1. Otwórz **Ustawienia** → **Ogólne** → **Informacje**
2. Kliknij **Numer kompilacji** 7 razy
3. Wprowadź kod PIN
4. Pojawi się komunikat "Jesteś teraz deweloperem!"

### 3.2 Włączenie USB Debugging
1. Otwórz **Ustawienia** → **Prywatność i bezpieczeństwo** → **Tryb dewelopera**
2. Włącz **Tryb dewelopera**
3. Podłącz iPhone kablem USB do komputera

## Krok 4: Uruchomienie aplikacji

### 4.1 Sprawdzenie dostępnych urządzeń
```bash
# Lista symulatorów iOS
xcrun simctl list devices

# Lista podłączonych urządzeń
xcrun devicectl list devices
```

### 4.2 Uruchomienie na symulatorze iOS
```bash
# Uruchom Metro bundler (w pierwszym terminalu)
npm start

# Uruchom aplikację na symulatorze (w drugim terminalu)
npm run ios
```

### 4.3 Uruchomienie na fizycznym iPhone
```bash
# Uruchom Metro bundler (w pierwszym terminalu)
npm start

# Uruchom aplikację na iPhone (w drugim terminalu)
npm run ios --device
```

**Alternatywnie przez Xcode:**
```bash
# Otwórz projekt w Xcode
open ios/PtakExpoMobile.xcworkspace

# W Xcode:
# 1. Wybierz swój iPhone z listy urządzeń
# 2. Kliknij przycisk "Run" (▶️)
```

## Krok 5: Pierwszy build i certyfikaty

### 5.1 Konfiguracja Team ID w Xcode
1. Otwórz `ios/PtakExpoMobile.xcworkspace` w Xcode
2. Wybierz projekt **PtakExpoMobile** w nawigatorze
3. W zakładce **Signing & Capabilities**:
   - Wybierz swój **Team** (Apple ID)
   - Zmień **Bundle Identifier** na unikalny (np. `com.twojename.ptakexpo`)

### 5.2 Trusted Developer na iPhone
Po pierwszym zainstalowaniu:
1. Otwórz **Ustawienia** → **Ogólne** → **Zarządzanie urządzeniami**
2. Znajdź swój Apple ID
3. Kliknij **Zaufaj "Twój Apple ID"**
4. Potwierdź **Zaufaj**

## Krok 6: Testowanie funkcjonalności

### 6.1 Dane testowe do logowania
```
Email: admin@ptakexpo.pl
Hasło: admin123
```

### 6.2 Sprawdzenie połączenia z backend
- Backend URL: `https://backend-production-df8c.up.railway.app/api/v1`
- Sprawdź czy masz połączenie z internetem
- Sprawdź czy backend jest dostępny

## Rozwiązywanie problemów

### Problem: "Command not found: pod"
```bash
sudo gem install cocoapods
```

### Problem: "Unable to boot device"
```bash
# Resetuj simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

### Problem: "No devices found"
```bash
# Sprawdź połączenie USB
# Zrestartuj iPhone
# Sprawdź czy tryb Developer jest włączony
```

### Problem: "Build failed"
```bash
# Wyczyść cache
cd ios
rm -rf build
pod install
cd ..
npm start --reset-cache
```

### Problem: "Metro bundler error"
```bash
# Wyczyść cache Metro
npm start --reset-cache
# LUB
npx react-native start --reset-cache
```

## Porady dodatkowe

### Debugowanie
1. **Chrome DevTools**: Naciśnij `Cmd+D` w symulatorze → "Debug"
2. **React Native Debugger**: Zainstaluj `react-native-debugger`
3. **Logs**: Sprawdź w terminalu Metro bundler

### Hot Reload
- Naciśnij `Cmd+D` w symulatorze
- Włącz "Fast Refresh"
- Zmiany w kodzie będą automatycznie odświeżane

### Kompilacja Release
```bash
# Kompilacja release dla testów
npm run ios --configuration Release
```

## Kontakt
W razie problemów skontaktuj się z zespołem deweloperskim.

---
*Instrukcja stworzona dla projektu Ptak Expo - aplikacja iOS* 