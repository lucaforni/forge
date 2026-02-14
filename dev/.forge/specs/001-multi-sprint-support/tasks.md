# Tasks: 001 - Multi-Sprint Support with Automatic Archiving

> Ordered task breakdown with parallelism markers and requirement traceability.
> Created by the `forge-scrum` agent via `/forge-tasks`.

| Field   | Value                                                     |
| ------- | --------------------------------------------------------- |
| Status  | Pending                                                   |
| Author  | forge-scrum                                               |
| Date    | 2026-02-14                                                |
| Spec    | `.forge/specs/001-multi-sprint-support/spec.md`           |
| Plan    | `.forge/specs/001-multi-sprint-support/plan.md`           |

---

## Legend

- `[FR-NNN]` -- Requirement being implemented (traceability)
- `[P]` -- Parallelizable with other `[P]` tasks in the same phase
- Status: `[ ]` pending, `[x]` done, `[-]` skipped
- **Size**: `[S]` < 30 min, `[M]` 30 min - 2 hours, `[L]` 2-4 hours, `[XL]` 4+ hours

---

## Phase 1: Foundation — Templates & Directory Structure

**Objective**: Create new template files that define the sprint data format.

- [x] **1.1** `[FR-003]` `[P]` Create sprint-sequence.yaml template
  - **File**: `../.opencode/templates/sprint-sequence.yaml`
  - **Type**: Create new file
  - **Description**: Template for sprint sequence tracking file with version, next_sprint_number, and project fields
  - **Spec Reference**: Section 7.2 "Sprint Sequence File"
  - **Dependencies**: None
  - **Estimated**: S (15 min)

- [x] **1.2** `[FR-021]` `[FR-024]` `[P]` Replace sprint-status.yaml template
  - **File**: `../.opencode/templates/sprint-status.yaml`
  - **Type**: Modify existing
  - **Location**: Full file (Lines 1-30)
  - **Description**: Replace monolithic format with per-sprint template. Add version: 1 field, carried_over to status enum comment, remove previous_sprints structure
  - **Spec Reference**: Section 7.3 "Active Sprint File Format", Section 2.4 "Old Format"
  - **Dependencies**: None
  - **Estimated**: S (15 min)

- [x] **1.3** `[FR-021]` `[P]` Verify templates parse as valid YAML
  - **File**: Manual validation check
  - **Type**: Validation task
  - **Description**: Manually parse both new templates with YAML parser to verify syntax correctness
  - **Spec Reference**: Plan Section 7 Phase 1 Task 3
  - **Dependencies**: Tasks 1.1, 1.2
  - **Estimated**: S (5 min)

---

## Phase 2: Core Tool — Multi-File Reader, Parser, Migration, Dashboard

**Objective**: Rewrite `sprint-status.ts` to support directory-based format with backward compatibility.

### Type Definitions

- [x] **2.1** `[FR-024]` `[FR-025]` Define new TypeScript interfaces
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: Lines 1-50 (add new interfaces at top)
  - **Description**: Add SprintFile, SequenceFile, Story (with carried_over status), MigrationState, MigrationResult interfaces
  - **Spec Reference**: Plan Section 4.6 "Type Definitions"
  - **Dependencies**: None
  - **Estimated**: M (30 min)

### Parser Functions

- [x] **2.2** `[NFR-001]` Rename existing parser to parseLegacyYaml
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: Current parseYaml function (~line 50-100)
  - **Description**: Rename parseYaml to parseLegacyYaml and preserve for migration fallback
  - **Spec Reference**: Plan Section 7 Phase 2 Task 2
  - **Dependencies**: Task 2.1
  - **Estimated**: S (10 min)

- [x] **2.3** `[FR-024]` `[P]` Implement parseSprintYaml
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: After parseLegacyYaml
  - **Description**: Parse new per-sprint YAML format into SprintFile. Validate version field, handle unknown versions with warning + best-effort parse
  - **Spec Reference**: Plan Section 4.1 "Sprint File Parser"
  - **Dependencies**: Task 2.1
  - **Estimated**: M (45 min)

