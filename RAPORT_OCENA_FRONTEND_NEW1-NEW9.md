# RAPORT OCENY PRACY FRONTEND - GAŁĘZIE NEW-1 DO NEW-9

**Projekt:** ptak-expo-web  
**Data:** 28 października 2025  
**Zakres:** Analiza 9 gałęzi (NEW-1 do NEW-9) pod kątem zgodności z technologią projektu

---

## PODSUMOWANIE WYKONAWCZE

**Ocena ogólna: 3/10**

Z 9 gałęzi:
- ✅ 6 gałęzi zawiera kod dla ptak-expo-web
- ❌ 1 gałąź (NEW-2) ma nieprawidłowy merge base (orphan branch)
- ⚠️ 1 gałąź (NEW-8) nie dotyczy frontendu web
- ⚠️ 1 gałąź (NEW-6) zawiera tylko drobne poprawki

**Główne problemy:**
1. **Bezpośrednie użycie Material-UI** zamiast custom components (naruszenie architektury)
2. **Mock data** w komponentach zamiast integracji z API
3. **Inline styles** zamiast SCSS modules
4. **Zagrożenia bezpieczeństwa** (dangerouslySetInnerHTML, XSS)
5. **Brak standardów kodowania** (console.log, hardcoded wartości)

---

## SZCZEGÓŁOWA ANALIZA GAŁĘZI

### ✅ NEW-1: Documents Page
**Commit:** `c86fe71 NEW-1 update documents page`  
**Zmiany:** 560 insertions, 173 deletions (7 plików)

#### Pozytywne:
- ✓ Używa CustomTypography
- ✓ Używa SCSS modules
- ✓ Integracja z API (exhibitorsSelfAPI, exhibitorDocumentsAPI)
- ✓ Loading states i error handling

#### Problemy:
1. **Inline styles** (4 miejsca):
   ```tsx
   // Linie 132, 150, 176, 237
   style={{padding: "20px", textAlign: "center"}}
   style={{padding: "20px", color: "red"}}
   ```
   👉 Powinno być w SCSS modules

2. **alert()** zamiast UI notifications:
   ```tsx
   alert("Błąd podczas pobierania dokumentu: " + ...)
   ```
   👉 Użyć toast/snackbar z design system

3. **Brak DRY** - powtarzalne wywołanie API:
   ```tsx
   // W fetchDocuments i handleDownload - ten sam kod pobierania exhibitorId
   const profileResponse = await exhibitorsSelfAPI.getMe();
   const exhibitorId = profileResponse.data.data.id;
   ```

4. **Hardcoded dane kontaktowe**:
   ```tsx
   <div className={styles.contactName}>Magda Masny</div>
   <div className={styles.contactPhone}>+48 518 739 124</div>
   ```
   👉 Powinny pochodzić z API lub konfiguracji

5. **console.log w kodzie produkcyjnym** (linie 52, 84, 111, 112)

**Ocena:** 6/10

---

### ❌ NEW-2: Marketing Page
**Commit:** `bb92701 NEW-2 add marketing page with mocks`

#### Problemy:
1. **Brak merge base z main** - orphan branch
   ```
   fatal: main...origin/NEW-2: no merge base
   ```
   👉 Nieprawidłowy workflow Git, nie można zintegrować

2. Niemożliwa analiza ze względu na brak wspólnej historii

**Ocena:** 0/10 - nieprawidłowy branch

---

### ⚠️ NEW-3: Trade Info Page
**Commit:** `94f6fbf NEW-3 add target info page`  
**Zmiany:** 1166 insertions, 488 deletions (18 plików)

#### Pozytywne:
- ✓ Używa CustomTypography
- ✓ Dobra struktura folderów
- ✓ Utilities w osobnym pliku

#### Problemy:
1. **Używa .css zamiast .scss**:
   ```tsx
   import styles from "./TradeInfoPage.module.css"; // ❌
   ```
   👉 Projekt używa SCSS

2. **Mock data zamiast API** (3 obiekty):
   ```tsx
   const mockMainBuildInfo = { ... };
   const mockEventInformations = { ... };
   const mockFairPlan = { ... };
   ```
   👉 Powinny pochodzić z API

3. **Brak CustomButton** - zwykły button w HTML

4. **Usunięte stare pliki** bez migracji danych (TradeInfoPage.tsx, tradeInfoFigma.css)

**Ocena:** 4/10

---

### ❌ NEW-4: Event Identifier Page
**Commit:** `2f965bd NEW-4 add event identifier page`  
**Zmiany:** 864 insertions, 102 deletions (6 plików)

#### Problemy:
1. **Bezpośrednie użycie Material-UI** zamiast custom components:
   ```tsx
   import {Box, CardContent, Grid} from "@mui/material";
   import {Gauge, gaugeClasses} from "@mui/x-charts/Gauge";
   ```
   👉 Powinno być: CustomButton, CustomField, custom layouts

2. **dangerouslySetInnerHTML** (2 miejsca):
   ```tsx
   dangerouslySetInnerHTML={{
     __html: `Wysłane<br/>zaproszenia (15 <span>/ 50</span>)`
   }}
   ```
   👉 Potencjalne zagrożenie XSS

