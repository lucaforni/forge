---
description: "Initialize or manage sprints with multi-sprint support, story selection, and velocity tracking"
agent: forge-scrum
subtask: true
---

# Sprint Management

Handle `/forge-sprint` for multi-sprint Epic/Product workflows.

## Arguments

Parse `$ARGUMENTS`:

| Subcommand           | Behavior                                                          |
| -------------------- | ----------------------------------------------------------------- |
| `start`              | Start a new sprint                                                |
| `close [sprint-id]`  | Close a sprint (defaults to oldest active)                        |
| `list`               | Show all active + last 5 completed sprints                        |
| `update [sprint-id]` | Update story statuses (prompts if multiple active and no id)      |
| *(empty)*            | Smart default: dashboard if active sprints exist, else `start`    |

**Sprint ID format**: `NNN` (e.g., `001`, `042`). Tokens: 1st = subcommand, 2nd = optional id.

## Context Loading

**All actions**:
- `.forge/sprints/sprint-sequence.yaml` (next sprint number)
- `.forge/sprints/active/` (all active)
- `.forge/sprints/completed/` (last 5)

**start/update also**:
- `.forge/epics/` (epics + stories), `.forge/architecture/architecture.md`, `.forge/product/prd.md` (if exists), `.forge/knowledge/decision-log.md`

**close also**: `.forge/sprints/retrospectives/`

## Smart Default (No Args)

1. Check `.forge/sprints/active/`.
2. Active sprints exist → invoke `/sprint-status` tool (dashboard).
3. None → proceed to **Start**.

---

## Action: Start

Trigger: `start` subcommand, or smart default when no active sprints.

### Step 1 — Read Sprint Sequence

Read `.forge/sprints/sprint-sequence.yaml` → `next_sprint_number`. If missing, call `rebuildSequenceFile()` from sprint-status tool (scans active+completed for max, sets next=max+1, warns user). Store as `NNN` (zero-padded 3 digits).

### Step 2 — Review Velocity

Read last 5 completed sprints; compute average velocity. No history → default 20 points.

### Step 3 — Sprint Planning

Use `question` tool to set: sprint goal (required, 1-2 sentences), duration (default 2 weeks, show end date), select stories from unassigned backlog (multi-select), estimate points each. Sum total points; **warn if total > 120% avg velocity**. Confirm before proceeding.

### Step 4 — Create Sprint File

Read template `../.opencode/templates/sprint-status.yaml`.

Create `.forge/sprints/active/sprint-NNN.yaml`:
```yaml
version: 1
sprint_number: NNN
sprint_goal: "[user input]"
start_date: YYYY-MM-DD       # today
end_date: YYYY-MM-DD          # today + duration
velocity_target: N            # total points
stories:
  - id: "E01-S001"
    title: "Story title"
    status: pending
    points: 5
```

Update `.forge/sprints/sprint-sequence.yaml`: increment `next_sprint_number`.

**Filesystem errors**:
- `EEXIST`: "Sprint NNN already exists. Close it first or check sequence file."
- `ENOENT`: create `active/` and `completed/` directories.
- `EACCES`: actionable permission error.

### Step 5 — Summary

```
✓ Sprint NNN started: [Goal]
Duration: [start] → [end] (N weeks)
Stories: N (total: N points)
Velocity target: N points (avg from last 5: N points)

Stories:
  E01-S001  [5pt]  pending   Story title
  ...

File created: .forge/sprints/active/sprint-NNN.yaml
Next sprint will be: NNN+1
```

---

## Action: Close

Trigger: `close [sprint-id]`.

**Selection**: explicit id → that sprint; single active → that one; multiple → oldest (lowest number).

### Step 1 — Read Target Sprint

Read all from `.forge/sprints/active/`, select per rules, parse story statuses.

### Step 2 — Review Completion

Per story: `done` no action; `in_progress`/`pending`/`blocked` → mark `carried_over`. Compute actual velocity (sum of `done` points). Show:
```
Sprint NNN: [Goal]
Stories completed: N/M (N points)
Stories carried over: M (M points)
Actual velocity: N points (target: N points)
```

### Step 3 — Handle Carry-Over

`carried_over` is archival only — stories are NOT auto-added to next sprint. Update statuses, explain that carried-over stories stay in epic backlog for manual re-selection, list which ones.

### Step 4 — Archive Sprint File

