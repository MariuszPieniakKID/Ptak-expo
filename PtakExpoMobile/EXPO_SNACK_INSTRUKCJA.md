# 📱 EXPO SNACK - INSTRUKCJA KONFIGURACJI

## 🚀 Krok Po Kroku - Uruchomienie Aplikacji w Expo Go

### 1. **Otwórz Expo Snack**
- Idź na: **https://snack.expo.dev/**
- Kliknij **"Create a new snack"**

### 2. **Utwórz Projekt**
- **Nazwa**: `Ptak Expo Mobile`
- **Typ**: Wybierz **"Blank"** (JavaScript)
- Kliknij **"Create Snack"**

### 3. **Dodaj Dependencies**
Kliknij przycisk **"Add dependencies"** (ikona `+` po lewej stronie) i dodaj:

```
@react-native-async-storage/async-storage
@react-navigation/native
@react-navigation/native-stack
axios
react-native-safe-area-context
react-native-screens
```

**Jak dodać:**
1. Kliknij **"Add dependencies"**
2. Wpisz każdą dependency z listy wyżej
3. Kliknij **"Add"** dla każdej
4. Poczekaj aż wszystkie się zainstalują

### 4. **Zastąp App.js**
1. Usuń całą zawartość pliku **App.js**
2. Skopiuj kod z pliku **EXPO_SNACK_APP.js**
3. Wklej do **App.js** w Expo Snack

### 5. **Konfiguracja Backend**
Kod jest już skonfigurowany do połączenia z Railway:
```javascript
const BASE_URL = 'https://backend-production-df8c.up.railway.app/api/v1';
```

### 6. **Testowanie**
- Kliknij **"Run"** w Expo Snack
- Sprawdź czy aplikacja się buduje (po prawej stronie)
- Jeśli są błędy, sprawdź czy wszystkie dependencies są zainstalowane

### 7. **Generowanie QR Kodu**
Po uruchomieniu aplikacji:
1. **QR kod pojawi się automatycznie** w prawym panelu
2. Kliknij **"My device"** w prawym dolnym rogu
3. **QR kod będzie widoczny** do skanowania

---

## 📱 Testowanie w Expo Go

### 1. **Zainstaluj Expo Go**
- **iOS**: https://apps.apple.com/app/expo-go/id982107779
- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent

### 2. **Skanuj QR Kod**
- Otwórz **Expo Go**
- Kliknij **"Scan QR code"**
- Zeskanuj kod z Expo Snack

### 3. **Testuj Aplikację**
- **Email**: `test@test.com`
- **Hasło**: `test123`
- Sprawdź logowanie i dashboard

---

## 🔧 Rozwiązywanie Problemów

### Problem: Dependencies nie instalują się
**Rozwiązanie:**
1. Odśwież stronę Expo Snack
2. Spróbuj dodać dependencies ponownie
3. Sprawdź czy nazwa jest poprawna

### Problem: QR kod nie pojawia się
**Rozwiązanie:**
1. Sprawdź czy aplikacja się buduje (brak błędów)
2. Kliknij **"My device"** w prawym dolnym rogu
3. Odśwież stronę

### Problem: Aplikacja nie łączy się z backend
**Rozwiązanie:**
1. Sprawdź czy Railway backend działa: https://backend-production-df8c.up.railway.app/api/v1/auth/test
2. Sprawdź internet na telefonie
3. Sprawdź console w Expo Snack

### Problem: Błąd w kodzie
**Rozwiązanie:**
1. Sprawdź czy skopiowałeś cały kod
2. Sprawdź czy wszystkie dependencies są zainstalowane
3. Sprawdź console pod kodem (czerwone błędy)

---

## 📋 Checklist Konfiguracji

- [ ] Expo Snack otwarty
- [ ] Projekt utworzony
- [ ] Wszystkie dependencies dodane:
  - [ ] @react-native-async-storage/async-storage
  - [ ] @react-navigation/native
  - [ ] @react-navigation/native-stack
  - [ ] axios
  - [ ] react-native-safe-area-context
  - [ ] react-native-screens
- [ ] Kod skopiowany do App.js
- [ ] Aplikacja buduje się bez błędów
- [ ] QR kod jest widoczny
- [ ] Expo Go zainstalowane na telefonie
- [ ] Aplikacja testowana na telefonie

---

## 🎯 Dane Testowe

**Backend**: https://backend-production-df8c.up.railway.app/api/v1

**Login testowy:**
- **Email**: `test@test.com`
- **Hasło**: `test123`

**Testuj:**
- ✅ Logowanie
- ✅ Dashboard
- ✅ Wylogowanie
- ✅ Persystencja sesji

---

## 📞 Udostępnianie Testerom

### Opcja 1: Link do Expo Snack
Po stworzeniu projektu, skopiuj link z paska adresu:
```
https://snack.expo.dev/@yourusername/ptak-expo-mobile
```

### Opcja 2: QR kod
1. Zrób screenshot QR kodu z Expo Snack
2. Udostępnij obraz testerom
3. Poinstruuj jak skanować w Expo Go

### Opcja 3: Embed
Expo Snack pozwala na embed na stronie:
```html
<iframe src="https://snack.expo.dev/@yourusername/ptak-expo-mobile" 
        width="100%" height="600px"></iframe>
```

---

## ✅ Gotowe!

Aplikacja jest gotowa do testowania w Expo Go!

**QR kod będzie dostępny globalnie** - testerzy mogą skanować go z dowolnego miejsca na świecie i aplikacja będzie działać z połączeniem do Railway backend.

---

**Sukces!** 🎉 Aplikacja działa w Expo Go z Railway backend! 