#!/bin/bash
# Regresja: wystawca z jednym stoiskiem ma działać dokładnie jak dotąd,
# a wpis globalny (czytany przez starsze widoki) ma pozostać aktualny.
set -u
API=http://localhost:3011/api/v1
PSQL="psql -h localhost -p 5432 -d ptak_multistand -tAq"

EMAIL="test.jedno.stoisko@example.com"
HASH=$(node -e "console.log(require('bcryptjs').hashSync('Test12345!',10))")
$PSQL -c "DELETE FROM exhibitors WHERE email='$EMAIL'" >/dev/null
$PSQL -c "DELETE FROM users WHERE email='$EMAIL'" >/dev/null
EX_ID=$($PSQL -c "INSERT INTO exhibitors (nip, company_name, address, postal_code, city, contact_person, contact_role, phone, email, password_hash, status)
  VALUES ('0000000002','Firma Jedno Stoisko','ul. Testowa 2','00-002','Warszawa','Jan Test','tester','+48600600601','$EMAIL','$HASH','active') RETURNING id")
$PSQL -c "INSERT INTO users (email, password_hash, role, first_name, last_name, status)
  VALUES ('$EMAIL','$HASH','exhibitor','Jan','Test','active')" >/dev/null
EV_ID=$($PSQL -c "SELECT id FROM exhibitions ORDER BY id LIMIT 1")

ADMIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
curl -s -X POST "$API/exhibitors/$EX_ID/assign-event" \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d "{\"exhibitionId\":$EV_ID,\"hallName\":\"Hala 1\",\"standNumber\":\"C3\"}" >/dev/null

TOKEN=$(curl -s -X POST "$API/auth/exhibitor-login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test12345!\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
AUTH=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

echo "=== Zapis bez podawania stoiska (tak jak robi to dzisiejszy panel) ==="
curl -s -X POST "$API/catalog/$EV_ID" "${AUTH[@]}" \
  -d '{"name":"Firma Jedno Stoisko","description":"OPIS JEDNEGO STOISKA","logo":"logo-c3.png"}' >/dev/null
curl -s -X POST "$API/catalog/$EV_ID/products" "${AUTH[@]}" -d '{"name":"Produkt C3"}' >/dev/null

echo "=== Odczyt bez podawania stoiska ==="
curl -s "$API/catalog/$EV_ID" "${AUTH[@]}" | sed -n 's/.*"description":"\([^"]*\)".*/opis: \1/p'

echo "=== Wpisy w bazie (globalny musi być aktualny dla starszych widoków) ==="
$PSQL -c "SELECT coalesce(participation_id::text,'GLOBALNY') AS wpis,
  left(coalesce(description,'(brak)'),24) AS opis,
  coalesce(logo,'(brak)') AS logo,
  coalesce((SELECT string_agg(p->>'name',',') FROM jsonb_array_elements(products) p),'-') AS produkty
FROM exhibitor_catalog_entries WHERE exhibitor_id=$EX_ID ORDER BY participation_id NULLS FIRST"

echo "=== Widok admina (czyta wpis globalny) ==="
curl -s "$API/catalog/admin/$EX_ID/products" -H "Authorization: Bearer $ADMIN" | head -c 200
echo

$PSQL -c "DELETE FROM exhibitors WHERE id=$EX_ID" >/dev/null
$PSQL -c "DELETE FROM users WHERE email='$EMAIL'" >/dev/null
echo "porządki: usunięto konto $EX_ID"
