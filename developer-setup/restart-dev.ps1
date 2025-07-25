# PTAK EXPO - Restart Development Environment (Windows)

Write-Host "=== Restarting PTAK EXPO Development Environment ==="

# Kill existing processes
Write-Host "Stopping existing processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start services
Write-Host "Starting services..."
& ".\developer-setup\start-dev.ps1"
