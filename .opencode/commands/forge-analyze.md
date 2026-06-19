---
description: "Cross-validate consistency between specs, plans, architecture, and constitution"
agent: forge-reviewer
subtask: true
---

# Cross-Artifact Validation

Read-only consistency check across FORGE artifacts. Modifies no files.

## Arguments

`$ARGUMENTS` — spec ID/path, `all`, or empty (most recently modified spec chain).

## Context Loading

Read for the target chain:

1. `.forge/constitution.md`
2. `.forge/specs/NNN-slug/spec.md`
3. `.forge/specs/NNN-slug/plan.md`
4. `.forge/specs/NNN-slug/tasks.md` (if exists)
5. `.forge/architecture/architecture.md` (if exists)
6. `.forge/product/prd.md` (if exists)
7. `.forge/knowledge/adr/` (relevant ADRs)

## Validation Dimensions

### 1. Spec Completeness
- All user stories have acceptance criteria
- All FRs have unique IDs
- All NFRs have measurable targets
- No remaining `[NEEDS CLARIFICATION]` markers
- Constitution compliance section filled
- Cross-references to upstream documents exist

### 2. Spec-Plan Consistency
- Every FR addressed in the plan
- Every NFR has a corresponding design element
- Plan introduces no requirements absent from the spec
- Data model supports all spec requirements
- API design covers all FRs
- File map accounts for all planned changes

### 3. Plan-Architecture Consistency
- Plan patterns match architecture patterns
- Data model consistent with architecture
- API style matches architecture decisions
- No ADR violations
- Technology choices align

### 4. Constitution Compliance

Load `constitution-compliance` skill and verify:
- Article 2 (Technology), 3 (Architecture), 4 (Quality), 5 (Security), 7 (Naming), 8 (Testing)

### 5. Traceability
- Every FR → plan section, planned file, planned test
- No orphaned plan sections

## Output Format

```
FORGE Analysis Report
=====================
Spec: NNN-slug
Date: YYYY-MM-DD
Overall Status: [PASS / WARN / FAIL]

Dimension 1: Spec Completeness         [PASS/WARN/FAIL]
Dimension 2: Spec-Plan Consistency     [PASS/WARN/FAIL]
Dimension 3: Plan-Architecture         [PASS/WARN/FAIL]
Dimension 4: Constitution Compliance   [PASS/WARN/FAIL]
Dimension 5: Traceability              [PASS/WARN/FAIL]

Issues Found: N
  [CRITICAL] description (file:line)
  [WARNING]  description (file:line)
  [INFO]     description

Recommended Actions:
  1. ...
```

## Recommendations

- `/forge-clarify` — spec has ambiguities
- `/forge-ux` — UX/UI requirements missing for user-facing features
- `/forge-plan` — plan missing or inconsistent
- `/forge-architecture` — architecture gaps
- `/forge-specify` — requirements need updating
