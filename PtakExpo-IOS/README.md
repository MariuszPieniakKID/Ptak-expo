# PTAK EXPO - Aplikacja Mobilna

Aplikacja mobilna React Native dla systemu PTAK EXPO (iOS i Android).

## 🚀 Szybki start

### Wymagania
- Node.js 16+
- React Native development environment
- **Android:** Android Studio, Android SDK
- **iOS:** Xcode (tylko na macOS)
- Backend API działający na porcie 3001

### Instalacja

```bash
# Instalacja zależności
npm install

# iOS - Instalacja podów (tylko na macOS)
cd ios
pod install
cd ..
```

### Uruchomienie

#### Android
```bash
# Uruchom emulator Android lub podłącz urządzenie
npx react-native run-android
```

#### iOS (tylko macOS)
```bash
# Uruchom symulator iOS lub podłącz urządzenie
npx react-native run-ios
```

## 🔐 Logowanie

Aplikacja używa danych testowych:
- **Email:** `test@test.com`
- **Hasło:** `test123`

## 📱 Funkcjonalności

### ✅ Zaimplementowane:
- Logowanie użytkowników
- Dashboard główny z komunikatem powitalnym
- Wylogowanie
- Responsywny design mobilny
- Obsługa iOS i Android

### 🔄 W planach:
- Zarządzanie dokumentami
- Materiały marketingowe
- System komunikatów
- Generator zaproszeń
- Push notifications

## 🗂️ Struktura projektu

```
src/
├── components/         # Komponenty wielokrotnego użytku
├── screens/           # Ekrany aplikacji
│   ├── LoginScreen.js    # Ekran logowania
│   └── DashboardScreen.js # Dashboard główny
├── contexts/          # React Contexts
│   └── AuthContext.js    # Zarządzanie stanem autoryzacji
├── navigation/        # Konfiguracja nawigacji
│   └── AppNavigation.js  # Główna nawigacja
├── services/          # Komunikacja z API
│   └── api.js           # Konfiguracja axios
└── utils/             # Funkcje pomocnicze
```

## 🎨 Technologie

- **React Native 0.80** - Framework mobilny
- **React Navigation 6** - Nawigacja
- **AsyncStorage** - Lokalne przechowywanie danych
- **Axios** - HTTP client

## 🧪 Testowanie

### Emulator Android
1. Otwórz Android Studio
2. Uruchom Android Virtual Device (AVD)
3. Wykonaj `npx react-native run-android`
4. Użyj danych testowych: test@test.com / test123

### Fizyczne urządzenie Android
1. Włącz "Opcje deweloperskie" w telefonie
2. Włącz "Debugowanie USB"
3. Podłącz telefon USB do komputera
4. Wykonaj `npx react-native run-android`
5. Zaloguj się danymi testowymi

### Symulator iOS (tylko macOS)
1. Otwórz Xcode
2. Uruchom iOS Simulator
3. Wykonaj `npx react-native run-ios`
4. Użyj danych testowych: test@test.com / test123

### Fizyczne urządzenie iOS
1. Otwórz projekt w Xcode: `xed -b ios`
2. Podłącz urządzenie iPhone/iPad
3. Wybierz urządzenie jako target
4. Kliknij "Run" w Xcode
5. Zaloguj się danymi testowymi

## 📋 Instrukcje instalacji APK/IPA

### Android APK
```bash
# Generowanie signed APK
cd android
./gradlew assembleRelease

# Plik APK zostanie utworzony w:
# android/app/build/outputs/apk/release/app-release.apk

# Instalacja na urządzeniu
adb install android/app/build/outputs/apk/release/app-release.apk
```

### iOS IPA (TestFlight)
1. Skonfiguruj Apple Developer Account
2. Otwórz projekt w Xcode
3. Archive aplikację (Product -> Archive)
4. Upload do App Store Connect
5. Dodaj testerów w TestFlight

## 🔧 Konfiguracja API

Zmień URL backendu w pliku `src/services/api.js`:

```javascript
const BASE_URL = 'http://YOUR_BACKEND_URL/api/v1';
```

**Uwaga:** Dla lokalnego testowania na fizycznym urządzeniu użyj adresu IP komputera zamiast `localhost`.

## 🛠️ Debugowanie

### React Native Debugger
```bash
# Instalacja
npm install -g react-native-debugger

# Uruchomienie
react-native-debugger
```

### Metro bundler
```bash
# Reset cache
npx react-native start --reset-cache
```

### Android logs
```bash
# Logowanie Android
npx react-native log-android
```

### iOS logs
```bash
# Logowanie iOS
npx react-native log-ios
```

## 📦 Build Release

### Android Release
```bash
cd android
./gradlew assembleRelease
```

### iOS Release
1. Otwórz projekt w Xcode
2. Wybierz "Any iOS Device"
3. Product -> Archive
4. Distribute App

## 🔄 API Integration

Aplikacja komunikuje się z backend API:
- `POST /api/v1/auth/login` - Logowanie
- `GET /api/v1/auth/verify` - Weryfikacja tokenu
- `POST /api/v1/auth/logout` - Wylogowanie

## 📋 TODO

- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Offline mode
- [ ] Dark mode support
- [ ] Internationalization (i18n)
- [ ] Performance optimization
- [ ] Unit tests
- [ ] E2E tests

## 🚨 Troubleshooting

### Metro not starting
```bash
npx react-native start --reset-cache
```

### Android build fails
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### iOS build fails
```bash
cd ios
rm -rf Pods
pod install
cd ..
npx react-native run-ios
```
