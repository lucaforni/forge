# Knowledge Management in FORGE

> Complete guide to managing project knowledge, decisions, and architectural
> records in FORGE.

---

## Overview

FORGE uses a structured knowledge base to maintain project context across
sessions and team members. The knowledge base consists of:

1. **Decision Log** - Session-level decisions and their status
2. **ADRs** (Architectural Decision Records) - Formal architectural decisions
3. **Lessons Learned** - Retrospective insights
4. **Archive** - Historical decisions (for reduced context size)

---

## Decision Log

### Purpose

The decision log captures **session-level decisions** made during development.
It's the working memory of your project - decisions that are:
- Made during development sessions
- May still be pending or in-progress
- Need to be tracked but aren't formal enough for ADRs yet
- Referenced frequently during active development

### Location

```
.forge/knowledge/decision-log.md      # Active decisions
.forge/knowledge/archives/            # Archived historical decisions
  ├── index.md                        # Master index
  └── YYYY-MM/
      ├── decisions-YYYY-MM.md        # Monthly archives
      └── index.md                    # Month summary
```

### Entry Format

Every decision log entry MUST follow this structure:

```markdown
## YYYY-MM-DD | Session: [Session Name]

**Status:** `pending` | `in-progress` | `blocked` | `completed` | `resolved` | `cancelled` | `superseded`
**Tags:** `tag1`, `tag2`, `tag3`
**Spec Refs:** `spec-id-1`, `spec-id-2`
**Decision ID:** `DEC-YYYY-NNN`

### Context
Background information...

### Decisions
1. [STATUS] Decision title
   - **Rationale:** Why
   - **Impact:** High/Medium/Low
   - **Alternatives considered:** ...

### Follow-up Actions
- [ ] Task 1
- [x] Task 2

---
```

**Required Fields:**
- Date in header (`YYYY-MM-DD`)
- Status field with valid value
- At least one decision in Decisions section

**Optional but Recommended:**
- Tags (for filtering and organization)
- Spec Refs (for traceability)
- Decision ID (auto-generated if omitted)
- Context section (background)

See template: `.opencode/templates/decision-log-entry-template.md`

---

## Status Values

### Entry-Level Status

Applied to the entire session entry:

| Status | Meaning | Archivable? |
|--------|---------|-------------|
| `pending` | Awaiting decision/input | ❌ Never |
| `in-progress` | Decision made, implementing | ❌ Never |
| `blocked` | Cannot proceed, external dependency | ❌ Never |
| `completed` | Finalized and implemented | ✅ Yes* |
| `resolved` | Issue resolved, closed | ✅ Yes* |
| `cancelled` | Abandoned, no longer relevant | ✅ Yes* |
| `superseded` | Replaced by newer decision | ✅ Yes* |

\* With retention rules applied (see Archiviation below)

### Decision-Level Status

Within the Decisions section, individual decisions can have inline markers:

- `[PENDING]` - Not yet decided
- `[IN-PROGRESS]` - Being implemented
- `[COMPLETED]` - Finalized
- `[BLOCKED]` - Waiting on dependency
- `[CANCELLED]` - Abandoned

This allows tracking individual decisions within a session that may have
different statuses.

---

## Archiviation System

### The Problem

Decision logs grow rapidly, especially on high-velocity teams:
- 500 lines/day on active projects
- 3500+ lines in a week (observed case)
- Causes context window pressure
- Slows down FORGE commands

### The Solution

**Intelligent archiviation** that:
1. ✅ Keeps recent history (last N entries)
2. ✅ Preserves active work (pending/in-progress/blocked)
3. ✅ Protects critical decisions (tagged appropriately)
4. ✅ Archives completed, old decisions
5. ✅ Maintains full history in searchable archives

### Archiviation Rules

**ALWAYS KEEP in decision-log.md:**
- All entries with status: `pending`, `in-progress`, `blocked`
- Last N entries (default: 30), regardless of status
- All entries tagged: `critical`, `constitutional`, `breaking-change`, or custom critical tags
- All entries referenced by active specs (specs in development)

