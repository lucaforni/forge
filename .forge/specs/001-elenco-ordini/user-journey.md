# User Journey: Order List

**Spec**: 001-elenco-ordini  
**FR Coverage**: FR-001 through FR-014  
**Track**: Feature

---

## Persona 1: Marco — The Back-Office Operator

| Attribute | Value |
|-----------|-------|
| **Role** | Customer service orders operator |
| **Goal** | Quickly find orders to process, update statuses, handle exceptions |
| **Pain points** | Too much paper, slow legacy system, searches orders by customer name but often mistypes |
| **Tech literacy** | Medium (uses CRM every day, but is not a developer) |
| **Device preference** | Desktop (1440px monitor) during work; mobile only for notifications |
| **Accessibility needs** | None |
| **Quote** | "I need to find Mario Rossi's order in 10 seconds, not 10 minutes." |

---

## Persona 2: Elena — The Administrative Manager

| Attribute | Value |
|-----------|-------|
| **Role** | Administrative manager |
| **Goal** | Monitor monthly volumes, verify payments, export data for accounting |
| **Pain points** | Needs to compare orders from different periods, sometimes loses selection after navigating |
| **Tech literacy** | High (uses Excel, BI tools, advanced CRM) |
| **Device preference** | Desktop + tablet for signing |
| **Accessibility needs** | None specific |
| **Quote** | "I need to see all June orders filtered by customer and be able to export the list." |

---

## Persona 3: Antonio — The Administrator with Visual Impairment

| Attribute | Value |
|-----------|-------|
| **Role** | IT Administrator (platform manager) |
| **Goal** | Monitor anomalies, verify data correctness, manage permissions |
| **Pain points** | Poorly accessible screens, charts without text alternatives, orders lost in deep pages |
| **Tech literacy** | High (uses screen reader, terminal, dev tools) |
| **Device preference** | Desktop with screen reader (NVDA/JAWS) |
| **Accessibility needs** | Screen reader user: needs structured headings, `aria-label` on every interactive element, announcement of state changes |
| **Quote** | "If I can navigate with keyboard only and understand everything from the screen reader, the system works for everyone." |

---

## Journey 1: Marco — Happy Path "Find and update order"

**Trigger**: A customer calls to ask about their order status

**Steps**:
1. 🖱️ Opens sidebar → clicks "Orders" → page loads with 20 orders
2. 🔍 Types "Mario Rossi" in search bar → debounce 300ms → table updates with matches
3. 👁️ Scrolls results → finds order #10423 with status "Pending"
4. ✅ Clicks row checkbox + clicks "Change status" → selects "Processing"
5. ✅ Green toast: "Status updated to Processing" + undo
6. 🖱️ Clicks row → navigates to detail to verify shipping address

**Outcome**: Customer receives update, order is in processing, Marco took 25 seconds.

**Emotional Map**:
| Step | Emotion | Why |
|------|---------|-----|
| 1 | 😐 Neutral | Loading OK, knows what to expect |
| 2 | 🤔 Curious | How many Mario Rossis are there? |
| 3 | 💡 Insight | Found! Here's the problem. |
| 4 | 🎯 Decisive | I know what to do. |
| 5 | 😊 Satisfied | Operation completed in 2 clicks. |
| 6 | 🎉 Delighted | Detail confirms address. |

---

## Journey 1a: Marco — Edge Case "No results from search"

**Trigger**: Customer says name "Rossi" but Marco types "Rosi" (typo)

**Steps**:
1. 🖱️ Sidebar → "Orders"
2. 🔍 Types "Rosi" → table updates → **EmptyState (filtered)** "No results"
3. 😤 Frustrated: "But I'm sure there are Rossi orders!"
4. 👁️ Sees chip "Customer: Rosi" with [X] and "Clear filters" link
5. 🖱️ Corrects to "Rossi" → results appear

**Dead end**: Filtered-empty.  
**Recovery**: Clear chip → type correct name. Also "Clear filters" link for full reset.  
**Outcome**: Order found with correct search.

**Emotional Map**:
| Step | Emotion | Why |
|------|---------|-----|
| 1 | 😐 Neutral | — |
| 2 | 😵 Overwhelmed | No results, but clear message |
| 3 | 😤 Frustrated | Thought they had mistyped |
| 4 | 💡 Insight | Sees the active filter — understands the mistake |
| 5 | 😊 Relieved | Correct results |

