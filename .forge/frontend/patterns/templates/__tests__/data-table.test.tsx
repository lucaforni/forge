import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  usePathname: () => '/orders',
}))

vi.mock('@tanstack/react-query', () => reactQuery)

import { OrdersTable } from '../data-table'

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

function createPaginatedData(overrides: Record<string, unknown> = {}) {
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    ...overrides,
  }
}

const sampleOrders = [
  { id: '1', customer: 'Mario Rossi', status: 'pending' as const, total: 150.50, createdAt: '2026-06-01T10:00:00Z' },
  { id: '2', customer: 'Luca Bianchi', status: 'completed' as const, total: 320.00, createdAt: '2026-06-02T14:30:00Z' },
]

beforeEach(() => {
  ;[...nextNav.searchParams.keys()].forEach((k) => nextNav.searchParams.delete(k))
  nextNav.push.mockReset()
  reactQuery.useQuery.mockReset()
  reactQuery.useMutation.mockReset()

  reactQuery.useQuery.mockReturnValue(
    createQueryResult({ isLoading: true, data: undefined }),
  )
  reactQuery.useMutation.mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OrdersTable — Data Table', () => {
  it('shows skeleton on loading', () => {
    render(<OrdersTable />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders table rows when data is loaded', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: createPaginatedData({ items: sampleOrders, total: 2, totalPages: 1 }),
      }),
    )

    render(<OrdersTable />)

    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
    expect(screen.getByText('Luca Bianchi')).toBeInTheDocument()
  })

  it('shows empty state when there are no orders', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: createPaginatedData({ items: [], total: 0, totalPages: 0 }),
      }),
    )

    render(<OrdersTable />)

    expect(screen.getByText('Nessun ordine')).toBeInTheDocument()
    expect(screen.getByText('Non ci sono ancora ordini. Creane uno nuovo.')).toBeInTheDocument()
  })

  it('shows filtered empty state when filters are active and no results', () => {
    nextNav.searchParams.set('search', 'inesistente')
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: createPaginatedData({ items: [], total: 0, totalPages: 0 }),
      }),
    )

    render(<OrdersTable />)

    expect(screen.getByText('Nessun risultato')).toBeInTheDocument()
    expect(screen.getByText('Cancella filtri')).toBeInTheDocument()
  })

  it('shows error with retry button', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        isError: true,
        error: new Error('Errore API'),
        data: undefined,
      }),
    )

    render(<OrdersTable />)

    expect(screen.getByText('Errore caricamento dati')).toBeInTheDocument()
    expect(screen.getByText('Riprova')).toBeInTheDocument()
  })

  it('changes page when clicking next button', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: createPaginatedData({ items: sampleOrders, total: 40, page: 1, totalPages: 2 }),
      }),
    )

    render(<OrdersTable />)

    fireEvent.click(screen.getByLabelText('Pagina 2'))

    expect(nextNav.push).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.anything())
  })

  it('toggles column sorting on click', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: createPaginatedData({ items: sampleOrders, total: 2, totalPages: 1 }),
      }),
    )

    render(<OrdersTable />)

    fireEvent.click(screen.getByText('Cliente'))

    expect(nextNav.push).toHaveBeenCalledWith(
      expect.stringMatching(/sort=customer/),
      expect.anything(),
    )
  })

  it('selects/deselects all rows with header checkbox', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: createPaginatedData({ items: sampleOrders, total: 2, totalPages: 1 }),
      }),
    )

    render(<OrdersTable />)

    const selectAll = screen.getByLabelText('Seleziona tutte le righe')
    fireEvent.click(selectAll)

    expect(screen.getByText('2 ordini selezionati')).toBeInTheDocument()
  })

  it('selects a single item', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: createPaginatedData({ items: sampleOrders, total: 2, totalPages: 1 }),
      }),
    )

    render(<OrdersTable />)

    fireEvent.click(screen.getByLabelText('Seleziona ordine Mario Rossi'))

    expect(screen.getByText('1 ordine selezionato')).toBeInTheDocument()
  })

  it('shows confirmation and calls mutation for bulk delete', () => {
    const mockMutate = vi.fn()
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: createPaginatedData({ items: sampleOrders, total: 2, totalPages: 1 }),
      }),
    )
    reactQuery.useMutation.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    })

    render(<OrdersTable />)

    fireEvent.click(screen.getByLabelText('Seleziona ordine Mario Rossi'))
    fireEvent.click(screen.getByText('Elimina selezionati'))

    expect(screen.getByText('Elimina selezionati')).toBeInTheDocument()
    expect(mockMutate).toHaveBeenCalledWith(['1'], expect.anything())
  })

  it('refetching shows spinner with previous data visible', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        isRefetching: true,
        data: createPaginatedData({ items: sampleOrders, total: 2, totalPages: 1 }),
      }),
    )

    render(<OrdersTable />)

    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
  })

  it('partial error shows banner while table remains', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        isError: true,
        error: new Error('Errore caricamento metadati'),
        data: createPaginatedData({ items: sampleOrders, total: 2, totalPages: 1 }),
      }),
    )

    render(<OrdersTable />)

    expect(screen.getByText('Errore caricamento dati')).toBeInTheDocument()
  })

  it('sort cycle asc → desc → none', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: createPaginatedData({ items: sampleOrders, total: 2, totalPages: 1 }),
      }),
    )

    render(<OrdersTable />)

    fireEvent.click(screen.getByText('Cliente'))
    expect(nextNav.push).toHaveBeenCalledWith(
      expect.stringMatching(/sort=customer/),
      expect.anything(),
    )

    fireEvent.click(screen.getByText('Cliente'))
    expect(nextNav.push).toHaveBeenCalledWith(
      expect.stringMatching(/sort=customer.*desc/),
      expect.anything(),
    )
  })
})
