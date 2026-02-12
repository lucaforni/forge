---
description: "Design system architecture with components, data model, and ADRs"
agent: forge-architect
subtask: true
model: github-copilot/claude-opus-4.6
---

# Architecture Design

You are handling `/forge-architecture` to create a comprehensive system
architecture document for an Epic or Product track workflow.

## Arguments

Optional focus area or context: $ARGUMENTS

## Context Loading

Before starting, read the following upstream documents:

1. `.forge/constitution.md` -- governance constraints (REQUIRED)
2. `.forge/product/prd.md` -- product requirements (REQUIRED for new arch)
3. `.forge/product/brief.md` -- product brief
4. `.forge/knowledge/adr/` -- scan ALL existing ADRs to avoid contradictions
5. `.forge/knowledge/decision-log.md` -- prior decisions
6. `.forge/architecture/architecture.md` -- existing architecture (if updating)

If the PRD does not exist, warn the user and suggest running `/forge-prd`
first. Proceed only if the user confirms.

## Architecture Process

### Step 1: System Context

Define the system boundaries:
1. What are the external systems and integrations?
2. Who/what interacts with the system?
3. What are the trust boundaries?

### Step 2: Component Design

Design the system components:
1. Identify major components/services.
2. Define component responsibilities (single responsibility).
3. Map component interactions and data flow.
4. Identify shared infrastructure (auth, logging, messaging).

Use text-based diagrams (ASCII or Mermaid) for visualization.

### Step 3: Data Model

Design the data layer:
1. Entity-Relationship Diagram (text or Mermaid).
2. Entity definitions with key attributes and types.
3. Relationship cardinality.
4. Data storage decisions (database type, caching strategy).

### Step 4: API Surface

Define the API contracts:
1. API style decision (REST, GraphQL, gRPC) with rationale.
2. Key endpoint groups.
3. Authentication and authorization model.
4. Versioning strategy.

### Step 5: Key Decisions

For each significant architectural decision:
1. Create an ADR using the template from `.opencode/templates/adr.md`.
2. Document at least 3 options with pros/cons.
3. Record the decision with rationale.
4. Check constitution compliance for each decision.
5. Save ADRs to `.forge/knowledge/adr/NNN-slug.md`.

Significant decisions include:
- Database choice
- Authentication strategy
- API style
- Framework selection
- Deployment model
- Any decision that constrains future options

### Step 6: Cross-Cutting Concerns

Address:
- Logging and observability
- Error handling patterns
- Security architecture
- Performance considerations
- Scalability approach

### Step 7: Constitution Compliance

Load the `constitution-compliance` skill and verify the architecture
against each relevant article of the constitution:
- Article 2: Technology Stack alignment
- Article 3: Architecture Patterns compliance
- Article 4: Quality Standards
- Article 5: Security requirements
- Article 9: Operational Requirements

Document compliance or justified deviations for each.

### Step 8: Architecture Authoring

Read the template from `.opencode/templates/architecture.md` and create
the document at `.forge/architecture/architecture.md`.

### Step 9: Summary and Next Steps

Present an architecture summary:
- Number of components
- Number of entities in data model
- Number of API endpoint groups
- Number of ADRs created
- Constitution compliance status

Recommend next steps:
- `/forge-analyze` to validate architecture against PRD
- `/forge-sprint` to begin sprint planning (Epic track)
- `/forge-specify` to create individual feature specs
