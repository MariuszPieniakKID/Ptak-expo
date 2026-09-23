#!/bin/bash
# Test: przy dodaniu kolejnych targów administrator wskazuje, z którego wcześniejszego udziału
# skopiować dane katalogu (logo, opis, produkty).
set -u
API=http://localhost:3011/api/v1
BAZA="${BAZA:-ptak_czysta}"
PSQL="psql -h localhost -p 5432 -d $BAZA -tAq"

EMAIL="test.wzor.danych@example.com"
$PSQL -c "DELETE FROM exhibitors WHERE email='$EMAIL'" >/dev/null
EX=$($PSQL -c "INSERT INTO exhibitors (nip, company_name, address, postal_code, city, contact_person, contact_role, phone, email, status)
  VALUES ('0000000004','Firma Wzor Danych','ul. Testowa 1','00-001','Warszawa','Jan Test','tester','+48600600600','$EMAIL','active') RETURNING id")
read -r EV_A EV_B EV_C <<< "$($PSQL -c "SELECT string_agg(id::text, ' ') FROM (SELECT id FROM exhibitions WHERE end_date >= CURRENT_DATE ORDER BY id LIMIT 3) x")"
echo "Wystawca $EX, targi A=$EV_A B=$EV_B C=$EV_C"

ADMIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
AUTH=(-H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json")
przypisz() { curl -s -X POST "$API/exhibitors/$EX/assign-event" "${AUTH[@]}" -d "$1" | sed -n 's/.*"participationId":\([0-9]*\).*/\1/p'; }

P_A=$(przypisz "{\"exhibitionId\":$EV_A}")
P_B=$(przypisz "{\"exhibitionId\":$EV_B}")
$PSQL -c "UPDATE exhibitor_catalog_entries SET description='OPIS TARGOW A', products='[{\"name\":\"Produkt A\"}]'::jsonb, updated_at=NOW() - interval '1 day' WHERE participation_id=$P_A" >/dev/null
$PSQL -c "UPDATE exhibitor_catalog_entries SET description='OPIS TARGOW B', products='[{\"name\":\"Produkt B\"}]'::jsonb, updated_at=NOW() WHERE participation_id=$P_B" >/dev/null
# Udziały bez własnych wpisów katalogu dostają je tutaj, żeby test miał dwa różne wzory.
for P in $P_A $P_B; do
  $PSQL -c "INSERT INTO exhibitor_catalog_entries (exhibitor_id, exhibition_id, participation_id, description, products)
    SELECT $EX, exhibition_id, id, 'OPIS TARGOW ' || CASE WHEN id=$P_A THEN 'A' ELSE 'B' END,
           ('[{\"name\":\"Produkt ' || CASE WHEN id=$P_A THEN 'A' ELSE 'B' END || '\"}]')::jsonb
    FROM exhibitor_events WHERE id=$P AND NOT EXISTS (SELECT 1 FROM exhibitor_catalog_entries WHERE participation_id=$P)" >/dev/null
done
$PSQL -c "UPDATE exhibitor_catalog_entries SET updated_at = NOW() - interval '1 day' WHERE participation_id=$P_A" >/dev/null
echo "Udział A ($P_A): $($PSQL -c "SELECT description FROM exhibitor_catalog_entries WHERE participation_id=$P_A")"
echo "Udział B ($P_B, edytowany później): $($PSQL -c "SELECT description FROM exhibitor_catalog_entries WHERE participation_id=$P_B")"

P_C=$(przypisz "{\"exhibitionId\":$EV_C,\"copyFromParticipationId\":$P_A}")
echo "Targi C ze wzorem A -> $($PSQL -c "SELECT description || ' | ' || (products->0->>'name') FROM exhibitor_catalog_entries WHERE participation_id=$P_C")"

$PSQL -c "DELETE FROM exhibitor_events WHERE id=$P_C" >/dev/null
$PSQL -c "DELETE FROM exhibitor_catalog_entries WHERE participation_id IS NULL AND exhibitor_id=$EX AND exhibition_id=$EV_C" >/dev/null
P_C2=$(przypisz "{\"exhibitionId\":$EV_C}")
echo "Targi C bez wskazania (automatycznie) -> $($PSQL -c "SELECT description || ' | ' || (products->0->>'name') FROM exhibitor_catalog_entries WHERE participation_id=$P_C2")"

INNY=$($PSQL -c "SELECT id FROM exhibitor_events WHERE exhibitor_id <> $EX ORDER BY id LIMIT 1")
echo -n "Wzór z cudzego konta -> "
curl -s -X POST "$API/exhibitors/$EX/assign-event" "${AUTH[@]}" -d "{\"exhibitionId\":$EV_C,\"additionalStand\":true,\"copyFromParticipationId\":$INNY}" -w " [%{http_code}]\n"

$PSQL -c "DELETE FROM exhibitor_catalog_entries WHERE exhibitor_id=$EX" >/dev/null
$PSQL -c "DELETE FROM exhibitor_events WHERE exhibitor_id=$EX" >/dev/null
$PSQL -c "DELETE FROM exhibitors WHERE id=$EX" >/dev/null
