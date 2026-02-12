---
description: "Create or update an Architecture Decision Record"
agent: forge-architect
subtask: true
model: github-copilot/claude-opus-4.6
---

# Architecture Decision Record

You are handling `/forge-adr` to create or update an Architecture Decision
Record (ADR). ADRs document significant technical decisions with context,
options, and consequences.

## Arguments

Decision topic or existing ADR path: $ARGUMENTS

- If a topic is provided, create a new ADR.
- If an existing ADR path is provided, update its status.
- If no argument, ask the user what decision needs to be recorded.

## Context Loading

1. Read `.forge/constitution.md` -- governance constraints.
2. Scan `.forge/knowledge/adr/` -- all existing ADRs to check for conflicts.
3. Read `.forge/knowledge/decision-log.md` -- session-level decisions.
4. Read `.forge/architecture/architecture.md` -- if exists, for context.

## ADR Creation Process

### Step 1: Context Gathering

Understand the decision context:
1. What is the problem or question?
2. What constraints exist (technical, business, timeline)?
3. What has been tried or considered before?
4. Are there existing ADRs that relate to or conflict with this decision?

Use the `question` tool for structured input.

### Step 2: Options Analysis

Identify at least 3 options and analyze each:
1. **Option description**: What is the approach?
2. **Pros**: What are the benefits?
3. **Cons**: What are the drawbacks?
4. **Effort**: Rough implementation effort (Low/Medium/High).
5. **Risk**: Key risk of this option.

### Step 3: Constitution Compliance

Load the `constitution-compliance` skill and check each option against
relevant constitution articles:
- Does Option A comply with Article 2 (Technology Stack)?
- Does Option B comply with Article 3 (Architecture Patterns)?
- Flag any option that would violate the constitution.

### Step 4: Decision

Ask the user for their decision:
1. Present options summary in a comparison table.
2. Highlight the recommended option with rationale.
3. Use the `question` tool for selection.
4. Record the rationale for the choice.

### Step 5: ADR Numbering

1. Scan `.forge/knowledge/adr/` for existing ADRs.
2. Find the highest number.
3. Assign the next number (zero-padded to 3 digits).

### Step 6: ADR Authoring

Read the template from `.opencode/templates/adr.md` and create the ADR at
`.forge/knowledge/adr/NNN-slug.md`.

Include:
- Status: `Accepted` (default for new ADRs)
- Context: The problem and constraints
- Options: At least 3 with full analysis
- Decision: The chosen option with rationale
- Consequences: Positive, negative, and neutral
- Constitution alignment: Which articles are relevant
- Related ADRs: Links to any related decisions

### Step 7: Decision Log Update

Append a summary entry to `.forge/knowledge/decision-log.md`:

```markdown
### ADR-NNN: [Title]
- **Date**: YYYY-MM-DD
- **Decision**: [Summary of chosen option]
- **Rationale**: [Key reasons]
- **Impact**: [What this affects]
```

## ADR Status Updates

If updating an existing ADR:
- `Deprecated`: Mark as deprecated with reason and date.
- `Superseded`: Mark as superseded, reference the new ADR.
- The ADR lifecycle: `Proposed -> Accepted -> [Deprecated | Superseded]`
