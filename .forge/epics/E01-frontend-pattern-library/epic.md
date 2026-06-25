# E01: Frontend Pattern Library

> **Status**: ✅ Completed · **Owner**: Forge · **Target**: FORGE methodology enhancement
> **Estimated**: 25-35 tasks · **Duration**: 10-14 days · **Track**: Epic

---

## 1. Problem Statement

AI-assisted development produces excellent results on the backend but consistently
poor results on the frontend. The structural causes are:

1. **No shared visual vocabulary** — "a card with a title" means different things to
   the person specifying, the person implementing, and the person reviewing.
2. **No constraints on the solution space** — infinite layout, component, and style possibilities.
3. **UI states rarely specified** — loading, empty, error, edge cases are afterthoughts.
4. **Stack-specific conventions not documented** — shadcn/ui has precise composition
   patterns, but they are never made explicit in specs.
5. **No structured visual QA** — frontend review is done "by eye."

## 2. Solution Vision

A **Pattern Library** of 15 UI patterns for React + shadcn/ui + Tailwind, where each
pattern is an `.md` document that specifies:

- When to use it (and when NOT to)
- shadcn/ui component composition
- JSX structure + layout
- State machine (loading, empty, error, all states)
- Data flow (React Query, URL params, form state)
- TypeScript types
- Accessibility (ARIA, keyboard, screen reader)
- QA checklist

Integrated into the FORGE workflow:
- `forge-ux` produces design-specs that **reference patterns** by name
- `Build` loads the pattern and generates consistent code
- `forge-reviewer` uses the pattern's QA checklist for validation

## 3. Success Criteria

- [ ] All 15 patterns documented with full structure
- [ ] forge-ux references patterns by name in design-specs
- [ ] Build generates frontend code that follows patterns (all states implemented)
- [ ] Frontend review time reduced by 50% (missing states pre-implemented)
- [ ] Design system documented and linked from all patterns

## 4. Phases

| Phase | Pattern | Days | Tasks |
|-------|---------|------|-------|
| 0 | Foundation (design-system, stack, index) | 2-3 | 5 |
| 1 | Core (data-table, form, search, master-detail, empty-state) | 3-4 | 10 |
| 2 | Dashboard (dashboard, kpi-card, loading-skeleton) | 2 | 5 |
| 3 | Interaction (modal, drawer, notification, error-recovery) | 2-3 | 6 |
| 4 | Advanced (wizard, infinite-scroll, command-palette, settings) | 2-3 | 6 |
| 5 | FORGE Integration (skill, agent update, reviewer checklist) | 1-2 | 4 |

## 5. Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Patterns as `.md` reference, not `.tsx` template | Build uses the reference to generate, not copy-paste |
| 2 | Pattern Index with decision tree | Guides the choice of the right pattern based on context |
| 3 | Explicit state machine in every pattern | Machine-parseable → automatically verifiable |
| 4 | QA checklist integral part of the pattern | Reviewer can validate against objective criteria |
| 5 | Design system separate from patterns | Reusable by any pattern |
