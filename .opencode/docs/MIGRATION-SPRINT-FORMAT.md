# Sprint Format Migration Guide

> This guide explains the migration from the old single-file sprint format to
> the new directory-based multi-sprint architecture introduced in FORGE v1.1.

---

## What Changed

### Old Format (v1.0)

- **Single file**: `.forge/sprints/sprint-status.yaml`
- **Structure**: `current_sprint` + `previous_sprints` array
- **Limitation**: Only one active sprint at a time
- **History**: All sprints in one file (grows large over time)

### New Format (v1.1+)

- **Directory structure**:
  ```
  .forge/sprints/
  ├── sprint-sequence.yaml           # Tracks next sprint number
  ├── active/
  │   ├── sprint-001.yaml            # Active sprint 1
  │   ├── sprint-002.yaml            # Active sprint 2
  │   └── sprint-NNN.yaml            # More active sprints
  └── completed/
      ├── 2026-02-14-sprint-001.yaml # Completed sprint (date-prefixed)
      ├── 2026-02-21-sprint-002.yaml
      └── YYYY-MM-DD-sprint-NNN.yaml
  ```
- **Structure**: One file per sprint
- **Benefits**: 
  - ✓ Track multiple concurrent sprints
  - ✓ Automatic archiving on close
  - ✓ Better velocity history tracking
  - ✓ Cleaner separation of active vs completed
  - ✓ Files don't grow unbounded

---

## Migration Process

### Automatic Migration

When you run `/forge-sprint` or `/sprint-status` tool, FORGE will detect the
old format and prompt you to migrate.

**What happens automatically:**
1. **Detection**: Tool checks for old `sprint-status.yaml` with `current_sprint` key
2. **Prompt**: You'll see a migration explanation and confirmation request
3. **Conversion** (if you confirm):
   - Creates `active/` and `completed/` directories
   - Converts `current_sprint` → `active/sprint-NNN.yaml`
   - Converts `previous_sprints[]` → `completed/YYYY-MM-DD-sprint-NNN.yaml`
   - Creates `sprint-sequence.yaml` with next sprint number
   - Renames old file to `sprint-status.yaml.bak` (not deleted)

**Safety features:**
- Original file is preserved as `.bak` (never deleted)
- Non-destructive: can rollback by deleting new directories and renaming `.bak`
- Validation: Migration checks for data integrity

### Manual Migration

If you prefer to migrate manually:

1. **Create directories**:
   ```bash
   mkdir -p .forge/sprints/active
   mkdir -p .forge/sprints/completed
   ```

2. **Create sequence file** (`.forge/sprints/sprint-sequence.yaml`):
   ```yaml
   version: 1
   next_sprint_number: 3  # Set to max sprint number + 1
   project: "Your Project Name"
   ```

3. **Convert current sprint** to `active/sprint-NNN.yaml`:
   - Copy `current_sprint` section from old file
   - Rename fields to match new format (see Field Mapping below)
   - Write to `active/sprint-NNN.yaml` where NNN is current sprint number

