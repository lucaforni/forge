---
description: "Quick track: lightweight spec + implementation for small tasks (1-5 tasks)"
agent: forge
---

# Quick Track Workflow

You are handling `/forge-quick` for the Quick track. This is a streamlined
workflow for small features or bug fixes that need minimal documentation
but more than a hotfix.

## Arguments

Task description: $ARGUMENTS

## Scope Constraints

The Quick track is for:
- Small features or bug fixes
- 1-5 tasks estimated
- Clear scope, under 1 day of work
- Does not require architectural decisions

## Quick Track Process

### Step 1: Scope Verification

Load the `scope-detection` skill and evaluate the request:
- If estimated tasks > 5, suggest escalating to Feature track (`/forge-specify`).
- If this is a single-file bug fix, suggest downgrading to Hotfix track (`/forge-hotfix`).
- Present the assessment and let the user confirm.

### Step 2: Quick Spec (via forge-pm subagent)

Invoke the `forge-pm` subagent to create a lightweight tech spec:

1. Brief conversational discovery with the user (2-4 questions max).
2. Read the template from `.opencode/templates/tech-spec.md`.
3. Determine the next available spec number from `.forge/specs/`.
4. Create `.forge/specs/NNN-slug/tech-spec.md` with:
   - Overview (2-3 sentences)
   - Requirements (bullet list, not full FRs)
   - Tasks (numbered list with checkboxes)
   - Acceptance criteria (simple list)
   - Constitution compliance (quick check)

### Step 3: Implementation (via Build agent)

After the tech spec is created, implement the tasks:

1. Work through each task in order.
2. Track progress with `todowrite`.
3. Write unit tests for new/changed code.
4. Check off tasks in the tech-spec as they are completed.

### Step 4: Implementation Complete — Trigger Review

When all tasks are done, present the implementation summary:

```
Quick Track Implementation Complete
====================================
Spec: NNN-slug
Tasks: N/N completed
Tests: N written
Files: N created, N modified

► Launching adversarial review automatically...
```

**Immediately invoke `/forge-review` as a subtask** using the Task tool
with `subagent_type: forge` and the spec ID as the argument.
Do NOT ask the user. Do NOT skip this step.

### Step 5: Final Report

After the review subtask completes, present the combined summary:

```
Quick Track Complete
====================
Spec: NNN-slug
Tasks: N/N completed
Tests: N written
Files: N created, N modified

── Adversarial Review ──────────────────────────────
Verdict:  [APPROVED WITH NOTES / NEEDS CHANGES]
Issues:   N total  (X consensus · Y opus-only · Z codex-only)
  CRITICAL: N  ← must fix before merge
  WARNING:  N  ← should address
  INFO:     N  ← consider fixing
────────────────────────────────────────────────────

Commit message suggestion:
feat([scope]): [description]

Next steps:
  1. Fix any CRITICAL issues  →  re-run /forge-review
  2. Human review → merge
```
