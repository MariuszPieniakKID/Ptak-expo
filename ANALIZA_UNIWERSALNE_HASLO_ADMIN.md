# Analiza: Uniwersalne hasło admina do logowania na konta wystawców

## Data: 2025-10-16

## Obecny system autoryzacji

### 1. Architektura JWT (JSON Web Tokens)
- **Backend:** Używa JWT do autoryzacji
- **Token zawiera:** `{ id, email, role, expiresIn: '7d' }`
- **Przechowywanie:** `localStorage` po stronie klienta (przeglądarki)
- **Backend:** **NIE przechowuje sesji** - system jest stateless

### 2. Jak działa logowanie wystawcy

```javascript
// Backend: /api/v1/auth/exhibitor-login
1. Użytkownik podaje email + hasło
2. Backend sprawdza w tabeli: exhibitors.password_hash
3. Porównuje: bcrypt.compare(password, exhibitor.password_hash)
4. Jeśli OK → generuje token JWT
5. Token jest wysyłany do klienta
6. Klient zapisuje token w localStorage swojej przeglądarki
```

### 3. Token JWT jest niezależny dla każdego klienta

**Kluczowe:** Każda przeglądarka ma swój własny `localStorage`:
- Wystawca na swoim komputerze → token w localStorage przeglądarki wystawcy
- Admin na swoim komputerze → token w localStorage przeglądarki admina
- **Tokeny są całkowicie niezależne!**

---

## ✅ ODPOWIEDŹ: Czy będzie konflikt?

### **NIE - nie będzie żadnego konfliktu!**

### Powody:

#### 1. **System jest STATELESS**
- Backend **nie wie** kto jest aktualnie zalogowany
- Backend **nie przechowuje** listy aktywnych sesji
- Backend tylko **weryfikuje token JWT** przy każdym request
- Nie ma "sesji po stronie serwera" która mogłaby się konfliktować

#### 2. **Każdy klient ma swój token**
```
Wystawca (Chrome na laptopie):
├─ localStorage: { authToken: "eyJhbGc...XYZ" }  // token wystawcy
├─ Decoded: { id: 123, email: "wystawca@firma.pl", role: "exhibitor" }

Admin (Firefox na innym komputerze):
├─ localStorage: { authToken: "eyJhbGc...ABC" }  // token admina jako wystawca
├─ Decoded: { id: 123, email: "wystawca@firma.pl", role: "exhibitor" }

Backend nie wie że oba tokeny istnieją równocześnie!
```

#### 3. **Brak współdzielonych zasobów**
- Każdy request jest niezależny
- Nie ma "lock" na koncie użytkownika
- Nie ma "jednej sesji na użytkownika"

---

## Scenariusze równoczesnego użytkowania

### ✅ Scenariusz 1: Oba logowania jednocześnie
**Co się dzieje:**
```
10:00 - Wystawca loguje się na swoje konto
      → Dostaje token A
      → Token A w localStorage wystawcy

10:05 - Admin loguje się na to samo konto (email wystawcy + hasło uniwersalne)
      → Dostaje token B
      → Token B w localStorage admina

10:10 - Wystawca zapisuje zmianę w checkliście
      → Request z tokenem A → Backend weryfikuje token A → OK

10:11 - Admin zapisuje zmianę w checkliście tego samego wystawcy
      → Request z tokenem B → Backend weryfikuje token B → OK
```

**Rezultat:** ✅ Oba działają niezależnie, żadnego konfliktu

### ✅ Scenariusz 2: Równoczesna edycja tego samego dokumentu
**Co się dzieje:**
```
Wystawca edytuje checklistę:
├─ Otwiera formularz
├─ Zmienia "Nazwa firmy" → "ABC Sp. z o.o."
├─ Kliknięcie "Zapisz" → POST /api/v1/catalog/123

Admin edytuje checklistę tego samego wystawcy:
├─ Otwiera formularz (widzi stare dane)
├─ Zmienia "Nazwa firmy" → "XYZ Sp. z o.o."
├─ Kliknięcie "Zapisz" → POST /api/v1/catalog/123
```

**Rezultat:** ⚠️ **Last write wins** - ostatni zapis nadpisuje poprzedni
- To NIE jest konflikt tokenów/sesji
- To normalny problem równoczesnej edycji (jak w Google Docs)
- **Backend nie blokuje** - po prostu zapisuje co dostanie

### ✅ Scenariusz 3: Wystawca zmienia hasło podczas gdy admin jest zalogowany
**Co się dzieje:**
```
10:00 - Admin loguje się (email wystawcy + hasło uniwersalne)
      → Token admina jest ważny przez 7 dni

10:30 - Wystawca zmienia swoje hasło
      → Zmienia się exhibitors.password_hash

11:00 - Admin nadal używa swojego tokena
      → Token jest nadal ważny! (JWT nie zależy od hasła)
      → Admin może dalej pracować
```

