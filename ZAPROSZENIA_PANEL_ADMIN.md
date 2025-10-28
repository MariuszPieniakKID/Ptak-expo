# Panel Administracyjny - Zarządzanie Zaproszeniami

## Opis
Nowy moduł pozwala na kompleksowe przeglądanie i analizę zaproszeń wysyłanych przez wystawców przez panel administracyjny.

## Implementacja

### Backend (ptak-expo-backend)

#### 1. Nowe endpointy API

**GET `/api/v1/invitations/admin/all`** (tylko admin)
- Pobiera wszystkie zaproszenia z możliwością filtrowania i sortowania
- Parametry query:
  - `exhibitionId` - filtrowanie po ID wydarzenia
  - `exhibitorId` - filtrowanie po ID wystawcy
  - `status` - filtrowanie po statusie (pending, accepted, rejected)
  - `search` - wyszukiwanie po emailu, nazwie, firmie odbiorcy lub nazwie wystawcy
  - `sortBy` - kolumna sortowania (sent_at, recipient_email, recipient_name, company_name, exhibition_name)
  - `sortOrder` - kierunek sortowania (asc, desc)
- Zwraca:
  - Lista zaproszeń z pełnymi danymi (odbiorca, wystawca, wydarzenie, szablon)
  - Statystyki zbiorcze (łączna liczba, wysłane, otwarte, zaakceptowane, pending, liczba wystawców, liczba wydarzeń)

**GET `/api/v1/invitations/admin/export-csv`** (tylko admin)
- Eksportuje zaproszenia do pliku CSV
- Przyjmuje te same parametry filtrowania co endpoint `/admin/all`
- Zwraca plik CSV z kodowaniem UTF-8 (z BOM dla poprawnego odczytu w Excel)
- Format pliku zawiera:
  - ID, Email odbiorcy, Nazwa odbiorcy, Firma odbiorcy
  - Daty: wysłania, otwarcia, odpowiedzi
  - Status, Typ zaproszenia, Tytuł szablonu
  - Nazwa wydarzenia, Daty wydarzenia
  - Dane wystawcy (firma, email, telefon)

#### 2. Pliki zmienione w backendzie
- `src/controllers/invitationsController.js` - dodane funkcje `getAllInvitationsAdmin` i `exportInvitationsCSV`
- `src/routes/invitations.js` - dodane routing dla nowych endpointów

### Frontend (ptak-expo-frontend)

#### 1. Nowa strona InvitationsPage

**Lokalizacja:** `src/pages/invitationsPage/InvitationsPage.tsx`

**Funkcjonalności:**
- Wyświetlanie listy wszystkich zaproszeń w tabeli z paginacją
- Sekcja statystyk zbiorczych (6 kart):
  - Wszystkie zaproszenia
  - Wysłane
  - Otwarte
  - Zaakceptowane
  - Liczba wystawców
  - Liczba wydarzeń

**Filtry:**
- Pole wyszukiwania (tekstowe) - szuka po emailu, nazwie, firmie
- Select - wybór wydarzenia
- Select - wybór wystawcy
- Select - wybór statusu (wszystkie, oczekujące, zaakceptowane, odrzucone)

**Tabela zaproszeń - kolumny:**
- ID
- Data wysłania (z sortowaniem)
- Odbiorca
- Email odbiorcy
- Firma odbiorcy
- Wystawca
- Wydarzenie
- Szablon
- Status (kolorowe etykiety)
- Data otwarcia

**Akcje:**
- Przycisk "Eksportuj CSV" - eksportuje aktualnie przefiltrowany widok do CSV
- Przycisk "Powrót" - powrót do dashboardu
- Sortowanie po dacie wysłania (kliknięcie na nagłówek kolumny)

#### 2. API Services

**Lokalizacja:** `src/services/api.ts`

