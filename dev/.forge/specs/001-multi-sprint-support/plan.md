# Plan: 001 - Multi-Sprint Support with Automatic Archiving

> Technical implementation plan for the Feature track.
> Created by the `forge-architect` agent via `/forge-plan`.

| Field   | Value                                                           |
| ------- | --------------------------------------------------------------- |
| Status  | Draft                                                           |
| Author  | forge-architect                                                 |
| Date    | 2026-02-14                                                      |
| Track   | Feature                                                         |
| Spec    | `.forge/specs/001-multi-sprint-support/spec.md`                 |

---

## 1. Overview

This plan transforms FORGE sprint management from a single-file model
(`sprint-status.yaml`) to a directory-based multi-sprint architecture. The
implementation has five phases:

1. **Foundation** — New templates and directory structure
2. **Core Tool** — Rewrite `sprint-status.ts` with multi-file reading,
   migration detection, and aggregate dashboard
3. **Command & Agent** — Update `forge-sprint.md` with subcommands and
   `forge-scrum.md` with multi-sprint lifecycle logic
4. **Context & Documentation** — Update `context-chain/SKILL.md`,
   `FORGE-GUIDE.md`, and create migration guide
5. **Validation** — Dogfooding, edge case verification, review readiness

The approach prioritizes backward compatibility (FR-014 through FR-019) by
detecting the old format at runtime and offering prompted migration before
any write operations.

---

## 2. Data Model

This feature has no database tables. All data is stored in YAML files on the
filesystem. This section defines the YAML schemas as the equivalent of the
data model.

### 2.1 New File Schemas

#### `sprint-sequence.yaml`

```yaml
# Schema: Sprint Sequence Tracker
version: 1                    # integer, format version
next_sprint_number: 3         # integer, ≥ 1, auto-incremented
project: "Project Name"       # string, from sprint data or user input
```

| Field                | Type    | Constraints       | Notes                              |
| -------------------- | ------- | ----------------- | ---------------------------------- |
| `version`            | integer | = 1               | Forward-compatible version field   |
| `next_sprint_number` | integer | ≥ 1               | Monotonically increasing           |
| `project`            | string  | non-empty         | Inherited from old format or asked |

#### `active/sprint-NNN.yaml` (Per-Sprint File)

```yaml
# Schema: Active Sprint
version: 1
sprint:
  number: 1                     # integer, zero-padded in filename
  goal: "Sprint goal"           # string
  start_date: "YYYY-MM-DD"     # ISO 8601 date
  end_date: "YYYY-MM-DD"       # ISO 8601 date
  stories:                      # array of Story objects
    - id: "E01-S001"            # string, ENN-SNNN format
      title: "Story title"     # string
      status: pending           # enum: pending | in_progress | done | blocked | carried_over
      points: 5                 # integer, ≥ 0
      blocked_reason: ""        # string, only when status = blocked
  velocity:
    planned: 21                 # integer, sum of all story points
    completed: 5                # integer, sum of done story points
```

| Field              | Type    | Constraints                                          |
| ------------------ | ------- | ---------------------------------------------------- |
| `version`          | integer | = 1                                                  |
| `sprint.number`    | integer | ≥ 1, matches filename NNN                            |
| `sprint.goal`      | string  | non-empty                                            |
| `sprint.start_date`| string  | ISO 8601 date format                                 |
| `sprint.end_date`  | string  | ISO 8601 date format, ≥ start_date                   |
| `sprint.stories`   | array   | 0+ Story objects                                     |
| `story.id`         | string  | matches `ENN-SNNN` or spec-based ID                  |
| `story.status`     | enum    | `pending`, `in_progress`, `done`, `blocked`, `carried_over` |
| `story.points`     | integer | ≥ 0                                                  |
| `velocity.planned` | integer | ≥ 0                                                  |
| `velocity.completed`| integer| ≥ 0, ≤ planned                                       |

#### `completed/YYYY-MM-DD-sprint-NNN.yaml` (Archived Sprint)

Same schema as active sprint, with additional fields:

| Field                     | Type    | Constraints                       |
| ------------------------- | ------- | --------------------------------- |
| `sprint.closed_date`      | string  | ISO 8601 date, date of archiving  |
| `sprint.story_count`      | integer | total stories at close time       |
| `sprint.stories_completed`| integer | count of `done` stories           |
| `sprint.stories_carried_over` | integer | count of `carried_over` stories |
| `sprint.retro`            | string  | optional, path to retro file      |

### 2.2 Modified File Schemas

#### `sprint-status.yaml` Template (Breaking Change)

The existing template at `../.opencode/templates/sprint-status.yaml` changes
from a monolithic sprint file to a per-sprint template. This is a **breaking
change** governed by Constitution Article 4.4 (Template Stability).

**Before** (old format — 30 lines, `current_sprint` + `previous_sprints`):
Used as the single source of truth for all sprint data.

**After** (new format — per-sprint template):
Used as the template for creating individual sprint files in `active/`.

**Migration path**: Auto-detected at runtime. Old files migrated to new
structure. Old file renamed to `.bak`. See Section 7, Phase 2.

### 2.3 Directory Structure

