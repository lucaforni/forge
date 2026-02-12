---
description: "Show sprint progress dashboard and project status"
agent: forge-scrum
subtask: true
---

# Sprint Status Dashboard

You are handling `/forge-status` to display the current sprint status and
overall project health.

## Arguments

Optional scope: $ARGUMENTS

- `sprint` or no args: Show current sprint status
- `project`: Show full project status including all specs and epics
- `velocity`: Show velocity trend analysis
- `NNN` (spec ID): Show status of a specific spec

## Context Loading

1. `.forge/sprints/sprint-status.yaml` -- sprint data
2. `.forge/specs/` -- scan all spec directories for task completion
3. `.forge/epics/` -- scan all epics and stories
4. `.forge/knowledge/decision-log.md` -- recent decisions
5. `.forge/knowledge/lessons-learned.md` -- recent lessons

## Status Reports

### Sprint Status (default)

If a sprint is active, present:

```
Sprint N | Goal: [sprint goal]
Duration: [start] to [end] ([N days remaining])
Progress: [progress bar] N/N stories (NN%)

  Done:         ENN-SNNN [Npt] Story title
                ENN-SNNN [Npt] Story title
  In Progress:  ENN-SNNN [Npt] Story title
  Not Started:  ENN-SNNN [Npt] Story title
  Blocked:      ENN-SNNN [Npt] Story title - [reason]

Velocity: N points completed (target: N points)
```

If no sprint is active, report that and suggest `/forge-sprint new`.

### Project Status

Scan all artifacts and present:

```
FORGE Project Status
====================

Specs:
  001-user-auth        [COMPLETE]  tasks: 12/12
  002-payment          [IN PROGRESS]  tasks: 5/8
  003-notifications    [PLANNING]  spec only, no plan yet

Epics:
  E01-core-auth        [IN PROGRESS]  stories: 8/12
  E02-billing          [NOT STARTED]  stories: 0/6

Knowledge Base:
  ADRs: N total (N accepted, N deprecated)
  Decisions: N recorded
  Lessons: N recorded

Constitution: [customized / template only]

Active Sprint: [Sprint N / none]
```

### Velocity Report

Present historical velocity data:

```
Velocity Trend
==============
Sprint 1:  [bar] 24 points
Sprint 2:  [bar] 28 points
Sprint 3:  [bar] 32 points
Sprint 4:  [bar] 30 points

Average:   28.5 points
Trend:     Improving (+8% over last 3 sprints)
Std Dev:   3.1 points
Predicted next sprint: 29-32 points
```

### Spec Status

For a specific spec:

```
Spec 002-payment
================
Status: IN PROGRESS

Documents:
  spec.md    [COMPLETE]  FRs: 8, NFRs: 3, Clarifications: 0
  plan.md    [COMPLETE]  Files: 12 new, 4 modified
  tasks.md   [IN PROGRESS]  Tasks: 5/8 complete

Phase Progress:
  Phase 1: Foundation      [COMPLETE]  3/3 tasks
  Phase 2: Core            [IN PROGRESS]  2/3 tasks
  Phase 3: API             [NOT STARTED]  0/2 tasks

Last analyzed: [date] (via /forge-analyze)
Last reviewed: [never / date]
```
