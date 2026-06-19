---
description: "Create or update an Architecture Decision Record"
agent: forge-architect
subtask: true
---

# Architecture Decision Record

Document significant technical decisions with context, options, consequences.

## Arguments

`$ARGUMENTS`:
- topic → create new ADR
- existing ADR path → update status
- empty → ask user what decision to record

## Context Loading

1. `.forge/constitution.md`
2. `.forge/knowledge/adr/` — scan for conflicts
3. `.forge/knowledge/decision-log.md`
4. `.forge/architecture/architecture.md` (if exists)

## Process

### 1. Context Gathering

Via `question` tool: problem/question, constraints (technical/business/timeline), prior attempts, related/conflicting ADRs.

### 2. Options Analysis

Identify ≥3 options. For each:
- Description (approach)
- Pros / Cons
- Effort (Low/Medium/High)
- Key risk

### 3. Constitution Compliance

Load `constitution-compliance` skill. Check each option vs relevant articles (e.g., Art. 2 Technology, Art. 3 Patterns). Flag violations.

### 4. Decision

Present comparison table. Highlight recommendation with rationale. Use `question` tool for selection. Record rationale.

### 5. Numbering

Scan `.forge/knowledge/adr/`, take max+1 (3 digits).

### 6. Authoring

Use `.opencode/templates/adr.md`. Write to `.forge/knowledge/adr/NNN-slug.md`:
- Status: `Accepted` (default)
- Context: problem, constraints
- Options: ≥3 with full analysis
- Decision: chosen option + rationale
- Consequences: positive, negative, neutral
- Constitution alignment
- Related ADRs

### 7. Decision Log Update

Append to `.forge/knowledge/decision-log.md`:

```markdown
### ADR-NNN: [Title]
- **Date**: YYYY-MM-DD
- **Decision**: [summary]
- **Rationale**: [key reasons]
- **Impact**: [what this affects]
```

## Status Updates

Existing ADR:
- `Deprecated` — mark with reason + date
- `Superseded` — reference new ADR

Lifecycle: `Proposed → Accepted → [Deprecated | Superseded]`
