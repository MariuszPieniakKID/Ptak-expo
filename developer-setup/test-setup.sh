#!/bin/bash

# PTAK EXPO - Test Setup Script
# Sprawdza czy instalacja przebiegła pomyślnie

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_status "=== Testing PTAK EXPO Setup ==="

# Test 1: Check if directories exist
print_status "Checking project structure..."
if [[ -d "ptak-expo-backend" && -d "ptak-expo-frontend" ]]; then
    print_success "Project directories exist"
else
    print_error "Missing project directories"
    exit 1
fi

# Test 2: Check if dependencies are installed
print_status "Checking backend dependencies..."
if [[ -d "ptak-expo-backend/node_modules" ]]; then
    print_success "Backend dependencies installed"
else
    print_error "Backend dependencies not installed"
    exit 1
fi

print_status "Checking frontend dependencies..."
if [[ -d "ptak-expo-frontend/node_modules" ]]; then
    print_success "Frontend dependencies installed"
else
    print_error "Frontend dependencies not installed"
    exit 1
fi

# Test 3: Check configuration files
print_status "Checking configuration files..."
if [[ -f "ptak-expo-backend/.env" ]]; then
    print_success "Backend .env file exists"
else
    print_error "Backend .env file missing"
    exit 1
fi

if [[ -f "ptak-expo-frontend/src/config/config.ts" ]]; then
    print_success "Frontend config file exists"
else
    print_error "Frontend config file missing"
    exit 1
fi

# Test 4: Check database
print_status "Checking database connection..."
if psql -U postgres -d ptak_expo_dev -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
    exit 1
fi

# Test 5: Check database tables
print_status "Checking database tables..."
TABLES=$(psql -U postgres -d ptak_expo_dev -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
if [[ $TABLES -gt 0 ]]; then
    print_success "Database tables exist ($TABLES tables)"
else
    print_error "No database tables found"
    exit 1
fi

# Test 6: Check if backend can start
print_status "Testing backend startup..."
cd ptak-expo-backend
timeout 10s npm start > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 5

if kill -0 $BACKEND_PID 2>/dev/null; then
    print_success "Backend starts successfully"
    kill $BACKEND_PID
else
    print_error "Backend failed to start"
    exit 1
fi

cd ..

# Test 7: API Test
print_status "Testing API endpoint..."
cd ptak-expo-backend
npm start > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 5

if curl -s http://localhost:3001 > /dev/null; then
    print_success "API endpoint responsive"
    kill $BACKEND_PID
else
    print_error "API endpoint not responding"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd ..

print_success "=== All Tests Passed! ==="
print_success "Setup is complete and working correctly"
print_success "You can now start development with:"
print_success "  ./developer-setup/start-dev.sh"
