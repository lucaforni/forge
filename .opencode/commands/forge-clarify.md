---
description: "Review and resolve ambiguities in a feature specification"
agent: forge-pm
subtask: true
model: github-copilot/claude-opus-4.6
---

# Specification Clarification

You are handling `/forge-clarify` to review a feature specification and
resolve any ambiguities or open questions.

## Arguments

Optional spec path or ID: $ARGUMENTS

If no argument is provided, find the most recently modified spec in
`.forge/specs/`.

## Context Loading

1. Read the target spec file (`.forge/specs/NNN-slug/spec.md`).
2. Read `.forge/constitution.md` for governance context.
3. Read any existing plan (`.forge/specs/NNN-slug/plan.md`) if it exists.

## Clarification Process

### Step 1: Identify Ambiguities

Scan the spec for:
1. All `[NEEDS CLARIFICATION]` markers (explicit ambiguities).
2. User stories without acceptance criteria.
3. Requirements without measurable success criteria.
4. Vague language ("should", "might", "could", "usually", "etc.").
5. Missing edge case coverage.
6. Implicit assumptions not stated explicitly.
7. Potential conflicts between requirements.

### Step 2: Structured Questioning

For each ambiguity found:
1. Present it to the user with context.
2. Explain why it matters (what could go wrong if left unclear).
3. Suggest a specific resolution if possible.
4. Use the `question` tool for choices where applicable.

Work through ambiguities one at a time or in small related batches.

### Step 3: Update Spec

After resolving each ambiguity:
1. Remove the `[NEEDS CLARIFICATION]` marker.
2. Replace it with the resolved requirement.
3. Add acceptance criteria where they were missing.
4. Make vague language specific and measurable.

### Step 4: Constitution Compliance

Load the `constitution-compliance` skill and verify the updated spec
against the project constitution:
- Does the spec comply with all relevant articles?
- Are there any tensions between spec requirements and constitution rules?
- If so, surface them to the user for resolution.

### Step 5: Summary

Present a clarification report:
- Number of ambiguities found
- Number resolved
- Number remaining (if any)
- Any new requirements discovered during clarification
- Constitution compliance status

Recommend next steps:
- If all resolved: `/forge-plan` to create the technical plan
- If some remain: schedule another `/forge-clarify` session
