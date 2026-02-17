# /forge-validate-decisions

Validate decision log entries for proper format and completeness.

## Usage

```bash
/forge-validate-decisions [options]
```

### Options

- `--strict` - Fail on warnings, not just errors
- `--fix` - Attempt to auto-fix common issues (e.g., add missing fields)
- `--file <path>` - Validate specific file (default: `.forge/knowledge/decision-log.md`)

### Examples

```bash
# Standard validation
/forge-validate-decisions

# Strict mode (warnings treated as errors)
/forge-validate-decisions --strict

# Auto-fix common issues
/forge-validate-decisions --fix

# Validate archived file
/forge-validate-decisions --file .forge/knowledge/archives/2026-01/decisions-2026-01.md
```

---

## What It Validates

### Required Fields

Every entry MUST have:
- ✅ Date in header (`## YYYY-MM-DD | Session: ...`)
- ✅ Status field (`**Status:** \`value\``)
- ✅ Valid status value (pending, in-progress, blocked, completed, resolved, cancelled, superseded)

### Optional but Recommended

- ⚠️ Tags field (helps with organization)
- ⚠️ Context section (provides background)
- ⚠️ Decisions section (lists actual decisions)

### Format Checks

- ✅ Proper markdown structure
- ✅ Status markers in decisions (`[PENDING]`, `[COMPLETED]`, etc.)
- ✅ Valid spec refs format (if present)
- ✅ Consistent separator lines (`---`)

---

## Validation Rules

### Error-Level Issues (❌)

**Must be fixed before archiviation:**

1. **Missing Status Field**
   ```markdown
   ## 2026-02-17 | Session: Example
   <!-- Missing: **Status:** `pending` -->
   ```
   
2. **Invalid Status Value**
   ```markdown
   **Status:** `done`  <!-- Invalid, use: completed -->
   **Status:** `wip`   <!-- Invalid, use: in-progress -->
   ```

3. **Malformed Date in Header**
   ```markdown
   ## 02/17/2026 | Session: Example  <!-- Wrong format -->
   ## Session: Example                <!-- Missing date -->
   ```

4. **Duplicate Decision IDs**
   ```markdown
   **Decision ID:** `DEC-2026-042`
   ...
   **Decision ID:** `DEC-2026-042`  <!-- Duplicate! -->
   ```

### Warning-Level Issues (⚠️)

**Recommended to fix:**

1. **Missing Tags**
   ```markdown
   **Status:** `completed`
   <!-- Consider adding: **Tags:** `architecture`, `api` -->
   ```

2. **Missing Context Section**
   ```markdown
   ### Decisions
   1. Decision without context...
   ```

3. **Stale Pending Status**
   ```markdown
   ## 2025-06-15 | Session: Old Decision
   **Status:** `pending`  <!-- Pending for 8 months? -->
   ```

4. **Empty Decisions Section**
   ```markdown
   ### Decisions
   <!-- No actual decisions listed -->
   ```

5. **Unrecognized Decision Status Marker**
   ```markdown
   1. [WIP] Decision  <!-- Use [IN-PROGRESS] instead -->
   ```

---

## Example Output

### Successful Validation

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

### With Issues

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

### Auto-Fix Output

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

When using `--fix`, the validator can automatically correct:

✅ **Can auto-fix:**
- Add missing status field with default `pending`
- Correct date format in headers (if unambiguous)
- Standardize decision status markers (`[WIP]` → `[IN-PROGRESS]`)
- Add missing section headers (Context, Decisions)
- Fix minor markdown formatting issues

❌ **Cannot auto-fix (requires manual review):**
- Invalid status values (need human judgment)
- Duplicate decision IDs (need unique resolution)
- Missing spec refs (need domain knowledge)
- Ambiguous dates or malformed content

---

## Integration with Archiviation

Before running `/forge-archive-decisions`, the archiver automatically runs
validation in strict mode:

```
🔍 Pre-archiviation validation...
   ⚠️ Found 2 errors in decision-log.md
   
   Archiviation blocked until issues are resolved.
   Run: /forge-validate-decisions
   Fix reported issues and try again.
```

This prevents archiving malformed entries that could cause parsing issues.

---

## Configuration

Customize validation in `.forge/config.yml`:

```yaml
knowledge:
  decision_log:
    validation:
      require_status: true              # Default: true
      require_tags: false               # Default: false (warning only)
      require_context: false            # Default: false (warning only)
      warn_stale_pending_days: 90       # Default: 90
      auto_fix_safe: true               # Default: true (allow safe auto-fixes)
```

---

## Exit Codes

For CI/CD integration:

- `0` - Validation passed (no errors)
- `1` - Validation failed (errors found)
- `2` - Validation passed with warnings (no errors, but warnings present)

Use in CI:
```bash
# Block merge if decision log has errors
/forge-validate-decisions --strict || exit 1
```

---

## Related Commands

- `/forge-archive-decisions` - Archive completed decisions (runs validation first)
- `/forge-adr` - Promote important decisions to formal ADRs

---

## Implementation Notes

The validator:
1. Parses decision-log.md line by line
2. Identifies entry boundaries (`## YYYY-MM-DD`)
3. Extracts and validates required fields
4. Checks status values against allowed list
5. Detects common formatting issues
6. Optionally applies safe auto-fixes
7. Reports findings with actionable suggestions
