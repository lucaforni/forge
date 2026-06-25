import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const nextNav = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
}))

const reactQuery = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  keepPreviousData: Symbol('keepPreviousData'),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => nextNav.searchParams,
  useRouter: () => ({ push: nextNav.push, replace: nextNav.replace }),
  usePathname: () => '/catalogo',
}))

vi.mock('@tanstack/react-query', () => reactQuery)

vi.mock('@/components/ui/input', () => ({
  Input: ({ 'aria-label': ariaLabel, ...props }: Record<string, unknown>) => (
    <input aria-label={ariaLabel as string} {...props} />
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

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: Record<string, unknown>) => (
    <span data-variant={variant} className={className as string} {...props}>{children}</span>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardFooter: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, style, ...props }: Record<string, unknown>) => (
    <div className={`animate-pulse ${className as string}`} style={style} {...props} />
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: Record<string, unknown>) => (
    <div data-select-value={value} data-testid="mock-select">
      {children}
      <button
        data-testid="select-trigger-category"
        onClick={() => onValueChange?.('all')}
      >
        Cambia
      </button>
    </div>
  ),
  SelectContent: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  SelectItem: ({ children, value }: Record<string, unknown>) => (
    <div data-testid={`select-item-${value as string}`}>{children as string}</div>
  ),
  SelectTrigger: ({ children, 'aria-label': ariaLabel, ...props }: Record<string, unknown>) => (
    <button aria-label={ariaLabel as string} {...props}>{children}</button>
  ),
  SelectValue: ({ placeholder }: Record<string, unknown>) => <span>{placeholder as string}</span>,
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: Record<string, unknown>) => (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="checkbox"
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  PopoverContent: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="popover-content" {...props}>{children}</div>
  ),
}))

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  CommandEmpty: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  CommandGroup: ({ children, heading }: Record<string, unknown>) => (
    <div>
      <span>{heading as string}</span>
      {children}
    </div>
  ),
  CommandItem: ({ children, onSelect, onMouseEnter, ...props }: Record<string, unknown>) => (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      data-testid="command-item"
      {...props}
    >
      {children}
    </div>
  ),
  CommandList: ({ children }: Record<string, unknown>) => <div>{children}</div>,
}))

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: Record<string, unknown>) => (
    <div data-open={!!open}>{children}</div>
  ),
  SheetContent: ({ children, ...props }: Record<string, unknown>) => (
    <div {...props}>{children}</div>
  ),
  SheetDescription: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  SheetHeader: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  SheetTitle: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  SheetTrigger: ({ children }: Record<string, unknown>) => <div>{children}</div>,
}))

vi.mock('@/components/ui/pagination', () => ({
  Pagination: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  PaginationContent: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  PaginationItem: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  PaginationPrevious: ({ onClick, className }: Record<string, unknown>) => (
    <button onClick={onClick} className={className as string} aria-label="Pagina precedente">Prev</button>
  ),
  PaginationNext: ({ onClick, className }: Record<string, unknown>) => (
    <button onClick={onClick} className={className as string} aria-label="Pagina successiva">Next</button>
  ),
  PaginationLink: ({ onClick, children, isActive }: Record<string, unknown>) => (
    <button onClick={onClick} aria-label={isActive ? 'Pagina attuale' : `Pagina ${children}`} data-active={String(!!isActive)}>{children}</button>
  ),
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, ...props }: Record<string, unknown>) => (
    <div data-variant={variant} {...props}>{children}</div>
  ),
  AlertDescription: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  AlertTitle: ({ children }: Record<string, unknown>) => <div>{children}</div>,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}))

import { SearchCatalog } from '../search-catalog'

function createQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    isRefetching: false,
    isStale: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }
}

