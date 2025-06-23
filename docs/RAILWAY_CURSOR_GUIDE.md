# 🚀 Railway + Cursor - Kompletny Przewodnik

## ✅ Wykonane kroki

### 1. Railway CLI - Zainstalowane i skonfigurowane
```bash
brew install railway
railway login --browserless  # Użyte dla logowania
railway whoami               # pieniak@gmail.com
```

### 2. Projekt Railway - Utworzony
```bash
railway init --name "ptak-expo"
railway add --database postgres
```

### 3. Backend i Frontend - Wdrożone
- Backend: `/ptak-expo-backend` → Railway Service
- Frontend: `/ptak-expo-web` → Railway Service  
- Database: PostgreSQL → Railway Service

## 🎯 Konfiguracja Cursor + Railway MCP

### 4. Instalacja Railway MCP Server dla Cursor

```bash
# Terminal - Instalacja Railway MCP
npm install -g @railway/mcp-server
```

### 5. Konfiguracja Cursor

W Cursor Settings → Extensions → MCP Servers, dodaj:

```json
{
  "railway": {
    "command": "railway-mcp",
    "args": [],
    "env": {
      "RAILWAY_TOKEN": "your-project-token-here"
    }
  }
}
```

### 6. Uzyskanie Railway Project Token

```bash
# W terminalu - w katalogu projektu
railway auth:token
```

Skopiuj token i wklej do konfiguracji Cursor.

## 🔧 Dostępne funkcje z Cursor

Po konfiguracji MCP, mogę automatycznie:

1. **Deployment Operations**
   - `railway up` - Deploy aplikacji
   - `railway redeploy` - Redeploy usługi
   - `railway down` - Stop deployment

2. **Service Management**
   - `railway add` - Dodawanie usług
   - `railway variables` - Zarządzanie env vars
   - `railway logs` - Podgląd logów

3. **Database Operations**
   - `railway connect postgres` - Połączenie z bazą
   - Automatyczne wykonywanie SQL

4. **Environment Management**
   - `railway environment` - Przełączanie środowisk
   - `railway link` - Linkowanie usług

## 🌐 Adresy aplikacji

Po wdrożeniu, Twoje aplikacje są dostępne pod:

- **Backend API**: https://[random-name].up.railway.app
- **Frontend WWW**: https://[random-name].up.railway.app  
- **Database**: Railway Private Network

## 📋 Następne kroki

1. **Skonfiguruj domeny**:
   ```bash
   railway domain backend.ptak-expo.com --service backend
   railway domain app.ptak-expo.com --service frontend
   ```

2. **Environment Variables**:
   ```bash
   railway variables --set "DATABASE_URL=$DATABASE_URL" --service backend
   railway variables --set "REACT_APP_API_URL=https://backend.ptak-expo.com" --service frontend
   ```

3. **SSL Certificates**: Railway automatycznie dodaje SSL

## 🤖 Testowanie integracji Cursor

Po skonfigurowaniu MCP, przetestuj:

```
W Cursor chat: "Deploy my backend to Railway"
W Cursor chat: "Show me logs from my Railway service"  
W Cursor chat: "Update environment variable API_KEY=newvalue"
```

## 💡 Tips & Tricks

- Railway automatycznie wykrywa Node.js projekty
- Build cache usprawnia kolejne deploymenty
- Wszystkie usługi komunikują się przez Railway Private Network
- Bezpłatny tier: 500 godzin runtime miesięcznie

## 🔗 Links

- **Railway Dashboard**: https://railway.com/project/e6eef5ac-c635-4027-8df0-1f39452cf9cb
- **Documentation**: https://docs.railway.com
- **Railway MCP**: https://github.com/railwayapp/mcp-server

---

*Projekt PTAK EXPO - Kompletny system targowy na Railway* 