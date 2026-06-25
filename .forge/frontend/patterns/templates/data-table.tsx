// ============================================================
// Template: Data Table con Filtri
// Pattern: data-table
// Stack: React + shadcn/ui + React Query + Tailwind
// USAGE: Copiare e adattare colonne, filtri, query, azioni
// ============================================================

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Search, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface Order {
  id: string
  customer: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total: number
  createdAt: string
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface Filters {
  search: string
  status: string
  sort: string
  order: 'asc' | 'desc'
  page: number
  pageSize: number
}

// ──────────────────────────────────────────────
// HOOK: URL Params State
// ──────────────────────────────────────────────

function useFilters(): [Filters, (updates: Partial<Filters>) => void] {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters: Filters = {
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? 'all',
    sort: searchParams.get('sort') ?? 'createdAt',
    order: (searchParams.get('order') ?? 'desc') as 'asc' | 'desc',
    page: Number(searchParams.get('page') ?? '1'),
    pageSize: 20,
  }

  const setFilters = useCallback(
    (updates: Partial<Filters>) => {
      const params = new URLSearchParams(window.location.search)
      const next = {
        search: params.get('search') ?? '',
        status: params.get('status') ?? 'all',
        sort: params.get('sort') ?? 'createdAt',
        order: (params.get('order') ?? 'desc') as 'asc' | 'desc',
        page: Number(params.get('page') ?? '1'),
        pageSize: 20,
        ...updates,
      }

      params.set('search', '')
      params.set('status', '')
      params.set('sort', '')
      params.set('order', '')
      params.set('page', '')
      for (const key of params.keys()) params.delete(key)

      if (next.search) params.set('search', next.search)
      if (next.status !== 'all') params.set('status', next.status)
      if (next.sort !== 'createdAt') params.set('sort', next.sort)
      if (next.order !== 'desc') params.set('order', next.order)
      if (next.page > 1) params.set('page', String(next.page))

      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [pathname, router],
  )

  return [filters, setFilters]
}

// ──────────────────────────────────────────────
// HOOK: Orders Query
// ──────────────────────────────────────────────

async function fetchOrders(filters: Filters): Promise<PaginatedResponse<Order>> {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    sort: filters.sort,
    order: filters.order,
  })
  if (filters.search) params.set('search', filters.search)
  if (filters.status !== 'all') params.set('status', filters.status)

  const res = await fetch(`/api/orders?${params}`)
  if (!res.ok) throw new Error(`Error: ${res.statusText}`)
  return res.json()
}

function useOrdersQuery(filters: Filters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

function useDeleteOrders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      fetch('/api/orders/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function statusVariant(status: Order['status']): 'secondary' | 'default' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending': return 'secondary'
    case 'processing': return 'default'
    case 'completed': return 'outline'
    case 'cancelled': return 'destructive'
  }
}

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

function formatCurrency(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
}

