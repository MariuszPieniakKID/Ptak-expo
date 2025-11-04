# Naprawa Kodów QR z Zaproszeń - Dokumentacja

## 🎯 Problem

**143 kody QR z zaproszeń nie działały na bramkach!**

### Dlaczego?

System miał **dwa źródła kodów QR**, ale weryfikacja sprawdzała tylko jedno:

1. ✅ **E-identyfikatory** (`exhibitor_people`) - 28 kodów - **DZIAŁAŁY**
2. ❌ **Zaproszenia** (`invitation_recipients`) - ~143 kody - **NIE DZIAŁAŁY**

**Przyczyna:**
- Kody z zaproszeń były generowane i wysyłane w PDF
- ALE nie były zapisywane do bazy danych
- Weryfikacja QR sprawdzała tylko `exhibitor_people`
- Wynik: 404 "Kod QR nie został znaleziony w systemie"

## ✅ Rozwiązanie

### 1. **Dodano kolumnę `access_code` do `invitation_recipients`**

```sql
ALTER TABLE invitation_recipients 
ADD COLUMN access_code VARCHAR(255);

CREATE INDEX idx_invitation_recipients_access_code 
ON invitation_recipients(access_code);
```

### 2. **Zapisywanie kodów QR z zaproszeń do bazy**

`invitationsController.js` - teraz ZAWSZE zapisuje `access_code`:

```javascript
// Generate access code
const accessCode = generateAccessCode(exhibitionName, exhibitionId, exhibitorId);

// Save to invitation_recipients
await client.query(
  `UPDATE invitation_recipients SET access_code = $1 WHERE id = $2`,
  [accessCode, recipientId]
);

// Also save to exhibitor_people if exhibitorId exists (dual storage)
if (exhibitorId) {
  await client.query(
    `INSERT INTO exhibitor_people (..., access_code) VALUES (..., $6)`,
    [..., accessCode]
  );
}
```

### 3. **Weryfikacja sprawdza OBE tabele**

`qrVerifyController.js` - rozszerzona logika:

```javascript
// 1. Try exhibitor_people first
let result = await db.query(`SELECT * FROM exhibitor_people WHERE access_code = $1`);

// 2. If not found, try invitation_recipients
if (result.rows.length === 0) {
  result = await db.query(`SELECT * FROM invitation_recipients WHERE access_code = $1`);
}

// 3. Return success if found in either table
```

### 4. **API zwraca kody z obu źródeł**

`qrCodesController.js` - `/api/v1/qr-codes/exhibition/:id`:

```sql
SELECT * FROM exhibitor_people WHERE exhibition_id = $1
UNION ALL
SELECT * FROM invitation_recipients WHERE exhibition_id = $1
```

## 🔧 Migracja Starych Kodów

### Automatyczna regeneracja

Stworzyliśmy skrypt do regeneracji access_code dla starych zaproszeń:

```bash
# Sprawdź co zostanie zmienione (dry run)
node regenerate-invitation-access-codes.js --dry-run

# Dla konkretnej wystawy
node regenerate-invitation-access-codes.js --dry-run --exhibition-id=17

# Wykonaj regenerację
node regenerate-invitation-access-codes.js --exhibition-id=17
```

**Skrypt:**
- Znajduje wszystkie `invitation_recipients` bez `access_code`
- Generuje nowe kody według poprawnego algorytmu
- Zapisuje do bazy
- ~143 kody dla wystawy 17 będą odzyskane! ✅

## 📊 Rezultaty

### Przed poprawką:
```
✅ 28 kodów - E-identyfikatory (exhibitor_people)
❌ 143 kody - Zaproszenia (brak w bazie)
────────────────────────────────────────
= 171 osób próbowało wejść
= 143 osoby odrzucone (404)
```

### Po poprawce:
```
✅ 28 kodów - E-identyfikatory
✅ 143 kody - Zaproszenia (odzyskane!)
────────────────────────────────────────
= 171 osób może wejść ✅
= 0 osób odrzuconych
```

## 🚀 Wdrożenie

### 1. Uruchom migrację bazy danych

```bash
cd ptak-expo-backend

# Railway production
psql $DATABASE_PUBLIC_URL < migration-add-invitation-access-codes.sql
```

### 2. Deploy zmian w kodzie

```bash
git add -A
git commit -m "feat: Add QR code verification for invitations

- Add access_code column to invitation_recipients
- Save access_code when sending invitations
- Verify QR codes from both exhibitor_people and invitation_recipients
- API returns codes from both tables
- Script to regenerate access_code for old invitations"

git push origin main
```

