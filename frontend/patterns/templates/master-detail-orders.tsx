// ============================================================
// Template: Master-Detail Ordini
// Pattern: master-detail
// Stack: React + shadcn/ui + React Query + Tailwind
// USAGE: Copiare e adattare API, tipi, tabs del dettaglio
// ============================================================

'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  Calendar,
  User,
  MessageSquare,
  Package,
  RefreshCw,
} from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface OrderListItem {
  id: string
  customerName: string
  customerAvatar?: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  itemsCount: number
  createdAt: string
}

interface TimelineEvent {
  id: string
  type: string
  description: string
  timestamp: string
  actor: string
}

interface Note {
  id: string
  text: string
  author: string
  createdAt: string
}

interface OrderDetail {
  id: string
  customerName: string
  customerEmail: string
  status: OrderListItem['status']
  total: number
  subtotal: number
  shipping: number
  tax: number
  items: { name: string; quantity: number; price: number }[]
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    province: string
    zip: string
    country: string
  }
  createdAt: string
  timeline: TimelineEvent[]
  notes: Note[]
}

// ──────────────────────────────────────────────
// STATUS CONFIG
// ──────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function statusVariant(status: OrderListItem['status']): 'secondary' | 'default' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending': return 'secondary'
    case 'confirmed': return 'default'
    case 'processing': return 'secondary'
    case 'shipped': return 'default'
    case 'delivered': return 'outline'
    case 'cancelled': return 'destructive'
  }
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ──────────────────────────────────────────────
// API
// ──────────────────────────────────────────────

async function fetchOrdersList(): Promise<OrderListItem[]> {
  const res = await fetch('/api/orders')
  if (!res.ok) throw new Error('Error loading orders')
  return res.json()
}

async function fetchOrderDetail(id: string): Promise<OrderDetail> {
  const res = await fetch(`/api/orders/${id}`)
  if (!res.ok) throw new Error(`Error loading order detail`)
  return res.json()
}

// ──────────────────────────────────────────────
// HOOKS
// ──────────────────────────────────────────────

const ORDER_DETAIL_STALE_TIME = 30_000

function useOrdersListQuery() {
  return useQuery({
    queryKey: ['orders-list'],
    queryFn: fetchOrdersList,
    staleTime: 60_000,
  })
}

function useOrderDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => fetchOrderDetail(id!),
    enabled: !!id,
    staleTime: ORDER_DETAIL_STALE_TIME,
  })
}

function usePrefetchOrderDetail() {
  const queryClient = useQueryClient()
  return useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: ['order-detail', id],
        queryFn: () => fetchOrderDetail(id),
        staleTime: ORDER_DETAIL_STALE_TIME,
      })
    },
    [queryClient],
  )
}

// ──────────────────────────────────────────────
// SKELETONS
// ──────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// SUB-COMPONENTS
// ──────────────────────────────────────────────

function EmptyDetail() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <ArrowLeft className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold text-foreground">Select an order</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Select an order from the list to view its details.
      </p>
    </div>
  )
}

function ListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Loading error</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          Unable to load the orders list.
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

function DetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Order detail error</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          Unable to load details.
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

function OrderListItemCard({
  item,
  isSelected,
  onSelect,
  onPrefetch,
}: {
  item: OrderListItem
  isSelected: boolean
  onSelect: () => void
  onPrefetch: () => void
}) {
  return (
    <Card
      role="option"
      aria-selected={isSelected}
      data-selected={isSelected}
      onClick={onSelect}
      onMouseEnter={onPrefetch}
      className={`cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary bg-accent'
          : 'hover:bg-accent/50'
      }`}
    >
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {item.customerName}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {item.itemsCount} item{item.itemsCount > 1 ? 's' : ''} · {formatDate(item.createdAt)}
            </CardDescription>
          </div>
          <Badge variant={statusVariant(item.status)} className="shrink-0">
            {STATUS_LABELS[item.status]}
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold">{formatCurrency(item.total)}</span>
          <ChevronRight className={`h-4 w-4 transition-opacity ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
          }`} />
        </div>
      </CardHeader>
    </Card>
  )
}

// ──────────────────────────────────────────────
// DETAIL PANEL
// ──────────────────────────────────────────────

