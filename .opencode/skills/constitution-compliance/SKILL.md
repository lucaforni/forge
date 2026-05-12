---
name: constitution-compliance
description: Verify decisions, architecture, and code against the project constitution article by article with structured compliance reporting
license: MIT
compatibility: opencode
metadata:
  audience: forge-architect forge-reviewer
  workflow: forge
---

## Purpose

Verify compliance against `.forge/constitution.md`. Read the constitution first,
then check the target artifact (spec, plan, architecture, code, ADR) against
each relevant article.

## Process

### Step 1: Load Constitution

Read `.forge/constitution.md` in full. If missing or still contains
`<!-- CUSTOMIZE -->` placeholders, note it and skip uncustomized articles.

### Step 2: Identify Relevant Articles

| Artifact     | Relevant Articles                            |
| ------------ | -------------------------------------------- |
| Spec / PRD   | 1, 4, 5 (if security mentioned)              |
| Architecture | 1, 2, 3, 4, 5, 9                             |
| Plan         | 2, 3, 4, 5, 6, 7, 8                          |
| Code / PR    | 2, 3, 4, 5, 6, 7, 8                          |
| ADR          | 1, 2, 3                                      |
| Test code    | 7, 8                                         |

### Step 3: Article-by-Article Verification

- **Art. 1 — Core Principles**: alignment with mission and values.
- **Art. 2 — Technology Stack**: prescribed stack used, versions in range; new tech requires an ADR.
- **Art. 3 — Architecture Patterns**: prescribed patterns followed, module boundaries respected, integration/data flow consistent.
- **Art. 4 — Quality Standards**: perf/reliability targets met, code quality (function length, complexity), adequate docs.
- **Art. 5 — Security**: input validation, authn/authz correctness, sensitive data handling, security headers/configs.
- **Art. 6 — Error Handling**: prescribed pattern followed, correct error types, consistent logging, appropriate user-facing messages.
- **Art. 7 — Naming & Conventions**: file/class/function/variable names, import ordering, constants format.
- **Art. 8 — Testing Standards**: required test types present, coverage thresholds met, naming, critical paths tested.
- **Art. 9 — Operational Requirements**: logging, monitoring/observability, deployment constraints, performance.

### Step 4: Handle Tensions

When an artifact conflicts with multiple articles: identify conflicts, assess
priority for the context, document the tension, recommend resolution. If
unresolved, flag for human decision.

### Step 5: Apply Amendments

Check the Amendments Log; use amended rules where present and note which
amendments were applied.

## Compliance Report Format

```markdown
## Constitution Compliance Report

**Target**: [artifact name and type]
**Date**: YYYY-MM-DD
**Constitution version**: [date of last amendment or "original"]

### Overall Status: [COMPLIANT / PARTIAL / NON-COMPLIANT]

### Article-by-Article Results

| Article | Title             | Status    | Notes                  |
| ------- | ----------------- | --------- | ---------------------- |
| 1       | Core Principles   | COMPLIANT | Aligns with principles |
| 2       | Technology Stack  | COMPLIANT | Uses prescribed stack  |
| 3       | Architecture      | PARTIAL   | See finding below      |
| ...     | ...               | ...       | ...                    |

### Findings

**[PARTIAL] Article 3 — Architecture Patterns**
The plan introduces an event-driven pattern for notifications not covered in
the architecture document.
- **Impact**: Medium — establishes a new pattern.
- **Recommendation**: Create an ADR and update architecture.md.

### Tensions
[Identified tensions between articles]

### Amendments Applied
[Amendments that affected the evaluation]
```

## Statuses

- **COMPLIANT**: fully meets requirements.
- **PARTIAL**: mostly compliant; minor gaps or justified deviations.
- **NON-COMPLIANT**: violates requirements; must be addressed.
- **N/A**: not applicable to this artifact type.
- **UNCUSTOMIZED**: article still has template placeholders; cannot verify.
