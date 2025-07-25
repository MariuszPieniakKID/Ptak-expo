#!/bin/bash

# PTAK EXPO - Setup Script for New Developer
# Autor: Assistant
# Wersja: 1.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from correct directory
if [[ ! -d "ptak-expo-backend" || ! -d "ptak-expo-frontend" ]]; then
    print_error "Please run this script from the root of Ptak-expo project"
    exit 1
fi

print_status "=== PTAK EXPO - Developer Setup ==="
print_status "Setting up development environment..."

# Check requirements
print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v20.19.1 or newer"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
print_success "Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "npm version: $(npm --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first"
    exit 1
fi

print_success "PostgreSQL is installed"

# Check if database exists
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw ptak_expo_dev; then
    print_warning "Database ptak_expo_dev does not exist. Creating..."
    createdb -U postgres ptak_expo_dev
    print_success "Database ptak_expo_dev created"
else
    print_success "Database ptak_expo_dev already exists"
fi

# Setup Backend
print_status "Setting up backend..."
cd ptak-expo-backend

# Install dependencies
print_status "Installing backend dependencies..."
npm install

# Setup .env file
if [[ ! -f ".env" ]]; then
    print_status "Creating .env file..."
    cp ../developer-setup/.env.example .env
    print_success ".env file created"
else
    print_warning ".env file already exists"
fi

# Import database
print_status "Importing database..."
if [[ -f "../developer-setup/ptak_expo_dev_dump.sql" ]]; then
    psql -U postgres -d ptak_expo_dev -f ../developer-setup/ptak_expo_dev_dump.sql > /dev/null 2>&1
    print_success "Database imported successfully"
else
    print_warning "Database dump not found. Using default initialization..."
fi

cd ..

# Setup Frontend
print_status "Setting up frontend..."
cd ptak-expo-frontend

# Install dependencies
print_status "Installing frontend dependencies..."
npm install

# Setup config file
if [[ ! -f "src/config/config.ts" ]]; then
    print_status "Creating config file..."
    cp ../developer-setup/config.example.ts src/config/config.ts
    print_success "Config file created"
else
    print_warning "Config file already exists"
fi

cd ..

# Create launch scripts
print_status "Creating launch scripts..."

# Create start-dev.sh
cat > developer-setup/start-dev.sh << 'SCRIPT_EOF'
#!/bin/bash

# PTAK EXPO - Start Development Environment
# Uruchamia backend i frontend w trybie development

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Starting PTAK EXPO Development Environment ===${NC}"

# Check if ports are available
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}Port 3001 is already in use (backend might be running)${NC}"
else
    echo -e "${GREEN}Starting backend on port 3001...${NC}"
    cd ptak-expo-backend
    npm start &
    BACKEND_PID=$!
    cd ..
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}Port 3000 is already in use (frontend might be running)${NC}"
else
    echo -e "${GREEN}Starting frontend on port 3000...${NC}"
    cd ptak-expo-frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
fi

echo -e "${GREEN}Development environment is starting...${NC}"
echo -e "${GREEN}Backend: http://localhost:3001${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Login: admin@ptak-expo.com / admin123${NC}"

# Wait for user input to stop
echo "Press Ctrl+C to stop all services"
trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' INT
wait
SCRIPT_EOF

chmod +x developer-setup/start-dev.sh

# Create restart script
cat > developer-setup/restart-dev.sh << 'SCRIPT_EOF'
#!/bin/bash

# PTAK EXPO - Restart Development Environment

echo "=== Restarting PTAK EXPO Development Environment ==="

# Kill existing processes
echo "Stopping existing processes..."
pkill -f "node src/index.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

sleep 2

# Start services
echo "Starting services..."
./developer-setup/start-dev.sh
SCRIPT_EOF

chmod +x developer-setup/restart-dev.sh

# Create clean cache script
cat > developer-setup/clean-cache.sh << 'SCRIPT_EOF'
#!/bin/bash

# PTAK EXPO - Clean Cache and Reinstall Dependencies

echo "=== Cleaning PTAK EXPO Cache ==="

# Backend
echo "Cleaning backend cache..."
cd ptak-expo-backend
rm -rf node_modules package-lock.json
npm install
cd ..

# Frontend
echo "Cleaning frontend cache..."
cd ptak-expo-frontend
rm -rf node_modules package-lock.json
npm install
cd ..

echo "Cache cleaned successfully!"
SCRIPT_EOF

chmod +x developer-setup/clean-cache.sh

# Create reset database script
cat > developer-setup/reset-database.sh << 'SCRIPT_EOF'
#!/bin/bash

# PTAK EXPO - Reset Database

echo "=== Resetting PTAK EXPO Database ==="

# Drop and recreate database
echo "Dropping database..."
dropdb -U postgres ptak_expo_dev 2>/dev/null || true

echo "Creating database..."
createdb -U postgres ptak_expo_dev

# Import dump
if [[ -f "developer-setup/ptak_expo_dev_dump.sql" ]]; then
    echo "Importing database dump..."
    psql -U postgres -d ptak_expo_dev -f developer-setup/ptak_expo_dev_dump.sql > /dev/null 2>&1
    echo "Database reset successfully!"
else
    echo "Database dump not found. Please run backend to initialize with default data."
fi
SCRIPT_EOF

chmod +x developer-setup/reset-database.sh

print_success "=== Setup Complete! ==="
print_success "You can now run the development environment with:"
print_success "  ./developer-setup/start-dev.sh"
print_success ""
print_success "Or start services manually:"
print_success "  Terminal 1: cd ptak-expo-backend && npm start"
print_success "  Terminal 2: cd ptak-expo-frontend && npm start"
print_success ""
print_success "Access the application at:"
print_success "  Backend API: http://localhost:3001"
print_success "  Frontend: http://localhost:3000"
print_success "  Login: admin@ptak-expo.com / admin123"
print_success ""
print_success "For help, see: developer-setup/DEVELOPER_SETUP_GUIDE.md"
