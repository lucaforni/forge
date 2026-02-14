# Spec: 001 - Multi-Sprint Support with Automatic Archiving

> Feature specification for the Feature track.
> Created by the `forge-pm` agent via `/forge-specify`.

| Field   | Value                                      |
| ------- | ------------------------------------------ |
| Status  | Clarified                                  |
| Author  | forge-pm                                   |
| Date    | 2026-02-14                                 |
| Track   | Feature                                    |
| Spec ID | 001                                        |

---

## 1. Overview

Redesign the FORGE sprint management system to support multiple concurrent
active sprints with automatic archiving of completed sprints. The current
single-file `sprint-status.yaml` model is replaced by a directory-based
structure with `active/` and `completed/` subdirectories, each sprint tracked
in its own YAML file. This enables sprint overlap scenarios (planning the next
sprint while the current one is closing), multi-team parallel development, and
clean historical data preservation with bounded file sizes.

---

## 2. Problem Statement

The current FORGE sprint system uses a single `sprint-status.yaml` file that
serves as both the active sprint tracker and the historical sprint archive
(via its `previous_sprints` array). This design has three problems:

1. **No sprint overlap**: There is exactly one `current_sprint` slot. A team
   cannot begin planning Sprint 2 while Sprint 1 still has in-progress stories
   being wrapped up. The scrum master must fully close Sprint 1 before
   `/forge-sprint new` can initialize Sprint 2.

2. **No parallel team support**: In a multi-team environment, teams cannot
   maintain independent sprints. All sprint data is funneled through the same
   `current_sprint` key.

3. **Unbounded file growth**: As sprints accumulate, `previous_sprints` grows
   indefinitely within a single file. After 20+ sprints, the file becomes
   difficult to read, diff in PRs, and parse in context windows.

4. **No clean archive boundary**: Completed sprint data is interleaved with
   active sprint data. There is no filesystem-level separation between "live
   work" and "historical record," making it harder for agents to load only
   relevant context.

**Why now**: FORGE has documented the multi-developer workflow (FORGE-GUIDE.md
Section 5) and Epic track with sprints (Section 3.4), but the underlying sprint
infrastructure only supports the simplest case. Before FORGE adoption grows,
the data model needs to be correct.

---

## 3. User Stories

### US-001: Sprint Overlap

**As a** scrum master,
**I want** to start planning the next sprint while the current sprint still has
in-progress stories,
**so that** there is no gap between sprints and work can flow continuously.

**Acceptance Criteria:**
- Given Sprint S001 is active with 2 stories still `in_progress`, when the
  scrum master runs `/forge-sprint start`, then a new sprint S002 is created
  in `active/` alongside S001.
- Given S001 and S002 are both active, when the scrum master runs
  `/forge-status`, then a dashboard shows both sprints with independent
  progress bars.
- Given S001 is closed via `/forge-sprint close S001`, when the user lists
  active sprints, then only S002 appears.

### US-002: Sprint Archiving

**As a** scrum master,
**I want** completed sprints to be automatically archived with a datestamp,
**so that** historical sprint data is preserved but does not clutter the active
sprint directory.

**Acceptance Criteria:**
- Given Sprint S001 is active and has all stories marked `done`, when the
  scrum master runs `/forge-sprint close S001`, then the sprint file is moved
  from `active/sprint-001.yaml` to `completed/2026-02-14-sprint-001.yaml`.
- Given a sprint was archived on 2026-02-14, when the file is inspected, then
  it contains the sprint metadata (number, goal, velocity, dates) and the
  complete story list (ID, title, final status, points) for retrospective
  cross-referencing.
- Given 10 completed sprints exist, when a new sprint is closed, then it is
  archived alongside the others without modifying any existing archive files.

### US-003: Aggregate Dashboard

**As a** developer or scrum master,
**I want** `/forge-status` to show all active sprints in a single dashboard,
**so that** I can see the full picture of ongoing work across sprints.

**Acceptance Criteria:**
- Given 2 active sprints exist, when the sprint-status tool runs, then both
  sprints are displayed with their own headers, progress bars, story lists,
  and velocity metrics.
- Given 0 active sprints exist, when the sprint-status tool runs, then a
  message says "No active sprints" with guidance to run `/forge-sprint start`.
- Given 1 active sprint exists, when the sprint-status tool runs, then the
  display is identical to the current single-sprint dashboard (backward-
  compatible visual output for the common case).

