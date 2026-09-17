#!/bin/bash
# Test: panel wystawcy zapisuje dane osobno dla każdego stoiska.
set -u
API=http://localhost:3011/api/v1
BAZA="${BAZA:-ptak_czysta}"
PSQL="psql -h localhost -p 5432 -d $BAZA -tAq"

say() { echo; echo "===== $1 ====="; }

# Wystawca z hasłem i wydarzeniem – logujemy się jako on (panel wystawcy).
EMAIL="test.wielostoisko@example.com"
HASH=$(node -e "console.log(require('bcryptjs').hashSync('Test12345!',10))")
$PSQL -c "DELETE FROM exhibitors WHERE email='$EMAIL'" >/dev/null
EX_ID=$($PSQL -c "INSERT INTO exhibitors (nip, company_name, address, postal_code, city, contact_person, contact_role, phone, email, password_hash, status)
  VALUES ('0000000001','Firma Dwa Stoiska','ul. Testowa 1','00-001','Warszawa','Jan Test','tester','+48600600600','$EMAIL','$HASH','active') RETURNING id")
$PSQL -c "INSERT INTO users (email, password_hash, role, first_name, last_name, status)
  VALUES ('$EMAIL','$HASH','exhibitor','Jan','Test','active')
  ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, status='active'" >/dev/null
EV_ID=$($PSQL -c "SELECT id FROM exhibitions ORDER BY id LIMIT 1")
echo "Wystawca $EX_ID, wydarzenie $EV_ID"

ADMIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
AADMIN=(-H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json")

say "Admin dodaje dwa stoiska na to samo wydarzenie"
curl -s -X POST "$API/exhibitors/$EX_ID/assign-event" "${AADMIN[@]}" \
  -d "{\"exhibitionId\":$EV_ID,\"hallName\":\"Hala 1\",\"standNumber\":\"A1\"}" | sed -n 's/.*"participationId":\([0-9]*\).*/stoisko 1: \1/p'
curl -s -X POST "$API/exhibitors/$EX_ID/assign-event" "${AADMIN[@]}" \
  -d "{\"exhibitionId\":$EV_ID,\"hallName\":\"Hala 2\",\"standNumber\":\"B2\",\"additionalStand\":true}" | sed -n 's/.*"participationId":\([0-9]*\).*/stoisko 2: \1/p'
P1=$($PSQL -c "SELECT min(id) FROM exhibitor_events WHERE exhibitor_id=$EX_ID")
P2=$($PSQL -c "SELECT max(id) FROM exhibitor_events WHERE exhibitor_id=$EX_ID")

TOKEN=$(curl -s -X POST "$API/auth/exhibitor-login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test12345!\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [ -z "$TOKEN" ]; then echo "BRAK TOKENU wystawcy"; exit 1; fi
AUTH=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

say "Wystawca zapisuje dane stoiska nr 1"
curl -s -X POST "$API/catalog/$EV_ID" "${AUTH[@]}" -d "{
  \"participationId\":$P1,\"name\":\"Firma Dwa Stoiska\",\"description\":\"OPIS STOISKA A1\",
  \"logo\":\"logo-a1.png\",\"brands\":\"Marka A\",\"industries\":\"Branża A\"}" \
  | sed -n 's/.*"participation_id":\([0-9]*\).*/zapisano do stoiska: \1/p'

say "Wystawca zapisuje inne dane stoiska nr 2"
curl -s -X POST "$API/catalog/$EV_ID" "${AUTH[@]}" -d "{
  \"participationId\":$P2,\"name\":\"Firma Dwa Stoiska\",\"description\":\"OPIS STOISKA B2\",
  \"logo\":\"logo-b2.png\",\"brands\":\"Marka B\",\"industries\":\"Branża B\"}" \
  | sed -n 's/.*"participation_id":\([0-9]*\).*/zapisano do stoiska: \1/p'

say "Odczyt każdego stoiska osobno (ma dać różne dane)"
echo "-- stoisko 1 --"
curl -s "$API/catalog/$EV_ID?participationId=$P1" "${AUTH[@]}" \
  | sed -n 's/.*"description":"\([^"]*\)".*/opis: \1/p'
curl -s "$API/catalog/$EV_ID?participationId=$P1" "${AUTH[@]}" \
  | sed -n 's/.*"logo":"\([^"]*\)".*/logo: \1/p'
echo "-- stoisko 2 --"
curl -s "$API/catalog/$EV_ID?participationId=$P2" "${AUTH[@]}" \
  | sed -n 's/.*"description":"\([^"]*\)".*/opis: \1/p'
curl -s "$API/catalog/$EV_ID?participationId=$P2" "${AUTH[@]}" \
  | sed -n 's/.*"logo":"\([^"]*\)".*/logo: \1/p'

say "Produkty osobno per stoisko"
curl -s -X POST "$API/catalog/$EV_ID/products" "${AUTH[@]}" \
  -d "{\"participationId\":$P1,\"name\":\"Produkt tylko A1\"}" >/dev/null
curl -s -X POST "$API/catalog/$EV_ID/products" "${AUTH[@]}" \
  -d "{\"participationId\":$P2,\"name\":\"Produkt tylko B2\"}" >/dev/null
$PSQL -c "SELECT participation_id, left(description,20), coalesce(industries,'-'),
  coalesce((SELECT string_agg(p->>'name',' | ') FROM jsonb_array_elements(products) p),'-')
FROM exhibitor_catalog_entries WHERE exhibitor_id=$EX_ID ORDER BY participation_id NULLS FIRST"

say "Baza: wpis globalny nie powinien już przejmować zmian drugiego stoiska"
$PSQL -c "SELECT coalesce(participation_id::text,'GLOBALNY') AS wpis, left(coalesce(description,'(brak)'),22) AS opis
FROM exhibitor_catalog_entries WHERE exhibitor_id=$EX_ID ORDER BY participation_id NULLS FIRST"

say "Porządki"
$PSQL -c "DELETE FROM exhibitors WHERE id=$EX_ID" >/dev/null
$PSQL -c "DELETE FROM users WHERE email='$EMAIL'" >/dev/null
echo "usunięto konto testowe $EX_ID"
