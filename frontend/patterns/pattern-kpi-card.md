# Pattern: KPI Card

**Severity**: Dashboard · **Stack**: shadcn/ui + Lucide + Tailwind
**Depends on**: Card, Skeleton, class-variance-authority

---

## 1. When to Use

**Use this pattern when**:
- Dashboard KPI rows with key metrics (revenue, users, orders, errors)
- Metric highlights in summary views
- Real-time status monitoring (stale/updated)
- Comparison with previous period needed

**Do NOT use this pattern when**:
- Detailed or tabular data → Data Table
- Complex chart with historical trend → Dedicated chart
- Standalone page (needs richer layout) → Master Detail or Dashboard
- Single metric without comparison → Badge or static `<p>`

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Card | KPI container | default |
| Skeleton | Loading state | default |
| cva | Semantic color variants | default/success/warning/destructive |

| Lucide Icon | Usage |
|-------------|-----|
| `TrendUp` | Positive trend (improvement) |
| `TrendDown` | Negative trend (worsening) |
| `Minus` | Stable trend (0% change) |

---

## 3. JSX Structure

```tsx
<Card
  className={cn(kpiCardVariants({ variant }), onClick && "cursor-pointer hover:shadow-md transition-shadow")}
  onClick={onClick}
  aria-label={ariaLabel}
  role={onClick ? "button" : "article"}
  tabIndex={onClick ? 0 : undefined}
>
  <div className="flex flex-col md:flex-row md:items-center gap-4 p-6">
    {/* ICON */}
    {Icon && (
      <div className="rounded-full bg-muted p-3 w-fit" aria-hidden="true">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
    )}

    {/* VALUE + LABEL */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-muted-foreground truncate">
        {title}
      </p>
      <p className="text-3xl font-bold tracking-tight mt-1">
        {data ? format(data.current) : '—'}
      </p>
    </div>

    {/* TREND */}
    {data && (
      <div className="flex md:flex-col items-center md:items-end gap-1 md:gap-0.5">
        <div className={cn("flex items-center gap-1", trendColor(data.trend, higherIsBetter))}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-semibold">
            {data.changePercent > 0 ? "+" : ""}{data.changePercent.toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">vs prev. period</p>
      </div>
    )}
  </div>

  {/* SPARKLINE */}
  {data?.sparklineData && data.sparklineData.length > 0 && (
    <div className="px-6 pb-4" aria-hidden="true">
      <SparklineChart data={data.sparklineData} trend={data.trend} />
    </div>
  )}
</Card>
```

---

## 4. State Machine

```yaml
Pattern: KpiCard
Initial: loading

States:
  loading:
    description: "First metric load"
    ui: "Skeleton card: rectangular block + two pulse rows"
    transitions:
      on_success → populated
      on_error → error

  populated:
    description: "Metric loaded and updated"
    ui: "Card with value, label, trend, optional sparkline"
    transitions:
      on_data_update → populated (fresh data)
      on_stale_timeout → stale

  stale:
    description: "Data not updated beyond staleTime"
    ui: "Card with reduced opacity or thin yellow border + 'Data not up to date' indicator tooltip"
    transitions:
      on_refresh_success → populated
      on_refresh_error → error

  error:
    description: "Metric loading error"
    ui: "Card with warning icon + 'Error' + error text + 'Try again' inline button"
    transitions:
      on_retry → loading
```

---

## 5. Data Flow

### 5.1 KPI Data Shape

```tsx
interface KpiData {
  current: number
  previous: number
  change: number           // current - previous
  changePercent: number    // percentage change
  trend: 'up' | 'down' | 'stable'
  sparklineData?: number[] // array values for sparkline (max 30 points)
}
```

### 5.2 Format Functions

```tsx
type FormatFunction = (value: number) => string

// Predefined formatters
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)

const formatPercentage = (n: number) =>
  `${n.toFixed(1)}%`

const formatNumber = (n: number) =>
  new Intl.NumberFormat('it-IT').format(n)
```

### 5.3 React Query

```tsx
export function useKpiQuery(key: string, fetcher: () => Promise<KpiData>) {
  return useQuery({
    queryKey: ['kpi', key],
    queryFn: fetcher,
    refetchInterval: 60_000,  // refresh every minute
    staleTime: 30_000,
  })
}
```

---

## 6. TypeScript Types

```tsx
type TrendDirection = 'up' | 'down' | 'stable'

type KpiVariant = 'default' | 'success' | 'warning' | 'destructive'

interface KpiData {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: TrendDirection
  sparklineData?: number[]
}

interface KpiCardProps {
  title: string
  data?: KpiData
  icon?: LucideIcon
  format?: (value: number) => string
  variant?: KpiVariant
  higherIsBetter?: boolean   // true = up=green (revenue), false = down=green (errors)
  isLoading?: boolean
  onClick?: () => void
}
```

---

## 7. Accessibility

### ARIA
- Card: `role="button"` if onClick, `role="article"` otherwise
- `aria-label` on Card: full spoken description (e.g. "Revenue: €50,000, up 12% compared to previous period")
- Trend: not only color — arrow + text percentage
- Sparkline: `aria-hidden="true"` (redundant with current value)
- Loading skeleton: `aria-busy="true"`

### Screen Reader
```
1. "KPI Card: {title}"
2. "Value: {value}"
3. "Trend: {trend} of {percentage}% compared to previous period"
```

### Color
- Trend improvement: success color (green) for higherIsBetter=true
- Trend worsening: destructive color (red)
- Stable: muted color
- Color NEVER the only indicator — directional arrow always present

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| ≥ 768px | Vertical layout: icon on top, trend on right, sparkline below |
| < 768px | Horizontal layout: icon + value + label in a row, trend compacted below |

Card is width-full in container and adapts to grid parent. In a KPI row:
- Desktop: 4 columns (grid-cols-4)
- Tablet: 2 columns
- Mobile: 1 column

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Trend direction correct: up > 0 → TrendUp, down < 0 → TrendDown, 0 → Minus
- [ ] Comparison visible: "vs prev. period" label present
- [ ] Color coding: higherIsBetter=true → green for up, red for down. higherIsBetter=false → inverted
- [ ] Variants: default (neutral), success (green), warning (yellow), destructive (red) applied correctly
- [ ] Sparkline: rendered only when sparklineData length > 0
- [ ] Format function: currency shows €, percentage shows %, number shows thousands separator
- [ ] Loading skeleton: similar structure to real card (same height, width)
- [ ] Stale state: visual indicator + tooltip "Data not up to date"
- [ ] Error state: clear message + retry button
- [ ] Click-through: onClick works, card has hover shadow, cursor pointer, keyboard accessible (Enter/Space)
- [ ] Accessibility: aria-label describes full value and trend, sparkline aria-hidden
- [ ] Responsive: horizontal mobile layout works, vertical desktop layout

### States Verified
- [ ] Loading: skeleton with pulse animation
- [ ] Populated: correct data, trend visible, sparkline if present
- [ ] Stale: data not up to date indicator
- [ ] Error: message + retry button
- [ ] Empty: data not passed (undefined) — does not render or shows "--"
- [ ] Edge: changePercent = 0 → Minus icon, "0.0%" label
- [ ] Edge: large values (millions) → format handles them
- [ ] Edge: sparkline with 1 single point → flat line