- [x] **2.4** `[FR-003]` `[P]` Implement parseSequenceYaml
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: After parseSprintYaml
  - **Description**: Parse sprint-sequence.yaml into SequenceFile structure
  - **Spec Reference**: Plan Section 4.1 "Sprint File Parser"
  - **Dependencies**: Task 2.1
  - **Estimated**: S (20 min)

### Directory Reader Functions

- [x] **2.5** `[FR-001]` `[FR-002]` `[FR-004]` `[FR-011]` Implement readActiveSprints
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: After parser functions
  - **Description**: Read all sprint files from active/ directory, filter sprint-*.yaml, parse each with parseSprintYaml, sort by number ascending, detect duplicates (EC-7)
  - **Spec Reference**: Plan Section 4.2 "Sprint Directory Reader"
  - **Dependencies**: Tasks 2.3, 2.4
  - **Estimated**: M (1 hr)

- [x] **2.6** `[FR-013]` `[P]` Implement readCompletedSprints
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: After readActiveSprints
  - **Description**: Read last N completed sprint files from completed/ directory, sort by filename (date prefix), return limit
  - **Spec Reference**: Plan Section 4.2 "Sprint Directory Reader"
  - **Dependencies**: Task 2.3
  - **Estimated**: M (45 min)

### Migration Engine

- [x] **2.7** `[FR-014]` `[NFR-001]` Implement detectOldFormat
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: After reader functions
  - **Description**: Check for old sprint-status.yaml with current_sprint key, check if active/ exists, return MigrationState (new_format | old_format | template_only | no_data | conflict)
  - **Spec Reference**: Plan Section 4.3 "Migration Engine"
  - **Dependencies**: Task 2.1, 2.2
  - **Estimated**: M (1 hr)

- [x] **2.8** `[FR-016]` `[FR-017]` `[FR-018]` `[FR-022]` `[NFR-003]` Implement migrateToNewFormat
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: After detectOldFormat
  - **Description**: Create active/ and completed/ directories, convert current_sprint to active/sprint-NNN.yaml, convert previous_sprints to completed/DATE-sprint-NNN.yaml (handle missing end_date with warning), write sprint-sequence.yaml, rename old file to .bak, handle conflicts (EC-8, EC-9)
  - **Spec Reference**: Plan Section 4.3 "Migration Engine", Plan Section 2.4 "Migrations"
  - **Dependencies**: Task 2.7
  - **Estimated**: L (2 hrs)

- [x] **2.9** `[FR-003]` Implement rebuildSequenceFile
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: After migrateToNewFormat
  - **Description**: Scan active/ and completed/ for highest sprint number, set next_sprint_number = max + 1, write sequence file, log warning (EC-5)
  - **Spec Reference**: Plan Section 2.4 "Migrations", Edge Case #5
  - **Dependencies**: Task 2.4
  - **Estimated**: M (45 min)

### Dashboard Renderer

- [x] **2.10** `[FR-012]` Implement renderSprintSection
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: Rendering section
  - **Description**: Single sprint block with header, progress bar, story list grouped by status (done, in_progress, pending, blocked, carried_over)
  - **Spec Reference**: Plan Section 4.4 "Aggregate Dashboard Renderer", Spec Section 9 "UX/UI Notes"
  - **Dependencies**: Task 2.5
  - **Estimated**: M (1 hr)

- [x] **2.11** `[FR-013]` `[P]` Implement renderVelocityTrend
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: Rendering section
  - **Description**: Velocity trend from completed sprints, show last 5 with completed/planned points and percentage
  - **Spec Reference**: Plan Section 4.4 "Aggregate Dashboard Renderer", Spec Section 9 "UX/UI Notes"
  - **Dependencies**: Task 2.6
  - **Estimated**: M (30 min)

