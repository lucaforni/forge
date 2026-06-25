# E01 Tasks: Frontend Pattern Library

> **Total estimate**: 36 tasks · **Duration**: 10-14 days

---

## Phase 0: Foundation (Tasks 001-005)

### Task 001: stack-decisions.md
- **Files**: `.forge/frontend/stack-decisions.md`
- **Description**: Document the frontend stack ONCE: React 18+, Next.js App Router, shadcn/ui (Radix + Tailwind), React Query/TanStack Query, React Hook Form + Zod, Zustand (client state), Lucide icons.
- **Detail**: Framework exact versions, import conventions, project folder structure, file naming patterns, export patterns.
- **Acceptance**: A `.md` file that a new developer or AI can read to know EXACTLY how to write frontend code.

### Task 002: design-system.md - Tokens
- **Files**: `.forge/frontend/design-system.md`
- **Description**: Define design tokens in CSS custom properties format: colors (primary, secondary, success, warning, error, neutral with 50-950 scale), typography (font-family, size scale, line-height, font-weight), spacing (4px base scale: 1,2,3,4,5,6,8,10,12,16,20,24,32,40,48,64), border-radius, shadows (sm, md, lg, xl).
- **Detail**: For each token, specify (1) CSS value, (2) equivalent Tailwind class, (3) intended use. E.g.: `--color-primary-500: #0066CC` → `bg-primary text-primary border-primary` → "CTAs, links, active states".
- **Acceptance**: Designer/Dev can build any screen using ONLY these tokens, without ever inventing a color or a spacing.

### Task 003: design-system.md - shadcn/ui Component Inventory
- **Files**: `.forge/frontend/design-system.md`
- **Description**: Inventory ALL available shadcn/ui components with: name, Radix primitives used, available variants, when to use, when NOT to use, usage example. 25-30 components.
- **Detail**: Button, Input, Select, Textarea, Checkbox, RadioGroup, Switch, Slider, Label, Form, Card, Table, Dialog, Sheet, Drawer, Popover, Tooltip, DropdownMenu, Command, Badge, Tabs, Accordion, Separator, Skeleton, Avatar, Alert, Toast/Sonner, Pagination, Breadcrumb, ScrollArea.
- **Acceptance**: Complete inventory of all components with usage examples.

### Task 004: pattern-index.md - Decision Tree
- **Files**: `.forge/frontend/patterns/index.md`
- **Description**: Create the pattern index with a decision tree. The tree guides: "If you have a list of 10+ tabular records → Data Table. If you have 1-5 records → Card List. If the user needs to compare → dashboard." Format: textual flowchart + summary table.
- **Detail**: For each pattern: name, one-line description, trigger conditions for selection, link to pattern file.
- **Acceptance**: Given a UI requirement, the decision tree leads to EXACTLY one pattern (or "no pattern fits → custom spec").

### Task 005: QA Checklist Template
- **Files**: `.forge/frontend/qa-checklist-template.md`
- **Description**: Create a cross-cutting QA checklist template that every pattern will extend. Includes:
  - General: contrast, keyboard nav, touch target, responsive (320/768/1024/1440), loading state, error state, empty state.
  - shadcn/ui: correct variants, className patterns followed.
  - React: error boundary, loading fallback, Suspense boundaries.
  - Accessibility: aria-label, role, tabOrder, heading hierarchy.
- **Acceptance**: Complete template that every pattern can inherit and specialize.

---

## Phase 1: Core Patterns (Tasks 006-015)

### Task 006: Pattern - Data Table (spec)
- **Files**: `.forge/frontend/patterns/pattern-data-table.md`
- **Description**: Pattern for server-side tables with filtering, sorting, pagination, multi-row selection.
- **Components**: shadcn/ui Table, Input (search), Select (filters), Badge (states), Button, Pagination, Checkbox (selection), DropdownMenu (row actions).
- **States**: loading (skeleton), populated, empty (no data), filtered-empty (no match), error, refetching (background refresh).
- **Data Flow**: URL params for filters/sorting/page. React Query with keepPreviousData for smooth transition between pages.
- **A11y**: Table with role="grid", arrow key navigation, screen reader announces result count and current page.
- **QA**: 15+ verification points.

### Task 007: Pattern - Data Table (template.md)
- **Files**: `.forge/frontend/patterns/templates/data-table.tsx`
- **Description**: Working React template of the Data Table pattern. Not a generic component but a concrete example (e.g. "Order List") that Build can copy and adapt.
- **Detail**: Typed props, React Query hooks, URL params sync, selection state, sorting state, pagination.
- **Acceptance**: Template that compiles with TypeScript strict mode and shows ALL states in separate files (loading.tsx, empty.tsx, error.tsx, populated.tsx).