**CAN ARCHIVE:**
- Entries with status: `completed`, `resolved`, `cancelled`, `superseded`
- Older than the retention window (not in last N)
- Not tagged as critical
- Not referenced by active work

### Triggers

#### Automatic Monitoring

**FORGE automatically checks decision log size** before major workflow commands
(`/forge-specify`, `/forge-plan`, `/forge-implement`, etc.).

When you run a command, FORGE:
1. ✅ Checks decision log size (< 100ms, imperceptible)
2. ⚠️ Displays warning if threshold exceeded (500 lines by default)
3. 💡 Suggests running `/forge-archive-decisions`
4. ✅ Continues with your command (non-blocking)

**Example:**
```
$ /forge-specify

⚠️  Decision log size warning

Current: 1247 lines (~50k tokens)
Threshold: 500 lines
Status: EXCEEDED (2.5x over limit)

Recommended: /forge-archive-decisions --dry-run

Continuing with specification...
```

You can archive immediately or continue working - the warning is informational.

#### Manual Trigger

You can also check and archive manually anytime:
```bash
# Check size
wc -l .forge/knowledge/decision-log.md

# Archive
/forge-archive-decisions
```

#### Configuration

Configure thresholds in `.forge/config.yml`:

```yaml
knowledge:
  decision_log:
    max_lines: 500              # Adjust for team velocity
    max_tokens: 20000
    keep_recent: 30
    auto_archive: true          # Enable automatic suggestions
```

#### Skip Checks (Urgent Work)

For urgent work, skip the check:
```bash
/forge-specify --skip-checks
```

### Commands

#### Archive Decisions

```bash
# Standard archiviation
/forge-archive-decisions

# Preview what would be archived
/forge-archive-decisions --dry-run

# Force even if below thresholds
/forge-archive-decisions --force

# Keep more recent entries
/forge-archive-decisions --keep 50
```

See: `.opencode/commands/forge-archive-decisions.md`

#### Validate Decisions

```bash
# Check entry format
/forge-validate-decisions

# Strict mode (warnings = errors)
/forge-validate-decisions --strict

# Auto-fix common issues
/forge-validate-decisions --fix
```

See: `.opencode/commands/forge-validate-decisions.md`

---

## Best Practices

### 1. Update Status Regularly

**Don't:**
```markdown
## 2025-06-15 | Session: API Design
**Status:** `pending`
<!-- 8 months later, still pending? -->
```

**Do:**
```markdown
## 2025-06-15 | Session: API Design
**Status:** `completed`
<!-- Updated when work finished -->
```

### 2. Tag Critical Decisions

**Don't:**
```markdown
**Status:** `completed`
**Tags:** `api`
<!-- Important decision, but not tagged critically -->
```

**Do:**
```markdown
**Status:** `completed`
**Tags:** `api`, `breaking-change`, `constitutional`
<!-- Won't be archived prematurely -->
```

### 3. Link to Specs

**Don't:**
```markdown
### Context
Working on the auth system...
```

**Do:**
```markdown
**Spec Refs:** `042-auth-system`

### Context
Working on the auth system (spec 042)...
```

### 4. Document Rationale

**Don't:**
```markdown
1. [COMPLETED] Use Redis for sessions
```

**Do:**
```markdown
1. [COMPLETED] Use Redis for sessions
   - **Rationale:** Already in stack, atomic ops, fast
   - **Alternatives considered:**
     - PostgreSQL: Slower, but simpler (no new dependency)
     - Memory: Fast but not persistent
   - **Trade-off:** Accepting Redis as dependency for performance
```

### 5. Close Old Pending Decisions

Review pending decisions monthly:
- Still relevant? Keep as `pending`
- Being worked on? Change to `in-progress`
- No longer needed? Change to `cancelled`
- Blocked indefinitely? Document blocker or cancel