4. **Convert previous sprints** to `completed/YYYY-MM-DD-sprint-NNN.yaml`:
   - For each sprint in `previous_sprints` array
   - Use `end_date` as date prefix (or today's date if missing)
   - Write to `completed/YYYY-MM-DD-sprint-NNN.yaml`

5. **Backup old file**:
   ```bash
   mv .forge/sprints/sprint-status.yaml .forge/sprints/sprint-status.yaml.bak
   ```

---

## Field Mapping

### Old Format → New Format

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `current_sprint.number` | `sprint.number` | No change |
| `current_sprint.goal` | `sprint.goal` | No change |
| `current_sprint.start_date` | `sprint.start_date` | No change |
| `current_sprint.end_date` | `sprint.end_date` | No change |
| `current_sprint.stories[]` | `sprint.stories[]` | No change |
| `current_sprint.velocity.target` | `sprint.velocity.planned` | Renamed |
| `current_sprint.velocity.actual` | `sprint.velocity.completed` | Renamed |
| `previous_sprints[]` | Becomes separate files in `completed/` | Split into files |
| (none) | `version: 1` | New field (required) |
| (none) | `sprint.closed_date` | New field for completed sprints |
| `status: in_progress` | `status: carried_over` | New status for incomplete stories in completed sprints |

### New Status: `carried_over`

**Purpose**: Track stories that were incomplete when sprint closed.

**Important**: `carried_over` is for archival tracking only. Stories are NOT
automatically added to the next sprint. When starting a new sprint, you must
manually re-select carried-over stories from the epic backlog.

**Status values**:
- `pending` -- Not started
- `in_progress` -- Work in progress
- `done` -- Completed
- `blocked` -- Blocked by dependency or issue
- `carried_over` -- Was incomplete when sprint closed (completed sprints only)

---

## Verification Steps

After migration, verify everything worked correctly:

### 1. Check Directory Structure

```bash
ls -la .forge/sprints/
```

Expected output:
```
drwxr-xr-x  active/
drwxr-xr-x  completed/
-rw-r--r--  sprint-sequence.yaml
-rw-r--r--  sprint-status.yaml.bak  # Your backup
```

### 2. Check Active Sprints

```bash
ls -la .forge/sprints/active/
```

Should contain one or more `sprint-NNN.yaml` files.

### 3. Check Completed Sprints

```bash
ls -la .forge/sprints/completed/
```

Should contain files like `2026-02-14-sprint-001.yaml`.

### 4. Validate Sprint Sequence

```bash
cat .forge/sprints/sprint-sequence.yaml
```

Expected format:
```yaml
version: 1
next_sprint_number: 3
project: "Your Project"
```

Verify `next_sprint_number` is max sprint number + 1.

### 5. Test Dashboard

```bash
opencode
> /sprint-status
```

Should display dashboard with all active sprints and velocity trend.

### 6. Compare Data

Open `.forge/sprints/sprint-status.yaml.bak` and compare with new files:
- All sprint numbers preserved
- All story data intact
- All dates preserved
- Velocity data intact

---

## Troubleshooting

### Issue: Missing `end_date` in Old Sprints

**Symptom**: Migration warns about missing `end_date` for previous sprints.

**Solution**: 
- Migration uses current date as fallback
- Manually edit completed sprint files to correct dates if needed
- File format: `.forge/sprints/completed/YYYY-MM-DD-sprint-NNN.yaml`

### Issue: Filename Collision

**Symptom**: Multiple sprints closed on same date, filenames collide.

**Solution**:
- Migration automatically appends `-2`, `-3`, etc.
- Example: `2026-02-14-sprint-001.yaml`, `2026-02-14-sprint-002-2.yaml`
- This is normal and does not affect functionality

### Issue: Migration Failed Mid-Process

**Symptom**: Migration started but didn't complete, partial files created.

**Solution**:
1. Delete incomplete directories: `rm -rf .forge/sprints/active .forge/sprints/completed`
2. Delete incomplete sequence file: `rm .forge/sprints/sprint-sequence.yaml`
3. Verify backup exists: `ls .forge/sprints/sprint-status.yaml.bak`
4. Restore backup: `cp .forge/sprints/sprint-status.yaml.bak .forge/sprints/sprint-status.yaml`
5. Run migration again

### Issue: Want to Rollback Migration

**Symptom**: Migrated but prefer old format.

**Solution**:
1. Delete new directories:
   ```bash
   rm -rf .forge/sprints/active
   rm -rf .forge/sprints/completed
   rm .forge/sprints/sprint-sequence.yaml
   ```
2. Restore backup:
   ```bash
   mv .forge/sprints/sprint-status.yaml.bak .forge/sprints/sprint-status.yaml
   ```
3. Old format will work via legacy parser (backward compatible)

### Issue: Lost Sequence File

**Symptom**: `sprint-sequence.yaml` deleted or corrupted.

**Solution**:
- Tool automatically rebuilds by scanning `active/` and `completed/`
- Sets `next_sprint_number` to max found + 1
- Run `/forge-sprint start` and tool will rebuild automatically
- You'll see a warning: "Sprint sequence file missing, rebuilt from existing sprints"

---

## New Commands

After migration, you can use these multi-sprint commands:

### Start New Sprint
```bash
/forge-sprint start
```

Reads sequence file, creates `active/sprint-NNN.yaml`, increments sequence.

### Close Sprint
```bash
/forge-sprint close        # Closes oldest active sprint
/forge-sprint close 002    # Closes sprint 002
```

Moves sprint from `active/` to `completed/YYYY-MM-DD-sprint-NNN.yaml`.

### List All Sprints
```bash
/forge-sprint list
```

Shows all active + last 5 completed sprints in table format.

### Update Sprint
```bash
/forge-sprint update       # Prompts for target if multiple active
/forge-sprint update 002   # Updates sprint 002
```

Updates story statuses in target sprint.

### Show Dashboard
```bash
/forge-sprint              # No args: shows dashboard if sprints exist
/sprint-status             # Alternative: invoke tool directly
```

Shows aggregate dashboard with all active sprints and velocity trend.

---

## FAQ

### Q: Can I have multiple active sprints?

**A**: Yes! The new format supports unlimited concurrent sprints. However, FORGE
warns if you have more than 5 active sprints (NFR-002) to avoid context complexity.

### Q: Will old format still work?

**A**: Yes, backward compatible. If you decline migration, the tool falls back
to the legacy parser and reads the old format correctly. However, you won't get
multi-sprint features until you migrate.

### Q: Do I lose my sprint history?

**A**: No. All historical data is preserved:
- Current sprint → `active/sprint-NNN.yaml`
- Previous sprints → `completed/YYYY-MM-DD-sprint-NNN.yaml`
- Original file → `sprint-status.yaml.bak` (backup)

### Q: What if I have sprints in progress?

**A**: Safe to migrate with in-progress sprints. The current sprint moves to
`active/` with all story statuses preserved. Continue working as normal after
migration.

### Q: Can I edit migrated files manually?

**A**: Yes. All files are human-readable YAML. Follow the format in
`../.opencode/templates/sprint-status.yaml`. Make sure to keep `version: 1`
field at the top.

### Q: What happens to `carried_over` stories?

**A**: When you close a sprint, incomplete stories are marked `carried_over` in
the archived file. These stories remain in your epic backlog. When starting the
next sprint, you must manually re-select them (they are NOT auto-added).

This gives you control over whether to include them or reprioritize.

### Q: Do I need to update my CI/CD scripts?

**A**: If your CI/CD reads sprint data, update paths:
- Old: `.forge/sprints/sprint-status.yaml`
- New: `.forge/sprints/active/sprint-*.yaml` (glob for all active sprints)

### Q: How do I query completed sprint data?

**A**: Completed sprints are in `.forge/sprints/completed/YYYY-MM-DD-sprint-NNN.yaml`.
Files are sorted chronologically by date prefix. Parse YAML to extract velocity
and story data.

---

## Summary

| Action | Command | Result |
|--------|---------|--------|
| Detect migration need | `/forge-sprint` or `/sprint-status` | Shows migration prompt if old format |
| Migrate automatically | Confirm prompt | Creates new directories, converts data, backs up old file |
| Verify migration | `ls .forge/sprints/` | Check for `active/`, `completed/`, `sprint-sequence.yaml` |
| Rollback | Delete dirs, restore `.bak` | Returns to old format |
| Start using new format | `/forge-sprint start` | Creates new sprint in `active/` |

**Migration is safe, reversible, and preserves all data.**

If you encounter issues, see Troubleshooting section above or file an issue
on the FORGE repository.
