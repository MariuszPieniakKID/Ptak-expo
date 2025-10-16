# Rozdzielenie "Dane kontaktowe" od "Imię i Nazwisko osoby kontaktowej"

## Data: 2025-10-16

## Problem
Wcześniej pole "Dane kontaktowe" z checklisty targowej w `ptak-expo-web` nadpisywało pole "Imię i Nazwisko osoby kontaktowej" w tabeli `exhibitors`. To powodowało utratę danych o osobie kontaktowej wystawcy.

## Rozwiązanie
Rozdzielenie tych dwóch pól, aby były przechowywane i wyświetlane oddzielnie:

### 1. Backend (`ptak-expo-backend`)
**Plik:** `src/routes/catalog.js`

- **Zmiana (linie 605-621):** Usunięto synchronizację `contactInfo` → `contact_person`
- `contactInfo` z checklisty jest teraz przechowywane TYLKO w tabeli `exhibitor_catalog_entries` jako JSON
- `contact_person` w tabeli `exhibitors` pozostaje niezmienione i nie jest nadpisywane

```javascript
// PRZED (błąd - nadpisywało contact_person):
await db.query(
  `UPDATE exhibitors SET 
     company_name = COALESCE($1, company_name),
     contact_person = COALESCE($2, contact_person),  // <- BŁĄD!
     email = COALESCE($3, email)
   WHERE id = $4`,
  [name, contactInfo, contactEmail, exhibitorId]
);

// PO (poprawione):
await db.query(
  `UPDATE exhibitors SET 
     company_name = COALESCE($1, company_name),
     email = COALESCE($2, email)
   WHERE id = $3`,
  [name, contactEmail, exhibitorId]
);
```

### 2. Frontend Checklisty (`ptak-expo-web`)

**Plik:** `src/components/checklist/CompanyInfo.tsx`

- **Zmiana (linie 524-565):** Pole "Dane kontaktowe" zostało podzielone na trzy osobne pola:
  - "Dane kontaktowe - Osoba kontaktowa"
  - "Dane kontaktowe - Telefon"
  - "Dane kontaktowe - E-mail"
- Dane są przechowywane jako JSON: `{"person": "...", "phone": "...", "email": "..."}`
- Zapewniona kompatybilność wsteczna z istniejącymi danymi tekstowymi

**Plik:** `src/contexts/ChecklistContext.tsx`

- **Zmiana (linie 45-68):** Zaktualizowano licznik wypełnionych pól
- Sprawdza czy wszystkie trzy pola w `contactInfo` są wypełnione (person, phone, email)
- Kompatybilność wsteczna z danymi tekstowymi

### 3. Panel Administracyjny (`ptak-expo-frontend`)

**Plik:** `src/components/exhibitorWithEvent/ExhibitorWithEvent.tsx`

- **Zmiana (linie 42-75):** Funkcja `buildItems` akceptuje teraz `catalogContactInfo`
- **Zmiana (linie 127):** Dodano state dla `catalogContactInfo`
- **Zmiana (linie 175-190):** Parsowanie `contact_info` z API jako JSON
- **Zmiana (linia 279):** Przekazanie `catalogContactInfo` do `buildItems`

**Logika wyświetlania:**
1. Jeśli `contactInfo` z katalogu jest dostępne (JSON z person/phone/email) → użyj tych danych
2. W przeciwnym razie → użyj danych z tabeli `exhibitors` (contact_person/phone/email)

## Struktura danych

### W bazie danych:

**Tabela `exhibitors`:**
- `contact_person` - Imię i Nazwisko osoby kontaktowej (nie zmieniane przez checklistę)
- `contact_role` - Rola w organizacji
- `phone` - Telefon wystawcy
- `email` - E-mail wystawcy

**Tabela `exhibitor_catalog_entries`:**
- `contact_info` - Dane kontaktowe z checklisty (JSON):
  ```json
  {
    "person": "Jan Kowalski",
    "phone": "+48 123 456 789",
    "email": "jan.kowalski@firma.pl"
  }
  ```

## Kompatybilność wsteczna

- Istniejące dane tekstowe w `contact_info` są obsługiwane
- W `ptak-expo-web`: jeśli `contactInfo` jest stringiem, zostanie użyty jako wartość pola "person"
- W `ptak-expo-frontend`: jeśli parsowanie JSON się nie powiedzie, używane są dane z tabeli `exhibitors`

## Testowanie

### Scenariusze do przetestowania:

1. **Nowy wystawca:**
   - Wypełnić "Dane kontaktowe" w checklisty (3 pola)
   - Sprawdzić czy dane są zapisane jako JSON
   - Sprawdzić czy "Imię i Nazwisko osoby kontaktowej" w panelu admin pozostaje niezmienione

2. **Istniejący wystawca z danymi tekstowymi:**
   - Sprawdzić czy stare dane tekstowe są wyświetlane
   - Edytować dane kontaktowe w checklisty
   - Sprawdzić czy dane są teraz zapisane jako JSON

3. **Wyświetlanie w panelu admin:**
   - Sprawdzić czy dane kontaktowe z katalogu są wyświetlane w "Wpis do katalogu targowego"
   - Sprawdzić czy "Imię i Nazwisko osoby kontaktowej" jest wyświetlane prawidłowo w karcie wystawcy

## Pliki zmodyfikowane

1. `/ptak-expo-backend/src/routes/catalog.js` - usunięcie synchronizacji contactInfo → contact_person, fallback jako JSON
2. `/ptak-expo-backend/src/routes/public.js` - parsowanie contact_info jako JSON w publicznym API
3. `/ptak-expo-web/src/components/checklist/CompanyInfo.tsx` - podzielenie pola na trzy osobne pola
4. `/ptak-expo-web/src/contexts/ChecklistContext.tsx` - aktualizacja licznika wypełnionych pól
5. `/ptak-expo-frontend/src/components/exhibitorWithEvent/ExhibitorWithEvent.tsx` - użycie contactInfo z katalogu

## Uwagi

- Dane "Imię i Nazwisko osoby kontaktowej" w tabeli `exhibitors` **NIE** są nadpisywane przez dane z checklisty
- Dane "Dane kontaktowe" z checklisty są przechowywane oddzielnie w tabeli `exhibitor_catalog_entries` jako JSON
- W panelu administracyjnym priorytet mają dane z katalogu, z fallbackiem na dane z tabeli `exhibitors`

