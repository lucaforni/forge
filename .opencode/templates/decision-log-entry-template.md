# Decision Log Entry Template

> Copy this template when adding new entries to `.forge/knowledge/decision-log.md`

---

## YYYY-MM-DD | Session: [Session Name/Context]

**Status:** `pending` | `in-progress` | `blocked` | `completed` | `resolved` | `cancelled` | `superseded`
**Tags:** `tag1`, `tag2`, `tag3`
**Spec Refs:** `spec-id-1`, `spec-id-2` _(optional)_
**Decision ID:** `DEC-YYYY-NNN` _(auto-generated if omitted)_

### Context

Brief description of the situation, problem, or question that led to these
decisions. Include:
- What prompted this session (feature request, bug, technical debt, etc.)
- Current state/constraints
- Key stakeholders or team members involved

### Decisions

1. **[STATUS]** Decision title or summary
   - **Rationale:** Why this decision was made
   - **Impact:** High | Medium | Low
   - **Alternatives considered:**
     - Option A: Pros/cons
     - Option B: Pros/cons
   - **Trade-offs:** What we're accepting/sacrificing
   - **Follow-up:** Next steps or monitoring needed

2. **[STATUS]** Another decision
   - **Rationale:** ...
   - **Impact:** ...

### Follow-up Actions

- [ ] Action item 1 (assigned to: @person)
- [ ] Action item 2 (deadline: YYYY-MM-DD)
- [x] Completed action item

### References

