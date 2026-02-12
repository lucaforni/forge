---
description: "Initialize or manage a sprint with story selection and velocity tracking"
agent: forge-scrum
subtask: true
---

# Sprint Planning

You are handling `/forge-sprint` to initialize or manage a sprint for an
Epic or Product track workflow.

## Arguments

Optional action: $ARGUMENTS

- `new` or no args: Start a new sprint
- `close`: Close the current sprint
- `update`: Update story statuses in the current sprint

## Context Loading

Read the following:

1. `.forge/sprints/sprint-status.yaml` -- current sprint state
2. `.forge/epics/` -- scan for all epics and their stories
3. `.forge/architecture/architecture.md` -- architecture context
4. `.forge/product/prd.md` -- product requirements
5. `.forge/knowledge/decision-log.md` -- prior decisions
6. `.forge/sprints/retrospectives/` -- past retrospectives for velocity data

## Sprint Actions

### Action: New Sprint

#### Step 1: Review Previous Sprint

If a previous sprint exists:
1. Check if it was properly closed (all stories done or carried over).
2. Calculate velocity from completed stories.
3. If not closed, ask user to run `/forge-sprint close` first or
   carry over incomplete stories.

#### Step 2: Sprint Planning

1. Present the backlog of unassigned stories from all epics.
2. Use the `question` tool to help the user:
   - Set the sprint goal.
   - Set sprint duration (default: 2 weeks).
   - Select stories for the sprint.
   - Estimate story points for selected stories.
3. Check total points against average velocity (if available).
4. Warn if the sprint is overcommitted (> 120% of average velocity).

#### Step 3: Initialize Sprint

Read the template from `.opencode/templates/sprint-status.yaml` and
create/update `.forge/sprints/sprint-status.yaml` with:
- Sprint number (increment from previous).
- Sprint goal.
- Start and end dates.
- Selected stories with point estimates.
- Initial velocity target.

#### Step 4: Summary

Present the sprint plan:
```
Sprint N: [Goal]
Duration: [start] to [end]
Stories: N (total: N points)
Velocity target: N points (avg: N points)

Stories:
  E01-S001  [5pt]  Story title
  E01-S002  [8pt]  Story title
  ...
```

### Action: Close Sprint

#### Step 1: Review Completion

1. Read current sprint status.
2. For each story, verify completion:
   - Is the story file marked done?
   - Were associated tasks completed?
3. Calculate actual velocity.

#### Step 2: Carry Over

For incomplete stories:
1. Ask the user whether to carry over to the next sprint or move back
   to backlog.
2. Update story status accordingly.

#### Step 3: Update History

1. Move the current sprint to the `previous_sprints` section.
2. Record actual velocity.
3. Suggest running `/forge-retro` for a retrospective.

### Action: Update

1. Present current story statuses.
2. Use the `question` tool to update statuses (not_started, in_progress,
   done, blocked).
3. Update `.forge/sprints/sprint-status.yaml`.
4. Report updated progress.
