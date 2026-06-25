import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const nextNav = vi.hoisted(() => ({
  push: vi.fn(),
}))

const reactQuery = vi.hoisted(() => ({
  useQueries: vi.fn(),
  useQueryClient: vi.fn(() => ({
    refetchQueries: vi.fn(),
  })),
  keepPreviousData: Symbol('keepPreviousData'),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nextNav.push }),
}))

vi.mock('@tanstack/react-query', () => reactQuery)

vi.mock('lucide-react', () => ({
  RefreshCw: ({ className }: Record<string, unknown>) => <span data-testid="icon-refresh" className={className as string} />,
  TrendingUp: () => <span data-testid="icon-trending-up" />,
  TrendingDown: () => <span data-testid="icon-trending-down" />,
  Minus: () => <span data-testid="icon-minus" />,
  DollarSign: () => <span data-testid="icon-dollar" />,
  ShoppingCart: () => <span data-testid="icon-cart" />,
  Users: () => <span data-testid="icon-users" />,
  Activity: () => <span data-testid="icon-activity" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  Clock: () => <span data-testid="icon-clock" />,
  Package: () => <span data-testid="icon-package" />,
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: Record<string, unknown>) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: Record<string, unknown>) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  PieChart: ({ children }: Record<string, unknown>) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: Record<string, unknown>) => <div data-testid="pie">{children}</div>,
  BarChart: ({ children }: Record<string, unknown>) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, 'aria-label': ariaLabel, ...props }: Record<string, unknown>) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel as string}
      data-variant={variant}
      data-size={size}
      className={className as string}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, style, ...props }: Record<string, unknown>) => (
    <div className={`animate-pulse ${className as string}`} style={style} {...props} />
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: Record<string, unknown>) => (
    <span data-variant={variant} className={className as string} {...props}>{children}</span>
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: Record<string, unknown>) => (
    <div data-testid="select" data-value={value}>
      <button onClick={() => onValueChange?.('30d')}>Change to 30d</button>
      <button onClick={() => onValueChange?.('7d')}>Change to 7d</button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  SelectItem: ({ children, value }: Record<string, unknown>) => <div data-value={value}>{children as string}</div>,
  SelectTrigger: ({ children, id, ...props }: Record<string, unknown>) => (
    <button id={id as string} {...props}>{children}</button>
  ),
  SelectValue: () => <span />,
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: Record<string, unknown>) => <div>{children}</div>,
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: Record<string, unknown>) => (
    <div data-variant={variant} className={className as string} {...props}>{children}</div>
  ),
  AlertDescription: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  AlertTitle: ({ children, className }: Record<string, unknown>) => <div className={className as string}>{children}</div>,
}))

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: Record<string, unknown>) => <table>{children}</table>,
  TableBody: ({ children }: Record<string, unknown>) => <tbody>{children}</tbody>,
  TableCell: ({ children, className }: Record<string, unknown>) => <td className={className as string}>{children}</td>,
  TableHead: ({ children, className }: Record<string, unknown>) => <th className={className as string}>{children}</th>,
  TableHeader: ({ children }: Record<string, unknown>) => <thead>{children}</thead>,
  TableRow: ({ children }: Record<string, unknown>) => <tr>{children}</tr>,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}))

import { DashboardAnalytics } from '../dashboard-analytics'

function createQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    isStale: false,
    isRefetching: false,
    error: null,
    dataUpdatedAt: 0,
    ...overrides,
  }
}

const sampleKpis = {
  revenue: { current: 50000, previous: 45000, change: 5000, changePercent: 11.1, trend: 'up' as const },
  orders: { current: 1200, previous: 1100, change: 100, changePercent: 9.1, trend: 'up' as const },
  customers: { current: 850, previous: 800, change: 50, changePercent: 6.25, trend: 'up' as const },
  conversion: { current: 3.2, previous: 3.0, change: 0.2, changePercent: 6.7, trend: 'up' as const },
}

const sampleRevenue = [
  { date: '2026-01-01', value: 1000 },
  { date: '2026-01-02', value: 1200 },
]

const sampleBreakdown = {
  statusData: [
    { name: 'completed', value: 100, color: '#22c55e' },
    { name: 'pending', value: 30, color: '#eab308' },
  ],
  categoryData: [
    { name: 'Elettronica', value: 500 },
    { name: 'Abbigliamento', value: 300 },
  ],
}

const sampleOrders = [
  { id: 'ORD-001', customer: 'Mario Rossi', status: 'completed' as const, total: 150, date: '2026-06-01' },
  { id: 'ORD-002', customer: 'Luca Bianchi', status: 'pending' as const, total: 320, date: '2026-06-02' },
]

function mockLoadingState() {
  reactQuery.useQueries.mockReturnValue([
    createQueryResult({ isLoading: true, data: undefined }),
    createQueryResult({ isLoading: true, data: undefined }),
    createQueryResult({ isLoading: true, data: undefined }),
    createQueryResult({ isLoading: true, data: undefined }),
  ])
}

function mockLoadedState() {
  reactQuery.useQueries.mockReturnValue([
    createQueryResult({ data: sampleKpis, dataUpdatedAt: Date.now() }),
    createQueryResult({ data: sampleRevenue, dataUpdatedAt: Date.now() }),
    createQueryResult({ data: sampleBreakdown, dataUpdatedAt: Date.now() }),
    createQueryResult({ data: sampleOrders, dataUpdatedAt: Date.now() }),
  ])
}

