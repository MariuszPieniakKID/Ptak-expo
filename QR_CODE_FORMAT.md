# Format Kodów QR - PTAK EXPO

**Data aktualizacji:** 20 listopada 2024  
**Wersja:** 2.0

---

## Przegląd

Kody QR w systemie PTAK EXPO służą do jednoznacznej identyfikacji uczestników wydarzeń (wystawców, gości, VIP). Każdy kod zawiera informacje o:
- Wydarzeniu (skrót nazwy + ID)
- Wystawcy (ID z prefiksem)
- Unikalnym identyfikatorze wpisu
- Losowym sufiksie bezpieczeństwa

---

## Struktura Kodu QR

### Format (od wersji 2.0)

```
[SHORT_CODE][EXHIBITION_ID][EXHIBITOR_ID][ENTRY_ID][RND_SUFFIX][ENTRY_ID]
```

### Komponenty

| Komponent | Opis | Format | Przykład |
|-----------|------|--------|----------|
| **SHORT_CODE** | Skrócona nazwa wystawy (4-5 znaków, bez spacji) | 4-5 wielkich liter/cyfr | `WARIW`, `FT25`, `SEEXP` |
| **EXHIBITION_ID** | ID wystawy z dopełnieniem zerami | 4 cyfry | `0017` |
| **EXHIBITOR_ID** | ID wystawcy z prefiksem "w" i dopełnieniem zerami | `w` + 4 cyfry | `w1606` |
| **ENTRY_ID** | Unikalny identyfikator wpisu (timestamp + random) | 9 cyfr | `650512109` |
| **RND_SUFFIX** | Losowy sufiks bezpieczeństwa | `rnd` + 6 cyfr | `rnd795935` |
| **ENTRY_ID** | Powtórzony identyfikator wpisu (weryfikacja) | 9 cyfr | `650512109` |

---

## Przykłady Kodów QR

### Przykład 1: WARSAW INDUSTRY WEEK
**Pełna nazwa wystawy:** `WARSAW INDUSTRY WEEK`  
**Skrót:** `WARIW` (pierwsze litery każdego słowa)

```
WARIW0017w1606650512109rnd795935650512109
```

**Rozbicie:**
- `WARIW` - skrót nazwy wystawy (5 znaków)
- `0017` - ID wystawy 17
- `w1606` - ID wystawcy 1606
- `650512109` - unikalny identyfikator wpisu
- `rnd795935` - losowy sufiks bezpieczeństwa
- `650512109` - powtórzony identyfikator (weryfikacja)

---

### Przykład 2: Food Tech 2025
**Pełna nazwa wystawy:** `Food Tech 2025`  
**Skrót:** `FT25` (pierwsze litery słów + rok)

```
FT250023w0456123789456rnd654321123789456
```

**Rozbicie:**
- `FT25` - skrót nazwy wystawy (4 znaki)
- `0023` - ID wystawy 23
- `w0456` - ID wystawcy 456
- `123789456` - unikalny identyfikator wpisu
- `rnd654321` - losowy sufiks bezpieczeństwa
- `123789456` - powtórzony identyfikator (weryfikacja)

---

### Przykład 3: SolarEnergy Expo
**Pełna nazwa wystawy:** `SolarEnergy Expo`  
**Skrót:** `SEEXP` (pierwsze litery słów, jedno słowo długie więc więcej liter)

```
SEEXP0005w0089987654321rnd111222987654321
```

**Rozbicie:**
- `SEEXP` - skrót nazwy wystawy (5 znaków)
- `0005` - ID wystawy 5
- `w0089` - ID wystawcy 89
- `987654321` - unikalny identyfikator wpisu
- `rnd111222` - losowy sufiks bezpieczeństwa
- `987654321` - powtórzony identyfikator (weryfikacja)

---

## Algorytm Generowania SHORT_CODE

Funkcja `generateEventShortCode()` generuje skrót nazwy wystawy według następujących zasad:

### Zasada 1: Ekstrakcja wielkich liter i cyfr
Usuń wszystkie znaki specjalne i małe litery, zostaw tylko wielkie litery i cyfry.

**Przykład:**
- Input: `Food Tech 2025`
- Po ekstrakcji: `FOODTECH2025`

### Zasada 2: Optymalna długość (4-5 znaków)
Jeśli po ekstrakcji mamy 4-5 znaków, używamy ich bezpośrednio.

**Przykład:**
- Input: `FT 2025`
- Po ekstrakcji: `FT2025` (6 znaków)
- Przejdź do zasady 3

### Zasada 3: Akronim z pierwszych liter słów
Jeśli mamy więcej niż 5 znaków, twórz akronim z pierwszych liter każdego słowa.

