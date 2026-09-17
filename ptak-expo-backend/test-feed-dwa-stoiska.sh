#!/bin/bash
# Publiczny feed przy dwóch stoiskach jednej firmy: bez dublowania wierszy,
# każde stoisko z własnymi danymi i własnym identyfikatorem.
set -u
API=http://localhost:3011/api/v1
BAZA="${BAZA:-ptak_czysta}"
PSQL="psql -h localhost -p 5432 -d $BAZA -tAq"

EMAIL="test.feed@example.com"
HASH=$(node -e "console.log(require('bcryptjs').hashSync('Test12345!',10))")
$PSQL -c "DELETE FROM exhibitors WHERE email='$EMAIL'" >/dev/null
$PSQL -c "DELETE FROM users WHERE email='$EMAIL'" >/dev/null
EX=$($PSQL -c "INSERT INTO exhibitors (nip,company_name,address,postal_code,city,contact_person,contact_role,phone,email,password_hash,status)
  VALUES ('0000000004','Firma Feed Test','ul. T 4','00-004','W-wa','Jan','tester','+48600600603','$EMAIL','$HASH','active') RETURNING id")
$PSQL -c "INSERT INTO users (email,password_hash,role,first_name,last_name,status) VALUES ('$EMAIL','$HASH','exhibitor','Jan','T','active')" >/dev/null
EV=$($PSQL -c "SELECT id FROM exhibitions ORDER BY id LIMIT 1")

ADMIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
AADMIN=(-H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json")
curl -s -X POST "$API/exhibitors/$EX/assign-event" "${AADMIN[@]}" \
  -d "{\"exhibitionId\":$EV,\"hallName\":\"Hala 1\",\"standNumber\":\"A1\"}" >/dev/null
curl -s -X POST "$API/exhibitors/$EX/assign-event" "${AADMIN[@]}" \
  -d "{\"exhibitionId\":$EV,\"hallName\":\"Hala 2\",\"standNumber\":\"B2\",\"additionalStand\":true}" >/dev/null
P1=$($PSQL -c "SELECT min(id) FROM exhibitor_events WHERE exhibitor_id=$EX")
P2=$($PSQL -c "SELECT max(id) FROM exhibitor_events WHERE exhibitor_id=$EX")

TOK=$(curl -s -X POST "$API/auth/exhibitor-login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test12345!\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
AUTH=(-H "Authorization: Bearer $TOK" -H "Content-Type: application/json")
curl -s -X POST "$API/catalog/$EV" "${AUTH[@]}" -d "{\"participationId\":$P1,\"name\":\"Firma Feed Test\",\"description\":\"STOISKO A1\",\"logo\":\"a1.png\"}" >/dev/null
curl -s -X POST "$API/catalog/$EV" "${AUTH[@]}" -d "{\"participationId\":$P2,\"name\":\"Firma Feed Test\",\"description\":\"STOISKO B2\",\"logo\":\"b2.png\"}" >/dev/null

echo "=== Wpisy tej firmy w publicznym feedzie wydarzenia ==="
curl -s "http://localhost:3011/public/exhibitions/$EV/exhibitors.json" | /usr/bin/python3 -c "
import json,sys
d = json.load(sys.stdin)
lista = d.get('exhibitors') or d.get('data') or []
mine = [e for e in lista if 'Feed Test' in json.dumps(e, ensure_ascii=False)]
print('liczba wierszy tej firmy:', len(mine), '(ma być 2 – po jednym na stoisko)')
for e in mine:
    ci = e.get('companyInfo') or {}
    st = e.get('stand') or {}
    print(' - stoisko', e.get('standId'), '|', st.get('hallName'), st.get('standNumber'),
          '| opis:', ci.get('description'), '| logo:', (ci.get('logoUrl') or '').split('/')[-1])
print('łącznie wierszy w feedzie:', len(lista))"

echo "=== Czy inne firmy nie zostały zdublowane ==="
curl -s "http://localhost:3011/public/exhibitions/$EV/exhibitors.json" | /usr/bin/python3 -c "
import json,sys,collections
lista = (json.load(sys.stdin).get('exhibitors') or [])
c = collections.Counter(e.get('exhibitorId') for e in lista)
wiele = {k:v for k,v in c.items() if v > 1}
print('firmy z więcej niż jednym wierszem:', wiele if wiele else 'brak')"

$PSQL -c "DELETE FROM exhibitors WHERE id=$EX" >/dev/null
$PSQL -c "DELETE FROM users WHERE email='$EMAIL'" >/dev/null
echo "porządki: usunięto konto $EX"
