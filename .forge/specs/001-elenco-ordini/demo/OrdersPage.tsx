// ============================================================
// Demo: OrdersPage (Elenco Ordini)
// Spec: 001-elenco-ordini
// Stack: React + shadcn/ui + @tanstack/react-query + sonner
// Patterns: data-table, empty-state, notification, error-recovery, confirmation
// ============================================================

'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Search,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  SearchX,
  AlertTriangle,
  Loader2,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
} from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  getOrders,
  deleteOrders,
  undoDeleteOrders,
  type Order,
  type OrderFilters,
  type PaginatedResponse,
} from './api-mock'

const STATUS_CONFIG = {
  pending: { label: 'In attesa', variant: 'secondary' as const },
  processing: { label: 'In lavorazione', variant: 'default' as const },
  completed: { label: 'Completato', variant: 'success' as const },
  cancelled: { label: 'Annullato', variant: 'destructive' as const },
} as const

const STATUS_OPTIONS = [
  { label: 'Tutti gli stati', value: 'all' },
  { label: 'In attesa', value: 'pending' },
  { label: 'In lavorazione', value: 'processing' },
  { label: 'Completato', value: 'completed' },
  { label: 'Annullato', value: 'cancelled' },
]

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(n)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return 'pochi secondi fa'
  if (seconds < 60) return `${seconds} secondi fa`
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return '1 minuto fa'
  return `${minutes} minuti fa`
}

