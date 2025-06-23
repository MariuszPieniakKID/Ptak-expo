# 🚀 Przewodnik Deployment PTAK EXPO

Kompleksowy przewodnik wdrażania systemu PTAK EXPO na platformy produkcyjne.

## 📋 Przegląd Deployment

| Komponent | Platforma | URL |
|-----------|-----------|-----|
| Backend API | Railway/Heroku | https://api.ptakexpo.com |
| Aplikacja WWW | Vercel | https://ptakexpo.vercel.app |
| Baza Danych | Neon.tech | Zarządzana |
| Aplikacja Mobilna | App Store/Google Play | Store |

## 🗄️ 1. Deployment Bazy Danych (Neon.tech)

### Krok 1: Utworzenie bazy danych
1. Przejdź do [neon.tech](https://neon.tech)
2. Utwórz konto i nowy projekt
3. Wybierz region (zalecane: najbliższy użytkownikom)
4. Skopiuj **connection string**

### Krok 2: Konfiguracja
```sql
-- Tabele zostaną utworzone automatycznie przez backend
-- Connection string format:
postgresql://username:password@host/database?sslmode=require
```

---

## 🔧 2. Deployment Backend API

### Opcja A: Railway (Zalecane)

#### Krok 1: Przygotowanie
```bash
cd ptak-expo-backend

# Instalacja Railway CLI
npm install -g @railway/cli

# Login
railway login
```

#### Krok 2: Deploy
```bash
# Inicjalizacja projektu
railway init

# Deploy
railway up
```

#### Krok 3: Zmienne środowiskowe
W Railway dashboard ustaw:
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=super-secret-production-key
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-domain.com
TEST_EMAIL=test@test.com
TEST_PASSWORD=test123
```

### Opcja B: Heroku

#### Krok 1: Przygotowanie
```bash
# Instalacja Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login
```

#### Krok 2: Deploy
```bash
cd ptak-expo-backend

# Utworzenie aplikacji
heroku create ptak-expo-backend

# Konfiguracja zmiennych
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=postgresql://...
heroku config:set JWT_SECRET=super-secret-key

# Deploy
git push heroku main
```

---

## 🌐 3. Deployment Aplikacji WWW (Vercel)

### Krok 1: Przygotowanie
```bash
cd ptak-expo-web

# Instalacja Vercel CLI
npm install -g vercel

# Login
vercel login
```

### Krok 2: Konfiguracja środowiskowa
Utwórz plik `.env.production`:
```env
REACT_APP_API_URL=https://your-backend-url.railway.app/api/v1
REACT_APP_APP_NAME=PTAK EXPO
```

### Krok 3: Deploy
```bash
# Pierwsze wdrożenie
vercel

# Ustawienie domeny produkcyjnej
vercel --prod
```

### Krok 4: Zmienne środowiskowe w Vercel
1. Przejdź do Vercel Dashboard
2. Wybierz projekt
3. Settings → Environment Variables
4. Dodaj:
   - `REACT_APP_API_URL`: URL do backend API
   - `REACT_APP_APP_NAME`: PTAK EXPO

### Krok 5: Domena niestandardowa
1. W Vercel Dashboard → Settings → Domains
2. Dodaj swoją domenę (np. `ptakexpo.com`)
3. Skonfiguruj DNS zgodnie z instrukcjami

---

## 📱 4. Deployment Aplikacji Mobilnej

### Android (Google Play Store)

#### Krok 1: Przygotowanie
```bash
cd PtakExpoMobile

# Aktualizacja konfiguracji API
# W src/services/api.js zmień BASE_URL na produkcyjny
```

#### Krok 2: Generowanie signed APK
```bash
# Konfiguracja keystore (jednorazowo)
cd android/app
keytool -genkey -v -keystore release-key.keystore -alias release-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Konfiguracja gradle
# Edytuj android/gradle.properties i android/app/build.gradle
```

#### Krok 3: Build release
```bash
cd android
./gradlew assembleRelease

# AAB dla Google Play Store
./gradlew bundleRelease
```

#### Krok 4: Upload do Google Play Console
1. Przejdź do [Google Play Console](https://play.google.com/console)
2. Utwórz nową aplikację
3. Upload pliku AAB
4. Wypełnij metadane aplikacji
5. Uruchom internal testing → closed testing → production

### iOS (App Store)

#### Krok 1: Konfiguracja Xcode
```bash
cd PtakExpoMobile

# Aktualizacja podów
cd ios
pod install
cd ..

# Otwórz w Xcode
xed -b ios
```

#### Krok 2: Konfiguracja projektu
1. W Xcode ustaw **Bundle Identifier**
2. Wybierz **Team** (Apple Developer Account)
3. Skonfiguruj **App Icons** i **Launch Screen**

#### Krok 3: Archive i upload
1. Product → Archive
2. Distribute App → App Store Connect
3. Upload to App Store Connect

#### Krok 4: App Store Connect
1. Przejdź do [App Store Connect](https://appstoreconnect.apple.com)
2. Skonfiguruj metadane aplikacji
3. Dodaj screenshots
4. Submit for Review

---

## 🔄 5. CI/CD Pipeline

### GitHub Actions dla Backend

Utwórz `.github/workflows/backend.yml`:
```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths: ['ptak-expo-backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd ptak-expo-backend
          npm ci
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### GitHub Actions dla Frontend

Utwórz `.github/workflows/frontend.yml`:
```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths: ['ptak-expo-web/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        run: |
          cd ptak-expo-web
          npm ci
          npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
      
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 🛡️ 6. Konfiguracja Bezpieczeństwa

### Backend Security Headers
```javascript
// W src/index.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### CORS Configuration
```javascript
app.use(cors({
  origin: [
    'https://ptakexpo.vercel.app',
    'https://ptakexpo.com'
  ],
  credentials: true
}));
```

### Environment Variables Security
- Użyj strong JWT secrets w produkcji
- Nigdy nie commituj plików .env
- Używaj secrets management platform

---

## 📊 7. Monitoring i Logging

### Backend Monitoring
```javascript
// Dodaj do backend
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Vercel Analytics
1. W Vercel Dashboard włącz Analytics
2. Dodaj Vercel Speed Insights
3. Konfiguruj alerts dla downtime

---

## 🧪 8. Testowanie Deployment

### Backend Health Checks
```bash
# Test API
curl https://your-api-url.railway.app/api/v1/health

# Test logowania
curl -X POST https://your-api-url.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Frontend Testing
1. Otwórz aplikację w przeglądarce
2. Sprawdź console devtools (brak błędów)
3. Przetestuj logowanie
4. Sprawdź responsywność

### Mobile Testing
1. Zaktualizuj API URL w aplikacji mobilnej
2. Przetestuj na urządzeniach testowych
3. Sprawdź połączenie z produkcyjnym API

---

## 📋 9. Checklist Pre-Production

### Backend:
- [ ] Baza danych skonfigurowana na Neon.tech
- [ ] Zmienne środowiskowe ustawione
- [ ] CORS skonfigurowany dla frontend domain
- [ ] SSL/HTTPS włączone
- [ ] Logging skonfigurowane

### Frontend:
- [ ] API URL wskazuje na produkcyjny backend
- [ ] Build prodocyjny testowany lokalnie
- [ ] Zmienne środowiskowe w Vercel ustawione
- [ ] Custom domain skonfigurowana (opcjonalnie)

### Mobile:
- [ ] API URL zaktualizowany
- [ ] Icons i splash screens dodane
- [ ] Signing certificates skonfigurowane
- [ ] Store listings przygotowane

---

## 🆘 10. Troubleshooting

### Częste problemy:

#### CORS Errors
```javascript
// Sprawdź CORS configuration w backend
// Upewnij się że frontend domain jest w allowedOrigins
```

#### API Connection Issues
```bash
# Sprawdź czy backend odpowiada
curl https://your-api-url/api/v1/health

# Sprawdź DNS
nslookup your-domain.com
```

#### Mobile App nie łączy się z API
- Sprawdź czy używasz HTTPS URL
- Na fizycznych urządzeniach nie używaj localhost
- Sprawdź firewall i network permissions

---

## 📈 11. Post-Deployment

### Monitoring:
- Ustaw alerty dla downtime
- Monitoruj performance metrics  
- Śledź błędy w logach

### Backup:
- Automatyczne backup bazy danych (Neon.tech)
- Backup kodu w Git repository
- Dokumentacja deployment procedures

### Updates:
- Plan dla rolling updates
- Staged deployment (staging → production)
- Rollback procedures

---

**Sukces! System PTAK EXPO jest gotowy do produkcji! 🎉** 