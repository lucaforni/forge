---
description: "Conduct a sprint retrospective and extract lessons learned"
agent: forge-scrum
subtask: true
---

# Sprint Retrospective

You are handling `/forge-retro` to conduct a sprint retrospective for an
Epic or Product track workflow.

## Arguments

Optional sprint number: $ARGUMENTS

If no argument, use the most recently completed sprint.

## Context Loading

1. `.forge/sprints/sprint-status.yaml` -- sprint data and history
2. All story files from the sprint's story list
3. `.forge/knowledge/decision-log.md` -- decisions made during the sprint
4. `.forge/knowledge/lessons-learned.md` -- existing lessons
5. `.forge/sprints/retrospectives/` -- past retrospective files

## Retrospective Process

### Step 1: Sprint Review

Present the sprint results:
1. Sprint goal: Was it achieved?
2. Stories completed vs planned.
3. Actual velocity vs target velocity.
4. Stories carried over (if any) and why.
5. Unplanned work that was added during the sprint.

### Step 2: Structured Retrospective

Use the `question` tool to facilitate the retrospective across these
categories:

**What went well?**
- What practices, decisions, or approaches worked?
- What should we keep doing?

**What could be improved?**
- What was frustrating or slow?
- What caused rework or confusion?
- Were there recurring issues?

**What did we learn?**
- New technical insights?
- Process improvements discovered?
- Mistakes we should not repeat?

**Action items**
- What specific changes should we make for the next sprint?
- Who is responsible for each action item?

### Step 3: Velocity Analysis

Calculate and present velocity trends:
```
Velocity Trend
==============
Sprint N-2:  28 points
Sprint N-1:  32 points
Sprint N:    30 points
Average:     30 points
Trend:       Stable
```

### Step 4: Lessons Extraction

Extract concrete lessons learned and append them to
`.forge/knowledge/lessons-learned.md`:

```markdown
### Sprint N Retrospective - YYYY-MM-DD

**Lesson**: [What was learned]
**Context**: [What happened]
**Action**: [What to do differently]
**Category**: [process | technical | communication | tooling]
```

### Step 5: Retrospective Report

Create a retrospective file at
`.forge/sprints/retrospectives/sprint-NN-retro.md`:

```markdown
# Sprint NN Retrospective

## Sprint Summary
- Goal: [goal]
- Status: [achieved / partially achieved / not achieved]
- Planned: N stories (N points)
- Completed: N stories (N points)
- Velocity: N points

## What Went Well
- [items]

## What Could Be Improved
- [items]

## What We Learned
- [items]

## Action Items
- [ ] [action] (owner: [who])

## Velocity Trend
[chart data]
```

### Step 6: Next Sprint Preparation

Suggest next steps:
- `/forge-sprint new` to plan the next sprint
- Address action items before starting the next sprint
- Review if any action items require ADRs (`/forge-adr`)
