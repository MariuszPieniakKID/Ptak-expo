# PTAK EXPO - Check System Requirements (Windows)
# Sprawdza czy system Windows spełnia wymagania do uruchomienia projektu

# Colors for output
function Write-Status {
    param($Message)
    Write-Host "[CHECK] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Status "=== PTAK EXPO - Windows System Requirements Check ==="

# Check Windows version
Write-Status "Checking Windows version..."
$osInfo = Get-WmiObject -Class Win32_OperatingSystem
$windowsVersion = $osInfo.Version
$windowsName = $osInfo.Caption

Write-Success "Windows: $windowsName (Version: $windowsVersion)"

# Check PowerShell version
Write-Status "Checking PowerShell version..."
$psVersion = $PSVersionTable.PSVersion
if ($psVersion.Major -ge 5) {
    Write-Success "PowerShell version: $psVersion"
} else {
    Write-Warning "PowerShell version $psVersion is old. Recommend PowerShell 5.1+"
}

# Check Node.js
Write-Status "Checking Node.js..."
try {
    $nodeVersion = node --version
    $nodeVersionNumber = $nodeVersion.Substring(1)
    
    if ([version]$nodeVersionNumber -ge [version]"20.19.1") {
        Write-Success "Node.js version $nodeVersion (>= 20.19.1 required)"
    } else {
        Write-Error-Custom "Node.js version $nodeVersion is too old (>= 20.19.1 required)"
        Write-Host "Download from: https://nodejs.org" -ForegroundColor Yellow
    }
} catch {
    Write-Error-Custom "Node.js not found. Please install Node.js"
    Write-Host "Download from: https://nodejs.org" -ForegroundColor Yellow
}

# Check npm
Write-Status "Checking npm..."
try {
    $npmVersion = npm --version
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Error-Custom "npm not found. Usually comes with Node.js"
}

# Check PostgreSQL
Write-Status "Checking PostgreSQL..."
try {
    $pgVersion = psql --version
    Write-Success "PostgreSQL: $pgVersion"
    
    # Check if PostgreSQL service is running
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService) {
        if ($pgService.Status -eq "Running") {
            Write-Success "PostgreSQL service is running"
        } else {
            Write-Warning "PostgreSQL service is not running"
            Write-Host "Start with: net start postgresql-x64-15" -ForegroundColor Yellow
        }
    } else {
        Write-Warning "PostgreSQL service not found"
    }
} catch {
    Write-Error-Custom "PostgreSQL not found or not in PATH"
    Write-Host "Install from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "Add to PATH: C:\Program Files\PostgreSQL\15\bin" -ForegroundColor Yellow
}

# Check Git
Write-Status "Checking Git..."
try {
    $gitVersion = git --version
    Write-Success "Git: $gitVersion"
} catch {
    Write-Error-Custom "Git not found. Please install Git for Windows"
    Write-Host "Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
}

# Check available ports
Write-Status "Checking available ports..."
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Warning "Port 3000 is in use"
    Write-Host "Process using port 3000:" -ForegroundColor Yellow
    netstat -ano | findstr :3000
} else {
    Write-Success "Port 3000 is available"
}

if ($port3001) {
    Write-Warning "Port 3001 is in use"
    Write-Host "Process using port 3001:" -ForegroundColor Yellow
    netstat -ano | findstr :3001
} else {
    Write-Success "Port 3001 is available"
}

# Check disk space
Write-Status "Checking disk space..."
$diskInfo = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" }
$freeSpaceGB = [math]::Round($diskInfo.FreeSpace / 1GB, 2)
$totalSpaceGB = [math]::Round($diskInfo.Size / 1GB, 2)
$usedPercentage = [math]::Round((($diskInfo.Size - $diskInfo.FreeSpace) / $diskInfo.Size) * 100, 2)

if ($usedPercentage -lt 80) {
    Write-Success "Disk space OK: $freeSpaceGB GB free of $totalSpaceGB GB ($usedPercentage% used)"
} else {
    Write-Warning "Disk space is low: $freeSpaceGB GB free of $totalSpaceGB GB ($usedPercentage% used)"
}

# Check memory
Write-Status "Checking memory..."
$memoryInfo = Get-WmiObject -Class Win32_ComputerSystem
$totalMemoryGB = [math]::Round($memoryInfo.TotalPhysicalMemory / 1GB, 2)
Write-Success "Total Memory: $totalMemoryGB GB"

# Check Windows Defender/Firewall
Write-Status "Checking Windows Defender status..."
try {
    $defenderStatus = Get-MpPreference -ErrorAction SilentlyContinue
    if ($defenderStatus.DisableRealtimeMonitoring -eq $false) {
        Write-Warning "Windows Defender Real-time protection is enabled"
        Write-Host "May affect development performance. Consider adding project folder to exclusions." -ForegroundColor Yellow
    } else {
        Write-Success "Windows Defender Real-time protection is disabled"
    }
} catch {
    Write-Warning "Cannot check Windows Defender status"
}

# Check if project files exist
Write-Status "Checking project structure..."
if (Test-Path "..\ptak-expo-backend\package.json") {
    Write-Success "Backend package.json found"
} else {
    Write-Error-Custom "Backend package.json not found. Are you in the right directory?"
}

if (Test-Path "..\ptak-expo-frontend\package.json") {
    Write-Success "Frontend package.json found"
} else {
    Write-Error-Custom "Frontend package.json not found"
}

# Check Visual Studio Code
Write-Status "Checking Visual Studio Code..."
try {
    $codeVersion = code --version
    Write-Success "VS Code is installed"
} catch {
    Write-Warning "VS Code not found. Recommended for development."
    Write-Host "Download from: https://code.visualstudio.com/" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Status "=== Summary ==="
Write-Host ""
Write-Host "If all checks passed, you can proceed with:" -ForegroundColor Green
Write-Host "  1. powershell -ExecutionPolicy Bypass -File developer-setup\setup.ps1" -ForegroundColor Green
Write-Host "  2. powershell -ExecutionPolicy Bypass -File developer-setup\test-setup.ps1" -ForegroundColor Green
Write-Host "  3. powershell -ExecutionPolicy Bypass -File developer-setup\start-dev.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "If there are errors, please fix them before continuing." -ForegroundColor Yellow
Write-Host "See DEVELOPER_SETUP_GUIDE_WINDOWS.md for detailed instructions." -ForegroundColor Yellow