### US-004: Sprint Command Subcommands

**As a** scrum master,
**I want** `/forge-sprint` to support `start`, `close`, and `list` subcommands,
**so that** I have precise control over sprint lifecycle management.

**Acceptance Criteria:**
- Given no arguments, when `/forge-sprint` is invoked and active sprints
  exist, then it displays the sprint status dashboard (same as `/forge-status`).
- Given no arguments, when `/forge-sprint` is invoked and no active sprints
  exist, then it creates a new sprint (equivalent to `/forge-sprint start`).
- Given `/forge-sprint start`, when invoked, then a new sprint is created in
  `active/` with the next sequential sprint number.
- Given `/forge-sprint close [sprint-id]`, when invoked, then the specified
  sprint is archived to `completed/`. If no `sprint-id` is given, close the
  oldest active sprint.
- Given `/forge-sprint list`, when invoked, then all active and recent
  completed sprints are listed with their status, dates, and velocity.
- Given `/forge-sprint update`, when invoked with a single active sprint,
  then story statuses can be updated (existing behavior preserved).
- Given `/forge-sprint update` with multiple active sprints and no sprint-id
  argument, when invoked, then the user is shown a selection prompt listing
  all active sprints to choose from.
- Given `/forge-sprint update S002`, when invoked, then story statuses in
  sprint S002 are updated directly (no prompt).

### US-005: Migration from Old Format

**As a** FORGE user with an existing `sprint-status.yaml`,
**I want** FORGE to detect my old format and offer to migrate it,
**so that** I can adopt the new sprint structure without losing data.

**Acceptance Criteria:**
- Given an existing `.forge/sprints/sprint-status.yaml` (old format), when
  the sprint-status tool or `/forge-sprint` is invoked, then the user is
  shown a migration prompt explaining the change and asking for confirmation.
- Given the user confirms migration, when migration runs, then
  `current_sprint` is converted to `active/sprint-NNN.yaml` and
  `previous_sprints` are each converted to `completed/YYYY-MM-DD-sprint-NNN.yaml`
  summary files.
- Given the user declines migration, when the tool continues, then the old
  format is read using the legacy parser (no data loss, but new features
  unavailable).
- Given migration completes, when the old `sprint-status.yaml` is inspected,
  then it has been renamed to `sprint-status.yaml.bak` (not deleted).

---

## 4. Functional Requirements

| ID     | Requirement                                                                                     | Priority | Story Ref |
| ------ | ----------------------------------------------------------------------------------------------- | -------- | --------- |
| FR-001 | Create directory structure: `.forge/sprints/active/`, `.forge/sprints/completed/`                | Must     | US-001    |
| FR-002 | Each sprint stored as `active/sprint-NNN.yaml` with zero-padded 3-digit number                  | Must     | US-001    |
| FR-003 | Maintain `sprint-sequence.yaml` in `.forge/sprints/` tracking the next sprint number            | Must     | US-001    |
| FR-004 | No hard limit on concurrent active sprints                                                      | Must     | US-001    |
| FR-005 | `/forge-sprint start` creates a new sprint file in `active/` with next sequential number        | Must     | US-004    |
| FR-006 | `/forge-sprint close [sprint-id]` archives sprint to `completed/YYYY-MM-DD-sprint-NNN.yaml`     | Must     | US-002    |
| FR-007 | Close without sprint-id defaults to oldest active sprint                                        | Should   | US-004    |
| FR-008 | `/forge-sprint list` shows all active + last 5 completed sprints                                | Must     | US-004    |
| FR-009 | `/forge-sprint update [sprint-id]` updates story statuses. If multiple active sprints and no sprint-id given, prompt user to select target sprint. | Must     | US-004    |
| FR-010 | Archive file contains full sprint data: number, goal, velocity, dates, and complete story list (ID, title, final status, points) | Must     | US-002    |
| FR-011 | `sprint-status` tool reads all files in `active/` and renders aggregate dashboard               | Must     | US-003    |
| FR-012 | Dashboard displays each active sprint with its own header, progress bar, and story list          | Must     | US-003    |
| FR-013 | Dashboard shows velocity trend from `completed/` files                                          | Should   | US-003    |
| FR-014 | Auto-detect old `sprint-status.yaml` format on tool/command invocation                          | Must     | US-005    |
| FR-015 | Prompt user before migrating (explain changes, ask confirmation)                                | Must     | US-005    |
| FR-016 | Migration converts `current_sprint` to `active/sprint-NNN.yaml`                                | Must     | US-005    |
| FR-017 | Migration converts each `previous_sprints` entry to `completed/` summary file                   | Must     | US-005    |
| FR-018 | Migration renames old file to `sprint-status.yaml.bak` (no deletion)                            | Must     | US-005    |
| FR-019 | Legacy fallback: if user declines migration, read old format with existing parser               | Should   | US-005    |
| FR-020 | `/forge-sprint` with no args: if active sprints exist, show dashboard; if none exist, start a new sprint | Must     | US-004    |
| FR-021 | Update sprint template to reflect new per-sprint file format                                    | Must     | US-001    |
| FR-022 | Migration handles missing `end_date` on previous sprints: use sprint number for ordering, log warning | Must     | US-005    |
| FR-023 | `/forge-sprint close` warns (non-blocking) if no retrospective exists for the sprint           | Should   | US-002    |
| FR-024 | Sprint file parser reads `version` field and handles v1 format; forward-compatible design       | Must     | US-001    |
| FR-025 | When closing a sprint with `in_progress` or `pending` stories, mark those stories as `carried_over` in the archive file. Stories are NOT auto-moved to another sprint; the scrum master re-adds them manually via `/forge-sprint update`. | Must     | US-001, US-002 |
| FR-026 | `/forge-sprint list` renders a compact table: `| # | Status | Goal | Period | Velocity |` with one row per sprint. Shows all active + last 5 completed. | Must     | US-004    |

