---
description: "Cross-validate consistency between specs, plans, architecture, and constitution"
agent: forge-reviewer
subtask: true
model: github-copilot/claude-opus-4.6
---

# Cross-Artifact Validation

You are handling `/forge-analyze` to validate consistency across FORGE
artifacts. This is a read-only analysis -- you do NOT modify any files.

## Arguments

Optional spec path, ID, or scope: $ARGUMENTS

- If a spec ID or path is provided, analyze that specific spec and its chain.
- If `all` is provided, analyze all specs.
- If no argument, analyze the most recently modified spec chain.

## Context Loading

For the target spec chain, read ALL of the following:

1. `.forge/constitution.md` -- governance constraints
2. `.forge/specs/NNN-slug/spec.md` -- the specification
3. `.forge/specs/NNN-slug/plan.md` -- the technical plan
4. `.forge/specs/NNN-slug/tasks.md` -- the task breakdown (if exists)
5. `.forge/architecture/architecture.md` -- system architecture (if exists)
6. `.forge/product/prd.md` -- product requirements (if exists)
7. `.forge/knowledge/adr/` -- relevant ADRs

## Validation Dimensions

### Dimension 1: Spec Completeness

Check the spec for:
- [ ] All user stories have acceptance criteria
- [ ] All FRs have unique IDs
- [ ] All NFRs have measurable targets
- [ ] No remaining `[NEEDS CLARIFICATION]` markers
- [ ] Constitution compliance section is filled
- [ ] Cross-references to upstream documents exist

### Dimension 2: Spec-Plan Consistency

If a plan exists, verify:
- [ ] Every FR in the spec is addressed in the plan
- [ ] Every NFR in the spec has a corresponding design element
- [ ] Plan does not introduce requirements not in the spec
- [ ] Data model supports all spec requirements
- [ ] API design covers all functional requirements
- [ ] File map accounts for all planned changes

### Dimension 3: Plan-Architecture Consistency

If architecture exists, verify:
- [ ] Plan patterns match architecture patterns
- [ ] Plan data model is consistent with architecture data model
- [ ] Plan API style matches architecture API decisions
- [ ] Plan does not violate any ADR decisions
- [ ] Plan technology choices align with architecture

### Dimension 4: Constitution Compliance

Load the `constitution-compliance` skill and verify:
- [ ] Technology choices comply with Article 2
- [ ] Architecture patterns comply with Article 3
- [ ] Quality standards meet Article 4
- [ ] Security requirements meet Article 5
- [ ] Naming conventions follow Article 7
- [ ] Testing approach meets Article 8

### Dimension 5: Traceability

Check requirement traceability:
- [ ] Every FR maps to at least one plan section
- [ ] Every FR maps to at least one planned file
- [ ] Every FR maps to at least one planned test
- [ ] No orphaned plan sections (plan work without a requirement)

## Output Format

Present findings as a structured report:

```
FORGE Analysis Report
=====================
Spec: NNN-slug
Date: YYYY-MM-DD

Overall Status: [PASS / WARN / FAIL]

Dimension 1: Spec Completeness         [PASS/WARN/FAIL]
  - [finding details]

Dimension 2: Spec-Plan Consistency     [PASS/WARN/FAIL]
  - [finding details]

Dimension 3: Plan-Architecture         [PASS/WARN/FAIL]
  - [finding details]

Dimension 4: Constitution Compliance   [PASS/WARN/FAIL]
  - [finding details]

Dimension 5: Traceability              [PASS/WARN/FAIL]
  - [finding details]

Issues Found: N
  [CRITICAL] description (file:line if applicable)
  [WARNING]  description (file:line if applicable)
  [INFO]     description

Recommended Actions:
  1. ...
  2. ...
```

## Recommendations

Based on findings, suggest:
- `/forge-clarify` if spec has ambiguities
- `/forge-plan` if plan is missing or inconsistent
- `/forge-architecture` if architecture gaps found
- `/forge-specify` if requirements need updating
