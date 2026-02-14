---
description: "Initialize or manage sprints with multi-sprint support, story selection, and velocity tracking"
agent: forge-scrum
subtask: true
---

# Sprint Management

You are handling `/forge-sprint` to manage sprints in a multi-sprint
architecture for Epic or Product track workflows.

## Arguments

Parse $ARGUMENTS to determine the subcommand and optional sprint ID:

**Subcommands**:
- `start` -- Start a new sprint
- `close [sprint-id]` -- Close a sprint (defaults to oldest active if no ID)
- `list` -- Show all active and recent completed sprints
- `update [sprint-id]` -- Update story statuses (prompts for target if multiple active)
- (no args) -- Smart default: show dashboard if sprints exist, otherwise start new

**Sprint ID format**: `NNN` (e.g., `001`, `042`)

**Parsing logic**:
1. Split $ARGUMENTS by whitespace
2. First token is subcommand (or empty)
3. Second token is optional sprint-id (for close/update)
4. If $ARGUMENTS is empty, use smart default behavior (see below)

## Context Loading

Read the following based on action:

**All actions**:
1. `.forge/sprints/sprint-sequence.yaml` -- next sprint number
2. `.forge/sprints/active/` -- all active sprint files
3. `.forge/sprints/completed/` -- recent completed sprints (last 5)

**For start/update actions**:
4. `.forge/epics/` -- scan for all epics and their stories
5. `.forge/architecture/architecture.md` -- architecture context
6. `.forge/product/prd.md` -- product requirements (if exists)
7. `.forge/knowledge/decision-log.md` -- prior decisions

**For close action**:
8. `.forge/sprints/retrospectives/` -- check for retrospective

## Smart Default Behavior (No Arguments)

If $ARGUMENTS is empty:
1. Check if any active sprints exist (read `.forge/sprints/active/` directory)
2. **If active sprints exist**: Show dashboard by invoking `/sprint-status` tool
3. **If no active sprints**: Start a new sprint (proceed to "Action: Start")

This provides intuitive behavior where `/forge-sprint` "just works" based on context.

## Sprint Actions

### Action: Start

**Trigger**: Subcommand `start` or smart default when no active sprints.

#### Step 1: Read Sprint Sequence

1. Read `.forge/sprints/sprint-sequence.yaml` to get `next_sprint_number`
2. **If file missing**: Call `rebuildSequenceFile()` from sprint-status tool
   - Scans active/ and completed/ for highest sprint number
   - Creates sequence file with next = max + 1
   - Logs warning to user about recovery
3. Store next sprint number as `NNN` (zero-padded 3 digits)

#### Step 2: Review Velocity

1. Read last 5 completed sprints from `.forge/sprints/completed/`
2. Calculate average velocity from completed sprints
3. If no history, use default velocity estimate (e.g., 20 points)

#### Step 3: Sprint Planning

1. Present the backlog of unassigned stories from all epics
2. Use the `question` tool to help the user:
   - Set the sprint goal (required, 1-2 sentences)
   - Set sprint duration (default: 2 weeks, show end date)
   - Select stories for the sprint (multi-select from backlog)
   - Estimate story points for each selected story
3. Calculate total points for selected stories
4. **Warn if overcommitted**: Total points > 120% of average velocity
5. Confirm with user before proceeding

#### Step 4: Create Sprint File

1. Read template from `../.opencode/templates/sprint-status.yaml`
2. **Create** `.forge/sprints/active/sprint-NNN.yaml` with:
   - `version: 1`
   - `sprint_number: NNN` (integer)
   - `sprint_goal: "[user input]"`
   - `start_date: YYYY-MM-DD` (today)
   - `end_date: YYYY-MM-DD` (calculated from duration)
   - `velocity_target: N` (total points)
   - `stories: []` array with selected stories in format:
     ```yaml
     - id: "E01-S001"
       title: "Story title"
       status: pending
       points: 5
     ```
3. **Update** `.forge/sprints/sprint-sequence.yaml`:
   - Increment `next_sprint_number` by 1
4. Handle filesystem errors:
   - **EEXIST** (sprint file exists): Error with message "Sprint NNN already exists. Close it first or check sequence file."
   - **ENOENT** (directories missing): Create active/ and completed/ directories
   - **EACCES** (permission denied): Error with actionable message about file permissions

