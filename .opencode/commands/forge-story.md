---
description: "Prepare a user story with implementation guidance for development"
agent: forge-scrum
subtask: true
---

# Story Preparation

Prepare a user story for implementation in Epic/Product workflows.

## Arguments

`$ARGUMENTS`:
- story ID (`E01-S003`) → prepare that story
- epic ID (`E01`) → next story for that epic
- empty → ask which epic

## Context Loading

1. Parent epic: `.forge/epics/epic-NN-slug/epic.md`
2. `.forge/product/prd.md`
3. `.forge/architecture/architecture.md`
4. `.forge/sprints/sprint-status.yaml`
5. Existing stories in epic dir (numbering, context)

## Process

### 1. Story Selection

For new story: review epic scope, identify next logical story, consider deps, assign ID (`ENN-SNNN`), confirm scope with user.

### 2. Story Definition

- **Description**: As a [persona], I want [capability], so that [benefit]
- **Acceptance Criteria**: Given/When/Then, testable
- **Implementation Notes**: components/files, patterns, relevant ADRs
- **Dependencies**: prerequisite stories

### 3. Task Breakdown

Specific coding tasks · `[P]` for parallelizable · include tests · sizes `[S]`/`[M]`/`[L]`.

### 4. Definition of Done

- [ ] All ACs verified
- [ ] Unit tests written and passing
- [ ] Integration tests (if applicable)
- [ ] Adversarial review via `/forge-review`
- [ ] No new `[NEEDS CLARIFICATION]` markers
- [ ] Constitution compliance verified
- [ ] Docs updated (if applicable)

### 5. Authoring

Use `.opencode/templates/story.md`. Write to `.forge/epics/epic-NN-slug/story-NNN-slug.md`.

### 6. Sprint Assignment

If sprint active: ask if story should be added, estimate points, update `sprint-status.yaml`, check velocity impact.

### 7. Summary

```
Story: ENN-SNNN - [Title]
Epic: NN - [Epic Name]
Points: N
Tasks: N (S: N, M: N, L: N)
Sprint: [assigned/unassigned]

Ready for: /forge-implement ENN-SNNN
```
