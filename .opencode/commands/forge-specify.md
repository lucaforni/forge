---
description: "Create a feature specification with requirements, user stories, and acceptance criteria"
agent: forge-pm
subtask: true
model: github-copilot/claude-opus-4.6
---

# Feature Specification

You are handling `/forge-specify` to create a feature specification for a
Feature, Epic, or Product track workflow.

## Arguments

The user's feature description: $ARGUMENTS

## Context Loading

Before starting, read the following upstream documents if they exist:

1. `.forge/constitution.md` -- governance constraints
2. `.forge/architecture/architecture.md` -- existing architecture
3. `.forge/product/prd.md` -- product requirements (if Epic/Product track)
4. `.forge/knowledge/decision-log.md` -- prior decisions
5. `.forge/knowledge/adr/` -- scan for relevant ADRs

## Discovery Process

### Step 1: Requirements Discovery

Engage the user in structured requirements discovery:

1. Understand the feature goal and user benefit.
2. Identify the target user personas.
3. Explore functional requirements systematically.
4. Identify non-functional requirements (performance, security, accessibility).
5. Surface edge cases and error scenarios.

Use the `question` tool to ask focused questions. Do NOT ask everything at
once -- work through it conversationally.

### Step 2: Advanced Elicitation (Optional)

After initial discovery, load the `advanced-elicitation` skill and suggest
3 relevant analysis techniques to the user:
- Pre-mortem Analysis (what could go wrong?)
- First Principles (are we solving the right problem?)
- Red Team / Blue Team (how could this be exploited or broken?)
- Socratic Questioning (why do we need this specifically?)
- Constraint Removal (what if we had no constraints?)
- Inversion Analysis (what would make this fail?)

Let the user choose which technique(s) to apply, if any.

### Step 3: Spec Number Assignment

Determine the next available spec number:
1. Scan `.forge/specs/` for existing spec directories.
2. Find the highest NNN number.
3. Assign NNN+1 (zero-padded to 3 digits).
4. Ask the user to confirm or provide a slug name.

Create the directory: `.forge/specs/NNN-slug/`

### Step 4: Spec Authoring

Read the template from `.opencode/templates/spec.md` and create the
specification at `.forge/specs/NNN-slug/spec.md`.

Fill in all sections:
- Overview and objectives
- User stories (As a... I want... So that...) with acceptance criteria
  (Given/When/Then)
- Functional requirements with unique IDs (FR-001, FR-002, ...)
- Non-functional requirements with measurable targets
- Edge cases and error handling
- Data requirements (if applicable)
- API requirements (if applicable)
- Open questions marked with `[NEEDS CLARIFICATION]`
- Constitution compliance check
- Cross-references to upstream documents

### Step 5: Validation

After writing the spec:
1. Verify every user story has acceptance criteria.
2. Verify every FR has a unique ID.
3. Verify NFRs have measurable metrics.
4. Count `[NEEDS CLARIFICATION]` markers and report them.

### Step 6: Summary and Next Steps

Present a summary:
- Number of user stories
- Number of functional requirements
- Number of NFRs
- Number of open questions (`[NEEDS CLARIFICATION]`)
- Constitution compliance status

Recommend next steps:
- If there are `[NEEDS CLARIFICATION]` markers: `/forge-clarify`
- If the feature has UI components or user-facing screens: `/forge-ux`
  to produce personas, user journeys, wireframes, and accessibility specs
  before the technical plan.
- If spec is complete and no UI is involved: `/forge-plan` to create
  the technical plan.
