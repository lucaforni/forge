// ============================================================
// Template: KPI Card
// Pattern: kpi-card
// Stack: React + shadcn/ui + Lucide + Tailwind + CVA
// USAGE: Copiare e adattare titolo, dati, formato, variante
// ============================================================

'use client'

import { type LucideIcon, TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

type TrendDirection = 'up' | 'down' | 'stable'

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
  variant?: VariantProps<typeof kpiCardVariants>['variant']
  higherIsBetter?: boolean
  isLoading?: boolean
  isStale?: boolean
  error?: Error | null
  onRetry?: () => void
  onClick?: () => void
}

// ──────────────────────────────────────────────
// CVA VARIANT
// ──────────────────────────────────────────────

const kpiCardVariants = cva('', {
  variants: {
    variant: {
      default: '',
      success: 'border-l-4 border-l-success',
      warning: 'border-l-4 border-l-warning',
      destructive: 'border-l-4 border-l-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function defaultFormat(n: number): string {
  return new Intl.NumberFormat('it-IT').format(n)
}

function trendColor(trend: TrendDirection, isPositive: boolean, higherIsBetter: boolean) {
  if (trend === 'stable') return 'text-muted-foreground'

  const isImprovement = higherIsBetter ? isPositive : !isPositive
  if (isImprovement) return 'text-success'
  return 'text-destructive'
}

function TrendIcon({ trend, className }: { trend: TrendDirection; className?: string }) {
  if (trend === 'up') return <TrendingUp className={className} aria-hidden="true" />
  if (trend === 'down') return <TrendingDown className={className} aria-hidden="true" />
  return <Minus className={className} aria-hidden="true" />
}

function trendLabel(trend: TrendDirection): string {
  switch (trend) {
    case 'up': return 'increasing'
    case 'down': return 'decreasing'
    case 'stable': return 'stable'
  }
}

// ──────────────────────────────────────────────
// SPARKLINE (pure SVG)
// ──────────────────────────────────────────────

function SparklineChart({ data, trend }: { data: number[]; trend: TrendDirection }) {
  if (data.length < 2) {
    return (
      <svg
        width="100%"
        height="32"
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <line
          x1="0" y1="16" x2="100" y2="16"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground/40"
        />
      </svg>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 100
  const height = 32
  const padding = 2

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const lineColor =
    trend === 'stable'
      ? 'text-muted-foreground'
      : trend === 'up'
        ? 'text-success'
        : 'text-destructive'

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`sparkline-fill-${trend}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={lineColor}
      />
      <polygon
        points={`0,${height} ${points.join(' ')} ${width},${height}`}
        fill={`url(#sparkline-fill-${trend})`}
        className={lineColor}
      />
    </svg>
  )
}

// ──────────────────────────────────────────────
// STATES
// ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <Card className="p-6" aria-busy="true">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-full mt-4" />
    </Card>
  )
}

function ErrorState({ error, onRetry }: { error: Error | null; onRetry?: () => void }) {
  return (
    <Card className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          {error?.message ?? 'Unknown error'}
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </Card>
  )
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function KpiCard({
  title,
  data,
  icon: Icon,
  format = defaultFormat,
  variant = 'default',
  higherIsBetter = true,
  isLoading,
  isStale,
  error,
  onRetry,
  onClick,
}: KpiCardProps) {
  // LOADING
  if (isLoading) return <LoadingSkeleton />

  // ERROR
  if (error) return <ErrorState error={error} onRetry={onRetry} />

  // NO DATA (empty)
  if (!data) {
    return (
      <Card className={cn('p-6', kpiCardVariants({ variant }))}>
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="rounded-full bg-muted p-3" aria-hidden="true">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight mt-1">&mdash;</p>
          </div>
        </div>
      </Card>
    )
  }

  const isPositive = data.changePercent >= 0
  const colorClass = trendColor(data.trend, isPositive, higherIsBetter)

  const ariaLabel = `${title}: ${format(data.current)}${data.trend !== 'stable'
    ? `, ${trendLabel(data.trend)} by ${Math.abs(data.changePercent).toFixed(1)}%`
    : ''} compared to previous period`

  return (
    <Card
      className={cn(
        'p-6',
        kpiCardVariants({ variant }),
        isStale && 'opacity-60',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
      )}
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      aria-label={ariaLabel}
    >
      {/* ICON + VALUE + TREND ROW */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
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
            {format(data.current)}
          </p>
        </div>

        {/* TREND */}
        <div className="flex md:flex-col items-center md:items-end gap-1 md:gap-0.5 shrink-0">
          <div className={cn('flex items-center gap-1', colorClass)}>
            <TrendIcon trend={data.trend} className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            vs prev. period
          </p>
        </div>
      </div>

      {/* STALE INDICATOR */}
      {isStale && (
        <p className="mt-2 text-xs text-destructive flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          Data not up to date
        </p>
      )}

      {/* SPARKLINE */}
      {data.sparklineData && data.sparklineData.length > 0 && (
        <div className="mt-4" aria-hidden="true">
          <SparklineChart data={data.sparklineData} trend={data.trend} />
        </div>
      )}
    </Card>
  )
}
