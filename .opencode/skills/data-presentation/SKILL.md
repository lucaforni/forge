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

You are now operating under the FORGE **data presentation protocol**. This
skill specializes UX design for data-heavy interfaces: dashboards, analytics
views, admin panels, list/detail systems, reports, and any UI whose primary
purpose is to let users **understand, navigate, filter, and act on data**.

This skill is complementary to `ux-design`. Load it together when the feature
involves significant data presentation. It does NOT replace personas,
accessibility, or component spec work — it sharpens five specific dimensions:

1. Visualization choice (chart / table / form / card / map / timeline)
2. Information architecture and hierarchical navigation
3. Dashboard design and view composition
4. Filters, search, segmentation, query building
5. Data storytelling

## When to Apply

Apply this skill when ANY of the following is true:

- The feature surfaces collections (lists, tables, grids) of > 10 items
- The feature includes aggregated metrics, KPIs, or charts
- The feature includes drill-down or master-detail navigation
- The feature requires filtering, sorting, faceted search, or query building
- The user's primary task is exploration, comparison, or decision-making
  based on data
- The feature includes any form of dashboard, report, or analytics view

If the feature is purely transactional (e.g., a single form, a checkout),
this skill is not needed and you should rely on `ux-design` alone.

---

## Step 0: Data Discovery (run BEFORE wireframing)

Before choosing visualizations, you MUST understand the data. Produce a
**Data Inventory** section in `design-spec.md` answering these questions:

### 0.1 Entity and Attribute Map

| Entity | Key attributes | Cardinality | Source FR |
|--------|---------------|------------|-----------|
| [Name] | [field: type] | [1, many, N×M] | FR-NNN |

For each attribute, classify the data type — this drives visualization:

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
| How many records typical? | [N] | Determines pagination, virtualization, sampling |
| How many records max? | [N] | Determines indexing, search-first vs browse-first |
| How fresh is the data? | [real-time / minutes / daily / static] | Determines refresh affordance, loading patterns |
| How often does it change? | [continuous / batch / rare] | Determines push vs pull, change indicators |

### 0.3 Density Scenarios

Every data view must be designed for THREE density scenarios:

- **Empty** — 0 records (first run, no permissions, post-filter no match)
- **Sparse** — 1–5 records (early state, niche query)
- **Dense** — typical and maximum expected volumes

Wireframes MUST show all three; sparse is the most often forgotten.

---

## Step 1: Visualization Choice

Apply this decision framework before drawing any chart or table.

### 1.1 What is the user's question?

Match the user's primary intent to a chart family:

| User intent | Recommended visualizations | Avoid |
|------------|---------------------------|-------|
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

| Use a table when | Use a chart when | Use cards when |
|-----------------|------------------|----------------|
| User needs exact values | User needs patterns or trends | Items are heterogeneous and visual |
| User compares many attributes at once | User compares 1–3 measures across a dimension | Each item warrants more space |
| User exports / cites data | User communicates a single insight | Item identity matters more than position |
| User sorts / filters / searches | Density would harm readability | Mobile-first browsing |

### 1.3 Chart Hygiene Rules (non-negotiable)

- Axes always labeled, units always specified
- Zero baseline for bar charts; explicit baseline annotation otherwise
- Maximum 7 categorical series on a single chart (use small multiples beyond that)
- Color encodes ONE dimension; never overload color with size and shape on the same axis
- Provide a textual/tabular alternative for every chart (a11y requirement)
- Tooltips must show exact values; chart alone shows the shape
- Time axes ascending left-to-right; latest period highlighted if relevant
- Currency, percentage, and units explicitly indicated on every value

### 1.4 Anti-patterns

- Pie chart with more than 5 slices, or comparing two pie charts side-by-side
- Dual y-axis line charts (use small multiples instead)
- 3D charts of any kind
- Truncated y-axes that exaggerate small differences
- "Donut with center label" used as a glorified KPI (use a KPI card)
- Chart-when-table: showing 4 values as a bar chart instead of just 4 numbers

---

## Step 2: Information Architecture and Hierarchical Navigation

Data products live or die on their IA. Define it explicitly.

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

For each level, specify:

- **View type**: list, table, dashboard, detail, form, wizard
- **Entry points**: how the user arrives here (nav, search, link)
- **Exit points**: where they can go from here (drill-down, related, back)
- **URL pattern**: routes must be deep-linkable and shareable

