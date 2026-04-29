#!/bin/bash

# Kolory
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_URL="https://backend-production-e57c.up.railway.app"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  SOLARY - Wysyłka maili do wystawców${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🔐 Logowanie jako admin...${NC}"

# Zaloguj się jako admin (potrzebny email i hasło admina)
read -p "Email admina: " ADMIN_EMAIL
read -sp "Hasło admina: " ADMIN_PASSWORD
echo ""

# Pobierz token
echo -e "${YELLOW}🔑 Pobieram token autoryzacyjny...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Błąd logowania. Sprawdź email i hasło.${NC}"
  echo "Odpowiedź: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Zalogowano pomyślnie${NC}"
echo ""
echo -e "${YELLOW}🎯 Wysyłam maile do wystawców wystawy 'Solary'...${NC}"
echo ""

# Wywołaj endpoint do wysyłki maili dla wystawy Solary
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/v1/bulk-emails/send-welcome-by-exhibition" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"exhibitionName":"Solary"}')

# Sprawdź czy sukces
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Wysyłka zakończona pomyślnie!${NC}"
  echo ""
  echo "Szczegóły:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  Wysyłka zakończona!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
else
  echo -e "${RED}❌ Błąd podczas wysyłania emaili${NC}"
  echo ""
  echo "Odpowiedź:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi


