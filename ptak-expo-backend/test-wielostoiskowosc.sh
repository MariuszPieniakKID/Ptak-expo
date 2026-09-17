#!/bin/bash
# Test lokalny wielostoiskowości (uruchamiany na kopii bazy produkcyjnej).
set -u
API=http://localhost:3011/api/v1
PSQL="psql -h localhost -p 5432 -d ptak_multistand -tAq"

say() { echo; echo "===== $1 ====="; }

TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [ -z "$TOKEN" ]; then echo "BRAK TOKENU – logowanie nieudane"; exit 1; fi
echo "Token OK (${#TOKEN} znaków)"

AUTH=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

# Wystawca z danymi katalogowymi i wydarzeniem – realny przypadek z kopii produkcji.
# Wystawca z danymi firmy we wpisie globalnym i produktami we wpisie wydarzenia.
read -r EX_ID EV_ID <<<"$($PSQL -c "SELECT ee.exhibitor_id, ee.exhibition_id
  FROM exhibitor_events ee
  JOIN exhibitor_catalog_entries ev ON ev.participation_id = ee.id
   AND jsonb_array_length(COALESCE(ev.products,'[]'::jsonb)) > 0
  JOIN exhibitor_catalog_entries gl ON gl.exhibitor_id = ee.exhibitor_id
   AND gl.exhibition_id IS NULL AND gl.logo IS NOT NULL AND gl.description IS NOT NULL
  ORDER BY ee.id LIMIT 1" | tr '|' ' ')"
echo "Testowy wystawca: $EX_ID, wydarzenie: $EV_ID"
NIP=$($PSQL -c "SELECT nip FROM exhibitors WHERE id=$EX_ID")

say "1. Powtórzony NIP przy zakładaniu konta – ma ostrzegać, nie blokować na głucho"
curl -s -X POST "$API/exhibitors" "${AUTH[@]}" -d "{
  \"nip\":\"$NIP\",\"companyName\":\"Test Duplikat\",\"address\":\"ul. Testowa 1\",
  \"postalCode\":\"00-001\",\"city\":\"Warszawa\",\"contactPerson\":\"Jan Test\",
  \"contactRole\":\"tester\",\"phone\":\"+48600600600\",\"email\":\"dup.test1@example.com\",
  \"password\":\"Test12345!\"}" | head -c 400
echo
echo "-- ta sama próba ze świadomą zgodą (allowDuplicateNip) --"
NEW_EX=$(curl -s -X POST "$API/exhibitors" "${AUTH[@]}" -d "{
  \"nip\":\"$NIP\",\"companyName\":\"Test Duplikat\",\"address\":\"ul. Testowa 1\",
  \"postalCode\":\"00-001\",\"city\":\"Warszawa\",\"contactPerson\":\"Jan Test\",
  \"contactRole\":\"tester\",\"phone\":\"+48600600600\",\"email\":\"dup.test1@example.com\",
  \"password\":\"Test12345!\",\"allowDuplicateNip\":true}")
echo "$NEW_EX" | head -c 300
NEW_EX_ID=$(echo "$NEW_EX" | sed -n 's/.*"id":\([0-9]*\).*/\1/p' | head -1)
echo; echo "Utworzone konto: $NEW_EX_ID"

say "2. Zmiana NIP-u na istniejącym koncie (dotąd niemożliwa)"
curl -s -X PUT "$API/exhibitors/$NEW_EX_ID" "${AUTH[@]}" \
  -d '{"nip":"9999999999"}' | head -c 250
echo
echo "NIP w bazie: $($PSQL -c "SELECT nip FROM exhibitors WHERE id=$NEW_EX_ID")"

say "3. Drugie stoisko na tym samym wydarzeniu + kopiowanie danych"
echo "-- stoiska przed: $($PSQL -c "SELECT count(*) FROM exhibitor_events WHERE exhibitor_id=$EX_ID AND exhibition_id=$EV_ID") --"
curl -s -X POST "$API/exhibitors/$EX_ID/assign-event" "${AUTH[@]}" \
  -d "{\"exhibitionId\":$EV_ID,\"hallName\":\"Hala 9\",\"standNumber\":\"Z99\",\"additionalStand\":true}" | head -c 400
echo
echo "-- stoiska po: $($PSQL -c "SELECT count(*) FROM exhibitor_events WHERE exhibitor_id=$EX_ID AND exhibition_id=$EV_ID") --"
echo "-- wpisy katalogowe obu stoisk (czy dane skopiowane) --"
$PSQL -c "SELECT ee.id AS stoisko, coalesce(ee.stand_number,'-') AS nr,
  left(coalesce(c.name,'(brak)'),28) AS nazwa,
  (c.logo IS NOT NULL) AS ma_logo,
  length(coalesce(c.description,'')) AS dlugosc_opisu,
  jsonb_array_length(coalesce(c.products,'[]'::jsonb)) AS produkty
FROM exhibitor_events ee LEFT JOIN exhibitor_catalog_entries c ON c.participation_id=ee.id
WHERE ee.exhibitor_id=$EX_ID AND ee.exhibition_id=$EV_ID ORDER BY ee.id"

say "4. Izolacja zmian – edycja opisu drugiego stoiska nie rusza pierwszego"
NEW_PART=$($PSQL -c "SELECT max(id) FROM exhibitor_events WHERE exhibitor_id=$EX_ID AND exhibition_id=$EV_ID")
$PSQL -c "UPDATE exhibitor_catalog_entries SET description='OPIS TYLKO DRUGIEGO STOISKA' WHERE participation_id=$NEW_PART" >/dev/null
$PSQL -c "SELECT ee.id AS stoisko, left(coalesce(c.description,''),40) AS opis
FROM exhibitor_events ee LEFT JOIN exhibitor_catalog_entries c ON c.participation_id=ee.id
WHERE ee.exhibitor_id=$EX_ID AND ee.exhibition_id=$EV_ID ORDER BY ee.id"

say "5. Regresja: zwykłe przypisanie bez flagi nie tworzy dubla"
BEFORE=$($PSQL -c "SELECT count(*) FROM exhibitor_events WHERE exhibitor_id=$EX_ID AND exhibition_id=$EV_ID")
curl -s -X POST "$API/exhibitors/$EX_ID/assign-event" "${AUTH[@]}" \
  -d "{\"exhibitionId\":$EV_ID,\"hallName\":\"Hala 1\"}" > /dev/null
AFTER=$($PSQL -c "SELECT count(*) FROM exhibitor_events WHERE exhibitor_id=$EX_ID AND exhibition_id=$EV_ID")
echo "stoiska przed: $BEFORE, po: $AFTER (ma być tyle samo)"

say "6. Porządki po teście"
$PSQL -c "DELETE FROM exhibitor_events WHERE id=$NEW_PART" >/dev/null
$PSQL -c "DELETE FROM exhibitors WHERE id=$NEW_EX_ID" >/dev/null
echo "usunięto konto testowe $NEW_EX_ID i stoisko $NEW_PART"
echo "stoiska końcowo: $($PSQL -c "SELECT count(*) FROM exhibitor_events WHERE exhibitor_id=$EX_ID AND exhibition_id=$EV_ID")"
