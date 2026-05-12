# Decision Log Entry Template

> Copy this template when adding new entries to `.forge/knowledge/decision-log.md`.

---

## YYYY-MM-DD | Session: [Session Name/Context]

**Status:** `pending` | `in-progress` | `blocked` | `completed` | `resolved` | `cancelled` | `superseded`
**Tags:** `tag1`, `tag2`, `tag3`
**Spec Refs:** `spec-id-1`, `spec-id-2` _(optional)_
**Decision ID:** `DEC-YYYY-NNN` _(auto-generated if omitted)_

### Context

What prompted this session, current state/constraints, stakeholders involved.

### Decisions

1. **[STATUS]** Decision title or summary
   - **Rationale:** Why
   - **Impact:** High | Medium | Low
   - **Alternatives considered:**
     - Option A: Pros/cons
     - Option B: Pros/cons
   - **Trade-offs:** What we're accepting/sacrificing
   - **Follow-up:** Next steps or monitoring

2. **[STATUS]** Another decision
   - **Rationale:** ...
   - **Impact:** ...

### Follow-up Actions

- [ ] Action item 1 (assigned: @person)
- [ ] Action item 2 (deadline: YYYY-MM-DD)
- [x] Completed action item

### References

- Related ADR: [ADR-001](../adr/ADR-001-example.md)
- Related spec: [042-auth-system](../../042-auth-system/spec.md)
- External: [Link](https://example.com)

---

## Field Reference

### Status (REQUIRED)

Overall status of the **entire session entry**:

| Value | When to Use |
|---|---|
| `pending` | Decisions await input, not finalized |
| `in-progress` | Decisions made, implementation underway |
| `blocked` | Cannot proceed (external dependency) |
| `completed` | Finalized and implemented |
| `resolved` | Issue resolved, entry can close |
| `cancelled` | Abandoned, no longer relevant |
| `superseded` | Replaced by newer entry (link it) |

**`pending`, `in-progress`, `blocked` are never archived.**

### Decision Status Markers (inline)

Per-decision prefix: `[PENDING]` · `[IN-PROGRESS]` · `[COMPLETED]` · `[BLOCKED]` · `[CANCELLED]`.

### Tags (recommended)

Comma-separated. Common:
- **Domain:** `architecture`, `security`, `performance`, `ux`, `api`, `database`
- **Priority:** `critical`, `high-priority`, `low-priority`
- **Type:** `technical-debt`, `refactoring`, `new-feature`, `bug-fix`
- **Special:** `constitutional`, `breaking-change`, `security-critical`

**Critical tags (never archived):** `critical`, `constitutional`, `breaking-change`, `security-critical`.

### Spec Refs

Spec IDs (no path) — e.g., `042-auth-system`. Entries referenced by **active specs** are preserved during archival.

### Decision ID

Format `DEC-YYYY-NNN`. Auto-generated if omitted. Useful for cross-referencing from ADRs/code/specs.

---

## Example: Pending Architectural Decision

```markdown
## 2026-02-17 | Session: Database Selection for Analytics

**Status:** `pending`
**Tags:** `architecture`, `database`, `high-priority`
**Spec Refs:** `078-analytics-engine`
**Decision ID:** `DEC-2026-078`

### Context

Choose a database for analytics engine. Requirements:
- 100M+ events/day · sub-second dashboard latency
- Complex aggregations · budget $5k/month

### Decisions

1. **[PENDING]** Primary database choice
   - **Alternatives:**
     - **TimescaleDB:** PostgreSQL-compatible, time-series. Cons: scaling complexity
     - **ClickHouse:** Extreme analytics perf. Cons: steep learning curve
     - **BigQuery:** Managed, auto-scaling. Cons: cost unpredictable
   - **Blocked by:** benchmarks from engineering
   - **Need input from:** @john (data eng), @sarah (SRE)

### Follow-up Actions

- [ ] @john: Run benchmarks (by 2026-02-24)
- [ ] @sarah: Estimate operational costs
- [ ] Schedule decision meeting (2026-02-25)

---
```

## Example: Completed Decision

```markdown
## 2026-02-15 | Session: API Rate Limiting

**Status:** `completed`
**Tags:** `api`, `security`, `performance`
**Spec Refs:** `062-api-v2`

### Decisions

1. **[COMPLETED]** Token bucket algorithm
   - **Rationale:** Allows bursts; better UX than fixed window
   - **Impact:** Medium

2. **[COMPLETED]** Tier-based limits
   - Free: 100/min, 10k/day · Pro: 1k/min, 100k/day · Enterprise: custom

3. **[COMPLETED]** Redis for distributed rate limiting
   - **Rationale:** Already in stack, atomic ops

### Follow-up Actions
- [x] Implemented in api-gateway (PR #234)
- [x] Monitoring dashboard added
- [x] API docs updated
```

---

## Tips

### Do
- Update status as circumstances change
- Add spec refs for traceability
- Document alternatives considered
- Include rationale (future you will forget)
- Tag critical decisions
- Mark blocked decisions with dependencies
- Add follow-ups with owners/deadlines

### Don't
- Leave `pending` forever (review/update/cancel)
- Skip Context section
- Forget to update status post-implementation
- Write novel-length entries (link to ADR)
- Reopen old decisions (create new entry with `superseded`)

---

## Promote to ADR When

- Defines patterns used across features
- Has constitutional implications
- Significant trade-offs needing detailed justification
- Referenced by 3+ specs/modules
- "Decision of record" — should be immutable

Use `/forge-adr` to formalize.
