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

Verify compliance against the project's constitution. Read the constitution first,
then check the target artifact (spec, plan, architecture, code, ADR) against
each relevant article.

## Process

### Step 0: Determine Which Constitution Governs

Two shapes exist — using the wrong map produces confidently wrong verdicts:

| Context | Constitution | Articles |
|---|---|---|
| User project (installed FORGE) | `.forge/constitution.md`, from the 9-article template | Map A below |
| FORGE itself (meta-development) | `.forge-meta/constitution.md` | Map B below |

Read the file in full first; its headings are authoritative. If it is missing
or still contains `<!-- CUSTOMIZE -->` placeholders, note it and skip
uncustomized articles. If an article number below does not exist in the loaded
constitution, say so explicitly instead of guessing its meaning — "Article 5"
is Security in Map A but Naming & Conventions in Map B.

### Step 1: Identify Relevant Articles

Map A — user projects (9 articles):

| Artifact     | Relevant Articles                            |
| ------------ | -------------------------------------------- |
| Spec / PRD   | 1, 4, 5 (if security mentioned)              |
| Architecture | 1, 2, 3, 4, 5, 9                             |
| Plan         | 2, 3, 4, 5, 6, 7, 8                          |
| Code / PR    | 2, 3, 4, 5, 6, 7, 8                          |
| ADR          | 1, 2, 3                                      |
| Test code    | 7, 8                                         |

Map B — FORGE itself (5 articles):

| Artifact              | Relevant Articles |
| --------------------- | ----------------- |
| Spec / tech-spec      | 1, 4, 5           |
| Architecture / plan   | 1, 2, 3, 4        |
| Code / PR             | 2, 3, 4, 5        |
| ADR                   | 1, 2, 3           |
| Test code             | 4                 |

### Step 2: Article-by-Article Verification

Map A — user projects:

- **Art. 1 — Core Principles**: alignment with mission and values.
- **Art. 2 — Technology Stack**: prescribed stack used, versions in range; new tech requires an ADR.
- **Art. 3 — Architecture Patterns**: prescribed patterns followed, module boundaries respected, integration/data flow consistent.
- **Art. 4 — Quality Standards**: perf/reliability targets met, code quality (function length, complexity), adequate docs.
- **Art. 5 — Security**: input validation, authn/authz correctness, sensitive data handling, security headers/configs.
- **Art. 6 — Error Handling**: prescribed pattern followed, correct error types, consistent logging, appropriate user-facing messages.
- **Art. 7 — Naming & Conventions**: file/class/function/variable names, import ordering, constants format.
- **Art. 8 — Testing Standards**: required test types present, coverage thresholds met, naming, critical paths tested.
- **Art. 9 — Operational Requirements**: logging, monitoring/observability, deployment constraints, performance.

Map B — FORGE itself (`.forge-meta/constitution.md`):

- **Art. 1 — Core Principles**: multi-platform, agent-first, constitution as law, zero-breaking-change discipline.
- **Art. 2 — Technology Stack**: Node 20+, scoped dependency policy (zero for the installer layer; justified + lockfiled elsewhere), distribution boundary (`.opencode-meta/`, `.forge-meta/`, `docs/meta-development/`, repo `opencode.json` never ship).
- **Art. 3 — Architecture Patterns**: file-based orchestration, platform projection from `.opencode/`.
- **Art. 4 — Quality Standards**: enforced coverage gate, token budgets, and — critically — every mechanically checkable rule must have a CI check (Art. 4.4). A claim without a check is intent, not a rule.
- **Art. 5 — Naming & Conventions**: `forge-[role]` agents, `forge-[action]` commands, `SKILL.md` skills; English for all distributed artifacts.

### Step 3: Handle Tensions

When an artifact conflicts with multiple articles: identify conflicts, assess
priority for the context, document the tension, recommend resolution. If
unresolved, flag for human decision.

### Step 4: Apply Amendments

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
