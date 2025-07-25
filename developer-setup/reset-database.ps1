# PTAK EXPO - Reset Database (Windows)

Write-Host "=== Resetting PTAK EXPO Database ==="

# Drop and recreate database
Write-Host "Dropping database..."
dropdb -U postgres ptak_expo_dev 2>$null

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
