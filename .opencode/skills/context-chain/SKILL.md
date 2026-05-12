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

Determine which upstream documents to load for the current FORGE phase. Each
phase's output becomes input for the next. Load the right documents — too few
breaks consistency, too many wastes context.

## Phase-to-Document Mapping

| Phase           | Required                                              | Optional                              |
| --------------- | ----------------------------------------------------- | ------------------------------------- |
| Specify / PRD   | constitution.md                                       | architecture.md, existing specs       |
| UX Design       | specs/NNN/spec.md, constitution.md                    | architecture.md, ux/design-system.md  |
| Architecture    | constitution.md, product/prd.md OR product/brief.md   | knowledge/adr/*.md                    |
| Plan            | constitution.md, specs/NNN/spec.md                    | architecture.md, specs/NNN/design-spec.md, ADRs |
| Clarify         | specs/NNN/spec.md, constitution.md                    | specs/NNN/plan.md                     |
| Analyze         | specs/NNN/spec.md, specs/NNN/plan.md, constitution.md | architecture.md, specs/NNN/design-spec.md |
| Tasks           | specs/NNN/spec.md, specs/NNN/plan.md                  | constitution.md, specs/NNN/design-spec.md |
| Sprint Planning | architecture.md, sprints/active/*.yaml                | epics/*, product/prd.md               |
| Story Creation  | epics/epic-NN/epic.md, architecture.md                | product/prd.md, sprints/active/*.yaml |
| Implementation  | spec.md OR story, constitution.md                     | plan.md OR architecture.md, design-spec.md, ADRs |
| Code Review     | spec.md OR story, constitution.md                     | architecture.md, plan.md, design-spec.md |
| Retrospective   | sprints/active/*.yaml, sprints/completed/*.yaml       | decision-log.md, lessons-learned.md   |
| ADR Creation    | constitution.md, knowledge/adr/*.md                   | architecture.md, decision-log.md      |

## Document Resolution

Paths are relative to `.forge/`. Resolution order:

1. **Explicit path**: use what the user provides.
2. **Most recent**: otherwise pick most recently modified match.
3. **Spec discovery**: scan `.forge/specs/` for the highest-numbered (or most recently modified) directory.

### Missing Documents

- **Critical missing** (constitution.md): warn strongly but proceed; note governance unverified.
- **Phase-blocking missing** (spec for Plan, plan for Tasks): STOP and tell user which command to run first.
- **Optional missing**: note and proceed.

## Context Window Budget

### Loading Priority

1. **Full**: constitution.md (~200-400 lines).
2. **Full**: primary working doc (spec/plan/story).
3. **Key sections**: architecture.md (relevant parts only — data model when planning, API surface when implementing endpoints).
4. **Summaries**: ADRs → Decision + Status only.
5. **Recent**: decision-log.md and lessons-learned.md → last 10 / 5 entries.

### Size Guidelines

| Document                 | Max Budget                                    |
| ------------------------ | --------------------------------------------- |
| constitution.md          | Full                                          |
| Primary spec/plan/story  | Full                                          |
| design-spec.md           | ~150 lines (Wireframes + Components)          |
| user-journey.md          | ~100 lines (happy paths + key edges)          |
| architecture.md          | ~200 lines (key sections)                     |
| Each ADR                 | ~30 lines (Decision + Status)                 |
| decision-log.md          | Last 10 entries (~100 lines)                  |
| lessons-learned.md       | Last 5 entries (~50 lines)                    |
| prd.md                   | ~150 lines (key sections)                     |
| ux/design-system.md      | ~100 lines (tokens + component list)          |
| sprints/active/*.yaml    | Full all files (small)                        |
| sprints/completed/*.yaml | Last 5 files (velocity history)               |

### Large Documents

If a doc exceeds budget: read TOC/section headers first, load only relevant
sections, note skipped sections for later relevance.

## Loading Checklist

Before invoking a subagent / starting a phase:

- [ ] All required documents loaded.
- [ ] Missing required documents flagged to user.
- [ ] Optional documents loaded where they exist.
- [ ] Total context within budget.
- [ ] Spec/story ID identified and consistent.

## Cross-Session Continuity

New session continuing previous work:
1. Read `decision-log.md` last 10 entries.
2. Read `lessons-learned.md` last 5 entries.
3. Check `sprints/active/*.yaml` for current sprints.
