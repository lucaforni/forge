#!/usr/bin/env bash

# Test script for opencode.json merge functionality
# This script tests the intelligent merging of opencode.json during updates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORGE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_DIR="$(mktemp -d)"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_test() {
    echo -e "${YELLOW}TEST:${NC} $1"
}

cleanup() {
    if [ -d "$TEST_DIR" ]; then
        rm -rf "$TEST_DIR"
    fi
}

trap cleanup EXIT

echo ""
log_info "FORGE opencode.json Merge Test Suite"
log_info "Test directory: $TEST_DIR"
echo ""

# Test 1: Fresh install should copy template
log_test "Test 1: Fresh install"
TEST1_DIR="$TEST_DIR/test1"
mkdir -p "$TEST1_DIR"

npx tsx "$FORGE_ROOT/install-forge.ts" "$TEST1_DIR" 2>&1 | grep -q "opencode.json (fresh copy)"
if [ $? -eq 0 ]; then
    log_success "Fresh install copies template correctly"
else
    log_error "Fresh install failed"
    exit 1
fi

# Verify file exists
if [ -f "$TEST1_DIR/opencode.json" ]; then
    log_success "opencode.json created"
else
    log_error "opencode.json not created"
    exit 1
fi

echo ""

# Test 2: Update with customizations should preserve user values
log_test "Test 2: Update preserves customizations"
TEST2_DIR="$TEST_DIR/test2"
mkdir -p "$TEST2_DIR/.opencode/agents"
touch "$TEST2_DIR/.opencode/agents/forge.md"  # Mark as installed

# Create a customized opencode.json
cat > "$TEST2_DIR/opencode.json" << 'EOF'
{
  "model": "github-copilot/claude-opus-4.6",
  "agent": {
    "forge-reviewer": {
      "model": "github-copilot/claude-opus-4.6"
    }
  },
  "permission": {
    "bash": {
      "docker *": "allow",
      "git *": "allow",
      "*": "ask"
    }
  },
  "instructions": [
    "custom-doc.md"
  ]
}
EOF

# Run update
npx tsx "$FORGE_ROOT/install-forge.ts" "$TEST2_DIR" --update 2>&1 | grep -q "merging with existing"
if [ $? -eq 0 ]; then
    log_success "Update performs merge"
else
    log_error "Update did not merge"
    exit 1
fi

# Verify backup was created
if ls "$TEST2_DIR"/opencode.json.backup-* 1> /dev/null 2>&1; then
    log_success "Backup created"
else
    log_error "No backup created"
    exit 1
fi

# Verify user customizations preserved
if grep -q '"model": "github-copilot/claude-opus-4.6"' "$TEST2_DIR/opencode.json"; then
    log_success "User model override preserved"
else
    log_error "User model override lost"
    exit 1
fi

if grep -F '"docker *": "allow"' "$TEST2_DIR/opencode.json" > /dev/null; then
    log_success "User custom permission preserved"
else
    log_error "User custom permission lost"
    cat "$TEST2_DIR/opencode.json"
    exit 1
fi

# Verify new keys from template were added
if grep -q 'forge-pm' "$TEST2_DIR/opencode.json"; then
    log_success "New agent from template added"
else
    log_error "New agent from template not added"
    exit 1
fi

if grep -q 'forge-architect' "$TEST2_DIR/opencode.json"; then
    log_success "New agent from template added"
else
    log_error "New agent from template not added"
    exit 1
fi

echo ""

# Test 3: Update without customizations should work
log_test "Test 3: Update with default config"
TEST3_DIR="$TEST_DIR/test3"
mkdir -p "$TEST3_DIR/.opencode/agents"
touch "$TEST3_DIR/.opencode/agents/forge.md"

# Copy default template
cp "$FORGE_ROOT/opencode.json" "$TEST3_DIR/opencode.json"

# Run update
npx tsx "$FORGE_ROOT/install-forge.ts" "$TEST3_DIR" --update > /dev/null 2>&1

if [ -f "$TEST3_DIR/opencode.json" ]; then
    log_success "Update with default config works"
else
    log_error "Update with default config failed"
    exit 1
fi

echo ""

# Test 4: Malformed JSON should fallback gracefully
log_test "Test 4: Malformed JSON fallback"
TEST4_DIR="$TEST_DIR/test4"
mkdir -p "$TEST4_DIR/.opencode/agents"
touch "$TEST4_DIR/.opencode/agents/forge.md"

# Create malformed JSON
cat > "$TEST4_DIR/opencode.json" << 'EOF'
{
  "model": "some-model",
  "broken": this is not valid json
}
EOF

# Run update
npx tsx "$FORGE_ROOT/install-forge.ts" "$TEST4_DIR" --update 2>&1 | grep -q "Failed to merge JSON"
if [ $? -eq 0 ]; then
    log_success "Malformed JSON detected and fallback used"
else
    log_error "Malformed JSON not handled"
    exit 1
fi

# Verify backup exists
if ls "$TEST4_DIR"/opencode.json.backup-* 1> /dev/null 2>&1; then
    log_success "Backup created before fallback"
else
    log_error "No backup created before fallback"
    exit 1
fi

echo ""
echo "========================================"
log_success "All tests passed!"
echo "========================================"
echo ""
