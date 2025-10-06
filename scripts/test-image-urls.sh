#!/bin/bash

echo "🔍 Testing image URLs availability..."
echo ""

# Test 1: Global branding file (no auth required)
echo "Test 1: Global branding file (should work without auth)"
echo "URL: https://backend-production-df8c.up.railway.app/api/v1/exhibitor-branding/serve/global/4e4b468e-125a-486c-bc80-b2194db0841a_1759478288613.webp"
curl -I "https://backend-production-df8c.up.railway.app/api/v1/exhibitor-branding/serve/global/4e4b468e-125a-486c-bc80-b2194db0841a_1759478288613.webp" 2>/dev/null | head -n 10
echo ""

# Test 2: Marketing material (static file - might not work)
echo "Test 2: Marketing material (static file path)"
echo "URL: https://backend-production-df8c.up.railway.app/uploads/marketing-materials/benefit-1759388705632-28627868.svg"
curl -I "https://backend-production-df8c.up.railway.app/uploads/marketing-materials/benefit-1759388705632-28627868.svg" 2>/dev/null | head -n 10
echo ""

# Test 3: Public document endpoint
echo "Test 3: Public document endpoint"
echo "URL: https://backend-production-df8c.up.railway.app/public/exhibitions/2/exhibitors/1108.json"
curl -s "https://backend-production-df8c.up.railway.app/public/exhibitions/2/exhibitors/1108.json" | head -c 200
echo "..."
echo ""

echo "Test 4: Check if /uploads is served as static"
echo "Trying direct uploads path..."
curl -I "https://backend-production-df8c.up.railway.app/uploads/" 2>/dev/null | head -n 5
echo ""

echo "🔍 Analysis:"
echo "- If Test 1 returns 200 OK -> branding files work"
echo "- If Test 2 returns 404 -> static file serving is NOT configured"
echo "- If Test 3 returns JSON -> public endpoints work"
echo "- If Test 4 returns 404 -> /uploads is not served statically"