### 2.2 Navigation Patterns (data-specific)

| Pattern | When to use | Key requirements |
|--------|-------------|-----------------|
| Master-detail (side-by-side) | Frequent context switches, comparing items | Persisted selection, keyboard nav between items |
| List → Detail (drill-down) | Long workflows on one item at a time | Breadcrumb, "back to list" preserves filters/scroll |
| Tabs within detail | Multiple facets of one entity | Tab state in URL, lazy-load expensive tabs |
| Faceted browse | Exploration with multiple criteria | Filter state in URL, clear-all affordance |
| Hierarchical tree | Deep nesting, parent/child semantics | Expand/collapse persistence, keyboard arrow nav |
| Card grid | Visual browsing, heterogeneous items | Consistent card heights, lazy image loading |
| Kanban / board | Status-based workflows | Drag affordance, optimistic updates, column counts |
| Timeline | Temporal events, audit logs | Density toggle, time-range zoom |

### 2.3 Preserving Context Across Navigation

This is the single most violated principle in data UIs. Mandatory rules:

- **Filters in URL.** Every filter, sort, page, and selection must be in the
  URL. Sharing a link must reproduce the exact view.
- **Back returns to the same scroll position and selection.** Not the top.
- **Breadcrumbs reflect data hierarchy, not navigation history.**
- **Selection persistence.** A selected row stays selected when the user
  drills in and returns.
- **Filter persistence across drill-down.** Going into a detail and back
  must not reset filters.

### 2.4 Empty / Loading / Error States in the IA

For each node in the hierarchy, define:

| State | Required design |
|-------|----------------|
| First-visit empty | Onboarding affordance (CTA to create / import / connect) |
| Filtered empty | "No results match" + clear filters CTA + suggestion |
| Loading (initial) | Skeleton matching the final layout (no spinner-only) |
| Loading (refresh) | Inline indicator, keep stale data visible |
| Error (recoverable) | Inline error + retry + technical detail collapsible |
| Error (permission) | Explanation + who to contact / how to request access |
| Partial failure | Show what loaded + flag what didn't, never blank out everything |

---

## Step 3: Dashboard Design and View Composition

Dashboards are not "a bunch of charts on a page". Apply this structure.

### 3.1 Dashboard Anatomy

A well-formed dashboard has FIVE zones, top to bottom:

```
+--------------------------------------------------+
| 1. CONTEXT BAR   filters · time range · scope    |
+--------------------------------------------------+
| 2. KPI ROW       [KPI 1] [KPI 2] [KPI 3] [KPI 4] |  ← 3–5 leading metrics
+--------------------------------------------------+
| 3. PRIMARY VIEW  [Main chart / trend]            |  ← The "headline" insight
|                                                  |
+--------------------------------------------------+
| 4. SUPPORTING    [Chart] [Chart] [Chart]         |  ← Decompositions, segments
+--------------------------------------------------+
| 5. DETAIL TABLE  [sortable, filterable rows]     |  ← The underlying data
+--------------------------------------------------+
```

Not every dashboard has all five zones, but zones must appear in this order.
**KPIs above charts above tables.** Never the reverse.

### 3.2 KPI Design Rules

Each KPI card must include:

- The current value (large, prominent)
- The unit (currency, %, count, duration)
- A comparison (vs previous period, vs target, vs benchmark)
- A directional indicator (↑ ↓ →) with semantic color (improvement, not just direction)
- A sparkline or micro-trend showing the path (optional but recommended)
- A click-through to the underlying data view

Anti-patterns to avoid:

- KPI without comparison ("Revenue: $42,300" — vs what?)
- Green-up-arrow when up is bad (errors, churn, latency)
- Too many KPIs (> 6 dilutes attention; pick the 3–5 that drive decisions)
- Vanity metrics (totals that never change meaningfully)

### 3.3 Composition Principles

- **Grid alignment.** Use a 12-column grid. Charts span 4, 6, 8, or 12 columns.
- **Visual weight matches business weight.** The most important chart is the
  largest and topmost.
- **Same dimension → same encoding.** If "region" is blue in chart A, it must
  be blue in chart B. Consistent legends across the dashboard.
- **Cross-filtering.** If feasible, clicking a segment in one chart filters
  the others. Document the interaction explicitly in the wireframe.
