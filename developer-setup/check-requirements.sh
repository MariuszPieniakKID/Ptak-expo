#!/bin/bash

# PTAK EXPO - Check System Requirements
# Sprawdza czy system spełnia wymagania do uruchomienia projektu

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "=== PTAK EXPO - System Requirements Check ==="

# Check operating system
print_status "Checking operating system..."
OS=$(uname -s)
case $OS in
    Darwin*)
        print_success "macOS detected"
        ;;
    Linux*)
        print_success "Linux detected"
        ;;
    CYGWIN*|MINGW*|MSYS*)
        print_warning "Windows detected - WSL recommended"
        ;;
    *)
        print_error "Unknown operating system: $OS"
        ;;
esac

# Check Node.js
print_status "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_NODE="20.19.1"
    
    if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
        print_success "Node.js version $NODE_VERSION (>= $REQUIRED_NODE required)"
    else
        print_error "Node.js version $NODE_VERSION is too old (>= $REQUIRED_NODE required)"
    fi
else
    print_error "Node.js not found. Please install Node.js"
    echo "  macOS: brew install node"
    echo "  Linux: sudo apt install nodejs"
    echo "  Windows: Download from https://nodejs.org"
fi

# Check npm
print_status "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm version $NPM_VERSION"
else
    print_error "npm not found. Usually comes with Node.js"
fi

# Check PostgreSQL
print_status "Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    print_success "PostgreSQL version $PSQL_VERSION"
    
    # Check if PostgreSQL is running
    if pg_isready -U postgres &> /dev/null; then
        print_success "PostgreSQL is running"
    else
        print_warning "PostgreSQL is not running"
        echo "  Start with: brew services start postgresql@15 (macOS)"
        echo "  Start with: sudo service postgresql start (Linux)"
    fi
else
    print_error "PostgreSQL not found. Please install PostgreSQL"
    echo "  macOS: brew install postgresql@15"
    echo "  Linux: sudo apt install postgresql postgresql-contrib"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
fi

# Check Git
print_status "Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    print_success "Git version $GIT_VERSION"
else
    print_error "Git not found. Please install Git"
    echo "  macOS: brew install git"
    echo "  Linux: sudo apt install git"
    echo "  Windows: Download from https://git-scm.com"
fi

# Check available ports
print_status "Checking available ports..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3000 is in use"
    echo "  Process using port 3000:"
    lsof -Pi :3000 -sTCP:LISTEN
else
    print_success "Port 3000 is available"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3001 is in use"
    echo "  Process using port 3001:"
    lsof -Pi :3001 -sTCP:LISTEN
else
    print_success "Port 3001 is available"
fi

# Check disk space
print_status "Checking disk space..."
if command -v df &> /dev/null; then
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        print_success "Disk space OK (${DISK_USAGE}% used)"
    else
        print_warning "Disk space is low (${DISK_USAGE}% used)"
    fi
fi

# Check memory
print_status "Checking memory..."
if [[ "$OS" == "Darwin" ]]; then
    MEMORY=$(system_profiler SPHardwareDataType | grep "Memory:" | awk '{print $2 $3}')
    print_success "Memory: $MEMORY"
elif [[ "$OS" == "Linux" ]]; then
    MEMORY=$(free -h | grep "Mem:" | awk '{print $2}')
    print_success "Memory: $MEMORY"
fi

# Check if project files exist
print_status "Checking project structure..."
if [[ -f "../ptak-expo-backend/package.json" ]]; then
    print_success "Backend package.json found"
else
    print_error "Backend package.json not found. Are you in the right directory?"
fi

if [[ -f "../ptak-expo-frontend/package.json" ]]; then
    print_success "Frontend package.json found"
else
    print_error "Frontend package.json not found"
fi

# Summary
echo ""
print_status "=== Summary ==="
echo ""
echo "If all checks passed, you can proceed with:"
echo "  1. ./developer-setup/setup.sh"
echo "  2. ./developer-setup/test-setup.sh"
echo "  3. ./developer-setup/start-dev.sh"
echo ""
echo "If there are errors, please fix them before continuing."
echo "See DEVELOPER_SETUP_GUIDE.md for detailed instructions."