3. **Hardcoded wartości**:
   ```tsx
   value={15} valueMax={50}  // W wielu miejscach
   ```

4. **Modyfikacja package.json** - dodanie @mui/x-charts:
   ```json
   "dependencies": {
     "@mui/x-charts": "^7.22.2"  // Nowa zależność
   }
   ```
   👉 Powinno być uzgodnione, może wpłynąć na bundle size

5. **Mieszanie Material-UI Grid z custom SCSS**

**Ocena:** 2/10 - poważne naruszenie architektury

---

### ❌ NEW-5: Invitations Page
**Commit:** `9f99a4f NEW-5 add invitations page`  
**Zmiany:** 1026 insertions, 343 deletions (15 plików)

#### Pozytywne:
- ✓ Integracja z invitationsAPI
- ✓ Loading states

#### Problemy:
1. **Bezpośrednie użycie Material-UI** (najgorsze naruszenie):
   ```tsx
   import {TextField, Button, Typography, Table, TableRow} from "@mui/material";
   ```
   👉 Projekt wymaga CustomButton, CustomField, CustomTypography

2. **Mock data**:
   ```tsx
   const mockUsersSend: T_MockUsersSend[] = [...];
   ```

3. **Hardcoded obrazek z Freepik** zamiast z API:
   ```tsx
   src="https://img.freepik.com/free-photo/abstract-flowing-neon-wave-background_53876-101942.jpg"
   // Zamiast:
   // src={data.headerImageUrl}
   ```

4. **dangerouslySetInnerHTML**:
   ```tsx
   dangerouslySetInnerHTML={{
     __html: `Wysłane zaproszenia (15<span> / 50</span>)`
   }}
   ```

5. **Inline styles** (10+ miejsc):
   ```tsx
   sx={{mb: 2}}
   sx={{color: "#666"}}
   style={{display: "flex", justifyContent: "space-between"}}
   ```

6. **Typo w borderColor**:
   ```tsx
   borderColor: "##707070"  // Podwójny ##
   ```

**Ocena:** 2/10 - najwięcej naruszeń

---

### ✅ NEW-6: Home Page Update
**Commit:** `4987f49 NEW-6 updae gome page`  
**Zmiany:** 94 insertions, 34 deletions (4 pliki)

#### Pozytywne:
- ✓ Proste poprawki w EventHomeMenu
- ✓ Zgodność z architekturą

#### Problemy:
1. **Typo w commit message**: "updae gome" zamiast "update home"
2. Minimalne zmiany - głównie refactoring

**Ocena:** 7/10

---

### ⚠️ NEW-7: News Page
**Commit:** `c0f3cb1 NEW-7 update news page`  
**Zmiany:** 210 insertions, 59 deletions (7 plików)

#### Pozytywne:
- ✓ Dobra struktura (RenderSection w osobnym pliku)
- ✓ Używa dayjs z locale

#### Problemy:
1. **Bezpośrednie użycie Material-UI Typography**:
   ```tsx
   import {Typography, Box} from "@mui/material";
   ```
   👉 Powinno być CustomTypography

2. Brak integracji z API - tylko interface, brak fetchu

**Ocena:** 5/10

---

### ⚠️ NEW-8: Checklist Page
**Commit:** `25e38d8 NEW-8 update checklist page`

#### Problemy:
1. **Brak zmian w ptak-expo-web** - branch dotyczy backendu
2. Niewłaściwe nazwanie - sugeruje frontend, a dotyczy API

**Ocena:** N/A - nie dotyczy frontendu web

---

### ❌ NEW-9: Left Section Update
**Commit:** `6d5a69e NEW-9 update left section`  
**Zmiany:** 342 insertions, 68 deletions (8 plików)

#### Problemy:
1. **Bezpośrednie użycie Material-UI**:
   ```tsx
   import {Card, Button, Typography, Chip} from "@mui/material";
   ```
   👉 Powinno być: CustomButton, CustomTypography, custom Card

2. **Hardcoded wartości**:
   ```tsx
   progressPercent = 80  // Domyślna wartość
   new Array(50).fill(null)  // Magic number
   ```

3. **Hardcoded kolory** z constants.ts zamiast SCSS variables

**Ocena:** 3/10

---

## PODSUMOWANIE BŁĘDÓW

### 🔴 KRYTYCZNE (muszą być poprawione)

1. **Bezpośrednie użycie Material-UI** - gałęzie: NEW-4, NEW-5, NEW-7, NEW-9
   - Projekt wymaga używania custom components (CustomButton, CustomField, CustomTypography)
   - Pamięć projektu jasno określa: "Zawsze używać custom components zamiast Material-UI bezpośrednio"

2. **dangerouslySetInnerHTML** - gałęzie: NEW-4, NEW-5
   - Potencjalne zagrożenie XSS
   - Powinno być rozwiązane przez React children lub bezpieczny parser

3. **Mock data zamiast API** - gałęzie: NEW-3, NEW-5
   - Komponenty nie są funkcjonalne bez prawdziwych danych
   - Brak integracji z backendem

