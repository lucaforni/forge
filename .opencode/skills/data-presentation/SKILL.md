---
name: data-presentation
description: Methodology for designing data-heavy interfaces — visualization choice, hierarchical information architecture, dashboard composition, filters/query building, and data storytelling
license: MIT
compatibility: opencode
metadata:
  audience: forge-ux
  workflow: forge
---

## Purpose

FORGE **data presentation protocol**. Specializes UX design for data-heavy interfaces: dashboards, analytics, admin panels, list/detail systems, reports — any UI whose primary purpose is to **understand, navigate, filter, and act on data**.

Complementary to `ux-design`. Load together when the feature involves significant data presentation. Does NOT replace personas, accessibility, or component spec work — it sharpens five dimensions:

1. Visualization choice (chart / table / form / card / map / timeline)
2. Information architecture + hierarchical navigation
3. Dashboard design + view composition
4. Filters, search, segmentation, query building
5. Data storytelling

## When to Apply

Apply if ANY:
- Feature surfaces collections (lists/tables/grids) of > 10 items.
- Aggregated metrics, KPIs, or charts.
- Drill-down or master-detail navigation.
- Filtering, sorting, faceted search, or query building.
- User's primary task is exploration, comparison, or decision-making on data.
- Any dashboard, report, or analytics view.

If purely transactional (single form, checkout) → use `ux-design` alone.

---

## Step 0: Data Discovery (BEFORE wireframing)

Produce a **Data Inventory** section in `design-spec.md`.

### 0.1 Entity and Attribute Map

| Entity | Key attributes | Cardinality | Source FR |
|--------|---------------|------------|-----------|
| [Name] | [field: type] | [1, many, N×M] | FR-NNN |

Classify each attribute — drives visualization:

| Type | Examples | Best fits |
|------|----------|-----------|
| Categorical (nominal) | status, country, tag | bar chart, table column, filter chip |
| Categorical (ordinal) | priority, rating | sorted bar, badge, progression bar |
| Quantitative (discrete) | count, occurrences | bar chart, number, KPI |
| Quantitative (continuous) | amount, percentage, duration | line chart, area chart, gauge |
| Temporal | timestamp, date range | line chart, timeline, calendar heatmap |
| Geospatial | coordinates, region | map, choropleth |
| Hierarchical | tree, parent/child | tree view, breadcrumb, treemap |
| Relational | graph, network | node-link, matrix, sankey |
| Textual | description, log line | list with truncation, expandable card |

### 0.2 Volume and Velocity

| Question | Answer | Design implication |
|---------|--------|-------------------|
| Records typical? | [N] | Pagination, virtualization, sampling |
| Records max? | [N] | Indexing, search-first vs browse-first |
| Data freshness? | [real-time / minutes / daily / static] | Refresh affordance, loading patterns |
| Change frequency? | [continuous / batch / rare] | Push vs pull, change indicators |

### 0.3 Density Scenarios

Every data view designed for THREE density scenarios:

- **Empty** — 0 records (first run, no permissions, post-filter no match).
- **Sparse** — 1–5 records (early state, niche query).
- **Dense** — typical and maximum expected volumes.

Wireframes MUST show all three; sparse is most often forgotten.

---

## Step 1: Visualization Choice

### 1.1 Match user intent to chart family

| User intent | Recommended | Avoid |
|------------|-------------|-------|
| Compare values across categories | Horizontal bar, grouped bar, table with bars | Pie chart with > 5 slices |
| See change over time | Line chart, area chart, sparkline in row | Bar chart for many time points |
| See distribution | Histogram, box plot, violin | Pie chart |
| See part-to-whole | Stacked bar, treemap, donut (≤ 5 parts) | 3D pie chart, ever |
| See correlation | Scatter plot, heatmap, parallel coordinates | Two separate line charts |
| See ranking | Sorted bar, ordered table, leaderboard | Unordered list |
| See flow / transitions | Sankey, funnel, chord | Pie chart |
| See hierarchy | Tree view, treemap, sunburst | Flat list |
| See geographic pattern | Choropleth, point map, heatmap | Table of coordinates |
| Find a specific record | Searchable table, filterable list | Any chart |
| Understand a single entity | Detail card / detail page | Aggregated view |
| Monitor status | KPI card, gauge, status grid | Chart requiring interpretation |

