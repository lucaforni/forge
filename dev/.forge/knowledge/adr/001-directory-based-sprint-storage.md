# ADR-001: Directory-Based Sprint Storage

> Architectural Decision Record documenting the migration from single-file
> sprint storage to a directory-based multi-sprint architecture.
> Created by the `forge-architect` agent via `/forge-plan` (embedded ADR).

| Field    | Value                     |
| -------- | ------------------------- |
| Status   | Accepted                  |
| Author   | forge-architect           |
| Date     | 2026-02-14                |
| Deciders | forge-architect, forge-pm |

---

## Context

FORGE currently stores all sprint data in a single file
(`.forge/sprints/sprint-status.yaml`) with a `current_sprint` key and a
`previous_sprints` array. This design blocks three capabilities that the
FORGE methodology needs as it scales:

1. **Sprint overlap**: Teams cannot plan Sprint N+1 while Sprint N is still
   closing. The single `current_sprint` slot is exclusive.
2. **Multi-team support**: Independent teams cannot maintain parallel sprint
   cadences because they share the same file.
3. **Unbounded file growth**: The `previous_sprints` array grows indefinitely,
   bloating context windows and complicating diffs.

The spec (001-multi-sprint-support) requires a new data model. This ADR
documents the storage pattern decision.

## Options Considered

### Option A: Multi-Document Directory Structure

- **Description**: Replace the single file with a directory structure:
  `active/sprint-NNN.yaml` for live sprints, `completed/YYYY-MM-DD-sprint-NNN.yaml`
  for archives, and `sprint-sequence.yaml` for sequence tracking.
- **Pros**:
  - Each sprint is an independent file — no merge conflicts between sprints
  - `active/` directory naturally scopes agent context loading
  - `completed/` directory is never loaded unless explicitly requested
  - Git diffs show exactly which sprint changed
  - Naming convention (zero-padded NNN, ISO date prefix) is self-documenting
- **Cons**:
  - Requires migration logic from old format
  - More filesystem operations (readdir + multiple reads vs single read)
  - Sprint sequence file is a new coordination point
- **Effort**: Medium

### Option B: Single File with Multiple Sprint Sections

- **Description**: Keep `sprint-status.yaml` but add an `active_sprints` array
  instead of a single `current_sprint` key.
- **Pros**:
  - Minimal migration (schema change within same file)
  - Single file read for all sprint data
  - No new directories to create
- **Cons**:
  - File growth problem remains (all data in one file)
  - Git merge conflicts when multiple sprints are edited
  - No filesystem-level separation between active and archived
  - Context loading still pulls in all sprint data
- **Effort**: Low

### Option C: Database-Backed Storage (SQLite)

- **Description**: Store sprint data in a local SQLite database with query
  capabilities.
- **Pros**:
  - Rich querying (velocity trends, cross-sprint analysis)
  - No file growth issues
  - Atomic transactions
- **Cons**:
  - Violates Constitution Article 2.2 (dependency-free design)
  - Not human-readable in editors or git diffs
  - Requires new dependency
  - Overkill for YAML-scale data
- **Effort**: High

## Decision

**Chosen option**: Option A — Multi-Document Directory Structure

**Rationale**: This option provides the cleanest separation of concerns. Each
sprint file is self-contained, human-readable, and independently loadable by
agents. The directory structure (`active/` vs `completed/`) creates a natural
filesystem boundary that maps directly to agent context loading needs. The
migration cost is acceptable given that FORGE is early in adoption and the old
format has a small installed base. Option B fails to solve the file growth
problem, and Option C violates the constitution's dependency policy.

## Consequences

### Positive
- Agents load only `active/` files, keeping context windows small (NFR-004)
- Sprint overlap becomes a natural filesystem operation (just add another file)
- Git diffs are clean — each sprint change is isolated to its own file
- Archive files are immutable once written — no accidental modification

### Negative
- Migration code adds ~100-150 lines to the sprint-status tool
- `sprint-sequence.yaml` is a new single-point coordination file (mitigated by
  recovery logic that rebuilds it from scanning existing files)
- All sprint-aware code paths must handle directory reads instead of single file

### Neutral
- Template changes: `sprint-status.yaml` template changes purpose (now per-sprint)
- New template: `sprint-sequence.yaml` is a trivial addition
- The `completed/` directory will accumulate files over time, but they are only
  read on demand (`/forge-sprint list`), never during dashboard rendering

## Constitution Alignment

| Article | Alignment | Notes                                                |
| ------- | --------- | ---------------------------------------------------- |
| Art. 1  | Supports  | Documentation parity: migration guide included       |
| Art. 2  | Supports  | No new dependencies; YAML + TypeScript only          |
| Art. 3  | Supports  | Extends data patterns; follows spec directory model  |
| Art. 4  | Supports  | Template versioned with `version: 1` field           |
| Art. 5  | Supports  | Sprint IDs are numeric, path-safe; no injection risk |
| Art. 6  | Supports  | All error paths documented (spec Section 6)          |
| Art. 7  | Supports  | File naming follows NNN pattern, ISO date prefix     |
| Art. 9  | Supports  | Backward compatibility via auto-detect + migration   |

## Follow-Up Actions

- [ ] Implement directory structure in `sprint-status.ts` tool
- [ ] Update `forge-sprint.md` command with subcommands
- [ ] Update `forge-scrum.md` agent with multi-sprint logic
- [ ] Create `sprint-sequence.yaml` template
- [ ] Update `sprint-status.yaml` template to per-sprint format
- [ ] Create `MIGRATION-SPRINT-FORMAT.md` documentation
- [ ] Update `FORGE-GUIDE.md` Sections 3.4, 4.1, 5.3
- [ ] Update `context-chain/SKILL.md` sprint path references

---

## Lifecycle

```
Proposed  -->  Accepted  -->  [Deprecated | Superseded by ADR-NNN]
```