- **Time-range coherence.** A single time-range control affects all
  time-series in the dashboard unless explicitly noted.
- **Refresh model.** Specify per dashboard: is it live, periodic, on-demand?
  Show last-updated timestamp.

### 3.4 Responsive Dashboards

Dashboards are the worst offenders for responsive UX. Mandatory rules:

- Below 768px: collapse to single-column stack, KPIs become a horizontal scroll
- Charts must be readable at 320px width OR provide a "view in landscape" prompt
- Tables must use horizontal scroll with a sticky first column, never reflow into cards (loses comparability)
- Filter bar collapses into a single "Filters (N)" button opening a sheet

---

## Step 4: Filters, Search, Segmentation, Query Building

Choose the right filter pattern for the data volume and user expertise.

### 4.1 Filter Pattern Decision Tree

```
Is the user a casual user or a power user?
├── Casual → use simple filters: chips, dropdowns, faceted sidebar
└── Power user → consider advanced filters: query builder, search syntax

How many filterable dimensions?
├── 1–3   → inline filter chips above the data
├── 4–8   → filter sidebar (left on desktop, bottom-sheet on mobile)
└── 9+    → query builder + saved views

Is filtering exclusive (AND) or inclusive (OR)?
├── AND   → checkboxes (within facet OR between facets) — be explicit
└── OR    → multi-select chips, segmented controls

Is data finite or open-ended?
├── Finite (known options) → dropdown / multi-select / facet with counts
└── Open-ended (free text) → search input + autocomplete + recent searches
```

### 4.2 Filter UX Rules

- **Always show the active filter state.** A "Filters (3)" badge or chip row.
- **Always provide "Clear all".** Reaching "no results" should never be a trap.
- **Show counts per facet option.** "Region: EU (1,243)". If counts are
  expensive, show them lazily but show them.
- **Empty filter result must offer recovery.** Show which filter to relax.
- **Filter state in URL.** Always. No exceptions.
- **Apply on change vs explicit "Apply"?** Apply on change for fast queries;
  explicit Apply for multi-step or expensive queries. Pick one per view and
  be consistent.
- **Persist user filter preferences** for return visits (where appropriate).

### 4.3 Search Patterns

| Pattern | When | Notes |
|--------|------|-------|
| Global search | Cross-entity, top-of-app | Categorize results by entity type |
| Scoped search | Within current view | "Search this table…" placeholder |
| Autocomplete | Known vocabulary, taxonomies | Show category of each suggestion |
| Faceted search | Combine free text with filters | Filters refine the search results |
| Command palette | Power users, action+navigation | Ctrl/Cmd-K, keyboard-first |

Document at least:
- What fields are searched
- Whether matching is exact, prefix, fuzzy, or semantic
- Debounce delay (typical: 250–400ms for client-side, 400–600ms for server)
- Empty-query state (recent searches, suggestions, top results)

### 4.4 Query Builders (advanced)

Reserve for power-user tools (analytics, admin, observability). Required:

- Visual representation of the query (nested AND/OR groups)
- Field selector with types (so operators are valid per type)
- Operators appropriate to the field type (`=`, `contains`, `between`, `in`,
  `is null`, `regex`)
- Live preview of result count
- Save / load / share named queries (URL-shareable)
- Plain-text equivalent (read-only) for advanced users and accessibility

### 4.5 Segmentation

Segmentation is filtering elevated to a first-class concept. When users
repeatedly view the same filtered slices, design:

- **Saved views / segments** — named, persisted, optionally shared
- **Comparison mode** — compare 2–3 segments side-by-side (small multiples)
- **Cohort definition UI** — explicit time-anchor and inclusion criteria

---

## Step 5: Data Storytelling

The goal is to lead the user from "here is data" to "here is what to do".

### 5.1 The Storytelling Order

Apply this order within a view, a section, or even a single chart:

1. **Context** — what time range, what scope, what is being measured
2. **Headline** — the one number or trend the user should notice
3. **Decomposition** — why that headline number is what it is
4. **Comparison** — vs goal, vs prior period, vs peers, vs forecast
5. **Action** — what the user can do about it (CTA, drill-down, alert)

A dashboard that ends at step 3 is a report. A dashboard that ends at step 5
is a tool. Design for step 5.

### 5.2 Annotation as a First-Class Element

- **Inline annotations on charts.** Mark known events (launch, outage,
  policy change) so trends are interpretable.
