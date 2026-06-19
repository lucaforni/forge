---
description: "Design system architecture with components, data model, and ADRs"
agent: forge-architect
subtask: true
---

# Architecture Design

Create a system architecture document for Epic/Product workflows.

## Arguments

`$ARGUMENTS` — optional focus area or context.

## Context Loading

1. `.forge/constitution.md` (REQUIRED)
2. `.forge/product/prd.md` (REQUIRED for new arch)
3. `.forge/product/brief.md`
4. `.forge/knowledge/adr/` — scan ALL existing ADRs
5. `.forge/knowledge/decision-log.md`
6. `.forge/architecture/architecture.md` (if updating)

If PRD missing, warn and suggest `/forge-prd`. Proceed only with user confirmation.

## Process

### 1. System Context
External systems/integrations, actors, trust boundaries.

### 2. Component Design
Major components, single-responsibility, interactions/data flow, shared infra (auth, logging, messaging). Use ASCII/Mermaid diagrams.

### 3. Data Model
ER diagram (text/Mermaid), entity definitions, cardinality, storage decisions (database, caching).

### 4. API Surface
API style (REST/GraphQL/gRPC) with rationale, endpoint groups, auth model, versioning.

### 5. Key Decisions

For each significant decision:
1. Create ADR via `.opencode/templates/adr.md`
2. Document ≥3 options with pros/cons
3. Record decision with rationale
4. Check constitution compliance
5. Save to `.forge/knowledge/adr/NNN-slug.md`

Significant: database, auth, API style, framework, deployment model, anything constraining future options.

### 6. Cross-Cutting Concerns
Logging/observability, error handling, security, performance, scalability.

### 7. Constitution Compliance

Load `constitution-compliance` skill; verify Articles 2, 3, 4, 5, 9. Document compliance or justified deviations.

### 8. Authoring

Use `.opencode/templates/architecture.md`. Write to `.forge/architecture/architecture.md`.

### 9. Summary

- Component count
- Entity count
- API endpoint groups
- ADRs created
- Constitution compliance status

Next: `/forge-analyze` (validate vs PRD) · `/forge-sprint` (Epic) · `/forge-specify` (feature specs).
