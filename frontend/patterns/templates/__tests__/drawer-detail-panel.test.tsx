import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// ──────────────────────────────────────────────
// Hoisted shared references
// ──────────────────────────────────────────────

const reactQuery = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

const nextNav = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
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

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  Package: () => <span data-testid="icon-package" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
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
        <div
          data-testid="sheet-content"
          data-side={side}
          className={className}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Escape') onOpenChange(false)
          }}
          {...props}
        >
          {children}
        </div>
      )
    },
    SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
    SheetTitle: ({ children }: any) => <h2 data-testid="sheet-title">{children}</h2>,
    SheetClose: ({ children, ...props }: any) => {
      const { onOpenChange } = useContext(SheetCtx)
      return (
        <button
          data-testid="sheet-close"
          onClick={() => onOpenChange(false)}
          {...props}
        >
          {children}
        </button>
      )
    },
  }
})

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: any) => (
    <div data-testid="scroll-area" {...props}>{children}</div>
  ),
}))

vi.mock('@/components/ui/tabs', () => {
  const React = require('react')
  const { createContext, useContext, useState } = React

  const TabsCtx = createContext<{
    value: string
    onValueChange: (v: string) => void
  }>({ value: '', onValueChange: () => {} })

  return {
    Tabs: ({ children, defaultValue, value: controlledValue, onValueChange }: any) => {
      const [val, setVal] = useState(defaultValue ?? controlledValue ?? '')
      return (
        <TabsCtx.Provider
          value={{
            value: controlledValue ?? val,
            onValueChange: (v: string) => {
              setVal(v)
              onValueChange?.(v)
            },
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

import { DrawerDetailPanel } from '../drawer-detail-panel'

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
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('DrawerDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nextNav.searchParams.forEach((_, k) => nextNav.searchParams.delete(k))
    nextNav.replace.mockClear()
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({ isLoading: true, data: undefined }),
    )
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders Sheet when open', async () => {
    nextNav.searchParams.set('detail', 'ord-001')

    reactQuery.useQuery.mockReturnValue(
      createQueryResult({ isLoading: true, data: undefined }),
    )

    render(<DrawerDetailPanel />)

    const sheet = await screen.findByTestId('sheet')
    expect(sheet).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('sheet-title')).toHaveTextContent('Dettaglio ordine')
  })

  it('shows loading skeleton while fetching', () => {
    nextNav.searchParams.set('detail', 'ord-001')

    reactQuery.useQuery.mockReturnValue(
      createQueryResult({ isLoading: true, data: undefined }),
    )

    render(<DrawerDetailPanel />)

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders detail content when loaded', () => {
    nextNav.searchParams.set('detail', 'ord-001')

    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: sampleDetail,
      }),
    )

    render(<DrawerDetailPanel />)

    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
    expect(screen.getByText('mario@example.com')).toBeInTheDocument()
    expect(screen.getByText('Confermato')).toBeInTheDocument()
    expect(screen.getByText('€ 250,50')).toBeInTheDocument()
  })

  it('shows error with retry on fetch failure', () => {
    nextNav.searchParams.set('detail', 'ord-001')

    const refetch = vi.fn()
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        isError: true,
        data: undefined,
        error: new Error('Errore API'),
        refetch,
      }),
    )

    render(<DrawerDetailPanel />)

    expect(screen.getByText('Errore caricamento')).toBeInTheDocument()
    expect(screen.getByText('Riprova')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Riprova'))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('tabs switch content', () => {
    nextNav.searchParams.set('detail', 'ord-001')

    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: sampleDetail,
      }),
    )

    render(<DrawerDetailPanel />)

    expect(screen.getByTestId('tab-content-details')).toBeInTheDocument()
    expect(screen.queryByTestId('tab-content-timeline')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('tab-trigger-timeline'))

    expect(screen.getByTestId('tab-content-timeline')).toBeInTheDocument()
    expect(screen.queryByTestId('tab-content-details')).not.toBeInTheDocument()
  })

  it('close button works', () => {
    nextNav.searchParams.set('detail', 'ord-001')

    reactQuery.useQuery.mockReturnValue(
      createQueryResult({ isLoading: true, data: undefined }),
    )

    render(<DrawerDetailPanel />)

    expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'true')

    fireEvent.click(screen.getByTestId('sheet-close'))

    expect(nextNav.replace).toHaveBeenCalledWith(
      expect.not.stringContaining('detail='),
      expect.anything(),
    )
  })

  it('Esc closes drawer', () => {
    nextNav.searchParams.set('detail', 'ord-001')

    reactQuery.useQuery.mockReturnValue(
      createQueryResult({ isLoading: true, data: undefined }),
    )

    render(<DrawerDetailPanel />)

    expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'true')

    fireEvent.keyDown(screen.getByTestId('sheet-content'), { key: 'Escape' })

    expect(nextNav.replace).toHaveBeenCalledWith(
      expect.not.stringContaining('detail='),
      expect.anything(),
    )
  })

  it('responsive side on mobile', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('(max-width: 768px)'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    nextNav.searchParams.set('detail', 'ord-001')
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({ isLoading: true, data: undefined }),
    )

    render(<DrawerDetailPanel />)

    expect(screen.getByTestId('sheet-content').getAttribute('data-side')).toBe('bottom')
  })

  it('URL preserved after retry', () => {
    nextNav.searchParams.set('detail', 'ord-001')
    const refetch = vi.fn()
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        isError: true,
        data: undefined,
        error: new Error('Errore API'),
        refetch,
      }),
    )

    render(<DrawerDetailPanel />)

    fireEvent.click(screen.getByText('Riprova'))

    expect(nextNav.replace).toHaveBeenCalled()
    expect(refetch).toHaveBeenCalled()
  })
})
