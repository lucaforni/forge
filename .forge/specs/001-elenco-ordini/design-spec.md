# Design Spec: Order List

**Spec**: [001-elenco-ordini/spec.md](../specs/001-elenco-ordini/spec.md)  
**Track**: Feature · **Status**: Draft  
**Platform**: Web SPA (responsive, desktop-first)  
**Viewport targets**: 320px / 768px / 1024px / 1440px  
**Navigation context**: Sidebar (persistent left sidebar)

---

## FR Coverage

| FR | Description | Section |
|----|-------------|---------|
| FR-001 | Orders table (ID, Cliente, Stato, Totale, Data) | Wireframes §1, Component: DataTable |
| FR-002 | Ricerca testuale con debounce 300ms | Component: SearchInput, Wireframes §1 |
| FR-003 | Filter by order status (select) | Component: StatusFilter, Wireframes §1 |
| FR-004 | Sort by column | Component: DataTable — sort |
| FR-005 | Server-side pagination (20/page) | Component: Pagination |
| FR-006 | Multi-row selection with checkboxes | Component: DataTable — selection |
| FR-007 | Bulk action "Delete selected" with confirmation | Pattern: ConfirmationFlow, Component: BulkActionBar |
| FR-008 | Row actions: Edit, Delete | Component: DropdownMenu |
| FR-009 | Loading state with skeleton | Pattern: DataTable — loading, Wireframes §4 |
| FR-010 | Empty state (first visit) | Pattern: EmptyState — first-visit, Wireframes §2 |
| FR-011 | Filtered-empty state | Pattern: EmptyState — filtered, Wireframes §3 |
| FR-012 | Error state with retry | Pattern: ErrorRecovery, Wireframes §5 |
| FR-013 | Row click → order detail | Component: DataTable — row click |
| FR-014 | URL params per search, status, sort, page | IA §Context Preservation |

---

## Data Inventory

Per `data-presentation` Step 0. Entity and attribute map derived from FR-001–FR-005.

### Entity: Order

| Attribute | Type | Classification | Format | Example | FR |
|-----------|------|---------------|--------|---------|----|
| ID | number | Quantitative (discrete) | Integer, right-aligned | 10423 | FR-001 |
| Cliente | string | Textual | Left-aligned, truncate on overflow | Mario Rossi | FR-001 |
| Stato | enum | Categorical (nominal) | Badge with semantic color | pending | FR-001 |
| Totale | number | Quantitative (continuous) | Currency EUR, right-aligned, 2 decimals | €1.234,50 | FR-001 |
| Data | datetime | Temporal | Locale: `DD/MM/YYYY HH:mm` | 25/06/2026 14:30 | FR-001 |

### Volume & Velocity

| Question | Answer | Design Implication |
|----------|--------|-------------------|
| Records typical | ~2,000 orders | Server-side pagination 20/page → ~100 pages |
| Records max | ~100,000 orders | Search-first approach; never load-all |
| Data freshness | Near real-time (seconds) | Refresh indication, keepPreviousData |
| Change frequency | Continuous (new orders, status changes) | Polling or stale-while-revalidate pattern |

### Density Scenarios

| Scenario | Rows | Characteristics |
|----------|------|----------------|
| Empty (first-visit) | 0 | No orders yet in system |
| Empty (filtered) | 0 | Filters produce no matches |
| Sparse | 1–5 | Narrow filter result |
| Dense (typical) | 20 | Full page of results |
| Dense (max) | 20 | Standard page size |

---

## Information Architecture

```
[App — Sidebar Layout]
├── Dashboard
├── Orders ← [current] ── list/table view
│   └── [Order ID] ── detail view (FR-013, wireframed separately)
│       ├── [Detail] ── tab
│       ├── [Items] ── tab
│       └── [History] ── tab
├── Customers
└── Settings
```

### View Types

| Node | View Type | Entry Points | URL Pattern |
|------|-----------|-------------|-------------|
| Orders (list) | Table + Filters | Sidebar "Orders" | `/orders?search=&status=&sort=Data&order=desc&page=1` |
| Order Detail | Detail page | Click row in table | `/orders/:id` |
| Confirm Delete | Modal dialog | Click "Delete" action | (no URL — overlay) |

### Context Preservation (FR-014)

**Mandatory rules:**

1. **Filters in URL.** Every filter, sort direction, sort column, and page is encoded as query params. Sharing a link reproduces the exact view.
2. **Back returns to same scroll + selection.** `keepPreviousData` (NFR-001) ensures instant back-navigation.
3. **Breadcrumbs** reflect data hierarchy: `Orders > [Order ID]`, not navigation history.
4. **Selection persistence.** Selected rows survive page navigation within the session.
5. **Filter persistence across drill-down.** Going to detail and back does not reset filters.

---

## Pattern Reference

> This section references the 5 patterns from the frontend pattern library
> (`.forge/frontend/patterns/`) used in this spec. Each pattern entry is a
> **contextualized copy** — the canonical state machine and QA checklist live
> in the individual pattern files. Component Specs instantiate these patterns
> with concrete props. Changes to pattern logic should be reflected in the
> shared pattern files at `.forge/frontend/patterns/`.

> **Pattern library index**: `.forge/frontend/patterns/index.md`  
> **Canonical pattern files referenced**:
> - `pattern-data-table.md` — Data Table
> - `pattern-empty-state.md` — Empty State
> - `pattern-notification.md` — Notification (Toast)
> - `pattern-error-recovery.md` — Error Recovery
> - `pattern-confirmation.md` — Confirmation Flow

### Pattern: DATA TABLE

**Purpose**: Display, sort, filter, and select rows from a server-side collection.

**States**:
| State | Visual | When |
|-------|--------|------|
| `default` | Fully rendered table with data rows | Data loaded, ≥ 1 row |
| `empty` | EmptyState component centered | 0 rows (first-visit or post-filter) |
| `loading-initial` | Skeleton rows (5 × matching column layout) | First fetch, no previous data |
| `loading-refresh` | Stale rows visible + subtle top-progress bar | Re-fetch with `keepPreviousData` |
| `error` | ErrorState inline replacing table body | API failure after retries exhausted |
| `sorting` | Active sort column header highlighted + arrow icon | User clicks sortable header |
| `selecting` | Checkboxes toggle, bulk action bar appears | User checks ≥ 1 row |

