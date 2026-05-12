---
description: "Generate dependency-ordered task breakdown from a spec and plan"
agent: forge-scrum
subtask: true
---

# Task Breakdown

Generate ordered tasks for Feature/Epic/Product workflows.

## Arguments

`$ARGUMENTS` — spec ID/path, or empty (most recently modified spec with `plan.md` but no `tasks.md`).

## Context Loading

1. `.forge/specs/NNN-slug/spec.md` (REQUIRED)
2. `.forge/specs/NNN-slug/plan.md` (REQUIRED)
3. `.forge/constitution.md`

If spec or plan missing, stop and direct user to `/forge-specify` or `/forge-plan`.

## Process

### 1. Extract Work Items
Data model changes, files to create/modify, API endpoints, tests, configuration.

### 2. Dependency Analysis
For each item, identify upstream deps and downstream consumers. Build a graph.

### 3. Phase Ordering

| Phase | Content |
|---|---|
| 1. Foundation | Schema, config, shared types |
| 2. Core | Business logic, models, services |
| 3. Interface | Endpoints, controllers, UI |
| 4. Integration | Wiring, middleware |
| 5. Testing | Unit, integration |
| 6. Polish | Errors, logging, docs |

Omit empty phases.

### 4. Parallelism
Mark `[P]` for tasks with no intra-phase dependencies.

### 5. Traceability Tags
`[FR-001]`, `[NFR-001]` — tasks may map to multiple requirements.

### 6. Effort Sizing
- `[S]` <30min · `[M]` 30min–2h · `[L]` 2–4h · `[XL]` 4h+ (consider splitting)

### 7. Authoring

Use `.opencode/templates/tasks.md`. Write to `.forge/specs/NNN-slug/tasks.md`.

```markdown
## Phase 1: Foundation
- [ ] `[S]` `[FR-001]` Create database migration for users table
- [ ] `[M]` `[FR-001]` Define User entity type and validation schema

## Phase 2: Core Implementation
- [ ] `[M]` `[FR-002]` `[P]` Implement user registration service
- [ ] `[M]` `[FR-003]` `[P]` Implement user login service
- [ ] `[L]` `[FR-004]` Implement password reset (depends on email service)
```

### 8. Summary

```
Task Breakdown Summary
======================
Spec: NNN-slug
Total tasks: NN
By phase: P1 (N) | P2 (N) | P3 (N) | ...
By size:  S (N) | M (N) | L (N) | XL (N)
Parallel tasks: N
Requirement coverage: N/N FRs, N/N NFRs
Estimated total effort: N-N hours
```

Next: `/forge-implement` or `/forge-sprint` (Epic story-level breakdown).
