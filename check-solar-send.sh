#!/bin/bash

BACKEND_URL="https://backend-production-e57c.up.railway.app"

echo "🔐 Logowanie..."
TOKEN=$(curl -s -X POST "${BACKEND_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test.admin@ptak-expo.com","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Błąd logowania"
  exit 1
fi

echo "✅ Zalogowano"
echo ""
echo "🎯 Wysyłam maile do Solar Energy Expo 2026..."
echo ""

curl -X POST "${BACKEND_URL}/api/v1/bulk-emails/send-welcome-by-exhibition" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exhibitionName":"SOLAR"}' \
  --max-time 300 \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""