#### Step 5: Summary

Present the sprint plan:
```
✓ Sprint NNN started: [Goal]
Duration: [start] → [end] (N weeks)
Stories: N (total: N points)
Velocity target: N points (avg from last 5: N points)

Stories:
  E01-S001  [5pt]  pending   Story title
  E01-S002  [8pt]  pending   Story title
  ...

File created: .forge/sprints/active/sprint-NNN.yaml
Next sprint will be: NNN+1
```

### Action: Close

**Trigger**: Subcommand `close [sprint-id]`

**Sprint selection**:
- If `sprint-id` provided: Close that specific sprint
- If no `sprint-id` and single active sprint: Close that sprint
- If no `sprint-id` and multiple active sprints: Close oldest (lowest number)

#### Step 1: Read Target Sprint

1. Read all active sprints from `.forge/sprints/active/`
2. Select target sprint based on rules above
3. Parse sprint file to get all story statuses

#### Step 2: Review Completion

1. For each story, check current status:
   - `done`: Complete, no action needed
   - `in_progress` or `pending`: Mark as `carried_over`
   - `blocked`: Mark as `carried_over`
2. Calculate actual velocity (sum points of `done` stories)
3. Show completion summary:
   ```
   Sprint NNN: [Goal]
   Stories completed: N/M (N points)
   Stories carried over: M (M points)
   Actual velocity: N points (target was: N points)
   ```

#### Step 3: Handle Carry-Over Stories

**IMPORTANT**: The `carried_over` status is for archival tracking only. Stories
are NOT automatically added to the next sprint.

1. **Update story statuses**: Change `in_progress`, `pending`, `blocked` → `carried_over`
2. **Explain to user**: Carried-over stories remain in epic backlog for manual re-selection
3. **Show list**: Display which stories were marked as carried over

**User action required**: User must manually re-add these stories when starting next sprint.

#### Step 4: Archive Sprint File

1. **Read current date**: `YYYY-MM-DD`
2. **Target filename**: `.forge/sprints/completed/YYYY-MM-DD-sprint-NNN.yaml`
3. **Check for collision**: If file exists (closing multiple sprints same day):
   - Append `-2`, `-3`, etc. until unique filename found
   - Example: `2026-02-14-sprint-001-2.yaml`