### 🟠 WAŻNE (powinny być poprawione)

4. **Inline styles** - gałęzie: NEW-1, NEW-5
   - Projekt używa SCSS modules
   - Utrudnia maintainability i consistency

5. **Hardcoded wartości** - gałęzie: NEW-1, NEW-4, NEW-5, NEW-9
   - Dane kontaktowe, wartości numeryczne
   - Powinny pochodzić z API lub konfiguracji

6. **console.log w kodzie produkcyjnym** - gałąź: NEW-1
   - Powinny być usunięte lub zastąpione proper loggingiem

### 🟡 DOBRE PRAKTYKI

7. **Używanie .css zamiast .scss** - gałąź: NEW-3
8. **alert()** zamiast UI notifications - gałąź: NEW-1
9. **Typo w commit messages** - gałąź: NEW-6
10. **Brak DRY** - gałąź: NEW-1

---

## ZGODNOŚĆ Z TECHNOLOGIĄ PROJEKTU

### Standard projektu (z memories):
```
✅ TypeScript + SCSS + Custom Components
✅ Template: React.FC, useState, useCallback
✅ CustomTypography/CustomField/CustomButton/CustomLink
✅ Style z .module.scss
✅ Design system z kolorami: --color-dodjerblue, --color-mediumslateblue
✅ Zawsze używać custom components zamiast Material-UI bezpośrednio
```

### Zgodność gałęzi:

| Gałąź | TypeScript | SCSS | Custom Comp. | No Mock | No Inline | Ogólna |
|-------|-----------|------|--------------|---------|-----------|--------|
| NEW-1 | ✅ | ✅ | ⚠️ | ✅ | ❌ | 6/10 |
| NEW-2 | ❌ | ❌ | ❌ | ❌ | ❌ | 0/10 |
| NEW-3 | ✅ | ❌ | ⚠️ | ❌ | ✅ | 4/10 |
| NEW-4 | ✅ | ✅ | ❌ | ⚠️ | ⚠️ | 2/10 |
| NEW-5 | ✅ | ✅ | ❌ | ❌ | ❌ | 2/10 |
| NEW-6 | ✅ | ✅ | ✅ | ✅ | ✅ | 7/10 |
| NEW-7 | ✅ | ✅ | ❌ | ⚠️ | ✅ | 5/10 |
| NEW-8 | N/A | N/A | N/A | N/A | N/A | N/A |
| NEW-9 | ✅ | ✅ | ❌ | ❌ | ⚠️ | 3/10 |

**Średnia:** 3.6/10

---

## REKOMENDACJE

### Natychmiastowe działania:

1. **Przepisać komponenty z NEW-4, NEW-5, NEW-7, NEW-9** na custom components
2. **Usunąć dangerouslySetInnerHTML** z NEW-4 i NEW-5
3. **Zintegrować z API** zamiast mock data (NEW-3, NEW-5)
4. **Naprawić NEW-2** - stworzyć branch od main
5. **Przenieść inline styles do SCSS** (NEW-1, NEW-5)

### Code review checklist dla przyszłych PR:

- [ ] Używa tylko custom components (CustomButton, CustomField, CustomTypography)
- [ ] Wszystkie style w .module.scss (nie .css, nie inline)
- [ ] Brak mock data - wszystkie dane z API
- [ ] Brak dangerouslySetInnerHTML
- [ ] Brak console.log w production code
- [ ] Brak hardcoded wartości (dane kontaktowe, liczby, kolory)
- [ ] Commit messages bez typo
- [ ] Branch ma merge base z main

### Szkolenie developera:

Developer wymaga szkolenia w zakresie:
1. Architektury projektu i custom components
2. Standardów SCSS modules vs inline styles
3. Integracji z API (services/api)
4. Bezpieczeństwa (XSS, dangerouslySetInnerHTML)
5. Git workflow (merge base, proper branching)

---

## WNIOSKI

**Developer pokazuje podstawową znajomość React i TypeScript**, ale:
- ❌ **Nie przestrzega architektury projektu** (custom components)
- ❌ **Nie integruje z API** (mock data)
- ❌ **Nie dba o bezpieczeństwo** (dangerouslySetInnerHTML)
- ❌ **Nie przestrzega standardów** (inline styles, console.log)
- ⚠️ **Problemy z Git workflow** (orphan branches)

**Zalecenie:** Przed kontynuacją pracy developer powinien:
1. Przejść code review wszystkich gałęzi
2. Zapoznać się z dokumentacją projektu i custom components
3. Przepisać kod zgodnie z rekomendacjami
4. Przejść code review przed merge do main

**Ryzyko:** Bez poprawy kod może wprowadzić:
- Problemy z maintainability (różne style komponentów)
- Zagrożenia bezpieczeństwa (XSS)
- Zwiększony bundle size (niepotrzebne zależności)
- Brak funkcjonalności (mock data nie działa z prawdziwym API)

---

**Raport wygenerowany:** 28 października 2025  
**Autor analizy:** AI Code Review Assistant