- **Threshold lines.** Visualize targets, SLAs, budgets directly on the chart.
- **Narrative text near charts.** A single-sentence "what this means" is
  more useful than a chart title.
- **Anomaly callouts.** If a value is statistically unusual, the UI says so
  (badge, color, or text) — do not rely on the user to spot it.

### 5.3 Progressive Disclosure of Detail

Lead with the answer; let the user descend into evidence:

```
KPI card               ← the answer
  └─ click → chart     ← the trend behind the answer
      └─ click → table ← the rows behind the trend
          └─ click → entity detail ← the record itself
```

At each level, preserve the context (time range, filters, segment) so the
user never feels they have "lost" the question they were asking.

### 5.4 Voice and Microcopy in Data UIs

- Avoid jargon unless the persona is technical
- Numbers are written: thousands separators, locale-aware decimals
- Time is written contextually: "2 hours ago" near real-time data,
  full timestamps in audit logs and exports
- Currency and units are always present; never assume
- Empty states are written warmly: "Nothing here yet — start by [action]"
  not "No data."
- Errors are written constructively: what failed, what the user can try,
  who to contact

### 5.5 Storytelling Anti-patterns

- "Dashboard zoo" — many charts, no narrative, no priority
- "Mystery meat KPIs" — large numbers without units or context
- "Look how much data we have" — visualizations that show breadth without insight
- Charts that require the user to do mental math (use derived measures explicitly)
- Charts whose conclusion changes based on filter state but the conclusion text doesn't update

---

## Integration with Wireframes and User Journeys

This skill does NOT introduce new artifacts. It enhances existing ones.

### Wireframe enhancements (mandatory for data views)

Every wireframe of a data view must include, beyond the standard `ux-design`
requirements:

- **Density variants**: separate frames for Empty / Sparse / Dense states
- **Filter bar / state**: explicit, even if collapsed
- **Sort / column controls**: visible, with default and active states
- **Pagination / virtualization affordance**: "1–50 of 1,243" or infinite
  scroll sentinel
- **Selection model**: single, multi, none — and where selection lives (row
  checkbox, click-to-select)
- **Action affordance for selection**: bulk action bar, contextual menu
- **Refresh / freshness indicator**: last-updated timestamp
- **Drill-down affordance**: how a row/segment/cell becomes a detail view
- **Export / share affordance** where appropriate

Annotate the wireframe with:

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

Every journey involving data exploration must explicitly map:

- **Exploration paths**: not just the happy linear path, but the branching
  paths the user takes to investigate
- **Drill-down loops**: zoom in → understand → zoom out → compare → zoom in elsewhere
- **Filter / refine iterations**: how the user narrows scope progressively
- **Comparison flows**: how the user pivots from "what" to "vs what"
- **Decision points**: where the data leads to an action (and what that action is)
- **Dead ends and recoveries**: filtered to empty, permission denied, stale data,
  search no-match — and how the user recovers

Annotate emotional states for data-specific moments:

- 🤔 Curious — exploring without a precise goal
- 🔍 Investigating — hunting a specific answer
- 😵 Overwhelmed — too much data, too many options
- 💡 Insight — discovered something useful
- 🎯 Decisive — ready to act on what the data shows
- 😤 Frustrated — can't find or can't filter to what they need

---

## Quality Gates (data-presentation specific)

Before handing off to `/forge-plan`, in addition to the `ux-design` gates:

- [ ] Data Inventory section exists with entity/attribute/type/cardinality
- [ ] Each visualization choice is justified against Step 1.1 (user intent table)
- [ ] No anti-pattern visualizations present (pie>5, 3D, dual-axis, etc.)
- [ ] Information architecture hierarchy is documented with view types per level
- [ ] Context preservation rules (URL state, scroll, selection, filters) are explicit
- [ ] Every data view has Empty / Sparse / Dense wireframe variants
- [ ] Every data view has Loading / Error / Partial-failure states
- [ ] Filter pattern is justified against Step 4.1 decision tree
- [ ] If dashboard: five-zone anatomy respected, KPIs include comparison + direction
- [ ] Storytelling order (Context → Headline → Decomposition → Comparison → Action)
      is present in every dashboard or analytics view
- [ ] Charts have a tabular alternative for accessibility
- [ ] User journeys include exploration / drill-down / comparison paths,
      not just linear happy path