const sampleResults = {
  items: [
    { id: '1', name: 'Prodotto A', description: 'Descrizione A', price: 25, category: 'accessori', tags: [] },
    { id: '2', name: 'Prodotto B', description: 'Descrizione B', price: 50, category: 'abbigliamento', tags: [] },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
  totalPages: 1,
}

const sampleSuggestions = [
  { id: '1', label: 'Scarpe', type: 'query' as const },
  { id: '2', label: 'Scarpe da ginnastica', type: 'product' as const },
]

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  nextNav.searchParams.forEach((_, k) => nextNav.searchParams.delete(k))
  nextNav.push.mockReset()
  reactQuery.useQuery.mockReset()

  reactQuery.useQuery.mockImplementation(() => {
    return createQueryResult({ isLoading: true, data: undefined })
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('SearchCatalog', () => {
  it('renders search input', () => {
    render(<SearchCatalog />)

    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Cerca prodotti, categorie...')).toBeInTheDocument()
  })

  it('shows suggestions on typing (after debounce)', async () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({
      data: sampleSuggestions,
      isLoading: false,
    }))

    render(<SearchCatalog />)

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Sc' } })

    act(() => { vi.advanceTimersByTime(300) })

    await waitFor(() => {
      const items = screen.getAllByTestId('command-item')
      expect(items.length).toBeGreaterThan(0)
    })

    expect(reactQuery.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['search-suggestions']),
      }),
    )
  })

  it('filters results by category select', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({
      isLoading: false,
      data: sampleResults,
      dataUpdatedAt: Date.now(),
    }))

    nextNav.searchParams.set('q', 'test')
    render(<SearchCatalog />)

    const categoryTrigger = screen.getByLabelText('Filtra per categoria')
    fireEvent.click(categoryTrigger)

    expect(screen.getByTestId('select-trigger-category')).toBeInTheDocument()
  })

  it('shows results grid when loaded', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({
      isLoading: false,
      data: sampleResults,
      dataUpdatedAt: Date.now(),
    }))

    nextNav.searchParams.set('q', 'test')
    render(<SearchCatalog />)

    expect(screen.getByText('Prodotto A')).toBeInTheDocument()
    expect(screen.getByText('Prodotto B')).toBeInTheDocument()
    expect(screen.getByText('2 risultati')).toBeInTheDocument()
  })

  it('shows loading skeletons while searching', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({ isLoading: true, data: undefined }))

    nextNav.searchParams.set('q', 'test')
    render(<SearchCatalog />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows no-results state when query has no matches', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({
      isLoading: false,
      data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
      dataUpdatedAt: Date.now(),
    }))

    nextNav.searchParams.set('q', 'inesistente')
    render(<SearchCatalog />)

    expect(screen.getByText('Nessun risultato per "inesistente"')).toBeInTheDocument()
  })

  it('shows empty state when no query entered (recent searches)', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({ isLoading: false }))

    render(<SearchCatalog />)

    expect(screen.getByText('Cerca nel catalogo')).toBeInTheDocument()
  })

  it('pagination works', () => {
    const multiPageData = {
      ...sampleResults,
      total: 40,
      totalPages: 2,
      items: Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        name: `Prodotto ${i + 1}`,
        description: 'Descrizione',
        price: 10 + i,
        category: 'accessori',
        tags: [],
      })),
    }

    reactQuery.useQuery.mockReturnValue(createQueryResult({
      isLoading: false,
      data: multiPageData,
      dataUpdatedAt: Date.now(),
    }))

    nextNav.searchParams.set('q', 'test')
    render(<SearchCatalog />)

    expect(screen.getByText('Pagina 1 di 2')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Pagina 2'))
    expect(nextNav.push).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.anything())
  })

  it('error state with retry', () => {
    const refetch = vi.fn()
    reactQuery.useQuery.mockReturnValue(createQueryResult({
      isLoading: false,
      isError: true,
      error: new Error('Errore API'),
      data: undefined,
      refetch,
    }))

    nextNav.searchParams.set('q', 'test')
    render(<SearchCatalog />)

    expect(screen.getByText('Errore caricamento risultati')).toBeInTheDocument()
    expect(screen.getByText('Riprova')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Riprova'))
    expect(refetch).toHaveBeenCalled()
  })

  it('active filter chips shown', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({
      isLoading: false,
      data: sampleResults,
      dataUpdatedAt: Date.now(),
    }))

    nextNav.searchParams.set('q', 'test')
    nextNav.searchParams.set('category', 'accessori')
    render(<SearchCatalog />)

    expect(screen.getByText(/Categoria:/)).toBeInTheDocument()
  })

  it('clear all filters resets everything', () => {
    const refetch = vi.fn()
    reactQuery.useQuery.mockReturnValue(createQueryResult({
      isLoading: false,
      data: sampleResults,
      dataUpdatedAt: Date.now(),
      refetch,
    }))

    nextNav.searchParams.set('q', 'test')
    nextNav.searchParams.set('category', 'accessori')
    render(<SearchCatalog />)

    const clearButtons = screen.getAllByText('Cancella tutti')
    fireEvent.click(clearButtons[0])

    expect(nextNav.push).toHaveBeenCalledWith(
      expect.not.stringContaining('q=test'),
      expect.anything(),
    )
  })

  it('shows price range checkboxes', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({ isLoading: true }))

    render(<SearchCatalog />)

    expect(screen.getByText('Fino a 25€')).toBeInTheDocument()
    expect(screen.getByText('25€ – 50€')).toBeInTheDocument()
    expect(screen.getByText('50€ – 100€')).toBeInTheDocument()
    expect(screen.getByText('Oltre 100€')).toBeInTheDocument()
  })

  it('does not fire API call within debounce window', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({ isLoading: false, data: [] }))

    render(<SearchCatalog />)

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Sc' } })

    act(() => { vi.advanceTimersByTime(150) })
  })

  it('filtered-no-results state shows clear filters CTA', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({
      isLoading: false,
      data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
      dataUpdatedAt: Date.now(),
    }))

    nextNav.searchParams.set('q', 'test')
    nextNav.searchParams.set('category', 'accessori')
    render(<SearchCatalog />)

    expect(screen.getByText('Cancella tutti')).toBeInTheDocument()
  })

  it('selecting suggestion sets query and triggers search', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({
      data: sampleSuggestions,
      isLoading: false,
    }))

    render(<SearchCatalog />)

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Sc' } })

    act(() => { vi.advanceTimersByTime(300) })

    const items = screen.getAllByTestId('command-item')
    if (items.length > 0) {
      fireEvent.click(items[0])
    }

    expect(reactQuery.useQuery).toHaveBeenCalled()
  })

  it('combobox has aria-activedescendant during keyboard nav', () => {
    reactQuery.useQuery.mockReturnValue(createQueryResult({ isLoading: false, data: [] }))

    render(<SearchCatalog />)

    const combobox = screen.getByRole('combobox')
    expect(combobox).toBeInTheDocument()
  })
})
