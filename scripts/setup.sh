#!/bin/bash

# OmniTools MCP Server Setup Script
# This script validates dependencies and prepares the environment

set -e

echo "=================================================="
echo "OmniTools MCP Server - Setup Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
ERRORS=0
WARNINGS=0

# Check Node.js version
echo "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    
    if [ "$NODE_MAJOR" -ge 20 ]; then
        echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION (required: 20+)"
    else
        echo -e "${RED}✗${NC} Node.js $NODE_VERSION found, but version 20+ required"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 20+"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    ERRORS=$((ERRORS + 1))
fi

# Check FFmpeg
echo "Checking FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n1 | cut -d' ' -f3)
    echo -e "${GREEN}✓${NC} FFmpeg $FFMPEG_VERSION"
else
    echo -e "${RED}✗${NC} FFmpeg not found. Install with:"
    echo "    Ubuntu/Debian: sudo apt install ffmpeg"
    echo "    macOS: brew install ffmpeg"
    echo "    Or set FFMPEG_PATH in .env if installed elsewhere"
    ERRORS=$((ERRORS + 1))
fi

# Check for .env file
echo "Checking configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file found"
else
    echo -e "${YELLOW}⚠${NC} .env file not found. Using defaults from .env.example"
    WARNINGS=$((WARNINGS + 1))
fi

# Install dependencies if node_modules doesn't exist
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Create logs directory
echo "Setting up directories..."
mkdir -p logs
echo -e "${GREEN}✓${NC} Logs directory ready"

# Build TypeScript
echo "Building TypeScript..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} TypeScript build successful"
else
    echo -e "${RED}✗${NC} TypeScript build failed"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=================================================="
echo "Setup Summary"
echo "=================================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Setup completed successfully!${NC}"
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) - check messages above${NC}"
    fi
    
    echo ""
    echo "Next steps:"
    echo "  1. Review/create .env file with your settings"
    echo "  2. Run: npm start"
    echo "  3. Or dev mode: npm run dev"
else
    echo -e "${RED}✗ Setup failed with $ERRORS error(s)${NC}"
    echo "Please fix the errors above and run setup again."
    exit 1
fi
