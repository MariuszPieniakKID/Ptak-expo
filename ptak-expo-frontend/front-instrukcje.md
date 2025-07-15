# Przewodnik dla Deweloperów Frontend - Ptak Expo

Ten dokument opisuje architekturę, standardy i najlepsze praktyki zastosowane w projekcie frontendowym Ptak Expo. Celem tej refaktoryzacji było stworzenie nowoczesnej, responsywnej i łatwej w utrzymaniu aplikacji.

## 1. Główne Technologie i Biblioteki

- **React:** Główna biblioteka do budowy interfejsu użytkownika.
- **TypeScript:** Zapewnia statyczne typowanie, co zwiększa bezpieczeństwo i czytelność kodu.
- **Material-UI (MUI):** Kompleksowa biblioteka komponentów UI, która przyspiesza rozwój i zapewnia spójny wygląd. Używana do budowy większości elementów interfejsu (przyciski, formularze, tabele, modale).
- **Sass (SCSS):** Preprocesor CSS, który umożliwia stosowanie zmiennych, mixinów i zagnieżdżania, co znacznie poprawia organizację i reużywalność stylów.
- **React Router:** Biblioteka do zarządzania nawigacją po stronie.

## 2. Struktura Projektu

```
ptak-expo-frontend/
├── public/
└── src/
    ├── assets/       # Obrazy, ikony, fonty
    ├── components/   # Reużywalne komponenty (np. Menu, AddUserModal)
    ├── contexts/     # Konteksty Reacta (np. AuthContext)
    ├── pages/        # Główne widoki/strony aplikacji (np. LoginPage, DashboardPage)
    ├── services/     # Logika komunikacji z API (np. api.ts)
    ├── styles/       # Globalne style SCSS (_variables.scss, _mixins.scss)
    ├── App.tsx       # Główny komponent aplikacji z routingiem
    ├── index.tsx     # Punkt wejścia aplikacji
    └── ...
```

- **`components`**: Zawiera małe, reużywalne komponenty, które mogą być używane na różnych stronach.
- **`pages`**: Każdy plik w tym katalogu odpowiada za jedną stronę/widok w aplikacji. Komponenty te składają mniejsze komponenty w całość.
- **`services`**: Odpowiada za komunikację z zewnętrznym API. Cała logika `fetch` jest odizolowana w tym miejscu.
- **`styles`**: Centralne miejsce na globalne definicje stylów.
  - `_variables.scss`: Przechowuje zmienne SCSS dla kolorów, czcionek, itp.
  - `_mixins.scss`: Zawiera mixiny SCSS, głównie do obsługi responsywności (media queries).

## 3. Standardy Kodowania i Najlepsze Praktyki

### a. Komponenty

- **Funkcyjne i hooki:** Wszystkie komponenty są funkcyjne i wykorzystują hooki (`useState`, `useEffect`, `useCallback`).
- **Material-UI:** Zawsze, gdy to możliwe, należy używać komponentów z biblioteki Material-UI, zamiast tworzyć własne od zera. Zapewnia to spójność i dostępność.
- **Propsy:** Komponenty powinny mieć jasno zdefiniowane `props`y z użyciem TypeScript.

### b. Stylowanie (SCSS i CSS Modules)

- **CSS Modules:** Każdy komponent ma swój własny plik `*.module.scss`. Zapewnia to lokalny zasięg stylów i unika konfliktów nazw klas.
- **Globalne zmienne:** Kolory, fonty i inne globalne wartości są zdefiniowane w `src/styles/_variables.scss` i powinny być importowane w komponentach.
- **Responsywność:**
  - **Grid i Box:** Do budowy layoutu używaj komponentów `<Grid>` i `<Box>` z Material-UI. Są one domyślnie responsywne.
  - **Mixin'y:** Do bardziej szczegółowych dostosowań responsywnych używaj mixinów z `src/styles/_mixins.scss`.
  ```scss
  @import '../../styles/mixins';

  .myComponent {
    // Style domyślne (mobile-first)

    @include for-tablet-portrait-up {
      // Style dla tabletów i większych ekranów
    }
  }
  ```
- **Jednostki `rem` i `em`:** Zamiast `px` używaj jednostek relatywnych (`rem`, `em`) dla `font-size`, `padding`, `margin` itp. Zapewnia to lepszą skalowalność i dostępność. Główny `font-size` jest zdefiniowany na `<html>` (przez Material-UI), a `rem` odnosi się do niego.

### c. Zarządzanie Stanem

- **Lokalny stan:** Do prostego stanu wewnątrz komponentu używaj hooka `useState`.
- **Globalny stan:** Do stanu, który musi być współdzielony między wieloma komponentami (np. dane zalogowanego użytkownika), używaj React Context API (`AuthContext`).

### d. Komunikacja z API

- **Serwis API:** Cała logika związana z `fetch` jest wydzielona do `src/services/api.ts`. Komponenty nie powinny zawierać bezpośrednich wywołań `fetch`.
- **Obsługa błędów:** Funkcje w serwisie API powinny obsługiwać błędy i rzucać je dalej, aby komponent mógł je przechwycić i wyświetlić użytkownikowi odpowiedni komunikat.

## 4. Jak dodać nową stronę?

1.  Stwórz nowy plik w katalogu `src/pages`, np. `src/pages/NewPage.tsx`.
2.  Zbuduj komponent strony, używając komponentów z `Material-UI` i reużywalnych komponentów z `src/components`.
3.  Dodaj routing do nowej strony w pliku `src/App.tsx`.
4.  W razie potrzeby dodaj link do nowej strony w komponencie `Menu.tsx`.

Dzięki tej architekturze, projekt jest teraz znacznie bardziej przewidywalny, łatwiejszy do rozwijania i odporny na błędy. Zachęcam do trzymania się powyższych zasad, aby utrzymać wysoką jakość kodu. 