- [x] **2.12** `[FR-012]` `[NFR-002]` Implement renderAggregateDashboard
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: Rendering section
  - **Description**: Aggregate dashboard with each sprint rendered by renderSprintSection, add velocity trend footer, add warning banner if >5 active sprints, maintain backward-compatible single-sprint output
  - **Spec Reference**: Plan Section 4.4 "Aggregate Dashboard Renderer", NFR-002
  - **Dependencies**: Tasks 2.10, 2.11
  - **Estimated**: M (1 hr)

- [x] **2.13** `[FR-026]` `[FR-008]` `[P]` Implement renderSprintList
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: Rendering section
  - **Description**: Compact table format with columns: # | Status | Goal | Period | Velocity. One row per sprint, all active + last 5 completed
  - **Spec Reference**: FR-026, Spec Section 9 "Sprint List Output"
  - **Dependencies**: Task 2.5, 2.6
  - **Estimated**: M (45 min)

### Main Execution Flow

- [x] **2.14** `[FR-014]` `[FR-015]` `[FR-019]` `[NFR-006]` Update execute() function
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: Main execute function (currently ~line 300-350)
  - **Description**: Implement new flow: detect format → return migration prompt if old format → read active/ if new format → render dashboard. Handle no active sprints, >5 sprints warning, filesystem errors (ENOENT, EEXIST, EACCES) with actionable messages
  - **Spec Reference**: Plan Section 7 Phase 2 Task 14, NFR-006
  - **Dependencies**: Tasks 2.7, 2.8, 2.5, 2.12
  - **Estimated**: M (1 hr)

- [x] **2.15** `[ALL]` `[P]` Update tool description string
  - **File**: `../.opencode/tools/sprint-status.ts`
  - **Type**: Modify existing
  - **Location**: Tool description at top of file
  - **Description**: Update description to reflect new multi-sprint dashboard and migration capabilities
  - **Spec Reference**: Plan Section 7 Phase 2 Task 15
  - **Dependencies**: None
  - **Estimated**: S (10 min)

---

## Phase 3: Command & Agent — Subcommands and Multi-Sprint Lifecycle

**Objective**: Update forge-sprint command and forge-scrum agent for multi-sprint operations.

### Command: forge-sprint.md

- [x] **3.1** `[FR-020]` Rewrite argument parsing for subcommands
  - **File**: `../.opencode/commands/forge-sprint.md`
  - **Type**: Modify existing
  - **Location**: Arguments section (Lines ~15-30)
  - **Description**: Detect subcommand from $ARGUMENTS (start, close, list, update, or empty). Parse optional sprint-id argument for close and update
  - **Spec Reference**: Plan Section 7 Phase 3 Task 1, FR-020
  - **Dependencies**: None
  - **Estimated**: M (30 min)

- [x] **3.2** `[FR-005]` `[FR-003]` Add "Action: Start" section
  - **File**: `../.opencode/commands/forge-sprint.md`
  - **Type**: Modify existing
  - **Location**: New section after argument parsing
  - **Description**: Read sprint-sequence.yaml, create active/sprint-NNN.yaml with next number, increment sequence, handle missing sequence with rebuildSequenceFile
  - **Spec Reference**: Plan Section 7 Phase 3 Task 2, FR-005
  - **Dependencies**: Task 3.1
  - **Estimated**: M (45 min)

- [x] **3.3** `[FR-006]` `[FR-007]` `[FR-023]` `[FR-025]` Add "Action: Close" section
  - **File**: `../.opencode/commands/forge-sprint.md`
  - **Type**: Modify existing
  - **Location**: New section after "Action: Start"
  - **Description**: Read target sprint from active/ (default to oldest if no sprint-id), mark in_progress/pending stories as carried_over, write to completed/YYYY-MM-DD-sprint-NNN.yaml, handle filename collision (append -2 suffix), check for retrospective and warn if missing (non-blocking)
  - **Spec Reference**: Plan Section 7 Phase 3 Task 3, FR-006, FR-007, FR-023, FR-025
  - **Dependencies**: Task 3.1
  - **Estimated**: L (2 hrs)

