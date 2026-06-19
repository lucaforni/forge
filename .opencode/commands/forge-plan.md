---
description: 'Create a technical implementation plan for a feature spec'
agent: forge-architect
subtask: true
---

# Technical Plan

Handle `/forge-plan` to create a technical implementation plan for Feature/Epic/Product tracks.

## Arguments

Optional spec path or ID: $ARGUMENTS. If none, find the most recently modified spec in `.forge/specs/` without a `plan.md`.

## Context Loading

1. `.forge/constitution.md` (REQUIRED)
2. `.forge/specs/NNN-slug/spec.md` (REQUIRED)
3. `.forge/architecture/architecture.md` (if exists)
4. `.forge/knowledge/adr/` — scan relevant ADRs
5. `.forge/knowledge/decision-log.md`
6. `.forge/specs/NNN-slug/design-spec.md` — Wireframes + Components sections (~150 lines, if exists)
7. `.forge/specs/NNN-slug/user-journey.md` — happy paths + key edge cases (~100 lines, if exists)

If spec missing: stop and tell user to run `/forge-specify` first.

## Planning Process

### Step 1: Requirements Analysis

Extract from spec: FRs, NFRs with targets, acceptance criteria, edge/error scenarios.

### Step 2: Data Model

New tables/collections (full schema); modified tables (columns, indexes); migration strategy; validation rules.

### Step 3: API Design

Endpoint contracts (method, path, request/response); auth/authz per endpoint; error formats; rate limiting.

### Step 4: Component Design

New classes/modules + responsibilities; key methods (signatures + behavior); integration points; design patterns.

### Step 5: File Map

New files (purpose); existing files to modify (changes); test files to create.

### Step 6: Dependencies

New packages (version constraints); internal module deps; external service deps; config changes.

### Step 7: Testing Strategy

Unit scope (what to test/mock); integration scope; test data; coverage targets per requirement.

### Step 8: Requirement Traceability

Map each FR/NFR → plan section → files → test files.

### Step 9: Constitution Compliance

Load `constitution-compliance` skill. Verify: tech choices, patterns, testing approach.

### Step 10: Plan Authoring

Read template from `.opencode/templates/plan.md`. Write to `.forge/specs/NNN-slug/plan.md`.

### Step 11: Summary

Report: # new files, # modified, # new deps, # endpoints, FR coverage, constitution status.

Next: `/forge-analyze` (validate); `/forge-tasks` (breakdown).