---

## Journey 1b: Marco — Edge Case "Loading error"

**Trigger**: Unstable network, API not responding

**Steps**:
1. 🖱️ Sidebar → "Orders" → skeleton loading → error
2. 👁️ Sees ErrorState: "Unable to load orders" + "Retry" button
3. 🖱️ Clicks "Retry" → loading-refresh → error again
4. 😤 Expands "Technical details" → sees "ERR_NETWORK"
5. ☎️ Calls IT (but after 2 attempts)
6. 🔄 After 30 seconds retries → success → data loaded

**Dead end**: Error state after 3 auto-retries exhausted.  
**Recovery**: Manual retry button; network auto-heals and retry succeeds.  
**Fallback**: "If the problem persists, contact support."

**Emotional Map**:
| Step | Emotion | Why |
|------|---------|-----|
| 1 | 😐 Neutral | Normal loading |
| 2 | 🤔 Curious | — |
| 3 | 😤 Frustrated | Second error, starts to worry |
| 4 | 😵 Overwhelmed | Sees technical code |
| 5 | 😤 Frustrated | Has to call support |
| 6 | 😊 Relieved | It works in the end |

---

## Journey 2: Elena — "Filter, select, export"

**Trigger**: Needs to prepare monthly report for management on June orders

**Steps**:
1. 🖱️ Sidebar → "Orders"
2. 🖱️ "Status" filter → selects "Completed"
3. 🖱️ Page 1 → selects header checkbox → selects all 20 visible rows
4. 👁️ Sees banner "Select all 347 completed orders" → clicks
5. 🖱️ BulkActionBar: "Export selected" → download CSV
6. ✅ Toast "Export completed (347 orders)"

**Outcome**: CSV ready for accounting.

**Emotional Map**:
| Step | Emotion | Why |
|------|---------|-----|
| 1 | 😐 Neutral | — |
| 2 | 🔍 Investigating | Filters to refine |
| 3 | 🤔 Curious | How many in total? |
| 4 | 💡 Insight | Ah, I can select all! |
| 5 | 🎯 Decisive | Export right away. |
| 6 | 😊 Satisfied | Done in 20 seconds. |

---

## Journey 2a: Elena — Edge Case "Bulk delete by mistake"

**Trigger**: Wants to delete duplicate orders, but selects too many orders

**Steps**:
1. 🔍 Filters by "Cancelled" → 15 results
2. ☑️ Selects all → BulkActionBar "Delete selected"
3. ⚠️ ConfirmationDialog: "Delete 15 orders" — lists the first 3
4. 😱 Realizes it's too many → clicks "Cancel"
5. 😊 Dialog closes → table unchanged
6. 🖱️ Deselects with header checkbox

**Dead end avoided**: Confirmation dialog prevented accidental bulk delete.  
**Recovery**: Cancel button/Esc closes dialog, no action taken.  
**Emotion**: 😱 Panic → 😊 Relief (undo prevention saved her).

---

## Journey 3: Antonio — "Screen reader navigation"

**Trigger**: Verifies accessibility of the new orders page

**Steps**:
1. <kbd>Tab</kbd> → Skip-to-content link → Enter → focus skips sidebar
2. <kbd>Tab</kbd> → Search input → SR announces: "Search orders by customer name"
3. 🔍 Types "test" → Tab → Status Filter → SR: "Status, select, All selected"
4. <kbd>Tab</kbd> → Table → SR announces: "Orders table, 1,234 total rows, 20 visible rows"
5. <kbd>Tab</kbd> → column header "Data" with `aria-sort="descending"` → SR: "Date column, sorted descending"
6. <kbd>Enter</kbd> → sort toggles → SR announces: "Date column, sorted ascending"
7. <kbd>Tab</kbd> → first row → SR: "Row 1, select order 10423, Mario Rossi, pending, 1,234 euros, June 25"
8. <kbd>Space</kbd> → checkbox checked → SR: "1 row selected"
9. <kbd>Tab</kbd> → DropdownMenu → SR: "Actions for order 10423, dropdown menu"
10. ✅ Verifies: everything keyboard accessible, SR announces correctly.

**Outcome**: Page compliant with WCAG 2.1 AA.

---

## Journey 3a: Antonio — "Anomaly: API error read by SR"