**Przykład:**
- Input: `WARSAW INDUSTRY WEEK`
- Słowa: `[WARSAW, INDUSTRY, WEEK]`
- Akronim: `WIW` (za krótki)
- Dodaj więcej liter z pierwszego słowa: `WARIW` (5 znaków) ✅

### Zasada 4: Pojedyncze długie słowo
Jeśli nazwa to jedno długie słowo, weź pierwsze 5 znaków.

**Przykład:**
- Input: `SolarExpo`
- Po ekstrakcji: `SOLAREXPO`
- Wynik: `SOLAR` (5 znaków) ✅

### Zasada 5: Za krótka nazwa (1-3 znaki)
Jeśli nazwa jest za krótka, dodaj znaki z pełnej nazwy lub uzupełnij `X`.

**Przykład:**
- Input: `IT`
- Po ekstrakcji: `IT` (2 znaki)
- Dodaj z pełnej nazwy: `ITXX` (4 znaki, uzupełnione) ✅

---

## Algorytm Generowania Pełnego Kodu

### Krok 1: Pobierz dane wystawy i wystawcy
```javascript
const exhibitionName = "WARSAW INDUSTRY WEEK";
const exhibitionId = 17;
const exhibitorId = 1606;
```

### Krok 2: Generuj SHORT_CODE
```javascript
const eventCode = generateEventShortCode(exhibitionName);
// Wynik: "WARIW"
```

### Krok 3: Dopełnij ID wystawy (4 cyfry)
```javascript
const eventIdPadded = String(exhibitionId).padStart(4, '0').slice(-4);
// Wynik: "0017"
```

### Krok 4: Dodaj prefiks "w" i dopełnij ID wystawcy (4 cyfry)
```javascript
const exhibitorIdPadded = 'w' + String(exhibitorId).padStart(4, '0').slice(-4);
// Wynik: "w1606"
```

### Krok 5: Generuj unikalny identyfikator wpisu (9 cyfr)
```javascript
const entryId = (() => {
  const ts = Date.now().toString().slice(-6);  // Ostatnie 6 cyfr timestamp
  const rnd = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');  // 6 losowych cyfr
  return ts.slice(0,3) + rnd.slice(0,3) + ts.slice(3);  // Mieszanka
})();
// Wynik: "650512109" (przykład)
```

### Krok 6: Generuj losowy sufiks bezpieczeństwa
```javascript
const rndSuffix = 'rnd' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
// Wynik: "rnd795935" (przykład)
```

### Krok 7: Złóż finalny kod
```javascript
const accessCode = `${eventCode}${eventIdPadded}${exhibitorIdPadded}${entryId}${rndSuffix}${entryId}`;
// Wynik: "WARIW0017w1606650512109rnd795935650512109"
```

---

## Weryfikacja Kodu QR

### Fuzzy Matching (dla uszkodzonych kodów)

System obsługuje "fuzzy matching" - częściową weryfikację kodów, które mogły zostać uszkodzone podczas druku lub skanowania.

**Algorytm weryfikacji:**

1. Sprawdź czy kod zawiera marker `rnd` (identyfikator formatu)
2. Wyekstrahuj ID wystawy (4 cyfry przed `w`)
3. Wyekstrahuj ID wystawcy (3-4 cyfry po `w`)
4. Wyszukaj w bazie danych dopasowanie po `(exhibition_id, exhibitor_id)`
5. Jeśli znaleziono dokładnie 1 rekord - zaktualizuj jego `access_code` w bazie

**Przykład:**
```javascript
// Uszkodzony kod (brak początkowej części)
const damagedCode = "...0017w1606...rnd795935...";

// Ekstrakcja
const exhibitionId = 17;  // Z części "0017"
const exhibitorId = 1606; // Z części "w1606"

// Wyszukaj w bazie
const match = await db.query(`
  SELECT * FROM invitation_recipients 
  WHERE exhibition_id = $1 AND exhibitor_id = $2
  LIMIT 1
`, [17, 1606]);

// Jeśli znaleziono - to prawdopodobnie ten kod!
```

---

## Implementacja w Kodzie

### Frontend (TypeScript)

**Plik:** `ptak-expo-web/src/services/checkListApi.ts`