### 1.2 Table vs Chart vs Card

| Table when | Chart when | Cards when |
|-----------------|------------------|----------------|
| User needs exact values | User needs patterns or trends | Items are heterogeneous and visual |
| User compares many attributes at once | User compares 1–3 measures across a dimension | Each item warrants more space |
| User exports / cites data | User communicates a single insight | Item identity matters more than position |
| User sorts / filters / searches | Density would harm readability | Mobile-first browsing |

### 1.3 Chart Hygiene (non-negotiable)

- Axes always labeled; units always specified.
- Zero baseline for bar charts; explicit baseline annotation otherwise.
- Max 7 categorical series per chart (small multiples beyond).
- Color encodes ONE dimension; don't overload with size + shape on same axis.
- Provide tabular alternative for every chart (a11y).
- Tooltips show exact values; chart alone shows the shape.
- Time axes ascending left-to-right; latest period highlighted if relevant.
- Currency, percentage, units always explicit on every value.

### 1.4 Anti-patterns

- Pie chart with > 5 slices, or two pie charts side-by-side.
- Dual y-axis line charts (use small multiples).
- 3D charts, any kind.
- Truncated y-axes exaggerating small differences.
- "Donut with center label" as a glorified KPI (use a KPI card).
- Chart-when-table: showing 4 values as a bar chart instead of 4 numbers.

---

## Step 2: Information Architecture + Hierarchical Navigation

### 2.1 IA Hierarchy

Produce a hierarchy tree in `design-spec.md`:

```
[Workspace / Org]
├── [Section A]            ← top-level navigation
│   ├── [Collection A1]    ← list / index view
│   │   └── [Entity A1.x]  ← detail view
│   │       ├── [Sub-resource] ← nested tab or section
│   │       └── [Action]   ← modal or full-page flow
│   └── [Collection A2]
└── [Section B]
```

For each level specify:
- **View type**: list, table, dashboard, detail, form, wizard.
- **Entry points**: nav, search, link.
- **Exit points**: drill-down, related, back.
- **URL pattern**: deep-linkable and shareable.

### 2.2 Navigation Patterns

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

### 2.3 Preserving Context Across Navigation

Most violated principle in data UIs. Mandatory:

- **Filters in URL.** Every filter, sort, page, selection must be in URL. Sharing a link reproduces the exact view.
- **Back returns to same scroll position and selection.** Not the top.
- **Breadcrumbs reflect data hierarchy, not navigation history.**
- **Selection persistence.** Selected row stays selected when user drills in and returns.
- **Filter persistence across drill-down.** Detail-and-back must not reset filters.

### 2.4 Empty / Loading / Error States

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

---

## Step 3: Dashboard Design + View Composition

Dashboards are not "a bunch of charts on a page".

### 3.1 Dashboard Anatomy — FIVE zones, top to bottom

```
+--------------------------------------------------+
| 1. CONTEXT BAR   filters · time range · scope    |
+--------------------------------------------------+
| 2. KPI ROW       [KPI 1] [KPI 2] [KPI 3] [KPI 4] |  ← 3–5 leading metrics
+--------------------------------------------------+
| 3. PRIMARY VIEW  [Main chart / trend]            |  ← The "headline" insight
+--------------------------------------------------+
| 4. SUPPORTING    [Chart] [Chart] [Chart]         |  ← Decompositions, segments
+--------------------------------------------------+
| 5. DETAIL TABLE  [sortable, filterable rows]     |  ← The underlying data
+--------------------------------------------------+
```

Not every dashboard has all five, but zones must appear in this order. **KPIs above charts above tables.** Never the reverse.

### 3.2 KPI Design Rules

Each KPI card must include:
- Current value (large, prominent).
- Unit (currency, %, count, duration).
- Comparison (vs previous period / target / benchmark).
- Directional indicator (↑ ↓ →) with semantic color (improvement, not just direction).
- Sparkline or micro-trend (optional, recommended).
- Click-through to underlying data view.