- [x] **3.4** `[FR-008]` `[FR-026]` `[P]` Add "Action: List" section
  - **File**: `../.opencode/commands/forge-sprint.md`
  - **Type**: Modify existing
  - **Location**: New section after "Action: Close"
  - **Description**: Invoke sprint-status tool in list mode, show compact table format with all active + last 5 completed sprints
  - **Spec Reference**: Plan Section 7 Phase 3 Task 4, FR-008, FR-026
  - **Dependencies**: Task 3.1
  - **Estimated**: M (30 min)

- [x] **3.5** `[FR-009]` Update "Action: Update" section
  - **File**: `../.opencode/commands/forge-sprint.md`
  - **Type**: Modify existing
  - **Location**: Existing update section (Lines ~60-80)
  - **Description**: If multiple active sprints and no sprint-id: prompt user to select target sprint. If single active sprint: update directly. If sprint-id given: update that sprint
  - **Spec Reference**: Plan Section 7 Phase 3 Task 5, FR-009
  - **Dependencies**: Task 3.1
  - **Estimated**: M (1 hr)

- [x] **3.6** `[FR-020]` Add "No-args smart default" section
  - **File**: `../.opencode/commands/forge-sprint.md`
  - **Type**: Modify existing
  - **Location**: After argument parsing, before action routing
  - **Description**: If no args: check if active sprints exist → if yes show dashboard, if no start new sprint
  - **Spec Reference**: Plan Section 7 Phase 3 Task 6, FR-020
  - **Dependencies**: Task 3.1
  - **Estimated**: M (30 min)

- [x] **3.7** `[FR-015]` `[FR-019]` Add "Migration" section
  - **File**: `../.opencode/commands/forge-sprint.md`
  - **Type**: Modify existing
  - **Location**: After action routing
  - **Description**: If old format detected by tool, show migration prompt explaining changes, ask confirmation, invoke migration, handle user decline with legacy fallback
  - **Spec Reference**: Plan Section 7 Phase 3 Task 7, FR-015, FR-019
  - **Dependencies**: Task 3.1
  - **Estimated**: M (45 min)

### Agent: forge-scrum.md

- [x] **3.8** `[FR-001]` `[FR-002]` Update sprint file path references
  - **File**: `../.opencode/agents/forge-scrum.md`
  - **Type**: Modify existing
  - **Location**: Section 2 "Sprint Planning" (Lines 103-126), Section 4 "Sprint Status" (Lines 141-147)
  - **Description**: Replace all sprint-status.yaml references with active/sprint-NNN.yaml and sprint-sequence.yaml references
  - **Spec Reference**: Plan Section 7 Phase 3 Task 8
  - **Dependencies**: None
  - **Estimated**: M (30 min)

- [x] **3.9** `[FR-005]` `[FR-003]` Update "New sprint" workflow
  - **File**: `../.opencode/agents/forge-scrum.md`
  - **Type**: Modify existing
  - **Location**: Section 2 "Sprint Planning", "New sprint" subsection
  - **Description**: Add instructions to read sprint-sequence.yaml, create sprint in active/ directory, increment sequence
  - **Spec Reference**: Plan Section 7 Phase 3 Task 9
  - **Dependencies**: Task 3.8
  - **Estimated**: M (30 min)

- [x] **3.10** `[FR-006]` `[FR-025]` Update "Close sprint" workflow
  - **File**: `../.opencode/agents/forge-scrum.md`
  - **Type**: Modify existing
  - **Location**: Section 2 "Sprint Planning", "Close sprint" subsection
  - **Description**: Add instructions to archive sprint to completed/ with date prefix, handle carry-over status for incomplete stories, explain manual re-add process
  - **Spec Reference**: Plan Section 7 Phase 3 Task 10, FR-025
  - **Dependencies**: Task 3.8
  - **Estimated**: M (45 min)

- [x] **3.11** `[FR-011]` Update "Sprint Status" section
  - **File**: `../.opencode/agents/forge-scrum.md`
  - **Type**: Modify existing
  - **Location**: Section 4 "Sprint Status" (Lines 141-147)
  - **Description**: Update to reference active/ directory instead of single file, explain aggregate dashboard for multiple sprints
  - **Spec Reference**: Plan Section 7 Phase 3 Task 11
  - **Dependencies**: Task 3.8
  - **Estimated**: M (30 min)

