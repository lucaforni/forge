# Spec: Order List

**ID**: 001-elenco-ordini · **Status**: Draft · **Track**: Feature

---

## Description

Order list page with filters, server-side pagination, and per-row actions.
Allows viewing, searching, filtering, and managing orders.

## Functional Requirements

| ID | Description | Priority |
|----|-------------|----------|
| FR-001 | Order table with columns: ID, Customer, Status, Total, Date | High |
| FR-002 | Text search by customer (300ms debounce) | High |
| FR-003 | Filter by order status (select: all/pending/processing/completed/cancelled) | High |
| FR-004 | Sorting by column (customer, status, total, date) | High |
| FR-005 | Server-side pagination (20 per page) | High |
| FR-006 | Multi-row selection with checkboxes | Medium |
| FR-007 | Bulk action "Delete selected" with confirmation | Medium |
| FR-008 | Per-row actions: Edit, Delete (DropdownMenu) | High |
| FR-009 | Loading state with skeleton | High |
| FR-010 | Empty state (first visit: "No orders" + CTA) | High |
| FR-011 | Filtered-empty state ("No results" + "Clear filters") | High |
| FR-012 | Error state with retry | High |
| FR-013 | Row click navigates to order detail | Medium |
| FR-014 | URL params for search, status, sort, page | High |

## Non-Functional Requirements

| ID | Description |
|----|-------------|
| NFR-001 | Response time < 200ms for page navigation (with keepPreviousData) |
| NFR-002 | WCAG 2.1 AA: keyboard navigation, screen reader, contrast |
| NFR-003 | Responsive: horizontal scroll below 768px |

## Pattern Library Reference

| Pattern | Use |
|---------|-----|
| Data Table | Main screen with table + filters + pagination |
| Empty State | Empty states (first-visit and filtered) |
| Notification | Toast on deletion |
| Error Recovery | API error with retry |
| Confirmation Flow | Order deletion confirmation |
