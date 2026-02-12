---
description: "Context-aware help for FORGE commands, tracks, and workflows"
agent: forge
---

# FORGE Help

You are handling `/forge-help` to provide context-aware help about the
FORGE methodology, commands, tracks, and workflows.

## Arguments

Optional topic: $ARGUMENTS

- If a command name is provided (e.g., `specify`, `review`), explain that
  command in detail.
- If a track name is provided (e.g., `feature`, `epic`), explain that
  workflow track.
- If a concept is provided (e.g., `constitution`, `adr`, `knowledge`),
  explain that concept.
- If no argument, show the general help overview.

## Help Responses

### General Overview (no arguments)

```
FORGE - Framework for Orchestrated Requirements, Governance & Engineering
=========================================================================

Workflow Tracks (ordered by complexity):
  Hotfix    /forge-hotfix     1-2 files, < 30 min
  Quick     /forge-quick      1-5 tasks, < 1 day
  Feature   /forge-specify    5-20 tasks, 1-5 days
  Epic      /forge-brief      20-50 tasks, 1-4 weeks
  Product   /forge-init       50+ tasks, 4+ weeks

Commands:
  Setup:      /forge-init
  Discovery:  /forge-brief, /forge-specify, /forge-clarify, /forge-prd
  Design:     /forge-architecture, /forge-plan
  Validate:   /forge-analyze
  Manage:     /forge-tasks, /forge-sprint, /forge-story
  Build:      /forge-implement, /forge-hotfix, /forge-quick
  Review:     /forge-review
  Knowledge:  /forge-adr, /forge-retro
  Info:       /forge-status, /forge-help

Type /forge-help [topic] for details on any command, track, or concept.
```

### Command Help

When a specific command is asked about, read the command file from
`.opencode/commands/forge-[name].md` and present:
1. What the command does.
2. Which agent handles it.
3. What arguments it accepts.
4. What upstream documents it needs.
5. What it produces.
6. What to run next.

### Track Help

When a track is asked about, explain:
1. When to use this track (scope criteria).
2. The complete command sequence.
3. What documents are produced.
4. How scope guards work (escalation/downgrade).

### Concept Help

For concepts like constitution, ADR, knowledge base, etc., explain:
1. What it is and why it matters.
2. Where it lives in the project.
3. How to create/update it.
4. Which commands interact with it.

## Context-Aware Suggestions

Scan the current project state to make relevant suggestions:

1. If `.forge/` does not exist: suggest `/forge-init`.
2. If constitution is not customized: suggest running `/forge-init`.
3. If specs exist without plans: suggest `/forge-plan`.
4. If specs have `[NEEDS CLARIFICATION]`: suggest `/forge-clarify`.
5. If a sprint is active: show sprint status and suggest next action.
6. If no recent activity: suggest where to pick up.

## Documentation Reference

For deeper reading, point users to:
- `.opencode/docs/FORGE-GUIDE.md` -- complete usage guide
- `.opencode/docs/FORGE-PHILOSOPHY.md` -- methodology principles
- `.opencode/docs/FORGE-CUSTOMIZATION.md` -- customization options
- `.opencode/docs/FORGE-DECISIONS.md` -- design decisions
- `.opencode/docs/FORGE-PROJECT-PLAN.md` -- full system specification
