# PTAK EXPO - Setup Script for Windows
# Autor: Assistant
# Wersja: 1.0

# Enable strict error handling
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Status "=== PTAK EXPO - Windows Developer Setup ==="
Write-Status "Setting up development environment..."

# Check if running from correct directory
if (!(Test-Path "ptak-expo-backend") -or !(Test-Path "ptak-expo-frontend")) {
    Write-Error-Custom "Please run this script from the root of Ptak-expo project"
    exit 1
}

# Check requirements
Write-Status "Checking system requirements..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
} catch {
    Write-Error-Custom "Node.js is not installed. Please install Node.js v20.19.1 or newer from https://nodejs.org"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Error-Custom "npm is not installed"
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version
    Write-Success "PostgreSQL is installed: $pgVersion"
} catch {
    Write-Error-Custom "PostgreSQL is not installed or not in PATH. Please install PostgreSQL 15+ from https://www.postgresql.org/download/windows/"
    exit 1
}

# Check if database exists
try {
    $dbExists = psql -U postgres -lqt | Select-String "ptak_expo_dev"
    if ($dbExists) {
        Write-Success "Database ptak_expo_dev already exists"
    } else {
        Write-Warning "Database ptak_expo_dev does not exist. Creating..."
        createdb -U postgres ptak_expo_dev
        Write-Success "Database ptak_expo_dev created"
    }
} catch {
    Write-Error-Custom "Cannot connect to PostgreSQL. Please check if PostgreSQL service is running."
    Write-Host "Try: net start postgresql-x64-15"
    exit 1
}

# Setup Backend
Write-Status "Setting up backend..."
Set-Location "ptak-expo-backend"

# Install dependencies
Write-Status "Installing backend dependencies..."
npm install

# Setup .env file
if (!(Test-Path ".env")) {
    Write-Status "Creating .env file..."
    Copy-Item "..\developer-setup\.env.example" ".env"
    Write-Success ".env file created"
} else {
    Write-Warning ".env file already exists"
}

# Import database
Write-Status "Importing database..."
if (Test-Path "..\developer-setup\ptak_expo_dev_dump.sql") {
    psql -U postgres -d ptak_expo_dev -f "..\developer-setup\ptak_expo_dev_dump.sql" | Out-Null
    Write-Success "Database imported successfully"
} else {
    Write-Warning "Database dump not found. Using default initialization..."
}

Set-Location ".."

# Setup Frontend
Write-Status "Setting up frontend..."
Set-Location "ptak-expo-frontend"

# Install dependencies
Write-Status "Installing frontend dependencies..."
npm install

# Setup config file
if (!(Test-Path "src\config\config.ts")) {
    Write-Status "Creating config file..."
    Copy-Item "..\developer-setup\config.example.ts" "src\config\config.ts"
    Write-Success "Config file created"
} else {
    Write-Warning "Config file already exists"
}

Set-Location ".."

# Create launch scripts
Write-Status "Creating launch scripts..."

# Create start-dev.ps1
@"
# PTAK EXPO - Start Development Environment (Windows)
# Uruchamia backend i frontend w trybie development

Write-Host "=== Starting PTAK EXPO Development Environment ===" -ForegroundColor Blue

# Check if ports are available
`$backend3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
`$frontend3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if (`$backend3001) {
    Write-Host "Port 3001 is already in use (backend might be running)" -ForegroundColor Yellow
} else {
    Write-Host "Starting backend on port 3001..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-Command", "cd ptak-expo-backend; npm start" -WindowStyle Normal
}

if (`$frontend3000) {
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
`$null = `$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
"@ | Out-File -FilePath "developer-setup\start-dev.ps1" -Encoding UTF8

# Create restart script
@"
# PTAK EXPO - Restart Development Environment (Windows)

Write-Host "=== Restarting PTAK EXPO Development Environment ==="

# Kill existing processes
Write-Host "Stopping existing processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start services
Write-Host "Starting services..."
& ".\developer-setup\start-dev.ps1"
"@ | Out-File -FilePath "developer-setup\restart-dev.ps1" -Encoding UTF8

# Create clean cache script
@"
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
"@ | Out-File -FilePath "developer-setup\clean-cache.ps1" -Encoding UTF8

# Create reset database script
@"
# PTAK EXPO - Reset Database (Windows)

Write-Host "=== Resetting PTAK EXPO Database ==="

# Drop and recreate database
Write-Host "Dropping database..."
dropdb -U postgres ptak_expo_dev 2>`$null

Write-Host "Creating database..."
createdb -U postgres ptak_expo_dev

# Import dump
if (Test-Path "developer-setup\ptak_expo_dev_dump.sql") {
    Write-Host "Importing database dump..."
    psql -U postgres -d ptak_expo_dev -f "developer-setup\ptak_expo_dev_dump.sql" | Out-Null
    Write-Host "Database reset successfully!"
} else {
    Write-Host "Database dump not found. Please run backend to initialize with default data."
}
"@ | Out-File -FilePath "developer-setup\reset-database.ps1" -Encoding UTF8

Write-Success "=== Setup Complete! ==="
Write-Success "You can now run the development environment with:"
Write-Success "  powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1"
Write-Success ""
Write-Success "Or start services manually:"
Write-Success "  Terminal 1: cd ptak-expo-backend && npm start"
Write-Success "  Terminal 2: cd ptak-expo-frontend && npm start"
Write-Success ""
Write-Success "Access the application at:"
Write-Success "  Backend API: http://localhost:3001"
Write-Success "  Frontend: http://localhost:3000"
Write-Success "  Login: admin@ptak-expo.com / admin123"
Write-Success ""
Write-Success "For help, see: developer-setup\DEVELOPER_SETUP_GUIDE_WINDOWS.md"
