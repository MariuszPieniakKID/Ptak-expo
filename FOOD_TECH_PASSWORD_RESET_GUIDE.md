# Masowe resetowanie haseł dla FOOD TECH EXPO

## 📋 Przegląd

Endpoint API do masowego resetowania haseł dla wszystkich wystawców przypisanych do FOOD TECH EXPO.

## 🔐 Autoryzacja

Wszystkie endpointy wymagają:
- Token JWT admina w headerze: `Authorization: Bearer <TOKEN>`
- Tylko administratorzy mogą wywołać te endpointy

## 📍 Endpointy

### 1. Podgląd wystawców (GET)

```bash
GET https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/preview
```

**Zwraca**:
- Informacje o wystawie FOOD TECH EXPO
- Listę wszystkich wystawców przypisanych do wystawy
- Weryfikację czy pieniak@gmail.com jest na liście
- Licznik wystawców

**Przykład użycia**:
```bash
curl -X GET \
  "https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/preview" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

**Przykładowa odpowiedź**:
```json
{
  "success": true,
  "exhibition": {
    "id": 18,
    "name": "FOOD TECH EXPO",
    "startDate": "2025-11-25",
    "endDate": "2025-11-27",
    "status": "planned"
  },
  "exhibitors": [
    {
      "id": 123,
      "email": "pieniak@gmail.com",
      "company_name": "MARIUSZ PIENIAK entertaiment",
      "contact_person": "Mariusz Pieniak",
      "status": "active"
    },
    // ... więcej wystawców
  ],
  "totalCount": 155,
  "verification": {
    "pieniakFound": true,
    "message": "✅ pieniak@gmail.com is on the list"
  }
}
```

---

### 2. Test - wysłanie do pieniak@gmail.com (POST)

```bash
POST https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/send-test
```

**Funkcjonalność**:
- Resetuje hasło TYLKO dla pieniak@gmail.com
- Generuje nowe hasło i hashuje przez bcrypt
- Aktualizuje bazę danych
- Wysyła email z nowym hasłem

**Przykład użycia**:
```bash
curl -X POST \
  "https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/send-test" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Przykładowa odpowiedź sukcesu**:
```json
{
  "success": true,
  "message": "Test password reset sent successfully",
  "exhibitor": {
    "email": "pieniak@gmail.com",
    "companyName": "MARIUSZ PIENIAK entertaiment"
  }
}
```

**Przykładowa odpowiedź błędu**:
```json
{
  "success": false,
  "message": "pieniak@gmail.com not found in FOOD TECH EXPO exhibitors"
}
```

---

### 3. Wysyłka do WSZYSTKICH wystawców (POST)

```bash
POST https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/send-all
```

**⚠️ UWAGA**: To resetuje hasła dla WSZYSTKICH 155 wystawców!

**Funkcjonalność**:
- Resetuje hasła dla WSZYSTKICH wystawców z FOOD TECH EXPO
- Dla każdego wystawcy:
  - Generuje nowe hasło
  - Hashuje przez bcrypt (10 salt rounds)
  - Aktualizuje w bazie `exhibitors.password_hash`
  - Wysyła email z nowym hasłem
- Rate limiting: 500ms opóźnienia między emailami
- Zwraca szczegółowy raport

**Przykład użycia**:
```bash
curl -X POST \
  "https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/send-all" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Przykładowa odpowiedź**:
```json
{
  "success": true,
  "message": "Password reset process completed",
  "summary": {
    "total": 155,
    "successful": 154,
    "failed": 1
  },
  "results": {
    "success": [
      {
        "email": "pieniak@gmail.com",
        "companyName": "MARIUSZ PIENIAK entertaiment"
      },
      {
        "email": "niklas.aminoff@gmail.com",
        "companyName": "2 fresh finland oy"
      }
      // ... więcej
    ],
    "failed": [
      {
        "email": "problem@example.com",
        "companyName": "Problem Company",
        "error": "Email delivery failed"
      }
    ]
  }
}
```

---

## 🔄 Przepływ działania (Workflow)

### Krok 1: Zaloguj się jako admin

```bash
# Zaloguj się do panelu admina
curl -X POST \
  "https://backend-production-df8c.up.railway.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin@email.com",
    "password": "your-password"
  }'
```

Skopiuj `token` z odpowiedzi.

---

### Krok 2: Sprawdź listę wystawców

```bash
curl -X GET \
  "https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/preview" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Sprawdź**:
