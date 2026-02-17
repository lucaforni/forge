# Decision Archiver Skill

> **Purpose:** Intelligently archive completed decision log entries while
> preserving pending, in-progress, and critical decisions in the active log.
>
> **When to use:** Automatically triggered when decision-log.md exceeds
> configured thresholds, or manually via `/forge-archive-decisions`.

---

## Core Logic

### Archiviation Rules

**ALWAYS KEEP in decision-log.md:**
1. All entries with status: `pending`, `in-progress`, `blocked`
2. Last N entries (configurable, default: 30) regardless of status
3. All entries tagged with: `critical`, `constitutional`, `breaking-change`
4. All entries referenced by active specs (in `.forge/[ID]-*/spec.md`)

**CAN ARCHIVE:**
- Entries with status: `completed`, `resolved`, `cancelled`, `superseded`
- Older than the retention window (after keeping last N)
- Not tagged as critical
- Not referenced by active work

### Entry Status Values

| Status | Meaning | Archivable |
|--------|---------|-----------|
| `pending` | Decision not yet made, awaiting input | ❌ Never |
| `in-progress` | Decision being implemented | ❌ Never |
| `blocked` | Blocked by external dependency | ❌ Never |
| `completed` | Decision finalized and implemented | ✅ Yes (with rules) |
| `resolved` | Issue resolved, decision closed | ✅ Yes (with rules) |
| `cancelled` | Decision abandoned/superseded | ✅ Yes (with rules) |
| `superseded` | Replaced by newer decision | ✅ Yes (with rules) |

---

## Process

### Step 1: Parse decision-log.md

Extract all entries with their metadata:
```markdown
## 2026-02-17 | Session: Feature Implementation
**Status:** `completed`
**Tags:** `architecture`, `security`
**Spec Refs:** `042-auth-system`
**Decision ID:** `DEC-2026-042`
```

Parse into structured data:
```javascript
{
  date: "2026-02-17",
  session: "Feature Implementation",
  status: "completed",
  tags: ["architecture", "security"],
  specRefs: ["042-auth-system"],
  decisionId: "DEC-2026-042",
  content: "...",
  lineStart: 42,
  lineEnd: 68
}
```

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
IF decision-log.md line count > max_lines 
   OR estimated tokens > max_tokens:
   THEN proceed with archiviation
   ELSE skip and report "No archiviation needed"
```

### Step 4: Identify Archivable Entries

```
FOR EACH entry IN decision-log.md:
  // Rule 1: Never archive non-completed statuses
  IF entry.status IN [pending, in-progress, blocked]:
    KEEP entry
    CONTINUE
  
  // Rule 2: Always keep last N entries
  IF entry IN last_N_entries:
    KEEP entry
    CONTINUE
  
  // Rule 3: Keep critical tags
  IF entry.tags INTERSECTS critical_tags:
    KEEP entry
    CONTINUE
  
  // Rule 4: Keep if referenced by active specs
  IF entry.specRefs INTERSECTS active_spec_ids:
    KEEP entry
    CONTINUE
  
  // Rule 5: Archive eligible
  IF entry.status IN [completed, resolved, cancelled, superseded]:
    MARK for_archive
```

### Step 5: Create Archive Structure

```
.forge/knowledge/archives/
└── YYYY-MM/
    ├── decisions-YYYY-MM.md       # Archived entries
    └── index.md                    # Summary/TOC
```

Archive filename format: `decisions-YYYY-MM.md` based on entry date.

### Step 6: Move Entries

1. Group archivable entries by month
2. Append to corresponding archive file (create if needed)
3. Remove from decision-log.md
4. Update archive index

### Step 7: Update Summary Index

Create/update `.forge/knowledge/archives/index.md`:
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

For this skill to work, decision log entries MUST follow this format:

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

- **Status:** (REQUIRED) One of: pending, in-progress, blocked, completed, resolved, cancelled, superseded
- **Tags:** (OPTIONAL) Comma-separated keywords for filtering
- **Spec Refs:** (OPTIONAL) Related spec IDs for traceability
- **Decision ID:** (OPTIONAL) Unique identifier, auto-generated if missing

### Decision Status Markers

Within the Decisions section, each decision can have inline status:
- `[PENDING]` - Not yet decided
- `[IN-PROGRESS]` - Being implemented
- `[COMPLETED]` - Finalized
- `[BLOCKED]` - Waiting on dependency
- `[CANCELLED]` - Abandoned

---

## Tools Used

This skill requires these tools during execution:
1. **Read** - Parse decision-log.md
2. **Edit** - Remove archived entries from decision-log.md
3. **Write** - Create new archive files
4. **Bash** - Create archive directories
5. **Glob** - Find active spec IDs in `.forge/`

---

## Error Handling

### Malformed Entries

If an entry is missing required fields:
```
⚠️ Warning: Entry at line 234 missing status field
   Defaulting to 'pending' (will not be archived)
```

### Parse Failures

If decision-log.md cannot be parsed:
```
❌ Error: decision-log.md is malformed
   Run: /forge-validate-decisions
   Fix issues before archiving
```

### Disk Space

If archive creation fails:
```
❌ Error: Cannot create archive file
   Check disk space and permissions
```

---

## Configuration Options

Add to `.forge/config.yml`:

```yaml
knowledge:
  decision_log:
    # Archiviation triggers
    max_lines: 500                    # Default: 500
    max_tokens: 20000                 # Default: 20000 (~50k context budget)
    auto_archive: true                # Default: true
    
    # Retention rules
    keep_recent: 30                   # Default: 30 entries
    
    # Critical tags (never archive)
    critical_tags:
      - critical
      - constitutional
      - breaking-change
      - security-critical
    
    # Archive location
    archive_path: .forge/knowledge/archives
    
    # Validation
    require_status_field: true        # Enforce status on all entries
    warn_on_missing_fields: true      # Warn on missing optional fields
```

---

## Performance Considerations

- **Large logs:** For logs > 5000 lines, processing may take 10-15 seconds
- **Token estimation:** Uses 4 chars = 1 token approximation
- **Concurrent safety:** If multiple agents archive simultaneously, last write wins
  (rare edge case, acceptable)

---

## Future Enhancements

1. **Smart search:** Index archived decisions for fast search
2. **Auto-promotion:** Suggest promoting recurring decisions to ADRs
3. **Metrics:** Track decision velocity, resolution time
4. **Compression:** Old archives could be compressed to .zip
