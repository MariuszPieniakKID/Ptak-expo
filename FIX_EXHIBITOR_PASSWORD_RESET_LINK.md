# Poprawka: Link do panelu wystawcy w emailu resetującym hasło

## Data: 2025-10-16

## Problem
Gdy admin wysyłał nowe hasło do wystawcy z karty wystawcy (przycisk "wyślij nowe hasło"), email zawierał link do panelu admina (`admin.exhibitorlist.eu`) zamiast do panelu wystawcy (`wystawca.exhibitorlist.eu`).

## Rozwiązanie

### 1. Backend - emailService.js
**Plik:** `/ptak-expo-backend/src/utils/emailService.js`

Dodano opcjonalny parametr `customLoginUrl` do funkcji `sendPasswordResetEmail`:

```javascript
// Przed:
const sendPasswordResetEmail = async (userEmail, firstName, lastName, newPassword) => {
  // ... używał stałego FRONTEND_URL

// Po:
const sendPasswordResetEmail = async (userEmail, firstName, lastName, newPassword, customLoginUrl = null) => {
  const loginUrl = customLoginUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
  // ... używa loginUrl w emailu
```

### 2. Backend - exhibitors.js
**Plik:** `/ptak-expo-backend/src/routes/exhibitors.js`

Endpoint `/api/v1/exhibitors/:id/reset-password` przekazuje teraz URL panelu wystawcy:

```javascript
// Przed:
const emailResult = await sendPasswordResetEmail(exhibitor.email, first, last, newPassword);

// Po:
const exhibitorPanelUrl = `${process.env.EXHIBITOR_PANEL_URL || 'https://wystawca.exhibitorlist.eu'}/login`;
const emailResult = await sendPasswordResetEmail(exhibitor.email, first, last, newPassword, exhibitorPanelUrl);
```

## Zmienione miejsca

### ✅ Zmienione
- **Endpoint:** `POST /api/v1/exhibitors/:id/reset-password` (admin resetuje hasło wystawcy)
- **Źródło:** Karta wystawcy w panelu admin → przycisk "wyślij nowe hasło"
- **Link w emailu:** Teraz `https://wystawca.exhibitorlist.eu/login` ✅

### ✅ Nie zmienione (prawidłowo)
- **Endpoint:** `POST /api/v1/users/:id/reset-password` (admin resetuje hasło użytkownika)
- **Źródło:** Panel użytkowników → przycisk "Wyślij nowe hasło"
- **Link w emailu:** Nadal `FRONTEND_URL` (panel admin) ✅

## Zmienna środowiskowa

Używana zmienna: `EXHIBITOR_PANEL_URL`
- **Domyślna wartość:** `https://wystawca.exhibitorlist.eu`
- **Użycie w innych miejscach:** 
  - Przypomnienie o uzupełnieniu katalogu (linia 1190 w exhibitors.js)
  - Wysyłanie zaproszeń (linia 384 w exhibitors.js)

## Wpływ na inne funkcjonalności

| Funkcjonalność | Wpływ | Status |
|---------------|-------|--------|
| Reset hasła użytkownika (admin) | Brak wpływu | ✅ OK |
| Reset hasła wystawcy (admin) | Zmieniony link na portal wystawcy | ✅ OK |
| Przypomnienie o katalogu | Brak wpływu (już używał EXHIBITOR_PANEL_URL) | ✅ OK |
| Zaproszenia wystawców | Brak wpływu (już używał EXHIBITOR_PANEL_URL) | ✅ OK |

## Testowanie

### Scenariusz testowy:
1. Admin otwiera kartę wystawcy w panelu admin
2. Klika przycisk "wyślij nowe hasło"
3. Wystawca otrzymuje email z nowym hasłem
4. **Sprawdzić:** Link w emailu powinien prowadzić do `wystawca.exhibitorlist.eu/login`

### Oczekiwany rezultat:
- ✅ Email zawiera link do portalu wystawcy
- ✅ Wystawca może zalogować się na swoim portalu
- ✅ Reset hasła dla użytkowników admina nadal działa poprawnie

## Pliki zmodyfikowane

1. `/ptak-expo-backend/src/utils/emailService.js` - dodano parametr customLoginUrl
2. `/ptak-expo-backend/src/routes/exhibitors.js` - przekazywanie URL portalu wystawcy

## Uwagi

- Zmiana jest **backwards compatible** - jeśli customLoginUrl nie zostanie przekazany, funkcja użyje domyślnego FRONTEND_URL
- Nie wpływa na reset hasła użytkowników admina (users.js)
- Używa już istniejącej zmiennej środowiskowej EXHIBITOR_PANEL_URL