function useUrlFilters(): [OrderFilters, (updates: Partial<OrderFilters>) => void] {
  const DEFAULT_FILTERS: OrderFilters = {
    search: '', status: 'all', sort: 'data', order: 'desc', page: 1, pageSize: 20,
  }

  const [filters, setFiltersState] = useState<OrderFilters>(DEFAULT_FILTERS)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFiltersState({
      search: params.get('search') ?? '',
      status: params.get('status') ?? 'all',
      sort: params.get('sort') ?? 'data',
      order: (params.get('order') ?? 'desc') as 'asc' | 'desc',
      page: Math.max(1, Number(params.get('page') ?? '1')),
      pageSize: 20,
    })
  }, [])

  const setFilters = useCallback((updates: Partial<OrderFilters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...updates }
      if (!('page' in updates)) next.page = 1
      return next
    })
  }, [])

  const debouncedSearch = useDebounce(filters.search, 300)

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.sort !== 'data') params.set('sort', filters.sort)
    if (filters.order !== 'desc') params.set('order', filters.order)
    if (filters.page > 1) params.set('page', String(filters.page))
    const qs = params.toString()
    history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
  }, [debouncedSearch, filters.status, filters.sort, filters.order, filters.page])

  useEffect(() => {
    const handlePop = () => {
      const params = new URLSearchParams(window.location.search)
      setFiltersState({
        search: params.get('search') ?? '',
        status: params.get('status') ?? 'all',
        sort: params.get('sort') ?? 'data',
        order: (params.get('order') ?? 'desc') as 'asc' | 'desc',
        page: Math.max(1, Number(params.get('page') ?? '1')),
        pageSize: 20,
      })
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  return [filters, setFilters]
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function useOrdersQuery(filters: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

function useDeleteOrdersMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => deleteOrders(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success(
        ids.length === 1 ? 'Ordine eliminato' : `${ids.length} ordini eliminati`,
        {
          description:
            ids.length === 1
              ? `Order #${ids[0]} has been deleted.`
              : `${ids.length} ordini sono stati eliminati.`,
          icon: <CheckCircle2 className="h-4 w-4 text-success" />,
          action: {
            label: 'Annulla',
            onClick: () => {
              undoDeleteOrders(ids).then(() => {
                queryClient.invalidateQueries({ queryKey: ['orders'] })
                toast.success('Ordini ripristinati')
              })
            },
          },
          duration: 8_000,
        },
      )
    },
    onError: (err: Error) => {
      toast.error('Errore eliminazione', {
        description: err.message,
        icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
      })
    },
  })
}

function SortIcon({
  column,
  currentSort,
  currentOrder,
}: {
  column: string
  currentSort: string
  currentOrder: 'asc' | 'desc'
}) {
  if (currentSort !== column) {
    return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" aria-hidden="true" />
  }
  return currentOrder === 'asc'
    ? <ArrowUp className="h-3 w-3 ml-1 inline" aria-hidden="true" />
    : <ArrowDown className="h-3 w-3 ml-1 inline" aria-hidden="true" />
}

function LoadingSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-label="Caricamento ordini in corso"
      aria-busy="true"
      role="status"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="rounded-md border">
        <div className="border-b px-4 py-3 flex items-center gap-4">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1 max-w-[250px]" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

function ErrorState({
  error,
  onRetry,
  isRetrying,
}: {
  error: Error
  onRetry: () => void
  isRetrying?: boolean
}) {
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    errorRef.current?.focus()
  }, [error.message])

  return (
    <Alert
      ref={errorRef}
      tabIndex={-1}
      variant="destructive"
      role="alert"
      aria-live="assertive"
      className="my-4 outline-none"
    >
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Impossibile caricare gli ordini</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>{error.message}</p>
        <details className="text-xs mt-1">
          <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
            Dettagli tecnici
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto text-xs text-muted-foreground">
            {error.message}
          </pre>
        </details>
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={onRetry}
          disabled={isRetrying}
          aria-label="Riprova carica ordini"
        >
          {isRetrying ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Riprovo...
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3 mr-1" />
              Riprova
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function EmptyState({
  variant,
  onCreate,
  onClearFilters,
}: {
  variant: 'first-visit' | 'filtered' | 'after-action'
  onCreate?: () => void
  onClearFilters?: () => void
}) {
  if (variant === 'first-visit') {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mb-4 rounded-full bg-muted p-4" aria-hidden="true">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Nessun ordine</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Non hai ancora creato nessun ordine. Inizia creando il primo ordine.
        </p>
        {onCreate && (
          <Button className="mt-6" onClick={onCreate}>
            Nuovo ordine
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'after-action') {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mb-4 rounded-full bg-muted p-4" aria-hidden="true">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Nessun ordine</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Tutti gli ordini selezionati sono stati eliminati.
        </p>
        {onClearFilters && (
          <Button variant="outline" className="mt-6" onClick={onClearFilters}>
            Cancella filtri
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mb-4 rounded-full bg-muted p-4" aria-hidden="true">
        <SearchX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Nessun risultato</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Nessun ordine corrisponde ai filtri selezionati.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        I filtri attivi potrebbero essere troppo restrittivi. Prova a cercare con termini diversi.
      </p>
      {onClearFilters && (
        <Button variant="outline" className="mt-6" onClick={onClearFilters}>
          Cancella filtri
        </Button>
      )}
    </div>
  )
}

function FilterBar({
  filters,
  onFilterChange,
  hasActiveFilters,
  onClearFilters,
  isRefetching,
  filterInputRef,
}: {
  filters: OrderFilters
  onFilterChange: (updates: Partial<OrderFilters>) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  isRefetching: boolean
  filterInputRef?: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={filterInputRef}
          placeholder="Cerca per cliente..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="pl-10"
          aria-label="Cerca ordini per nome cliente"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onFilterChange({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Cancella ricerca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Select
        value={filters.status}
        onValueChange={(value) => onFilterChange({ status: value })}
      >
        <SelectTrigger className="w-[180px]" aria-label="Filtra per stato">
          <SelectValue placeholder="Tutti gli stati" />
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
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Cancella filtri
        </Button>
      )}

      {isRefetching && (
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          Aggiornamento...
        </div>
      )}
    </div>
  )
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  ordersToDelete,
  isPending,
  onConfirm,
  mutationError,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordersToDelete: Order[]
  isPending: boolean
  onConfirm: () => void
  mutationError: Error | null
}) {
  const title =
    ordersToDelete.length === 1
      ? 'Elimina ordine'
      : `Elimina ${ordersToDelete.length} ordini`

  const description =
    ordersToDelete.length === 1
      ? `Sei sicuro di voler eliminare l'ordine #${ordersToDelete[0].id} (${ordersToDelete[0].cliente} — ${formatCurrency(ordersToDelete[0].totale)})?`
      : `Sei sicuro di voler eliminare i seguenti ${ordersToDelete.length} ordini?`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-destructive" aria-hidden="true" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {ordersToDelete.length > 1 && (
          <div className="max-h-32 overflow-y-auto space-y-1 text-sm text-muted-foreground border rounded-md p-3">
            {ordersToDelete.map((o) => (
              <div key={o.id} className="flex items-center gap-2">
                <span className="font-mono text-xs">#{o.id}</span>
                <span className="truncate flex-1">{o.cliente}</span>
                <span>{formatCurrency(o.totale)}</span>
              </div>
            ))}
          </div>
        )}

        {mutationError && (
          <Alert variant="destructive" className="text-sm">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{mutationError.message}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} autoFocus>
            Annulla
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={onConfirm}
              aria-label={isPending ? 'Eliminazione in corso' : 'Conferma eliminazione'}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function OrdersPage() {
  const [filters, setFilters] = useUrlFilters()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ordersToDelete, setOrdersToDelete] = useState<Order[]>([])
  const [justDeleted, setJustDeleted] = useState(false)
  const [, tick] = useState(0)

  const query = useOrdersQuery(filters)
  const deleteMutation = useDeleteOrdersMutation()

  const data = query.data
  const isLoading = query.isLoading
  const isError = query.isError
  const isRefetching = query.isRefetching && !query.isLoading

  const filterInputRef = useRef<HTMLInputElement>(null)
  const prevErrorRef = useRef<Error | null>(null)

  useEffect(() => {
    const interval = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isError && data && query.error !== prevErrorRef.current) {
      prevErrorRef.current = query.error as Error
      toast.error('Errore di aggiornamento', {
        description: (query.error as Error).message,
      })
    }
  }, [isError, data, query.error])

  const hasActiveFilters = filters.search !== '' || filters.status !== 'all'

  const allSelected = useMemo(() => {
    if (!data?.items.length) return false
    return data.items.every((item) => selectedIds.has(item.id))
  }, [data, selectedIds])

  const toggleSort = useCallback(
    (column: string) => {
      if (filters.sort === column) {
        if (filters.order === 'asc') {
          setFilters({ order: 'desc' })
        } else {
          setFilters({ sort: 'data', order: 'desc' })
        }
      } else {
        setFilters({ sort: column, order: 'asc' })
      }
    },
    [filters.sort, filters.order, setFilters],
  )

  const handleFilterChange = useCallback(
    (updates: Partial<OrderFilters>) => {
      setJustDeleted(false)
      setFilters(updates)
    },
    [setFilters],
  )

  const clearFilters = useCallback(() => {
    setJustDeleted(false)
    setFilters({ search: '', status: 'all' })
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

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const openDeleteDialog = useCallback((orders: Order[]) => {
    setOrdersToDelete(orders)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    const ids = ordersToDelete.map((o) => o.id)
    deleteMutation.mutate(ids, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setOrdersToDelete([])
        setSelectedIds((prev) => {
          const next = new Set(prev)
          for (const id of ids) next.delete(id)
          return next
        })
        setJustDeleted(true)
        requestAnimationFrame(() => filterInputRef.current?.focus())
      },
    })
  }, [ordersToDelete, deleteMutation])

  const handleNavigateDetail = useCallback((id: number) => {
    console.log(`[DEMO] Navigate to order detail: /orders/${id}`)
  }, [])

  const handleNavigateEdit = useCallback((id: number) => {
    console.log(`[DEMO] Navigate to order edit: /orders/${id}/edit`)
  }, [])

  const handleRowClick = useCallback(
    (id: number, e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey) {
        window.open(`/orders/${id}`, '_blank')
        return
      }
      if (e.button === 1) {
        window.open(`/orders/${id}`, '_blank')
        return
      }
      handleNavigateDetail(id)
    },
    [handleNavigateDetail],
  )

  const handleRowKeyDown = useCallback(
    (id: number, e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleNavigateDetail(id)
      }
    },
    [handleNavigateDetail],
  )

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError && !data) {
    return (
      <div className="space-y-4">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          isRefetching={false}
        />
        <ErrorState error={query.error as Error} onRetry={() => query.refetch()} />
      </div>
    )
  }

  const firstItem = (data.page - 1) * data.pageSize + 1
  const lastItem = Math.min(data.page * data.pageSize, data.total)

  const emptyVariant = justDeleted ? 'after-action' : hasActiveFilters ? 'filtered' : 'first-visit'

  return (
    <div className="space-y-4">
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        ordersToDelete={ordersToDelete}
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        mutationError={deleteMutation.error as Error | null}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Ordini</h1>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        isRefetching={isRefetching}
        filterInputRef={filterInputRef}
      />

      {data.items.length === 0 ? (
        <EmptyState
          variant={emptyVariant}
          onCreate={() => console.log('[DEMO] Navigate to create new order')}
          onClearFilters={clearFilters}
        />
      ) : (
        <>
          {selectedIds.size > 0 && (
            <div
              className="flex items-center justify-between px-4 py-2 bg-primary/10 rounded-md"
              role="toolbar"
              aria-label="Azioni sugli ordini selezionati"
            >
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {selectedIds.size === 1
                  ? '1 ordine selezionato'
                  : `${selectedIds.size} ordini selezionati`}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const orders = data.items.filter((o) => selectedIds.has(o.id))
                    openDeleteDialog(orders)
                  }}
                  aria-label={`Elimina ${selectedIds.size} ordini selezionati`}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Elimina selezionati
                </Button>
              </div>
            </div>
          )}

          {isError && data && (
            <ErrorState
              error={query.error as Error}
              onRetry={() => query.refetch()}
              isRetrying={isRefetching}
            />
          )}

          <div className="rounded-md border overflow-x-auto" style={{ borderCollapse: 'separate' }}>
            <Table className="border-separate border-spacing-0">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-20 bg-background w-[40px]" aria-label="Seleziona tutte le righe">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Seleziona tutte le righe visibili"
                    />
                  </TableHead>
                  <TableHead className="sticky left-[40px] z-20 bg-background w-[80px] text-right text-muted-foreground text-xs font-medium">
                    ID
                  </TableHead>
                  <TableHead
                    className="cursor-pointer min-w-[180px]"
                    aria-sort={filters.sort === 'cliente' ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort('cliente')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleSort('cliente')
                        }
                      }}
                      className="flex items-center gap-0 bg-transparent border-none cursor-pointer p-0 font-inherit text-inherit"
                      role="columnheader"
                      aria-sort={filters.sort === 'cliente' ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Cliente <SortIcon column="cliente" currentSort={filters.sort} currentOrder={filters.order} />
                    </button>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer w-[140px]"
                    aria-sort={filters.sort === 'stato' ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort('stato')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleSort('stato')
                        }
                      }}
                      className="flex items-center gap-0 bg-transparent border-none cursor-pointer p-0 font-inherit text-inherit"
                      role="columnheader"
                      aria-sort={filters.sort === 'stato' ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Stato <SortIcon column="stato" currentSort={filters.sort} currentOrder={filters.order} />
                    </button>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer w-[130px] text-right"
                    aria-sort={filters.sort === 'totale' ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort('totale')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleSort('totale')
                        }
                      }}
                      className="flex items-center gap-0 bg-transparent border-none cursor-pointer p-0 font-inherit text-inherit ml-auto"
                      role="columnheader"
                      aria-sort={filters.sort === 'totale' ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Totale <SortIcon column="totale" currentSort={filters.sort} currentOrder={filters.order} />
                    </button>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer w-[170px]"
                    aria-sort={filters.sort === 'data' ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort('data')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleSort('data')
                        }
                      }}
                      className="flex items-center gap-0 bg-transparent border-none cursor-pointer p-0 font-inherit text-inherit"
                      role="columnheader"
                      aria-sort={filters.sort === 'data' ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Data <SortIcon column="data" currentSort={filters.sort} currentOrder={filters.order} />
                    </button>
                  </TableHead>
                  <TableHead className="sticky right-0 z-20 bg-background w-[70px] text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.items.map((order) => (
                  <TableRow
                    key={order.id}
                    data-state={selectedIds.has(order.id) ? 'selected' : undefined}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => handleRowClick(order.id, e)}
                    onKeyDown={(e) => handleRowKeyDown(order.id, e)}
                    tabIndex={0}
                    role="link"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()} className="sticky left-0 z-10 bg-background py-3">
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelect(order.id)}
                        aria-label={`Seleziona ordine #${order.id} — ${order.cliente}`}
                      />
                    </TableCell>
                    <TableCell className="sticky left-[40px] z-10 bg-background text-right font-mono text-xs text-muted-foreground py-3">
                      #{order.id}
                    </TableCell>
                    <TableCell className="font-medium py-3 max-w-[250px] truncate" title={order.cliente}>
                      {order.cliente}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant={STATUS_CONFIG[order.stato].variant}>
                        {STATUS_CONFIG[order.stato].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-3">
                      {formatCurrency(order.totale)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm py-3">
                      {formatDate(order.data)}
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 bg-background text-right py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Azioni per ordine #${order.id}`}
                            aria-haspopup="true"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleNavigateEdit(order.id)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openDeleteDialog([order])}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setFilters({ page: filters.page - 1 })}
                    aria-disabled={filters.page <= 1}
                    aria-label="Pagina precedente"
                    className={filters.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {(() => {
                  const pages: (number | 'ellipsis')[] = []
                  for (let i = 1; i <= data.totalPages; i++) {
                    if (i === 1 || i === data.totalPages || Math.abs(i - filters.page) <= 2) {
                      if (pages.length > 0 && i - (pages[pages.length - 1] as number) > 1) {
                        pages.push('ellipsis')
                      }
                      pages.push(i)
                    }
                  }
                  return pages.map((page, idx) =>
                    page === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <Button
                          variant={page === filters.page ? 'default' : 'ghost'}
                          size="sm"
                          className="h-8 w-8"
                          onClick={() => setFilters({ page })}
                          aria-label={`Pagina ${page}`}
                          aria-current={page === filters.page ? 'page' : undefined}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    ),
                  )
                })()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setFilters({ page: filters.page + 1 })}
                    aria-disabled={filters.page >= data.totalPages}
                    aria-label="Pagina successiva"
                    className={filters.page >= data.totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {data.total === 0
                ? 'Nessun ordine'
                : `${firstItem}–${lastItem} di ${data.total} ordini`
              }
            </p>
            {data.total > 0 && (
              <p className="text-xs">
                Ultimo aggiornamento: {formatRelativeTime(query.dataUpdatedAt)}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
