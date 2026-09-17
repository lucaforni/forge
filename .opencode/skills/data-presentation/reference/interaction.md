# Data Presentation Reference: Interaction

On-demand detail for `data-presentation` Steps 2, 4 and 5. Load this file
when designing navigation, filters, search, or narrative — not upfront.

## Navigation Patterns

| Pattern | When | Key requirements |
|--------|------|-----------------|
| Master-detail (side-by-side) | Frequent context switches, comparing items | Persisted selection, keyboard nav between items |
| List → Detail (drill-down) | Long workflows on one item at a time | Breadcrumb, "back to list" preserves filters/scroll |
| Tabs within detail | Multiple facets of one entity | Tab state in URL, lazy-load expensive tabs |
| Faceted browse | Exploration with multiple criteria | Filter state in URL, clear-all affordance |
| Hierarchical tree | Deep nesting, parent/child semantics | Expand/collapse persistence, keyboard arrow nav |
| Card grid | Visual browsing, heterogeneous items | Consistent card heights, lazy image loading |
| Kanban / board | Status-based workflows | Drag affordance, optimistic updates, column counts |
| Timeline | Temporal events, audit logs | Density toggle, time-range zoom |

## Empty / Loading / Error States

For each node in the hierarchy:

| State | Required design |
|-------|----------------|
| First-visit empty | Onboarding affordance (CTA to create / import / connect) |
| Filtered empty | "No results match" + clear filters CTA + suggestion |
| Loading (initial) | Skeleton matching final layout (no spinner-only) |
| Loading (refresh) | Inline indicator, keep stale data visible |
| Error (recoverable) | Inline error + retry + collapsible technical detail |
| Error (permission) | Explanation + who to contact / how to request access |
| Partial failure | Show what loaded + flag what didn't; never blank everything |

## Filter UX Rules

- **Always show active filter state.** "Filters (3)" badge or chip row.
- **Always provide "Clear all".** Reaching "no results" must never be a trap.
- **Show counts per facet option.** "Region: EU (1,243)". If expensive, lazy but show them.
- **Empty filter result offers recovery.** Show which filter to relax.
- **Filter state in URL.** Always.
- **Apply on change vs explicit Apply?** On-change for fast queries; explicit Apply for multi-step/expensive. Pick one per view, be consistent.
- **Persist user filter preferences** where appropriate.

## Search Patterns

| Pattern | When | Notes |
|--------|------|-------|
| Global search | Cross-entity, top-of-app | Categorize results by entity type |
| Scoped search | Within current view | "Search this table…" placeholder |
| Autocomplete | Known vocabulary, taxonomies | Show category of each suggestion |
| Faceted search | Free text + filters | Filters refine search results |
| Command palette | Power users, action+navigation | Ctrl/Cmd-K, keyboard-first |

Document:
- Fields searched.
- Match type: exact, prefix, fuzzy, semantic.
- Debounce: 250–400ms client-side, 400–600ms server.
- Empty-query state (recent searches, suggestions, top results).

## Query Builders (advanced)

For power-user tools (analytics, admin, observability). Required:
- Visual query representation (nested AND/OR groups).
- Field selector with types (operators valid per type).
- Operators per field type (`=`, `contains`, `between`, `in`, `is null`, `regex`).
- Live result-count preview.
- Save / load / share named queries (URL-shareable).
- Plain-text equivalent (read-only) for power users + a11y.

## Segmentation

Filtering elevated to first-class. When users repeatedly view same slices:
- **Saved views / segments** — named, persisted, optionally shared.
- **Comparison mode** — 2–3 segments side-by-side (small multiples).
- **Cohort definition UI** — explicit time-anchor + inclusion criteria.

## Annotation as First-Class Element

- **Inline chart annotations.** Mark known events (launch, outage, policy change) so trends are interpretable.
- **Threshold lines.** Targets, SLAs, budgets directly on chart.
- **Narrative text near charts.** One-sentence "what this means" beats a chart title.
- **Anomaly callouts.** Statistically unusual values flagged in UI (badge, color, text) — don't rely on user to spot.

## Progressive Disclosure

Lead with the answer; let user descend into evidence:

```
KPI card               ← the answer
  └─ click → chart     ← the trend behind the answer
      └─ click → table ← the rows behind the trend
          └─ click → entity detail ← the record itself
```

Preserve context (time range, filters, segment) at each level so the user never feels they "lost" the question.

## Voice + Microcopy

- Avoid jargon unless persona is technical.
- Numbers: thousands separators, locale-aware decimals.
- Time: contextual ("2 hours ago" for real-time; full timestamps in audit logs/exports).
- Currency and units always present.
- Empty states warm: "Nothing here yet — start by [action]" not "No data."
- Errors constructive: what failed, what to try, who to contact.

## Storytelling Anti-patterns

- "Dashboard zoo" — many charts, no narrative or priority.
- "Mystery meat KPIs" — large numbers without units or context.
- "Look how much data we have" — breadth without insight.
- Charts requiring mental math (use derived measures explicitly).
- Charts whose conclusion changes with filter state but conclusion text doesn't update.