1. Today = `YYYY-MM-DD`.
2. Target: `.forge/sprints/completed/YYYY-MM-DD-sprint-NNN.yaml`.
3. Collision: append `-2`, `-3`, etc. (e.g., `2026-02-14-sprint-001-2.yaml`).
4. Set `end_date: YYYY-MM-DD`.
5. Write to `completed/`; delete `active/sprint-NNN.yaml`.

### Step 5 — Retrospective Check

Check `.forge/sprints/retrospectives/retro-NNN.md`. Missing → non-blocking warning suggesting `/forge-retro NNN`. Exists → acknowledge.

### Step 6 — Errors

- `ENOENT`: "Sprint NNN not found in active/"
- `EACCES`: actionable permission error.
- `EEXIST` after 10 collision attempts: "Unable to create unique filename after 10 attempts".

### Step 7 — Summary

```
✓ Sprint NNN closed and archived

Final stats:
- Completed: N/M stories (N points)
- Carried over: M stories (M points)
- Actual velocity: N points (target: N points)
- Achievement: N%

Archived to: .forge/sprints/completed/YYYY-MM-DD-sprint-NNN.yaml

Carried-over stories (manual re-add required):
  E01-S001  [5pt]  Story title
  ...

Next steps:
- Review retrospective: /forge-retro NNN (if not done)
- Start next sprint: /forge-sprint start
```

---

## Action: List

Invoke `sprint-status` tool in list mode (handles reading active/ + completed/). Expected compact format:

```
Sprint List (all active + last 5 completed)

#    Status    Goal                       Period              Velocity
---- --------- -------------------------- ------------------- ---------
001  active    Initial MVP features       2026-02-01 → 02-14  15/20 pts
002  active    User authentication        2026-02-15 → 02-28  8/25 pts
003  completed Dashboard improvements     2026-01-18 → 01-31  20/20 pts
```

---

## Action: Update

Trigger: `update [sprint-id]`. Selection: id → that sprint; single active → that; multiple + no id → **prompt user**.

### Step 1 — Select Target

Read all active. Multiple + no id → `question` tool to pick. Read target file.

### Step 2 — Present Status

```
Sprint NNN: [Goal]
Duration: [start] → [end]
Current: N/M stories done (N/M points)

Stories:
  E01-S001  [5pt]  done         Story title ✓
  E01-S002  [8pt]  in_progress  Story title →
  E01-S003  [3pt]  pending      Story title
  E01-S004  [5pt]  blocked      Story title ✗
```

### Step 3 — Update Statuses

Per story (or bulk via `question`): options `pending`, `in_progress`, `done`, `blocked`. Any transition allowed. **`carried_over` is set only during close, not user-settable.**

### Step 4 — Write Updates

Update `.forge/sprints/active/sprint-NNN.yaml`. Preserve all other fields. Only modify `status`.

### Step 5 — Report

```
✓ Sprint NNN updated

Progress: N/M stories done (N/M points)
Status changes:
  E01-S002: pending → in_progress
  E01-S003: in_progress → done

Updated: .forge/sprints/active/sprint-NNN.yaml
```

---

## Migration from Old Format

Trigger: `/sprint-status` tool reports old single-file format.

### Step 1 — Explain

```
⚠ Old sprint format detected

Old: .forge/sprints/sprint-status.yaml
New: .forge/sprints/active/sprint-NNN.yaml (one per sprint)
     .forge/sprints/completed/YYYY-MM-DD-sprint-NNN.yaml
     .forge/sprints/sprint-sequence.yaml

Benefits: multi-sprint, auto-archive, velocity history, clean separation.

Safe: current → active/; previous → completed/; old file renamed .bak.
```

### Step 2 — Confirm

`question`: "Migrate to new format" (recommended) vs "Continue with old format". Decline → tool falls back to legacy parser.

### Step 3 — Invoke Migration

Call sprint-status tool's migration function. It creates dirs, converts current/previous sprints, creates sprint-sequence.yaml, renames old file `.bak`. Show:

```
✓ Migration complete
Created: active/sprint-NNN.yaml, completed/YYYY-MM-DD-sprint-MMM.yaml (N files), sprint-sequence.yaml
Backed up: sprint-status.yaml.bak

Use: /forge-sprint start | close | list
```

### Step 4 — Errors (handled by tool)

Missing `end_date` → fallback to today + warn. Collision → `-2`, `-3` suffix. Permission → actionable error.

### Rollback

Delete `active/` + `completed/`; rename `sprint-status.yaml.bak` → `sprint-status.yaml`; old parser takes over.

See `../.opencode/docs/MIGRATION-SPRINT-FORMAT.md` for full guide.