```
.forge/sprints/
├── sprint-sequence.yaml          # New: sequence tracker
├── active/                       # New: directory for active sprints
│   ├── sprint-001.yaml           # New: per-sprint file
│   └── sprint-002.yaml           # New: per-sprint file
├── completed/                    # New: directory for archived sprints
│   ├── 2026-01-20-sprint-001.yaml
│   └── 2026-02-03-sprint-002.yaml
├── retrospectives/               # Existing: unchanged
│   └── sprint-001-retro.md
└── sprint-status.yaml.bak        # Old file, renamed after migration
```

### 2.4 Migrations

The migration logic transforms old format to new format:

1. Detect old `sprint-status.yaml` exists AND `active/` does not exist
2. Parse old format using existing `parseYaml()` function
3. Skip if template-only data (detection: `[Project Name]` + `[Sprint goal]`)
4. Prompt user for confirmation (FR-015)
5. Create `active/` and `completed/` directories
6. Write `current_sprint` → `active/sprint-NNN.yaml`
7. Write each `previous_sprints[i]` → `completed/DATE-sprint-NNN.yaml`
   - If `end_date` missing: use `unknown-NNN` as date prefix + log warning (FR-022)
8. Write `sprint-sequence.yaml` with `next_sprint_number = max(all sprint numbers) + 1`
9. Rename old file to `sprint-status.yaml.bak` (FR-018)

