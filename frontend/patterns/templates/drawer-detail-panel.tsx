// ============================================================
// Template: Drawer/Sheet Detail Panel
// Pattern: drawer-panel
// Stack: React + shadcn/ui Sheet + React Query + Tailwind
// USAGE: Copiare e adattare API, tipi, tabs del dettaglio
// ============================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { X, AlertCircle, Package, Calendar, RefreshCw } from 'lucide-react'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface TimelineEvent {
  id: string
  type: string
  description: string
  timestamp: string
  actor: string
}

interface OrderDetail {
  id: string
  customerName: string
  customerEmail: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
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
}

interface DrawerDetailPanelProps {
  title?: string
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

function statusVariant(status: OrderDetail['status']): 'secondary' | 'default' | 'destructive' | 'outline' {
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
// API (sostituire con fetch reale)
// ──────────────────────────────────────────────

async function fetchOrderDetail(id: string): Promise<OrderDetail> {
  const res = await fetch(`/api/orders/${id}`)
  if (!res.ok) throw new Error('Error loading order detail')
  return res.json()
}

// ──────────────────────────────────────────────
// HOOK: responsive sheet side
// ──────────────────────────────────────────────

function useResponsiveSheetSide() {
  const [side, setSide] = useState<'right' | 'bottom'>('right')

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setSide(mq.matches ? 'right' : 'bottom')
    const handler = (e: MediaQueryListEvent) => setSide(e.matches ? 'right' : 'bottom')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return side
}

// ──────────────────────────────────────────────
// HOOK: React Query detail (attivo solo quando sheet aperto)
// ──────────────────────────────────────────────

function useItemDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => fetchOrderDetail(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}

// ──────────────────────────────────────────────
// SKELETON
// ──────────────────────────────────────────────

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

function DetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Loading error</AlertTitle>
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

// ──────────────────────────────────────────────
// DETAIL CONTENT
// ──────────────────────────────────────────────

function DetailContent({ detail }: { detail: OrderDetail }) {
  return (
    <Tabs defaultValue="details" className="mt-4">
      <TabsList>
        <TabsTrigger value="details" className="gap-2">
          <Package className="h-4 w-4" />
          Details
        </TabsTrigger>
        <TabsTrigger value="timeline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Timeline
        </TabsTrigger>
      </TabsList>

      {/* ── TAB: Details ── */}
      <TabsContent value="details" className="space-y-6 mt-4">
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Order Summary</h3>
          <div className="space-y-2">
            {detail.items.map((item) => (
              <div key={`${item.name}-${item.quantity}`} className="flex items-center justify-between text-sm">
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
                {idx < detail.timeline.length - 1 && (
                  <div className="absolute left-2 top-3 bottom-0 w-px bg-border" />
                )}
                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background" />
                <div className="text-sm">
                  <p className="font-medium">{event.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
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

    </Tabs>
  )
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function DrawerDetailPanel({ title = 'Order detail' }: DrawerDetailPanelProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const side = useResponsiveSheetSide()

  const detailId = searchParams.get('detail') ?? null

  const setDetailId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) {
        params.set('detail', id)
      } else {
        params.delete('detail')
      }
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [searchParams, pathname, router],
  )

  const detailQuery = useItemDetailQuery(detailId)
  const detailData = detailQuery.data
  const isDetailLoading = detailQuery.isLoading
  const isDetailError = detailQuery.isError

  const handleRetry = useCallback(() => {
    detailQuery.refetch()
  }, [detailQuery])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setDetailId(null)
    },
    [setDetailId],
  )

  return (
    <Sheet open={!!detailId} onOpenChange={handleOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          'p-0',
          side === 'right' && 'w-full sm:w-[500px]',
          side === 'bottom' && 'h-[85vh] rounded-t-xl',
        )}
        aria-label={detailData ? `Order detail ${detailData.customerName}` : 'Loading detail'}
      >
        <SheetHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle>
              {detailData?.customerName ?? title}
            </SheetTitle>
            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
          {detailData && (
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-muted-foreground">{detailData.customerEmail}</p>
              <Badge variant={statusVariant(detailData.status)}>
                {STATUS_LABELS[detailData.status]}
              </Badge>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4" aria-busy={isDetailLoading}>
          {isDetailLoading && <DetailSkeleton />}
          {isDetailError && !detailData && <DetailError onRetry={handleRetry} />}
          {detailData && <DetailContent detail={detailData} />}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
