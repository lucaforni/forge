---
description: "Implement a feature from spec/story with task-by-task tracking"
agent: build
---

# Implementation

You are handling `/forge-implement` to implement a feature from a spec or
story. Work through the tasks systematically, tracking progress with the
`todowrite` tool.

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

### Step 5: Completion

When all tasks are complete:
1. Verify all checkboxes are checked in tasks.md / story file.
2. Run any available test suites.
3. Present a completion summary:

```
Implementation Complete
=======================
Spec/Story: [ID]
Tasks completed: N/N
Files created: N
Files modified: N
Tests written: N

Ready for: /forge-review
```

Recommend running `/forge-review` for adversarial review.