**Recovery for missing `sprint-sequence.yaml` (Edge Case #5)**:
- Scan `active/` and `completed/` filenames
- Extract sprint numbers via regex: `/sprint-(\d{3})/`
- Set `next_sprint_number = max(found numbers) + 1`
- Write recovered sequence file
- Log warning to user

---

## 3. API Endpoints

This feature does not expose HTTP APIs. All interfaces are OpenCode tools and
slash commands processed by agents. The "API" section documents the tool and
command interfaces instead.

### 3.1 Tool: `sprint-status`

- **Description**: Read sprint data and render aggregate dashboard
- **Location**: `../.opencode/tools/sprint-status.ts`
- **Input args**: None (unchanged)
- **Output**: Text dashboard string
- **Behavior changes**:

| Scenario                  | Old Behavior                      | New Behavior                                     |
| ------------------------- | --------------------------------- | ------------------------------------------------ |
| New format detected       | N/A                               | Read all `active/*.yaml`, render aggregate       |
| Old format detected       | Read single file                  | Show migration prompt, then read                 |
| No sprint data            | "No sprint status file found"     | "No active sprints. Run `/forge-sprint start`."  |
| Template-only data        | "Contains only template data"     | Same message (unchanged)                         |
| >5 active sprints         | N/A                               | Render all + warning banner                      |

### 3.2 Command: `/forge-sprint`

- **Description**: Sprint lifecycle management with subcommands
- **Location**: `../.opencode/commands/forge-sprint.md`
- **Subcommands**:

| Subcommand    | Arguments       | Behavior                                              | FR Ref  |
| ------------- | --------------- | ----------------------------------------------------- | ------- |
| (no args)     | —               | If active sprints: show dashboard. If none: start.    | FR-020  |
| `start`       | —               | Create new sprint in `active/`                        | FR-005  |
| `close`       | `[sprint-id]`   | Archive sprint to `completed/`                        | FR-006  |
| `list`        | —               | Show active + last 5 completed                        | FR-008  |
| `update`      | `[sprint-id]`   | Update story statuses                                 | FR-009  |

### 3.3 Error Responses

| Error Condition                          | Message Format                                                                    | FR Ref  |
| ---------------------------------------- | --------------------------------------------------------------------------------- | ------- |
| Sprint not found for close               | `"Sprint NNN not found in active sprints. Active sprints: [list]."`               | EC-4    |
| No active sprints for dashboard          | `"No active sprints. Run /forge-sprint start to create one."`                     | EC-2    |
| Filesystem error (ENOENT/EEXIST/EACCES)  | `"Error: [cause]. [explanation]. Try: [retry suggestion]."`                       | NFR-006 |
| Duplicate sprint numbers                 | `"Error: Duplicate sprint numbers found in active/. [list]. Remove duplicate."`   | EC-7    |
| Archive filename collision               | Auto-append `-2`, `-3` suffix to filename                                         | EC-8    |
| Invalid sprint-id argument               | `"Error: Sprint ID must be numeric (001-999). Got: '[input]'."`                  | Art 5.4 |

### 3.4 Input Validation

**Sprint-ID Validation** (Constitution Article 5.4 - Path Traversal Protection):

Commands that accept `[sprint-id]` arguments (`close`, `update`) must validate input before constructing file paths:

- **Pattern**: Must match `/^\d{3}$/` (exactly 3 digits, zero-padded)
- **Range**: 001-999 (valid sprint ID range)
- **Reject**: Path traversal attempts (`../`, `..`, absolute paths), non-numeric input
- **Implementation location**: `../.opencode/commands/forge-sprint.md` (argument parsing section)
- **Error handling**: Return error message to user, do not construct file path

**Example validation logic**:
```typescript
function validateSprintId(input: string): boolean {
  return /^\d{3}$/.test(input) && parseInt(input) >= 1 && parseInt(input) <= 999
}
```

This prevents path traversal attacks where a malicious user could pass `../../etc/passwd` as a sprint-id.

---

## 4. Component Design

### 4.1 Sprint File Parser (`parseSprintYaml`)

- **Purpose**: Parse the new per-sprint YAML format into a typed `SprintFile` interface
- **Location**: `../.opencode/tools/sprint-status.ts` (internal function)
- **Responsibilities**:
  - Parse YAML content into `SprintFile` structure
  - Validate `version` field (FR-024)
  - Handle unknown versions with warning + best-effort parse
  - Support `carried_over` as a valid story status (FR-025)
- **Dependencies**: None (pure function)
- **Key Methods**:

| Method               | Parameters             | Returns           | Description                                |
| -------------------- | ---------------------- | ----------------- | ------------------------------------------ |
| `parseSprintYaml`    | `content: string`      | `SprintFile`      | Parse per-sprint YAML into typed structure  |
| `parseSequenceYaml`  | `content: string`      | `SequenceFile`    | Parse sprint-sequence.yaml                 |

### 4.2 Sprint Directory Reader (`readActiveSprints`)

- **Purpose**: Read all sprint files from `active/` directory
- **Location**: `../.opencode/tools/sprint-status.ts` (internal function)
- **Responsibilities**:
  - List `active/` directory contents
  - Filter for `sprint-*.yaml` files
  - Parse each file using `parseSprintYaml`
  - Sort by sprint number ascending
  - Detect duplicates (EC-7)
- **Dependencies**: `parseSprintYaml`, `node:fs/promises`
- **Key Methods**:

| Method               | Parameters             | Returns              | Description                               |
| -------------------- | ---------------------- | -------------------- | ----------------------------------------- |
| `readActiveSprints`  | `sprintsDir: string`   | `SprintFile[]`       | Read and parse all active sprint files    |
| `readCompletedSprints`| `sprintsDir: string, limit: number` | `SprintFile[]` | Read last N completed sprints    |

### 4.3 Migration Engine (`detectAndMigrate`)

- **Purpose**: Detect old format and migrate to new directory structure
- **Location**: `../.opencode/tools/sprint-status.ts` (internal function)
- **Responsibilities**:
  - Check for old `sprint-status.yaml` with `current_sprint` key
  - Check if `active/` directory already exists
  - Show migration prompt via tool output (agent interprets and asks user)
  - Perform migration: create dirs, write new files, rename old file
  - Handle edge cases: missing dates (FR-022), existing files (EC-9)
- **Dependencies**: `parseYaml` (existing), `node:fs/promises`
- **Key Methods**:

| Method               | Parameters             | Returns              | Description                                |
| -------------------- | ---------------------- | -------------------- | ------------------------------------------ |
| `detectOldFormat`    | `sprintsDir: string`   | `MigrationState`     | Check what format exists                   |
| `migrateToNewFormat` | `sprintsDir: string, data: SprintData` | `MigrationResult` | Perform the migration |

### 4.4 Aggregate Dashboard Renderer (`renderAggregateDashboard`)

- **Purpose**: Render multi-sprint dashboard text output
- **Location**: `../.opencode/tools/sprint-status.ts` (internal function)
- **Responsibilities**:
  - Accept array of `SprintFile` objects
  - Render each sprint with header, progress bar, story list
  - Add velocity trend from completed sprints
  - Add warning if >5 active sprints (NFR-002)
  - Maintain backward-compatible output for single-sprint case (US-003 AC-3)
- **Dependencies**: `renderProgressBar` (existing, reused)
- **Key Methods**:

| Method                       | Parameters                     | Returns  | Description                         |
| ---------------------------- | ------------------------------ | -------- | ----------------------------------- |
| `renderAggregateDashboard`   | `sprints: SprintFile[], completed: SprintFile[]` | `string` | Multi-sprint dashboard text |
| `renderSprintSection`        | `sprint: SprintFile`           | `string` | Single sprint section              |
| `renderVelocityTrend`        | `completed: SprintFile[]`      | `string` | Velocity trend footer              |
| `renderSprintList`           | `active: SprintFile[], completed: SprintFile[]`  | `string` | Compact list table      |

### 4.5 Sprint Lifecycle Manager (Agent Logic)

- **Purpose**: Orchestrate sprint creation, closure, and updates
- **Location**: `../.opencode/commands/forge-sprint.md` (command),
  `../.opencode/agents/forge-scrum.md` (agent)
- **Responsibilities**:
  - Parse subcommand from `$ARGUMENTS`
  - Route to appropriate action (start, close, list, update)
  - Handle sprint-id argument for close and update
  - Create new sprint files with sequential numbering
  - Archive sprint files on close (move from `active/` to `completed/`)
  - Mark in-progress stories as `carried_over` on close (FR-025)
  - Warn if no retrospective exists (FR-023)
- **Dependencies**: Sprint file system, `sprint-sequence.yaml`

### 4.6 Type Definitions

New TypeScript interfaces for `sprint-status.ts`:

```typescript
interface SprintFile {
  version: number
  sprint: {
    number: number
    goal: string
    start_date: string
    end_date: string
    closed_date?: string        // Only in completed sprints
    story_count?: number        // Only in completed sprints
    stories_completed?: number  // Only in completed sprints
    stories_carried_over?: number // Only in completed sprints
    stories: Story[]
    velocity: { planned: number; completed: number }
    retro?: string              // Only in completed sprints
  }
}

interface SequenceFile {
  version: number
  next_sprint_number: number
  project: string
}

interface Story {
  id: string
  title: string
  status: "pending" | "in_progress" | "done" | "blocked" | "carried_over"
  points: number
  blocked_reason?: string
}

type MigrationState =
  | { type: "new_format"; activePath: string }
  | { type: "old_format"; oldPath: string; data: SprintData }
  | { type: "template_only" }
  | { type: "no_data" }
  | { type: "conflict"; activePath: string; oldPath: string }

interface MigrationResult {
  success: boolean
  migratedActive: number
  migratedCompleted: number
  warnings: string[]
}
```

---

## 5. File Map

> **Note**: All paths are relative to the `dev/` working directory.

### Files to Create

| Path | Purpose | Estimated Size |
|------|---------|----------------|
| `../.opencode/templates/sprint-sequence.yaml` | Template for sprint sequence tracking file | S (~10 lines) |
| `../.opencode/docs/MIGRATION-SPRINT-FORMAT.md` | User-facing migration guide for old → new sprint format | M (~80 lines) |

### Files to Modify

| Path | Section/Lines | Change Description | Estimated Effort |
|------|---------------|---------------------|------------------|
| `../.opencode/tools/sprint-status.ts` | Full rewrite (Lines 1-391) | Add multi-file reading, new parser, migration engine, aggregate dashboard, type definitions | XL (4+ hrs) |
| `../.opencode/templates/sprint-status.yaml` | Full replacement (Lines 1-30) | Replace monolithic format with per-sprint template | S (15 min) |
| `../.opencode/commands/forge-sprint.md` | Lines 1-109 (full) | Add `start`, `close`, `list` subcommands; update routing logic; add migration prompt workflow | L (2 hrs) |
| `../.opencode/agents/forge-scrum.md` | Section 2 "Sprint Planning" (Lines 103-126) | Update file paths from single file to `active/` directory; add multi-sprint lifecycle instructions; add migration workflow | M (1 hr) |
| `../.opencode/docs/FORGE-GUIDE.md` | Section 3.4 (Lines ~694-733), Section 4.1 (Lines ~875-889), Section 5 (Lines ~930-975) | Update sprint examples, command table, team workflow references | L (2 hrs) |
| `../.opencode/skills/context-chain/SKILL.md` | Lines 31, 32, 35, 86, 112-113 | Change `sprint-status.yaml` references to `sprints/active/` directory | S (15 min) |

### Files to Delete

None. The old `sprint-status.yaml` template is **replaced** (not deleted) with
the new per-sprint format. User's old `sprint-status.yaml` runtime files are
renamed to `.bak` during migration, not deleted.

### Files to Reference (Read-only)

| Path | Purpose |
|------|---------|
| `./.forge/constitution.md` | Verify backward compat (Art. 9.3), naming (Art. 7), template stability (Art. 4.4) |
| `./.forge/specs/001-multi-sprint-support/spec.md` | Source requirements and edge cases |
| `./.forge/knowledge/adr/001-directory-based-sprint-storage.md` | Architectural decision for this plan |
| `../.opencode/templates/sprint-status.yaml` | Current template — baseline for migration logic |

---

## 6. Dependencies

### 6.1 New Dependencies

None. This feature uses only Node.js built-in modules (`node:fs/promises`,
`node:path`) already imported by the existing tool. No new npm packages.
Compliant with Constitution Article 2.2.

### 6.2 Internal Dependencies

- `../.opencode/tools/sprint-status.ts` — existing tool being enhanced
- `../.opencode/commands/forge-sprint.md` — existing command being enhanced
- `../.opencode/agents/forge-scrum.md` — existing agent being enhanced
- `../.opencode/templates/sprint-status.yaml` — existing template being replaced
- `../.opencode/skills/context-chain/SKILL.md` — existing skill being updated

---

## 7. Implementation Phases

### Phase 1: Foundation — Templates & Directory Structure

**Objective**: Create the new template files that define the sprint data format.
No runtime changes yet. This phase establishes the "contract" for sprint files.

**Files to Create**:
- `../.opencode/templates/sprint-sequence.yaml`
  - Purpose: Template for the sequence tracking file
  - Dependencies: None
  - Estimated effort: 15 min

**Files to Modify**:
- `../.opencode/templates/sprint-status.yaml`
  - Section/Lines: Full file (Lines 1-30)
  - Change: Replace monolithic `current_sprint`/`previous_sprints` format
    with per-sprint `version: 1` + `sprint:` format. Add `carried_over` to
    status enum comment. Add `version` field.
  - Estimated effort: 15 min

**Tasks**:
1. [ ] Create `sprint-sequence.yaml` template with `version`, `next_sprint_number`, `project` fields
2. [ ] Rewrite `sprint-status.yaml` template to per-sprint format matching spec Section 7.3
3. [ ] Verify templates parse correctly as valid YAML (manual check)

**⚠️ Breaking Change**: The `sprint-status.yaml` template changes purpose from
monolithic file to per-sprint template. Per Constitution Article 4.4, this
requires the migration guide (Phase 4) and runtime migration logic (Phase 2).

---

### Phase 2: Core Tool — Multi-File Reader, Parser, Migration, Dashboard

**Objective**: Rewrite `sprint-status.ts` to support the new directory-based
format while maintaining backward compatibility with the old format.

This is the largest phase. The tool is the foundation that both the command and
agent depend on.

**Files to Modify**:
- `../.opencode/tools/sprint-status.ts`
  - Section/Lines: Full file (Lines 1-391)
  - Change: Major enhancement. Keep existing `parseYaml()` as `parseLegacyYaml()`
    for migration. Add new parser, directory reader, migration engine, and
    aggregate dashboard renderer.
  - Estimated effort: 4+ hrs

**Tasks**:
1. [ ] Define new TypeScript interfaces: `SprintFile`, `SequenceFile`, `Story` (with `carried_over` status), `MigrationState`, `MigrationResult`
2. [ ] Rename existing `parseYaml()` to `parseLegacyYaml()` and preserve for migration
3. [ ] Implement `parseSprintYaml(content: string): SprintFile` for new per-sprint format
4. [ ] Implement `parseSequenceYaml(content: string): SequenceFile` for sequence file
5. [ ] Implement `readActiveSprints(sprintsDir: string): Promise<SprintFile[]>` — readdir, filter `sprint-*.yaml`, parse each, sort by number, detect duplicates
6. [ ] Implement `readCompletedSprints(sprintsDir: string, limit: number): Promise<SprintFile[]>` — readdir, sort by filename (date prefix), take last N
7. [ ] Implement `detectOldFormat(sprintsDir: string): Promise<MigrationState>` — check for old file vs new directory vs template-only vs no data vs conflict
8. [ ] Implement `migrateToNewFormat(sprintsDir: string, data: SprintData): Promise<MigrationResult>` — mkdir, write files, handle missing dates (FR-022), rename old file, handle conflicts (EC-8, EC-9)
9. [ ] Implement `rebuildSequenceFile(sprintsDir: string): Promise<SequenceFile>` — recovery for missing/corrupt sequence file (EC-5)
10. [ ] Implement `renderSprintSection(sprint: SprintFile): string` — single sprint block with header, progress bar, story list grouped by status
11. [ ] Implement `renderVelocityTrend(completed: SprintFile[]): string` — velocity trend from completed sprints
12. [ ] Implement `renderAggregateDashboard(sprints: SprintFile[], completed: SprintFile[]): string` — aggregate dashboard with >5 sprint warning (NFR-002)
13. [ ] Implement `renderSprintList(active: SprintFile[], completed: SprintFile[]): string` — compact table format (FR-026)
14. [ ] Update main `execute()` function: detect format → migrate or read → render dashboard
15. [ ] Update tool description string to reflect new capabilities
16. [ ] Add filesystem error handling: catch ENOENT, EEXIST, EACCES with actionable messages (NFR-006)
17. [ ] Handle `version` field in parser: known versions parsed normally, unknown versions with warning + best-effort (FR-024)

**Implementation Notes for Task 14 (execute flow)**:

```
execute():
  1. Determine sprintsDir = join(rootDir, ".forge", "sprints")
  2. state = detectOldFormat(sprintsDir)
  3. Switch on state.type:
     - "new_format":  Read active/ → renderAggregateDashboard
     - "old_format":  Return migration prompt text (agent handles confirmation)
     - "template_only": Return template message (unchanged behavior)
     - "no_data":     Return "No active sprints" message
     - "conflict":    Return warning about both formats existing
  4. If no active sprints in new format: "No active sprints. Run /forge-sprint start."
  5. If >5 active sprints: prepend warning banner
```

---

### Phase 3: Command & Agent — Subcommands and Multi-Sprint Lifecycle

**Objective**: Update the forge-sprint command to support `start`, `close`,
`list`, and `update` subcommands. Update the forge-scrum agent to handle
multi-sprint lifecycle operations.

**Files to Modify**:
- `../.opencode/commands/forge-sprint.md`
  - Section/Lines: Full file (Lines 1-109)
  - Change: Restructure arguments section to handle subcommands. Add
    `start`, `close [sprint-id]`, `list`, and `update [sprint-id]` action
    sections. Add migration prompt workflow. Update file path references.
  - Estimated effort: 2 hrs

- `../.opencode/agents/forge-scrum.md`
  - Section/Lines: Section "2. Sprint Planning" (Lines 103-126), also
    Section "4. Sprint Status" (Lines 141-147)
  - Change: Update all `sprint-status.yaml` references to `active/` directory.
    Add multi-sprint instructions: reading sprint-sequence.yaml, creating
    files in active/, archiving to completed/, handling carried_over status.
    Add migration workflow description. Update sprint update logic for
    multi-sprint selection prompt (FR-009).
  - Estimated effort: 1 hr

**Tasks**:
1. [ ] Rewrite `forge-sprint.md` argument parsing: detect subcommand from `$ARGUMENTS` (start, close, list, update, or empty)
2. [ ] Add "Action: Start" section — read `sprint-sequence.yaml`, create `active/sprint-NNN.yaml`, increment sequence, handle missing sequence (recovery)
3. [ ] Add "Action: Close" section — read target sprint from `active/`, mark `in_progress`/`pending` as `carried_over` (FR-025), write to `completed/YYYY-MM-DD-sprint-NNN.yaml`, handle filename collision (EC-8), check for retrospective (FR-023)
4. [ ] Add "Action: List" section — invoke tool with list mode, show compact table (FR-026)
5. [ ] Update "Action: Update" section — if multiple active sprints and no sprint-id: prompt user to select (FR-009). If single active sprint: update directly.
6. [ ] Add "No-args smart default" section — if active sprints exist show dashboard, else start new sprint (FR-020)
7. [ ] Add "Migration" section — if old format detected, show migration prompt, handle user response
8. [ ] Update `forge-scrum.md` Section 2 file paths: `sprint-status.yaml` → `active/sprint-NNN.yaml`, `sprint-sequence.yaml`
9. [ ] Update `forge-scrum.md` Section 2 "New sprint" workflow: read sequence file, create in `active/`, increment sequence
10. [ ] Update `forge-scrum.md` Section 2 "Close sprint" workflow: archive to `completed/`, handle carry-over
11. [ ] Update `forge-scrum.md` Section 4 "Sprint Status": reference `active/` directory instead of single file

---

### Phase 4: Context & Documentation

**Objective**: Update all documentation and context-loading references to
reflect the new directory structure. Create the migration guide.

**Files to Create**:
- `../.opencode/docs/MIGRATION-SPRINT-FORMAT.md`
  - Purpose: User-facing guide explaining the old → new sprint format
    migration. Includes what changed, why, how to migrate, and how to
    verify the migration succeeded.
  - Dependencies: Phase 1-2 completion (to accurately document the format)
  - Estimated effort: 1 hr

**Files to Modify**:
- `../.opencode/skills/context-chain/SKILL.md`
  - Section/Lines: Phase-to-Document Mapping table (Lines 31-36),
    Size Guidelines table (Line 86), Cross-Session Context section
    (Lines 112-113)
  - Change: Replace `sprint-status.yaml` with `sprints/active/` directory
    reference in Sprint Planning, Story Creation, and Retrospective phases.
    Update size guideline from single file to directory.
  - Estimated effort: 15 min

- `../.opencode/docs/FORGE-GUIDE.md`
  - Section 3.4 Epic Track example (Lines ~694-733): Update sprint
    planning example output to show multi-sprint capability. Update file
    output reference from `sprint-status.yaml` to `active/sprint-NNN.yaml`.
  - Section 4.1 Command Reference (Lines ~875-889): Update `/forge-sprint`
    row to show subcommands: `start | close [id] | list | update [id]`.
  - Section 5 Team Workflows (Lines ~930-975): Update references to
    `sprint-status.yaml` to reference `active/` directory. Update
    "one person updates sprint-status.yaml" guidance.
  - Estimated effort: 2 hrs

**Tasks**:
1. [ ] Create `MIGRATION-SPRINT-FORMAT.md` with: overview, what changed, migration steps, verification, rollback, FAQ
2. [ ] Update `context-chain/SKILL.md` table: Sprint Planning required docs → `sprints/active/sprint-NNN.yaml`
3. [ ] Update `context-chain/SKILL.md` table: Retrospective required docs → `sprints/active/` or `completed/`
4. [ ] Update `context-chain/SKILL.md` size guidelines: `sprint-status.yaml` → `active/ directory (read all files)`
5. [ ] Update `context-chain/SKILL.md` cross-session context: `sprint-status.yaml` → `sprints/active/`
6. [ ] Update `FORGE-GUIDE.md` Section 3.4: Epic Track sprint planning example
7. [ ] Update `FORGE-GUIDE.md` Section 4.1: `/forge-sprint` command row with subcommands
8. [ ] Update `FORGE-GUIDE.md` Section 5: Team workflow sprint references
9. [ ] Review all `sprint-status.yaml` references in FORGE-GUIDE.md (~15 occurrences) and update or add context

---

### Phase 5: Validation & Review Readiness

**Objective**: Verify the implementation through dogfooding and edge case
testing. Prepare for adversarial review.

**Files to Modify**:
- None created in this phase. This phase is about testing the output of
  Phases 1-4.

**Tasks**:
1. [ ] **Dogfooding test**: Use `/forge-sprint start` to create a sprint for the next FORGE feature. Verify file created in `active/`.
2. [ ] **Dogfooding test**: Use `/forge-sprint close` to archive the test sprint. Verify file moved to `completed/`.
3. [ ] **Dogfooding test**: Use `/forge-status` to render dashboard. Verify output matches spec Section 9 UX layout.
4. [ ] **Migration test**: Create a mock `sprint-status.yaml` in old format. Run the tool. Verify migration prompt appears.
5. [ ] **Migration test**: Confirm migration. Verify `active/`, `completed/`, `sprint-sequence.yaml` created. Verify `.bak` file.
6. [ ] **Migration test**: Decline migration. Verify old format still reads correctly (legacy fallback).
7. [ ] **Edge case test**: Missing `sprint-sequence.yaml` — verify recovery rebuilds it.
8. [ ] **Edge case test**: Close sprint with `in_progress` stories — verify `carried_over` status.
9. [ ] **Edge case test**: >5 active sprints — verify warning banner renders.
10. [ ] **Edge case test**: Empty `active/` directory — verify "No active sprints" message.
11. [ ] **Edge case test**: Archive filename collision — verify `-2` suffix appended.
12. [ ] **Documentation test**: Verify all examples in `FORGE-GUIDE.md` and `MIGRATION-SPRINT-FORMAT.md` are accurate.
13. [ ] Run `/forge-review` for adversarial review (Constitution Article 4.2)

---

## 8. Testing Strategy

### 8.1 Dogfooding Tests

| Component                        | Test Focus                                                |
| -------------------------------- | --------------------------------------------------------- |
| `sprint-status.ts` (tool)        | Create sprints, render dashboard, verify output format    |
| `forge-sprint.md` (command)      | Run each subcommand (start, close, list, update)          |
| Migration engine                 | Migrate old format fixture, verify new files correct      |
| `forge-scrum.md` (agent)         | Full sprint lifecycle with multi-sprint overlap           |

### 8.2 Manual Verification Tests

| Scenario                                                | Dependencies           |
| ------------------------------------------------------- | ---------------------- |
| Start sprint → close sprint → verify archive            | Phase 2, 3 complete    |
| Start 2 sprints → dashboard shows both                  | Phase 2, 3 complete    |
| Old format migration → new format read                  | Phase 2 complete       |
| Close sprint with carried-over stories                   | Phase 2, 3 complete    |
| List shows active + completed                           | Phase 2, 3 complete    |
| Sequence file recovery from missing                     | Phase 2 complete       |
| Update with multi-sprint selection prompt               | Phase 3 complete       |
| Context chain loads correct sprint files                 | Phase 4 complete       |

### 8.3 Template Validation Tests

| Template                   | Validation                                           |
| -------------------------- | ---------------------------------------------------- |
| `sprint-status.yaml`       | Parses as valid YAML, `parseSprintYaml` succeeds     |
| `sprint-sequence.yaml`     | Parses as valid YAML, `parseSequenceYaml` succeeds   |
| Migrated old format files  | Each output file parses with new parser              |

---

## 9. Architectural Decisions

| ADR     | Decision                                    | Status    |
| ------- | ------------------------------------------- | --------- |
| ADR-001 | Directory-based sprint storage over single file | Proposed |

See `.forge/knowledge/adr/001-directory-based-sprint-storage.md` for full
analysis of alternatives and rationale.

---

## 10. Requirement Traceability

| Requirement | Plan Section              | Implementation Path                              |
| ----------- | ------------------------- | ------------------------------------------------ |
| FR-001      | §2.3 Directory Structure  | `../.opencode/tools/sprint-status.ts` (mkdir)    |
| FR-002      | §2.1 Active Sprint Schema | `../.opencode/tools/sprint-status.ts` (naming)   |
| FR-003      | §2.1 Sequence Schema      | `../.opencode/templates/sprint-sequence.yaml`    |
| FR-004      | §4.2 Directory Reader     | `../.opencode/tools/sprint-status.ts` (readdir)  |
| FR-005      | §7 Phase 3, Task 2        | `../.opencode/commands/forge-sprint.md` (start)  |
| FR-006      | §7 Phase 3, Task 3        | `../.opencode/commands/forge-sprint.md` (close)  |
| FR-007      | §7 Phase 3, Task 3        | `../.opencode/commands/forge-sprint.md` (close default) |
| FR-008      | §7 Phase 3, Task 4        | `../.opencode/commands/forge-sprint.md` (list)   |
| FR-009      | §7 Phase 3, Task 5        | `../.opencode/commands/forge-sprint.md` (update) |
| FR-010      | §2.1 Completed Schema     | `../.opencode/tools/sprint-status.ts` (archive)  |
| FR-011      | §4.2 Directory Reader     | `../.opencode/tools/sprint-status.ts` (readdir)  |
| FR-012      | §4.4 Aggregate Dashboard  | `../.opencode/tools/sprint-status.ts` (render)   |
| FR-013      | §4.4 Velocity Trend       | `../.opencode/tools/sprint-status.ts` (render)   |
| FR-014      | §4.3 Migration Engine     | `../.opencode/tools/sprint-status.ts` (detect)   |
| FR-015      | §4.3 Migration Engine     | `../.opencode/tools/sprint-status.ts` (prompt)   |
| FR-016      | §2.4 Migration Step 6     | `../.opencode/tools/sprint-status.ts` (migrate)  |
| FR-017      | §2.4 Migration Step 7     | `../.opencode/tools/sprint-status.ts` (migrate)  |
| FR-018      | §2.4 Migration Step 9     | `../.opencode/tools/sprint-status.ts` (rename)   |
| FR-019      | §4.3 MigrationState       | `../.opencode/tools/sprint-status.ts` (fallback) |
| FR-020      | §7 Phase 3, Task 6        | `../.opencode/commands/forge-sprint.md` (default) |
| FR-021      | §7 Phase 1, Task 2        | `../.opencode/templates/sprint-status.yaml`      |
| FR-022      | §2.4 Migration Step 7     | `../.opencode/tools/sprint-status.ts` (migrate)  |
| FR-023      | §7 Phase 3, Task 3        | `../.opencode/commands/forge-sprint.md` (close)  |
| FR-024      | §4.1 Version Handling     | `../.opencode/tools/sprint-status.ts` (parser)   |
| FR-025      | §4.1 Story Type, §7 Ph3   | `../.opencode/tools/sprint-status.ts`, `forge-sprint.md` |
| FR-026      | §4.4 Sprint List          | `../.opencode/tools/sprint-status.ts` (render)   |
| NFR-001     | §4.3 Migration Engine     | `../.opencode/tools/sprint-status.ts` (detect)   |
| NFR-002     | §4.4 Aggregate Dashboard  | `../.opencode/tools/sprint-status.ts` (warning)  |
| NFR-003     | §2.4 Migration Steps      | `../.opencode/tools/sprint-status.ts` (.bak)     |
| NFR-004     | §2.1 Active Sprint Schema | Per-sprint files < 100 lines                     |
| NFR-005     | §2.1 Version Field        | `version: 1` in all templates                    |
| NFR-006     | §3.3 Error Responses      | `../.opencode/tools/sprint-status.ts` (catch)    |
| NFR-007     | §7 Phase 4                | `../.opencode/docs/FORGE-GUIDE.md`               |

---

## 11. Constitution Compliance

| Article | Status    | Notes                                                                                         |
| ------- | --------- | --------------------------------------------------------------------------------------------- |
| Art. 1  | COMPLIANT | Dogfooding: plan developed using FORGE. Documentation parity: migration guide + FORGE-GUIDE update in Phase 4. Path explicitness: all paths explicit in file map. |
| Art. 2  | COMPLIANT | No new dependencies. TypeScript tool, YAML configs, Markdown docs. All within approved stack. |
| Art. 3  | COMPLIANT | Data pattern change documented in ADR-001. File naming follows spec directory pattern (NNN zero-padded). Path conventions use explicit `../` and `./` prefixes. |
| Art. 4  | COMPLIANT | Template breaking change documented. Version field added (`version: 1`). Migration path provided. Adversarial review planned in Phase 5. |
| Art. 5  | COMPLIANT | Sprint IDs are numeric, validated. No user content executed. File paths validated. No secrets in sprint files. |
| Art. 6  | COMPLIANT | All error messages include cause + explanation + actionable next step (NFR-006). Graceful degradation: missing sequence file recovered, old format falls back to legacy parser. |
| Art. 7  | COMPLIANT | Sprint files: `sprint-NNN.yaml` (matches NNN pattern). Archive files: ISO date prefix. Command: `/forge-sprint` with verb subcommands. Agent: `forge-scrum.md`. |
| Art. 8  | COMPLIANT | Dogfooding tests in Phase 5. Manual verification for all commands. Template validation. Documentation examples tested. |
| Art. 9  | COMPLIANT | Backward compatibility: auto-detect + migration prompt + legacy fallback. Migration guide created. Template versioned. |

---

## 12. Risk Assessment

| # | Risk                                          | Likelihood | Impact | Mitigation                                                              |
|---|-----------------------------------------------|------------|--------|-------------------------------------------------------------------------|
| 1 | Migration corrupts sprint data                | Low        | High   | Backup to `.bak` before any modification. Migration is read-then-write, never in-place edit. |
| 2 | Custom YAML parser fails on edge cases        | Medium     | Medium | Parser only handles known schema. Unknown fields ignored. Version field enables future format changes. |
| 3 | Concurrent branch edits to `sprint-sequence.yaml` | Medium | Low    | Git merge conflict catches it naturally (Edge Case #12). Recovery logic rebuilds from scanning. |
| 4 | Agent context window bloat from multiple sprint files | Low  | Medium | Each sprint file < 100 lines (NFR-004). Dashboard reads only `active/`. `completed/` only on demand. |
| 5 | Breaking change impacts existing FORGE users  | Medium     | Medium | Auto-detect + prompted migration. Legacy fallback if declined. `.bak` for recovery. Migration guide. |
| 6 | `forge-sprint.md` command complexity increases significantly | Medium | Low | Clear subcommand routing. Each action is self-contained. Agent handles orchestration. |

---

## Cross-References

| Document             | Path                                                            |
| -------------------- | --------------------------------------------------------------- |
| Spec                 | `.forge/specs/001-multi-sprint-support/spec.md`                 |
| ADR-001              | `.forge/knowledge/adr/001-directory-based-sprint-storage.md`    |
| Tasks                | <!-- Created by /forge-tasks -->                                |
| Constitution         | `.forge/constitution.md`                                        |
| Current Tool         | `../.opencode/tools/sprint-status.ts`                           |
| Current Command      | `../.opencode/commands/forge-sprint.md`                         |
| Current Agent        | `../.opencode/agents/forge-scrum.md`                            |
| Current Template     | `../.opencode/templates/sprint-status.yaml`                     |
| Context Chain Skill  | `../.opencode/skills/context-chain/SKILL.md`                    |
| FORGE Guide          | `../.opencode/docs/FORGE-GUIDE.md`                              |
