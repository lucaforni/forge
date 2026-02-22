---
name: context-chain
description: Determine and load correct upstream documents for the current FORGE workflow phase with context window budget guidance
license: MIT
compatibility: opencode
metadata:
  audience: all-forge-agents
  workflow: forge
---

## Purpose

You are determining which upstream documents to load for the current
workflow phase. The FORGE methodology uses a progressive context chain
where each phase's output becomes input context for the next phase.
Loading the right documents ensures consistency; loading too many wastes
the context window.

## Phase-to-Document Mapping

Use this table to determine which documents to load:

| Phase              | Required Documents                                    | Optional Documents                    |
| ------------------ | ----------------------------------------------------- | ------------------------------------- |
| Specify / PRD      | constitution.md                                       | architecture.md, existing specs       |
| UX Design          | specs/NNN/spec.md, constitution.md                    | architecture.md, ux/design-system.md  |
| Architecture       | constitution.md, product/prd.md OR product/brief.md   | knowledge/adr/*.md                    |
| Plan               | constitution.md, specs/NNN/spec.md                    | architecture.md, specs/NNN/design-spec.md, knowledge/adr/*.md |
| Clarify            | specs/NNN/spec.md, constitution.md                    | specs/NNN/plan.md                     |
| Analyze            | specs/NNN/spec.md, specs/NNN/plan.md, constitution.md | architecture.md, specs/NNN/design-spec.md |
| Tasks              | specs/NNN/spec.md, specs/NNN/plan.md                  | constitution.md, specs/NNN/design-spec.md |
| Sprint Planning    | architecture.md, sprints/active/*.yaml                | epics/*, product/prd.md               |
| Story Creation     | epics/epic-NN/epic.md, architecture.md                | product/prd.md, sprints/active/*.yaml |
| Implementation     | spec.md OR story file, constitution.md                | plan.md OR architecture.md, specs/NNN/design-spec.md, ADRs |
| Code Review        | spec.md OR story file, constitution.md                | architecture.md, plan.md, specs/NNN/design-spec.md |
| Retrospective      | sprints/active/*.yaml, sprints/completed/*.yaml       | decision-log.md, lessons-learned.md   |
| ADR Creation       | constitution.md, knowledge/adr/*.md                   | architecture.md, decision-log.md      |

## Document Resolution

All document paths are relative to `.forge/`. Resolve paths in this order:

1. **Explicit path**: If the user provides a path, use it.
2. **Most recent**: If no path given, find the most recently modified
   matching file.
3. **Spec discovery**: For spec-related phases, scan `.forge/specs/` and
   use the highest-numbered spec directory (or the one most recently
   modified).

### Handling Missing Documents

When a required document does not exist:
- **Critical missing**: constitution.md -- warn strongly but proceed. The
  agent should note that governance constraints could not be verified.
- **Phase-blocking missing**: If the spec is missing for Plan phase, or
  plan is missing for Tasks phase, STOP and tell the user which command
  to run first.
- **Optional missing**: Simply note it is not available and proceed.

## Context Window Budget

To avoid exhausting the context window, follow these guidelines:

### Document Priority (load in this order)

1. **Always load in full**: constitution.md (typically 200-400 lines)
2. **Always load in full**: The primary working document (spec, plan,
   story being worked on)
3. **Load key sections**: architecture.md -- load the relevant sections
   (e.g., data model if planning, API surface if implementing endpoints)
4. **Load summaries**: For ADRs, load the Decision and Status sections
   only, not the full option analysis
5. **Load recent entries**: For decision-log.md and lessons-learned.md,
   load only the last 10 entries

### Size Guidelines

| Document                | Max Context Budget      |
| ----------------------- | ----------------------- |
| constitution.md         | Full (no limit)         |
| Primary spec/plan/story | Full (no limit)         |
| design-spec.md          | ~150 lines (Wireframes + Components sections) |
| user-journey.md         | ~100 lines (Happy paths + key edge cases) |
| architecture.md         | ~200 lines (key sections) |
| Each ADR                | ~30 lines (Decision + Status) |
| decision-log.md         | Last 10 entries (~100 lines) |
| lessons-learned.md      | Last 5 entries (~50 lines) |
| prd.md                  | ~150 lines (key sections) |
| ux/design-system.md     | ~100 lines (tokens + component list) |
| sprints/active/*.yaml   | Full all files (typically small) |
| sprints/completed/*.yaml| Last 5 files (velocity history) |

### Large Document Handling

If a document exceeds the budget:
1. Read the table of contents or section headers first.
2. Load only the sections relevant to the current task.
3. Note which sections were skipped in case they become relevant.

## Context Loading Checklist

Before invoking a subagent or starting a phase, verify:

- [ ] All required documents from the mapping table have been loaded.
- [ ] Missing required documents have been flagged to the user.
- [ ] Optional documents have been loaded where they exist.
- [ ] Total loaded context is within budget guidelines.
- [ ] The spec/story ID has been identified and is consistent.

## Cross-Session Context

When starting a new session that continues previous work:
1. Read `.forge/knowledge/decision-log.md` (last 10 entries) to understand
   recent decisions.
2. Read `.forge/knowledge/lessons-learned.md` (last 5 entries) to avoid
   repeating mistakes.
3. Check `.forge/sprints/active/*.yaml` to understand current active sprints.
4. These provide continuity across session boundaries.