- Related ADR: [ADR-001](../adr/ADR-001-example.md)
- Related spec: [042-auth-system](../../042-auth-system/spec.md)
- External docs: [Link](https://example.com)

---

<!-- End of entry template -->
---

## Field Descriptions

### Status (REQUIRED)

The overall status of the **entire session entry**. Choose one:

| Value | When to Use |
|-------|-------------|
| `pending` | Decisions await input, not yet finalized |
| `in-progress` | Decisions made, implementation underway |
| `blocked` | Cannot proceed due to external dependency |
| `completed` | All decisions finalized and implemented |
| `resolved` | Issue resolved, entry can be closed |
| `cancelled` | Decisions abandoned, no longer relevant |
| `superseded` | Replaced by a newer decision (link to new entry) |

**Important:** Entries with `pending`, `in-progress`, or `blocked` status are
**never archived**, even if old.

### Decision Status Markers (inline)

Within the "Decisions" section, prefix each decision with `[STATUS]`:

- `[PENDING]` - Decision not yet made
- `[IN-PROGRESS]` - Decision being implemented
- `[COMPLETED]` - Decision finalized
- `[BLOCKED]` - Waiting on dependency
- `[CANCELLED]` - Decision abandoned

This allows tracking individual decisions within a session.

### Tags (OPTIONAL but recommended)

Comma-separated keywords for filtering and search. Common tags:

- **Domain:** `architecture`, `security`, `performance`, `ux`, `api`, `database`
- **Priority:** `critical`, `high-priority`, `low-priority`
- **Type:** `technical-debt`, `refactoring`, `new-feature`, `bug-fix`
- **Special:** `constitutional`, `breaking-change`, `security-critical`

**Critical tags** (never archived):
- `critical`
- `constitutional`
- `breaking-change`
- `security-critical`

### Spec Refs (OPTIONAL)

Reference related specs by ID (without path):
- `042-auth-system`
- `055-payment-integration`

Used for traceability. Entries referenced by **active specs** are preserved
during archiviation.

### Decision ID (OPTIONAL)

Unique identifier for this decision session. Format: `DEC-YYYY-NNN`

If omitted, the decision archiver can auto-generate based on date and sequence.
Useful for cross-referencing from ADRs, code comments, or other specs.

---

## Usage Examples

### Example 1: Pending Architectural Decision

```markdown
## 2026-02-17 | Session: Database Selection for Analytics

**Status:** `pending`
**Tags:** `architecture`, `database`, `high-priority`
**Spec Refs:** `078-analytics-engine`
**Decision ID:** `DEC-2026-078`

### Context

Need to choose a database for the new analytics engine. Requirements:
- Handle 100M+ events/day
- Sub-second query latency for dashboards
- Support complex aggregations
- Budget: $5k/month max

### Decisions

1. **[PENDING]** Primary database choice
   - **Alternatives considered:**
     - **TimescaleDB:** Pros: PostgreSQL compatibility, time-series optimized. Cons: Scaling complexity
     - **ClickHouse:** Pros: Extreme performance for analytics. Cons: Steep learning curve
     - **BigQuery:** Pros: Managed, scales automatically. Cons: Cost unpredictable at scale
   - **Blocked by:** Need performance benchmarks from engineering team
   - **Need input from:** @john (data eng), @sarah (SRE)

### Follow-up Actions

- [ ] @john: Run benchmark suite against all 3 options (by 2026-02-24)
- [ ] @sarah: Estimate operational costs for each option
- [ ] Schedule decision meeting (2026-02-25)

---
```

### Example 2: Completed Implementation Decision

```markdown
## 2026-02-15 | Session: API Rate Limiting Implementation

**Status:** `completed`
**Tags:** `api`, `security`, `performance`
**Spec Refs:** `062-api-v2`
**Decision ID:** `DEC-2026-062`

### Context

Implementing rate limiting for the public API (spec 062). Need to decide on
strategy and thresholds to prevent abuse while maintaining good UX.

### Decisions

1. **[COMPLETED]** Rate limiting strategy: Token bucket algorithm
   - **Rationale:** Allows bursts while maintaining average rate, better UX than fixed window
   - **Impact:** Medium
   - **Alternatives considered:**
     - Fixed window: Too rigid, poor UX for legitimate burst traffic
     - Leaky bucket: More complex, no significant benefit
   - **Trade-offs:** Slightly more complex to implement than fixed window

2. **[COMPLETED]** Rate limits by tier
   - **Free tier:** 100 req/minute, 10,000 req/day
   - **Pro tier:** 1,000 req/minute, 100,000 req/day
   - **Enterprise:** Custom limits
   - **Rationale:** Based on usage analysis, covers 95% of legitimate use without burden
   - **Impact:** Low (most users won't notice)

3. **[COMPLETED]** Use Redis for distributed rate limiting
   - **Rationale:** Already in our stack, atomic operations, fast
   - **Impact:** Low (no new dependencies)

### Follow-up Actions

- [x] Implemented in api-gateway service (PR #234)
- [x] Added monitoring dashboard
- [x] Updated API docs

### References

- Implementation: PR #234
- Monitoring: Grafana dashboard "API Rate Limits"
- Docs: https://docs.example.com/api/rate-limits

---
```

### Example 3: Blocked Decision

```markdown
## 2026-02-10 | Session: SSO Integration Architecture

**Status:** `blocked`
**Tags:** `architecture`, `security`, `auth`, `critical`
**Spec Refs:** `042-auth-system`
**Decision ID:** `DEC-2026-042-SSO`

### Context

Designing SSO integration for enterprise customers. Blocked on finalization of
the Auth0 vs custom IdP decision (DEC-2026-042).

### Decisions

1. **[BLOCKED]** SSO protocol choice (SAML vs OAuth2/OIDC)
   - **Blocked by:** DEC-2026-042 (IdP selection)
   - **Rationale for blocking:** Protocol choice depends on IdP capabilities

2. **[IN-PROGRESS]** User provisioning strategy (decided independently)
   - **Decision:** Just-in-time provisioning with lazy account creation
   - **Rationale:** Simplifies onboarding, no need for pre-provisioning
   - **Impact:** Medium

### Follow-up Actions

- [ ] Wait for DEC-2026-042 resolution
- [ ] Draft SAML and OIDC implementation specs (parallel work)
- [x] Document provisioning flow

---
```

---

## Tips for Good Decision Log Entries

### Do ✅

- **Update status** when circumstances change (pending → in-progress → completed)
- **Add spec refs** to maintain traceability
- **Document alternatives** that were considered (avoid rehashing old debates)
- **Include rationale** (future you will forget why this was decided)
- **Tag critical decisions** to prevent premature archiviation
- **Mark blocked decisions** clearly with dependencies
- **Add follow-up actions** with owners and deadlines

### Don't ❌

- Don't leave status as `pending` forever (review and update or cancel)
- Don't skip the Context section (future readers need background)
- Don't forget to update status when implementation completes
- Don't write novel-length entries (keep it scannable, link to detailed ADRs)
- Don't reopen old decisions (create a new entry and reference the old one with `superseded`)

---

## When to Promote to ADR

Consider promoting a decision log entry to a formal ADR if:
- It defines architectural patterns used across multiple features
- It has constitutional implications
- It involves significant trade-offs that need detailed justification
- It's referenced by 3+ specs or modules
- It's a "decision of record" that should be immutable

Use: `/forge-adr` to create formal ADRs from decision log entries.