**Nowe interfejsy:**
```typescript
InvitationRecipient - pojedyncze zaproszenie z pełnymi danymi
InvitationsSummary - statystyki zbiorcze
AllInvitationsResponse - odpowiedź z danymi i statystykami
InvitationsFilters - parametry filtrowania
```

**Nowe funkcje:**
- `fetchAllInvitations(token, filters)` - pobiera zaproszenia z backendu
- `exportInvitationsCSV(token, filters)` - otwiera nowe okno z pobieraniem CSV

#### 3. Routing i nawigacja

**App.tsx:**
- Dodano route `/zaproszenia` z ochroną dla roli admin

**Menu (desktop i mobile):**
- Dodano pozycję "Zaproszenia" z ikoną Email
- Widoczne w górnym menu nawigacyjnym
- Dostępne również w menu mobilnym

**Pliki zmienione:**
- `src/App.tsx` - dodany route
- `src/components/menu/Menu.tsx` - dodana pozycja menu
- `src/components/menu_mobile/Menu_mobile.tsx` - dodana pozycja menu mobilnego

## Dostęp do modułu

1. Zaloguj się do panelu admina
2. W górnym menu kliknij "Zaproszenia" (ikona koperty)
3. Lub przejdź bezpośrednio do: `https://your-domain.com/zaproszenia`

## Wymagania

- Rola: **admin** (tylko administratorzy mają dostęp)
- Token autoryzacji musi być ważny

## Schemat bazy danych

Moduł korzysta z istniejących tabel:
- `invitation_recipients` - główna tabela z zaproszeniami
- `invitation_templates` - szablony zaproszeń
- `exhibitions` - wydarzenia
- `exhibitors` - wystawcy

## Przykłady użycia

### 1. Wyświetl wszystkie zaproszenia
- Wejdź na stronę `/zaproszenia`
- Bez żadnych filtrów zobaczysz wszystkie zaproszenia

### 2. Znajdź zaproszenia dla konkretnego wydarzenia
- Wybierz wydarzenie z listy rozwijanej "Wydarzenie"
- Lista automatycznie się przefiltruje

### 3. Znajdź zaproszenia wysłane przez konkretnego wystawcę
- Wybierz wystawcę z listy rozwijanej "Wystawca"
- Zobacz wszystkie zaproszenia tego wystawcy

### 4. Eksport do Excel
- Ustaw filtry według potrzeb
- Kliknij "Eksportuj CSV"
- Plik zostanie automatycznie pobrany
- Otwórz w Excel (UTF-8 z BOM zapewnia poprawne polskie znaki)

### 5. Wyszukiwanie tekstowe
- Wpisz część emaila, nazwiska lub nazwy firmy w pole "Szukaj"
- System przeszuka wszystkie te pola i wyświetli pasujące wyniki

## Bezpieczeństwo

- Wszystkie endpointy wymagają autoryzacji (Bearer token)
- Middleware `requireAdmin` sprawdza czy użytkownik ma rolę admin
- SQL injection protection poprzez parametryzowane zapytania ($1, $2, etc.)
- Walidacja parametrów sortowania (whitelist dozwolonych kolumn)

## Status implementacji

✅ Backend - endpointy API z filtrowaniem i statystykami
✅ Backend - eksport do CSV
✅ Frontend - strona InvitationsPage
✅ Frontend - filtry i sortowanie
✅ Frontend - eksport CSV
✅ Routing i nawigacja
✅ Testy lintingu - brak błędów

## Dalszy rozwój (opcjonalne)

Możliwe rozszerzenia w przyszłości:
- Edycja statusu zaproszenia z poziomu admina
- Masowe akcje (zaznacz wszystkie, zmień status)
- Wykresy i wizualizacje statystyk
- Historia zmian zaproszenia
- Powiadomienia o nowych zaproszeniach
- Filtrowanie po dacie wysłania (zakres dat)
- Grupowanie zaproszeń (np. po wystawcy lub wydarzeniu)