---

## 5. Non-Functional Requirements

| ID      | Category              | Requirement                                                                                | Target                          |
| ------- | --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------- |
| NFR-001 | Backward Compatibility| Old `sprint-status.yaml` format must be auto-detected and read without error               | 100% old-format read support    |
| NFR-002 | Performance           | Dashboard rendering for up to 5 active sprints must complete within target. Above 5 active sprints, display a warning ("⚠ 7 active sprints detected. Consider closing completed sprints for optimal performance.") but continue rendering. | < 500ms for ≤5 sprints; soft warning above 5 |
| NFR-003 | Data Integrity        | Migration must not lose any sprint data; backup always created                             | Zero data loss                  |
| NFR-004 | Context Efficiency    | Active sprint files should be small enough for agent context loading                       | < 100 lines per sprint file     |
| NFR-005 | Template Versioning   | Sprint template must include version metadata for future format changes                    | Version field in template YAML  |
| NFR-006 | Exception Handling    | Sprint operations must catch all filesystem errors (ENOENT, EEXIST, EACCES) and prevent unhandled exceptions. No crash or data corruption on concurrent file access. | No unhandled FS exceptions; graceful degradation |
| NFR-007 | Error Message Quality | All error messages must follow Constitution Article 6.1 format: explain cause, explain impact, suggest actionable next step with example. | All error messages actionable with retry guidance |
| NFR-008 | Documentation Parity  | All command changes documented in FORGE-GUIDE.md before release (per Constitution Art 1.2) | Guide updated with spec release |

### 5.1 NFR Verification Procedures

Each NFR must have a concrete, measurable verification procedure to ensure compliance during testing and review.

| NFR ID | Verification Procedure | Pass Criteria |
|--------|------------------------|---------------|
| NFR-001 | Create an old-format `sprint-status.yaml` with sample data (current_sprint + previous_sprints). Run `/forge-status`. Verify it displays without error. | Dashboard renders correctly showing old format data |
| NFR-002 | Create 5 active sprint files. Run `/forge-status` and measure tool execution time. Create 7 active sprint files and verify warning appears. | Tool completes in <500ms for 5 sprints; warning displayed for 7+ sprints |
| NFR-003 | Create old-format file with test data. Run migration. Compare original file (now `.bak`) byte-for-byte against migrated files. Verify all fields (sprint number, goal, dates, velocity, story data) preserved. | Byte-for-byte field parity; no data loss |
| NFR-004 | Measure line count of generated `sprint-NNN.yaml` file with typical sprint (5 stories, full metadata). | File ≤ 100 lines |
| NFR-005 | Inspect new sprint file template. Verify `version: 1` field present in YAML schema. | Version field exists in template |
| NFR-006 | Inject filesystem errors (make `active/` read-only, delete `active/` during operation). Verify no unhandled exceptions. | All FS errors caught; no crashes |
| NFR-007 | Review all error messages in code. For each, verify it includes: (1) cause description, (2) impact explanation, (3) actionable retry suggestion with example command. | 100% of error messages have all 3 elements |
| NFR-008 | Compare release spec date with FORGE-GUIDE.md last modified date. Verify guide has been updated in same commit. Manually review that all new subcommands are documented with examples. | Guide commit date ≥ spec completion date; all subcommands documented |