---

## Phase 4: Context & Documentation

**Objective**: Update all documentation and context references to reflect new directory structure.

### Migration Guide

- [x] **4.1** `[NFR-007]` Create MIGRATION-SPRINT-FORMAT.md
  - **File**: `../.opencode/docs/MIGRATION-SPRINT-FORMAT.md`
  - **Type**: Create new file
  - **Description**: User-facing migration guide explaining old → new format change, what changed, why, how to migrate, verification steps, rollback, and FAQ
  - **Spec Reference**: Plan Section 7 Phase 4, Plan Section 5 "Files to Create"
  - **Dependencies**: Phase 2 completion
  - **Estimated**: M (1 hr)

### Context Chain Skill

- [x] **4.2** `[FR-011]` `[P]` Update context-chain phase-to-document mapping
  - **File**: `../.opencode/skills/context-chain/SKILL.md`
  - **Type**: Modify existing
  - **Location**: Lines 31-36 (Phase-to-Document Mapping table)
  - **Description**: Replace sprint-status.yaml references with sprints/active/ directory reference in Sprint Planning, Story Creation, and Retrospective phases
  - **Spec Reference**: Plan Section 7 Phase 4 Task 2, 3
  - **Dependencies**: None
  - **Estimated**: S (10 min)

- [x] **4.3** `[ALL]` `[P]` Update context-chain size guidelines
  - **File**: `../.opencode/skills/context-chain/SKILL.md`
  - **Type**: Modify existing
  - **Location**: Line 86 (Size Guidelines table)
  - **Description**: Update sprint-status.yaml size guideline to reflect active/ directory (read all files)
  - **Spec Reference**: Plan Section 7 Phase 4 Task 4
  - **Dependencies**: None
  - **Estimated**: S (5 min)

- [x] **4.4** `[ALL]` `[P]` Update context-chain cross-session context
  - **File**: `../.opencode/skills/context-chain/SKILL.md`
  - **Type**: Modify existing
  - **Location**: Lines 112-113 (Cross-Session Context section)
  - **Description**: Update sprint-status.yaml reference to sprints/active/ directory
  - **Spec Reference**: Plan Section 7 Phase 4 Task 5
  - **Dependencies**: None
  - **Estimated**: S (5 min)

### FORGE Guide

- [x] **4.5** `[NFR-007]` Update FORGE-GUIDE.md Section 3.4 (Epic Track)
  - **File**: `../.opencode/docs/FORGE-GUIDE.md`
  - **Type**: Modify existing
  - **Location**: Section 3.4 (Lines ~694-733)
  - **Description**: Update sprint planning example output to show multi-sprint capability, update file output reference from sprint-status.yaml to active/sprint-NNN.yaml
  - **Spec Reference**: Plan Section 7 Phase 4, Plan Section 5 "Files to Modify"
  - **Dependencies**: Task 4.1
  - **Estimated**: M (45 min)

- [x] **4.6** `[NFR-007]` Update FORGE-GUIDE.md Section 4.1 (Command Reference)
  - **File**: `../.opencode/docs/FORGE-GUIDE.md`
  - **Type**: Modify existing
  - **Location**: Section 4.1 (Lines ~875-889)
  - **Description**: Update /forge-sprint row to show subcommands: start | close [id] | list | update [id]
  - **Spec Reference**: Plan Section 7 Phase 4, Plan Section 5 "Files to Modify"
  - **Dependencies**: Phase 3 completion
  - **Estimated**: M (30 min)

- [x] **4.7** `[NFR-007]` Update FORGE-GUIDE.md Section 5 (Team Workflows)
  - **File**: `../.opencode/docs/FORGE-GUIDE.md`
  - **Type**: Modify existing
  - **Location**: Section 5 (Lines ~930-975)
  - **Description**: Update references to sprint-status.yaml to reference active/ directory. Update "one person updates sprint-status.yaml" guidance for multi-sprint context
  - **Spec Reference**: Plan Section 7 Phase 4, Plan Section 5 "Files to Modify"
  - **Dependencies**: Phase 3 completion
  - **Estimated**: M (45 min)

