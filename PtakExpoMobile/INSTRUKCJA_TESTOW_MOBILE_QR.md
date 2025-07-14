# 📱 INSTRUKCJA TESTÓW APLIKACJI MOBILNEJ - QR CODE

## 🚀 Testowanie Aplikacji Ptak Expo Mobile

**Aplikacja jest już dostępna na Railway i gotowa do testowania!**

---

## 📲 KROK 1: Skanuj Kod QR

### Zeskanuj poniższy kod QR swoim telefonem:

```
████ ▄▄▄▄▄ █▀█ █▄█▄▄▄▄ ▄▄▄▄▄ ████
████ █   █ █▀▀▀█ ▀▄▀▄▄█ █   █ ████
████ █▄▄▄█ █▀ █▀▀▀█▄▄▄▄ █▄▄▄█ ████
████▄▄▄▄▄▄▄█ ▀▄▀ ▀▄▀ █▄▄▄▄▄▄▄████
████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄████
████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄████
████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄████
████ ▄▄▄▄▄ █▄▄▄▄▄▄▄▄▄▄ ▄▄▄▄▄ ████
████ █   █ █▄▄▄▄▄▄▄▄▄▄ █   █ ████
████ █▄▄▄█ █▄▄▄▄▄▄▄▄▄▄ █▄▄▄█ ████
████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄████
```

### Lub wejdź bezpośrednio na adres:
**https://ptak-mobile-production.up.railway.app**

---

## 📱 KROK 2: Jak Skanować Kod QR

### Na iPhone:
1. Otwórz aplikację **Kamera**
2. Skieruj kamerę na kod QR
3. Pojawi się powiadomienie - **kliknij je**
4. Aplikacja otworzy się w Safari

### Na Android:
1. Otwórz aplikację **Kamera** lub **Google Lens**
2. Skieruj kamerę na kod QR
3. Kliknij na wyskakujący link
4. Aplikacja otworzy się w Chrome

### Alternatywnie:
- Użyj aplikacji **QR Scanner** z Google Play/App Store
- Wpisz adres URL bezpośrednio w przeglądarce

---

## 🔑 KROK 3: Dane Testowe

### Logowanie do aplikacji:

**Email**: `test@test.com`  
**Hasło**: `test123`

*(Dane testowe są dostępne na backend endpoincie: /api/v1/auth/test)*

---

## ✅ KROK 4: Co Testować?

### 1. **Ekran Logowania**
- [ ] Czy formularz logowania się wyświetla poprawnie?
- [ ] Czy pola Email i Hasło działają?
- [ ] Czy walidacja działa przy błędnych danych?

### 2. **Logowanie**
- [ ] Czy logowanie z poprawnymi danymi działa?
- [ ] Czy pojawia się odpowiedni komunikat przy błędnych danych?
- [ ] Czy aplikacja zapamięta logowanie?

### 3. **Dashboard**
- [ ] Czy po zalogowaniu pojawia się dashboard?
- [ ] Czy wszystkie elementy się wyświetlają poprawnie?
- [ ] Czy nawigacja działa płynnie?

### 4. **Responsywność**
- [ ] Czy aplikacja dobrze wygląda na telefonie?
- [ ] Czy elementy są odpowiednio skalowane?
- [ ] Czy można łatwo klikać przyciski?

### 5. **Wydajność**
- [ ] Czy aplikacja ładuje się szybko?
- [ ] Czy przejścia między ekranami są płynne?
- [ ] Czy nie ma długich opóźnień?

---

## 🔧 KROK 5: Problemy i Rozwiązania

### Problem: Kod QR nie skanuje się
**Rozwiązanie**: 
- Sprawdź oświetlenie
- Przybliż/oddal telefon
- Wpisz adres URL ręcznie

### Problem: Aplikacja się nie ładuje
**Rozwiązanie**:
- Sprawdź połączenie internetowe
- Odśwież przeglądarkę (pociągnij w dół)
- Wyczyść cache przeglądarki

### Problem: Nie mogę się zalogować
**Rozwiązanie**:
- Upewnij się, że używasz poprawnych danych testowych
- Sprawdź czy nie ma literówek w email/haśle
- Sprawdź połączenie internetowe

### Problem: Aplikacja działa wolno
**Rozwiązanie**:
- Sprawdź połączenie Wi-Fi/LTE
- Zamknij inne aplikacje
- Odśwież przeglądarkę

---

## 📊 KROK 6: Zgłaszanie Problemów

### Jeśli znajdziesz problem, zgłoś go podając:

1. **Urządzenie**: iPhone/Android + model
2. **Przeglądarka**: Safari/Chrome/Firefox
3. **Problem**: Opisz dokładnie co się dzieje
4. **Kroki**: Jak odtworzyć problem
5. **Screenshot**: Jeśli możliwe, zrób zrzut ekranu

### Przykład zgłoszenia:
```
Urządzenie: iPhone 14 Pro
Przeglądarka: Safari
Problem: Przycisk "Zaloguj" nie działa
Kroki: 1. Otwórz aplikację, 2. Wpisz dane, 3. Kliknij "Zaloguj"
```

---

## 🌐 Informacje Techniczne

### Aplikacja:
- **URL**: https://ptak-mobile-production.up.railway.app
- **Typ**: Progressive Web App (PWA)
- **Backend**: https://backend-production-df8c.up.railway.app
- **Hosting**: Railway.app

### Kompatybilność:
- ✅ **iOS**: Safari, Chrome, Firefox
- ✅ **Android**: Chrome, Firefox, Samsung Internet
- ✅ **Desktop**: Chrome, Firefox, Safari, Edge

### Funkcje:
- ✅ **Responsywny design**
- ✅ **Offline basic support**
- ✅ **Bezpieczne HTTPS**
- ✅ **Szybkie ładowanie**

---

## 🎯 Cel Testów

Celem testów jest sprawdzenie czy aplikacja:
- Działa poprawnie na różnych urządzeniach
- Jest intuicyjna w użyciu
- Ładuje się szybko
- Nie ma błędów krytycznych

---

## 📞 Kontakt

Jeśli masz pytania lub problemy:
- **Email**: test@ptak.com
- **Slack**: #ptak-mobile-testing
- **Telefon**: +48 XXX XXX XXX

---

**Dziękujemy za testowanie aplikacji Ptak Expo Mobile!** 🚀

---
**Wersja**: 1.0  
**Data**: 14 lipca 2025  
**Status**: Gotowe do testowania na Railway 