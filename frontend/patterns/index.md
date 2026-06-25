# Pattern Index & Decision Tree

> **Target**: 17 patterns for React + shadcn/ui + Tailwind
> **Status**: In progress · **Roadmap**: See epic E01
> **Purpose**: Given a UI requirement, find the right pattern in < 30 seconds.

---

## Decision Tree

```
WHICH PATTERN TO USE?
│
├── Does the user need to VIEW data?
│   ├── Tabular data, 10+ records, filterable?
│   │   └── → [DATA TABLE](pattern-data-table.md)
│   │
│   ├── Summary data, metrics, trends?
│   │   └── → [DASHBOARD](pattern-dashboard.md) + [KPI CARD](pattern-kpi-card.md)
│   │
│   ├── Detail list with selection?
│   │   └── → [MASTER-DETAIL](pattern-master-detail.md)
│   │
│   ├── Text search + results?
│   │   └── → [SEARCH](pattern-search.md)
│   │
│   └── Continuous feed, social/list-style?
│       └── → [INFINITE SCROLL](pattern-infinite-scroll.md)
│
├── Does the user need to ENTER data?
│   ├── Single form with validation?
│   │   └── → [FORM](pattern-form.md)
│   │
│   ├── Multi-step form / wizard?
│   │   └── → [WIZARD](pattern-wizard.md)
│   │
│   └── Multiple settings (tabs + form)?
│       └── → [SETTINGS PANEL](pattern-settings-panel.md)
│
├── Does the user need to CONFIRM / INTERACT?
│   ├── Confirm an action (e.g. delete)?
│   │   └── → [MODAL FLOW](pattern-modal-flow.md) (AlertDialog)
│   │
│   ├── Destructive action (delete, irreversible, bulk)?
│   │   └── → [CONFIRMATION FLOW](pattern-confirmation.md) (type-to-confirm, countdown, undo)
│   │
│   ├── Side panel for details/form?
│   │   └── → [DRAWER / SHEET](pattern-drawer-panel.md)
│   │
│   └── Quick search + navigation (Cmd+K)?
│       └── → [COMMAND PALETTE](pattern-command-palette.md)
│
├── Does the user need FEEDBACK?
│   ├── Temporary notification (toast)?
│   │   └── → [NOTIFICATION](pattern-notification.md)
│   │
│   ├── Error with recovery?
│   │   └── → [ERROR RECOVERY](pattern-error-recovery.md)
│   │
│   └── Transitory state (loading)?
│       └── → [LOADING SKELETON](pattern-loading-skeleton.md)
│
└── No data to show?
    └── → [EMPTY STATE](pattern-empty-state.md) (always, cross-cutting)
```

---

## Pattern Matrix

| Pattern | Severity | Depends on | States covered | Template |
|---------|----------|-----------|---------------|----------|
| [Data Table](pattern-data-table.md) | Core | Pagination, Select, Badge | 7 (loading, populated, refetching, empty, filtered-empty, error, partial-error) | ✅ |
| [Form](pattern-form.md) | Core | Form, Input, Select, Textarea, Checkbox, Switch | 7 (idle, typing, field-error, submitting, submission-blocked, success, server-error) | ✅ |
| [Search](pattern-search.md) | Core | Command, Input, Badge | 10 (idle, typing, suggestions, searching, results, no-results, filtered-no-results, error, empty-query, selecting) | ✅ |
| [Master-Detail](pattern-master-detail.md) | Core | ScrollArea, Sheet, Tabs | 7 (initial, list-loaded, selecting, detail-loaded, detail-error, list-loading, list-error) | ✅ |
| [Empty State](pattern-empty-state.md) | Core (cross) | Card, Button | 4 (first-visit, filtered, after-action, search-no-results) | ✅ |
| [Dashboard](pattern-dashboard.md) | Dashboard | Card, KPI, (recharts), Table | 6 (loading, populated, refetching, stale, partial-failure, empty) | ✅ |
| [KPI Card](pattern-kpi-card.md) | Dashboard | Card | 4 (loading, populated, stale, error) | ✅ |
| [Loading Skeleton](pattern-loading-skeleton.md) | Dashboard (cross) | Skeleton | 2 (loading, done) | ✅ |
| [Modal Flow](pattern-modal-flow.md) | Interaction | Dialog, AlertDialog | 7 (closed, opening, open, submitting, success, error, dismissing) | ✅ |
| [Drawer / Sheet](pattern-drawer-panel.md) | Interaction | Sheet | 9 (closed, opening, open, loading-content, loaded, editing, submitting, error, closing) | ✅ |
| [Notification](pattern-notification.md) | Interaction | Sonner | 4 (idle, showing, dismissing-paused, stacked) | ✅ |
| [Error Recovery](pattern-error-recovery.md) | Interaction (cross) | Alert, Button | 6 (idle, error, retrying, recovered, retry-failed, escalated) | ✅ |
| [Wizard](pattern-wizard.md) | Advanced | Form, Progress, Tabs | 6 (step-N-idle, step-N-typing, step-N-invalid, submitting, success, server-error) | ✅ |
| [Infinite Scroll](pattern-infinite-scroll.md) | Advanced | — (IntersectionObserver) | 6 (idle, loading-more, all-loaded, empty, error, refetching) | ✅ |
| [Command Palette](pattern-command-palette.md) | Advanced | Command, Dialog | 8 (closed, opening, active, searching, results, no-results, selected, closing) | ✅ |
| [Settings Panel](pattern-settings-panel.md) | Advanced | Tabs, Form, Switch | 5 per-section + 2 page-level | ✅ |
| [Confirmation Flow](pattern-confirmation.md) | Advanced | AlertDialog, Button | 7 Type-to-Confirm + 7 Countdown | ✅ |

