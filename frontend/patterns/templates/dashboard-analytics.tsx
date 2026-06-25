// ============================================================
// Template: Dashboard Analytics
// Pattern: dashboard
// Stack: React + shadcn/ui + React Query + recharts + Tailwind
// USAGE: Copiare, adattare `api` calls, tipi dati, KPI labels
// ============================================================

'use client'

import { useState, useMemo } from 'react'
import { useQueries, keepPreviousData, useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw, TrendingUp, TrendingDown, Minus, DollarSign,
  ShoppingCart, Users, Activity, AlertCircle, Clock, Package,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  Cell,
} from 'recharts'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

type TrendDirection = 'up' | 'down' | 'stable'

interface KpiMetric {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: TrendDirection
}

interface DashboardKpis {
  revenue: KpiMetric
  orders: KpiMetric
  customers: KpiMetric
  conversion: KpiMetric
}

interface RevenuePoint {
  date: string
  value: number
}

interface StatusItem {
  name: string
  value: number
  color: string
}

interface CategoryItem {
  name: string
  value: number
}

interface RecentOrder {
  id: string
  customer: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total: number
  date: string
}

interface DashboardData {
  kpis: DashboardKpis
  revenueData: RevenuePoint[]
  statusData: StatusItem[]
  categoryData: CategoryItem[]
  recentOrders: RecentOrder[]
}

interface DashboardProps {
  title: string
  subtitle?: string
  config?: {
    defaultTimeRange?: string
    autoRefreshInterval?: number
  }
}

type TimeRange = '7d' | '30d' | '90d' | '12m'

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('it-IT').format(n)
}

function formatPercent(n: number): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
}

function trendIcon(trend: TrendDirection) {
  if (trend === 'up') return TrendingUp
  if (trend === 'down') return TrendingDown
  return Minus
}

function trendAriaLabel(title: string, data: KpiMetric): string {
  const formatted = title === 'Revenue' ? formatCurrency(data.current) : formatNumber(data.current)
  const direction = data.trend === 'up' ? 'increasing' : data.trend === 'down' ? 'decreasing' : 'stable'
  return `${title}: ${formatted}, ${direction} by ${Math.abs(data.changePercent).toFixed(1)}% compared to previous period`
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(var(--warning))',
  processing: 'hsl(var(--primary))',
  completed: 'hsl(var(--success))',
  cancelled: 'hsl(var(--muted-foreground))',
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: '12m', label: 'Last year' },
]

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// ──────────────────────────────────────────────
// QUERY HOOK
// ──────────────────────────────────────────────

const API_BASE = '/api/dashboard'

function useDashboardQueries(timeRange: TimeRange) {
  const commonParams = { timeRange }

  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'kpis', commonParams],
        queryFn: async (): Promise<DashboardKpis> => {
          const res = await fetch(`${API_BASE}/kpis?timeRange=${timeRange}`)
          if (!res.ok) throw new Error('Error loading KPI')
          return res.json()
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
      },
      {
        queryKey: ['dashboard', 'revenue', commonParams],
        queryFn: async (): Promise<RevenuePoint[]> => {
          const res = await fetch(`${API_BASE}/revenue?timeRange=${timeRange}`)
          if (!res.ok) throw new Error('Error loading ricavi')
          return res.json()
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
      },
      {
        queryKey: ['dashboard', 'breakdown', commonParams],
        queryFn: async (): Promise<{ statusData: StatusItem[]; categoryData: CategoryItem[] }> => {
          const res = await fetch(`${API_BASE}/breakdown?timeRange=${timeRange}`)
          if (!res.ok) throw new Error('Error loading breakdown')
          return res.json()
        },
        staleTime: 120_000,
        placeholderData: keepPreviousData,
      },
      {
        queryKey: ['dashboard', 'recentOrders', commonParams],
        queryFn: async (): Promise<RecentOrder[]> => {
          const res = await fetch(`${API_BASE}/orders?timeRange=${timeRange}&pageSize=5`)
          if (!res.ok) throw new Error('Error loading ordini recenti')
          return res.json()
        },
        staleTime: 30_000,
        placeholderData: keepPreviousData,
      },
    ],
  })

  const [kpisQuery, revenueQuery, breakdownQuery, ordersQuery] = results

  return {
    kpis: kpisQuery,
    revenue: revenueQuery,
    status: breakdownQuery,
    category: breakdownQuery,
    recentOrders: ordersQuery,
    isRefetching: results.some((q) => q.isRefetching),
    errors: {
      kpis: kpisQuery.error,
      revenue: revenueQuery.error,
      breakdown: breakdownQuery.error,
      orders: ordersQuery.error,
    } as Record<string, Error | null>,
  }
}