function DetailPanel({ detail }: { detail: OrderDetail }) {
  return (
    <div className="p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{detail.customerName}</h2>
          <p className="text-sm text-muted-foreground">{detail.customerEmail}</p>
        </div>
        <Badge variant={statusVariant(detail.status)} className="text-sm px-3 py-1">
          {STATUS_LABELS[detail.status]}
        </Badge>
      </div>

      <Separator className="mb-6" />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details" className="gap-2">
            <Package className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Details ── */}
        <TabsContent value="details" className="space-y-6 mt-4">
          {/* Order Summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Order Summary</h3>
            <div className="space-y-2">
              {detail.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} <span className="text-xs">×{item.quantity}</span>
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(detail.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(detail.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span>{formatCurrency(detail.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(detail.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Shipping Address</h3>
            <address className="text-sm not-italic">
              <p>{detail.shippingAddress.line1}</p>
              {detail.shippingAddress.line2 && <p>{detail.shippingAddress.line2}</p>}
              <p>
                {detail.shippingAddress.zip} {detail.shippingAddress.city} ({detail.shippingAddress.province})
              </p>
              <p>{detail.shippingAddress.country}</p>
            </address>
          </div>

          {/* Dates */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Created on {formatDate(detail.createdAt)}</span>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: Timeline ── */}
        <TabsContent value="timeline" className="mt-4">
          {detail.timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No events in timeline.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {detail.timeline.map((event, idx) => (
                <div key={event.id} className="relative pl-6 pb-6 last:pb-0">
                  {/* Timeline line */}
                  {idx < detail.timeline.length - 1 && (
                    <div className="absolute left-2 top-3 bottom-0 w-px bg-border" />
                  )}
                  {/* Dot */}
                  <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background" />
                  <div className="text-sm">
                    <p className="font-medium">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{event.actor}</span>
                      <span>·</span>
                      <span>{formatDate(event.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB: Notes ── */}
        <TabsContent value="notes" className="mt-4">
          {detail.notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No notes for this order.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {detail.notes.map((note) => (
                <div key={note.id} className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm">{note.text}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{note.author}</span>
                    <span>·</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function OrdersMasterDetail() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const selectedId = searchParams.get('selected') ?? null

  const setSelectedId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) {
        params.set('selected', id)
      } else {
        params.delete('selected')
      }
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [searchParams, pathname, router],
  )

  const ordersListQuery = useOrdersListQuery()
  const orderDetailQuery = useOrderDetailQuery(selectedId)
  const prefetchDetail = usePrefetchOrderDetail()

  const listData = ordersListQuery.data
  const detailData = orderDetailQuery.data
  const isListLoading = ordersListQuery.isLoading
  const isListError = ordersListQuery.isError
  const isDetailLoading = orderDetailQuery.isLoading
  const isDetailError = orderDetailQuery.isError

  // ── Handlers ──

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id)
    },
    [setSelectedId],
  )

  const handleRetryList = useCallback(() => {
    ordersListQuery.refetch()
  }, [ordersListQuery])

  const handleRetryDetail = useCallback(() => {
    orderDetailQuery.refetch()
  }, [orderDetailQuery])

  // ── Render ──

  return (
    <div className="flex h-[calc(100vh-4rem)] border rounded-lg overflow-hidden">
      {/* ── LIST PANEL ── */}
      <aside className="w-full lg:w-[380px] border-r shrink-0 bg-background">
        {isListLoading && <ListSkeleton />}
        {isListError && !listData && <ListError onRetry={handleRetryList} />}
        {listData && listData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">No orders</p>
            <p className="text-xs text-muted-foreground mt-1">No orders yet.</p>
          </div>
        )}
        {listData && listData.length > 0 && (
          <ScrollArea className="h-full">
            <div
              className="p-3 space-y-2"
              role="listbox"
              aria-label="Orders list"
              aria-busy={isListLoading}
            >
              {listData.map((item) => (
                <OrderListItemCard
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedId}
                  onSelect={() => handleSelect(item.id)}
                  onPrefetch={() => prefetchDetail(item.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </aside>

      {/* ── DETAIL PANEL — desktop ── */}
      <main
        className="hidden lg:flex flex-1 flex-col bg-muted/30"
        role="region"
        aria-label={detailData ? `Order detail ${detailData.customerName}` : 'No order selected'}
      >
        {!selectedId && <EmptyDetail />}
        {selectedId && isDetailLoading && <DetailSkeleton />}
        {selectedId && isDetailError && !detailData && (
          <DetailError onRetry={handleRetryDetail} />
        )}
        {selectedId && detailData && (
          <DetailPanel detail={detailData} />
        )}
      </main>

      {/* ── DETAIL PANEL — mobile (Sheet) ── */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[85vh] sm:h-[85vh] p-0"
          aria-label={detailData ? `Order detail ${detailData.customerName}` : 'Loading detail'}
        >
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="text-left">
              {detailData?.customerName ?? 'Order detail'}
            </SheetTitle>
          </SheetHeader>
          {selectedId && isDetailLoading && <DetailSkeleton />}
          {selectedId && isDetailError && !detailData && (
            <DetailError onRetry={handleRetryDetail} />
          )}
          {selectedId && detailData && (
            <DetailPanel detail={detailData} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