Anti-patterns:
- KPI without comparison ("Revenue: $42,300" — vs what?).
- Green-up-arrow when up is bad (errors, churn, latency).
- > 6 KPIs (dilutes attention; pick 3–5 that drive decisions).
- Vanity metrics (totals that never change meaningfully).

### 3.3 Composition Principles

- **Grid alignment.** 12-column grid. Charts span 4, 6, 8, or 12.
- **Visual weight = business weight.** Most important chart = largest, topmost.
- **Same dimension → same encoding.** If "region" is blue in chart A, must be blue in chart B. Consistent legends.
- **Cross-filtering.** Where feasible, clicking a segment in one chart filters the others. Document explicitly in wireframe.
- **Time-range coherence.** Single time-range control affects all time-series unless noted.
- **Refresh model.** Specify: live / periodic / on-demand. Show last-updated timestamp.

### 3.4 Responsive Dashboards (mandatory)

- < 768px: single-column stack; KPIs become horizontal scroll.
- Charts readable at 320px OR "view in landscape" prompt.
- Tables: horizontal scroll with sticky first column; never reflow into cards (loses comparability).
- Filter bar collapses to single "Filters (N)" button opening a sheet.

---

## Step 4: Filters, Search, Segmentation, Query Building

### 4.1 Filter Pattern Decision Tree

```
User type?
├── Casual → simple filters: chips, dropdowns, faceted sidebar
└── Power  → advanced: query builder, search syntax

# filterable dimensions?
├── 1–3 → inline filter chips above data
├── 4–8 → filter sidebar (left desktop, bottom-sheet mobile)
└── 9+  → query builder + saved views

AND vs OR?
├── AND → checkboxes (explicit within/between facets)
└── OR  → multi-select chips, segmented controls

Data finite or open-ended?
├── Finite       → dropdown / multi-select / facet with counts
└── Open-ended   → search input + autocomplete + recent searches
```

### 4.2 Filter UX Rules

- **Always show active filter state.** "Filters (3)" badge or chip row.
- **Always provide "Clear all".** Reaching "no results" must never be a trap.
- **Show counts per facet option.** "Region: EU (1,243)". If expensive, lazy but show them.
- **Empty filter result offers recovery.** Show which filter to relax.
- **Filter state in URL.** Always.
- **Apply on change vs explicit Apply?** On-change for fast queries; explicit Apply for multi-step/expensive. Pick one per view, be consistent.
- **Persist user filter preferences** where appropriate.

### 4.3 Search Patterns

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

### 4.4 Query Builders (advanced)

For power-user tools (analytics, admin, observability). Required:
- Visual query representation (nested AND/OR groups).
- Field selector with types (operators valid per type).
- Operators per field type (`=`, `contains`, `between`, `in`, `is null`, `regex`).
- Live result-count preview.
- Save / load / share named queries (URL-shareable).
- Plain-text equivalent (read-only) for power users + a11y.

### 4.5 Segmentation

Filtering elevated to first-class. When users repeatedly view same slices:
- **Saved views / segments** — named, persisted, optionally shared.
- **Comparison mode** — 2–3 segments side-by-side (small multiples).
- **Cohort definition UI** — explicit time-anchor + inclusion criteria.

---

## Step 5: Data Storytelling

Lead user from "here is data" to "here is what to do".

### 5.1 Storytelling Order

Apply within a view, section, or single chart:

1. **Context** — time range, scope, what's measured.
2. **Headline** — the one number or trend to notice.
3. **Decomposition** — why that headline is what it is.
4. **Comparison** — vs goal, prior period, peers, forecast.
5. **Action** — what the user can do (CTA, drill-down, alert).

Stopping at step 3 = report. Reaching step 5 = tool. **Design for step 5.**

### 5.2 Annotation as First-Class Element

- **Inline chart annotations.** Mark known events (launch, outage, policy change) so trends are interpretable.
- **Threshold lines.** Targets, SLAs, budgets directly on chart.
- **Narrative text near charts.** One-sentence "what this means" beats a chart title.
- **Anomaly callouts.** Statistically unusual values flagged in UI (badge, color, text) — don't rely on user to spot.

### 5.3 Progressive Disclosure

Lead with the answer; let user descend into evidence:

```
KPI card               ← the answer
  └─ click → chart     ← the trend behind the answer
      └─ click → table ← the rows behind the trend
          └─ click → entity detail ← the record itself
```