---

## 6. Edge Cases & Error Scenarios

| #  | Scenario                                                    | Expected Behavior                                                                        |
| -- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1  | No `.forge/sprints/` directory exists                       | Create directory structure on first `/forge-sprint start`                                |
| 2  | `active/` directory is empty (no active sprints)            | Dashboard shows "No active sprints. Run `/forge-sprint start`."                          |
| 3  | Attempt to close a sprint with stories still `in_progress`  | Warn user, offer two choices: (a) mark remaining stories as `carried_over` in archive and close, or (b) cancel close. Carried-over stories are NOT auto-added to another sprint — scrum master re-adds them manually. |
| 4  | Attempt to close a sprint that does not exist               | Error: "Sprint NNN not found in active sprints. Active sprints: [list]."                 |
| 5  | `sprint-sequence.yaml` missing or corrupt                   | Rebuild by scanning `active/` and `completed/` for highest sprint number + 1             |
| 6  | Old `sprint-status.yaml` with template data only            | Show existing "template data" message, suggest `/forge-sprint start`                     |
| 7  | Duplicate sprint numbers in `active/`                       | Error with guidance; should never happen if sequence file is used                        |
| 8  | Archiving to `completed/` when file with same name exists   | Append incrementing suffix: `2026-02-14-sprint-001-2.yaml`                               |
| 9  | Migration when `active/` or `completed/` already has files  | Warn user, skip migration for conflicting entries, report what was skipped                |
| 10 | Very large number of completed sprints (100+)               | Dashboard only reads `active/` files; `completed/` not loaded unless `list` is requested |
| 11 | Migration: `previous_sprints` entries missing `end_date`    | Use sprint number for archive filename ordering; log warning about missing date to user  |
| 12 | Two developers run `/forge-sprint start` on different branches | Git merge conflict on `sprint-sequence.yaml` catches the issue; same as any `.forge/` conflict |
| 13 | FORGE version upgrade with new template version             | Parser checks `version` field; unknown versions handled with warning + best-effort parse |

---

## 7. Data Requirements

### 7.1 New Directory Structure

```
.forge/sprints/
├── sprint-sequence.yaml          # Tracks next sprint number
├── active/                       # Currently running sprints
│   ├── sprint-001.yaml           # Sprint 1 (in progress)
│   └── sprint-002.yaml           # Sprint 2 (planning phase)
├── completed/                    # Archived sprints (summary only)
│   ├── 2026-01-20-sprint-001.yaml
│   └── 2026-02-03-sprint-002.yaml
└── retrospectives/               # Unchanged from current structure
    ├── sprint-001-retro.md
    └── sprint-002-retro.md
```

### 7.2 Sprint Sequence File

```yaml
# .forge/sprints/sprint-sequence.yaml
# Auto-managed by forge-scrum agent. Do not edit manually.
version: 1
next_sprint_number: 3
project: "Project Name"
```

### 7.3 Active Sprint File Format (New)

```yaml
# .forge/sprints/active/sprint-001.yaml
version: 1
sprint:
  number: 1
  goal: "Core payments integration"
  start_date: "2026-02-03"
  end_date: "2026-02-14"

  stories:
    - id: "E01-S001"
      title: "Stripe SDK setup"
      status: done              # pending | in_progress | done | blocked | carried_over
      points: 5
    - id: "E01-S002"
      title: "Customer model"
      status: in_progress
      points: 8
      blocked_reason: ""

  velocity:
    planned: 21
    completed: 5
```

### 7.4 Completed Sprint File Format (New)

