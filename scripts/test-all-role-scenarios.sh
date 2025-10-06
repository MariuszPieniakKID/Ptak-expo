#!/bin/bash

echo "🔍 Testing all scenarios where roles could be changed..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

cat << 'EOF'

═══════════════════════════════════════════════════════════════════════════════════════════════════
SCENARIUSZE TESTOWE - Miejsca gdzie role mogą być zmieniane:
═══════════════════════════════════════════════════════════════════════════════════════════════════

1. ✅ database.js initializeDatabase() - NAPRAWIONE
   - Automatyczna zmiana ról przy restarcie backendu
   - STATUS: Wyłączone (linie 846-878 zakomentowane)
   
2. ✅ POST /api/v1/exhibitors - NAPRAWIONE  
   - Dodawanie nowego wystawcy
   - STATUS: Linia 334 - role = 'exhibitor' usunięte z UPDATE

3. ✅ POST /api/v1/exhibitors/:id/reset-password - NAPRAWIONE
   - Resetowanie hasła wystawcy
   - STATUS: Linia 1232 - role usunięte z UPDATE

4. ✅ POST /api/v1/users - SPRAWDZONE
   - Dodawanie nowego użytkownika
   - STATUS: Używa role || 'exhibitor' - wymaga ręcznego wyboru admin

5. ✅ POST /api/v1/users/:id/reset-password - SPRAWDZONE
   - Resetowanie hasła użytkownika
   - STATUS: Nie zmienia roli, tylko hasło

═══════════════════════════════════════════════════════════════════════════════════════════════════
PODSUMOWANIE:
═══════════════════════════════════════════════════════════════════════════════════════════════════

✅ Wszystkie miejsca gdzie role mogły być automatycznie zmieniane zostały naprawione!

Obecny stan:
- Restart backendu: ✅ NIE zmienia ról
- Dodawanie wystawcy: ✅ NIE nadpisuje istniejących ról
- Reset hasła wystawcy: ✅ NIE zmienia roli
- Dodawanie użytkownika: ✅ Wymaga ręcznego wyboru roli
- Reset hasła użytkownika: ✅ Zachowuje rolę

⚠️  UWAGA dla użytkowników, którzy są w OBIE tabelach (users + exhibitors):
- Ich role pozostaną takie, jakie ustawisz ręcznie w panelu admin
- Reset hasła (zarówno przez panel admin jak i panel wystawcy) zachowa rolę
- Dodanie nowego wystawcy z istniejącym emailem nie nadpisze roli

═══════════════════════════════════════════════════════════════════════════════════════════════════

EOF

echo ""
echo "Sprawdzam aktualny stan kodu w Railway..."
echo ""

railway run --service Backend node -e "
const fs = require('fs');
const path = require('path');

console.log('🔍 Weryfikacja napraw w kodzie Railway...');
console.log('');

// Check if fixes are deployed
const databaseJs = fs.readFileSync(path.join(__dirname, 'src', 'config', 'database.js'), 'utf8');
const exhibitorsJs = fs.readFileSync(path.join(__dirname, 'src', 'routes', 'exhibitors.js'), 'utf8');

// Check 1: database.js automatic role enforcement
const hasDisabledAutoRoleChange = databaseJs.includes('DISABLED: Automatic role enforcement');
console.log('1. Automatyczna zmiana ról (database.js):', hasDisabledAutoRoleChange ? '✅ WYŁĄCZONA' : '❌ WCIĄŻ AKTYWNA');

// Check 2: exhibitors.js POST - role override in upsert
const hasFixedExhibitorCreate = exhibitorsJs.includes('-- role = \\'exhibitor\\',  -- REMOVED');
console.log('2. Nadpisywanie roli przy tworzeniu wystawcy:', hasFixedExhibitorCreate ? '✅ NAPRAWIONE' : '❌ WCIĄŻ PROBLEM');

// Check 3: exhibitors.js reset-password - role override
const hasFixedPasswordReset = exhibitorsJs.includes('-- role removed from UPDATE to preserve existing admin roles');
console.log('3. Nadpisywanie roli przy resetowaniu hasła:', hasFixedPasswordReset ? '✅ NAPRAWIONE' : '❌ WCIĄŻ PROBLEM');

console.log('');
if (hasDisabledAutoRoleChange && hasFixedExhibitorCreate && hasFixedPasswordReset) {
  console.log('🎉 Wszystkie naprawy zostały poprawnie wdrożone na Railway!');
} else {
  console.log('⚠️  Niektóre naprawy mogą nie być jeszcze wdrożone. Poczekaj na zakończenie deploymentu.');
}
"

