---
description: "Create a feature specification with requirements, user stories, and acceptance criteria"
agent: forge-pm
subtask: true
---

# Feature Specification

Create a feature spec for Feature/Epic/Product workflows.

## Arguments

`$ARGUMENTS` — feature description.

## Context Loading

Read if present:
1. `.forge/constitution.md`
2. `.forge/architecture/architecture.md`
3. `.forge/product/prd.md` (Epic/Product)
4. `.forge/knowledge/decision-log.md`
5. `.forge/knowledge/adr/` — scan for relevant ADRs

## Process

### 1. Requirements Discovery

Use the `question` tool conversationally (NOT all at once):
- Feature goal and user benefit
- Target personas
- Functional requirements
- NFRs (perf, security, accessibility)
- Edge cases and errors

### 2. Advanced Elicitation (Optional)

Load `advanced-elicitation` skill; suggest 3 techniques:
Pre-mortem · First Principles · Red Team/Blue Team · Socratic · Constraint Removal · Inversion.

### 3. Spec Number

Scan `.forge/specs/`, take max NNN+1 (3 digits). Confirm slug with user. Create `.forge/specs/NNN-slug/`.

### 4. Authoring

Use `.opencode/templates/spec.md`. Write to `.forge/specs/NNN-slug/spec.md`. Fill:
- Overview/objectives
- User stories (As a / I want / So that) + Given/When/Then ACs
- FRs with unique IDs (FR-001…)
- NFRs with measurable targets
- Edge cases, error handling
- Data/API requirements (if applicable)
- Open questions: `[NEEDS CLARIFICATION]`
- Constitution compliance
- Cross-refs to upstream docs

### 5. Validation

- Every user story has ACs
- Every FR has a unique ID
- NFRs measurable
- Count `[NEEDS CLARIFICATION]` markers

### 6. Summary & Next Steps

Report: stories, FRs, NFRs, open questions, constitution status.

Next:
- `[NEEDS CLARIFICATION]` present → `/forge-clarify`
- UI/user-facing → `/forge-ux` (personas, journeys, wireframes, a11y) before planning
- No UI, spec complete → `/forge-plan`
