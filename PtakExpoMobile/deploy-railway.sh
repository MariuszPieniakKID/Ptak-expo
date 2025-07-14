#!/bin/bash

# Railway Deployment Script dla Ptak-expo Mobile
# Autor: AI Assistant
# Data: 14 lipca 2025

echo "🚀 Rozpoczynanie deploymentu Ptak-expo Mobile na Railway..."

# Sprawdź czy Railway CLI jest zainstalowane
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI nie jest zainstalowane."
    echo "📦 Instalowanie Railway CLI..."
    npm install -g @railway/cli
fi

# Sprawdź czy użytkownik jest zalogowany do Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Musisz się zalogować do Railway:"
    railway login
fi

# Sprawdź czy jesteśmy w poprawnym katalogu
if [ ! -f "package.json" ]; then
    echo "❌ Nie znaleziono package.json. Upewnij się, że jesteś w katalogu PtakExpoMobile."
    exit 1
fi

# Sprawdź czy railway.toml istnieje
if [ ! -f "railway.toml" ]; then
    echo "❌ Nie znaleziono railway.toml. Plik konfiguracyjny jest wymagany."
    exit 1
fi

echo "📋 Informacje o projekcie:"
echo "  - Nazwa: Ptak-expo Mobile Web"
echo "  - Typ: React Native Web + Express"
echo "  - Port: 3000"
echo "  - Health check: /api/health"

# Zbuduj aplikację lokalnie przed deploymentem
echo "🔨 Budowanie aplikacji..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Błąd podczas budowania aplikacji."
    exit 1
fi

echo "✅ Aplikacja zbudowana pomyślnie."

# Utwórz nowy projekt Railway
echo "🏗️ Tworzenie nowego projektu Railway..."
railway link

# Ustaw zmienne środowiskowe
echo "🔧 Ustawianie zmiennych środowiskowych..."
railway variables set NODE_ENV=production
railway variables set PORT=3000

# Wdróż aplikację
echo "🚀 Wdrażanie aplikacji na Railway..."
railway up

echo "✅ Deployment zakończony!"
echo ""
echo "🔗 Twoja aplikacja będzie dostępna pod adresem:"
echo "   https://ptak-expo-mobile-web-production.up.railway.app"
echo ""
echo "🔍 Sprawdź status deploymentu:"
echo "   railway status"
echo ""
echo "📊 Wyświetl logi:"
echo "   railway logs"
echo ""
echo "🏥 Sprawdź health check:"
echo "   curl https://ptak-expo-mobile-web-production.up.railway.app/api/health" 