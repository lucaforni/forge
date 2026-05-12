---
description: "Show sprint progress dashboard and project status"
agent: forge-scrum
subtask: true
---

# Sprint Status Dashboard

## Arguments

`$ARGUMENTS`:
- `sprint` / empty → current sprint
- `project` → full project status
- `velocity` → velocity trend
- `NNN` → specific spec

## Context Loading

1. `.forge/sprints/sprint-status.yaml`
2. `.forge/specs/` — scan for task completion
3. `.forge/epics/` — scan epics and stories
4. `.forge/knowledge/decision-log.md`
5. `.forge/knowledge/lessons-learned.md`

## Reports

### Sprint Status (default)

```
Sprint N | Goal: [goal]
Duration: [start] to [end] ([N days remaining])
Progress: [bar] N/N stories (NN%)

  Done:         ENN-SNNN [Npt] Story title
  In Progress:  ENN-SNNN [Npt] Story title
  Not Started:  ENN-SNNN [Npt] Story title
  Blocked:      ENN-SNNN [Npt] Story title - [reason]

Velocity: N points completed (target: N)
```

No active sprint → suggest `/forge-sprint new`.

### Project Status

```
FORGE Project Status
====================

Specs:
  001-user-auth        [COMPLETE]    tasks: 12/12
  002-payment          [IN PROGRESS] tasks: 5/8
  003-notifications    [PLANNING]    spec only

Epics:
  E01-core-auth        [IN PROGRESS] stories: 8/12
  E02-billing          [NOT STARTED] stories: 0/6

Knowledge Base:
  ADRs: N total (N accepted, N deprecated)
  Decisions: N | Lessons: N

Constitution: [customized / template only]
Active Sprint: [Sprint N / none]
```

### Velocity Report

```
Velocity Trend
==============
Sprint 1:  [bar] 24 points
Sprint 2:  [bar] 28 points
Sprint 3:  [bar] 32 points
Sprint 4:  [bar] 30 points

Average:   28.5 | Trend: Improving (+8% over last 3)
Std Dev:   3.1
Predicted next: 29-32 points
```

### Spec Status

```
Spec 002-payment
================
Status: IN PROGRESS

Documents:
  spec.md    [COMPLETE]    FRs: 8, NFRs: 3, Clarifications: 0
  plan.md    [COMPLETE]    Files: 12 new, 4 modified
  tasks.md   [IN PROGRESS] Tasks: 5/8

Phase Progress:
  Phase 1: Foundation  [COMPLETE]    3/3
  Phase 2: Core        [IN PROGRESS] 2/3
  Phase 3: API         [NOT STARTED] 0/2

Last analyzed: [date] · Last reviewed: [never/date]
```
