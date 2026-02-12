---
description: "Create a technical implementation plan for a feature spec"
agent: forge-architect
subtask: true
model: github-copilot/claude-opus-4.6
---

# Technical Plan

You are handling `/forge-plan` to create a detailed technical implementation
plan for a Feature, Epic, or Product track workflow.

## Arguments

Optional spec path or ID: $ARGUMENTS

If no argument is provided, find the most recently modified spec in
`.forge/specs/` that does not yet have a `plan.md`.

## Context Loading

Before starting, read the following upstream documents:

1. `.forge/constitution.md` -- governance constraints (REQUIRED)
2. The target spec: `.forge/specs/NNN-slug/spec.md` (REQUIRED)
3. `.forge/architecture/architecture.md` -- system architecture (if exists)
4. `.forge/knowledge/adr/` -- scan for relevant ADRs
5. `.forge/knowledge/decision-log.md` -- prior decisions

If the spec does not exist, stop and tell the user to run `/forge-specify`
first.

## Planning Process

### Step 1: Requirements Analysis

Review the spec and extract:
1. All functional requirements (FR-NNN) to be addressed.
2. All non-functional requirements with their targets.
3. All acceptance criteria from user stories.
4. All edge cases and error scenarios.

### Step 2: Data Model Design

Design the data layer for this feature:
1. New database tables/collections with full schema.
2. Modified existing tables (columns added, indexes needed).
3. Migration strategy.
4. Data validation rules.

### Step 3: API Design

Design the API endpoints:
1. Full endpoint contracts (method, path, request/response bodies).
2. Authentication/authorization requirements per endpoint.
3. Error response formats.
4. Rate limiting considerations.

### Step 4: Component Design

Design the implementation:
1. New classes/modules with responsibilities.
2. Key methods with signatures and behavior descriptions.
3. Integration points with existing code.
4. Design patterns to apply.

### Step 5: File Map

Create a complete file map showing:
1. New files to create (with purpose).
2. Existing files to modify (with description of changes).
3. Test files to create.

### Step 6: Dependencies

Identify:
1. New npm/pip packages needed (with version constraints).
2. Internal module dependencies.
3. External service dependencies.
4. Configuration changes needed.

### Step 7: Testing Strategy

Define the testing approach:
1. Unit test scope (what to test, what to mock).
2. Integration test scope.
3. Test data requirements.
4. Coverage targets per requirement.

### Step 8: Requirement Traceability

Create a traceability table mapping each FR/NFR to:
- Plan section where it is addressed.
- Files where it will be implemented.
- Test files where it will be verified.

### Step 9: Constitution Compliance

Load the `constitution-compliance` skill and verify:
- Technical choices comply with the constitution.
- Patterns match prescribed architecture.
- Testing approach meets standards.

### Step 10: Plan Authoring

Read the template from `.opencode/templates/plan.md` and create the plan
at `.forge/specs/NNN-slug/plan.md`.

### Step 11: Summary and Next Steps

Present a plan summary:
- Number of new files
- Number of modified files
- Number of new dependencies
- Number of API endpoints
- Requirement coverage (FRs addressed / total FRs)
- Constitution compliance status

Recommend next steps:
- `/forge-analyze` to validate plan against spec and architecture
- `/forge-tasks` to generate task breakdown from the plan
