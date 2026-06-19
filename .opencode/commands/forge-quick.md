---
description: "Quick track: lightweight spec + implementation for small tasks (1-5 tasks)"
agent: forge
---

# Quick Track Workflow

Streamlined workflow for small features or bug fixes — more than hotfix, less than full Feature.

## Arguments

`$ARGUMENTS` — task description.

## Scope

Quick track is for:
- Small features or bug fixes
- 1–5 tasks
- Clear scope, <1 day
- No architectural decisions

## Process

### 1. Scope Verification

Load `scope-detection` skill:
- Tasks >5 → escalate to `/forge-specify` (Feature)
- Single-file bug → downgrade to `/forge-hotfix`
- Present assessment, user confirms

### 2. Quick Spec (via forge-pm)

Invoke `forge-pm`:
1. Conversational discovery (2–4 questions max)
2. Use `.opencode/templates/tech-spec.md`
3. Determine next spec number from `.forge/specs/`
4. Write `.forge/specs/NNN-slug/tech-spec.md`:
   - Overview (2–3 sentences)
   - Requirements (bullets, not full FRs)
   - Tasks (numbered checkboxes)
   - Acceptance criteria (simple list)
   - Constitution compliance (quick check)

### 3. Implementation

- Work through tasks in order
- Track with `todowrite`
- Write unit tests
- Check off tasks in tech-spec as completed

### 4. Trigger Review

```
Quick Track Implementation Complete
====================================
Spec: NNN-slug
Tasks: N/N completed
Tests: N written
Files: N created, N modified

► Launching adversarial review automatically...
```

**Immediately invoke `/forge-review`** via Task tool with `subagent_type: forge` and spec ID. Do NOT ask. Do NOT skip.

### 5. Final Report

```
Quick Track Complete
====================
Spec: NNN-slug
Tasks: N/N completed
Tests: N | Files: N created, N modified

── Adversarial Review ──────────────────────────────
Verdict: [APPROVED WITH NOTES / NEEDS CHANGES]
Issues:  N total (X consensus · Y A-only · Z B-only)
  CRITICAL: N  ← must fix before merge
  WARNING:  N  ← should address
  INFO:     N  ← consider fixing
────────────────────────────────────────────────────

Commit suggestion: feat([scope]): [description]

Next:
  1. Fix CRITICAL → re-run /forge-review
  2. Human review → merge
```
