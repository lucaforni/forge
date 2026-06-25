# ADR-002: Frontend Pattern Library Architecture

## Status

**Accepted** · 2026-06-24

## Context

FORGE produces inconsistent frontend results. forge-ux generates textual
specifications that Build struggles to translate into usable UIs. The problem
is structural: there is no shared vocabulary of UI patterns to constrain the
solution space and document all states.

## Decision

Create a **Pattern Library** as a set of `.md` documents in
`.forge/frontend/patterns/`, with the following characteristics:

### Structure

```
.forge/frontend/
├── stack-decisions.md     — Framework, libraries, conventions (ONCE)
├── design-system.md       — Tokens + shadcn/ui + Tailwind bindings
└── patterns/
    ├── index.md           — Index + decision tree
    ├── pattern-data-table.md
    ├── pattern-form.md
    └── ...
```

### Pattern Format

Each pattern includes MANDATORY SECTIONS:
1. **When to use / When NOT to use** — selection criteria
2. **Component composition** — which shadcn/ui components, how nested
3. **JSX structure** — layout tree
4. **State machine** — loading, empty, error, filtered-empty, refetching, etc.
5. **Data flow** — React Query keys, URL params, state management
6. **TypeScript types** — Props interface
7. **A11y requirements** — ARIA, keyboard, screen reader
8. **QA checklist** — verifiable by reviewer

### Integration with FORGE Workflow

- `forge-ux` → references patterns by name in the design-spec
- `Build` → loads the pattern `.md` and uses it as a structural reference
- `forge-reviewer` → applies the pattern's QA checklist

### Non-Decisions (deferred)

- Do NOT create pre-built `.tsx` templates (for now)
- Do NOT create visual testing automation
- Do NOT integrate with screenshot comparison

## Consequences

**Positive**:
- Shared vocabulary between specification, implementation, and review
- UI states pre-implemented (not forgotten)
- Objective QA (checklist, not "by eye")
- Reduced review cycles

**Negative**:
- Initial cost of creating patterns (~10-14 days)
- Maintenance required when shadcn/ui changes APIs
- Risk of patterns being too rigid for creative cases

**Mitigations**:
- Pattern Index with "if no pattern fits → forge-ux produces custom spec"
- Patterns are `.md`, easy to update
- Each pattern includes "When NOT to use"
