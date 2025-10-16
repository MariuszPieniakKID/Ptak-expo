# Podsumowanie zmian: Rozdzielenie "Dane kontaktowe" od "Imię i Nazwisko osoby kontaktowej"

## ✅ Zmiany zaimplementowane

### 1. Backend (ptak-expo-backend)

#### `/src/routes/catalog.js`
- ✅ **Usunięto synchronizację** `contactInfo` → `contact_person` (linie 605-621)
- ✅ **Fallback jako JSON** - gdy brak danych w katalogu, tworzy JSON z danych z tabeli `exhibitors` (linie 483-520)
- ✅ **Komentarze** wyjaśniające rozdzielenie pól

#### `/src/routes/public.js`
- ✅ **Parsowanie JSON** w dwóch miejscach (linie 405-419 i 1022-1036)
- ✅ **Kompatybilność wsteczna** - obsługa zarówno JSON jak i starych danych tekstowych
- ✅ Priorytet: dane z JSON `contact_info` → dane z tabeli `exhibitors`

### 2. Frontend Checklisty (ptak-expo-web)

#### `/src/components/checklist/CompanyInfo.tsx`
- ✅ **Podzielone pole** na trzy osobne pola:
  - "Dane kontaktowe - Osoba kontaktowa"
  - "Dane kontaktowe - Telefon"
  - "Dane kontaktowe - E-mail"
- ✅ **Zapisywanie jako JSON**: `{"person": "...", "phone": "...", "email": "..."}`
- ✅ **Kompatybilność wsteczna** - obsługa starych danych tekstowych

#### `/src/contexts/ChecklistContext.tsx`
- ✅ **Zaktualizowany licznik** - sprawdza czy wszystkie trzy pola są wypełnione
- ✅ **Kompatybilność wsteczna** dla starych danych

### 3. Panel Administracyjny (ptak-expo-frontend)

#### `/src/components/exhibitorWithEvent/ExhibitorWithEvent.tsx`
- ✅ **Nowy state** `catalogContactInfo` dla danych z katalogu
- ✅ **Parsowanie JSON** z API response (linie 175-190)
- ✅ **Priorytet danych**: contactInfo z katalogu → dane z tabeli exhibitors
- ✅ **Przekazanie do komponentu** wyświetlającego dane

## 🎯 Efekt zmian

### Przed zmianami:
```
Wystawca wypełnia "Dane kontaktowe" w checklistie
    ↓
Backend zapisuje to jako contactInfo w catalog_entries
    ↓
Backend NADPISUJE contact_person w tabeli exhibitors ❌
    ↓
"Imię i Nazwisko osoby kontaktowej" zostaje utracone ❌
```

### Po zmianach:
```
Wystawca wypełnia 3 pola w checklistie:
- Osoba kontaktowa
- Telefon  
- E-mail
    ↓
Backend zapisuje jako JSON w catalog_entries.contact_info
    ↓
contact_person w tabeli exhibitors POZOSTAJE niezmienione ✅
    ↓
Frontend pokazuje:
- W karcie wystawcy: contact_person z tabeli exhibitors
- W katalogu: contactInfo z catalog_entries (JSON)
```

## 📊 Struktura danych

### Tabela `exhibitors`:
```sql
contact_person VARCHAR(255)  -- "Jan Kowalski" (NIE zmieniane przez checklistę)
contact_role VARCHAR(100)     -- "Dyrektor sprzedaży"
phone VARCHAR(50)             -- "+48 123 456 789"
email VARCHAR(255)            -- "wystawca@firma.pl"
```

### Tabela `exhibitor_catalog_entries`:
```sql
contact_info TEXT  -- '{"person":"Piotr Nowak","phone":"+48 987 654 321","email":"kontakt@firma.pl"}'
```

## 🔄 Kompatybilność wsteczna

Wszystkie komponenty obsługują:
1. **Nowe dane** - JSON z trzema polami
2. **Stare dane** - tekstowe wartości contact_info
3. **Brak danych** - fallback na dane z tabeli exhibitors

## ✅ Testy do przeprowadzenia

### 1. Nowy wystawca
- [ ] Wypełnić 3 pola "Dane kontaktowe" w checklistie
- [ ] Zapisać i sprawdzić w bazie czy contact_info jest JSON
- [ ] Sprawdzić czy contact_person w tabeli exhibitors NIE został nadpisany
- [ ] Sprawdzić wyświetlanie w panelu admin

### 2. Istniejący wystawca (stare dane)
- [ ] Otworzyć checklistę - sprawdzić czy stare dane są widoczne
- [ ] Edytować dane kontaktowe
- [ ] Sprawdzić czy teraz są zapisane jako JSON
- [ ] Sprawdzić czy contact_person pozostał niezmieniony

### 3. Publiczny katalog
- [ ] Sprawdzić `/public/exhibitions/:id/exhibitors` - czy dane kontaktowe są poprawne
- [ ] Sprawdzić `/public/exhibitions/:id/exhibitors/:id.json` - czy kontakt jest wyświetlany

## 📝 Uwagi dla developerów

1. **Nie zmieniać** pola `contact_person` w tabeli `exhibitors` z poziomu checklisty
2. **Zawsze używać JSON** dla `contact_info` w nowych zapisach
3. **Parsować JSON** przed wyświetleniem (z obsługą błędów)
4. **Fallback** na dane z tabeli exhibitors gdy brak JSON

## 🐛 Potencjalne problemy

1. **Migracja starych danych** - stare tekstowe wartości contact_info będą działać dzięki kompatybilności wstecznej
2. **Ręczne edycje bazy** - jeśli ktoś ręcznie edytuje contact_info, musi zachować format JSON
3. **Import danych** - nowe importy powinny tworzyć contact_info jako JSON

## 📄 Dokumentacja

Pełna dokumentacja zmian: `/CONTACT_INFO_SEPARATION_CHANGES.md`