**Rezultat:** ✅ Zmiana hasła NIE wyloguje aktywnych tokenów

---

## Potencjalne problemy (niezwiązane z konfliktami)

### ⚠️ Problem 1: Równoczesna edycja tych samych danych
**Problem:** Ostatni zapis wygrywa (last write wins)

**Przykład:**
1. Wystawca edytuje opis: "Opis A"
2. Admin edytuje opis: "Opis B"
3. Wystawca zapisuje → w bazie: "Opis A"
4. Admin zapisuje → w bazie: "Opis B" (nadpisuje)

**Rozwiązanie:**
- To normalny problem aplikacji webowych
- Można dodać optimistic locking (wersjonowanie)
- Można dodać powiadomienia o równoczesnej edycji
- **Ale to nie jest problem uniwersalnego hasła - to problem aplikacji**

### ⚠️ Problem 2: Audyt - kto wprowadził zmianę?
**Problem:** Backend nie rozróżnia czy zmianę wprowadził wystawca czy admin

**Dlaczego:**
- Oba tokeny mają ten sam `{ id: 123, email: "wystawca@firma.pl", role: "exhibitor" }`
- Backend myśli że to wystawca w obu przypadkach

**Rozwiązanie:**
- Dodać flagę `adminAsExhibitor: true` do tokena admina
- Logować w bazie kto wprowadził zmianę

### ⚠️ Problem 3: Bezpieczeństwo uniwersalnego hasła
**Problem:** Jeśli hasło wycieknie, ktoś może zalogować się na dowolnego wystawcę

**Rozwiązanie:**
- Silne hasło (min 20 znaków, losowe)
- Przechowywane bezpiecznie (zmienne środowiskowe)
- Zmieniane regularnie
- Logowanie prób użycia

---

## Rekomendowana implementacja

### Opcja 1: Master hasło w zmiennej środowiskowej (ZALECANE)

```javascript
// Backend: exhibitor-login
const exhibitorLogin = async (req, res) => {
  const { email, password } = req.body;
  
  const exhibitorRes = await db.query(
    'SELECT id, email, password_hash, company_name FROM exhibitors WHERE LOWER(email) = $1',
    [email.toLowerCase()]
  );
  
  const exhibitor = exhibitorRes.rows[0];
  
  // Sprawdź normalne hasło
  const isPasswordValid = await bcrypt.compare(password, exhibitor.password_hash);
  
  // LUB sprawdź uniwersalne hasło admina
  const isMasterPassword = password === process.env.ADMIN_MASTER_PASSWORD;
  
  if (!isPasswordValid && !isMasterPassword) {
    return res.status(401).json({ success: false, message: 'Nieprawidłowe hasło' });
  }
  
  // Wygeneruj token (z flagą że to admin)
  const token = jwt.sign(
    { 
      id: exhibitor.id, 
      email: exhibitor.email, 
      role: 'exhibitor',
      adminAsExhibitor: isMasterPassword // <-- flaga dla audytu
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  return res.json({ success: true, token, user: {...} });
};
```

**Zmienne środowiskowe:**
```bash
ADMIN_MASTER_PASSWORD=SuperSecretMasterPass123!@#$%
```

### Opcja 2: Dodatkowe pole w tabeli exhibitors

```sql
ALTER TABLE exhibitors ADD COLUMN master_password_hash VARCHAR(255);
```

Ale to mniej bezpieczne - trzeba by aktualizować w bazie.

---

## Podsumowanie

### ✅ Bezpieczne równoczesne logowanie
| Aspekt | Status | Notatka |
|--------|--------|---------|
| **Konflikty tokenów/sesji** | ✅ NIE MA | System stateless, tokeny niezależne |
| **Równoczesne requesty** | ✅ OK | Backend obsługuje niezależnie |
| **Równoczesna edycja danych** | ⚠️ Last write wins | Normalny problem aplikacji webowych |
| **Wylogowanie jednego nie wpływa na drugiego** | ✅ OK | Tokeny niezależne |
| **Zmiana hasła** | ✅ OK | Nie wyloguje aktywnych tokenów |

### 🎯 Wnioski

1. **NIE będzie konfliktów sesji/tokenów** - system JWT jest stateless
2. **Można spokojnie implementować** uniwersalne hasło
3. **Zalecana implementacja:** Master password w zmiennej środowiskowej
4. **Dodać:** Flagę `adminAsExhibitor` dla celów audytu
5. **Rozważyć:** Logowanie kto wprowadził zmiany (admin vs wystawca)

### ⚡ Możliwe problemy (ale niezwiązane z równoczesnym logowaniem):
- Równoczesna edycja tych samych danych (last write wins)
- Brak audytu kto wprowadził zmianę
- Bezpieczeństwo master password

**WNIOSEK KOŃCOWY: ✅ Możesz bezpiecznie wprowadzić uniwersalne hasło. Nie będzie konfliktów.**