4. **Set end_date**: Update `end_date: YYYY-MM-DD` in sprint data
5. **Write to completed/**: Move sprint data to completed directory
6. **Delete from active/**: Remove `active/sprint-NNN.yaml`

#### Step 5: Retrospective Check

1. Check if retrospective exists: `.forge/sprints/retrospectives/retro-NNN.md`
2. **If missing**: Warn user (non-blocking):
   ```
   ⚠ No retrospective found for sprint NNN.
   Consider running: /forge-retro NNN
   ```
3. **If exists**: Acknowledge retrospective was completed

#### Step 6: Error Handling

- **ENOENT** (sprint file missing): Error "Sprint NNN not found in active/"
- **EACCES** (permission denied): Error with actionable message
- **EEXIST** (target exists after collision handling): Error "Unable to create unique filename after 10 attempts"

#### Step 7: Summary

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
  E01-S003  [3pt]  Story title

Next steps:
- Review retrospective: /forge-retro NNN (if not done)
- Start next sprint: /forge-sprint start
```

### Action: List

**Trigger**: Subcommand `list`

#### Implementation

1. **Invoke sprint-status tool** in list mode:
   - Call the `sprint-status` tool which has built-in list rendering
   - Tool will handle reading active/ and completed/ directories
2. **Expected output**: Compact table format:
   ```
   Sprint List (all active + last 5 completed)
   
   #    Status    Goal                          Period              Velocity
   ---- --------- ----------------------------- ------------------- ---------
   001  active    Initial MVP features          2026-02-01 → 02-14  15/20 pts
   002  active    User authentication           2026-02-15 → 02-28  8/25 pts
   003  completed Dashboard improvements        2026-01-18 → 01-31  20/20 pts
   ...
   ```

### Action: Update

**Trigger**: Subcommand `update [sprint-id]`

**Sprint selection**:
- If `sprint-id` provided: Update that specific sprint
- If no `sprint-id` and single active sprint: Update that sprint
- If no `sprint-id` and multiple active sprints: **Prompt user to select**

#### Step 1: Select Target Sprint

1. Read all active sprints from `.forge/sprints/active/`
2. If multiple active and no sprint-id:
   - Use `question` tool to present list of active sprints
   - User selects target sprint by number
3. Read target sprint file

#### Step 2: Present Current Status

Show current sprint progress:
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

#### Step 3: Update Story Statuses

1. Use `question` tool for each story (or bulk selection):
   - Show story ID, title, current status, points
   - Options: `pending`, `in_progress`, `done`, `blocked`
   - Allow multi-select for batch updates
2. Validate transitions:
   - Any status can go to any other status (no restrictions)
   - `carried_over` status is only set during close action (not user-settable)

#### Step 4: Write Updates

1. Update sprint file at `.forge/sprints/active/sprint-NNN.yaml`
2. Preserve all other fields (goal, dates, velocity_target)
3. Only modify `status` field for updated stories

#### Step 5: Report Progress

```
✓ Sprint NNN updated

Progress: N/M stories done (N/M points)
Status changes:
  E01-S002: pending → in_progress
  E01-S003: in_progress → done

Updated: .forge/sprints/active/sprint-NNN.yaml
```

## Migration from Old Format

**Trigger**: When `/sprint-status` tool detects old format (single `sprint-status.yaml` file).

The tool will return a migration prompt. When user runs `/forge-sprint` in this state:

#### Step 1: Explain Migration

Show user-friendly explanation:
```
⚠ Old sprint format detected

FORGE now uses a directory-based multi-sprint architecture:
- Old: Single .forge/sprints/sprint-status.yaml
- New: .forge/sprints/active/sprint-NNN.yaml (one per sprint)
      .forge/sprints/completed/YYYY-MM-DD-sprint-NNN.yaml
      .forge/sprints/sprint-sequence.yaml

Benefits:
✓ Track multiple concurrent sprints
✓ Automatic archiving on close
✓ Better velocity history tracking
✓ Cleaner separation of active vs completed

Migration is safe:
- Your current sprint → active/sprint-NNN.yaml
- Previous sprints → completed/YYYY-MM-DD-sprint-NNN.yaml
- Old file renamed to sprint-status.yaml.bak (not deleted)
```

#### Step 2: Confirm Migration

Use `question` tool:
- Options: "Migrate to new format" (recommended), "Continue with old format"
- If user declines: Tool falls back to legacy parser (backward compatible)

#### Step 3: Invoke Migration

If user confirms:
1. Call `sprint-status` tool's migration function (already implemented in tool)
2. Tool will handle:
   - Creating active/ and completed/ directories
   - Converting current_sprint → active/sprint-NNN.yaml
   - Converting previous_sprints → completed/YYYY-MM-DD-sprint-NNN.yaml
   - Creating sprint-sequence.yaml
   - Renaming old file to .bak
3. Show migration result:
   ```
   ✓ Migration complete
   
   Created:
   - .forge/sprints/active/sprint-NNN.yaml (current sprint)
   - .forge/sprints/completed/YYYY-MM-DD-sprint-MMM.yaml (N files)
   - .forge/sprints/sprint-sequence.yaml
   
   Backed up:
   - .forge/sprints/sprint-status.yaml.bak
   
   You can now use multi-sprint commands:
   - /forge-sprint start     -- Start new sprint
   - /forge-sprint close     -- Close active sprint
   - /forge-sprint list      -- Show all sprints
   ```

#### Step 4: Error Handling

Migration errors (already handled by tool):
- **Missing end_date**: Warns user, uses current date as fallback
- **Filename collision**: Appends -2, -3 suffixes
- **Permission errors**: Shows actionable error message

#### Rollback

If user needs to rollback:
1. Delete `.forge/sprints/active/` and `completed/` directories
2. Rename `.forge/sprints/sprint-status.yaml.bak` → `sprint-status.yaml`
3. Old format will work via legacy parser

See: `../.opencode/docs/MIGRATION-SPRINT-FORMAT.md` for detailed guide.
