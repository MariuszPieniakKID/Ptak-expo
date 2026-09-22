#!/bin/bash
# Test: firma z dwoma stoiskami widzi każde swoje wydarzenie w agendzie tylko raz.
set -u
API=http://localhost:3011/api/v1
BAZA="${BAZA:-ptak_czysta}"
PSQL="psql -h localhost -p 5432 -d $BAZA -tAq"

EMAIL="test.agenda.stoiska@example.com"
HASH=$(node -e "console.log(require('bcryptjs').hashSync('Test12345!',10))")
$PSQL -c "DELETE FROM trade_events WHERE exhibitor_id IN (SELECT id FROM exhibitors WHERE email='$EMAIL')" >/dev/null
$PSQL -c "DELETE FROM exhibitors WHERE email='$EMAIL'" >/dev/null
EX_ID=$($PSQL -c "INSERT INTO exhibitors (nip, company_name, address, postal_code, city, contact_person, contact_role, phone, email, password_hash, status)
  VALUES ('0000000002','Firma Agenda','ul. Testowa 1','00-001','Warszawa','Jan Test','tester','+48600600600','$EMAIL','$HASH','active') RETURNING id")
$PSQL -c "INSERT INTO users (email, password_hash, role, first_name, last_name, status)
  VALUES ('$EMAIL','$HASH','exhibitor','Jan','Test','active')
  ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, status='active'" >/dev/null
EV_ID=$($PSQL -c "SELECT id FROM exhibitions ORDER BY id LIMIT 1")

ADMIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
AADMIN=(-H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json")

curl -s -o /dev/null -X POST "$API/exhibitors/$EX_ID/assign-event" "${AADMIN[@]}" \
  -d "{\"exhibitionId\":$EV_ID,\"hallName\":\"Hala 1\",\"standNumber\":\"A1\"}"
curl -s -o /dev/null -X POST "$API/exhibitors/$EX_ID/assign-event" "${AADMIN[@]}" \
  -d "{\"exhibitionId\":$EV_ID,\"hallName\":\"Hala 2\",\"standNumber\":\"B2\",\"additionalStand\":true}"
echo "Stoiska firmy: $($PSQL -c "SELECT count(*) FROM exhibitor_events WHERE exhibitor_id=$EX_ID")"

TE_ID=$($PSQL -c "INSERT INTO trade_events (exhibition_id, exhibitor_id, name, event_date, start_time, end_time, type)
  VALUES ($EV_ID, $EX_ID, 'Pokaz testowy', CURRENT_DATE, '10:00', '11:00', 'Prezentacja') RETURNING id")

TOKEN=$(curl -s -X POST "$API/auth/exhibitor-login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test12345!\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

policz() {
  node -e "let s='';process.stdin.on('data',c=>s+=c).on('end',()=>{const r=(JSON.parse(s).data||[]).filter(e=>e.id===$TE_ID);console.log(r.length+' raz(y), numer stoiska: '+(r[0]?r[0].booth_number:'-'))})"
}
echo "Agenda u wystawcy: pokaz widoczny " >> /tmp/agenda-wynik.txt
curl -s "$API/trade-events/$EV_ID" -H "Authorization: Bearer $TOKEN" | policz >> /tmp/agenda-wynik.txt 2>&1
echo "Agenda u admina (filtr po firmie): pokaz widoczny " >> /tmp/agenda-wynik.txt
curl -s "$API/trade-events/$EV_ID?exhibitorId=$EX_ID" -H "Authorization: Bearer $ADMIN" | policz >> /tmp/agenda-wynik.txt 2>&1

$PSQL -c "DELETE FROM trade_events WHERE id=$TE_ID" >/dev/null
$PSQL -c "DELETE FROM exhibitor_events WHERE exhibitor_id=$EX_ID" >/dev/null
$PSQL -c "DELETE FROM exhibitors WHERE id=$EX_ID" >/dev/null
$PSQL -c "DELETE FROM users WHERE email='$EMAIL'" >/dev/null
