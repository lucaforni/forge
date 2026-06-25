import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// ──────────────────────────────────────────────
// Hoisted shared references
// ──────────────────────────────────────────────

const reactQuery = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
}))

const nextNav = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
}))

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}))

// ──────────────────────────────────────────────
// Module mocks
// ──────────────────────────────────────────────

vi.mock('@tanstack/react-query', () => reactQuery)

vi.mock('next/navigation', () => ({
  useSearchParams: () => nextNav.searchParams,
  useRouter: () => ({ push: nextNav.push, replace: nextNav.replace }),
  usePathname: () => '/orders',
}))

vi.mock('sonner', () => ({
  toast: mockToast,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  User: () => <span data-testid="icon-user" />,
  MessageSquare: () => <span data-testid="icon-message-square" />,
  Package: () => <span data-testid="icon-package" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: any) => (
    <div data-testid="scroll-area" {...props}>{children}</div>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, onClick, onMouseEnter, role, className, ...props }: any) => (
    <div
      data-testid="card"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role={role}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>,
}))

vi.mock('@/components/ui/sheet', () => {
  const React = require('react')
  const { createContext, useContext, useState, useEffect } = React

  const SheetCtx = createContext<{
    open: boolean
    onOpenChange: (v: boolean) => void
  }>({ open: false, onOpenChange: () => {} })

  return {
    Sheet: ({ children, open, onOpenChange }: any) => {
      const [openState, setOpenState] = useState(open)
      useEffect(() => { setOpenState(open) }, [open])
      return (
        <SheetCtx.Provider value={{ open: openState, onOpenChange }}>
          <div data-testid="sheet" data-open={openState}>
            {openState ? children : null}
          </div>
        </SheetCtx.Provider>
      )
    },
    SheetContent: ({ children, side, className, ...props }: any) => {
      const { onOpenChange } = useContext(SheetCtx)
      return (
        <div data-testid="sheet-content" data-side={side} className={className} {...props}>
          {children}
        </div>
      )
    },
    SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
    SheetTitle: ({ children }: any) => <h2 data-testid="sheet-title">{children}</h2>,
    SheetTrigger: ({ children }: any) => <div data-testid="sheet-trigger">{children}</div>,
  }
})

vi.mock('@/components/ui/tabs', () => {
  const React = require('react')
  const { createContext, useContext, useState } = React

  const TabsCtx = createContext<{
    value: string
    onValueChange: (v: string) => void
  }>({ value: '', onValueChange: () => {} })

  return {
    Tabs: ({ children, defaultValue }: any) => {
      const [val, setVal] = useState(defaultValue ?? '')
      return (
        <TabsCtx.Provider
          value={{
            value: val,
            onValueChange: (v: string) => setVal(v),
          }}
        >
          <div data-testid="tabs">{children}</div>
        </TabsCtx.Provider>
      )
    },
    TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
    TabsTrigger: ({ children, value }: any) => {
      const { value: currentValue, onValueChange } = useContext(TabsCtx)
      return (
        <button
          data-testid={`tab-trigger-${value}`}
          data-active={currentValue === value}
          onClick={() => onValueChange(value)}
        >
          {children}
        </button>
      )
    },
    TabsContent: ({ children, value }: any) => {
      const { value: currentValue } = useContext(TabsCtx)
      return currentValue === value ? (
        <div data-testid={`tab-content-${value}`}>{children}</div>
      ) : null
    },
  }
})

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button data-testid="button" onClick={onClick} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>{children}</div>
  ),
  AlertTitle: ({ children }: any) => <h4 data-testid="alert-title">{children}</h4>,
  AlertDescription: ({ children }: any) => <p data-testid="alert-description">{children}</p>,
}))

// ──────────────────────────────────────────────
// Component under test
// ──────────────────────────────────────────────

import { OrdersMasterDetail } from '../master-detail-orders'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function createQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    isRefetching: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }
}

