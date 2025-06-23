# 🐙 GitHub Setup - Instrukcja dla zespołu

## 📋 **Aktualny stan:**
- ✅ Projekt lokalnie w GIT (commit: `6335250`)  
- ✅ Baza danych działa (Railway PostgreSQL)
- ✅ Backend uruchomiony i połączony z bazą
- ❌ Brak połączenia z GitHub

## 🚀 **Kroki do wykonania:**

### 1. Utwórz GitHub Repository
```bash
# W przeglądarce:
# 1. Idź na https://github.com
# 2. Kliknij "New repository"
# 3. Nazwa: "ptak-expo"
# 4. Description: "Complete exhibition management system - Backend API, Web App, Mobile App"
# 5. Public/Private: wybierz
# 6. NIE zaznaczaj "Initialize with README" (mamy już kod)
# 7. Kliknij "Create repository"
```

### 2. Połącz lokalny projekt z GitHub
```bash
# W terminalu, w katalogu projektu:
git remote add origin https://github.com/TWOJ-USERNAME/ptak-expo.git
git branch -M main
git push -u origin main
```

### 3. Dodaj członków zespołu
W GitHub repository → Settings → Manage access → "Invite a collaborator"

### 4. Skonfiguruj Railway GitHub Integration
```bash
# W Railway dashboard:
# 1. Idź do Service Settings
# 2. Connect Repository → GitHub
# 3. Wybierz repository: ptak-expo
# 4. Skonfiguruj auto-deploy z branch: main
```

## 🔧 **Railway + GitHub Workflow:**

### Automatic Deployment
Po podłączeniu GitHub:
- Każdy `git push` na `main` → automatyczny deploy
- Pull Requests → deploy na środowisko testowe
- Rollback przez GitHub commits

### Environment Variables Management
```bash
# Railway automatycznie przekaże:
railway variables --set "DATABASE_URL=$DATABASE_URL" --service backend
railway variables --set "REACT_APP_API_URL=https://backend-url" --service frontend
```

## 👥 **Praca zespołowa:**

### Dla nowych deweloperów:
```bash
# Klonowanie projektu:
git clone https://github.com/TWOJ-USERNAME/ptak-expo.git
cd ptak-expo

# Backend setup:
cd ptak-expo-backend
npm install
cp .env.example .env  # i skonfiguruj DATABASE_URL
npm run dev

# Frontend setup:
cd ../ptak-expo-web  
npm install
npm start

# Mobile setup:
cd ../PtakExpoMobile
npm install
npx react-native run-android  # lub run-ios
```

### Git Workflow:
```bash
# Nowa funkcjonalność:
git checkout -b feature/nazwa-funkcji
git add .
git commit -m "feat: opis zmian"
git push origin feature/nazwa-funkcji

# Utwórz Pull Request w GitHub
# Po zaakceptowaniu → merge do main → auto-deploy
```

## 🔗 **Linki dla zespołu:**
- **GitHub Repository**: https://github.com/TWOJ-USERNAME/ptak-expo
- **Railway Project**: https://railway.com/project/e6eef5ac-c635-4027-8df0-1f39452cf9cb
- **Backend API**: https://[service-name].up.railway.app
- **Frontend App**: https://[service-name].up.railway.app

---

*Kompletny system PTAK EXPO - gotowy do pracy zespołowej* 