---
description: "Create a Product Requirements Document for Epic or Product track"
agent: forge-pm
subtask: true
model: github-copilot/claude-opus-4.6
---

# Product Requirements Document (PRD)

You are handling `/forge-prd` to create a comprehensive PRD for an Epic or
Product track workflow.

## Arguments

The user's description or context: $ARGUMENTS

## Context Loading

Before starting, read the following upstream documents:

1. `.forge/constitution.md` -- governance constraints
2. `.forge/product/brief.md` -- product brief (should exist for Epic/Product)
3. `.forge/architecture/architecture.md` -- existing architecture (if any)
4. `.forge/knowledge/decision-log.md` -- prior decisions
5. `.forge/knowledge/adr/` -- scan for relevant ADRs

If `.forge/product/brief.md` does not exist, warn the user and suggest
running `/forge-brief` first. Proceed only if the user confirms.

## Discovery Process

### Step 1: Persona Definition

Work with the user to define 3 primary personas:
1. Who are the main user types?
2. What are their goals, pain points, and technical proficiency?
3. How do they interact with the system?

Use the `question` tool for structured input.

### Step 2: Requirements Elicitation

Systematically gather requirements organized by module/feature area:

1. **Functional Requirements**: What the system must do.
   - Assign unique IDs: FR-001, FR-002, ...
   - Group by module or feature area.
   - Include priority (Must/Should/Could/Won't - MoSCoW).
2. **Non-Functional Requirements**: Quality attributes.
   - Performance targets with specific metrics.
   - Security requirements.
   - Accessibility requirements.
   - Scalability requirements.
3. **User Journeys**: End-to-end workflows for each persona.
4. **Success Metrics**: KPIs with measurable targets.

### Step 3: Advanced Elicitation

Load the `advanced-elicitation` skill and apply:
- **Pre-mortem Analysis**: What could cause this product to fail?
- **Red Team**: How could requirements be misinterpreted or exploited?

Present findings to the user and incorporate into the PRD.

### Step 4: Risk Assessment

Identify and categorize risks:
- Technical risks (complexity, unknowns)
- Business risks (market, competition)
- Operational risks (deployment, support)
- Timeline risks (dependencies, resources)

Each risk needs: description, likelihood, impact, mitigation.

### Step 5: PRD Authoring

Read the template from `.opencode/templates/prd.md` and create the PRD at
`.forge/product/prd.md`.

Fill in all sections:
- Product overview and vision (from brief)
- Personas (3 minimum)
- Functional requirements by module with IDs and MoSCoW priority
- Non-functional requirements with measurable targets
- User journeys (at least 1 per persona)
- Success metrics with KPIs
- Risk register
- Scope boundaries (in/out)
- Constitution compliance section
- Cross-references to brief and existing architecture

### Step 6: Summary and Next Steps

Present a PRD summary:
- Number of personas
- Number of functional requirements (by priority)
- Number of non-functional requirements
- Number of user journeys
- Number of identified risks
- Constitution compliance status

Recommend next steps:
- `/forge-architecture` to design the technical architecture
- If architecture exists, `/forge-analyze` to validate PRD consistency
