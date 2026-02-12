---
description: "Create a product brief with vision, scope, and stakeholder analysis"
agent: forge-analyst
subtask: true
---

# Product Brief Creation

You are handling `/forge-brief` to create a product brief for an Epic or
Product track workflow.

## Arguments

The user's description: $ARGUMENTS

## Context Loading

Before starting, read the following upstream documents if they exist:

1. `.forge/constitution.md` -- governance constraints
2. `.forge/knowledge/decision-log.md` -- prior decisions
3. `.forge/knowledge/lessons-learned.md` -- past lessons

For brownfield projects, also scan the existing codebase structure to
understand current state.

## Discovery Process

### Step 1: Initial Understanding

Based on the user's description, explore the codebase and gather context:
- What problem is being solved?
- Who are the stakeholders?
- What exists today (if brownfield)?

### Step 2: Structured Discovery

Use the `question` tool to ask the user about:
1. **Vision**: What does success look like?
2. **Problem statement**: What pain points exist today?
3. **Target users/stakeholders**: Who benefits?
4. **Scope boundaries**: What is explicitly OUT of scope?
5. **Known constraints**: Technical, timeline, budget, regulatory?
6. **Success metrics**: How will we measure success?
7. **Risks**: What could go wrong?

Ask these in focused batches, not all at once.

### Step 3: Scope Assessment

Load the `scope-detection` skill and evaluate:
- Estimated complexity (files, tasks, dependencies)
- Recommended track (should be Epic or Product for briefs)
- If the scope is smaller than Epic, suggest `/forge-specify` instead

### Step 4: Brief Authoring

Read the template from `.opencode/templates/product-brief.md` and create
the product brief at `.forge/product/brief.md`.

Fill in all sections:
- Project name and vision statement
- Problem statement with evidence
- Stakeholder analysis
- Scope assessment (in-scope / out-of-scope)
- Known risks and constraints
- Success metrics
- Recommended next steps

### Step 5: Summary

Present a summary of the brief to the user and recommend the next step:
- If Product track: `/forge-prd` to create the full PRD
- If Epic track: `/forge-prd` or `/forge-specify` depending on scope