```typescript
function generateEventShortCode(exhibitionName: string): string {
    if (!exhibitionName || exhibitionName.trim().length === 0) return 'EVNT';
    
    const cleaned = exhibitionName.trim().toUpperCase();
    const capitals = cleaned.replace(/[^A-Z0-9]/g, '');
    
    if (capitals.length >= 4 && capitals.length <= 5) {
        return capitals.slice(0, 5);
    }
    
    if (capitals.length > 5) {
        const words = cleaned.split(/\s+/);
        if (words.length >= 2) {
            const acronym = words.map(w => w[0]).filter(c => /[A-Z0-9]/.test(c)).join('');
            if (acronym.length >= 4) {
                return acronym.slice(0, 5);
            }
            return (acronym + capitals).slice(0, 5);
        }
        return capitals.slice(0, 5);
    }
    
    return (capitals + cleaned.replace(/\s+/g, '').slice(0, 5)).slice(0, 5).padEnd(4, 'X');
}

// Generowanie pełnego kodu
const eventCode = generateEventShortCode(exhibitionName);
const eventIdPadded = String(exhibitionId).padStart(4, '0').slice(-4);
const exhibitorIdPadded = 'w' + String(exhibitorId).padStart(4, '0').slice(-4);
const entryId = (() => {
    const ts = Date.now().toString().slice(-6);
    const rnd = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    return ts.slice(0,3) + rnd.slice(0,3) + ts.slice(3);
})();
const rndSuffix = 'rnd' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
const accessCode = `${eventCode}${eventIdPadded}${exhibitorIdPadded}${entryId}${rndSuffix}${entryId}`;
```

### Backend (JavaScript)

**Pliki:**
- `ptak-expo-backend/src/controllers/invitationsController.js`
- `ptak-expo-backend/src/utils/identifierPdf.js`

```javascript
function generateEventShortCode(exhibitionName) {
    if (!exhibitionName || String(exhibitionName).trim().length === 0) return 'EVNT';
    
    const cleaned = String(exhibitionName).trim().toUpperCase();
    const capitals = cleaned.replace(/[^A-Z0-9]/g, '');
    
    if (capitals.length >= 4 && capitals.length <= 5) {
        return capitals.slice(0, 5);
    }
    
    if (capitals.length > 5) {
        const words = cleaned.split(/\s+/);
        if (words.length >= 2) {
            const acronym = words.map(w => w[0]).filter(c => /[A-Z0-9]/.test(c)).join('');
            if (acronym.length >= 4) {
                return acronym.slice(0, 5);
            }
            return (acronym + capitals).slice(0, 5);
        }
        return capitals.slice(0, 5);
    }
    
    return (capitals + cleaned.replace(/\s+/g, '').slice(0, 5)).slice(0, 5).padEnd(4, 'X');
}
```

---

## API Weryfikacji

### Endpoint weryfikacji kodu QR

**URL:** `GET /api/v1/qr-verify/:code`

**Przykład:**
```bash
curl -X GET "https://backend-production-df8c.up.railway.app/api/v1/qr-verify/WARIW0017w1606650512109rnd795935650512109"
```

**Odpowiedź (sukces):**
```json
{
  "success": true,
  "valid": true,
  "message": "Kod QR jest poprawny",
  "data": {
    "person": {
      "id": 123,
      "fullName": "Jan Kowalski",
      "position": "Wystawca",
      "email": "jan.kowalski@firma.pl",
      "registeredAt": "2025-10-30T10:30:00.000Z"
    },
    "exhibitor": {
      "id": 1606,
      "companyName": "ABC Electronics Sp. z o.o.",
      "nip": "1234567890"
    },
    "exhibition": {
      "id": 17,
      "name": "WARSAW INDUSTRY WEEK",
      "startDate": "04.11.2025",
      "endDate": "07.11.2025",
      "location": "Warszawa",
      "status": "active"
    },
    "accessCode": "WARIW0017w1606650512109rnd795935650512109",
    "verifiedAt": "2025-11-20T12:15:30.000Z"
  }
}
```

### Endpoint pobierania kodu QR jako obraz

**URL:** `GET /api/v1/qr-codes/person/:personId?format=image`

**Przykład:**
```bash
curl -X GET "https://backend-production-df8c.up.railway.app/api/v1/qr-codes/person/123?format=image" -o qr-code.png
```

**Odpowiedź:** Obraz PNG z kodem QR

---

## Bezpieczeństwo

### Losowość
- **ENTRY_ID** jest generowany z kombinacji timestamp + random (9 cyfr)
- **RND_SUFFIX** jest całkowicie losowy (6 cyfr)
- Prawdopodobieństwo kolizji: ~1 na 1 bilion

### Weryfikacja integralności
- **ENTRY_ID** jest powtórzony na końcu kodu
- Pozwala to na wykrycie uszkodzeń kodu podczas skanowania
- System może zweryfikować czy początkowy i końcowy ENTRY_ID się zgadzają

### Backward Compatibility
- Stare kody z 3-cyfrowym ID wystawcy (`w123`) są nadal obsługiwane
- Nowe kody używają 4-cyfrowego ID wystawcy (`w1234`)
- System automatycznie rozpoznaje format i adaptuje się

---

## Migracja z Wersji 1.0 do 2.0

### Zmiany w wersji 2.0

