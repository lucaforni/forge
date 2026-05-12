---
description: "Conduct a sprint retrospective and extract lessons learned"
agent: forge-scrum
subtask: true
---

# Sprint Retrospective

Run a retrospective for an Epic/Product sprint.

## Arguments

`$ARGUMENTS` — sprint number, or empty (most recently completed sprint).

## Context Loading

1. `.forge/sprints/sprint-status.yaml`
2. All story files from the sprint
3. `.forge/knowledge/decision-log.md`
4. `.forge/knowledge/lessons-learned.md`
5. `.forge/sprints/retrospectives/`

## Process

### 1. Sprint Review
- Sprint goal — achieved?
- Stories completed vs planned
- Actual vs target velocity
- Carry-overs and reasons
- Unplanned work added

### 2. Structured Retro (use `question` tool)

| Category | Prompts |
|---|---|
| What went well | Practices/decisions that worked; what to keep |
| What to improve | Frustrating/slow; rework/confusion; recurring issues |
| What we learned | Technical insights; process improvements; mistakes to avoid |
| Action items | Specific changes for next sprint; owners |

### 3. Velocity Analysis

```
Sprint N-2:  28 points
Sprint N-1:  32 points
Sprint N:    30 points
Average:     30 | Trend: Stable
```

### 4. Lessons Extraction

Append to `.forge/knowledge/lessons-learned.md`:

```markdown
### Sprint N Retrospective - YYYY-MM-DD
**Lesson**: [What was learned]
**Context**: [What happened]
**Action**: [What to do differently]
**Category**: [process | technical | communication | tooling]
```

### 5. Retrospective Report

Write `.forge/sprints/retrospectives/sprint-NN-retro.md`:

```markdown
# Sprint NN Retrospective

## Sprint Summary
- Goal: [goal]
- Status: [achieved / partial / not achieved]
- Planned: N stories (N points)
- Completed: N stories (N points)
- Velocity: N points

## What Went Well
## What Could Be Improved
## What We Learned
## Action Items
- [ ] [action] (owner: [who])

## Velocity Trend
```

### 6. Next Steps
- `/forge-sprint new` — plan next sprint
- Address action items before starting next sprint
- `/forge-adr` if any action requires an ADR
