# Tech Spec: [001] - FORGE Doctor Command

> Lightweight specification for the Quick track. Combines requirements,
> tasks, and acceptance criteria in a single document.
> Created by the `forge-pm` agent via `/forge-quick`.

| Field   | Value             |
| ------- | ----------------- |
| Status  | Example           |
| Author  | forge-pm          |
| Date    | 2026-02-14        |
| Track   | Quick             |
| Spec ID | 001               |

---

## Overview

Add a `/forge-doctor` slash command that validates the FORGE workspace setup, checks for required files, detects common configuration issues, and provides actionable fixes. This helps users quickly diagnose and resolve FORGE setup problems.

## Requirements

- Implement a new slash command `/forge-doctor` accessible via the `forge` orchestrator agent
- Check for existence and validity of required FORGE files (`.forge/constitution.md`, templates, etc.)
- Validate FORGE directory structure (`.forge/specs/`, `.forge/knowledge/adr/`, etc.)
- Detect common configuration issues (missing sections in constitution, invalid YAML in sprint files)
- Provide clear, actionable error messages with suggested fixes
- Support both project FORGE setup and meta-development (`dev/.forge/`) setup
- Output a structured report with health status (✓ Pass, ⚠ Warning, ✗ Fail)

## Tasks

1. Create `forge-doctor.ts` utility module with validation functions
2. Add validation functions for each required FORGE component
3. Create slash command handler in `.opencode/slashcommands/forge-doctor.ts`
4. Update `forge.md` agent instructions to mention `/forge-doctor` command
5. Add unit tests for validation logic
6. Add integration test for the slash command
7. Update documentation (FORGE-GUIDE.md) with `/forge-doctor` usage

## Acceptance Criteria

- Given a valid FORGE workspace, when user runs `/forge-doctor`, then all checks pass with green checkmarks.
- Given a workspace missing `.forge/constitution.md`, when user runs `/forge-doctor`, then the report shows a ✗ Fail with message "Constitution not found at .forge/constitution.md. Create it using /forge-init".
- Given a workspace with invalid directory structure, when user runs `/forge-doctor`, then the report lists all missing directories with suggestions to create them.
- Given a workspace with malformed YAML in sprint files, when user runs `/forge-doctor`, then the report identifies the file and line number with the YAML error.
- Given `dev/.forge/` workspace (meta-development), when user runs `/forge-doctor`, then checks validate both dev workspace and FORGE source templates.

---

## Implementation Targets

> **Note**: All paths are relative to `forge/dev/` (meta-development working directory).

### Files to Create

| Path | Type | Description |
|------|------|-------------|
| `../.opencode/lib/forge-doctor.ts` | TypeScript module | Core validation logic for FORGE workspace health checks |
| `../.opencode/slashcommands/forge-doctor.ts` | Slash command handler | Entry point for `/forge-doctor` command |
| `../.opencode/lib/forge-doctor.test.ts` | Unit tests | Tests for validation functions |
| `../.opencode/slashcommands/forge-doctor.test.ts` | Integration tests | Tests for slash command behavior |

### Files to Modify

| Path | Section/Line | Change Description |
|------|--------------|---------------------|
| `../.opencode/agents/forge.md` | "Available Commands" section | Add `/forge-doctor` to command list with description |
| `../.opencode/docs/FORGE-GUIDE.md` | Section 11 (Troubleshooting) | Add subsection 11.1 "Using /forge-doctor to Diagnose Issues" |
| `../.opencode/docs/FORGE-GUIDE.md` | Section 2.2 (Quick Start) | Add note about running `/forge-doctor` after initialization |

### Files to Reference (Read-only)

| Path | Purpose |
|------|---------|
| `./.forge/constitution.md` | Understand meta-development constitution structure for validation |
| `../.forge/constitution.md` | Understand root constitution structure (if present) |
| `../.opencode/templates/spec.md` | Validate that workspace specs follow template structure |
| `../.opencode/templates/tech-spec.md` | Validate that workspace tech-specs follow template structure |
| `../.opencode/slashcommands/forge-init.ts` | Reference for existing FORGE initialization logic |

---

## Cross-References

| Document             | Path                                |
| -------------------- | ----------------------------------- |
| Constitution         | `./.forge/constitution.md`          |
| FORGE Guide          | `../.opencode/docs/FORGE-GUIDE.md`  |
| Meta-Dev Guide       | `./README.md`                       |

---

## Notes for Implementers

### Path Notation Explanation

This spec uses relative paths from `forge/dev/` working directory:

- `../.opencode/` → `forge/.opencode/` (FORGE source code)
- `./.forge/` → `forge/dev/.forge/` (meta-development workspace)
- `../.forge/` → `forge/.forge/` (root config, if present)

### Why This Matters

Without explicit path tables, an agent might:
- Create `forge-doctor.ts` in wrong location (`dev/lib/` instead of `.opencode/lib/`)
- Modify the wrong documentation (dev docs instead of FORGE docs)
- Reference wrong templates (dev templates instead of source templates)

This spec demonstrates **correct path explicitness** for all FORGE meta-development.

### Validation Logic Design

The `forge-doctor.ts` module should export:

```typescript
interface HealthCheckResult {
  status: 'pass' | 'warning' | 'fail';
  category: string;
  message: string;
  fix?: string;
}

interface DoctorReport {
  timestamp: string;
  workspaceType: 'project' | 'meta-dev';
  checks: HealthCheckResult[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

export async function runDiagnostics(workingDir: string): Promise<DoctorReport>;
```

### Checks to Implement

1. **File existence checks**:
   - `.forge/constitution.md`
   - `.forge/knowledge/decision-log.md`
   - `.opencode/templates/*.md` (for meta-dev)

2. **Directory structure checks**:
   - `.forge/specs/`, `.forge/epics/`, `.forge/sprints/`
   - `.forge/knowledge/adr/`, `.forge/architecture/`

3. **File content validation**:
   - Constitution has all required articles
   - Templates have "Implementation Targets" section (meta-dev only)
   - Sprint YAML files are valid YAML

4. **Configuration checks**:
   - Git repository initialized
   - `.gitignore` includes FORGE artifacts if needed

### Testing Strategy (Quick Track)

Since this is Quick track, keep testing focused:

- **Unit tests**: Each validation function tested independently with mock file system
- **Integration tests**: Slash command tested with fixture workspaces (valid, invalid, missing files)
- **Manual testing**: Run on `forge/` project workspace and `forge/dev/` meta-dev workspace

No E2E tests required for Quick track.
