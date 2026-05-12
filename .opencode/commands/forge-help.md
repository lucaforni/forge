---
description: "Context-aware help for FORGE commands, tracks, and workflows"
agent: forge
---

# FORGE Help

## Arguments

`$ARGUMENTS`:
- command name (e.g., `specify`, `review`) → command detail
- track name (e.g., `feature`, `epic`) → workflow track detail
- concept (e.g., `constitution`, `adr`, `knowledge`) → concept detail
- empty → general overview

## General Overview (no arguments)

```
FORGE - Framework for Orchestrated Requirements, Governance & Engineering
=========================================================================

Workflow Tracks (by complexity):
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

Type /forge-help [topic] for details.
```

## Command Help

Read `.opencode/commands/forge-[name].md` and present: purpose, agent, arguments, upstream docs, outputs, next steps.

## Track Help

Explain: when to use (scope criteria), command sequence, documents produced, scope guards (escalation/downgrade).

## Concept Help

For constitution, ADR, knowledge base, etc.: what/why, location, how to create/update, interacting commands.

## Context-Aware Suggestions

Scan current state:
- No `.forge/` → `/forge-init`
- Constitution not customized → `/forge-init`
- Specs without plans → `/forge-plan`
- `[NEEDS CLARIFICATION]` present → `/forge-clarify`
- Active sprint → show status + next action
- No recent activity → suggest pickup point

## Documentation Reference

- `.opencode/docs/FORGE-GUIDE.md` — usage guide
- `.opencode/docs/FORGE-PHILOSOPHY.md` — methodology principles
- `.opencode/docs/FORGE-CUSTOMIZATION.md` — customization
- `.opencode/docs/FORGE-DECISIONS.md` — design decisions
- `.opencode/docs/FORGE-PROJECT-PLAN.md` — system specification
