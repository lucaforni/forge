#!/usr/bin/env bash

# Example script to update FORGE in multiple projects
# 
# Usage:
#   ./update-multiple-projects.sh

set -euo pipefail

# NOTE: do not use ((VAR++)) here. It evaluates to the pre-increment value,
# so incrementing from 0 returns a non-zero exit status and `set -e` aborts
# the script on the first skipped project. $((VAR + 1)) has no such trap.

# CUSTOMIZE: Add your project paths here
PROJECTS=(
  # "/path/to/project-1"
  # "/path/to/project-2"
  # "/path/to/project-3"
)

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}Updating FORGE in multiple projects...${NC}"
echo ""

FORGE_DIR="$(cd "$(dirname "$0")" && pwd)"
UPDATED=0
FAILED=0

for project in "${PROJECTS[@]}"; do
  echo -e "${BLUE}Updating: $project${NC}"
  
  if [ ! -d "$project" ]; then
    echo "  ⚠ Directory does not exist, skipping..."
    FAILED=$((FAILED + 1))
    continue
  fi
  
  # A project counts as FORGE-installed when the manifest exists or any
  # platform carries the orchestrator agent — not just OpenCode. The old
  # check looked only at .opencode/, so Claude-only and Codex-only projects
  # were misreported as "not installed".
  if [ ! -f "$project/.forge/.install-manifest.json" ] \
     && [ ! -f "$project/.opencode/agents/forge.md" ] \
     && [ ! -f "$project/.claude/agents/forge.md" ] \
     && [ ! -f "$project/.codex/agents/forge.md" ]; then
    echo "  ⚠ FORGE not installed, skipping..."
    FAILED=$((FAILED + 1))
    continue
  fi

  # --update refuses targets with nothing to update (exit 4), so reaching
  # here with a stale pre-check surfaces as a failure below, not a silent
  # fresh install. Diagnostics go to a per-project log, not /dev/null: a
  # bare "Update failed" with set -euo pipefail is undebuggable.
  log_file="$(mktemp)"
  if npx tsx "$FORGE_DIR/install-forge.ts" "$project" --update > "$log_file" 2>&1; then
    echo -e "  ${GREEN}✓ Updated successfully${NC}"
    UPDATED=$((UPDATED + 1))
  else
    code=$?
    echo "  ✗ Update failed (exit $code, log: $log_file)"
    tail -5 "$log_file" | sed 's/^/    /'
    FAILED=$((FAILED + 1))
    continue
  fi
  rm -f "$log_file"
  
  echo ""
done

echo "=================================="
echo -e "${GREEN}Updated: $UPDATED${NC}"
if [ $FAILED -gt 0 ]; then
  echo "Failed/Skipped: $FAILED"
fi
echo "=================================="
