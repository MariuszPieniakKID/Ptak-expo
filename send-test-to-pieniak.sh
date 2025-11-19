#!/bin/bash

# Wysyłka testowa maila do pieniak@gmail.com
# Ten sam format co był wysyłany do SOLAR

BACKEND_URL="https://backend-production-df8c.up.railway.app"

echo "🔐 Logowanie jako admin..."
read -p "Email admina: " ADMIN_EMAIL
read -sp "Hasło admina: " ADMIN_PASSWORD
echo ""

# Pobierz token
echo "🔑 Pobieram token..."
LOGIN_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Błąd logowania"
  echo "Odpowiedź: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Zalogowano pomyślnie"
echo ""
echo "📧 Wysyłam testowy mail do pieniak@gmail.com..."
echo ""

# Wywołaj endpoint testowy
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/v1/bulk-emails/send-welcome-test" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

# Sprawdź odpowiedź
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Mail wysłany pomyślnie!"
  echo ""
  echo "Szczegóły:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  echo ""
  echo "🎉 Sprawdź skrzynkę pieniak@gmail.com"
else
  echo "❌ Błąd podczas wysyłania"
  echo ""
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

