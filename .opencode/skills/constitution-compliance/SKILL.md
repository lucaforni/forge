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

You are verifying compliance against the project constitution located at
`.forge/constitution.md`. Read the constitution first, then check the target
artifact (spec, plan, architecture, code, or ADR) against each relevant
article.

## Verification Process

### Step 1: Load the Constitution

Read `.forge/constitution.md` in full. If it does not exist or has not been
customized (still contains `<!-- CUSTOMIZE -->` placeholders), note this in
the report and skip verification for uncustomized articles.

### Step 2: Identify Relevant Articles

Not all articles apply to every artifact. Use this mapping:

| Artifact Type    | Relevant Articles                              |
| ---------------- | ---------------------------------------------- |
| Spec / PRD       | 1, 4, 5 (if security requirements mentioned)  |
| Architecture     | 1, 2, 3, 4, 5, 9                              |
| Plan             | 2, 3, 4, 5, 6, 7, 8                           |
| Code / PR        | 2, 3, 4, 5, 6, 7, 8                           |
| ADR              | 1, 2, 3                                        |
| Test code        | 7, 8                                           |

### Step 3: Article-by-Article Verification

For each relevant article, check:

**Article 1: Core Principles**
- Does the artifact align with the project's stated core principles?
- Does it support the project's mission and values?

**Article 2: Technology Stack**
- Are technology choices consistent with the prescribed stack?
- Are versions within the specified ranges?
- If a new technology is introduced, is it justified with an ADR?

**Article 3: Architecture Patterns**
- Does the design follow prescribed architectural patterns?
- Are module boundaries respected?
- Are integration patterns consistent?
- Is the data flow consistent with the architecture?

**Article 4: Quality Standards**
- Are quality requirements (performance, reliability) met?
- Are code quality standards applied (max function length, complexity)?
- Is documentation adequate?

**Article 5: Security**
- Is input validation applied where needed?
- Is authentication and authorization correctly implemented?
- Are sensitive data handling requirements met?
- Are security headers and configurations correct?

**Article 6: Error Handling**
- Are errors handled according to the prescribed pattern?
- Are error types used correctly?
- Is error logging consistent?
- Are user-facing error messages appropriate?

**Article 7: Naming & Conventions**
- Do file names follow the prescribed format?
- Do class/function/variable names follow conventions?
- Is import ordering consistent?
- Are constants in the correct format?

**Article 8: Testing Standards**
- Are required test types present?
- Does coverage meet minimum thresholds?
- Are test naming conventions followed?
- Are critical paths tested?

**Article 9: Operational Requirements**
- Are logging requirements met?
- Is monitoring/observability addressed?
- Are deployment constraints respected?
- Are performance requirements met?

### Step 4: Handle Tensions

When a decision or artifact conflicts with multiple articles:
1. Identify the conflicting articles.
2. Assess which article has higher priority for this context.
3. Document the tension and recommend a resolution.
4. If the tension cannot be resolved, flag it for human decision.

### Step 5: Handle Amendments

Check the constitution's Amendments Log:
- Are there amendments that change the baseline rules?
- Apply amended rules instead of original where amendments exist.
- Note which amendments were applied in the report.

## Compliance Report Format

```markdown
## Constitution Compliance Report

**Target**: [artifact name and type]
**Date**: YYYY-MM-DD
**Constitution version**: [date of last amendment or "original"]

### Overall Status: [COMPLIANT / PARTIAL / NON-COMPLIANT]

### Article-by-Article Results

| Article | Title                | Status    | Notes                    |
| ------- | -------------------- | --------- | ------------------------ |
| 1       | Core Principles      | COMPLIANT | Aligns with principles   |
| 2       | Technology Stack     | COMPLIANT | Uses prescribed stack    |
| 3       | Architecture         | PARTIAL   | See finding below        |
| 4       | Quality Standards    | COMPLIANT | Meets all standards      |
| 5       | Security             | N/A       | Not applicable           |
| ...     | ...                  | ...       | ...                      |

### Findings

**[PARTIAL] Article 3 - Architecture Patterns**
The plan introduces a new event-driven pattern for notifications that is
not covered in the current architecture document.
- **Impact**: Medium - establishes a new pattern
- **Recommendation**: Create an ADR documenting the event-driven pattern
  and update the architecture document.

### Tensions
[Any identified tensions between articles]

### Amendments Applied
[Any amendments that affected the evaluation]
```

## Compliance Statuses

- **COMPLIANT**: Fully meets the article's requirements.
- **PARTIAL**: Mostly compliant with minor gaps or justified deviations.
- **NON-COMPLIANT**: Violates the article's requirements. Must be addressed.
- **N/A**: Article is not applicable to this artifact type.
- **UNCUSTOMIZED**: Article has not been customized in the constitution
  (still has template placeholders). Cannot verify.
