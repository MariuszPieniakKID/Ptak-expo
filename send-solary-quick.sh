#!/bin/bash

# Quick script to send Solary emails - pass credentials as arguments
# Usage: ./send-solary-quick.sh EMAIL PASSWORD

if [ $# -ne 2 ]; then
  echo "Usage: $0 EMAIL PASSWORD"
  echo "Example: $0 pieniak@gmail.com your-password"
  exit 1
fi

ADMIN_EMAIL=$1
ADMIN_PASSWORD=$2
BACKEND_URL="https://backend-production-df8c.up.railway.app"

echo "🔐 Logowanie..."

# Get token
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
echo "🎯 Wysyłam maile do wystawców wystawy 'Solary'..."
echo ""

# Call endpoint
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/v1/bulk-emails/send-welcome-by-exhibition" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"exhibitionName":"Solary"}')

# Check response
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Wysyłka zakończona pomyślnie!"
  echo ""
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
  echo "❌ Błąd podczas wysyłania"
  echo ""
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi


