# Pattern: Dashboard

**Severity**: Dashboard · **Stack**: shadcn/ui + React Query + recharts + Tailwind
**Depends on**: KPI Card, Loading Skeleton, Empty State, Error Recovery, Data Table
**Reference**: data-presentation skill — five-zone dashboard anatomy

---

## 1. When to Use

**Use this pattern when**:
- The user needs to monitor aggregate metrics (sales, performance, traffic)
- The user needs to compare KPIs over time or across segments
- The page combines numbers, trends, and details in a single view
- Decision-making based on synthetic data + drill-down capability

**Do NOT use this pattern when**:
- Single entity detail → Master-Detail
- Only numbers without trends → Single KPI Card or list
- Only table → Data Table
- More than 5 KPIs → prioritize or create multiple dashboards

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Card | KPI container, charts, sections | default |
| Select | Time range picker | default |
| Button | Refresh, actions | default, ghost |
| Badge | Data status (stale, live) | secondary, warning |
| Tabs | View switch (day/week/month) | default |
| Popover | Advanced filters | default |
| Skeleton | Loading states | shape: card, chart, table |
| ScrollArea | Scrollable dashboard | default |
| Separator | Section divider | default |

Chart library: recharts (LineChart, BarChart, AreaChart, PieChart)

---

## 3. JSX Structure

### Five-Zone Anatomy

```tsx
<div className="space-y-6">
  {/* ZONE 1: CONTEXT BAR */}
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {subtitle} · Last updated: {lastUpdated}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <Select value={timeRange} onValueChange={setTimeRange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 3 months</SelectItem>
          <SelectItem value="12m">Last year</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={refresh}>
        <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  </div>

  {/* ZONE 2: KPI ROW — 4 main metrics */}
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    <KpiCard title="Revenue" value={...} trend={...} />
    <KpiCard title="Orders" value={...} trend={...} />
    <KpiCard title="Customers" value={...} trend={...} />
    <KpiCard title="Conversion" value={...} trend={...} />
  </div>

  {/* ZONE 3: PRIMARY VIEW — Main chart */}
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Revenue Trend</h3>
      <Tabs value={chartView} onValueChange={setChartView}>
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </Card>

  {/* ZONE 4: SUPPORTING VIEWS — 2 columns */}
  <div className="grid gap-4 lg:grid-cols-2">
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={statusData} dataKey="value" nameKey="name" />
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={categoryData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" />
          <Tooltip />
          <Bar dataKey="value" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  </div>

  {/* ZONE 5: DETAIL TABLE */}
  <Card className="p-6">
    <h3 className="text-lg font-semibold mb-4">Latest Orders</h3>
    <OrdersTable compact />
    <Button variant="link" className="mt-2">View all orders →</Button>
  </Card>
</div>
```

---

## 4. State Machine

```yaml
Pattern: Dashboard
Initial: loading

States:
  loading:
    description: "First full load — no data"
    ui: "Skeleton for each zone (KPI skeleton ×4, chart skeleton, table skeleton)"
    transitions:
      on_all_success → populated
      on_partial_failure → partial_failure (some data OK)

  populated:
    description: "All data loaded correctly"
    ui: "Complete dashboard with KPIs, charts, table"
    transitions:
      on_time_range_change → refetching
      on_refresh → refetching
      on_mutation_success → populated (with new data)

  refetching:
    description: "Refresh with previous data visible"
    ui: "Current data visible, skeleton loading only for changed zones"
    transitions:
      on_success → populated
      on_error → stale (old data still visible)

  stale:
    description: "Refresh failed but previous data still visible"
    ui: "Yellow banner: 'Data not up to date' + Retry button. KPIs remain visible"
    transitions:
      on_retry → refetching
      on_time_range_change → refetching

  partial_failure:
    description: "Some zones OK, others in error"
    ui: "OK zones show data. Error zones show inline Error Recovery"
    transitions:
      on_retry_failed_zone → refetching_specific_zone
      on_all_success → populated

  empty:
    description: "No data in the selected period"
    ui: "KPIs show '—' or 0. Empty table. Empty charts with 'No data for the selected period' message"
    transitions:
      on_time_range_change → refetching
```

---

## 5. Data Flow

### 5.1 Query Architecture

```tsx
// APPROACH: Parallel queries (React Query useQueries)
// Each dashboard zone has its own query key.
// Time range is common to ALL queries.

function useDashboardQueries(timeRange: string) {
  const commonParams = { timeRange }

  return {
    kpis: useQuery({
      queryKey: ['dashboard', 'kpis', commonParams],
      queryFn: () => api.getDashboardKpis(commonParams),
      staleTime: 60_000, // 1 min — KPIs change slowly
    }),
    revenue: useQuery({
      queryKey: ['dashboard', 'revenue', commonParams],
      queryFn: () => api.getDashboardRevenue(commonParams),
      staleTime: 60_000,
    }),
    breakdown: useQuery({
      queryKey: ['dashboard', 'breakdown', commonParams],
      queryFn: () => api.getDashboardBreakdown(commonParams),
      staleTime: 120_000,
    }),
    recentOrders: useQuery({
      queryKey: ['orders', { page: 1, pageSize: 5 }],
      queryFn: () => api.getOrders({ page: 1, pageSize: 5 }),
      staleTime: 30_000,
    }),
  }
}
```

### 5.2 Time Range Coherence

```
ALL dashboard queries include the SAME time range params.
Changing the time range → refetch ALL queries.
KPI UIs always show "vs previous period" (same duration).
```

### 5.3 Refresh Model

```
Manual refresh: refresh button in context bar
Auto refresh: optional, 60s polling for near-real-time data
Refetch on focus: refetchOnWindowFocus: false (avoid unnecessary refreshes)
Stale indicator: "Last updated: X min ago" + color (green < 5min, yellow < 15min, red > 15min)
```

### 5.4 API Response Shape

```tsx
interface KpiData {
  current: number         // current period value
  previous: number        // previous period value (same duration)
  change: number          // absolute difference
  changePercent: number   // percentage change
  trend: 'up' | 'down' | 'stable'
}

// Single KPI response
interface DashboardKpis {
  revenue: KpiData
  orders: KpiData
  customers: KpiData
  conversion: KpiData
  avgOrderValue: KpiData
}
```

---

## 6. TypeScript Types

```tsx
interface DashboardProps {
  title: string
  subtitle?: string
  config?: {
    kpis: string[]          // which KPIs to show and order
    defaultTimeRange: string
    autoRefreshInterval?: number  // ms, 0 = no auto
  }
}

interface ZoneConfig {
  kpis: boolean
  primaryChart: 'revenue' | 'orders' | 'customers'
  supportingCharts: ('pie' | 'bar' | 'table')[]
  table: boolean
}

interface DashboardQueriesState {
  isLoading: boolean
  isRefetching: boolean
  errors: Record<string, Error | null>
  hasPartialFailure: boolean
  isStale: boolean
}
```

---

## 7. Accessibility

### ARIA
- Dashboard container: `role="region"` with `aria-label="Dashboard {name}"`
- KPI cards: `aria-label="Revenue: €50,000, +12% compared to previous period"`
- Charts: underlying data table (hidden but accessible to screen reader)
- Zones: `aria-label="Section {zone name}"`
- Time range select: associated label

### Keyboard
- Tab navigates: time range → refresh → KPI → charts → table
- Charts: non-interactive by default. If interactive (tooltip/zoom), document
- Table pagination: Data Table pattern

### Screen Reader Flow
```
"Dashboard '{title}'. KPI section: Revenue €50,000, up 12%. Orders 1,200, down 3%..."
"Chart section: Revenue Trend. Line chart. Data available in table below."
```

---

## 8. Responsive

| Breakpoint | Layout |
|------------|--------|
| ≥ 1280px | 4 KPI columns, full-width chart, 2 supporting columns |
| 1024-1279px | 4 KPI columns (narrow), full chart, 2 supporting columns |
| 768-1023px | 2 KPI columns, full chart, 1 supporting column (stack) |
| < 768px | 1 KPI column, reduced chart height (200px), all vertical stack |

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Context bar: selectable time range, last updated visible, refresh button
- [ ] KPI Row: 3-5 metrics, each with value + trend + comparison, click-through to detail
- [ ] Primary chart: chart title, axis labels, units, tooltip with exact values
- [ ] Supporting charts: color consistency with design system, chart hygiene (no 3D, no dual-axis)
- [ ] Detail table: "View all" link navigates to complete list
- [ ] Cross-filtering: if implemented, chart click filters other zones
- [ ] Time range: changing range refetches ALL zones (coherence)
- [ ] Stale data: "Last updated" + warning if data is old
- [ ] No 6+ KPIs (dilutes attention, max 5)

### States Verified
- [ ] Loading: zone-specific skeleton (KPI ×4, chart, table)
- [ ] Populated: all data correct, KPIs with trends, charts with data
- [ ] Refetching: KPIs remain visible, skeleton only for changed zones
- [ ] Stale: visible banner "Data not up to date" + retry
- [ ] Partial failure: OK zones show data, KO zones show inline error
- [ ] Empty: KPIs show 0/—, empty charts with "No data for the period"
- [ ] Empty (first visit): onboarding message + CTA
- [ ] Error: Error Recovery pattern per zone, does not block other zones

### Data Flow
- [ ] Common time range for ALL queries (same parameter)
- [ ] KPIs with comparison vs previous period (same duration)
- [ ] Appropriate staleTime (KPI: 60s, chart: 60s, breakdown: 120s)
- [ ] refetchOnWindowFocus: false (avoids unnecessary refreshes)
- [ ] Mutations invalidate dashboard queries
