---
description: "Diagnose and fix a critical bug with minimal changes, then auto-run adversarial review (Hotfix track)"
agent: forge
---

# Hotfix Workflow + Auto-Review

All-in-one workflow for critical bugs: minimal targeted fix + **mandatory** adversarial review.

## Arguments

`$ARGUMENTS` — bug description.

## Scope

Hotfix track is for:
- Critical bugs needing immediate fix
- ≤2 files affected
- <30 minutes work
- No new patterns or architectural changes

## Process

### 1. Diagnosis

Understand the bug, explore the code, verify it exists. Present root cause:

```
Root Cause Analysis
===================
Bug:      [description]
Location: [file:line]
Cause:    [explanation]
Impact:   [what is affected]
```

### 2. Scope Check

Escalate if:
- Fix touches >2 files (excl. tests)
- Requires new patterns, deps, or schema changes
- Root cause is architectural

```
SCOPE ESCALATION: [reason]. Recommend:
- /forge-quick (Quick track)
- /forge-specify (Feature track)
```

Proceed only if user confirms Hotfix track.

### 3. Fix

Apply minimal targeted fix. Follow existing patterns. Add comment explaining WHY (not what).

### 4. Regression Test

Add/update test for the bug scenario (fails without fix, passes with). Run existing tests for regressions.

### 5. Trigger Review

```
Hotfix Complete
===============
Bug:            [description]
Root cause:     [explanation]
Fix:            [what changed]
Files modified: [list]
Tests:          [added/updated]
Regressions:    [none/details]

Commit suggestion: fix([scope]): [description]

► Launching adversarial review automatically...
```

**Immediately invoke `/forge-review`** via Task tool with `subagent_type: forge` and `--diff` argument. Do NOT ask. Do NOT skip.

### 6. Final Report

```
Hotfix + Review Complete
========================
Bug:  [description]
Fix:  [what changed]
Files modified: [list]

── Adversarial Review ──────────────────────────────
Verdict: [APPROVED WITH NOTES / NEEDS CHANGES]
Issues:  N total (X consensus · Y opus-only · Z codex-only)
  CRITICAL: N  ← must fix before commit
  WARNING:  N  ← should address
  INFO:     N  ← consider fixing
────────────────────────────────────────────────────

Suggested commit: fix([scope]): [description]

Next:
  1. Fix CRITICAL issues → re-run /forge-review
  2. Commit and push
```