// ──────────────────────────────────────────────
// SKELETON COMPONENTS
// ──────────────────────────────────────────────

function KpiCardSkeleton() {
  return (
    <Card className="p-6" aria-busy="true">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-full mt-4" />
    </Card>
  )
}

function ChartSkeleton({ height = 350 }: { height?: number }) {
  return (
    <Card className="p-6" aria-busy="true">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <Card className="p-6" aria-busy="true">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </Card>
  )
}

// ──────────────────────────────────────────────
// STALE BANNER
// ──────────────────────────────────────────────

function StaleBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="default" className="border-destructive bg-destructive/5">
      <Clock className="h-4 w-4 text-destructive" />
      <AlertTitle className="text-destructive">Data not up to date</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        Unable to update data. Showing the latest available data.
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// ──────────────────────────────────────────────
// EMPTY STATE
// ──────────────────────────────────────────────

function EmptyCharts() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Package className="h-12 w-12 mb-3 opacity-40" />
      <p className="text-sm font-medium">No data for the selected period</p>
      <p className="text-xs mt-1">Try selecting a different time range</p>
    </div>
  )
}

// ──────────────────────────────────────────────
// ZONE 2: KPI ROW
// ──────────────────────────────────────────────

function KpiRow({
  data,
  isLoading,
  isStale,
  errors,
  onRetry,
}: {
  data?: DashboardKpis
  isLoading: boolean
  isStale: boolean
  errors: Record<string, Error | null>
  onRetry: (zone: string) => void
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
      </div>
    )
  }

  const kpiConfig: { key: keyof DashboardKpis; title: string; icon: typeof DollarSign; format: (n: number) => string }[] = [
    { key: 'revenue', title: 'Revenue', icon: DollarSign, format: formatCurrency },
    { key: 'orders', title: 'Orders', icon: ShoppingCart, format: formatNumber },
    { key: 'customers', title: 'Customers', icon: Users, format: formatNumber },
    { key: 'conversion', title: 'Conversion', icon: Activity, format: (n) => `${n.toFixed(1)}%` },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {kpiConfig.map(({ key, title, icon: Icon, format }) => {
        const error = errors[key]
        const metric = data?.[key]

        if (error) {
          return (
            <Card key={key} className="p-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive font-medium">{title}</p>
                <Button variant="ghost" size="sm" onClick={() => onRetry(key)}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            </Card>
          )
        }

        if (!metric) {
          return (
            <Card key={key} className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-muted p-3" aria-hidden="true">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{title}</p>
                  <p className="text-3xl font-bold tracking-tight mt-1">&mdash;</p>
                </div>
              </div>
            </Card>
          )
        }

        const TrendIcon = trendIcon(metric.trend)
        const isPositive = metric.changePercent >= 0
        const trendColor = metric.trend === 'stable'
          ? 'text-muted-foreground'
          : (metric.trend === 'up' ? 'text-success' : 'text-destructive')

        return (
          <Card
            key={key}
            className={cn('p-6', isStale && 'opacity-60')}
            role="article"
            aria-label={trendAriaLabel(title, metric)}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-muted p-3" aria-hidden="true">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
                <p className="text-3xl font-bold tracking-tight mt-1">
                  {format(metric.current)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <div className={cn('flex items-center gap-1', trendColor)}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{formatPercent(metric.changePercent)}</span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">vs prev. period</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────
// ZONE 3: PRIMARY CHART (AreaChart)
// ──────────────────────────────────────────────

function RevenueChart({
  data,
  isLoading,
  isEmpty,
}: {
  data?: RevenuePoint[]
  isLoading: boolean
  isEmpty: boolean
}) {
  if (isLoading) return <ChartSkeleton height={350} />

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
      {isEmpty || !data || data.length === 0 ? (
        <div style={{ height: 350 }}>
          <EmptyCharts />
        </div>
      ) : (
        <>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v: number) => formatCurrency(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="url(#revenue-gradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Accessible data table for screen readers */}
          <div className="sr-only" role="table" aria-label="Revenue data by date">
            {data.map((row) => (
              <div key={row.date} role="row">
                <span role="cell">{row.date}</span>
                <span role="cell">{formatCurrency(row.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

// ──────────────────────────────────────────────
// ZONE 4a: PIE CHART — Orders by Status
// ──────────────────────────────────────────────

function StatusPieChart({
  data,
  isLoading,
  isEmpty,
}: {
  data?: StatusItem[]
  isLoading: boolean
  isEmpty: boolean
}) {
  if (isLoading) return <ChartSkeleton height={250} />

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
      {isEmpty || !data || data.length === 0 ? (
        <div style={{ height: 250 }}>
          <EmptyCharts />
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatNumber(value), 'Orders']}
              />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
                    {STATUS_LABELS[value] || value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="sr-only" role="table" aria-label="Orders by status">
            {data.map((row) => (
              <div key={row.name} role="row">
                <span role="cell">{STATUS_LABELS[row.name] || row.name}</span>
                <span role="cell">{formatNumber(row.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

// ──────────────────────────────────────────────
// ZONE 4b: BAR CHART — Top Categories
// ──────────────────────────────────────────────

function CategoryBarChart({
  data,
  isLoading,
  isEmpty,
}: {
  data?: CategoryItem[]
  isLoading: boolean
  isEmpty: boolean
}) {
  if (isLoading) return <ChartSkeleton height={250} />

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
      {isEmpty || !data || data.length === 0 ? (
        <div style={{ height: 250 }}>
          <EmptyCharts />
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatNumber(value), 'Orders']}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="sr-only" role="table" aria-label="Top categories by orders">
            {data.map((row) => (
              <div key={row.name} role="row">
                <span role="cell">{row.name}</span>
                <span role="cell">{formatNumber(row.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

// ──────────────────────────────────────────────
// ZONE 5: DETAIL TABLE (Ultimi Ordini)
// ──────────────────────────────────────────────

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'completed': return 'default'
    case 'processing': return 'secondary'
    case 'pending': return 'outline'
    case 'cancelled': return 'destructive'
    default: return 'outline'
  }
}

function RecentOrdersTable({
  data,
  isLoading,
  isEmpty,
}: {
  data?: RecentOrder[]
  isLoading: boolean
  isEmpty: boolean
}) {
  if (isLoading) return <TableSkeleton />

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
      {isEmpty || !data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Package className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">No orders in the selected period</p>
        </div>
      ) : (
        <>
          <ScrollArea className="max-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(order.status)}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {order.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <Button variant="link" className="mt-2" asChild>
            <a href="/orders">View all orders &rarr;</a>
          </Button>
        </>
      )}
    </Card>
  )
}

// ──────────────────────────────────────────────
// ERROR ZONE WRAPPER
// ──────────────────────────────────────────────

function ErrorZone({
  title,
  error,
  onRetry,
}: {
  title: string
  error: Error
  onRetry: () => void
}) {
  return (
    <Card className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error &mdash; {title}</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          {error.message}
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </Card>
  )
}

// ──────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ──────────────────────────────────────────────

export function DashboardAnalytics({
  title,
  subtitle,
  config,
}: DashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const candidate = config?.defaultTimeRange
    return candidate && (candidate === '7d' || candidate === '30d' || candidate === '90d' || candidate === '12m')
      ? candidate
      : '30d'
  })

  const {
    kpis, revenue, status, category, recentOrders,
    isRefetching, errors,
  } = useDashboardQueries(timeRange)

  const queryClient = useQueryClient()

  const handleRetryZone = (zoneKey: string) => {
    queryClient.refetchQueries({ queryKey: ['dashboard', zoneKey, { timeRange }] })
  }

  const handleRetryAll = () => {
    queryClient.refetchQueries({
      predicate: (query) => {
        const key = query.queryKey
        return Array.isArray(key) && key[0] === 'dashboard'
      },
    })
  }

  // Derived state
  const isLoading = kpis.isLoading && revenue.isLoading && status.isLoading && recentOrders.isLoading
  const isStale = kpis.isStale || revenue.isStale || status.isStale || recentOrders.isStale

  const lastUpdated = useMemo(() => {
    if (kpis.dataUpdatedAt) {
      return new Date(kpis.dataUpdatedAt).toLocaleTimeString('it-IT')
    }
    return '—'
  }, [kpis.dataUpdatedAt])

  // ── RENDER ──

  return (
    <div className="space-y-6" role="region" aria-label={`Dashboard ${title}`}>
      {/* ZONE 1: CONTEXT BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {subtitle && <>{subtitle} &middot; </>}
            Last updated: {lastUpdated}
            {isRefetching && (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                Updating&hellip;
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="dashboard-time-range" className="sr-only">
            Time range
          </label>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger id="dashboard-time-range" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRetryAll}
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* STALE BANNER */}
      {isStale && !isLoading && <StaleBanner onRetry={handleRetryAll} />}

      {/* ZONE 2: KPI ROW */}
      {errors.kpis ? (
        <ErrorZone title="KPI" error={errors.kpis} onRetry={() => handleRetryZone('kpis')} />
      ) : (
        <KpiRow
          data={kpis.data}
          isLoading={kpis.isLoading && !kpis.data}
          isStale={isStale}
          errors={errors}
          onRetry={handleRetryZone}
        />
      )}

      {/* ZONE 3: PRIMARY CHART */}
      {errors.revenue && !revenue.data ? (
        <ErrorZone title="Andamento Ricavi" error={errors.revenue} onRetry={() => handleRetryZone('revenue')} />
      ) : (
        <section aria-label="Revenue Trend section">
          <RevenueChart
            data={revenue.data}
            isLoading={revenue.isLoading && !revenue.data}
            isEmpty={!!revenue.data && revenue.data.length === 0}
          />
        </section>
      )}

      {/* ZONE 4: SUPPORTING VIEWS */}
      <div className="grid gap-4 lg:grid-cols-2">
        {errors.breakdown && !status.data ? (
          <ErrorZone title="Orders by Status" error={errors.breakdown} onRetry={() => handleRetryZone('breakdown')} />
        ) : (
          <section aria-label="Orders by Status">
            <StatusPieChart
              data={status.data?.statusData}
              isLoading={status.isLoading && !status.data}
              isEmpty={!!status.data?.statusData && status.data.statusData.length === 0}
            />
          </section>
        )}
        {errors.breakdown && !category.data ? (
          <ErrorZone title="Top Categories" error={errors.breakdown} onRetry={() => handleRetryZone('breakdown')} />
        ) : (
          <section aria-label="Top Categories">
            <CategoryBarChart
              data={category.data?.categoryData}
              isLoading={category.isLoading && !category.data}
              isEmpty={!!category.data?.categoryData && category.data.categoryData.length === 0}
            />
          </section>
        )}
      </div>

      {/* ZONE 5: DETAIL TABLE */}
      {errors.orders && !recentOrders.data ? (
        <ErrorZone title="Ultimi Ordini" error={errors.orders} onRetry={() => handleRetryZone('orders')} />
      ) : (
        <section aria-label="Ultimi Ordini">
          <RecentOrdersTable
            data={recentOrders.data}
            isLoading={recentOrders.isLoading && !recentOrders.data}
            isEmpty={!!recentOrders.data && recentOrders.data.length === 0}
          />
        </section>
      )}
    </div>
  )
}
