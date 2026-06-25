import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

vi.mock('class-variance-authority', async () => {
  const actual = await vi.importActual('class-variance-authority')
  return { ...actual }
})

vi.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="trend-up-icon" />,
  TrendingDown: () => <span data-testid="trend-down-icon" />,
  Minus: () => <span data-testid="trend-minus-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({
    children, className, onClick, role, tabIndex, onKeyDown,
    'aria-busy': ariaBusy, 'aria-label': ariaLabel,
  }: any) => (
    <div
      data-testid="card"
      className={className}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      aria-busy={ariaBusy}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: any) => <div data-testid="skeleton" {...props} />,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button data-testid="button" onClick={onClick}>{children}</button>
  ),
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>{children}</div>
  ),
  AlertTitle: ({ children }: any) => <h3>{children}</h3>,
  AlertDescription: ({ children }: any) => <p>{children}</p>,
}))

import { KpiCard } from '../kpi-card'

describe('KpiCard', () => {
  const defaultData = {
    current: 1000,
    previous: 850,
    change: 150,
    changePercent: 17.6,
    trend: 'up' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton when isLoading', () => {
    const { container } = render(
      <KpiCard title="Revenue" isLoading />,
    )

    expect(container.querySelector('[aria-busy="true"]')).toBeDefined()
    const skeletons = container.querySelectorAll('[data-testid="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders title and formatted value when populated', () => {
    render(
      <KpiCard
        title="Revenue"
        data={defaultData}
        format={(v) => `${v} €`}
      />,
    )

    expect(screen.getByText('Revenue')).toBeDefined()
    expect(screen.getByText('1000 €')).toBeDefined()
  })

  it('renders trend arrow up with percent', () => {
    render(<KpiCard title="Revenue" data={defaultData} />)

    expect(screen.getByTestId('trend-up-icon')).toBeDefined()
    expect(screen.getByText('+17.6%')).toBeDefined()
  })

  it('renders trend arrow down with percent', () => {
    const downData = { ...defaultData, trend: 'down' as const, changePercent: -8.3, change: -83, current: 767, previous: 850 }
    render(<KpiCard title="Revenue" data={downData} />)

    expect(screen.getByTestId('trend-down-icon')).toBeDefined()
    expect(screen.getByText('-8.3%')).toBeDefined()
  })

  it('renders semantic colors based on higherIsBetter', () => {
    const { container } = render(
      <KpiCard title="Churn" data={defaultData} higherIsBetter={false} />,
    )

    const trendColorDiv = container.querySelector('.items-center.gap-1.text-success')
    expect(trendColorDiv).toBeNull()

    const trendDestructiveDiv = container.querySelector('.items-center.gap-1.text-destructive')
    expect(trendDestructiveDiv).not.toBeNull()
  })

  it('onClick handler works', () => {
    const onClick = vi.fn()
    render(<KpiCard title="Revenue" data={defaultData} onClick={onClick} />)

    const card = screen.getByTestId('card')
    fireEvent.click(card)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders stale indicator', () => {
    render(<KpiCard title="Revenue" data={defaultData} isStale />)

    expect(screen.getByText('Dati non aggiornati')).toBeDefined()
    expect(screen.getByTestId('card').className).toContain('opacity-60')
  })

  it('has correct aria-label with value and trend', () => {
    render(<KpiCard title="Revenue" data={defaultData} />)

    const card = screen.getByTestId('card')
    expect(card.getAttribute('aria-label')).toMatch(/Revenue.*1000.*in aumento/)
  })

  it('has aria-label stable variant', () => {
    const stableData = { ...defaultData, trend: 'stable' as const, changePercent: 0 }
    render(<KpiCard title="Revenue" data={stableData} />)

    const card = screen.getByTestId('card')
    expect(card.getAttribute('aria-label')).toBe(
      'Revenue: 1000 rispetto al periodo precedente',
    )
  })

  it('sparkline renders when data provided', () => {
    const sparklineData = { ...defaultData, sparklineData: [10, 20, 30, 40, 50] }
    const { container } = render(<KpiCard title="Revenue" data={sparklineData} />)

    const polyline = container.querySelector('polyline')
    expect(polyline).not.toBeNull()
  })

  it('renders error state with retry', () => {
    const onRetry = vi.fn()
    render(<KpiCard title="Revenue" error="API failed" onRetry={onRetry} />)

    expect(screen.getByText('Errore')).toBeInTheDocument()
    expect(screen.getByText('API failed')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('button'))
    expect(onRetry).toHaveBeenCalled()
  })
})
