# /forge-validate-decisions

Validate decision log entries for format and completeness.

## Usage

```bash
/forge-validate-decisions [options]
```

| Option           | Effect                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| `--strict`       | Fail on warnings, not only errors                                      |
| `--fix`          | Auto-fix common safe issues                                            |
| `--file <path>`  | Validate specific file (default `.forge/knowledge/decision-log.md`)    |

Examples:
```bash
/forge-validate-decisions
/forge-validate-decisions --strict
/forge-validate-decisions --fix
/forge-validate-decisions --file .forge/knowledge/archives/2026-01/decisions-2026-01.md
```

---

## What It Validates

**Required per entry**:
- ✅ Date in header (`## YYYY-MM-DD | Session: ...`)
- ✅ Status field (`**Status:** \`value\``)
- ✅ Valid status: `pending`, `in-progress`, `blocked`, `completed`, `resolved`, `cancelled`, `superseded`

**Recommended (warnings)**: Tags field, Context section, Decisions section.

**Format**: markdown structure, status markers in decisions (`[PENDING]`, `[COMPLETED]`, etc.), valid spec refs, consistent `---` separators.

---

## Rules

### Errors (❌ — must fix before archive)

1. **Missing Status field**
2. **Invalid status value** (e.g., `done` → `completed`, `wip` → `in-progress`)
3. **Malformed date** in header (e.g., `02/17/2026` instead of `2026-02-17`)
4. **Duplicate Decision IDs** (e.g., two `DEC-2026-042`)

### Warnings (⚠️ — recommended)

1. Missing Tags
2. Missing Context section
3. Stale `pending` status (e.g., pending 8 months)
4. Empty Decisions section
5. Unrecognized decision status marker (`[WIP]` → `[IN-PROGRESS]`)

---

## Example Output — Success

```
✅ Decision Log Validation Complete

📊 Statistics:
   - Total entries: 124
   - Valid entries: 124
   - Errors: 0
   - Warnings: 0

Status distribution:
   - pending: 8
   - in-progress: 12
   - blocked: 3
   - completed: 95
   - resolved: 6

✅ Ready for archiviation
```

## Example Output — Issues

```
⚠️ Decision Log Validation Found Issues

📊 Statistics:
   - Total entries: 124
   - Valid entries: 117
   - Errors: 4
   - Warnings: 3

❌ Errors (must fix):

Entry at line 234 (2026-02-10 | API Rate Limiting):
   ❌ Missing required field: Status
   💡 Fix: Add **Status:** `completed` (or appropriate status)

Entry at line 456 (2026-02-05 | Database Migration):
   ❌ Invalid status value: "done"
   💡 Fix: Change to **Status:** `completed`
   Valid values: pending, in-progress, blocked, completed, resolved, cancelled, superseded

Entry at line 789 (2026-01-28):
   ❌ Malformed date in header: "01/28/2026"
   💡 Fix: Use format YYYY-MM-DD: "2026-01-28"

Entry at line 1024 (2026-02-15 | SSO Integration):
   ❌ Duplicate Decision ID: DEC-2026-042
   💡 First occurrence at line 567
   Fix: Use unique ID like DEC-2026-042-b or DEC-2026-043

⚠️ Warnings (recommended):

Entry at line 345 (2026-02-08 | Cache Strategy):
   ⚠️ Missing tags
   💡 Consider adding: **Tags:** `performance`, `architecture`

Entry at line 678 (2025-08-15 | Old Feature):
   ⚠️ Status "pending" for 185 days
   💡 Review and update to current status or cancel

Entry at line 891 (2026-02-12 | API Design):
   ⚠️ Empty Decisions section
   💡 Add decisions or remove entry

---

🔧 Quick fix:
   Run: /forge-validate-decisions --fix
   This will automatically fix 2/4 errors
```

## Example Output — Auto-Fix

```
🔧 Auto-fixing decision log issues...

✅ Fixed 2 errors:
   - Line 234: Added default status `pending`
   - Line 789: Corrected date format to 2026-01-28

⚠️ Could not auto-fix 2 errors:
   - Line 456: Invalid status "done" → manual review needed
   - Line 1024: Duplicate ID → manual resolution required

📝 Changes written to decision-log.md

⚠️ Please review and fix remaining issues manually
   Run: /forge-validate-decisions
```

---

## Auto-Fix Capabilities

**Can auto-fix**: add missing status (default `pending`), correct unambiguous date formats, standardize decision markers (`[WIP]` → `[IN-PROGRESS]`), add missing section headers (Context, Decisions), fix minor markdown.

**Cannot auto-fix** (manual review): invalid status values, duplicate Decision IDs, missing spec refs, ambiguous/malformed content.

---

## Integration with Archiviation

`/forge-archive-decisions` runs validation in strict mode first:

```
🔍 Pre-archiviation validation...
   ⚠️ Found 2 errors in decision-log.md

   Archiviation blocked until issues are resolved.
   Run: /forge-validate-decisions
```

---

## Configuration

`.forge/config.yml`:
```yaml
knowledge:
  decision_log:
    validation:
      require_status: true              # default: true
      require_tags: false               # default: false (warning only)
      require_context: false            # default: false (warning only)
      warn_stale_pending_days: 90       # default: 90
      auto_fix_safe: true               # default: true
```

---

## Exit Codes (for CI/CD)

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 0    | Passed (no errors)                       |
| 1    | Failed (errors found)                    |
| 2    | Passed with warnings (no errors)         |

```bash
# Block merge if decision log has errors
/forge-validate-decisions --strict || exit 1
```

---

## Related

- `/forge-archive-decisions` — archive completed decisions (runs validation first)
- `/forge-adr` — promote important decisions to formal ADRs

---

## Implementation

1. Parse decision-log.md line by line.
2. Identify entry boundaries (`## YYYY-MM-DD`).
3. Extract and validate required fields.
4. Check status values against allowed list.
5. Detect common formatting issues.
6. Optionally apply safe auto-fixes.
7. Report findings with actionable suggestions.