beforeEach(() => {
  reactQuery.useQueries.mockReset()
  reactQuery.useQueries.mockReturnValue([
    createQueryResult({ isLoading: true, data: undefined }),
    createQueryResult({ isLoading: true, data: undefined }),
    createQueryResult({ isLoading: true, data: undefined }),
    createQueryResult({ isLoading: true, data: undefined }),
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DashboardAnalytics', () => {
  it('shows loading skeletons initially', () => {
    mockLoadingState()

    render(<DashboardAnalytics title="Dashboard" />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders KPI cards when loaded', () => {
    mockLoadedState()

    render(<DashboardAnalytics title="Dashboard" />)

    expect(screen.getByText('Ricavi')).toBeInTheDocument()
    expect(screen.getByText('Ordini')).toBeInTheDocument()
    expect(screen.getByText('Clienti')).toBeInTheDocument()
    expect(screen.getByText('Conversione')).toBeInTheDocument()
  })

  it('renders revenue chart when loaded', () => {
    mockLoadedState()

    render(<DashboardAnalytics title="Dashboard" />)

    expect(screen.getByText('Andamento Ricavi')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('renders supporting charts when loaded', () => {
    mockLoadedState()

    render(<DashboardAnalytics title="Dashboard" />)

    expect(screen.getByText('Ordini per Stato')).toBeInTheDocument()
    expect(screen.getByText('Top Categorie')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('time range selector changes data', () => {
    const refetchQueries = vi.fn()
    reactQuery.useQueryClient.mockReturnValue({ refetchQueries })

    mockLoadedState()

    render(<DashboardAnalytics title="Dashboard" />)

    const changeButton = screen.getByText('Change to 7d')
    fireEvent.click(changeButton)

    expect(refetchQueries).toHaveBeenCalled()
  })

  it('refresh button works', () => {
    const refetchQueries = vi.fn()
    reactQuery.useQueryClient.mockReturnValue({ refetchQueries })

    mockLoadedState()

    render(<DashboardAnalytics title="Dashboard" />)

    const refreshButton = screen.getByLabelText('Aggiorna dati')
    fireEvent.click(refreshButton)

    expect(refetchQueries).toHaveBeenCalled()
  })

  it('shows stale data warning', () => {
    reactQuery.useQueries.mockReturnValue([
      createQueryResult({ data: sampleKpis, isStale: true, dataUpdatedAt: Date.now() }),
      createQueryResult({ data: sampleRevenue, isStale: true, dataUpdatedAt: Date.now() }),
      createQueryResult({ data: sampleBreakdown, isStale: true, dataUpdatedAt: Date.now() }),
      createQueryResult({ data: sampleOrders, isStale: true, dataUpdatedAt: Date.now() }),
    ])

    render(<DashboardAnalytics title="Dashboard" />)

    expect(screen.getByText('Dati non aggiornati')).toBeInTheDocument()
  })

  it('partial error shows inline per zone', () => {
    reactQuery.useQueries.mockReturnValue([
      createQueryResult({ data: sampleKpis, dataUpdatedAt: Date.now() }),
      createQueryResult({
        isError: true,
        error: new Error('Errore API'),
        data: undefined,
      }),
      createQueryResult({ data: sampleBreakdown, dataUpdatedAt: Date.now() }),
      createQueryResult({ data: sampleOrders, dataUpdatedAt: Date.now() }),
    ])

    render(<DashboardAnalytics title="Dashboard" />)

    expect(screen.getByText('Andamento Ricavi')).toBeInTheDocument()
    const revenueSection = screen.getByText('Andamento Ricavi').closest('div')
    expect(revenueSection?.textContent).toMatch(/Errore/)
  })

  it('refetching shows spinner while keeping data visible', () => {
    reactQuery.useQueries.mockReturnValue([
      createQueryResult({ data: sampleKpis, isRefetching: true, dataUpdatedAt: Date.now() }),
      createQueryResult({ data: sampleRevenue, dataUpdatedAt: Date.now() }),
      createQueryResult({ data: sampleBreakdown, dataUpdatedAt: Date.now() }),
      createQueryResult({ data: sampleOrders, dataUpdatedAt: Date.now() }),
    ])

    render(<DashboardAnalytics title="Dashboard" />)

    expect(screen.getByText('Ricavi')).toBeInTheDocument()
  })

  it('empty state when no data in period', () => {
    reactQuery.useQueries.mockReturnValue([
      createQueryResult({
        data: { revenue: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' }, orders: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' }, customers: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' }, conversion: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' } },
        dataUpdatedAt: Date.now(),
      }),
      createQueryResult({ data: [], dataUpdatedAt: Date.now() }),
      createQueryResult({ data: { statusData: [], categoryData: [] }, dataUpdatedAt: Date.now() }),
      createQueryResult({ data: [], dataUpdatedAt: Date.now() }),
    ])

    render(<DashboardAnalytics title="Dashboard" />)

    expect(screen.getByText('Nessun dato per il periodo')).toBeInTheDocument()
  })
})
