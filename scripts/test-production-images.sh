#!/bin/bash

echo "🧪 TESTOWANIE GRAFIK NA PRODUCTION"
echo "=================================="
echo ""

# Test 1: Static file serving
echo "Test 1: Marketing material (static file)"
echo "URL: https://backend-production-df8c.up.railway.app/uploads/marketing-materials/benefit-1759388705632-28627868.svg"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://backend-production-df8c.up.railway.app/uploads/marketing-materials/benefit-1759388705632-28627868.svg")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ STATUS: $HTTP_CODE - DZIAŁA!"
else
    echo "❌ STATUS: $HTTP_CODE - NIE DZIAŁA"
fi
echo ""

# Test 2: Branding file endpoint
echo "Test 2: Branding file (endpoint)"
echo "URL: https://backend-production-df8c.up.railway.app/api/v1/exhibitor-branding/serve/global/4e4b468e-125a-486c-bc80-b2194db0841a_1759478288613.webp"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://backend-production-df8c.up.railway.app/api/v1/exhibitor-branding/serve/global/4e4b468e-125a-486c-bc80-b2194db0841a_1759478288613.webp")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ STATUS: $HTTP_CODE - DZIAŁA!"
else
    echo "❌ STATUS: $HTTP_CODE - NIE DZIAŁA"
fi
echo ""

# Test 3: JSON endpoint - sprawdź czy logo jest URL zamiast base64
echo "Test 3: JSON endpoint - sprawdzanie logoUrl"
echo "URL: https://backend-production-df8c.up.railway.app/public/exhibitions/2/exhibitors/1108.json"
JSON=$(curl -s "https://backend-production-df8c.up.railway.app/public/exhibitions/2/exhibitors/1108.json")
LOGO_URL=$(echo "$JSON" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['companyInfo']['logoUrl'][:100] if data['companyInfo']['logoUrl'] else 'null')")
echo "Logo URL (pierwsze 100 znaków): $LOGO_URL"

if [[ "$LOGO_URL" == data:* ]]; then
    echo "⚠️  UWAGA: Logo nadal jest zwracane jako base64!"
    echo "To jest OK dla kompatybilności wstecznej, ale nowe loga powinny być URL-ami"
elif [[ "$LOGO_URL" == http* ]]; then
    echo "✅ Logo jest zwracane jako URL!"
else
    echo "❓ Logo: $LOGO_URL"
fi
echo ""

echo "=================================="
echo "📊 PODSUMOWANIE"
echo "=================================="
echo ""
echo "Przykładowe linki do sprawdzenia w przeglądarce:"
echo ""
echo "1. Marketing material:"
echo "   https://backend-production-df8c.up.railway.app/uploads/marketing-materials/benefit-1759388705632-28627868.svg"
echo ""
echo "2. Branding file:"
echo "   https://backend-production-df8c.up.railway.app/api/v1/exhibitor-branding/serve/global/4e4b468e-125a-486c-bc80-b2194db0841a_1759478288613.webp"
echo ""
echo "3. JSON z danymi wystawcy:"
echo "   https://backend-production-df8c.up.railway.app/public/exhibitions/2/exhibitors/1108.json"
echo ""

