# PTAK EXPO - Start Development Environment (Windows)
# Uruchamia backend i frontend w trybie development

Write-Host "=== Starting PTAK EXPO Development Environment ===" -ForegroundColor Blue

# Check if ports are available
$backend3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$frontend3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($backend3001) {
    Write-Host "Port 3001 is already in use (backend might be running)" -ForegroundColor Yellow
} else {
    Write-Host "Starting backend on port 3001..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-Command", "cd ptak-expo-backend; npm start" -WindowStyle Normal
}

if ($frontend3000) {
    Write-Host "Port 3000 is already in use (frontend might be running)" -ForegroundColor Yellow
} else {
    Write-Host "Starting frontend on port 3000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-Command", "cd ptak-expo-frontend; npm start" -WindowStyle Normal
}

Write-Host "Development environment is starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Login: admin@ptak-expo.com / admin123" -ForegroundColor Green

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