Preserve context (time range, filters, segment) at each level so the user never feels they "lost" the question.

### 5.4 Voice + Microcopy

- Avoid jargon unless persona is technical.
- Numbers: thousands separators, locale-aware decimals.
- Time: contextual ("2 hours ago" for real-time; full timestamps in audit logs/exports).
- Currency and units always present.
- Empty states warm: "Nothing here yet — start by [action]" not "No data."
- Errors constructive: what failed, what to try, who to contact.

### 5.5 Storytelling Anti-patterns

- "Dashboard zoo" — many charts, no narrative or priority.
- "Mystery meat KPIs" — large numbers without units or context.
- "Look how much data we have" — breadth without insight.
- Charts requiring mental math (use derived measures explicitly).
- Charts whose conclusion changes with filter state but conclusion text doesn't update.

---

## Integration with Wireframes + User Journeys

This skill does NOT introduce new artifacts. It enhances existing ones.

### Wireframe enhancements (mandatory for data views)

Beyond standard `ux-design` requirements:

- **Density variants**: separate frames for Empty / Sparse / Dense.
- **Filter bar / state**: explicit, even if collapsed.
- **Sort / column controls**: visible, with default + active states.
- **Pagination / virtualization affordance**: "1–50 of 1,243" or infinite scroll sentinel.
- **Selection model**: single, multi, none — and where selection lives (row checkbox, click-to-select).
- **Action affordance for selection**: bulk action bar, contextual menu.
- **Refresh / freshness indicator**: last-updated timestamp.
- **Drill-down affordance**: how row/segment/cell becomes detail view.
- **Export / share affordance** where appropriate.

Annotate wireframes with:

```
Data binding:
  - Row source: [entity] from FR-NNN
  - Columns: [field: format] — link to data inventory
  - Default sort: [field] [asc/desc]
  - Default filter: [field = value]
  - Page size / virtualization: [N rows / row height]

States:
  - Empty (first-visit):  [...]
  - Empty (filtered):     [...]
  - Sparse (1–5 rows):    [...]
  - Dense (typical):      [...]
  - Loading (initial):    [...]
  - Loading (refresh):    [...]
  - Error:                [...]
  - Partial failure:      [...]
```

### User journey enhancements (mandatory for data-driven journeys)

Every data-exploration journey explicitly maps:

- **Exploration paths**: not just happy linear path; branching investigation.
- **Drill-down loops**: zoom in → understand → zoom out → compare → zoom elsewhere.
- **Filter / refine iterations**: how user narrows scope progressively.
- **Comparison flows**: pivot from "what" to "vs what".
- **Decision points**: where data leads to action (and what action).
- **Dead ends + recoveries**: filtered to empty, permission denied, stale data, search no-match — and how user recovers.

Annotate emotional states for data-specific moments:

- 🤔 Curious — exploring without a precise goal.
- 🔍 Investigating — hunting a specific answer.
- 😵 Overwhelmed — too much data, too many options.
- 💡 Insight — discovered something useful.
- 🎯 Decisive — ready to act.
- 😤 Frustrated — can't find or can't filter to what they need.

---

## Quality Gates (data-presentation specific)

Before handoff to `/forge-plan`, beyond `ux-design` gates:

- [ ] Data Inventory section with entity/attribute/type/cardinality.
- [ ] Each visualization choice justified against Step 1.1 (intent table).
- [ ] No anti-pattern visualizations (pie>5, 3D, dual-axis, etc.).
- [ ] IA hierarchy documented with view types per level.
- [ ] Context preservation rules (URL state, scroll, selection, filters) explicit.
- [ ] Every data view has Empty / Sparse / Dense wireframe variants.
- [ ] Every data view has Loading / Error / Partial-failure states.
- [ ] Filter pattern justified against Step 4.1 decision tree.
- [ ] If dashboard: five-zone anatomy respected; KPIs include comparison + direction.
- [ ] Storytelling order (Context → Headline → Decomposition → Comparison → Action) present in every dashboard/analytics view.
- [ ] Charts have tabular alternative for accessibility.
- [ ] User journeys include exploration / drill-down / comparison paths, not just linear happy path.