### Task 008: Pattern - Form with Validation (spec)
- **Files**: `.forge/frontend/patterns/pattern-form.md`
- **Description**: Pattern for forms with React Hook Form + Zod validation. Fields, client-side validation, error display, submit states.
- **States**: idle, typing (real-time validation), submitting, success, server-error, field-error (per-field).
- **Components**: Form (shadcn/ui wrapper), Input, Select, Textarea, Checkbox, Switch, Button.
- **Specific patterns**: Field array (dynamic list), conditional fields, multi-step form validation.

### Task 009: Pattern - Form with Validation (template.md)
- **Files**: `.forge/frontend/patterns/templates/form-registration.tsx`
- **Description**: Working template of a complex form with all states.
- **Acceptance**: Zod schema, React Hook Form integration, field-level + form-level validation, server error handling.

### Task 010: Pattern - Search + Results (spec)
- **Files**: `.forge/frontend/patterns/pattern-search.md`
- **Description**: Pattern for search with autocomplete, filters, results.
- **States**: idle (initial search), typing (debounce), suggestions (autocomplete dropdown), searching (loading results), results, no-results, error.
- **Components**: Command (autocomplete), Input, Badge (active filters), Card/Table (results).
- **Data Flow**: URL params, React Query with debounce, suggestions cache.

### Task 011: Pattern - Search + Results (template.md)
- **Files**: `.forge/frontend/patterns/templates/search-catalog.tsx`
- **Description**: Working template of a search page.

### Task 012: Pattern - Master-Detail (spec)
- **Files**: `.forge/frontend/patterns/pattern-master-detail.md`
- **Description**: Pattern for selectable list + detail panel (side-by-side on desktop, sheet/drawer on mobile).
- **States**: initial (no selection), loading-detail, detail-loaded, detail-error, selection-changed (transition).
- **Components**: ScrollArea (list), Sheet (mobile detail), Tabs (detail with sections).
- **Data Flow**: URL params for selection, React Query prefetching.

### Task 013: Pattern - Master-Detail (template.md)
- **Files**: `.forge/frontend/patterns/templates/master-detail-orders.tsx`
- **Description**: Working template of client-side master-detail.

### Task 014: Pattern - Empty State (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-empty-state.md`, `templates/empty-states.tsx`
- **Description**: Cross-cutting pattern for ALL empty states. Variants: empty-first-visit (onboarding), empty-filtered (no match), empty-after-action (e.g., deleted everything).
- **Detail**: Each variant with: icon/illustration, title, description, primary CTA, optional secondary CTA.
- **Acceptance**: Template with 3 empty state variants + composition with other patterns.

### Task 015: Review Phase 1
- **Description**: Cross-review of all Phase 1 patterns. Format consistency, completeness, absence of gaps.
- **Verification**: Does every pattern have all 8 mandatory sections? Are cross-references correct? Do templates compile?

---

## Phase 2: Dashboard Patterns (Tasks 016-020)

### Task 016: Pattern - Dashboard (spec)
- **Files**: `.forge/frontend/patterns/pattern-dashboard.md`
- **Description**: Pattern for dashboard pages with KPI row, chart area, detail table.
- **Components**: Card, KPI composition, chart wrapper, Table.
- **States**: loading (skeleton for each zone), populated, partial-failure (some cards OK, others errored), empty (no data), stale (old data, refresh suggested).
- **Data Flow**: React Query with polling/refresh interval. Parallel queries.
- **Layout**: 12-column grid responsive.

### Task 017: Pattern - Dashboard (template.md)
- **Files**: `.forge/frontend/patterns/templates/dashboard-analytics.tsx`
- **Description**: Dashboard template with 4 KPI cards, 2 charts, 1 table.

### Task 018: Pattern - KPI Card (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-kpi-card.md`, `templates/kpi-card.tsx`
- **Description**: Pattern for individual KPI. Value, label, trend (↑↓→), optional sparkline, comparison vs previous period.
- **States**: loading (short skeleton), populated, stale, error.
- **Acceptance**: Template props: label, value, trend, sparklineData, comparisonValue, comparisonLabel, format.

### Task 019: Pattern - Loading Skeleton (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-loading-skeleton.md`, `templates/skeletons.tsx`
- **Description**: Cross-cutting pattern for skeleton screens. Variants for: table, card, form, dashboard, detail-page.
- **Detail**: Each variant with layout that MATCHES final content (not generic skeleton). Pulse/shine animation.
- **Acceptance**: Template with 5+ skeleton variants.

### Task 020: Review Phase 2
- **Description**: Dashboard pattern review.

---

## Phase 3: Interaction Patterns (Tasks 021-026)

