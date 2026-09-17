#!/bin/bash
# Sprawdzenie, że odczyt katalogu bez podania stoiska zwraca dane firmy (a nie produktu).
set -u
API=http://localhost:3011/api/v1
BAZA="${BAZA:-ptak_czysta}"
PSQL="psql -h localhost -p 5432 -d $BAZA -tAq"
EMAIL="test.odczyt@example.com"
HASH=$(node -e "console.log(require('bcryptjs').hashSync('Test12345!',10))")

$PSQL -c "DELETE FROM exhibitors WHERE email='$EMAIL'" >/dev/null
$PSQL -c "DELETE FROM users WHERE email='$EMAIL'" >/dev/null
EX=$($PSQL -c "INSERT INTO exhibitors (nip,company_name,address,postal_code,city,contact_person,contact_role,phone,email,password_hash,status)
  VALUES ('0000000003','Firma Odczyt','ul. T 3','00-003','W-wa','Jan','tester','+48600600602','$EMAIL','$HASH','active') RETURNING id")
$PSQL -c "INSERT INTO users (email,password_hash,role,first_name,last_name,status) VALUES ('$EMAIL','$HASH','exhibitor','Jan','T','active')" >/dev/null
EV=$($PSQL -c "SELECT id FROM exhibitions ORDER BY id LIMIT 1")

ADMIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
curl -s -X POST "$API/exhibitors/$EX/assign-event" -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" -d "{\"exhibitionId\":$EV}" >/dev/null

TOK=$(curl -s -X POST "$API/auth/exhibitor-login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test12345!\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
AUTH=(-H "Authorization: Bearer $TOK" -H "Content-Type: application/json")

curl -s -X POST "$API/catalog/$EV" "${AUTH[@]}" \
  -d '{"name":"Firma Odczyt","description":"OPIS FIRMY","logo":"l.png"}' >/dev/null
curl -s -X POST "$API/catalog/$EV/products" "${AUTH[@]}" -d '{"name":"Produkt X","description":""}' >/dev/null

echo "=== GET katalogu bez parametru stoiska ==="
curl -s "$API/catalog/$EV" "${AUTH[@]}" | /usr/bin/python3 -c "
import json,sys
d = json.load(sys.stdin)['data']
print('stoisko:', d.get('participation_id'))
print('nazwa:', d.get('name'))
print('opis firmy:', d.get('description'))
print('logo:', d.get('logo'))
print('produkty:', [p.get('name') for p in (d.get('products') or [])])"

$PSQL -c "DELETE FROM exhibitors WHERE id=$EX" >/dev/null
$PSQL -c "DELETE FROM users WHERE email='$EMAIL'" >/dev/null
echo "porządki: usunięto konto $EX"
