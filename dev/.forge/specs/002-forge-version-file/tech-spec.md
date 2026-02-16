# Tech Spec: [002] - FORGE Version File

> Lightweight specification for the Quick track. Combines requirements,
> tasks, and acceptance criteria in a single document.
> Created by the `forge-pm` agent via `/forge-quick`.

| Field   | Value             |
| ------- | ----------------- |
| Status  | Draft             |
| Author  | forge-pm          |
| Date    | 2026-02-14        |
| Track   | Quick             |
| Spec ID | 002               |

---

## Overview

Add a `.forge-version` file to FORGE workspaces that tracks which version of FORGE was used to initialize the workspace. This helps with debugging and migration when FORGE templates change.

## Requirements

- Create `.forge-version` file in project root during `/forge-init`
- File contains FORGE version number (semver format)
- Update `/forge-init` to write this file
- Add documentation about version file purpose

## Tasks

1. Modify `forge-init` slash command to create `.forge-version` file
2. Add version detection logic (read from package.json or hardcoded)
3. Update FORGE-GUIDE.md to document the version file
4. Test initialization with version file creation

## Acceptance Criteria

- Given a new project, when user runs `/forge-init`, then `.forge-version` file is created with current FORGE version.
- Given an existing workspace without version file, when user runs `/forge-init`, then version file is added without overwriting other files.
- Given a workspace with version file, when user runs `/forge-init`, then version file is NOT overwritten (preserves original version).

---

## Implementation Targets

> **Note**: All paths are relative to `forge/dev/` (meta-development working directory).

### Files to Create

| Path | Type | Description |
|------|------|-------------|
| N/A | | No new files needed (only modifying existing) |

### Files to Modify

| Path | Section/Line | Change Description |
|------|--------------|---------------------|
| `../.opencode/commands/forge-init.md` | Step 2 (Directory Structure) | Add logic to write `.forge-version` file after creating directory structure |
| `../.opencode/docs/FORGE-GUIDE.md` | Section 2.2 (Quick Start) | Add note about `.forge-version` file and its purpose |

### Files to Reference (Read-only)

| Path | Purpose |
|------|---------|
| `../.opencode/package.json` | Read FORGE version number |
| `./.forge/constitution.md` | Verify against meta-dev standards |

---

## Cross-References

| Document             | Path                                |
| -------------------- | ----------------------------------- |
| Constitution         | `./.forge/constitution.md`          |
| FORGE Guide          | `../.opencode/docs/FORGE-GUIDE.md`  |

---

## Test: Path Resolution

Let's verify path resolution from working directory `forge/dev/`:

| Path in spec | Expected resolution | Exists? |
|--------------|---------------------|---------|
| `../.opencode/commands/forge-init.md` | `forge/.opencode/commands/forge-init.md` | ✓ Verified |
| `../.opencode/docs/FORGE-GUIDE.md` | `forge/.opencode/docs/FORGE-GUIDE.md` | ✓ Verified |
| `../.opencode/package.json` | `forge/.opencode/package.json` | ✓ Verified |
| `./.forge/constitution.md` | `forge/dev/.forge/constitution.md` | ✓ Verified |

**Verification Commands** (run from `forge/dev/`):
```bash
test -f ../.opencode/commands/forge-init.md && echo "✓" || echo "✗"
test -f ../.opencode/docs/FORGE-GUIDE.md && echo "✓" || echo "✗"
test -f ../.opencode/package.json && echo "✓" || echo "✗"
test -f ./.forge/constitution.md && echo "✓" || echo "✗"
```

All paths verified successfully on 2026-02-14.
