# /forge-archive-decisions

Archive completed decision log entries to reduce context size while preserving
pending, in-progress, and critical decisions.

## Usage

```bash
/forge-archive-decisions [options]
```

### Options

- `--dry-run` - Preview what would be archived without making changes
- `--force` - Archive even if below thresholds
- `--keep <N>` - Override config, keep last N entries (default: 30)
- `--validate-only` - Only validate entry format, don't archive

### Examples

```bash
# Standard archiviation (triggered automatically when needed)
/forge-archive-decisions

# Preview mode
/forge-archive-decisions --dry-run

# Force archiviation even if below 500 lines
/forge-archive-decisions --force

# Keep last 50 entries instead of configured 30
/forge-archive-decisions --keep 50

# Validate all entries have proper status field
/forge-archive-decisions --validate-only
```

---

## What It Does

This command implements intelligent archiviation of the decision log using
the `decision-archiver` skill:

1. **Parses** `.forge/knowledge/decision-log.md`
2. **Checks** if thresholds exceeded (500 lines or 20k tokens by default)
3. **Identifies** archivable entries (completed, not recent, not critical)
4. **Preserves** pending/in-progress/blocked entries and last N entries
5. **Moves** archivable entries to `.forge/knowledge/archives/YYYY-MM/`
6. **Updates** archive index for easy navigation
7. **Reports** statistics and space saved

---

## When To Use

### Automatic Trigger

The FORGE orchestrator automatically checks decision log size at the start of
each workflow command. If thresholds are exceeded, it suggests running this
command.

You'll see:
```
⚠️ Decision log is large (1247 lines, ~50k tokens)
   This may slow down context loading.
   Run: /forge-archive-decisions
```

### Manual Trigger

Run manually:
- Before starting a new Epic or major Feature
- When you notice context window pressure
- After completing a sprint or milestone
- As part of monthly knowledge management

---

## What Gets Archived

**✅ WILL BE ARCHIVED:**
- Entries with status: `completed`, `resolved`, `cancelled`, `superseded`
- Older than last N entries (default: 30)
- Not tagged as `critical`, `constitutional`, or `breaking-change`
- Not referenced by active specs

**❌ NEVER ARCHIVED:**
- Entries with status: `pending`, `in-progress`, `blocked`
- Last N entries (default: 30), regardless of status
- Any entry tagged with critical tags
- Entries referenced by specs in active development

---

## Archive Structure

Creates this structure:

```
.forge/knowledge/
├── decision-log.md              # Active log (kept small)
├── archives/
│   ├── index.md                 # Master index of all archives
│   ├── 2026-02/
│   │   ├── decisions-2026-02.md # February decisions
│   │   └── index.md             # Month summary
│   └── 2026-01/
│       ├── decisions-2026-01.md
│       └── index.md
```

---

## Example Output

```
🗂️ Archiving Decision Log...

📋 Analyzing decision-log.md
   - Total entries: 124
   - Total lines: 3521
   - Estimated tokens: ~141k

🔍 Applying retention rules...
   ✅ Keep last 30 entries: 30 entries
   ✅ Keep pending/in-progress/blocked: 12 entries
   ✅ Keep critical tags: 5 entries
   ✅ Keep referenced by active specs: 3 entries
   
   Total kept: 50 entries (accounting for overlaps)
   Archivable: 74 entries

📦 Creating archives...
   ✅ archives/2026-02/decisions-2026-02.md (+45 entries)
   ✅ archives/2026-01/decisions-2026-01.md (+29 entries)
   ✅ Updated archives/index.md

✅ Archiviation Complete!

📊 Results:
   - Entries kept in active log: 50
   - Entries archived: 74
   - Lines before: 3521
   - Lines after: 487
   - Space saved: 86% 🎉
   - Estimated tokens: ~19.5k (was ~141k)

💡 Next steps:
   - Review archives at: .forge/knowledge/archives/
   - Consider promoting key decisions to ADRs: /forge-adr
```

---

## Dry Run Mode

Use `--dry-run` to preview without changes:

```bash
/forge-archive-decisions --dry-run
```

Output:
```
🔍 DRY RUN MODE - No changes will be made

📋 Would archive 74 entries:
   
Archives to create:
   📁 archives/2026-02/decisions-2026-02.md (+45 entries)
      - DEC-2026-042: Auth system architecture
      - DEC-2026-055: Database migration strategy
      ... (43 more)
   
   📁 archives/2026-01/decisions-2026-01.md (+29 entries)
      - DEC-2026-001: Initial tech stack
      - DEC-2026-015: API versioning approach
      ... (27 more)

Entries to keep (50):
   ✅ Last 30 entries (by date)
   ✅ 12 pending/in-progress/blocked
   ✅ 5 with critical tags
   ✅ 3 referenced by active specs

Run without --dry-run to apply changes.
```

---

## Validation Mode

Use `--validate-only` to check entry format:

```bash
/forge-archive-decisions --validate-only
```

Output:
```
🔍 Validating decision log entries...

✅ 120/124 entries valid

⚠️ Issues found:

Entry at line 234 (2026-02-10):
   ❌ Missing required field: Status
   💡 Add: **Status:** `completed`

Entry at line 456 (2026-02-05):
   ⚠️ Unknown status value: "done"
   💡 Valid values: pending, in-progress, blocked, completed, resolved, cancelled, superseded

Entry at line 789 (2026-01-28):
   ⚠️ Optional field missing: Tags
   💡 Consider adding tags for better organization

Fix these issues before archiving.
Use the template: .opencode/templates/decision-log-entry-template.md
```

---

## Configuration

Customize behavior in `.forge/config.yml`:

```yaml
knowledge:
  decision_log:
    max_lines: 500              # Trigger threshold
    max_tokens: 20000           # Alternative threshold
    keep_recent: 30             # Always keep last N
    auto_archive: true          # Auto-suggest when threshold hit
    
    critical_tags:              # Never archive these
      - critical
      - constitutional
      - breaking-change
      - security-critical
```

---

## Troubleshooting

### "Parse error: malformed entry"

**Cause:** Entry doesn't follow required format
**Fix:** Run `--validate-only`, fix reported issues, use template

### "No entries eligible for archiviation"

**Cause:** All entries are pending/in-progress or within last N
**Fix:** This is normal! Archive when more entries are completed

### "Archive file already exists"

**Cause:** Appending to existing archive (this is normal)
**Fix:** No action needed, entries are appended chronologically

---

## Related Commands

- `/forge-adr` - Promote important decisions to formal ADRs
- `/forge-status` - View current project status and knowledge base stats
- `/forge-help knowledge` - Learn about knowledge management in FORGE

---

## Implementation Notes

This command loads and executes the `decision-archiver` skill, which:
1. Parses decision-log.md using Read tool
2. Filters entries by status and retention rules
3. Creates archive structure using Bash + Write
4. Updates decision-log.md using Edit tool
5. Generates summary reports

See: `.opencode/skills/decision-archiver/SKILL.md` for detailed logic.
