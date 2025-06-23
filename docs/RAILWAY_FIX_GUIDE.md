# 🚀 Railway Deployment Fix - Monorepo Problem

## ❌ **Problem:**
Railway nie może zbudować projektu z monorepo structure. Widać tylko Postgres.

## ✅ **Rozwiązanie:**

### Opcja 1: Osobne repositories (ZALECANE)
```bash
# 1. Utwórz 3 oddzielne repos na GitHub:
# - ptak-expo-backend
# - ptak-expo-web  
# - ptak-expo-mobile

# 2. Skopiuj każdy folder do osobnego repo
# 3. Połącz każdy z osobną usługą Railway
```

### Opcja 2: Docker (dla eksperta)
```dockerfile
# W ptak-expo-backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY ptak-expo-backend/package*.json ./
RUN npm install
COPY ptak-expo-backend/ ./
EXPOSE 3001
CMD ["npm", "start"]
```

### Opcja 3: Manual deploy (szybki test)
```bash
# Backend manual:
cd ptak-expo-backend
railway service backend
railway up --detach

# Frontend manual:
cd ../ptak-expo-web
railway service frontend  
railway up --detach
```

## 🔧 **Aktualny stan po naprawie:**

### Railway Services powinny być:
1. **Postgres** - ✅ Działa
2. **backend** - 🔧 Naprawiamy
3. **frontend** - 🔧 Naprawiamy

### Environment Variables:
```bash
# Backend:
DATABASE_URL=postgresql://postgres:xxx@postgres.railway.internal:5432/railway
NODE_ENV=production
PORT=3001
JWT_SECRET=xxx

# Frontend:
REACT_APP_API_URL=https://backend-xxx.up.railway.app
```

## 🎯 **Test końcowy:**
Po naprawie sprawdź:
- Railway dashboard pokazuje 3 usługi
- Backend API: https://backend-xxx.up.railway.app/api/v1/health
- Frontend: https://frontend-xxx.up.railway.app
- Login test: test@test.com / test123

---

*Monorepo na Railway wymaga specjalnej konfiguracji* 