- [x] **4.8** `[NFR-007]` Review all sprint-status.yaml references in FORGE-GUIDE.md
  - **File**: `../.opencode/docs/FORGE-GUIDE.md`
  - **Type**: Modify existing
  - **Location**: Throughout document (~15 occurrences)
  - **Description**: Search for all sprint-status.yaml occurrences and update or add context explaining new directory structure where needed
  - **Spec Reference**: Plan Section 7 Phase 4 Task 9
  - **Dependencies**: Tasks 4.5, 4.6, 4.7
  - **Estimated**: M (1 hr)

---

## Phase 5: Validation & Review Readiness

**Objective**: Verify implementation through dogfooding and edge case testing.

### Dogfooding Tests

- [x] **5.1** `[ALL]` Test sprint start command
  - **Command**: `/forge-sprint start`
  - **Expected**: New sprint file created in .forge/sprints/active/sprint-001.yaml
  - **Dependencies**: Phase 2, 3 completion
  - **Estimated**: S (15 min)

- [x] **5.2** `[ALL]` Test sprint close command
  - **Command**: `/forge-sprint close`
  - **Expected**: Sprint file moved from active/ to completed/YYYY-MM-DD-sprint-001.yaml
  - **Dependencies**: Task 5.1
  - **Estimated**: S (15 min)

- [x] **5.3** `[ALL]` Test dashboard rendering
  - **Command**: `/forge-status`
  - **Expected**: Output matches spec Section 9 UX layout with multi-sprint support
  - **Dependencies**: Tasks 5.1, 5.2
  - **Estimated**: S (15 min)

### Migration Tests

- [x] **5.4** `[FR-014]` `[FR-015]` Test migration detection
  - **Setup**: Create mock sprint-status.yaml in old format
  - **Command**: `/forge-status`
  - **Expected**: Migration prompt appears explaining changes
  - **Dependencies**: Phase 2 completion
  - **Estimated**: M (30 min)

- [x] **5.5** `[FR-016]` `[FR-017]` `[FR-018]` `[NFR-003]` Test migration execution
  - **Setup**: Confirm migration from previous test
  - **Expected**: active/, completed/, sprint-sequence.yaml created. Old file renamed to .bak
  - **Dependencies**: Task 5.4
  - **Estimated**: M (30 min)

- [x] **5.6** `[FR-019]` Test migration decline (legacy fallback)
  - **Setup**: Create mock old format, decline migration
  - **Expected**: Old format still reads correctly with legacy parser
  - **Dependencies**: Task 5.4
  - **Estimated**: M (30 min)

### Edge Case Tests

- [x] **5.7** Missing sprint-sequence.yaml recovery (EC-5)
  - **Setup**: Delete sprint-sequence.yaml
  - **Expected**: Tool rebuilds from scanning active/ and completed/ directories
  - **Dependencies**: Phase 2 completion
  - **Estimated**: M (30 min)

- [x] **5.8** `[FR-025]` Close sprint with in_progress stories (US-001, EC-3)
  - **Setup**: Create sprint with in_progress stories
  - **Command**: `/forge-sprint close`
  - **Expected**: Stories marked as carried_over in archive file
  - **Dependencies**: Tasks 5.1, 5.2
  - **Estimated**: M (30 min)

- [x] **5.9** `[NFR-002]` Test >5 active sprints warning
  - **Setup**: Create 6 active sprint files
  - **Command**: `/forge-status`
  - **Expected**: Warning banner displayed but dashboard renders all sprints
  - **Dependencies**: Phase 2 completion
  - **Estimated**: M (30 min)

- [x] **5.10** Empty active/ directory (EC-2)
  - **Setup**: Empty active/ directory
  - **Command**: `/forge-status`
  - **Expected**: "No active sprints. Run /forge-sprint start." message
  - **Dependencies**: Phase 2 completion
  - **Estimated**: S (15 min)