**State machine**:
```
[initial] → loading-initial → (success → default)
                              (error   → error → retry → loading-refresh → ...)
[default] → sorting   → loading-refresh → default
[default] → selecting → bulk-action-mode
[default] → empty (filtered) → clear-filters → default
[default] → row-click → navigate to detail
```

**QA Checklist**:
- [ ] Sort toggles: none → asc → desc → none (or asc → desc → asc)
- [ ] Sort indicator (arrow) visible on active column only
- [ ] Multi-sort not required (single-column sort per FR-004)
- [ ] Checkbox header toggles all visible rows (not all pages)
- [ ] "Select all across pages" shown when all visible selected but more on other pages
- [ ] Selected row count in bulk bar updates immediately
- [ ] Keyboard: Tab through headers → Enter to sort → Tab to rows → Space to select
- [ ] Screen reader announces sort state: "Data column, sorted ascending"
- [ ] Screen reader announces selection: "3 rows selected"
- [ ] Row hover state (background tint)
- [ ] Column widths: ID (80px), Cliente (flex), Stato (120px), Totale (120px), Data (160px), Azioni (80px)
- [ ] Horizontal scroll below 768px with sticky ID + Azioni
- [ ] `keepPreviousData` prevents layout shift on page change

---

### Pattern: EMPTY STATE

**Purpose**: Guide user when no data is available, with differentiated messaging for first-visit vs filtered-empty.

**States**:

| State | Visual | When |
|-------|--------|------|
| `first-visit` | Illustration + title + description + CTA button | 0 rows, no filters active |
| `filtered-no-match` | Different illustration + title + "Clear filters" link + suggestion | 0 rows, filters active |
| `permission-denied` | Lock icon + explanation + contact CTA | User lacks read access |

**State machine**:
```
[no data] → check filters?
  ├── no filters → first-visit → [CTA: create order]
  └── has filters → filtered-no-match → [clear filters link] → back to default
```

**QA Checklist**:
- [ ] First-visit empty: illustration, title ("No orders"), description ("Start by creating the first order"), CTA button ("New Order")
- [ ] Filtered-empty: different illustration, title ("No results"), description ("No orders match the selected filters"), link ("Clear filters"), optional suggestion ("Try searching with different terms")
- [ ] CTA buttons have `aria-label` matching visible text
- [ ] Empty state has `role="status"` and `aria-live="polite"`
- [ ] Suggestion links keyboard-accessible
- [ ] Empty state does NOT show table headers (table area replaced entirely)

---

### Pattern: NOTIFICATION (Toast)

**Purpose**: Display ephemeral feedback for async operations (delete, bulk action).

**States**:

| State | Visual | When |
|-------|--------|------|
| `success` | Green toast + check icon + message + optional undo CTA | Operation succeeded |
| `error` | Red toast + error icon + message | Operation failed |
| `info` | Blue toast + info icon + message | Informational |
| `entering` | Slide-in from top-right, opacity 0→1 (300ms) | Toast created |
| `exiting` | Slide-out to top-right, opacity 1→0 (300ms) | Auto-dismiss or manual close |

**State machine**:
```
[trigger] → entering → (visible: 5s) → exiting → [removed]
                        [user click close] → exiting → [removed]
                        [user click undo] → exiting + dispatch undo action
```

**QA Checklist**:
- [ ] Auto-dismiss after 5 seconds (configurable)
- [ ] Manual dismiss via X button (keyboard accessible)
- [ ] Undo action available for destructive operations (delete)
- [ ] Stack multiple toasts (max 3 visible, queue rest)
- [ ] No toast on success after undo (undo reverses)
- [ ] `role="status"` and `aria-live="polite"`
- [ ] Focus does NOT move to toast (does not interrupt workflow)
- [ ] Toast is NOT a modal — user can interact with page underneath
- [ ] Stack order: newest at top
- [ ] On `error` toast, include retry CTA when operation is retryable

---

### Pattern: ERROR RECOVERY

**Purpose**: Handle API failures gracefully, offering retry and clear messaging.

**States**:

| State | Visual | When |
|-------|--------|------|
| `api-error` | Inline error block with icon + message + retry button | API returns 4xx/5xx |
| `network-error` | Same block, different message ("No connection") | Network failure detected |
| `partial-failure` | Table shows loaded data + inline banner for failed section | Some data loaded, one endpoint failed |
| `recovering` | Retry button shows spinner, content area dims slightly | Retry in progress |
| `permission-denied` | EmptyState variant with lock icon | 403 response |

**State machine**:
```
[fetch] → api-error → retry → loading-refresh → (success → default)
                                                  (error → api-error)
[fetch] → network-error → retry → loading-refresh → ...
[multi-fetch] → partial-failure → retry-individual → loading-refresh → ...
```

**QA Checklist**:
- [ ] Error message is human-readable (not technical JSON/status code)
- [ ] Tech details available behind expandable "Technical details" for debugging
- [ ] Retry button has `aria-label="Retry loading orders"`
- [ ] Auto-retry max 3 times, then show manual retry only
- [ ] Network errors distinguished from server errors in messaging
- [ ] Error block has `role="alert"` and `aria-live="assertive"`
- [ ] Error does NOT replace page chrome (sidebar, header remain visible)
- [ ] On partial failure: loaded data visible + banner "Some data could not be loaded"
- [ ] Keyboard focus moves to error block on error (so SR announces it)

---

### Pattern: CONFIRMATION FLOW

**Purpose**: Prevent accidental destructive actions by requiring explicit user confirmation.

**States**:

| State | Visual | When |
|-------|--------|------|
| `idle` | (not visible) | No confirmation needed |
| `confirming` | Modal dialog overlay + backdrop | User clicked destructive action |
| `processing` | Dialog buttons disabled, spinner on confirm button | Delete request in flight |
| `success` | Dialog closes, toast appears | Delete succeeded |
| `error` | Dialog stays open, error inline message | Delete failed |

**State machine**:
```
[trigger: click delete] → confirming
  ├── [confirm] → processing → (success → close + toast)
  │                             (error → error in dialog)
  └── [cancel / Esc / click backdrop] → close → idle
```

**QA Checklist**:
- [ ] Dialog has `role="alertdialog"` and `aria-labelledby` pointing to title
- [ ] Focus trap: Tab cycles within dialog only
- [ ] Esc key dismisses (same as Cancel)
- [ ] Clicking backdrop dismisses (same as Cancel)
- [ ] Cancel button is auto-focused on open (prevents accidental confirm)
- [ ] Confirm button is destructive-styled (red) with `aria-label="Confirm deletion"`
- [ ] Dialog title: "Delete order" (single) / "Delete N orders" (bulk)
- [ ] Dialog body lists affected items (by ID) when bulk
- [ ] Processing state disables both buttons + shows spinner on confirm
- [ ] Error within dialog: inline message "Unable to delete. Retry."
- [ ] After success: focus moves to the row above the deleted one (or first row)
- [ ] Screen reader announces result: "Order 10423 deleted"

---

## Screen Inventory

| # | Screen | Type | Triggered By | Primary Action | FR Ref |
|---|--------|------|-------------|----------------|--------|
| 1 | **Order List** | List/Table (main) | Sidebar "Orders" | Browse, filter, sort, select orders | FR-001–FR-014 |
| 2 | **Delete Confirmation** | Modal dialog | Row action "Delete" or Bulk action "Delete selected" | Confirm or cancel deletion | FR-007, FR-008 |
| 3 | **Order Detail** | Detail page | Click table row | View order details | FR-013 |
| 4 | **Empty (First-visit)** | Full-page empty state | Initial load with 0 orders | CTA to create order | FR-010 |
| 5 | **Empty (Filtered)** | Inline empty state | Filters produce 0 results | Clear filters | FR-011 |
| 6 | **Error State** | Inline error block | API failure | Retry | FR-012 |
| 7 | **Loading State** | Skeleton | Initial data fetch | (wait for data) | FR-009 |

> Screens 1, 4, 5, 6, 7 are variants of the same URL (`/orders`).  
> Screen 2 is an overlay on screen 1.  
> Screen 3 is wireframed as an exit point only (detail page spec in separate story).

---

## Wireframes

### Wireframe 1: Order List — Dense (Default)

```
+------------------------------------------------------------------+
| [# App Logo]    |  ORDERS                              [User ▼] |
|                 |                                                           |
| [Dashboard]     | +-------------------------------------------------------+ |
| [ Orders    ]   | | 🔍 Search by customer...         [Status: All ▼]     | |
| [ Customers ]   | +-------------------------------------------------------+ |
| [ Settings  ]   |                                                         |
|                 | +-------------------------------------------------------+ |
|                 | | Actions: [Delete selected ▼] [Change status ▼]      | |
|                 | |                    [Export selected]              | |
|                 | | 0 selected                                         | |
|                 | +-------------------------------------------------------+ |
|                 |                                                         |
|                 | +-------------------------------------------------------+ |
|                 | | ID ▲ | Customer     | Status         | Total    | Date | |
|                 | |------+-------------+---------------+-----------+------| |
|                 | | ☐ 10423 | Mario Rossi    | ● Processing  | € 1.234 | 25/06 | |
|                 | | ☐ 10422 | Anna Bianchi   | ● Completed   | € 2.500 | 24/06 | |
|                 | | ☐ 10421 | Luca Verdi     | ⬤ Pending     | € 890   | 24/06 | |
|                 | | ☐ 10420 | Sara Neri      | ● Cancelled   | € 150   | 23/06 | |
|                 | | ... 20 rows ...                                      | |
|                 | +-------------------------------------------------------+ |
|                 |                                                         |
|                 | +-------------------------------------------------------+ |
|                 | | 1–20 of 2,347    [<] [1] [2] [3] ... [118] [>]      | |
|                 | +-------------------------------------------------------+ |
|                 |                                                         |
|                 | Last update: a few seconds ago     [Export all] |
+------------------------------------------------------------------+

Data binding:
  - Row source: Order entity (FR-001), GET /api/orders
  - Columns: ID, Cliente (string), Stato (enum), Totale (currency: EUR), Data (datetime)
  - Default sort: Data desc (most recent first)
  - Default filter: none
  - Page size: 20
  - Selection model: multi (checkbox)
  - Drill-down: click row → /orders/:id

Interactive elements:
  - Search input (FR-002)
  - Status filter dropdown (FR-003)
  - Column headers: Cliente, Stato, Totale, Data clickable for sort (FR-004). ID not sortable.
  - Row checkbox (FR-006)
  - Header checkbox (select all visible)
  - Row click → navigate to detail (FR-013)
  - Row actions menu (⋯) → Edit | Delete (FR-008)
  - Bulk action bar (FR-007, bulk actions)
  - Pagination controls (FR-005)
  - Export buttons
```

### Wireframe 2: Empty — First Visit

```
+------------------------------------------------------------------+
| [# App Logo]    |  ORDERS                              [User ▼] |
|                 |                                                           |
| [Dashboard]     |                                                           |
| [ Orders     ]   |              ┌─────────────────────────────┐              |
| [ Customers ]   |              │     📦 (illustration)       │              |
| [ Settings  ]   |              │                             │              |
|                 |              │   **No orders**             │              |
|                 |              │                             │              |
|                 |              │   You haven't created any   │              |
|                 |              │   orders yet. Start by      │              |
|                 |              │   creating the first order. │              |
|                 |              │                             │              |
|                 |              │   [ + New Order ]           │              |
|                 |              └─────────────────────────────┘              |
|                 |                                                           |
+------------------------------------------------------------------+

Pattern: EmptyState (first-visit)
State: empty
FR: FR-010
Accessibility: role="status", aria-live="polite"
```

