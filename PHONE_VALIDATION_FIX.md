# Poprawka walidacji numeru telefonu

## Data: 2025-10-17

## Problem

Walidacja numeru telefonu nie pozwalała na dodanie międzynarodowych numerów telefonu takich jak:
- `+49 15154406216` (niemiecki z spacją)
- `+49 15154406216` (niemiecki, 13 cyfr - przekraczało poprzedni limit 12)

### Przyczyna
Regex walidacji był zbyt restrykcyjny:
```typescript
const re = /^\+?\d{9,12}$/;  // tylko 9-12 cyfr, bez spacji/myślników
```

To oznaczało:
- ❌ Brak możliwości użycia spacji, myślników, nawiasów
- ❌ Limit 12 cyfr był za mały dla niektórych numerów międzynarodowych
- ❌ Numer niemiecki `+4915154406216` ma 13 cyfr łącznie

## Rozwiązanie

### 1. Poprawiona walidacja w `/ptak-expo-frontend/src/helpers/validators.tsx`

```typescript
export const validatePhone = (phone: string): string => {
  if (!phone.trim()) return 'Telefon jest wymagany';
  
  // Normalize phone number: remove spaces, hyphens, parentheses
  const normalized = phone.trim().replace(/[\s\-()]/g, '');
  
  // Allow international format: + followed by 9-15 digits
  // Examples: +48123456789, +49151544062116, +1234567890
  const re = /^\+?\d{9,15}$/;
  
  if (!re.test(normalized))
    return 'Podaj poprawny numer telefonu (9-15 cyfr, dozwolone: +, spacje, myślniki, nawiasy)';
  
  return '';
};
```

**Zmiany:**
- ✅ Normalizacja numeru - usuwanie spacji, myślników, nawiasów przed walidacją
- ✅ Zwiększono limit cyfr z 12 do 15 (obsługa dłuższych numerów międzynarodowych)
- ✅ Zachowano elastyczność - użytkownik może wpisać `+49 151 544 06216` i przejdzie walidację

### 2. Poprawiona walidacja w `/ptak-expo-frontend/src/components/addUserModal/AddUserModalShort.tsx`

Ta sama logika została zastosowana w komponencie AddUserModalShort dla spójności.

## Obsługiwane formaty

Teraz walidacja akceptuje:
- ✅ `+48123456789` (polski, bez spacji)
- ✅ `+48 123 456 789` (polski, ze spacjami)
- ✅ `+48-123-456-789` (polski, z myślnikami)
- ✅ `+48 (123) 456-789` (polski, z nawiasami)
- ✅ `+4915154406216` (niemiecki, 13 cyfr)
- ✅ `+49 151 544 06216` (niemiecki, ze spacjami)
- ✅ `+1234567890123` (do 15 cyfr)
- ✅ `123456789` (bez prefiksu, 9-15 cyfr)

## Kompatybilność z CountryPhoneField

Komponent `CountryPhoneField` (używany w formularzach) działa następująco:
1. Użytkownik wybiera kod kraju z listy (np. DE = +49)
2. Wpisuje lokalną część numeru (np. `15154406216`)
3. Komponent łączy je automatycznie: `+4915154406216`
4. Walidacja sprawdza pełny numer po normalizacji

## Testowanie

### Test 1: Numer niemiecki
```
Prefiks: DE (+49)
Lokalny numer: 15154406216
Wynik: +4915154406216 (13 cyfr) ✅ PRZECHODZI
```

### Test 2: Numer polski ze spacjami
```
Wpisany: +48 123 456 789
Znormalizowany: +48123456789
Wynik: ✅ PRZECHODZI
```

### Test 3: Numer z myślnikami
```
Wpisany: +49-151-544-06216
Znormalizowany: +4915154406216
Wynik: ✅ PRZECHODZI
```

## Deployment

**WAŻNE:** Po wdrożeniu tej zmiany, frontend musi być przebudowany (rebuild):

```bash
cd ptak-expo-frontend
npm run build
```

Lub w środowisku developerskim:
```bash
cd ptak-expo-frontend
npm start  # z hot-reload powinno załadować nową walidację
```

## Miejsca gdzie zmieniono walidację:
1. ✅ `/ptak-expo-frontend/src/helpers/validators.tsx` - główna walidacja
2. ✅ `/ptak-expo-frontend/src/components/addUserModal/AddUserModalShort.tsx` - modal dodawania użytkownika

## Miejsca gdzie używana jest walidacja:
- `AddExhibitorModal` - dodawanie wystawcy
- `EditExhibitorModal` - edycja wystawcy
- `AddUserModalShort` - dodawanie użytkownika
- Wszystkie inne formularze używające `validatePhone` z validators.tsx

---

**Status:** ✅ Poprawione i gotowe do wdrożenia
**Wymaga:** Rebuildu frontendu po wdrożeniu

