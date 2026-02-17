# Decision Log

> This file captures session-level decisions made during development. FORGE
> agents automatically append entries when making architectural or design
> decisions. Important decisions should be promoted to formal ADRs in
> `.forge/knowledge/adr/`.
>
> **Format**: Each entry must include required fields (Status, date) for proper
> archiviation. Use the template: `.opencode/templates/decision-log-entry-template.md`
>
> **Maintenance**: Runs automatically when threshold exceeded (500 lines by default).
> Run `/forge-archive-decisions` manually or configure in `.forge/config.yml`.

---

## Quick Reference

### Required Entry Format

```markdown
## YYYY-MM-DD | Session: Name

**Status:** `pending` | `in-progress` | `blocked` | `completed` | `resolved` | `cancelled` | `superseded`
**Tags:** `tag1`, `tag2`
**Spec Refs:** `spec-id`

### Context
Brief background...

### Decisions
1. [STATUS] Decision title
   - **Rationale:** Why
   - **Impact:** High/Medium/Low

---
```

### Status Values

- **Never archived:** `pending`, `in-progress`, `blocked`
- **Can archive:** `completed`, `resolved`, `cancelled`, `superseded` (with retention rules)

### Commands

- `/forge-archive-decisions` - Archive old completed decisions
- `/forge-validate-decisions` - Check entry format
- See: `.opencode/docs/knowledge-management.md` for complete guide

---

<!-- Decision entries will be appended below this line by FORGE agents -->

