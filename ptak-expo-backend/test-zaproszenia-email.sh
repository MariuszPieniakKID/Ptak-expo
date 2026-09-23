#!/bin/bash
# Test: zaproszenie z błędnym adresem e-mail jest odrzucane, zanim cokolwiek zostanie zapisane.
set -u
API=http://localhost:3011/api/v1
BAZA="${BAZA:-ptak_czysta}"
PSQL="psql -h localhost -p 5432 -d $BAZA -tAq"

EV=$($PSQL -c "SELECT it.exhibition_id FROM invitation_templates it JOIN exhibitions e ON e.id = it.exhibition_id
  WHERE e.end_date >= CURRENT_DATE AND COALESCE(e.invitations_enabled, true) GROUP BY 1 ORDER BY count(*) DESC LIMIT 1")
HASH=$(node -e "console.log(require('bcryptjs').hashSync('Test12345!',10))")
EMAIL="test.zaproszenia@example.com"
$PSQL -c "DELETE FROM exhibitors WHERE email='$EMAIL'" >/dev/null
EX=$($PSQL -c "INSERT INTO exhibitors (nip, company_name, address, postal_code, city, contact_person, contact_role, phone, email, password_hash, status)
  VALUES ('0000000003','Firma Test Zaproszen','ul. Testowa 1','00-001','Warszawa','Jan Test','tester','+48600600600','$EMAIL','$HASH','active') RETURNING id")
$PSQL -c "INSERT INTO users (email, password_hash, role, first_name, last_name, status)
  VALUES ('$EMAIL','$HASH','exhibitor','Jan','Test','active')
  ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, status='active'" >/dev/null
$PSQL -c "INSERT INTO exhibitor_events (exhibitor_id, exhibition_id, invitation_limit, invitations_enabled) VALUES ($EX, $EV, 50, true)" >/dev/null
echo "Wystawca $EX, wydarzenie $EV"

TOKEN=$(curl -s -X POST "$API/auth/exhibitor-login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test12345!\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "$TOKEN" > /tmp/exh-token.txt
TPL=$($PSQL -c "SELECT id FROM invitation_templates WHERE exhibition_id = $EV LIMIT 1")

echo "Błędny adres:"
curl -s -X POST "$API/invitations/$EV/send" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"templateId\":$TPL,\"recipientName\":\"bn vb\",\"recipientEmail\":\"dsfdsfgsdfgsfdg\"}" -w " [%{http_code}]\n"
echo "Zapisanych odbiorców: $($PSQL -c "SELECT count(*) FROM invitation_recipients WHERE exhibitor_id = $EX")"
echo "Zapisanych gości (e-identyfikatory): $($PSQL -c "SELECT count(*) FROM exhibitor_people WHERE exhibitor_id = $EX")"
