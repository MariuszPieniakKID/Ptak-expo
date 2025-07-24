# PTAK EXPO - Clean Cache and Reinstall Dependencies (Windows)

Write-Host "=== Cleaning PTAK EXPO Cache ==="

# Backend
Write-Host "Cleaning backend cache..."
Set-Location "ptak-expo-backend"
Remove-Item -Recurse -Force "node_modules", "package-lock.json" -ErrorAction SilentlyContinue
npm install
Set-Location ".."

# Frontend
Write-Host "Cleaning frontend cache..."
Set-Location "ptak-expo-frontend"
Remove-Item -Recurse -Force "node_modules", "package-lock.json" -ErrorAction SilentlyContinue
npm install
Set-Location ".."

Write-Host "Cache cleaned successfully!"
