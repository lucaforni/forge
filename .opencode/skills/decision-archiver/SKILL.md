# Decision Archiver Skill

> **Purpose:** Archive completed decision log entries while preserving pending, in-progress, and critical decisions.
>
> **When:** Auto-triggered when decision-log.md exceeds thresholds, or via `/forge-archive-decisions`.

---

## Core Logic

### Archiviation Rules

**ALWAYS KEEP in decision-log.md:**
1. Entries with status `pending`, `in-progress`, `blocked`.
2. Last N entries (configurable, default 30) regardless of status.
3. Entries tagged `critical`, `constitutional`, `breaking-change`.
4. Entries referenced by active specs (`.forge/[ID]-*/spec.md`).

**CAN ARCHIVE:**
- Status `completed`, `resolved`, `cancelled`, `superseded`.
- Older than retention window (after keeping last N).
- Not tagged critical.
- Not referenced by active work.

### Status Values

| Status | Meaning | Archivable |
|--------|---------|-----------|
| `pending` | Decision not made, awaiting input | ❌ Never |
| `in-progress` | Being implemented | ❌ Never |
| `blocked` | Blocked by external dependency | ❌ Never |
| `completed` | Finalized and implemented | ✅ Yes (with rules) |
| `resolved` | Issue resolved, decision closed | ✅ Yes (with rules) |
| `cancelled` | Abandoned/superseded | ✅ Yes (with rules) |
| `superseded` | Replaced by newer decision | ✅ Yes (with rules) |

---

## Process

### Step 1: Parse decision-log.md

Extract per entry: date, session, status, tags, specRefs, decisionId, line range, full content block.

### Step 2: Load Configuration

Read `.forge/config.yml` or use defaults:
```yaml
knowledge:
  decision_log:
    max_lines: 500
    max_tokens: 20000
    keep_recent: 30
    auto_archive: true
    critical_tags:
      - critical
      - constitutional
      - breaking-change
```

### Step 3: Check Thresholds

```
IF lines > max_lines OR tokens > max_tokens:
   THEN archive
   ELSE skip, report "No archiviation needed"
```

### Step 4: Identify Archivable Entries

For each entry, KEEP if: status pending/in-progress/blocked, OR within last N, OR tagged critical, OR referenced by active spec. Mark remaining completed/resolved/cancelled/superseded for archiviation.

### Step 5: Create Archive Structure

```
.forge/knowledge/archives/
└── YYYY-MM/
    ├── decisions-YYYY-MM.md       # Archived entries
    └── index.md                    # Summary/TOC
```

Filename format: `decisions-YYYY-MM.md` based on entry date.

### Step 6: Move Entries

1. Group archivable entries by month.
2. Append to corresponding archive file (create if needed).
3. Remove from decision-log.md.
4. Update archive index.

### Step 7: Update Summary Index

`.forge/knowledge/archives/index.md`:
```markdown
# Decision Log Archives

## 2026

### February (127 decisions)
- [decisions-2026-02.md](2026-02/decisions-2026-02.md)
- Topics: Authentication, API redesign, Database migration
- Key decisions: DEC-2026-042, DEC-2026-055

### January (89 decisions)
- [decisions-2026-01.md](2026-01/decisions-2026-01.md)
...
```

### Step 8: Report Results

```
✅ Decision Log Archived

📊 Statistics:
- Entries archived: 87
- Entries kept: 43
  - Recent (last 30): 30
  - Pending/In-progress: 8
  - Critical tags: 5

📁 Archives:
- archives/2026-02/decisions-2026-02.md (+52 entries)
- archives/2026-01/decisions-2026-01.md (+35 entries)

💾 Space saved:
- Before: 3500 lines (~140k tokens)
- After: 450 lines (~18k tokens)
- Reduction: 87% 🎉
```

---

## Entry Format Requirements

Entries MUST follow this format:

```markdown
## YYYY-MM-DD | Session: <session-name>

**Status:** `status-value`
**Tags:** `tag1`, `tag2`, `tag3`
**Spec Refs:** `spec-id-1`, `spec-id-2` (optional)
**Decision ID:** `DEC-YYYY-NNN` (optional, auto-generated)

### Context
Brief description of the situation...

### Decisions
1. [STATUS] Decision title
   - **Rationale:** Why this decision
   - **Impact:** High/Medium/Low
   - **Alternatives considered:** ...

2. [STATUS] Another decision
   ...

### Follow-up Actions
- [ ] Task 1
- [x] Task 2 (completed)

---
```

### Header Fields

- **Status:** REQUIRED — pending, in-progress, blocked, completed, resolved, cancelled, superseded.
- **Tags:** OPTIONAL — comma-separated, for filtering.
- **Spec Refs:** OPTIONAL — related spec IDs for traceability.
- **Decision ID:** OPTIONAL — unique ID, auto-generated if missing.

### Inline Decision Status Markers

- `[PENDING]` - Not yet decided.
- `[IN-PROGRESS]` - Being implemented.
- `[COMPLETED]` - Finalized.
- `[BLOCKED]` - Waiting on dependency.
- `[CANCELLED]` - Abandoned.

---

## Tools Used

1. **Read** — parse decision-log.md.
2. **Edit** — remove archived entries.
3. **Write** — create archive files.
4. **Bash** — create archive directories.
5. **Glob** — find active spec IDs in `.forge/`.

---

## Error Handling

**Malformed entries:**
```
⚠️ Warning: Entry at line 234 missing status field
   Defaulting to 'pending' (will not be archived)
```

**Parse failures:**
```
❌ Error: decision-log.md is malformed
   Run: /forge-validate-decisions
   Fix issues before archiving
```

**Disk space:**
```
❌ Error: Cannot create archive file
   Check disk space and permissions
```

---

## Configuration Options

`.forge/config.yml`:

```yaml
knowledge:
  decision_log:
    # Archiviation triggers
    max_lines: 500                    # Default: 500
    max_tokens: 20000                 # Default: 20000 (~50k context budget)
    auto_archive: true                # Default: true

    # Retention
    keep_recent: 30                   # Default: 30

    # Critical tags (never archive)
    critical_tags:
      - critical
      - constitutional
      - breaking-change
      - security-critical

    # Archive location
    archive_path: .forge/knowledge/archives

    # Validation
    require_status_field: true
    warn_on_missing_fields: true
```

---

## Performance

- Logs > 5000 lines: 10-15s processing.
- Token estimation: 4 chars ≈ 1 token.
- Concurrent safety: last write wins (rare edge case, acceptable).