```yaml
# .forge/sprints/completed/2026-02-14-sprint-001.yaml
version: 1
sprint:
  number: 1
  goal: "Core payments integration"
  start_date: "2026-02-03"
  end_date: "2026-02-14"
  closed_date: "2026-02-14"
  story_count: 6
  stories_completed: 5
  stories_carried_over: 1

  stories:
    - id: "E01-S001"
      title: "Stripe SDK setup"
      status: done
      points: 5
    - id: "E01-S002"
      title: "Customer model"
      status: done
      points: 8
    - id: "E01-S003"
      title: "Payment method CRUD"
      status: done
      points: 3
    - id: "E01-S004"
      title: "Charge endpoint"
      status: done
      points: 2
    - id: "E01-S005"
      title: "Refund handling"
      status: done
      points: 3
    - id: "E01-S006"
      title: "Webhook integration"
      status: carried_over
      points: 5

  velocity:
    planned: 21
    completed: 18
  retro: ".forge/sprints/retrospectives/sprint-001-retro.md"
```

### 7.5 Old Format (Reference for Migration)

The old format stores everything in a single `sprint-status.yaml` with
`current_sprint` and `previous_sprints` keys. See current template at
`../.opencode/templates/sprint-status.yaml` for exact schema.

---

## 8. API Requirements

This feature does not expose HTTP APIs. All interaction is through OpenCode
tools and slash commands.

| Interface    | Path / Invocation                    | Description                                    |
| ------------ | ------------------------------------ | ---------------------------------------------- |
| Tool         | `sprint-status` (OpenCode tool)      | Reads `active/` directory, renders dashboard   |
| Command      | `/forge-sprint start`                | Creates new sprint in `active/`                |
| Command      | `/forge-sprint close [NNN]`          | Archives sprint to `completed/`                |
| Command      | `/forge-sprint list`                 | Lists active + recent completed sprints        |
| Command      | `/forge-sprint update`               | Updates story statuses in active sprint        |

---

## 9. UX/UI Notes

### Dashboard Layout (Aggregate Mode)

When multiple sprints are active, the dashboard renders them sequentially:

```
=== FORGE Sprint Dashboard ===

Sprint 1 | Goal: Core payments integration
Project: MyProject
Period: 2026-02-03 — 2026-02-14

Progress: ████████████████░░░░ 4/5 stories (80%)
Points:   18/21 pts (avg velocity: 16 pts)

Done (4):
  [done]      E01-S001 Stripe SDK setup [5pt]
  [done]      E01-S002 Customer model [8pt]
  [done]      E01-S003 Payment method CRUD [3pt]
  [done]      E01-S004 Charge endpoint [2pt]

In Progress (1):
  [active]    E01-S005 Refund handling [3pt]

---

Sprint 2 | Goal: Subscription management
Period: 2026-02-10 — 2026-02-21

Progress: ░░░░░░░░░░░░░░░░░░░░ 0/4 stories (0%)
Points:   0/16 pts

Pending (4):
  [pending]   E02-S001 Plan model [5pt]
  [pending]   E02-S002 Subscription lifecycle [5pt]
  [pending]   E02-S003 Usage metering [3pt]
  [pending]   E02-S004 Billing portal [3pt]

--- Velocity Trend (last 5 completed) ---
  Sprint 1: 18/21 pts (86%)
```

### Sprint List Output (`/forge-sprint list`)

```
=== FORGE Sprint List ===

Active Sprints:
| #   | Status | Goal                       | Period                    | Velocity   |
| 001 | Active | Core payments integration  | 2026-02-03 — 2026-02-14  | 18/21 pts  |
| 002 | Active | Subscription management    | 2026-02-10 — 2026-02-21  | 0/16 pts   |

Recent Completed Sprints (last 5):
| #   | Status    | Goal                       | Closed     | Velocity   |
| (none yet)                                                              |
```

### Migration Prompt UX

```
FORGE Sprint Format Migration
==============================

Detected: .forge/sprints/sprint-status.yaml (legacy single-file format)

FORGE now supports multiple concurrent sprints with automatic archiving.
This requires migrating to a new directory structure:

  Before: .forge/sprints/sprint-status.yaml (single file, all data)
  After:  .forge/sprints/active/sprint-NNN.yaml (one file per sprint)
          .forge/sprints/completed/YYYY-MM-DD-sprint-NNN.yaml (archives)

What will happen:
  - Current sprint -> active/sprint-001.yaml
  - 2 previous sprints -> completed/ (summary format)
  - Original file renamed to sprint-status.yaml.bak

Proceed with migration? [Y/n]
```

---