- ✅ Czy `pieniakFound: true`
- ✅ Czy `totalCount` się zgadza (powinno być ~155)
- ✅ Czy lista wystawców wygląda poprawnie

---

### Krok 3: Wyślij TEST do pieniak@gmail.com

```bash
curl -X POST \
  "https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/send-test" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Sprawdź**:
1. Czy API zwróciło `"success": true`
2. Czy email dotarł na pieniak@gmail.com
3. Czy email zawiera nowe hasło
4. Czy można zalogować się nowym hasłem na https://wystawca.exhibitorlist.eu/login

---

### Krok 4: Wyślij do WSZYSTKICH (tylko jeśli test przeszedł!)

```bash
curl -X POST \
  "https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/send-all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

⏱️ **Czas wykonania**: ~2-3 minuty (155 wystawców × 500ms)

---

## 📧 Format emaila

Każdy wystawca otrzyma email zawierający:
- **Temat**: "PTAK WARSAW EXPO - Reset hasła"
- **Treść**:
  - Powitanie z imieniem/nazwą firmy
  - Nowe hasło w wyróżnionym bloku
  - Link do logowania: https://wystawca.exhibitorlist.eu/login
  - Zalecenie zmiany hasła po zalogowaniu
  - Informacja o kontakcie w razie problemów

---

## 🔒 Bezpieczeństwo

- ✅ Hasła są hashowane przez bcrypt (10 salt rounds)
- ✅ Tylko admini mogą wywołać endpointy
- ✅ Weryfikacja czy pieniak@gmail.com jest na liście przed wysyłką
- ✅ Rate limiting (500ms między emailami)
- ✅ Szczegółowe logi w konsoli Railway
- ✅ Raport z sukcesami i błędami

---

## 📊 Lista wystawców FOOD TECH EXPO

**Wystawa**: FOOD TECH EXPO  
**Daty**: 25-27 listopada 2025  
**Status**: planned  
**Liczba wystawców**: 155

**Weryfikacja**: ✅ pieniak@gmail.com (MARIUSZ PIENIAK entertaiment) jest na liście jako wystawca #80

Pełna lista dostępna przez endpoint `/preview`.

---

## 🐛 Rozwiązywanie problemów

### Problem: "Unauthorized" (401)
**Rozwiązanie**: Token wygasł lub jest nieprawidłowy. Zaloguj się ponownie i pobierz nowy token.

### Problem: "pieniak@gmail.com not found"
**Rozwiązanie**: Wystawca nie jest przypisany do FOOD TECH EXPO. Sprawdź przypisanie w bazie.

### Problem: "FOOD TECH EXPO exhibition not found"
**Rozwiązanie**: Sprawdź nazwę wystawy w bazie. Endpoint szuka przez LIKE '%FOOD TECH%'.

### Problem: Emaile nie docierają
**Rozwiązanie**: 
1. Sprawdź konfigurację SMTP na Railway
2. Sprawdź zmienne: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
3. Sprawdź logi Railway

---

## 📝 Notatki

- Endpoint automatycznie znajduje najnowszą wystawę z nazwą zawierającą "FOOD TECH"
- Hasła są generowane losowo (12 znaków: litery + cyfry)
- Każde hasło jest unikalne
- Stare hasła są natychmiast zastępowane nowymi
- Process nie może być cofnięty - po wysłaniu trzeba użyć nowych haseł
- Wystawcy mogą użyć funkcji "Przypomnij hasło" jeśli zgubią nowe hasło

---

## 🎯 Użycie z przeglądarki (alternatywa)

Możesz też użyć narzędzia jak Postman lub Insomnia:

1. **Import collection**:
   - Method: POST
   - URL: `https://backend-production-df8c.up.railway.app/api/v1/password-reset/food-tech/send-test`
   - Headers: 
     - `Authorization: Bearer YOUR_TOKEN`
     - `Content-Type: application/json`

2. Kliknij **Send**

3. Sprawdź response

---

## ✅ Checklist przed wysyłką do wszystkich

- [ ] Zalogowałeś się jako admin
- [ ] Sprawdziłeś preview - lista wygląda poprawnie
- [ ] pieniak@gmail.com jest na liście
- [ ] Wysłałeś test do pieniak@gmail.com
- [ ] Test email dotarł i zawiera poprawne dane
- [ ] Możesz zalogować się nowym hasłem
- [ ] Jesteś gotowy wysłać do wszystkich 155 wystawców

**Dopiero po zaznaczeniu wszystkich punktów** wywołaj `/send-all`!




