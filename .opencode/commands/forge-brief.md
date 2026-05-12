---
description: "Create a product brief with vision, scope, and stakeholder analysis"
agent: forge-analyst
subtask: true
---

# Product Brief Creation

Create a product brief for Epic/Product workflows.

## Arguments

`$ARGUMENTS` — user's description.

## Context Loading

Read if present:
1. `.forge/constitution.md`
2. `.forge/knowledge/decision-log.md`
3. `.forge/knowledge/lessons-learned.md`

For brownfield: scan existing codebase structure.

## Process

### 1. Initial Understanding

Explore codebase and gather context: problem being solved, stakeholders, current state (if brownfield).

### 2. Structured Discovery

Use `question` tool in focused batches:
- **Vision** — what does success look like?
- **Problem** — current pain points
- **Users/Stakeholders** — who benefits?
- **Scope boundaries** — explicit OUT of scope
- **Constraints** — technical, timeline, budget, regulatory
- **Success metrics** — how to measure
- **Risks** — what could go wrong

### 3. Scope Assessment

Load `scope-detection` skill. Evaluate complexity (files, tasks, deps). Recommend track (Epic or Product for briefs). If smaller, suggest `/forge-specify`.

### 4. Authoring

Use `.opencode/templates/product-brief.md`. Write to `.forge/product/brief.md`:
- Project name + vision
- Problem statement with evidence
- Stakeholder analysis
- Scope (in/out)
- Risks and constraints
- Success metrics
- Recommended next steps

### 5. Summary

Present brief summary. Recommend:
- Product track → `/forge-prd`
- Epic track → `/forge-prd` or `/forge-specify` based on scope
