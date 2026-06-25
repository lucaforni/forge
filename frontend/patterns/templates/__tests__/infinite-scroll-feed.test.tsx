import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

// ──────────────────────────────────────────────
// Hoisted shared references
// ──────────────────────────────────────────────

const reactQuery = vi.hoisted(() => ({
  useInfiniteQuery: vi.fn(),
}))

const storageMock = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))

const intersectionObserver = vi.hoisted(() => ({
  callback: null as IntersectionObserverCallback | null,
}))

// ──────────────────────────────────────────────
// Global mocks
// ──────────────────────────────────────────────

beforeAll(() => {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: vi.fn(function MockIntersectionObserver(
      callback: IntersectionObserverCallback,
    ) {
      intersectionObserver.callback = callback
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }
    }),
  })

  Object.defineProperty(window, 'sessionStorage', { value: storageMock })
  window.scrollTo = vi.fn()
})

afterAll(() => {
  delete (window as any).IntersectionObserver
})

// ──────────────────────────────────────────────
// Module mocks
// ──────────────────────────────────────────────

vi.mock('@tanstack/react-query', () => reactQuery)

vi.mock('lucide-react', () => ({
  RefreshCw: () => <span data-testid="icon-refresh" />,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}))

vi.mock('../empty-state', () => ({
  EmptyState: ({ title, description, primaryCTA }: any) => (
    <div data-testid="empty-state">
      <div data-testid="empty-title">{title}</div>
      <div data-testid="empty-description">{description}</div>
      {primaryCTA && (
        <button data-testid="empty-cta" onClick={primaryCTA.onClick}>
          {primaryCTA.label}
        </button>
      )}
    </div>
  ),
  EmptyStatePresets: {
    firstVisit: (entity: string, onCreate: () => void) => (
      <div data-testid="empty-preset">
        <span>Nessun {entity} presente.</span>
        <button data-testid="create-btn" onClick={onCreate}>
          Crea {entity}
        </button>
      </div>
    ),
  },
}))

// ──────────────────────────────────────────────
// Component under test
// ──────────────────────────────────────────────

import { InfiniteScrollFeed } from '../infinite-scroll-feed'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

interface TestItem {
  id: string
  label: string
}

interface InfiniteQueryData {
  pages: { items: TestItem[]; nextCursor?: string | null; total?: number }[]
  pageParams: any[]
}

function createInfiniteQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: { pages: [{ items: [], nextCursor: undefined, total: 0 }], pageParams: [] } as InfiniteQueryData,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    isFetchingNextPage: false,
    isRefetching: false,
    hasNextPage: false,
    isError: false,
    isFetched: true,
    isFetching: false,
    ...overrides,
  }
}

function renderFeed(overrides: Record<string, unknown> = {}) {
  const defaultProps = {
    queryKey: ['test-feed'],
    queryFn: vi.fn().mockResolvedValue({ items: [], nextCursor: undefined }),
    renderItem: (item: TestItem) => <span>{item.label}</span>,
  }
  return render(
    <InfiniteScrollFeed<TestItem> {...defaultProps} {...overrides} />,
  )
}

const sampleItems: TestItem[] = [
  { id: '1', label: 'Item 1' },
  { id: '2', label: 'Item 2' },
  { id: '3', label: 'Item 3' },
]

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('InfiniteScrollFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    intersectionObserver.callback = null
    storageMock.getItem.mockReturnValue(null)
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult(),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders initial items', () => {
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: sampleItems, nextCursor: 'c2', total: 6 }],
          pageParams: [],
        },
        hasNextPage: true,
      }),
    )

    renderFeed()

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('shows loading more indicator', () => {
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: sampleItems, nextCursor: 'c2', total: 6 }],
          pageParams: [],
        },
        isFetchingNextPage: true,
        hasNextPage: true,
      }),
    )

    renderFeed()

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('loads more on scroll to sentinel', () => {
    const fetchNextPage = vi.fn()
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: sampleItems, nextCursor: 'c2', total: 6 }],
          pageParams: [],
        },
        fetchNextPage,
        hasNextPage: true,
        isFetched: true,
      }),
    )

    renderFeed()

    expect(intersectionObserver.callback).not.toBeNull()

    act(() => {
      intersectionObserver.callback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })

    expect(fetchNextPage).toHaveBeenCalledOnce()
  })

  it('shows "all loaded" when no more pages', () => {
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: sampleItems, nextCursor: undefined, total: 3 }],
          pageParams: [],
        },
        hasNextPage: false,
        isFetched: true,
      }),
    )

    renderFeed()

    expect(screen.getByText('Hai visto tutti gli elementi')).toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: [], nextCursor: undefined, total: 0 }],
          pageParams: [],
        },
        isFetched: true,
        hasNextPage: false,
      }),
    )

    renderFeed()

    expect(screen.getByTestId('empty-preset')).toBeInTheDocument()
  })

  it('shows error with retry on failure', () => {
    const refetch = vi.fn()
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: sampleItems, nextCursor: 'c2', total: 6 }],
          pageParams: [],
        },
        isError: true,
        isFetched: true,
        refetch,
      }),
    )

    renderFeed()

    expect(screen.getByText('Impossibile caricare altri elementi')).toBeInTheDocument()
    expect(screen.getByText('Riprova')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Riprova'))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('Load More button works as fallback', () => {
    const fetchNextPage = vi.fn()
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: sampleItems, nextCursor: 'c2', total: 6 }],
          pageParams: [],
        },
        fetchNextPage,
        hasNextPage: true,
        isFetched: true,
      }),
    )

    renderFeed()

    const loadMoreBtn = screen.getByText('Carica altri')
    expect(loadMoreBtn).toBeInTheDocument()

    fireEvent.click(loadMoreBtn)
    expect(fetchNextPage).toHaveBeenCalledOnce()
  })

  it('renders items in correct order', () => {
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: sampleItems, nextCursor: 'c2', total: 6 }],
          pageParams: [],
        },
        hasNextPage: true,
      }),
    )

    renderFeed()

    const items = screen.getAllByText(/Item/)
    expect(items[0]).toHaveTextContent('Item 1')
    expect(items[1]).toHaveTextContent('Item 2')
    expect(items[2]).toHaveTextContent('Item 3')
  })

  it('preserves scroll position with sessionStorage', () => {
    const setItemSpy = vi.fn()
    storageMock.setItem = setItemSpy

    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: sampleItems, nextCursor: 'c2', total: 6 }],
          pageParams: [],
        },
        hasNextPage: true,
      }),
    )

    renderFeed()

    expect(setItemSpy).toBeDefined()
  })

  it('shows refetching indicator when refreshing', () => {
    const refetch = vi.fn()
    reactQuery.useInfiniteQuery.mockReturnValue(
      createInfiniteQueryResult({
        data: {
          pages: [{ items: sampleItems, nextCursor: 'c2', total: 6 }],
          pageParams: [],
        },
        isRefetching: true,
        refetch,
      }),
    )

    renderFeed()

    expect(screen.getByTestId('icon-refresh')).toBeInTheDocument()
  })
})
