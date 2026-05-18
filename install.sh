#!/usr/bin/env bash

# FORGE Quick Installer
# 
# This script downloads and installs FORGE from GitHub
# 
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/lucaforni/forge/main/install.sh | bash
#   
# Or download and run locally:
#   chmod +x install.sh
#   ./install.sh [target-directory]

set -e

VERSION="1.0.0"
FORGE_REPO="https://github.com/lucaforni/forge.git"
TEMP_DIR=$(mktemp -d)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

trap cleanup EXIT

# Parse arguments
TARGET_DIR="${1:-.}"
UPDATE_FLAG="${2}"

# Validate target directory
if [ ! -d "$TARGET_DIR" ]; then
    log_error "Target directory does not exist: $TARGET_DIR"
    exit 1
fi

TARGET_DIR=$(cd "$TARGET_DIR" && pwd)  # Get absolute path

log_info "FORGE Quick Installer v${VERSION}"
log_info "Target directory: $TARGET_DIR"
echo ""

# Check if FORGE is already installed
if [ -f "$TARGET_DIR/.opencode/agents/forge.md" ]; then
    if [ "$UPDATE_FLAG" != "--update" ]; then
        log_warn "FORGE is already installed in this project."
        log_info "To update, run: $0 $TARGET_DIR --update"
        exit 1
    fi
    log_info "Updating existing FORGE installation..."
else
    if [ "$UPDATE_FLAG" == "--update" ]; then
        log_warn "FORGE is not installed in this project."
        log_info "Remove --update flag to perform fresh installation."
        exit 1
    fi
    log_info "Installing FORGE..."
fi

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi
log_success "Node.js $(node -v) ✓"

if ! command -v git &> /dev/null; then
    log_error "Git is not installed. Please install Git first."
    exit 1
fi
log_success "Git $(git --version | cut -d' ' -f3) ✓"

if ! command -v npx &> /dev/null; then
    log_error "npx is not installed. Please update your Node.js installation."
    exit 1
fi
log_success "npx available ✓"

echo ""

# Clone FORGE repository
log_info "Downloading FORGE from $FORGE_REPO..."
git clone --depth 1 "$FORGE_REPO" "$TEMP_DIR" > /dev/null 2>&1

if [ ! -d "$TEMP_DIR/.opencode" ]; then
    log_error "Failed to download FORGE or invalid repository structure."
    exit 1
fi
log_success "FORGE downloaded successfully"

echo ""

# Run the TypeScript installer
log_info "Running installation script..."
cd "$TEMP_DIR"

UPDATE_ARG=""
if [ "$UPDATE_FLAG" == "--update" ]; then
    UPDATE_ARG="--update"
fi

npm exec -- tsx install-forge.ts "$TARGET_DIR" $UPDATE_ARG

# Success
log_success "Installation complete!"