---

## Workflow Integration

### During Specification (/forge-specify)

forge-pm agent adds entries like:

```markdown
## 2026-02-17 | Session: Spec 042 - Auth System

**Status:** `in-progress`
**Tags:** `architecture`, `security`
**Spec Refs:** `042-auth-system`

### Decisions
1. [COMPLETED] Use OAuth2 for third-party auth
2. [PENDING] Session storage strategy (Redis vs PostgreSQL)
```

### During Planning (/forge-plan)

forge-architect agent references decision log and may add:

```markdown
## 2026-02-17 | Session: Plan for 042

**Status:** `completed`
**Tags:** `architecture`, `planning`
**Spec Refs:** `042-auth-system`

### Decisions
1. [COMPLETED] Split auth into 3 services: auth-api, token-manager, session-store
   - **Rationale:** Aligns with microservices architecture (ADR-008)
   - **Spec Ref:** DEC-2026-042 (session storage decision)
```

### During Implementation (/forge-implement)

Build agent may add:

```markdown
## 2026-02-18 | Session: Implementing Auth API

**Status:** `in-progress`
**Tags:** `implementation`
**Spec Refs:** `042-auth-system`

### Decisions
1. [COMPLETED] Use Passport.js middleware
   - **Rationale:** Well-maintained, supports OAuth2
2. [BLOCKED] Redis connection pooling config
   - **Blocked by:** DEC-2026-042 (waiting on Redis vs PG decision)
```

### During Review (/forge-review)

forge-reviewer agent may add:

```markdown
## 2026-02-19 | Session: Review PR #234 (Auth Implementation)

**Status:** `completed`
**Tags:** `review`, `security`
**Spec Refs:** `042-auth-system`

### Decisions
1. [COMPLETED] Require rate limiting on token endpoint
   - **Rationale:** Prevent brute-force attacks
   - **Impact:** High (security)
```

### After Sprint (/forge-retro)

forge-scrum agent references completed decisions for retrospective.

---

## Decision Log vs ADRs

### When to Use Decision Log

- Session-level decisions during active development
- Decisions that may change/evolve
- Implementation details
- Quick decisions that don't need formal justification
- Pending or in-progress decisions

### When to Promote to ADR

Use `/forge-adr` to promote decisions to formal ADRs when:
- Defines architectural patterns used across multiple features
- Has constitutional implications
- Involves significant trade-offs needing detailed justification
- Referenced by 3+ specs or modules
- Should be immutable "decision of record"
- Required for onboarding or compliance

**Example:**

Decision log entry:
```markdown
## 2026-02-15 | Session: Microservices Communication

**Decision ID:** `DEC-2026-055`

### Decisions
1. [COMPLETED] Use gRPC for inter-service communication
   - Rationale: Type-safe, performant, bidirectional streaming
   - Impact: High (affects all services)
```

Promoted to ADR:
```bash
/forge-adr --from-decision DEC-2026-055
```

Creates: `.forge/knowledge/adr/ADR-012-grpc-for-inter-service-communication.md`

---

## Archive Structure

### Directory Layout

```
.forge/knowledge/archives/
├── index.md                           # Master index of all archives
├── 2026-02/
│   ├── decisions-2026-02.md           # All February decisions
│   └── index.md                       # February summary
├── 2026-01/
│   ├── decisions-2026-01.md
│   └── index.md
└── 2025-12/
    ├── decisions-2025-12.md
    └── index.md
```

### Master Index Format

```markdown
# Decision Log Archives

## 2026

### February (127 decisions)
- [decisions-2026-02.md](2026-02/decisions-2026-02.md)
- **Topics:** Authentication, API redesign, Database migration
- **Key decisions:** DEC-2026-042, DEC-2026-055, DEC-2026-078
- **Archived:** 2026-03-01

### January (89 decisions)
- [decisions-2026-01.md](2026-01/decisions-2026-01.md)
- **Topics:** Initial architecture, Tech stack, CI/CD setup
- **Key decisions:** DEC-2026-001, DEC-2026-015
- **Archived:** 2026-02-01
```

