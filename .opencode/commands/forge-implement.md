---
description: "Implement a feature from spec/story with task-by-task tracking, then auto-run adversarial review"
agent: forge
---

# Implementation + Auto-Review

Orchestrator for `/forge-implement`:
1. Work through implementation tasks systematically.
2. **Automatically run `/forge-review` when implementation completes — no exceptions.**

## Arguments

Spec ID, story ID, or path: $ARGUMENTS

- Spec ID (e.g., `001`) → implement from spec's tasks.
- Story ID (e.g., `E01-S003`) → implement that story.
- Path → use that spec/story directly.
- None → most recently modified spec with tasks, or next unstarted story in current sprint.

## Context Loading

**For a spec (Feature track):**
1. `.forge/specs/NNN-slug/spec.md`
2. `.forge/specs/NNN-slug/plan.md`
3. `.forge/specs/NNN-slug/tasks.md`
4. `.forge/constitution.md`
5. `.forge/specs/NNN-slug/design-spec.md` — Wireframes + Components only (~150 lines, if exists)
6. `.forge/specs/NNN-slug/user-journey.md` — happy paths + key edge cases (~100 lines, if exists)

**For a story (Epic track):**
1. `.forge/epics/epic-NN-slug/story-NNN-slug.md`
2. `.forge/architecture/architecture.md`
3. `.forge/constitution.md`
4. Relevant ADRs from `.forge/knowledge/adr/`

## Implementation Process

### Step 1: Task Loading

Read tasks. Create todowrite entries for ALL tasks. Identify completed (checked off). Start with first uncompleted.

### Step 2: Task Execution

Per task: mark `in_progress` → implement per plan/story → follow AGENTS.md conventions + constitution → write tests alongside (not deferred) → mark `completed` → check off in file.

### Step 3: Implementation Standards

- Naming conventions from AGENTS.md
- Import ordering per prescribed pattern
- Error handling per constitution Article 6
- Security per constitution Article 5
- Tests per constitution Article 8

### Step 4: Progress Updates

After each phase: update task checkboxes, report progress. If clarification/design decision needed: stop and ask user before proceeding.

### Step 5: Implementation Complete — Trigger Review

When all tasks done:
1. Verify all checkboxes checked.
2. Run available test suites.
3. Present summary:

```
Implementation Complete
=======================
Spec/Story: [ID]
Tasks completed: N/N
Files created: N
Files modified: N
Tests written: N

► Launching adversarial review automatically...
```

4. **Immediately invoke `/forge-review` as a subtask** via Task tool, `subagent_type: forge`, spec/story ID as argument. Do NOT ask. Do NOT skip.

### Step 6: Final Report

After review subtask completes:

```
Implementation + Review Complete
================================
Spec/Story: [ID] — [title]
Tasks completed: N/N
Files created:   N
Files modified:  N
Tests written:   N

── Adversarial Review ──────────────────────────────
Verdict:  [APPROVED WITH NOTES / NEEDS CHANGES]
Issues:   N total  (X consensus · Y opus-only · Z codex-only)
  CRITICAL: N  ← must fix before merge
  WARNING:  N  ← should address
  INFO:     N  ← consider fixing
────────────────────────────────────────────────────

Next steps:
  1. Fix any CRITICAL issues  →  re-run /forge-review
  2. Human review
  3. Merge
```

If CRITICAL issues exist: highlight prominently and block merge until resolved.