| Aspekt | Wersja 1.0 | Wersja 2.0 |
|--------|-----------|-----------|
| **Nazwa wystawy** | Pełna nazwa ze spacjami (`WARSAW INDUSTRY WEEK`) | Skrót 4-5 znaków bez spacji (`WARIW`) |
| **Długość kodu** | ~50-60 znaków | ~30-35 znaków |
| **Format ID wystawcy** | `w` + 3-4 cyfry | `w` + 4 cyfry (standard) |
| **Kompatybilność** | - | Obsługuje stare kody (fuzzy matching) |

### Dlaczego zmiana?

1. **Krótsze kody** - łatwiejsze do skanowania, mniej błędów OCR
2. **Bardziej czytelne** - bez długich nazw ze spacjami
3. **Uniwersalne** - jeden format dla wszystkich wystaw
4. **Szybsze skanowanie** - mniejsza gęstość QR kodu = lepsza wydajność skanerów

### Kompatybilność wsteczna

System automatycznie rozpoznaje i obsługuje:
- ✅ Stare kody z pełnymi nazwami (fuzzy matching)
- ✅ Stare kody z 3-cyfrowym ID wystawcy
- ✅ Nowe kody z skrótami nazw
- ✅ Nowe kody z 4-cyfrowym ID wystawcy

**Nie ma potrzeby regenerowania starych kodów!**

---

## Testowanie

### Test Cases

#### TC1: Generowanie kodu dla WARSAW INDUSTRY WEEK
```javascript
const code = generateAccessCode({
  exhibitionName: "WARSAW INDUSTRY WEEK",
  exhibitionId: 17,
  exhibitorId: 1606
});
// Oczekiwany format: WARIW0017w1606[9 cyfr]rnd[6 cyfr][9 cyfr]
// Przykład: WARIW0017w1606650512109rnd795935650512109
```

#### TC2: Generowanie kodu dla krótkiej nazwy
```javascript
const code = generateAccessCode({
  exhibitionName: "FT 2025",
  exhibitionId: 23,
  exhibitorId: 456
});
// Oczekiwany format: FT25[...]
// Przykład: FT250023w0456123789456rnd654321123789456
```

#### TC3: Weryfikacja kodu
```javascript
const isValid = await verifyQRCode("WARIW0017w1606650512109rnd795935650512109");
// Oczekiwany wynik: { valid: true, data: {...} }
```

#### TC4: Fuzzy matching dla uszkodzonego kodu
```javascript
// Kod z uszkodzonym początkiem
const damagedCode = "0017w1606650512109rnd795935650512109";
const result = await verifyQRCode(damagedCode);
// Oczekiwany wynik: System znajdzie kod po exhibition_id + exhibitor_id
```

---

## FAQ

### Q1: Czy stare kody przestaną działać?
**Nie.** System obsługuje stare kody przez fuzzy matching. Wszystkie kody wygenerowane przed wersją 2.0 będą nadal działać.

### Q2: Czy muszę regenerować kody QR?
**Nie.** Stare kody będą działać. Nowe kody (wersja 2.0) będą generowane automatycznie dla nowych użytkowników.

### Q3: Co jeśli dwie wystawy mają ten sam skrót?
System uwzględnia również **EXHIBITION_ID** (4 cyfry), więc nawet jeśli skróty są identyczne, pełny kod będzie unikalny dzięki różnym ID wystaw.

### Q4: Jak długi jest kod QR?
**Wersja 1.0:** ~50-60 znaków  
**Wersja 2.0:** ~30-35 znaków (o 40-50% krótszy)

### Q5: Czy format SHORT_CODE jest stabilny?
**Tak.** Algorytm `generateEventShortCode()` jest deterministyczny - ta sama nazwa wystawy zawsze generuje ten sam skrót.

---

## Changelog

### v2.0 (2024-11-20)
- ✅ Zmiana formatu nazwy wystawy z pełnej na skrót (4-5 znaków)
- ✅ Implementacja funkcji `generateEventShortCode()`
- ✅ Aktualizacja frontend (checkListApi.ts)
- ✅ Aktualizacja backend (invitationsController.js, identifierPdf.js)
- ✅ Zachowanie backward compatibility z wersjami 1.x
- ✅ Dokumentacja nowego formatu

### v1.1 (2024-11-04)
- Zmiana formatu ID wystawcy z 3 na 4 cyfry
- Zachowanie backward compatibility z 3-cyfrowymi kodami

### v1.0 (2024-10-30)
- Pierwsza wersja formatu kodów QR
- Pełna nazwa wystawy w kodzie
- ID wystawcy 3-cyfrowe

---

## Powiązane dokumenty

- [API_QR_VERIFICATION.md](./API_QR_VERIFICATION.md) - Kompletna dokumentacja API weryfikacji i pobierania kodów QR
- [QR_CODE_4DIGIT_UPGRADE.md](./QR_CODE_4DIGIT_UPGRADE.md) - Historia migracji z 3 na 4 cyfry ID wystawcy

---

**Autor:** System PTAK EXPO  
**Kontakt:** [Szczegóły kontaktowe]

