# ✅ Weryfikacja bezpieczeństwa starych danych

## Data weryfikacji: 2025-10-16

## Sprawdzone scenariusze

### ✅ Scenariusz 1: Użytkownik ma STARE DANE (string tekstowy)

**Przykład**: `contact_info = "Jan Kowalski"`

**Przepływ:**
1. ✅ **GET /api/v1/catalog/:exhibitionId** → Backend zwraca `contact_info: "Jan Kowalski"`
2. ✅ **getChecklist()** → Przypisuje do `ExampleChecklist.companyInfo.contactInfo = "Jan Kowalski"`
3. ✅ **CompanyInfo.tsx** → Wykrywa że to string (nie JSON) → `isOldFormat = true`
4. ✅ **Formularz** → Pokazuje JEDNO pole "Dane kontaktowe" z wartością "Jan Kowalski"
5. ✅ **Edycja** → Użytkownik może edytować jako string
6. ✅ **Zapis** → Frontend wysyła `contactInfo: "Jan Kowalski"` (lub zmodyfikowany string)
7. ✅ **Backend** → Zapisuje dokładnie ten string bez konwersji

**Rezultat**: Stare dane ZACHOWANE jako string ✅

---

### ✅ Scenariusz 2: Użytkownik ma NOWE DANE (JSON)

**Przykład**: `contact_info = '{"person":"Piotr Nowak","phone":"+48 123","email":"p@firma.pl"}'`

**Przepływ:**
1. ✅ **GET** → Backend zwraca JSON string
2. ✅ **getChecklist()** → Przypisuje do contactInfo (jako string)
3. ✅ **CompanyInfo.tsx** → Parsuje JSON → `isOldFormat = false`
4. ✅ **Formularz** → Pokazuje TRZY pola (person, phone, email)
5. ✅ **Edycja** → Użytkownik edytuje dowolne pole
6. ✅ **Zapis** → Frontend wysyła `contactInfo: '{"person":"...","phone":"...","email":"..."}'`
7. ✅ **Backend** → Zapisuje JSON string

**Rezultat**: Nowe dane zapisane jako JSON ✅

---

### ✅ Scenariusz 3: NOWY użytkownik (brak danych)

**Przykład**: `contact_info = null`

**Przepływ:**
1. ✅ **GET** → Backend zwraca `contact_info: null`
2. ✅ **getChecklist()** → Przypisuje `contactInfo = null`
3. ✅ **CompanyInfo.tsx** → Parsuje null → `contactData = {person:'',phone:'',email:''}`
4. ✅ **Formularz** → Pokazuje TRZY puste pola
5. ✅ **Wypełnienie** → Użytkownik wypełnia pola
6. ✅ **Zapis** → Frontend wysyła JSON
7. ✅ **Backend** → Zapisuje JSON

**Rezultat**: Nowe dane zapisane jako JSON ✅

---

### ✅ Scenariusz 4: Użytkownik KASUJE dane

**Przepływ:**
1. Użytkownik ma dane (string lub JSON)
2. Otwiera formularz
3. **Kasuje zawartość pola/pól**
4. Zapisuje
5. Frontend wysyła:
   - Dla starych danych: `contactInfo: ""` (pusty string)
   - Dla nowych danych: `contactInfo: '{"person":"","phone":"","email":""}'`
6. Backend zapisuje pusty string lub pusty JSON

**Rezultat**: To jest ŚWIADOMA akcja użytkownika - OK ✅

---

## Kluczowe poprawki wprowadzone

### 🔧 Poprawka 1: CompanyInfo.tsx (linie 525-579)
**Problem**: Automatyczna konwersja starych danych na JSON z pustymi polami

**Rozwiązanie**: 
```typescript
// Wykryj czy stare dane (string) czy nowe (JSON)
if (isOldFormat) {
  // Pokaż jedno pole, zachowaj string
  return <StringEdit name="Dane kontaktowe" value={contactInfo} ... />
} else {
  // Pokaż 3 pola, zapisuj jako JSON
  return <>{3 pola}</>
}
```

### 🔧 Poprawka 2: checkListApi.ts (linia 179)
**Problem**: contactInfo NIE było pobierane z API - dane ginęły!

**Rozwiązanie**:
```typescript
contactInfo: d.contact_info ?? ExampleChecklist.companyInfo.contactInfo
```

---

## Backend - punkty weryfikacji

### ✅ GET /api/v1/catalog/:exhibitionId (catalog.js:420-528)
- Zwraca `contact_info` dokładnie z bazy
- Fallback tworzy JSON z danych exhibitors (tylko gdy brak danych w katalogu)
- **NIE MODYFIKUJE** istniejących danych

### ✅ POST /api/v1/catalog/:exhibitionId (catalog.js:531-628)
- Zapisuje `contact_info = $7` gdzie $7 to wartość z frontendu
- **NIE KONWERTUJE**, nie zmienia formatu
- Usunięta synchronizacja do `contact_person` - dane exhibitors **NIE SĄ NADPISYWANE**

### ✅ GET /public/exhibitions/:id/exhibitors (public.js:291-445)
- Parsuje JSON jeśli możliwe, fallback na string
- **TYLKO ODCZYT** - nie modyfikuje danych

### ✅ GET /public/exhibitions/:id/exhibitors/:id.json (public.js:857-1056)
- Parsuje JSON jeśli możliwe, fallback na string
- **TYLKO ODCZYT** - nie modyfikuje danych

---

## Frontend - punkty weryfikacji

### ✅ ptak-expo-frontend/ExhibitorWithEvent.tsx
- **TYLKO ODCZYT** - pobiera i wyświetla dane
- Parsuje JSON jeśli możliwe, fallback na dane z exhibitors
- **NIE ZAPISUJE** nic

### ✅ ptak-expo-web/ChecklistContext.tsx
- Licznik wypełnionych pól:
  - Dla JSON: sprawdza czy wszystkie 3 pola wypełnione
  - Dla string: sprawdza czy niepusty
- **NIE MODYFIKUJE** danych

---

## Podsumowanie bezpieczeństwa

| Operacja | Stare dane (string) | Nowe dane (JSON) | Status |
|----------|-------------------|------------------|--------|
| Pobranie z API | Zwraca string | Zwraca JSON string | ✅ |
| Wyświetlenie w formularzu | 1 pole multiline | 3 pola osobne | ✅ |
| Edycja | Zapisuje jako string | Zapisuje jako JSON | ✅ |
| Zapis do bazy | String bez zmian | JSON bez zmian | ✅ |
| Licznik wypełnienia | Sprawdza czy niepusty | Sprawdza 3 pola | ✅ |
| Odczyt w panelu admin | Parsuje lub fallback | Parsuje JSON | ✅ |
| API publiczne | Parsuje lub fallback | Parsuje JSON | ✅ |

## ⚠️ Jedyne ryzyko

**Użytkownik świadomie kasuje dane** - to jest zamierzone działanie, nie bug.

## 🎯 Wnioski

✅ **Stare dane są w pełni bezpieczne**
✅ **Nie ma automatycznej konwersji**
✅ **Nie ma nadpisywania danych**
✅ **Kompatybilność wsteczna działa**
✅ **Nowe dane zapisywane jako JSON**