### Wireframe 3: Empty — Filtered

```
+------------------------------------------------------------------+
| [# App Logo]    |  ORDERS                              [User ▼] |
|                 |                                                           |
| [Dashboard]     | +-------------------------------------------------------+ |
| [ Orders     ]   | | 🔍 Mario              [Status: Completed ▼]          | |
| [ Customers ]   | | Active filters: [Customer: "Mario"] [Status: Completed]| |
| [ Settings  ]   | |                              [Clear all filters]| |
|                 | +-------------------------------------------------------+ |
|                 |                                                           |
|                 |              ┌─────────────────────────────┐              |
|                 |              │     🔍 (illustration)      │              |
|                 |              │                             │              |
|                 |              │   **No results**            │              |
|                 |              │                             │              |
|                 |              │   No orders match the       │              |
|                 |              │   selected filters.         │              |
|                 |              │                             │              |
|                 |              │   [Clear filters]           │              |
|                 |              │   Try searching with        │              |
|                 |              │   different terms or        │              |
|                 |              │   remove some filters.      │              |
|                 |              └─────────────────────────────┘              |
|                 |                                                           |
+------------------------------------------------------------------+

Pattern: EmptyState (filtered-no-match)
State: empty
FR: FR-011
Accessibility: role="status", aria-live="polite"
```

### Wireframe 4: Loading State (Initial)

```
+------------------------------------------------------------------+
| [# App Logo]    |  ORDERS                              [User ▼] |
|                 |                                                           |
| [Dashboard]     | +-------------------------------------------------------+ |
| [ Orders     ]   | | ████████████████████████████████████████████████████  | |
| [ Customers ]   | | ■■■■■■■■■■■■■■  （skeleton search bar shape）        | |
| [ Settings  ]   | +-------------------------------------------------------+ |
|                 |                                                         |
|                 | +-------------------------------------------------------+ |
|                 | | ID   | Customer   | Status     | Total   | Date       | |
|                 | | ░░░░ | ░░░░░░░░░ | ░░░░░░░░░ | ░░░░░░░░ | ░░░░░░░░░░ | |
|                 | | ░░░░ | ░░░░░░░░░ | ░░░░░░░░░ | ░░░░░░░░ | ░░░░░░░░░░ | |
|                 | | ░░░░ | ░░░░░░░░░ | ░░░░░░░░░ | ░░░░░░░░ | ░░░░░░░░░░ | |
|                 | | ░░░░ | ░░░░░░░░░ | ░░░░░░░░░ | ░░░░░░░░ | ░░░░░░░░░░ | |
|                 | | ░░░░ | ░░░░░░░░░ | ░░░░░░░░░ | ░░░░░░░░ | ░░░░░░░░░░ | |
|                 | | ░░░░ | ░░░░░░░░░ | ░░░░░░░░░ | ░░░░░░░░ | ░░░░░░░░░░ | |
|                 | | ░░░░ | ░░░░░░░░░ | ░░░░░░░░░ | ░░░░░░░░ | ░░░░░░░░░░ | |
|                 | | 5 skeleton rows with shimmer animation                | |
|                 | +-------------------------------------------------------+ |
|                 |                                                         |
|                 | +-------------------------------------------------------+ |
|                 | | ░░░░░░░░░░    [<] [░] [░] [░] ... [░] [>]           | |
|                 | +-------------------------------------------------------+ |
|                 |                                                         |
+------------------------------------------------------------------+

Pattern: DataTable (loading-initial)
State: loading-initial
FR: FR-009
Accessibility: aria-busy="true", aria-label="Loading orders in progress"
Note: Skeleton matches exact column widths defined in QA Checklist
```

### Wireframe 5: Error State

```
+------------------------------------------------------------------+
| [# App Logo]    |  ORDERS                              [User ▼] |
|                 |                                                           |
| [Dashboard]     | +-------------------------------------------------------+ |
| [ Orders     ]   | | 🔍 Search by customer...         [Status: All ▼]     | |
| [ Customers ]   | +-------------------------------------------------------+ |
| [ Settings  ]   |                                                           |
|                 |   ┌─────────────────────────────────────────────┐         |
|                 |   │  ⚠️ **Unable to load orders**                │         |
|                 |   │                                              │         |
|                 |   │  An error occurred while loading             │         |
|                 |   │  the orders.                                 │         |
|                 |   │                                              │         |
|                 |   │  [🔄 Retry]    [Technical details ▾]         │         |
|                 |   │                                              │         |
|                 |   │  › Server connection error                   │         |
|                 |   │  Code: ERR_NETWORK                           │         |
|                 |   │  › If the problem persists, contact          │         |
|                 |   │    support.                                  │         |
|                 |   └─────────────────────────────────────────────┘         |
|                 |                                                           |
+------------------------------------------------------------------+

Pattern: ErrorRecovery (api-error)
State: error
FR: FR-012
Accessibility: role="alert", aria-live="assertive"
Tab order: Retry button first focused
```

### Wireframe 6: Delete Confirmation Dialog

```
+------------------------------------------------------------------+
| (Backdrop overlay: semi-transparent black, z-index above sidebar) |
|                                                                   |
|               ┌──────────────────────────────────┐                |
|               │  🗑️ **Delete order**             │                |
|               │                                  │                |
|               │  Are you sure you want to        │                |
|               │  delete order **#10423**         │                |
|               │  (Mario Rossi - € 1.234,00)?     │                |
|               │                                  │                |
|               │  This action cannot be           │                |
|               │  undone.                         │                |
|               │                                  │                |
|               │       [Cancel]    [Delete]       │                |
|               └──────────────────────────────────┘                |
|                                                                   |
+------------------------------------------------------------------+

Bulk variant:
  Title: "Delete 3 orders"
  Body: "Are you sure you want to delete the following 3 orders?"
        "• #10423 - Mario Rossi"
        "• #10422 - Anna Bianchi"
        "• #10421 - Luca Verdi"

Pattern: ConfirmationFlow (confirming)
States covered: confirming, processing, error (inline), success (dismiss + toast)
FR: FR-007, FR-008
Accessibility: role="alertdialog", aria-labelledby="dialog-title", focus trap
```

