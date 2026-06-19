---
description: "Review and resolve ambiguities in a feature specification"
agent: forge-pm
subtask: true
---

# Specification Clarification

Resolve ambiguities in a feature spec.

## Arguments

`$ARGUMENTS` — spec path/ID, or empty (most recently modified spec).

## Context Loading

1. Target spec: `.forge/specs/NNN-slug/spec.md`
2. `.forge/constitution.md`
3. `.forge/specs/NNN-slug/plan.md` (if exists)

## Process

### 1. Identify Ambiguities

Scan for:
- `[NEEDS CLARIFICATION]` markers
- User stories without ACs
- Requirements without measurable criteria
- Vague language ("should", "might", "could", "usually", "etc.")
- Missing edge cases
- Implicit assumptions
- Conflicting requirements

### 2. Structured Questioning

For each ambiguity:
1. Present with context
2. Explain stakes (what could go wrong)
3. Suggest specific resolution if possible
4. Use `question` tool for choices

Work one at a time or in small related batches.

### 3. Update Spec

- Remove `[NEEDS CLARIFICATION]` markers
- Replace with resolved requirements
- Add missing ACs
- Make vague language specific and measurable

### 4. Constitution Compliance

Load `constitution-compliance` skill; verify updated spec. Surface tensions between spec and constitution.

### 5. Summary

Report: ambiguities found, resolved, remaining, new requirements discovered, constitution status.

Next:
- All resolved + UI/user-facing → `/forge-ux`
- All resolved + no UI → `/forge-plan`
- Some remain → another `/forge-clarify` session
