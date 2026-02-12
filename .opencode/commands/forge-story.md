---
description: "Prepare a user story with implementation guidance for development"
agent: forge-scrum
subtask: true
---

# Story Preparation

You are handling `/forge-story` to prepare a user story for implementation
in an Epic or Product track workflow.

## Arguments

Optional story ID or epic reference: $ARGUMENTS

- If a story ID is provided (e.g., `E01-S003`), prepare that story.
- If an epic ID is provided (e.g., `E01`), create the next story for that epic.
- If no argument, ask the user which epic to work on.

## Context Loading

Read the following:

1. The parent epic file: `.forge/epics/epic-NN-slug/epic.md`
2. `.forge/product/prd.md` -- product requirements
3. `.forge/architecture/architecture.md` -- architecture context
4. `.forge/sprints/sprint-status.yaml` -- current sprint
5. Existing stories in the epic directory for numbering and context.

## Story Creation Process

### Step 1: Story Selection

If creating a new story:
1. Review the epic's scope and identify the next logical story.
2. Consider dependencies on completed or in-progress stories.
3. Assign the story ID (format: `ENN-SNNN`, e.g., E01-S003).
4. Ask the user to confirm or provide the story scope.

### Step 2: Story Definition

Work with the user to define:
1. **Description**: As a [persona], I want [capability], so that [benefit].
2. **Acceptance Criteria**: Specific, testable criteria (Given/When/Then).
3. **Implementation Notes**: Guidance from the architecture document:
   - Which components/files are involved.
   - Which patterns to follow.
   - Which ADRs are relevant.
4. **Dependencies**: Other stories that must be complete first.

### Step 3: Task Breakdown

Break the story into implementation tasks:
1. List specific coding tasks.
2. Mark parallelizable tasks with `[P]`.
3. Include test tasks.
4. Estimate sizes: `[S]`, `[M]`, `[L]`.

### Step 4: Definition of Done

Include the standard DoD checklist:
- [ ] All acceptance criteria verified
- [ ] Unit tests written and passing
- [ ] Integration tests written (if applicable)
- [ ] Code reviewed (adversarial review via `/forge-review`)
- [ ] No new `[NEEDS CLARIFICATION]` markers introduced
- [ ] Constitution compliance verified
- [ ] Documentation updated (if applicable)

### Step 5: Story Authoring

Read the template from `.opencode/templates/story.md` and create the
story file at `.forge/epics/epic-NN-slug/story-NNN-slug.md`.

### Step 6: Sprint Assignment

If a sprint is active:
1. Ask the user if this story should be added to the current sprint.
2. If yes, estimate story points and update `sprint-status.yaml`.
3. Check velocity impact.

### Step 7: Summary

Present the story summary:
```
Story: ENN-SNNN - [Title]
Epic: NN - [Epic Name]
Points: N
Tasks: N (S: N, M: N, L: N)
Sprint: [assigned/unassigned]

Ready for: /forge-implement ENN-SNNN
```