---

## Component Specs

### Component: DataTable

**Type**: Table  
**Used on screens**: Order List  
**Pattern**: DataTable  
**FR coverage**: FR-001, FR-004, FR-005, FR-006, FR-013

| Property | Value |
|----------|-------|
| Variants | default |
| Sort mode | server-side, single-column |
| Selection | multi (checkbox), session-persistent |
| Page size | 20 (FR-005) |
| Row click | navigates to `/orders/:id` (FR-013) |
| Density | comfortable (48px row height) |

**Slots**:
- `header` — column headers with sort affordance
- `row` — data rows with checkbox + actions menu
- `empty` — EmptyState component
- `loading` — Skeleton component
- `error` — ErrorRecovery component

**Columns**:

| Column | Sortable | Width | Alignment | Format |
|--------|----------|-------|-----------|--------|
| ID | No | 80px | right | Integer |
| Cliente | Yes | flex | left | String, truncated |
| Stato | Yes | 120px | center | Badge (semantic color) |
| Totale | Yes | 120px | right | Currency EUR |
| Data | Yes (default) | 160px | left | `DD/MM/YYYY HH:mm` |
| Azioni | No | 80px | center | DropdownMenu button |

**States**: default · empty · loading-initial · loading-refresh · error · sorting · selecting

**Interaction**:
- Click header → toggle sort (asc → desc → none); other columns reset
- Click row → navigate (full row clickable, not just link)
- Checkbox click → toggle selection; Shift+click for range
- Header checkbox → select/deselect all VISIBLE rows
- Select all across pages → shown when all visible selected + more pages exist

**A11y**:
- `role="grid"` with `aria-rowcount` (total server count)
- Sort buttons: `aria-sort="ascending|descending|none"`
- Checkboxes: `aria-label` = row identifier
- Selection announcement: `aria-live="polite"` — "3 rows selected"
- Row click: keyboard Enter/Space triggers navigation

---

### Component: SearchInput

**Type**: Input  
**Used on screens**: Order List  
**Pattern**: (none — utility component)  
**FR coverage**: FR-002

| Property | Value |
|----------|-------|
| Variants | default |
| Debounce | 300ms client-side (FR-002) |
| Placeholder | "Search by customer..." |
| Icon | Magnifying glass (left) |
| Clear button | X icon (right, visible when has value) |

**States**: default · focused · filled · cleared

**Behavior**:
- On input → debounce 300ms → update URL param `?search=...` → trigger API refetch
- On clear → remove `search` param → refetch unfiltered
- On Enter → immediate (no additional debounce wait)

**A11y**:
- `<label>` visually hidden: "Search by customer"
- `aria-label="Search orders by customer name"`
- Clear button: `aria-label="Clear search"`

---

### Component: StatusFilter

**Type**: Select/Dropdown  
**Used on screens**: Order List  
**Pattern**: (none — simple filter)  
**FR coverage**: FR-003

| Property | Value |
|----------|-------|
| Variants | default |
| Options | All, Pending, Processing, Completed, Cancelled |
| Default | "All" |

**States**: default · active (option selected)

**Behavior**:
- On select → update URL param `?status=...` → trigger API refetch
- Reset on "All" → remove `status` param

**A11y**:
- `<label>` visible: "Status"
- Options have explicit value attributes matching API enum values

---

### Component: Pagination

**Type**: Navigation  
**Used on screens**: Order List  
**Pattern**: (embedded in DataTable)  
**FR coverage**: FR-005

| Property | Value |
|----------|-------|
| Page size | 20 (fixed) |
| Max visible pages | 7 (with ellipsis) |
| Layout | `1–20 of 2,347 [<] [1] [2] [3] ... [118] [>]` |

**States**: default · disabled (first/last page)

**Behavior**:
- Click page number → update URL `?page=N` → API fetch with `keepPreviousData`
- Previous/Next disabled at boundaries
- "1–20 of 2,347" updates dynamically

**A11y**:
- Nav wrapper: `role="navigation" aria-label="Pagination"`
- Page buttons: `aria-label="Page 3"` / `aria-current="page"`
- Previous: `aria-label="Previous page"`
- Next: `aria-label="Next page"`

---

### Component: Checkbox

**Type**: Input  
**Used on screens**: DataTable rows + header  
**Pattern**: (embedded in DataTable)  
**FR coverage**: FR-006

| Property | Value |
|----------|-------|
| Variants | default, indeterminate (header: some selected) |
| States | unchecked, checked, indeterminate, disabled |

**A11y**:
- Row checkbox: `aria-label="Select order #10423"`
- Header checkbox: `aria-label="Select all visible rows"`
- Indeterminate: `aria-checked="mixed"` (programmatic, not native HTML attr)

---

### Component: DropdownMenu (Row Actions)

**Type**: Menu  
**Used on screens**: Order List (last column)  
**Pattern**: (utility)  
**FR coverage**: FR-008

| Property | Value |
|----------|-------|
| Trigger | `⋯` icon button |
| Items | Edit (edit icon), Delete (trash icon, red text) |

**States**: closed, open, item-hover, item-focus

**Behavior**:
- Click `⋯` → open dropdown below row
- Click "Edit" → navigate to `/orders/:id/edit`
- Click "Delete" → open ConfirmationFlow dialog
- Click outside / Esc → close

**A11y**:
- Trigger: `aria-label="Actions for order #10423" aria-haspopup="true"`
- Menu: `role="menu"`
- Items: `role="menuitem"`
- Keyboard: Enter/Space opens, arrow keys navigate, Esc closes

---

### Component: BulkActionBar

**Type**: Toolbar  
**Used on screens**: Order List (above table)  
**Pattern**: (embedded in DataTable selecting state)  
**FR coverage**: FR-007