// ──────────────────────────────────────────────
// STATUS LABEL MAP
// ──────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// ──────────────────────────────────────────────
// STATES
// ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      {/* Table skeleton */}
      <div className="rounded-md border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Data loading error</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        {error.message}
        <Button variant="outline" size="sm" onClick={onRetry}>
          Riprova
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function EmptyState({
  type,
  onCreate,
  onClearFilters,
}: {
  type: 'first-visit' | 'filtered'
  onCreate?: () => void
  onClearFilters?: () => void
}) {
  if (type === 'first-visit') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-semibold text-foreground">No orders</p>
        <p className="text-sm text-muted-foreground mt-1">No orders yet. Create a new one.</p>
        {onCreate && (
          <Button className="mt-4" onClick={onCreate}>
            New order
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-semibold text-foreground">No results</p>
      <p className="text-sm text-muted-foreground mt-1">
        No orders match the selected filters.
      </p>
      {onClearFilters && (
        <Button variant="outline" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function OrdersTable() {
  const [filters, setFilters] = useFilters()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const query = useOrdersQuery(filters)
  const deleteOrders = useDeleteOrders()

  const pathname = usePathname()
  const router = useRouter()

  const data = query.data
  const isLoading = query.isLoading
  const isError = query.isError
  const isRefetching = query.isRefetching && !query.isLoading

  // ── Computed ──

  const hasActiveFilters = filters.search !== '' || filters.status !== 'all'

  const allSelected = useMemo(() => {
    if (!data?.items.length) return false
    return data.items.every((item) => selectedIds.has(item.id))
  }, [data, selectedIds])

  // ── Handlers ──

  const toggleSort = useCallback(
    (column: string) => {
      if (filters.sort === column) {
        setFilters({ order: filters.order === 'asc' ? 'desc' : 'asc' })
      } else {
        setFilters({ sort: column, order: 'asc', page: 1 })
      }
    },
    [filters, setFilters],
  )

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', page: 1 })
    setSelectedIds(new Set())
  }, [setFilters])

  const toggleAll = useCallback(() => {
    if (!data) return
    setSelectedIds((prev) => {
      if (prev.size === data.items.length && data.items.every((i) => prev.has(i.id))) {
        return new Set()
      }
      return new Set(data.items.map((i) => i.id))
    })
  }, [data])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ── Sort icon helper ──

  const sortIcon = (column: string) => {
    if (filters.sort !== column) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />
    return filters.order === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 inline" />
      : <ArrowDown className="h-3 w-3 ml-1 inline" />
  }

  // ── Render ──

  // LOADING (initial)
  if (isLoading) {
    return <LoadingSkeleton />
  }

  // ERROR (initial, no data to show)
  if (isError && !data) {
    return <ErrorState error={query.error as Error} onRetry={() => query.refetch()} />
  }

  return (
    <div className="space-y-4">
      {/* ── FILTER BAR ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customer..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
            className="pl-10"
            aria-label="Search orders"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ status: value, page: 1 })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}

        {/* Refetching indicator */}
        {isRefetching && (
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Refreshing...
          </div>
        )}
      </div>

      {/* ── TABLE ── */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all rows"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort('customer')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('customer') }}}
              >
                Customer {sortIcon('customer')}
              </TableHead>
              <TableHead
                className="cursor-pointer hidden md:table-cell"
                onClick={() => toggleSort('status')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('status') }}}
              >
                Status {sortIcon('status')}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => toggleSort('total')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('total') }}}
              >
                Total {sortIcon('total')}
              </TableHead>
              <TableHead
                className="cursor-pointer hidden md:table-cell"
                onClick={() => toggleSort('createdAt')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('createdAt') }}}
              >
                Date {sortIcon('createdAt')}
              </TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* EMPTY (filtered) */}
            {data && data.items.length === 0 && hasActiveFilters && (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <EmptyState type="filtered" onClearFilters={clearFilters} />
                </TableCell>
              </TableRow>
            )}

            {/* EMPTY (first visit) */}
            {data && data.items.length === 0 && !hasActiveFilters && (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <EmptyState type="first-visit" onCreate={() => router.push(`${pathname}/new`)} />
                </TableCell>
              </TableRow>
            )}

            {/* POPULATED */}
            {data?.items.map((order) => (
              <TableRow
                key={order.id}
                data-state={selectedIds.has(order.id) ? 'selected' : undefined}
                className="cursor-pointer"
                onClick={() => router.push(`${pathname}/${order.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(order.id)}
                    onCheckedChange={() => toggleSelect(order.id)}
                    aria-label={`Select order ${order.customer}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{order.customer}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={statusVariant(order.status)}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('it-IT')}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for order ${order.customer}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`${pathname}/${order.id}/edit`)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteOrders.mutate([order.id])}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {/* ERROR (table has previous data, but refetch failed) */}
            {isError && data && (
              <TableRow>
                <TableCell colSpan={6}>
                  <ErrorState error={query.error as Error} onRetry={() => query.refetch()} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── BULK ACTIONS ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} order{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(`Delete ${selectedIds.size} order${selectedIds.size > 1 ? 's' : ''}?`)) {
                  deleteOrders.mutate(Array.from(selectedIds), {
                    onSuccess: () => setSelectedIds(new Set()),
                  })
                }
              }}
            >
              Delete selected
            </Button>
          </div>
        </div>
      )}

      {/* ── PAGINATION ── */}
      {data && data.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setFilters({ page: Math.max(1, filters.page - 1) })}
                aria-disabled={filters.page <= 1}
                className={filters.page <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <Button
                  variant={page === filters.page ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => setFilters({ page })}
                  aria-label={`Page ${page}`}
                  aria-current={page === filters.page ? 'page' : undefined}
                >
                  {page}
                </Button>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setFilters({ page: filters.page + 1 })}
                aria-disabled={filters.page >= data.totalPages}
                className={filters.page >= data.totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* ── FOOTER INFO ── */}
      {data && (
        <p className="text-sm text-muted-foreground text-center">
          {data.total === 0
            ? 'No orders'
            : `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} of ${data.total} orders`
          }
        </p>
      )}
    </div>
  )
}