### Searching Archives

```bash
# Grep across all archives
grep -r "OAuth2" .forge/knowledge/archives/

# Find specific decision ID
grep -r "DEC-2026-042" .forge/knowledge/

# Search by tag
grep -r "Tags:.*security" .forge/knowledge/archives/
```

---

## Configuration

Customize behavior in `.forge/config.yml`:

```yaml
knowledge:
  decision_log:
    # Archiviation triggers
    max_lines: 500                    # For high-velocity: 200-300
    max_tokens: 20000                 # Estimated token budget
    auto_archive: true                # Auto-suggest when exceeded
    
    # Retention rules
    keep_recent: 30                   # Always keep last N
    
    # Critical tags (never archive)
    critical_tags:
      - critical
      - constitutional
      - breaking-change
      - security-critical
      # Add custom tags here
    
    # Validation
    validation:
      require_status: true            # Enforce status on all entries
      require_tags: false             # Optional (recommended: true)
      warn_stale_pending_days: 90     # Warn on old pending entries
```

See: `.opencode/docs/config-guide.md` for full configuration guide.

---

## Troubleshooting

### "Decision log is large, slowing down context loading"

**Solution:** Run `/forge-archive-decisions`

Preview first: `/forge-archive-decisions --dry-run`

### "Parse error: malformed entry"

**Solution:** Run `/forge-validate-decisions` to find issues

Fix reported problems, use template for new entries

### "All my decisions are being archived!"

**Cause:** Entries likely have `completed` status

**Solution:**
- Keep active work as `pending` or `in-progress`
- Tag important decisions with `critical`
- Reference from active specs

### "I can't find an old decision"

**Solution:** Search archives

```bash
grep -r "keyword" .forge/knowledge/archives/
```

Or check master index: `.forge/knowledge/archives/index.md`

---

## Metrics and Analytics

Track decision velocity and patterns:

```bash
# Count decisions per month
wc -l .forge/knowledge/archives/*/decisions-*.md

# Most common tags
grep -rh "Tags:" .forge/knowledge/ | sort | uniq -c | sort -rn

# Pending decisions
grep -A 2 "Status.*pending" .forge/knowledge/decision-log.md

# Blocked decisions
grep -A 2 "Status.*blocked" .forge/knowledge/decision-log.md
```

---

## Related Documentation

- **Decision Entry Template:** `.opencode/templates/decision-log-entry-template.md`
- **Archive Command:** `.opencode/commands/forge-archive-decisions.md`
- **Validation Command:** `.opencode/commands/forge-validate-decisions.md`
- **Decision Archiver Skill:** `.opencode/skills/decision-archiver/SKILL.md`
- **Configuration Guide:** `.opencode/docs/config-guide.md`
- **ADR Creation:** `.opencode/commands/forge-adr.md`

---

## Quick Reference

### Entry Template

```markdown
## YYYY-MM-DD | Session: Name

**Status:** `pending`
**Tags:** `tag1`, `tag2`
**Spec Refs:** `spec-id`

### Context
...

### Decisions
1. [PENDING] Decision
   - **Rationale:** ...
   - **Impact:** High/Medium/Low

### Follow-up Actions
- [ ] Task

---
```

### Status Values

- `pending`, `in-progress`, `blocked` → Never archived
- `completed`, `resolved`, `cancelled`, `superseded` → Archivable

### Commands

- `/forge-archive-decisions` - Archive old completed decisions
- `/forge-archive-decisions --dry-run` - Preview archiviation
- `/forge-validate-decisions` - Check entry format
- `/forge-validate-decisions --fix` - Auto-fix issues
- `/forge-adr --from-decision DEC-YYYY-NNN` - Promote to ADR
