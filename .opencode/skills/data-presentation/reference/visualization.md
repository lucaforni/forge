# Data Presentation Reference: Visualization

On-demand detail for `data-presentation` Steps 1 and 3. Load this file when
designing a specific chart, KPI card, or dashboard — not upfront.

## Chart Hygiene (non-negotiable)

- Axes always labeled; units always specified.
- Zero baseline for bar charts; explicit baseline annotation otherwise.
- Max 7 categorical series per chart (small multiples beyond).
- Color encodes ONE dimension; don't overload with size + shape on same axis.
- Provide tabular alternative for every chart (a11y).
- Tooltips show exact values; chart alone shows the shape.
- Time axes ascending left-to-right; latest period highlighted if relevant.
- Currency, percentage, units always explicit on every value.

## Anti-patterns

- Pie chart with > 5 slices, or two pie charts side-by-side.
- Dual y-axis line charts (use small multiples).
- 3D charts, any kind.
- Truncated y-axes exaggerating small differences.
- "Donut with center label" as a glorified KPI (use a KPI card).
- Chart-when-table: showing 4 values as a bar chart instead of 4 numbers.

## KPI Design Rules

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

## Composition Principles

- **Grid alignment.** 12-column grid. Charts span 4, 6, 8, or 12.
- **Visual weight = business weight.** Most important chart = largest, topmost.
- **Same dimension → same encoding.** If "region" is blue in chart A, must be blue in chart B. Consistent legends.
- **Cross-filtering.** Where feasible, clicking a segment in one chart filters the others. Document explicitly in wireframe.
- **Time-range coherence.** Single time-range control affects all time-series unless noted.
- **Refresh model.** Specify: live / periodic / on-demand. Show last-updated timestamp.

## Responsive Dashboards (mandatory)

- < 768px: single-column stack; KPIs become horizontal scroll.
- Charts readable at 320px OR "view in landscape" prompt.
- Tables: horizontal scroll with sticky first column; never reflow into cards (loses comparability).
- Filter bar collapses to single "Filters (N)" button opening a sheet.
