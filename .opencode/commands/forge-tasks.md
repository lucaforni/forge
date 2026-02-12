---
description: "Generate dependency-ordered task breakdown from a spec and plan"
agent: forge-scrum
subtask: true
---

# Task Breakdown

You are handling `/forge-tasks` to generate a structured, dependency-ordered
task breakdown for a Feature, Epic, or Product track workflow.

## Arguments

Optional spec path or ID: $ARGUMENTS

If no argument is provided, find the most recently modified spec in
`.forge/specs/` that has a `plan.md` but no `tasks.md`.

## Context Loading

Read the following:

1. `.forge/specs/NNN-slug/spec.md` -- the specification (REQUIRED)
2. `.forge/specs/NNN-slug/plan.md` -- the technical plan (REQUIRED)
3. `.forge/constitution.md` -- for testing and quality requirements

If either spec or plan is missing, stop and tell the user which command
to run first (`/forge-specify` or `/forge-plan`).

## Task Generation Process

### Step 1: Extract Work Items

From the plan, extract all implementation work:
1. Data model changes (migrations, schema updates).
2. New files to create (with purpose from file map).
3. Existing files to modify.
4. API endpoints to implement.
5. Tests to write.
6. Configuration changes.

### Step 2: Dependency Analysis

For each work item:
1. Identify what it depends on (must be done first).
2. Identify what depends on it (must come after).
3. Build a dependency graph.

### Step 3: Phase Ordering

Group tasks into ordered phases:
1. **Phase 1: Foundation** -- Schema, configuration, shared types.
2. **Phase 2: Core Implementation** -- Main business logic, models, services.
3. **Phase 3: API/Interface Layer** -- Endpoints, controllers, UI components.
4. **Phase 4: Integration** -- Wire components together, middleware.
5. **Phase 5: Testing** -- Unit tests, integration tests.
6. **Phase 6: Polish** -- Error handling, logging, documentation.

Not all phases are needed for every feature. Omit empty phases.

### Step 4: Parallelism Marking

Within each phase, identify tasks that can be done in parallel:
- Mark with `[P]` prefix.
- Tasks without dependencies on each other within a phase are parallel.

### Step 5: Traceability Tags

Tag each task with the requirement(s) it implements:
- `[FR-001]` for functional requirements.
- `[NFR-001]` for non-functional requirements.
- Tasks may map to multiple requirements.

### Step 6: Effort Estimation

For each task, provide a rough size:
- `[S]` Small: < 30 minutes
- `[M]` Medium: 30 min - 2 hours
- `[L]` Large: 2-4 hours
- `[XL]` Extra Large: 4+ hours (consider splitting)

### Step 7: Tasks Authoring

Read the template from `.opencode/templates/tasks.md` and create the task
list at `.forge/specs/NNN-slug/tasks.md`.

Format each task as a checkbox:

```markdown
## Phase 1: Foundation

- [ ] `[S]` `[FR-001]` Create database migration for users table
- [ ] `[M]` `[FR-001]` Define User entity type and validation schema

## Phase 2: Core Implementation

- [ ] `[M]` `[FR-002]` `[P]` Implement user registration service
- [ ] `[M]` `[FR-003]` `[P]` Implement user login service
- [ ] `[L]` `[FR-004]` Implement password reset flow (depends on email service)
```

### Step 8: Summary

Present a task summary:

```
Task Breakdown Summary
======================
Spec: NNN-slug
Total tasks: NN
By phase: Phase 1 (N) | Phase 2 (N) | Phase 3 (N) | ...
By size:  S (N) | M (N) | L (N) | XL (N)
Parallel tasks: N (tasks marked [P])
Requirement coverage: N/N FRs covered, N/N NFRs covered

Estimated total effort: N-N hours
```

Recommend next steps:
- `/forge-implement` to begin implementation
- `/forge-sprint` if this is part of an Epic (story-level breakdown needed)