### Task 021: Pattern - Modal Flow (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-modal-flow.md`, `templates/modal-confirm-delete.tsx`
- **Description**: Pattern for dialog/modal: confirm, form in modal, feedback.
- **States**: closed, opening (animation), open, submitting, success, error.
- **A11y**: Focus trap, Esc closes, aria-modal, role="dialog".

### Task 022: Pattern - Drawer / Sheet (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-drawer-panel.md`, `templates/drawer-detail.tsx`
- **Description**: Pattern for side Sheet/Drawer. Variants: detail, form, configuration.

### Task 023: Pattern - Notification / Toast (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-notification.md`, `templates/toast-mutations.tsx`
- **Description**: Pattern for notification feedback: success, error, warning, info. Integration with React Query mutations.
- **States**: idle, showing, dismissing, stacked.
- **Components**: Sonner/Toaster.

### Task 024: Pattern - Error Recovery (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-error-recovery.md`, `templates/error-recovery.tsx`
- **Description**: Cross-cutting pattern for errors. Variants: inline-error, full-page-error, toast-error, boundary-error.
- **Detail**: Each variant with: icon, message, collapsible technical details, retry button, fallback action.
- **Acceptance**: Template that integrates with React Error Boundary + React Query error handling.

### Task 025: ADR for Interaction Patterns
- **Description**: Document the unified error handling strategy and notification pattern.
- **Files**: `.forge/knowledge/adr/ADR-003-frontend-error-notification.md`

### Task 026: Review Phase 3

---

## Phase 4: Advanced Patterns (Tasks 027-032)

### Task 027: Pattern - Wizard / Multi-step (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-wizard.md`, `templates/wizard-onboarding.tsx`
- **Description**: Pattern for multi-step flows with progress indicator, per-step validation, temporary save.
- **States**: per-step (idle, valid, invalid, submitting), overall (step-1, step-2, ..., complete).

### Task 028: Pattern - Infinite Scroll (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-infinite-scroll.md`, `templates/infinite-scroll-feed.tsx`
- **Description**: Pattern for infinite loading with Intersection Observer.
- **States**: idle, loading-more, all-loaded, empty, error.

### Task 029: Pattern - Command Palette (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-command-palette.md`, `templates/command-palette.tsx`
- **Description**: Pattern for Cmd+K palette.
- **Components**: shadcn/ui Command, Dialog.

### Task 030: Pattern - Settings Panel (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-settings-panel.md`, `templates/settings-account.tsx`
- **Description**: Pattern for settings pages with tabs + form sections.
- **States**: per-section (idle, saved, saving, error, unsaved-changes).

### Task 031: Pattern - Confirmation Flow (spec + template)
- **Files**: `.forge/frontend/patterns/pattern-confirmation.md`, `templates/confirm-destructive-action.tsx`
- **Description**: Pattern for destructive actions: "Are you sure?" with double confirmation, timeout, undo option.

### Task 032: Review Phase 4

---

## Phase 5: FORGE Integration (Tasks 033-036)

### Task 033: Skill: frontend-pattern-library
- **Files**: `.opencode/skills/frontend-pattern-library/SKILL.md`
- **Description**: New FORGE skill that loads the pattern index, runs the decision tree, and then loads the specific pattern. forge-ux and Build can use it.
- **Detail**: The skill:
  1. Loads `.forge/frontend/stack-decisions.md` and `design-system.md`
  2. Loads `.forge/frontend/patterns/index.md`
  3. Uses the decision tree to select patterns
  4. Loads the specific pattern file
  5. Exposes template path
- **Acceptance**: `forge-ux` and `Build` can load `frontend-pattern-library` and get relevant patterns.

### Task 034: Update forge-ux agent
- **Files**: `.opencode/agents/forge-ux.md`
- **Description**: Update forge-ux to:
  1. Load `frontend-pattern-library` skill when the feature has UI.
  2. In the design-spec, reference patterns by name (e.g. "Pattern: Data Table").
  3. Include pattern-specific states in the spec.
  4. Include the pattern's QA checklist in the spec.
- **Acceptance**: forge-ux includes pattern reference in the design-spec.

### Task 035: Update forge-reviewer for frontend QA
- **Files**: `.opencode/skills/adversarial-review/SKILL.md`
- **Description**: Update the reviewer to include the "Frontend Pattern Compliance" dimension when reviewing frontend code. Verify:
  - Does the code follow the referenced pattern?
  - Are all pattern states implemented?
  - Is the pattern's QA checklist satisfied?
- **Acceptance**: Reviewer generates frontend report with checklist results.

### Task 036: Epic Retrospective + Documentation
- **Files**: `.forge/sprints/retrospectives/E01-retro.md`
- **Description**: Epic retrospective. What worked, what didn't, lessons learned. Update `lessons-learned.md` and `decision-log.md`.