---

## Pattern Selection by Use Case

| Situation | Primary Pattern | Secondary Pattern |
|------------|-----------------|-------------------|
| Order list with filters | [Data Table](pattern-data-table.md) | [Empty State](pattern-empty-state.md), [Error Recovery](pattern-error-recovery.md) |
| Create new order | [Form](pattern-form.md) | [Notification](pattern-notification.md), [Error Recovery](pattern-error-recovery.md) |
| Order detail + actions | [Master-Detail](pattern-master-detail.md) | [Drawer / Sheet](pattern-drawer-panel.md) (for inline edit) |
| Sales dashboard | [Dashboard](pattern-dashboard.md) + [KPI Card](pattern-kpi-card.md) | [Loading Skeleton](pattern-loading-skeleton.md), [Empty State](pattern-empty-state.md) |
| Search product in catalog | [Search](pattern-search.md) | [Data Table](pattern-data-table.md), [Empty State](pattern-empty-state.md) |
| New user onboarding | [Wizard](pattern-wizard.md) | [Form](pattern-form.md), [Notification](pattern-notification.md) |
| Delete an item | [Modal Flow](pattern-modal-flow.md) (AlertDialog) | [Notification](pattern-notification.md) (undo option) |
| Profile settings page | [Settings Panel](pattern-settings-panel.md) | [Form](pattern-form.md), [Notification](pattern-notification.md) |
| Infinite news feed | [Infinite Scroll](pattern-infinite-scroll.md) | [Empty State](pattern-empty-state.md), [Error Recovery](pattern-error-recovery.md) |
| Quick navigation (Cmd+K) | [Command Palette](pattern-command-palette.md) | — |
| Generic loading | [Loading Skeleton](pattern-loading-skeleton.md) | [Empty State](pattern-empty-state.md) |
| Generic API error | [Error Recovery](pattern-error-recovery.md) | [Notification](pattern-notification.md) |
| Dangerous action confirmation | [Confirmation Flow](pattern-confirmation.md) | [Modal Flow](pattern-modal-flow.md) |
| Product detail panel | [Master-Detail](pattern-master-detail.md) | Sheet (mobile) |
| Operation completed notification | [Notification](pattern-notification.md) | — |

---

## Pattern Selection by Data Volume

| Volume | Recommended Pattern |
|--------|-------------------|
| 0 records | [Empty State](pattern-empty-state.md) |
| 1-5 records | Card list (custom) |
| 5-20 records | Table (simple, client-side sort) |
| 20-200 records | [Data Table](pattern-data-table.md) (server-side pagination) |
| 200+ records | [Data Table](pattern-data-table.md) + server-side filters + pagination |
| 1000+ records | [Data Table](pattern-data-table.md) + [Infinite Scroll](pattern-infinite-scroll.md) + server-side search |

---

## Pattern Selection by User Intent

| The user wants to… | Pattern |
|----------------|---------|
| …find a specific record | [Search](pattern-search.md) + [Data Table](pattern-data-table.md) |
| …compare multiple records | [Data Table](pattern-data-table.md) (sort + filters) |
| …understand trends / performance | [Dashboard](pattern-dashboard.md) + [KPI Card](pattern-kpi-card.md) |
| …perform an action on a record | [Data Table](pattern-data-table.md) + DropdownMenu |
| …enter structured data | [Form](pattern-form.md) |
| …configure preferences | [Settings Panel](pattern-settings-panel.md) |
| …explore without a specific goal | [Dashboard](pattern-dashboard.md) + [Master-Detail](pattern-master-detail.md) |
| …confirm a risky action | [Confirmation Flow](pattern-confirmation.md) + [Modal Flow](pattern-modal-flow.md) |

---

## New Pattern Checklist

If no existing pattern fits the requirement, create a new one.

- [ ] Add to index (patterns/index.md)
- [ ] Add to the Decision Tree above
- [ ] Add to Pattern Matrix
- [ ] Add to "By Use Case" table
- [ ] Create `pattern-new.md` file with the 9 required sections

**Required sections**:
1. ✅ When to Use (use / NOT use)
2. ✅ shadcn/ui Components
3. ✅ JSX Composition
4. ✅ State Machine (YAML)
5. ✅ Data Flow
6. ✅ TypeScript Types
7. ✅ Accessibility
8. ✅ Responsive
9. ✅ QA Checklist