**Trigger**: The server is under maintenance

**Steps**:
1. 🖱️ Sidebar → "Orders"
2. ⏳ Skeleton loading → error
3. 👨‍🦯 SR announces: "Alert: Unable to load orders. Server connection error."
4. <kbd>Tab</kbd> → "Retry" button with `aria-label="Retry loading orders"` → Enter
5. ⏳ loading-refresh → still error
6. 👨‍🦯 SR: "Error. The system automatically retried 3 times. Retry manually."
7. Antonio reports the bug: `aria-live` should not interrupt ongoing reading

**Emotion**: 😤 Frustrated — the alert interrupts smooth navigation.

---

## Journey 3b: Antonio — "Confirm dialog focus trap"

**Trigger**: Deleting an order with screen reader

**Steps**:
1. 🖱️ Tab to row → DropdownMenu → "Delete"
2. ⚠️ Dialog opens → focus on "Cancel" → SR: "Dialog: Delete order. Are you sure you want to delete order 10423? Cancel button, Delete button."
3. <kbd>Tab</kbd> → focus goes to "Delete" (doesn't exit the dialog)
4. <kbd>Esc</kbd> → dialog closes → focus returns to trigger

**Outcome**: Focus trap works correctly.

---

## Journey Data Flow Summary

| Persona | Primary Journey Type | Patterns Used | Decision Points |
|---------|---------------------|---------------|-----------------|
| Marco | Find + Act (update status) | DataTable, SearchInput, StatusFilter, Notification, ConfirmationFlow | "Change status" or "Delete" — per-row quick action |
| Elena | Filter + Bulk Act (export) | DataTable (selection), BulkActionBar, Pagination, Notification (export) | Select all vs only visible; export vs delete |
| Antonio | Verify accessibility | All patterns, ErrorRecovery, ConfirmationFlow, Skip-to-content | WCAG compliance check for each pattern |

---

## Exploration Paths (Data-Specific)

### Marco's Drill-Down Loop
```
[Filter by "Mario Rossi"] → [Table: 3 results]
  ↓
[Scan rows, see order 10423 is "Pending"] → [Click row → Detail page]
  ↓
[Verify address in detail] → [Back to list] → [Filters preserved, 3 rows still shown]
  ↓
[Select row 10423] → [Bulk: Change status to "Processing"] → [Toast success]
```

### Elena's Comparison Flow
```
[Status filter: "Completed"] → [Table: 347 rows]
  ↓
[Sort by Totale descending] → [Top orders visible]
  ↓
[Select all 347] → [Export CSV] → [Open in Excel for analysis]
  ↓
[Back to list] → [Change filter: "Pending"] → [New set, selection reset]
```

### Antonio's Dead-End Recovery
```
[Navigate to Orders] → [Skeleton loading] → [Error state: API timeout]
  ↓
[Retry button] → [Loading again] → [Error again (retry exhausted)]
  ↓
[Expand "Technical details"] → [See error code] → [Contact IT]
  ↓
[Come back later] → [Page loads successfully]
```

---

## Edge Cases Summary

| Edge Case | Journey | Pattern Response | Recovery |
|-----------|---------|-----------------|----------|
| Typo in search ("Rosi" vs "Rossi") | 1a | EmptyState (filtered) | Clear chip + retype OR "Clear filters" link |
| API timeout (no data) | 1b | ErrorRecovery (api-error) | Retry button (manual after 3 auto-retries) |
| Accidental bulk delete | 2a | ConfirmationFlow (confirming) | Cancel / Esc — no action taken |
| Network offline | 1b (variant) | ErrorRecovery (network-error) | Retry button + "No connection" message |
| Permission denied (403) | 3 (variant) | EmptyState (permission-denied) | Contact support CTA |
| Partial failure (metadata vs data) | (variant) | ErrorRecovery (partial-failure) | Banner + retry individual section |
| Empty first visit (0 total orders) | (variant) | EmptyState (first-visit) | CTA "New Order" |
| Search no match after filter | 1a (variant) | EmptyState (filtered-no-match) | "Clear filters" + suggestion |
| Sort + page deep link | (variant) | DataTable (params in URL) | Perpetual URL, bookmarkable |
| Select all across pages | 2 (step 4) | DataTable (selecting) | Banner "Select all N results" |
