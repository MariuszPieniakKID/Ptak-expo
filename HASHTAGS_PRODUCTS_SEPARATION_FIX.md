# Fix: Hashtagi i Prezentowane Produkty - Separacja Między Wydarzeniami

## Problem
Gdy wystawca był dodawany do drugiego wydarzenia, system zaciągał następujące dane z poprzednich wydarzeń (z globalnych wpisów katalogowych):
- **Hashtagi** (catalog_tags)
- **Prezentowane produkty** (products)

Te dane powinny być **osobne dla każdej wystawy/wydarzenia**, podobnie jak dokumenty i wydarzenia.

## Rozwiązanie
Usunięto fallback do globalnych danych dla `catalog_tags` i `products` w zapytaniach SQL oraz logice merge.

### Dane, które NADAL się zaciągają (prawidłowo):
✅ Nazwa firmy  
✅ Logo  
✅ Opis  
✅ Dane kontaktowe  
✅ Strona WWW  
✅ Brandy/marki  
✅ Social media  

### Dane, które już NIE zaciągają się (naprawione):
❌ Hashtagi (catalog_tags)  
❌ Prezentowane produkty (products)  

## Zmienione Pliki

### 1. `/ptak-expo-backend/src/routes/public.js`
Zmieniono 5 zapytań SQL w następujących endpointach:
- `GET /public/exhibitions/:exhibitionId/feed.json` (linia 239-240)
- `GET /public/exhibitions/:exhibitionId/exhibitors` (linia 374-375)
- `GET /public/exhibitions/:exhibitionId/exhibitors.json` (linia 539-540)
- `GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.json` (linia 943-944)
- `GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.rss` (linia 1161-1162)

**Przed:**
```sql
COALESCE(s.catalog_tags, g.catalog_tags) AS catalog_tags,
COALESCE(s.products, g.products, '[]'::jsonb) AS products,
```

**Po:**
```sql
s.catalog_tags AS catalog_tags,
COALESCE(s.products, '[]'::jsonb) AS products,
```

### 2. `/ptak-expo-backend/src/routes/catalog.js`
Zmieniono logikę merge w endpoincie `GET /api/v1/catalog/:exhibitionId` (linia 473, 475):

**Przed:**
```javascript
catalog_tags: prefer(data.catalog_tags, globalData.catalog_tags),
products: (Array.isArray(data.products) && data.products.length > 0) ? data.products : (Array.isArray(globalData.products) ? globalData.products : []),
```

**Po:**
```javascript
catalog_tags: data.catalog_tags,
products: (Array.isArray(data.products) && data.products.length > 0) ? data.products : [],
```

## Zachowanie Systemu Po Zmianach

### Scenariusz 1: Wystawca dodany do pierwszego wydarzenia
- Wszystkie pola są puste (lub zaciągają się z danych podstawowych wystawcy)
- Wystawca wypełnia wszystkie dane, w tym hashtagi i produkty

### Scenariusz 2: Wystawca dodany do drugiego wydarzenia
**Dane zaciągające się z globalnych:**
- Nazwa firmy, logo, opis, dane kontaktowe, strona WWW, brandy, social media

**Dane NIE zaciągające się (puste dla nowego wydarzenia):**
- Hashtagi - wystawca musi dodać osobno dla każdego wydarzenia
- Prezentowane produkty - wystawca musi dodać osobno dla każdego wydarzenia

## Testowanie
1. Dodaj wystawcę do pierwszego wydarzenia
2. Wypełnij wszystkie dane, w tym hashtagi i produkty
3. Dodaj tego samego wystawcę do drugiego wydarzenia
4. Sprawdź, że:
   - Nazwa firmy, logo, opis, dane kontaktowe, strona WWW, brandy i social media są zaciągnięte ✅
   - Hashtagi i prezentowane produkty są puste ✅

## Backend Restart
Po wdrożeniu zmian backend musi być zrestartowany:
```bash
cd ptak-expo-backend
npm start
```

## Status
✅ Zmiany wprowadzone  
✅ Brak błędów składniowych  
⏳ Wymaga testowania  
⏳ Wymaga restartu backendu  

## Data zmian
2025-01-17

