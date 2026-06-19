---
description: "Create a Product Requirements Document for Epic or Product track"
agent: forge-pm
subtask: true
---

# Product Requirements Document (PRD)

Create a comprehensive PRD for Epic/Product workflows.

## Arguments

`$ARGUMENTS` — description or context.

## Context Loading

1. `.forge/constitution.md`
2. `.forge/product/brief.md` (should exist for Epic/Product)
3. `.forge/architecture/architecture.md`
4. `.forge/knowledge/decision-log.md`
5. `.forge/knowledge/adr/`

If brief missing, warn and suggest `/forge-brief`. Proceed only with user confirmation.

## Process

### 1. Personas

Define 3 primary personas via `question` tool: user types, goals, pain points, technical proficiency, system interaction.

### 2. Requirements Elicitation

Gather by module/area:

| Type | Details |
|---|---|
| Functional | IDs FR-001…, grouped, MoSCoW priority (Must/Should/Could/Won't) |
| Non-Functional | Performance metrics, security, accessibility, scalability |
| User Journeys | End-to-end per persona |
| Success Metrics | KPIs with measurable targets |

### 3. Advanced Elicitation

Load `advanced-elicitation`; apply:
- **Pre-mortem**: What could cause failure?
- **Red Team**: How could requirements be misinterpreted/exploited?

### 4. Risk Assessment

Categories: technical, business, operational, timeline. Each: description, likelihood, impact, mitigation.

### 5. Authoring

Use `.opencode/templates/prd.md`. Write to `.forge/product/prd.md`. Sections:
- Vision/overview (from brief)
- Personas (≥3)
- FRs by module with MoSCoW
- NFRs with measurable targets
- User journeys (≥1 per persona)
- Success metrics/KPIs
- Risk register
- Scope (in/out)
- Constitution compliance
- Cross-refs

### 6. Summary & Next

Report: personas, FRs by priority, NFRs, journeys, risks, constitution status.

Next: `/forge-architecture` · `/forge-analyze` (if architecture exists).
