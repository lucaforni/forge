---
description: "Diagnose and fix a critical bug with minimal changes (Hotfix track)"
agent: build
---

# Hotfix Workflow

You are handling `/forge-hotfix` for the Hotfix track. This is an all-in-one
workflow for critical bugs requiring minimal, targeted fixes.

## Arguments

Bug description: $ARGUMENTS

## Scope Constraints

The Hotfix track is for:
- Critical bugs requiring immediate fix
- 1-2 files affected maximum
- Under 30 minutes of work
- No new patterns or architectural changes

## Hotfix Process

### Step 1: Diagnosis

1. Understand the bug from the user's description.
2. Explore the relevant code to identify the root cause.
3. Verify the bug exists (check the code path, logic, data flow).
4. Present the root cause analysis to the user before proceeding:

```
Root Cause Analysis
===================
Bug: [description]
Location: [file:line]
Cause: [explanation]
Impact: [what is affected]
```

### Step 2: Scope Check

Before fixing, verify this is truly a hotfix:
- Will the fix touch more than 2 files (excluding tests)?
- Does it require new patterns, dependencies, or schema changes?
- Is the root cause architectural?

If ANY of these are true, alert the user:
```
SCOPE ESCALATION: This fix requires [reason]. Recommend:
- /forge-quick for a broader fix (Quick track)
- /forge-specify for a planned fix (Feature track)
```

Proceed only if the user confirms staying in Hotfix track.

### Step 3: Fix

1. Apply the minimal, targeted fix.
2. Follow existing code patterns (do not refactor).
3. Add a comment explaining WHY the fix was needed (not what it does).

### Step 4: Regression Test

1. Write or update a test that covers the specific bug scenario.
2. Run existing tests to verify no regressions.
3. The test should fail without the fix and pass with it.

### Step 5: Self-Review

Perform a quick review against the constitution:
- Does the fix follow coding conventions?
- Does it introduce any security issues?
- Is error handling consistent with existing patterns?

### Step 6: Completion

Present the fix summary:

```
Hotfix Complete
===============
Bug: [description]
Root cause: [explanation]
Fix: [what was changed]
Files modified: [list]
Tests: [added/updated]
Regressions: [none/details]

Commit message suggestion:
fix([scope]): [description]

Root cause: [explanation]
Fix: [what was changed]
```

Remind the user to run `/forge-review` if they want an adversarial review
before committing.