| Property | Value |
|----------|-------|
| Visibility | Shown when ≥ 1 row selected; hidden when 0 |
| Position | Above table, below filter bar |
| Background | Primary color tint (blue-50) |

**Slots**:
- Selection count: "3 selected"
- Actions: [Delete selected] [Change status ▼] [Export selected]

**States**: hidden (0 selected), visible (≥ 1 selected), processing (bulk action in flight)

**Behavior**:
- "Delete selected" → ConfirmationFlow dialog (bulk variant)
- "Change status" → dropdown: Pending, Processing, Completed, Cancelled
- "Export selected" → download CSV of selected rows
- Deselect all → bar hides

**A11y**:
- `role="toolbar"` with `aria-label="Actions on selected orders"`
- Selection count: `aria-live="polite"`
- Buttons: `aria-label="Delete 3 selected orders"` (dynamic count)

---

### Component: ConfirmationDialog

**Type**: Modal  
**Used on screens**: Overlay on Order List  
**Pattern**: ConfirmationFlow  
**FR coverage**: FR-007, FR-008

| Property | Value |
|----------|-------|
| Variants | single-delete, bulk-delete |
| Width | 480px (max 90vw) |
| Backdrop | Semi-transparent black, click-to-dismiss |

**States**: idle (hidden) · confirming (visible) · processing (buttons disabled + spinner) · error (inline message)

**Behavior**:
- Cancel button auto-focused on open
- Confirm button is destructive (red background)
- Esc / click backdrop / Cancel → close
- Confirm → dispatch delete → processing → (success: close + toast) | (error: inline message)
- On success → focus moves to row above deleted (or first row)

**A11y**:
- `role="alertdialog"` with `aria-labelledby` and `aria-describedby`
- Focus trap: Tab cycles within dialog
- On close: focus returns to trigger element (the delete button clicked)
- Processing state: `aria-busy="true"`

---

### Component: Toast

**Type**: Notification  
**Used on screens**: Order List (overlay, top-right)  
**Pattern**: Notification  
**FR coverage**: FR-007 (post-delete feedback)

| Property | Value |
|----------|-------|
| Variants | success, error, info |
| Position | top-right, z-index above modal |
| Max visible | 3 (queue overflow) |
| Auto-dismiss | 5 seconds |
| Animation | slide-in (300ms), slide-out (300ms) |

**Slots**:
- Icon (check / error / info)
- Message text
- Optional: Undo button (for delete)
- Close button (X)

**States**: entering · visible · exiting · queued

**A11y**:
- `role="status"` with `aria-live="polite"`
- Close button: `aria-label="Close notification"`
- Undo button: `aria-label="Undo deletion"`

---

### Component: Skeleton

**Type**: Loading placeholder  
**Used on screens**: Order List (initial load)  
**Pattern**: DataTable (loading-initial state)  
**FR coverage**: FR-009

| Property | Value |
|----------|-------|
| Rows | 5 |
| Height | 48px per row (matching DataTable row height) |
| Animation | Shimmer (left-to-right gradient sweep, 1.5s cycle) |
| Columns | Same widths as DataTable column spec |

**States**: active · hidden

**Behavior**:
- Rendered inside table body during initial fetch
- Removed when data arrives
- During refresh (`keepPreviousData`): stale rows visible + top progress bar instead

**A11y**:
- `aria-label` on container: "Loading orders in progress"
- `aria-busy="true"`

---

## States to Implement — State Machine Summary

### Per-Pattern State Machines