- [x] **5.11** Archive filename collision (EC-8)
  - **Setup**: Create existing completed sprint file, close another sprint same day
  - **Expected**: Second file gets -2 suffix appended
  - **Dependencies**: Task 5.2
  - **Estimated**: M (30 min)

### Documentation Validation

- [x] **5.12** `[NFR-007]` Verify FORGE-GUIDE.md examples
  - **File**: `../.opencode/docs/FORGE-GUIDE.md`
  - **Expected**: All sprint-related examples are accurate and tested
  - **Dependencies**: Phase 4 completion
  - **Estimated**: M (30 min)

- [x] **5.13** `[NFR-007]` Verify MIGRATION-SPRINT-FORMAT.md accuracy
  - **File**: `../.opencode/docs/MIGRATION-SPRINT-FORMAT.md`
  - **Expected**: Migration steps are accurate and complete
  - **Dependencies**: Task 4.1, 5.5
  - **Estimated**: M (30 min)

### Adversarial Review

- [x] **5.14** `[ALL]` Run /forge-review for adversarial review
  - **Command**: `/forge-review .forge/specs/001-multi-sprint-support/`
  - **Expected**: Address all HIGH severity findings, document MEDIUM findings
  - **Dependencies**: All implementation complete
  - **Estimated**: L (2 hrs)

---

## Summary

| Metric               | Value  |
| -------------------- | ------ |
| Total tasks          | 59     |
| Total phases         | 5      |
| Phase 1 tasks        | 3      |
| Phase 2 tasks        | 15     |
| Phase 3 tasks        | 11     |
| Phase 4 tasks        | 8      |
| Phase 5 tasks        | 14     |
| Parallelizable tasks | 13     |
| Requirements covered | All 26 FRs + 7 NFRs |
| Estimated effort     | ~28-35 hours (XL feature) |

### Critical Path

1. Phase 1 (templates) → Phase 2 (core tool) → Phase 3 (command/agent) → Phase 4 (docs) → Phase 5 (validation)
2. Within Phase 2: Type definitions → Parsers → Readers → Migration → Dashboard → Execute
3. Within Phase 3: Argument parsing → All action sections (parallel possible)
4. Phase 4 tasks are mostly parallelizable
5. Phase 5 is sequential (dogfood → migrate → edge cases → review)

### Parallelization Opportunities

- **Phase 1**: All 3 tasks can run in parallel (13 parallel tasks across all phases)
- **Phase 2**: Tasks 2.3, 2.4 (parsers), 2.11, 2.13 (renderers), 2.15 (description) are parallelizable
- **Phase 3**: Task 3.4 (list section) is parallelizable
- **Phase 4**: Tasks 4.2, 4.3, 4.4 (context-chain updates) are parallelizable

---

## Cross-References

| Document             | Path                                                      |
| -------------------- | --------------------------------------------------------- |
| Spec                 | `.forge/specs/001-multi-sprint-support/spec.md`           |
| Plan                 | `.forge/specs/001-multi-sprint-support/plan.md`           |
| Constitution         | `./.forge/constitution.md`                                |
| ADR-001              | `./.forge/knowledge/adr/001-directory-based-sprint-storage.md` |
| Current Tool         | `../.opencode/tools/sprint-status.ts`                     |
| Current Command      | `../.opencode/commands/forge-sprint.md`                   |
| Current Agent        | `../.opencode/agents/forge-scrum.md`                      |
| Template (sequence)  | `../.opencode/templates/sprint-sequence.yaml` (new)       |
| Template (sprint)    | `../.opencode/templates/sprint-status.yaml` (modified)    |
| Context Chain Skill  | `../.opencode/skills/context-chain/SKILL.md`              |
| FORGE Guide          | `../.opencode/docs/FORGE-GUIDE.md`                        |
| Migration Guide      | `../.opencode/docs/MIGRATION-SPRINT-FORMAT.md` (new)      |