## 10. Out of Scope

- **Cross-project sprint aggregation**: No support for viewing sprints across
  multiple FORGE projects in a single dashboard.
- **Sprint templates/presets**: No predefined sprint configurations (e.g.,
  "2-week agile" vs "1-week kanban").
- **Automated story carry-over**: Stories are not automatically moved between
  sprints; the scrum master decides per US-001 acceptance criteria.
- **Sprint burndown charts**: Visual burndown rendering is not included; the
  text-based dashboard is sufficient for agent consumption.
- **Git-based sprint locking**: No file locking mechanism for concurrent
  multi-user editing of sprint files.
- **Retrospective format changes**: The `retrospectives/` directory and retro
  file format are unchanged by this spec.

---

## 11. Open Questions

All questions resolved. Initial elicitation resolved 5 questions;
clarification pass (`/forge-clarify`) resolved 7 additional ambiguities:

1. **Sprint update target selection** → Prompt user to choose when multiple active
2. **Performance above 5 sprints** → Soft warning, no hard cap
3. **Concurrent file access behavior** → Catch + error message + retry suggestion
4. **Story carry-over mechanics** → Mark as `carried_over`, manual re-add
5. **No-arg default behavior** → Smart default (show dashboard if active, else start)
6. **Archive story detail level** → Full story details retained in archive
7. **Sprint list output format** → Compact table format

No unresolved ambiguities remain.

---

## 12. Implementation Scope

> **Note**: All paths are relative to the `dev/` working directory.

### New Components

| Component Type  | Path                                                | Description                                                          |
| --------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Directory       | `.forge/sprints/active/`                            | Runtime directory for active sprint files (created by tool/command)   |
| Directory       | `.forge/sprints/completed/`                         | Runtime directory for archived sprint files (created by tool/command) |
| Template        | `../.opencode/templates/sprint-status.yaml`         | Updated template for per-sprint file format (replaces existing)      |
| Template        | `../.opencode/templates/sprint-sequence.yaml`       | New template for sprint sequence tracking                            |
| Documentation   | `../.opencode/docs/MIGRATION-SPRINT-FORMAT.md`      | Migration guide from old to new sprint format                        |

### Modified Components

| Path                                             | Modification Type | Description                                                                               |
| ------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------- |
| `../.opencode/tools/sprint-status.ts`            | Enhancement       | Add multi-file reading from `active/`, aggregate dashboard, migration detection & prompt  |
| `../.opencode/commands/forge-sprint.md`          | Enhancement       | Add `start`, `close`, `list` subcommands; update `new`/`close`/`update` action logic      |
| `../.opencode/agents/forge-scrum.md`             | Enhancement       | Update sprint file paths, add multi-sprint lifecycle instructions, add migration workflow  |
| `../.opencode/docs/FORGE-GUIDE.md`              | Enhancement       | Update Section 3.4 (Epic Track sprint example), Section 4 (command args), Section 5.3 (sprint ceremony) |
| `../.opencode/skills/context-chain/SKILL.md`    | Enhancement       | Update sprint-status.yaml path references to `active/` directory in phase-to-document mapping table      |

### Files to Reference (Read-only)

| Path                                             | Purpose                                                   |
| ------------------------------------------------ | --------------------------------------------------------- |
| `./.forge/constitution.md`                       | Verify backward compatibility (Article 9.3), naming (7.1) |
| `../.opencode/templates/sprint-status.yaml`      | Current template (baseline for migration)                 |

---

## 13. Constitution Compliance

| Article | Status  | Notes                                                                                       |
| ------- | ------- | ------------------------------------------------------------------------------------------- |
| Art. 1  | PASS    | Dogfooding: this spec developed using FORGE. Documentation parity: guide updated with spec. |
| Art. 2  | PASS    | No new dependencies. TypeScript tool updated. YAML config. All within approved stack.       |
| Art. 3  | PASS    | Data pattern change documented. Spec directory pattern unchanged. Path conventions followed.|
| Art. 4  | PASS    | Adversarial review required before merge. Dogfooding test: use new sprint system for next FORGE feature. |
| Art. 5  | PASS    | No secrets in sprint files. Path traversal: sprint IDs are numeric, validated. No injection risk. |
| Art. 6  | PASS    | All error scenarios documented (Section 6). Error messages include actionable next steps.   |
| Art. 7  | PASS    | Sprint files follow `sprint-NNN.yaml` naming. Archive files use ISO date prefix. Consistent with spec ID conventions (zero-padded 3-digit). |
| Art. 8  | PASS    | Dogfooding test plan: use multi-sprint to plan FORGE's own next features. Migration tested with fixture data. |
| Art. 9  | PASS    | Backward compatibility via auto-detect + prompt migration. Old format remains readable if migration declined. Template versioned with `version: 1` field. |