The states below correspond to the state machines defined in the [Pattern Reference](#pattern-reference) section. Each component implementation must expose these states exactly as documented.

| Pattern | States | Entry | Exit |
|---------|--------|-------|------|
| **DataTable** | `default`, `empty`, `loading-initial`, `loading-refresh`, `error`, `sorting`, `selecting` | URL `/orders` loads | Navigate away, clear filters |
| **EmptyState** | `first-visit`, `filtered-no-match` | 0 rows returned | CTA click, clear filters |
| **Notification** | `entering`, `visible`, `exiting`, `queued` | Action completes | Auto-dismiss, manual close |
| **ErrorRecovery** | `api-error`, `network-error`, `partial-failure`, `recovering` | API fetch fails | Retry succeeds, navigate away |
| **ConfirmationFlow** | `idle`, `confirming`, `processing`, `error`, `success` | Click delete action | Confirm + complete or cancel |

### Screen-Level State Combinations

| Screen State | Applied Patterns | URL |
|-------------|-----------------|-----|
| Default (data loaded) | DataTable (default) | `/orders?page=1&sort=Data&order=desc` |
| Empty (first visit) | EmptyState (first-visit) | `/orders` (no params) |
| Empty (filtered) | DataTable (empty) + EmptyState (filtered-no-match) | `/orders?status=completed&search=xxx` |
| Loading (initial) | DataTable (loading-initial) + Skeleton | `/orders` (any, first load) |
| Loading (refresh) | DataTable (loading-refresh) + top progress bar | `/orders?page=3` (subsequent) |
| Error | DataTable (error) + ErrorRecovery (api-error) | `/orders` (no data) |
| Error (network) | DataTable (error) + ErrorRecovery (network-error) | `/orders` (no data) |
| Partial failure | DataTable (default) + ErrorRecovery (partial-failure) banner | `/orders` (partial data) |
| Selecting | DataTable (selecting) + BulkActionBar | `/orders` (any) |
| Confirming delete | ConfirmationDialog (confirming) overlay on current state | `/orders` (overlay) |

---

## QA Checklist

### Per Pattern (from Pattern Reference)

**DATA TABLE**
- [ ] Sort toggles: asc → desc → none
- [ ] Sort indicator visible on active column only
- [ ] Header checkbox selects all VISIBLE rows
- [ ] "Select all across pages" prompt when all visible selected + more pages exist
- [ ] Selected count in BulkActionBar updates immediately
- [ ] Keyboard: Tab through headers, Enter to sort, Tab to rows, Space to select
- [ ] SR announces sort state (e.g., "Data column, sorted descending")
- [ ] SR announces selection count (e.g., "3 rows selected")
- [ ] Row hover state (light background tint)
- [ ] Column widths as specified
- [ ] Horizontal scroll < 768px with sticky first + last column
- [ ] `keepPreviousData` prevents layout shift on page change

**EMPTY STATE**
- [ ] First-visit: illustration + title + description + CTA button ("New Order")
- [ ] Filtered-empty: different illustration + title + "Clear filters" link + suggestion
- [ ] CTA buttons have `aria-label` matching visible text
- [ ] Empty state has `role="status"` and `aria-live="polite"`
- [ ] Suggestion links keyboard-accessible
- [ ] Empty state replaces table area entirely (no table headers visible)

**NOTIFICATION (TOAST)**
- [ ] Auto-dismiss after 5 seconds (configurable)
- [ ] Manual dismiss via X button (keyboard accessible)
- [ ] Undo action available for destructive operations (delete)
- [ ] Stack max 3 visible toasts, queue rest behind
- [ ] No toast on success after undo (undo reverses)
- [ ] `role="status"` and `aria-live="polite"`
- [ ] Focus does NOT move to toast (non-intrusive)
- [ ] Toast is NOT a modal — page remains interactive
- [ ] Stack newest at top
- [ ] Error toast includes retry CTA for retryable operations

**ERROR RECOVERY**
- [ ] Error message human-readable (no JSON/status code)
- [ ] Tech details behind expandable "Technical details"
- [ ] Retry button with `aria-label="Retry loading orders"`
- [ ] Auto-retry max 3 times, then manual retry only
- [ ] Network errors distinguished from server errors
- [ ] Error block: `role="alert"` + `aria-live="assertive"`
- [ ] Error does NOT replace sidebar, header, or chrome
- [ ] Partial failure: loaded data visible + banner "Some data not loaded"
- [ ] Focus moves to error block on error for SR announcement

**CONFIRMATION FLOW**
- [ ] Dialog: `role="alertdialog"` + `aria-labelledby` + `aria-describedby`
- [ ] Focus trap within dialog (Tab cycles)
- [ ] Esc dismisses (= Cancel)
- [ ] Backdrop click dismisses (= Cancel)
- [ ] Cancel button auto-focused on open (safety)
- [ ] Confirm button destructive-styled (red)
- [ ] Dialog title: "Delete order" / "Delete N orders"
- [ ] Dialog body lists affected items (bulk variant)
- [ ] Processing state disables both buttons + spinner on confirm
- [ ] Error within dialog: inline "Unable to delete. Retry."
- [ ] On success: focus moves to row above deleted (or first row)
- [ ] SR announces result: "Order 10423 deleted"

### Cross-Pattern Regression

- [ ] Delete via row action → ConfirmationFlow → confirm → Toast (success) → row removed from table
- [ ] Delete via bulk action → same flow but bulk variant
- [ ] Empty state + retry after error → error resolves → data loads normally
- [ ] Filter → empty → clear filters → data loads again
- [ ] Sort + page change + selection preserved across navigation (session)
- [ ] URL params survive page refresh (deep link reproduction)
- [ ] All states keyboard-accessible (no mouse-only interactions)

---

## Design Tokens

Since no existing design system was found at `.forge/ux/design-system.md`, the following tokens are defined for this spec. These should be promoted to a shared design system when one is created.

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-500` | `#2563EB` | Primary buttons, links, focus ring |
| `--color-primary-600` | `#1D4ED8` | Primary hover |
| `--color-primary-50` | `#EFF6FF` | Bulk action bar bg |
| `--color-error-500` | `#DC2626` | Destructive buttons, error text |
| `--color-error-600` | `#B91C1C` | Destructive hover |
| `--color-error-50` | `#FEF2F2` | Error block bg |
| `--color-success-500` | `#16A34A` | Success toast, "completed" badge |
| `--color-warning-500` | `#D97706` | "pending" badge |
| `--color-neutral-900` | `#111827` | Body text |
| `--color-neutral-700` | `#374151` | Secondary text |
| `--color-neutral-500` | `#6B7280` | Placeholder, disabled |
| `--color-neutral-300` | `#D1D5DB` | Borders, dividers |
| `--color-neutral-100` | `#F3F4F6` | Table row hover, skeleton bg |
| `--color-white` | `#FFFFFF` | Surface bg |
| `--color-backdrop` | `rgba(0, 0, 0, 0.5)` | Modal backdrop |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-size-xs` | `0.75rem` (12px) | Badge text, metadata |
| `--font-size-sm` | `0.875rem` (14px) | Table cells, form labels |
| `--font-size-base` | `1rem` (16px) | Body, button text |
| `--font-size-lg` | `1.125rem` (18px) | Section titles |
| `--font-size-xl` | `1.25rem` (20px) | Empty state title |
| `--font-size-2xl` | `1.5rem` (24px) | Page title |
| `--font-weight-normal` | `400` | Body |
| `--font-weight-medium` | `500` | Buttons, table headers |
| `--font-weight-semibold` | `600` | Empty state title, KPI values |
| `--font-weight-bold` | `700` | Dialog title |
| `--line-height-tight` | `1.25` | Table cells |
| `--line-height-normal` | `1.5` | Body |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Compact padding |
| `--space-2` | `8px` | Badge padding, icon gap |
| `--space-3` | `12px` | Cell padding (horizontal) |
| `--space-4` | `16px` | Card padding, button padding |
| `--space-6` | `24px` | Section gap, dialog padding |
| `--space-8` | `32px` | Page padding (desktop) |
| `--space-12` | `48px` | Empty state vertical spacing |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `4px` | Badge, skeleton |
| `--radius-md` | `8px` | Buttons, cards |
| `--radius-lg` | `12px` | Dialog |
| `--radius-full` | `9999px` | Badge pill shape (status) |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards, dropdown |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Dialog, toast |

### Badge Colors (Status)

| Status | Token | Value |
|-------|-------|-------|
| pending | `--color-warning-500` (text) + tint bg | `#FEF3C7` bg |
| processing | `--color-primary-500` (text) + tint bg | `#DBEAFE` bg |
| completed | `--color-success-500` (text) + tint bg | `#DCFCE7` bg |
| cancelled | `--color-neutral-500` (text) + tint bg | `#F3F4F6` bg |

---

## Accessibility Requirements (WCAG 2.1 AA)

Per NFR-002. Mapped to every screen and component.

### Screen: Order List
- [ ] **1.4.3 Contrast**: All text ≥ 4.5:1. Badge text on tint bg: validate contrast.
- [ ] **1.4.4 Resize**: Text resizable 200% without horizontal loss. Table scrolls below 768px.
- [ ] **2.1.1 Keyboard**: All interactives accessible via Tab + Enter/Space + Arrow keys.
- [ ] **2.4.3 Focus Order**: Search → Filter → Bulk bar → Table → Pagination (natural L→R, T→B).
- [ ] **2.4.7 Focus Visible**: Focus ring (`--color-primary-500`, 2px offset 2px) on all interactives.
- [ ] **3.3.1 Error Identification**: Error messages in text, not color alone.
- [ ] **3.3.2 Labels**: Search input has visible placeholder + hidden `<label>`. Status filter has visible `<label>`.
- [ ] **4.1.2 Name/Role/Value**: Table `role="grid"`, sort buttons `aria-sort`, checkboxes `aria-checked`.

### Screen: Delete Confirmation Dialog
- [ ] **1.4.3 Contrast**: Dialog text on white bg ≥ 4.5:1.
- [ ] **2.1.1 Keyboard**: Focus trap; Esc = Cancel; Enter on confirm = submit.
- [ ] **2.4.3 Focus Order**: Cancel (auto-focus) → Confirm → Close X → (cycle). No escape.
- [ ] **4.1.2 Name/Role/Value**: `role="alertdialog"`, `aria-labelledby`, `aria-describedby`.
- [ ] **2.4.7 Focus Visible**: Focus ring visible on both buttons.
- [ ] **1.4.11 Non-text Contrast**: Backdrop has sufficient contrast with page content.

### Screen: Empty State
- [ ] **1.1.1 Non-text Content**: Illustration has `alt=""` (decorative) or `role="presentation"`.
- [ ] **2.1.1 Keyboard**: CTA button keyboard accessible.
- [ ] **4.1.2 Name/Role/Value**: `role="status"`, `aria-live="polite"`.

### Screen: Error State
- [ ] **1.4.3 Contrast**: Error text meets contrast on error bg.
- [ ] **2.4.3 Focus Order**: Focus moves to error block on render.
- [ ] **4.1.2 Name/Role/Value**: `role="alert"`, `aria-live="assertive"`.
- [ ] **3.3.1 Error Identification**: Error in text, not icon only.

### General (All Screens)
- [ ] **1.4.12 Text Spacing**: No loss of content at line-height 1.5, spacing 2× default.
- [ ] **2.4.1 Bypass Blocks**: Skip-to-content link before sidebar.
- [ ] **3.2.3 Consistent Navigation**: Sidebar order consistent across pages.
- [ ] **3.2.4 Consistent Identification**: Same icon = same action across all rows.
- [ ] **4.1.3 Status Messages**: Selection count (`aria-live`), sort state (`aria-sort`), loading (`aria-busy`).

---

## Visualization Rationale

Per `data-presentation` Step 1.1 intent table:

| UI Element | User Intent | Chosen Encoding | Why not alternatives |
|-----------|-------------|----------------|---------------------|
| Table with rows | Find specific order, compare orders | Table with sortable columns + search + filter | Table is optimal when user needs exact values and can sort/filter (Step 1.2). Charts inappropriate — user needs to read specific client names, IDs, amounts. |
| Status badge | Monitor status | Colored badge with text | Color + text dual encoding means color is not the sole differentiator (a11y). Badge is compact and scannable in table. |
| Pagination counter "1–20 of 2,347" | Context + navigation | Numeric range indicator + page buttons | Gives user sense of result set size. "Load more" not suitable for >100 pages (no infinite scroll for paginated tables). |
| Sort indicator (arrow) | Rank/order data | Arrow icon in column header | Universally understood pattern. Only 4 sortable columns — no need for multi-sort UI. |

No anti-patterns (Step 1.4) are present: no pie charts, no 3D, no truncated axes, no dual y-axes, no chart-when-table.

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| ≥ 1024px | Full desktop layout: sidebar visible, table full width, filter bar inline |
| 768–1023px | Sidebar collapses to icons only (or hamburger). Table width adjusts. |
| < 768px (NFR-003) | Table: horizontal scroll with sticky first column (checkbox + ID) and sticky last column (Actions). Filter bar collapses to "Filters (N)" button opening bottom sheet. Pagination compact. |

---

## Refresh Model

| Aspect | Choice |
|--------|--------|
| Initial load | Full skeleton + fetch |
| Page change | `keepPreviousData` (NFR-001) — stale rows visible during transition |
| Sort/filter change | Debounce 300ms (search) or immediate (filter/sort), `keepPreviousData` |
| Polling | Not required (manual refresh sufficient for order management) |
| Stale indicator | "Last update: X seconds ago" in footer (updates when data refreshes) |
| Re-fetch on window focus | Recommended (stale-while-revalidate pattern via React Query) |

---

[NEEDS CLARIFICATION] The Order Detail page (FR-013) is referenced but out of scope for this spec. It should be wireframed as part of a follow-up story.
[NEEDS CLARIFICATION] The Order Detail page (FR-013) is referenced but out of scope for this spec. It should be wireframed as part of a follow-up story.

> **Note**: The pattern library already exists at `.forge/frontend/patterns/` with canonical pattern definitions (`pattern-data-table.md`, `pattern-empty-state.md`, `pattern-notification.md`, `pattern-error-recovery.md`, `pattern-confirmation.md`). The inline copies above are contextualized for this spec; they should remain consistent with the canonical files. Future specs should reference the library directly rather than redefining patterns inline.
