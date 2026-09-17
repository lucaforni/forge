---
name: frontend-pattern-library
description: Integrates the FORGE Frontend Pattern Library into UX design and implementation workflows. Guides selection of the right UI pattern based on feature requirements, loads design tokens + stack decisions, and provides template references for code generation.
license: MIT
compatibility: opencode
metadata:
  audience: forge-ux, forge
  workflow: forge
---

## Purpose

Bridge the gap between UX specification and frontend implementation by providing
a shared vocabulary of **17 UI patterns** for React + shadcn/ui + Tailwind.
`forge-ux` references patterns by name in the design-spec. The orchestrator loads the
pattern during `/forge-implement` and uses it as a structural reference to generate consistent code.

## When to Load

Load THIS skill BEFORE `/forge-ux` when:
- The feature has **user-facing web UI**
- The stack is React + shadcn/ui + Tailwind (or compatible)

Load AFTER `context-chain` and BEFORE `ux-design`.

## Workflow

### 1. Load Foundation Documents

Read these files (existence-checked, silent if missing):

```
.forge/frontend/stack-decisions.md    — Stack, framework, conventions
.forge/frontend/design-system.md      — Tokens, component inventory, golden rules
```

### 2. Load Pattern Index

Read `.forge/frontend/patterns/index.md` — it contains:

- **Decision Tree**: navigable tree for selecting the right pattern
- **Pattern Matrix**: every pattern with severity, dependencies, states covered
- **Pattern Selection by Use Case**: situation → primary/secondary pattern table
- **Pattern Selection by Data Volume**: guidance based on data volume

### 3. Select Pattern Using the Decision Tree

Given the UI requirement, walk the decision tree:

```
Does the user need to VIEW data?
  ├── Tabular, 10+ records, filterable?  → Pattern: DATA TABLE
  ├── Metrics, trends, KPIs?             → Pattern: DASHBOARD + KPI CARD
  ├── List + detail?                     → Pattern: MASTER-DETAIL
  ├── Search + results?                  → Pattern: SEARCH + RESULTS
  └── Continuous feed?                   → Pattern: INFINITE SCROLL

Does the user need to ENTER data?
  ├── Single form?                       → Pattern: FORM + VALIDATION
  ├── Multi-step?                        → Pattern: WIZARD
  └── Settings?                          → Pattern: SETTINGS PANEL

Does the user need to CONFIRM / INTERACT?
  ├── Confirm an action?                 → Pattern: MODAL FLOW
  ├── Destructive action?                → Pattern: CONFIRMATION FLOW
  ├── Side panel?                        → Pattern: DRAWER / SHEET
  └── Quick navigation?                  → Pattern: COMMAND PALETTE

Does the user receive FEEDBACK?
  ├── Transient notification?            → Pattern: NOTIFICATION
  ├── Error with recovery?               → Pattern: ERROR RECOVERY
  └── Transitional state?                → Pattern: LOADING SKELETON

No data?                                 → Pattern: EMPTY STATE (always)
```

### 4. Load the Selected Pattern

Load `.forge/frontend/patterns/pattern-[name].md`

Every pattern has 9 mandatory sections:
1. **When to Use** — precise usage conditions
2. **shadcn/ui Components** — which components and variants
3. **JSX Composition** — layout structure
4. **State Machine** — loading, empty, error, edge cases in YAML
5. **Data Flow** — React Query keys, URL params, cache strategy
6. **TypeScript Types** — props and data interfaces
7. **Accessibility** — ARIA, keyboard, screen reader flow
8. **Responsive** — breakpoint behaviour
9. **QA Checklist** — points the reviewer can verify

### 5. Load the Design System (if specific components are needed)

From `design-system.md`:
- Semantic tokens for colour, spacing, typography
- Component inventory with variants and when to use them
- Component composition rules

## Output for forge-ux

In the design-spec, INCLUDE:

```
### Pattern Reference
Pattern: DATA TABLE
Source: .forge/frontend/patterns/pattern-data-table.md

Selected by: Order list with 20+ records, filter by status,
             sort by date, server-side pagination

Template: .forge/frontend/patterns/templates/data-table.tsx

States to implement:
  - loading (skeleton table)
  - populated (sorted by date desc)
  - empty (first visit: "No orders yet" + CTA)
  - filtered-empty (filters active: "Clear filters")
  - error (retry button)
  - refetching (previous data still visible)

QA Checklist (to validate in review):
  - Sorting: clicking a header cycles asc/desc
  - Pagination: page is in the URL
  - Filters: the URL updates
  - Empty states: first-visit vs filtered
```

## Output for implementation (Forge)

When the orchestrator receives a design-spec containing a Pattern Reference:

1. Load the pattern file → understand structure, states, data flow
2. Load the template if it exists → use it as a structural base
3. Adapt it to the specific context (columns, filters, actions)
4. Implement ALL documented states (loading, empty, error, edge cases)
5. Follow design tokens for colour and spacing
6. Verify against the pattern's QA checklist

> **Language:** all generated UI strings must be in English unless the target
> project states otherwise. Some shipped `.tsx` templates still contain
> Italian strings — translate them when you adapt them (tracked in #62).

## Reference Files

Pattern index:       `.forge/frontend/patterns/index.md`
Design system:       `.forge/frontend/design-system.md`
Stack decisions:     `.forge/frontend/stack-decisions.md`
QA template:         `.forge/frontend/qa-checklist-template.md`
Patterns dir:        `.forge/frontend/patterns/`
Templates dir:       `.forge/frontend/patterns/templates/`