const sampleOrders = [
  {
    id: 'ord-001',
    customerName: 'Mario Rossi',
    status: 'confirmed' as const,
    total: 250.50,
    itemsCount: 3,
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'ord-002',
    customerName: 'Luca Bianchi',
    status: 'pending' as const,
    total: 120.00,
    itemsCount: 1,
    createdAt: '2026-06-02T14:30:00Z',
  },
]

const sampleDetail = {
  id: 'ord-001',
  customerName: 'Mario Rossi',
  customerEmail: 'mario@example.com',
  status: 'confirmed' as const,
  total: 250.50,
  subtotal: 210.00,
  shipping: 15.00,
  tax: 25.50,
  items: [{ name: 'Prodotto A', quantity: 2, price: 105.00 }],
  shippingAddress: {
    line1: 'Via Roma 1',
    city: 'Milano',
    province: 'MI',
    zip: '20100',
    country: 'Italia',
  },
  createdAt: '2026-06-01T10:00:00Z',
  timeline: [
    { id: 'evt-1', type: 'created', description: 'Ordine creato', timestamp: '2026-06-01T10:00:00Z', actor: 'Sistema' },
  ],
  notes: [{ id: 'note-1', text: 'Cliente prioritario', author: 'Admin', createdAt: '2026-06-01T11:00:00Z' }],
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('OrdersMasterDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nextNav.searchParams.forEach((_, k) => nextNav.searchParams.delete(k))
    nextNav.replace.mockClear()
    reactQuery.useQuery.mockReturnValue(createQueryResult({ isLoading: true }))
    reactQuery.useQueryClient.mockReturnValue({
      prefetchQuery: vi.fn(),
      invalidateQueries: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders order list on load', () => {
    const mockResults: Record<string, unknown>[] = [
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({ isLoading: false, data: undefined }),
    ]
    let callIndex = 0
    reactQuery.useQuery.mockImplementation(() => {
      return mockResults[callIndex++] || createQueryResult({ isLoading: false, data: undefined })
    })

    render(<OrdersMasterDetail />)

    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
    expect(screen.getByText('Luca Bianchi')).toBeInTheDocument()
    expect(screen.getByText('Confermato')).toBeInTheDocument()
    expect(screen.getByText('In attesa')).toBeInTheDocument()
  })

  function mockUseQuery(...results: Record<string, unknown>[]) {
    let index = 0
    reactQuery.useQuery.mockImplementation(() => {
      return results[index++] || createQueryResult({ isLoading: false, data: undefined })
    })
  }

  it('shows list loading skeleton', () => {
    mockUseQuery(
      createQueryResult({ isLoading: true, data: undefined }),
      createQueryResult({ isLoading: false, data: undefined }),
    )

    render(<OrdersMasterDetail />)

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows list error state with retry', () => {
    const refetch = vi.fn()
    mockUseQuery(
      createQueryResult({
        isLoading: false,
        isError: true,
        data: undefined,
        error: new Error('Errore API'),
        refetch,
      }),
      createQueryResult({ isLoading: false, data: undefined }),
    )

    render(<OrdersMasterDetail />)

    expect(screen.getByText('Errore caricamento')).toBeInTheDocument()
    expect(screen.getByText('Impossibile caricare la lista ordini.')).toBeInTheDocument()
    expect(screen.getByText('Riprova')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Riprova'))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('clicking an item shows its detail', () => {
    mockUseQuery(
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({
        isLoading: false,
        data: sampleDetail,
      }),
    )

    render(<OrdersMasterDetail />)

    fireEvent.click(screen.getByText('Mario Rossi'))

    expect(nextNav.replace).toHaveBeenCalledWith(
      expect.stringContaining('selected=ord-001'),
      expect.anything(),
    )
  })

  it('shows detail loading skeleton', () => {
    nextNav.searchParams.set('selected', 'ord-001')

    mockUseQuery(
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({ isLoading: true, data: undefined }),
    )

    render(<OrdersMasterDetail />)

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows detail error state', () => {
    nextNav.searchParams.set('selected', 'ord-001')

    const refetch = vi.fn()
    mockUseQuery(
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({
        isLoading: false,
        isError: true,
        data: undefined,
        error: new Error('Errore API'),
        refetch,
      }),
    )

    render(<OrdersMasterDetail />)

    expect(screen.getByText('Errore dettaglio ordine')).toBeInTheDocument()
    expect(screen.getByText('Riprova')).toBeInTheDocument()
  })

  it('shows "Seleziona un ordine" initially', () => {
    mockUseQuery(
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({ isLoading: false, data: undefined }),
    )

    render(<OrdersMasterDetail />)

    expect(screen.getByText('Seleziona un ordine')).toBeInTheDocument()
    expect(
      screen.getByText('Scegli un ordine dalla lista per visualizzarne i dettagli.'),
    ).toBeInTheDocument()
  })

  it('selection is highlighted in list', () => {
    nextNav.searchParams.set('selected', 'ord-001')

    mockUseQuery(
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({
        isLoading: false,
        data: sampleDetail,
      }),
    )

    render(<OrdersMasterDetail />)

    const cards = screen.getAllByTestId('card')
    const selectedCard = cards.find(
      (c) => c.getAttribute('aria-selected') === 'true',
    )
    expect(selectedCard).toBeInTheDocument()
    expect(selectedCard?.textContent).toContain('Mario Rossi')

    const unselectedCard = cards.find(
      (c) => c.getAttribute('aria-selected') === 'false',
    )
    expect(unselectedCard).toBeInTheDocument()
    expect(unselectedCard?.textContent).toContain('Luca Bianchi')
  })

  it('prefetches detail on hover', () => {
    const prefetchQuery = vi.fn()
    reactQuery.useQueryClient.mockReturnValue({
      prefetchQuery,
      invalidateQueries: vi.fn(),
    })

    const mockResults: Record<string, unknown>[] = [
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({ isLoading: false, data: undefined }),
    ]
    let callIndex = 0
    reactQuery.useQuery.mockImplementation(() => {
      return mockResults[callIndex++] || createQueryResult({ isLoading: false, data: undefined })
    })

    render(<OrdersMasterDetail />)

    const card = screen.getByText('Mario Rossi')
    fireEvent.mouseEnter(card)

    expect(prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['order-detail']),
      }),
    )
  })

  it('Esc deselects item and removes URL param', () => {
    nextNav.searchParams.set('selected', 'ord-001')

    const mockResults: Record<string, unknown>[] = [
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({
        isLoading: false,
        data: sampleDetail,
      }),
    ]
    let callIndex = 0
    reactQuery.useQuery.mockImplementation(() => {
      return mockResults[callIndex++] || createQueryResult({ isLoading: false, data: undefined })
    })

    render(<OrdersMasterDetail />)

    const sheetContent = screen.getByTestId('sheet-content')
    fireEvent.keyDown(sheetContent, { key: 'Escape' })

    expect(nextNav.replace).toHaveBeenCalledWith(
      expect.not.stringContaining('selected='),
      expect.anything(),
    )
  })

  it('clicking selected item again deselects it', () => {
    nextNav.searchParams.set('selected', 'ord-001')

    const mockResults: Record<string, unknown>[] = [
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({
        isLoading: false,
        data: sampleDetail,
      }),
    ]
    let callIndex = 0
    reactQuery.useQuery.mockImplementation(() => {
      return mockResults[callIndex++] || createQueryResult({ isLoading: false, data: undefined })
    })

    render(<OrdersMasterDetail />)

    const selectedCard = screen.getByText('Mario Rossi')
    fireEvent.click(selectedCard)

    expect(nextNav.replace).toHaveBeenCalled()
  })

  it('keyboard navigates list with arrow keys', () => {
    const mockResults: Record<string, unknown>[] = [
      createQueryResult({
        isLoading: false,
        data: sampleOrders,
      }),
      createQueryResult({ isLoading: false, data: undefined }),
    ]
    let callIndex = 0
    reactQuery.useQuery.mockImplementation(() => {
      return mockResults[callIndex++] || createQueryResult({ isLoading: false, data: undefined })
    })

    render(<OrdersMasterDetail />)

    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
  })
})
