# PTAK EXPO - Test Setup Script (Windows)
# Sprawdza czy instalacja przebiegła pomyślnie

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Status {
    param($Message)
    Write-Host "[TEST] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param($Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

Write-Status "=== Testing PTAK EXPO Setup ==="

# Test 1: Check if directories exist
Write-Status "Checking project structure..."
if ((Test-Path "ptak-expo-backend") -and (Test-Path "ptak-expo-frontend")) {
    Write-Success "Project directories exist"
} else {
    Write-Error-Custom "Missing project directories"
    exit 1
}

# Test 2: Check if dependencies are installed
Write-Status "Checking backend dependencies..."
if (Test-Path "ptak-expo-backend\node_modules") {
    Write-Success "Backend dependencies installed"
} else {
    Write-Error-Custom "Backend dependencies not installed"
    exit 1
}

Write-Status "Checking frontend dependencies..."
if (Test-Path "ptak-expo-frontend\node_modules") {
    Write-Success "Frontend dependencies installed"
} else {
    Write-Error-Custom "Frontend dependencies not installed"
    exit 1
}

# Test 3: Check configuration files
Write-Status "Checking configuration files..."
if (Test-Path "ptak-expo-backend\.env") {
    Write-Success "Backend .env file exists"
} else {
    Write-Error-Custom "Backend .env file missing"
    exit 1
}

if (Test-Path "ptak-expo-frontend\src\config\config.ts") {
    Write-Success "Frontend config file exists"
} else {
    Write-Error-Custom "Frontend config file missing"
    exit 1
}

# Test 4: Check database connection
Write-Status "Checking database connection..."
try {
    $dbTest = psql -U postgres -d ptak_expo_dev -c "SELECT 1;" 2>$null
    Write-Success "Database connection successful"
} catch {
    Write-Error-Custom "Database connection failed"
    exit 1
}

# Test 5: Check database tables
Write-Status "Checking database tables..."
try {
    $tableCount = psql -U postgres -d ptak_expo_dev -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
    $tableCount = $tableCount.Trim()
    if ([int]$tableCount -gt 0) {
        Write-Success "Database tables exist ($tableCount tables)"
    } else {
        Write-Error-Custom "No database tables found"
        exit 1
    }
} catch {
    Write-Error-Custom "Cannot check database tables"
    exit 1
}

# Test 6: Check if backend can start
Write-Status "Testing backend startup..."
Set-Location "ptak-expo-backend"

$backendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    npm start
} -ArgumentList (Get-Location)

Start-Sleep -Seconds 10

if ($backendJob.State -eq "Running") {
    Write-Success "Backend starts successfully"
    Stop-Job $backendJob
    Remove-Job $backendJob
} else {
    Write-Error-Custom "Backend failed to start"
    Receive-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

Set-Location ".."

# Test 7: API Test
Write-Status "Testing API endpoint..."
Set-Location "ptak-expo-backend"

$apiJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    npm start
} -ArgumentList (Get-Location)

Start-Sleep -Seconds 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001" -Method Get -TimeoutSec 5
    Write-Success "API endpoint responsive"
} catch {
    Write-Error-Custom "API endpoint not responding"
    Stop-Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob -ErrorAction SilentlyContinue
    exit 1
}

Stop-Job $apiJob -ErrorAction SilentlyContinue
Remove-Job $apiJob -ErrorAction SilentlyContinue

Set-Location ".."

Write-Success "=== All Tests Passed! ==="
Write-Success "Setup is complete and working correctly"
Write-Success "You can now start development with:"
Write-Success "  powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1"
