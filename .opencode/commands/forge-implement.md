---
description: "Implement a feature from spec/story with task-by-task tracking, then auto-run adversarial review"
agent: forge
---

# Implementation + Auto-Review

You are the FORGE orchestrator handling `/forge-implement`. Your role is to:
1. Work through the implementation tasks systematically as the primary agent.
2. **Automatically run `/forge-review` when implementation completes — no exceptions.**

## Arguments

Spec ID, story ID, or path: $ARGUMENTS

- If a spec ID is provided (e.g., `001`), implement from the spec's tasks.
- If a story ID is provided (e.g., `E01-S003`), implement that story.
- If a path is provided, use that spec/story directly.
- If no argument, find the most recently modified spec with tasks or the
  next unstarted story in the current sprint.

## Context Loading

Read the following based on what is being implemented:

**For a spec (Feature track):**
1. `.forge/specs/NNN-slug/spec.md` -- the specification
2. `.forge/specs/NNN-slug/plan.md` -- the technical plan
3. `.forge/specs/NNN-slug/tasks.md` -- the task breakdown
4. `.forge/constitution.md` -- governance constraints
5. `.forge/specs/NNN-slug/design-spec.md` -- UX wireframes and component
   specs (if exists); load Wireframes and Components sections only (~150 lines)
6. `.forge/specs/NNN-slug/user-journey.md` -- user journeys and edge cases
   (if exists); load happy paths and key edge cases (~100 lines)

**For a story (Epic track):**
1. The story file: `.forge/epics/epic-NN-slug/story-NNN-slug.md`
2. `.forge/architecture/architecture.md` -- architecture context
3. `.forge/constitution.md` -- governance constraints
4. Relevant ADRs from `.forge/knowledge/adr/`

## Implementation Process

### Step 1: Task Loading

1. Read the tasks from `tasks.md` or the story file.
2. Create todowrite entries for ALL tasks.
3. Identify which tasks are already complete (checked off).
4. Start with the first uncompleted task.

### Step 2: Task Execution

For each task:
1. Mark it as `in_progress` in todowrite.
2. Implement the change following the plan/story guidance.
3. Follow the project's code conventions from `AGENTS.md`.
4. Follow the constitution's standards.
5. Write tests alongside implementation (not deferred to end).
6. Mark the task as `completed` in todowrite.
7. Update the checkbox in `tasks.md` or the story file.

### Step 3: Implementation Standards

While implementing, ensure:
- Code follows naming conventions from AGENTS.md.
- Import ordering follows the prescribed pattern.
- Error handling follows constitution Article 6.
- Security practices follow constitution Article 5.
- Tests follow constitution Article 8.

### Step 4: Progress Updates

After completing each phase of tasks:
1. Update task checkboxes in the tasks/story file.
2. Report progress to the user.
3. If any task requires clarification or a design decision, stop and
   ask the user before proceeding.

### Step 5: Implementation Complete — Trigger Review

When all tasks are complete:
1. Verify all checkboxes are checked in tasks.md / story file.
2. Run any available test suites.
3. Present the implementation summary:

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

4. **Immediately invoke `/forge-review` as a subtask** using the Task tool
   with `subagent_type: forge` and the spec/story ID as the argument.
   Do NOT ask the user. Do NOT skip this step.

### Step 6: Final Report

After the review subtask completes, present the combined summary:

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

If there are CRITICAL issues, highlight them prominently and block merge
until they are resolved.