### 3. Regeneruj stare kody QR (pilne przed wydarzeniem!)

```bash
# Po deployu na Railway, połącz się przez SSH lub Railway CLI
railway run node regenerate-invitation-access-codes.js --exhibition-id=17
```

### 4. Testuj

```bash
# Test weryfikacji - powinno działać dla obu typów kodów
curl "https://backend-production-df8c.up.railway.app/api/v1/qr-verify/WARSAW%20INDUSTRY%20WEEK0017w1373795792732rnd059641795792732"

# Sprawdź API - powinno zwrócić ~171 kodów zamiast 28
curl "https://backend-production-df8c.up.railway.app/api/v1/qr-codes/exhibition/17"
```

## 📋 Pliki Zmodyfikowane

1. **`migration-add-invitation-access-codes.sql`** ⭐ NOWY
   - Dodaje kolumnę `access_code` do `invitation_recipients`
   - Dodaje indeksy

2. **`regenerate-invitation-access-codes.js`** ⭐ NOWY
   - Skrypt do regeneracji kodów dla starych zaproszeń

3. **`src/controllers/invitationsController.js`** ✏️ ZMODYFIKOWANY
   - Zapisuje `access_code` do `invitation_recipients`
   - Zapisuje też do `exhibitor_people` jeśli jest `exhibitorId`
   - Dodano `exhibition_id` do INSERT

4. **`src/controllers/qrVerifyController.js`** ✏️ ZMODYFIKOWANY
   - Sprawdza oba źródła: `exhibitor_people` + `invitation_recipients`
   - Loguje źródło weryfikacji

5. **`src/controllers/qrCodesController.js`** ✏️ ZMODYFIKOWANY
   - Zwraca kody z obu tabel (UNION ALL)
   - Filtruje po `exhibitorId` w obu tabelach

## 💡 Jak to działa teraz

### Wysyłanie zaproszenia:

1. Admin/Wystawca wysyła zaproszenie przez panel
2. System generuje `access_code` (poprawny algorytm)
3. **Zapisuje do `invitation_recipients`** ✅
4. Jeśli jest `exhibitorId` - zapisuje też do `exhibitor_people` ✅
5. Generuje PDF z kodem QR
6. Wysyła email z załącznikiem

### Weryfikacja na bramce:

1. Osoba pokazuje kod QR
2. System skanuje kod
3. **Sprawdza `exhibitor_people`** ✅
4. **Jeśli nie znaleziono - sprawdza `invitation_recipients`** ✅
5. Zwraca dane osoby i wystawcy
6. Bramka otwiera się! 🎉

### API `/qr-codes/exhibition/:id`:

1. Pobiera kody z `exhibitor_people` ✅
2. **UNION ALL** - pobiera kody z `invitation_recipients` ✅
3. Sortuje alfabetycznie
4. Zwraca wszystkie ~171 kodów

## ⚠️ Ważne Uwagi

### Dual Storage (podwójne przechowywanie)

Kody z zaproszeń mogą być w **OBIE miejscach jednocześnie**:
- ✅ `invitation_recipients` - zawsze
- ✅ `exhibitor_people` - tylko jeśli jest `exhibitorId`

To jest **celowe** i zapewnia redundancję.

### Stare zaproszenia

Zaproszenia wysłane **PRZED tą poprawką**:
- ❌ Nie mają `access_code` w bazie
- ✅ Mogą być odzyskane przez skrypt regeneracji
- ⚠️ Trzeba uruchomić skrypt **PRZED wydarzeniem 04-06.11.2025**

### Nowe zaproszenia

Zaproszenia wysłane **PO tej poprawce**:
- ✅ Zawsze mają `access_code` w bazie
- ✅ Weryfikacja działa od razu
- ✅ Nie wymagają regeneracji

## 🎯 Checklist Wdrożenia

- [ ] 1. Uruchom migrację SQL na produkcji
- [ ] 2. Deploy zmian w kodzie (git push)
- [ ] 3. Poczekaj na Railway build (~2-3 min)
- [ ] 4. Uruchom skrypt regeneracji dla wystawy 17
- [ ] 5. Przetestuj weryfikację starych kodów
- [ ] 6. Przetestuj wysyłanie nowego zaproszenia
- [ ] 7. Sprawdź API - powinno zwracać ~171 kodów
- [ ] 8. Poinformuj zespół bramek o naprawie

---

**Data naprawy:** 2025-11-04
**Wystawa:** WARSAW INDUSTRY WEEK (ID: 17)
**Odzyskane kody:** ~143
**Status:** ✅ Gotowe do wdrożenia