---

## Cross-References

| Document                  | Path                                                  |
| ------------------------- | ----------------------------------------------------- |
| Constitution              | `./.forge/constitution.md`                            |
| Sprint Status Tool        | `../.opencode/tools/sprint-status.ts`                 |
| Sprint Command            | `../.opencode/commands/forge-sprint.md`               |
| Scrum Agent               | `../.opencode/agents/forge-scrum.md`                  |
| Current Sprint Template   | `../.opencode/templates/sprint-status.yaml`           |
| FORGE Guide               | `../.opencode/docs/FORGE-GUIDE.md`                    |
| Plan                      | <!-- Created by /forge-plan -->                       |
| Tasks                     | <!-- Created by /forge-tasks -->                      |

---

## Appendix A: Pre-mortem Analysis

Six failure scenarios were analyzed by imagining this feature deployed and
failed 6 months after release. The following risks were identified and
mitigated by incorporating findings into the spec:

| # | Failure Scenario                             | Root Cause                                   | Mitigation (Spec Reference)                              |
|---|----------------------------------------------|----------------------------------------------|----------------------------------------------------------|
| 1 | Migration corrupts sprint history dates      | `previous_sprints` entries lack `end_date`   | FR-022: Handle missing dates, use sprint number fallback |
| 2 | Sprint sequence desync on concurrent branches| No file locking for `sprint-sequence.yaml`   | Edge case #12: Git merge conflict catches it (by design) |
| 3 | `completed/` grows unmanageably             | Unbounded archive directory                  | FR-008: `list` caps at 5; FR-011: dashboard skips `completed/` |
| 4 | Agents load stale sprint path references    | `context-chain` skill hardcodes old path     | New modification target: `context-chain/SKILL.md`        |
| 5 | Sprints closed without retrospectives       | No enforcement of retro before close         | FR-023: Advisory warning on close (non-blocking)         |
| 6 | Template version upgrade breaks parser      | No forward-compatible version handling       | FR-024: Parser reads `version` field, handles gracefully |

All 6 failure scenarios have been addressed through new requirements (FR-022
through FR-024), additional edge cases (#11-#13), and an expanded modification
target list.

---

## Appendix B: Migration Logic (Pseudocode)

```
function detectAndMigrate(rootDir):
  oldPath = rootDir + "/.forge/sprints/sprint-status.yaml"
  activePath = rootDir + "/.forge/sprints/active/"

  if exists(oldPath) AND NOT exists(activePath):
    // Old format detected, new structure not present
    data = parseOldFormat(oldPath)

    if isTemplateOnly(data):
      return SHOW_TEMPLATE_MESSAGE

    showMigrationPrompt(data)
    if userConfirms():
      mkdir(activePath)
      mkdir(rootDir + "/.forge/sprints/completed/")

      // Migrate current sprint
      n = data.current_sprint.number
      writeYaml(activePath + "/sprint-" + zeroPad(n) + ".yaml",
                convertToNewFormat(data.current_sprint))

      // Migrate previous sprints as summaries
      for prev in data.previous_sprints:
        dateStr = prev.end_date or "unknown-" + zeroPad(prev.number)
        if not prev.end_date:
          logWarning("Sprint " + prev.number + " has no end_date; using sprint number for archive filename")
        writeYaml(completedPath + "/" + dateStr + "-sprint-" + zeroPad(prev.number) + ".yaml",
                  convertToSummary(prev))

      // Write sequence file
      writeYaml(rootDir + "/.forge/sprints/sprint-sequence.yaml",
                { version: 1, next_sprint_number: n + 1, project: data.project })

      // Backup old file
      rename(oldPath, oldPath + ".bak")

      return MIGRATION_COMPLETE
    else:
      return readOldFormat(data)  // Legacy fallback

  else if exists(activePath):
    return readNewFormat(activePath)  // Normal new-format path

  else:
    return NO_SPRINT_DATA
```
