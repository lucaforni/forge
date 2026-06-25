# QA Checklist Template

> **Target**: Frontend pattern library
> **Each pattern extends this checklist with its own specific items.**
> **Usage**: forge-reviewer verifies each item. All must pass before merge.

---

## 1. Structure & Layout

### 1.1 Base Markup
- [ ] **Semantic HTML**: `main`, `nav`, `aside`, `section`, `article` used correctly (not all divs)
- [ ] **Heading hierarchy**: h1 → h2 → h3 (no skips, no multiple h1s)
- [ ] **Landmarks**: Every page has `<main>`, every navigation has `<nav>`
- [ ] **Container**: `max-w-7xl mx-auto` or correct layout token
- [ ] **Responsive works** at 320px, 768px, 1024px, 1440px (no horizontal overflow)

### 1.2 Design Token Compliance
- [ ] **No hardcoded colors**: every color is a token (bg-primary, text-muted-foreground, etc.)
- [ ] **No arbitrary spacing**: every padding/margin/gap uses spacing token or Tailwind scale
- [ ] **No invented border-radius**: use `rounded-md`, `rounded-lg`, etc.
- [ ] **No invented font-size**: use tokens `text-base`, `text-sm`, etc.
- [ ] **No custom shadows**: use `shadow-sm`, `shadow-md`, etc.
- [ ] **No `!important`** except in documented exceptional cases

---

## 2. States

### 2.1 Loading State
- [ ] **Skeleton** present (not spinner for content, never bare "Loading..." text)
- [ ] **Skeleton matches** the final layout (same structure, not generic block)
- [ ] **Skeleton has animation** (animate-pulse or shine)
- [ ] **Smooth transition** from skeleton to content (no layout shift)

### 2.2 Empty State
- [ ] **First visit** (no data): title + description + primary CTA "Create/New/Start"
- [ ] **Filtered empty** (active filters, 0 results): "No results" + "Clear filters"
- [ ] **After action** (e.g. deleted everything): message + option to go back

### 2.3 Error State
- [ ] **Clear message**: what happened (not just "Error")
- [ ] **Retry button**: retry the failed operation
- [ ] **Does not lose context**: inline error (no full page replacement, except crash)
- [ ] **Technical details**: collapsible (not required upfront but accessible)

### 2.4 Edge Cases
- [ ] **Very long data**: title/text-overflow ellipsis (doesn't break layout)
- [ ] **Null/undefined data**: handled without crash (optional chaining, fallback UI)
- [ ] **Very long text**: wrap handled, no overflow
- [ ] **Images not loaded**: fallback/placeholder, no broken image
- [ ] **Slow network / offline**: visual indication, graceful degradation

---

## 3. Accessibility (WCAG 2.1 AA)

### 3.1 Perceivable
- [ ] **All images have `alt`** (decorative → `alt=""`)
- [ ] **Color not the only information carrier** (e.g. errors have icon + text, not just red border)
- [ ] **Text contrast ≥ 4.5:1** (body) / **≥ 3:1** (large text ≥ 18px bold)
- [ ] **Interactive component contrast ≥ 3:1** (input borders, focus ring)
- [ ] **Text resizable to 200%** without content loss
- [ ] **No flashing element > 3/sec**

### 3.2 Operable
- [ ] **Everything reachable via TAB** in logical order (visual = tab order)
- [ ] **No keyboard trap** (modals: focus trap, ESC releases)
- [ ] **Skip navigation link** present at page/layout level (not required per-component, but verify it's not removed by the pattern)
- [ ] **Focus ring visible** on all interactive elements
- [ ] **Touch target ≥ 44×44px** on mobile
- [ ] **Time limits** not imposed (or user can extend/disable)

### 3.3 Understandable
- [ ] **All inputs have visible label** (never placeholder only)
- [ ] **Required fields indicated** beyond color (e.g. asterisk + label "(required)")
- [ ] **Errors identify the field** + describe the problem
- [ ] **Navigation and behavior** consistent across pages

### 3.4 Robust
- [ ] **Valid HTML** (landmark, heading, list structures correct)
- [ ] **ARIA roles correct** (dialog, tabpanel, alert, etc.)
- [ ] **aria-live** for dynamic updates (toast, errors, loading)
- [ ] **Form label → input associations** via `htmlFor`/`id` or `aria-labelledby`

---

## 4. Interactivity

- [ ] **Keyboard navigation** complete: Tab, Enter, Esc, Arrow keys where applicable
- [ ] **Hover states** present on every clickable element
- [ ] **Focus states** visible on every interactive element
- [ ] **Active/pressed states** present
- [ ] **Disabled states** visual + `aria-disabled`
- [ ] **Click outside closes** (popover, dialog, sheet) where appropriate
- [ ] **No console errors** (React, API, accessibility)

---

## 5. Performance & Assets

- [ ] **No circular imports** between components
- [ ] **No useEffect without dependencies** (except intentional mount)
- [ ] **React.memo used only when necessary** — verify with profiler that the component has expensive re-renders (React 19+ with React Compiler makes manual `memo` often unnecessary)
- [ ] **Images lazy loaded** (next/image or loading="lazy")
- [ ] **No unused packages** in imports
- [ ] **Bundle splitting** for routes (next/dynamic or React.lazy for heavy components)

---

## 6. React Best Practices

- [ ] **`'use client'` only where needed** (hooks, events, client state)
- [ ] **No hooks called conditionally** (always top-level)
- [ ] **Derived state**: use `useMemo` not `useState` for computed values
- [ ] **Stable callbacks**: `useCallback` for functions passed to child components
- [ ] **Clean effects**: cleanup in `useEffect` (abort controller, unsubscribe)
- [ ] **Error Boundary**: at least one global + one per critical section
- [ ] **Suspense**: boundary for sections that load async data

---

## 7. Tests (where implemented)

- [ ] **Unit tests** for pure functions, hooks, schemas
- [ ] **Component tests** for each state (loading, populated, empty, error)
- [ ] **Integration tests** for critical flows
- [ ] **Tests cover edge cases** (null input, empty array, API error)
- [ ] **No false positive tests** — test behavior, not implementation:
  - [ ] Test asserts on rendered output (`screen.getByText`, `screen.getByRole`), not on component internals
  - [ ] Test passes after a non-behavioral refactor (rename variable, extract function)
  - [ ] Test fails if user-observable behavior breaks

---

## 8. Pattern-Specific Checklist

> Each pattern MUST extend this section with at least 3 specific items.

Example for Data Table:
```
- [ ] Sorting: click header sorts asc/desc/toggle
- [ ] Pagination: page in URL, back button works
- [ ] Selection: header checkbox selects/deselects all
```

---

## Template to Copy for New Patterns

> **IMPORTANT**: The 7 baseline sections (§1–§7) are INHERITED from this template.
> In the pattern file indicate which are verified: `[INHERITED]` or `[PATTERN-SPECIFIC OVERRIDE]`.
> The sections below are **additional** — they do not replace the baselines.

```markdown
> **Extends**: [qa-checklist-template.md](../qa-checklist-template.md) §1–§7.
> Verify baseline sections FIRST, THEN pattern-specific items.

## QA Checklist: Pattern [NAME]

### Pattern-Specific
- [ ] [item 1]
- [ ] [item 2]
- [ ] [item 3]
- [ ] [item 4]
- [ ] [item 5]

### States Verified
- [ ] [state 1]: [what to check]
- [ ] [state 2]: [what to check]
- [ ] [state 3]: [what to check]

### Pattern-Specific Accessibility
- [ ] [pattern-specific a11y requirement]

### Data Flow
- [ ] [specific data flow requirement]
```
