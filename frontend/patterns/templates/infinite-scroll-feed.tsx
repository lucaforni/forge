// ============================================================
// Template: Infinite Scroll Feed
// Pattern: infinite-scroll
// Stack: React + shadcn/ui + TanStack React Query + Tailwind
// USAGE: Social feed, activity log, notifications, browse content
// ============================================================

'use client'

import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from 'lucide-react'
import { EmptyState, EmptyStatePresets } from './empty-state'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export type InfiniteScrollState =
  | 'idle'
  | 'loading-more'
  | 'all-loaded'
  | 'empty'
  | 'error'
  | 'refetching'

export interface PageResponse<T> {
  items: T[]
  nextCursor?: string | null
  total?: number
}

export interface InfiniteScrollProps<T extends { id: string }> {
  /** React Query key per cache e refetch */
  queryKey: string[]
  /** Funzione fetch per pagina (cursor o offset) */
  queryFn: (param: { cursor?: string; offset?: number }) => Promise<PageResponse<T>>
  /** Render per singolo item */
  renderItem: (item: T, index: number) => ReactNode
  /** Componente empty state (first-visit) */
  emptyState?: ReactNode
  /** Componente loading skeleton (default: 6 card skeleton) */
  loadingSkeleton?: ReactNode
  /** Testo per "all loaded" (default: "Hai visto tutti gli elementi") */
  allLoadedMessage?: string
  /** Abilita fallback button "Load More" (default: true) */
  showLoadMore?: boolean
  /** Numero skeleton cards in loading (default: 6) */
  skeletonCount?: number
  /** Chiave per salvare scroll position (sessionStorage) */
  scrollKey?: string
  className?: string
  /** Callback quando nuovi item vengono caricati (per aria-live) */
  onItemsLoaded?: (count: number) => void
}

interface UseInfiniteScrollReturn<T> {
  items: T[]
  state: InfiniteScrollState
  sentinelRef: RefObject<HTMLDivElement | null>
  fetchNextPage: () => void
  refetch: () => void
  isFetchingNextPage: boolean
  isRefetching: boolean
  hasNextPage: boolean
  totalCount?: number
}

// ──────────────────────────────────────────────
// HOOK: useInfiniteScroll
// ──────────────────────────────────────────────

function useInfiniteScroll<T extends { id: string }>({
  queryKey,
  queryFn,
  scrollKey,
}: {
  queryKey: string[]
  queryFn: (param: { cursor?: string; offset?: number }) => Promise<PageResponse<T>>
  scrollKey?: string
}): UseInfiniteScrollReturn<T> {
  const [state, setState] = useState<InfiniteScrollState>('idle')

  const {
    data,
    fetchNextPage,
    refetch,
    isFetchingNextPage,
    isRefetching,
    hasNextPage,
    isError,
    isFetched,
    isFetching,
  } = useInfiniteQuery<
    PageResponse<T>,
    Error,
    InfiniteData<PageResponse<T>>,
    string[],
    { cursor?: string; offset?: number }
  >({
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam),
    initialPageParam: { cursor: undefined, offset: 0 },
    getNextPageParam: (lastPage) => {
      if (!lastPage.nextCursor) return undefined
      return { cursor: lastPage.nextCursor, offset: lastPage.items.length }
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  )

  const totalCount = useMemo(
    () => data?.pages[0]?.total,
    [data],
  )

  // Derive state
  useEffect(() => {
    if (!isFetched && isFetching) {
      setState('idle')
    } else if (isFetchingNextPage) {
      setState('loading-more')
    } else if (isRefetching) {
      setState('refetching')
    } else if (isError) {
      setState('error')
    } else if (isFetched && items.length === 0) {
      setState('empty')
    } else if (isFetched && !hasNextPage) {
      setState('all-loaded')
    } else {
      setState('idle')
    }
  }, [isFetched, isFetching, isFetchingNextPage, isRefetching, isError, items.length, hasNextPage])

  // IntersectionObserver sentinel
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    })
    observer.observe(el)

    return () => observer.disconnect()
  }, [handleIntersect, hasNextPage])

  // Scroll position preservation
  useEffect(() => {
    if (!scrollKey) return

    const saved = sessionStorage.getItem(scrollKey)
    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10))
      })
    }

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          sessionStorage.setItem(scrollKey, String(window.scrollY))
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollKey])

  return {
    items,
    state,
    sentinelRef,
    fetchNextPage,
    refetch,
    isFetchingNextPage,
    isRefetching,
    hasNextPage: !!hasNextPage,
    totalCount,
  }
}

// ──────────────────────────────────────────────
// DEFAULTS
// ──────────────────────────────────────────────

function DefaultSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DefaultEmptyState({ onCreate }: { onCreate?: () => void }) {
  return <EmptyState {...EmptyStatePresets.firstVisit('items', onCreate ?? (() => {}))} />
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function InfiniteScrollFeed<T extends { id: string }>({
  queryKey,
  queryFn,
  renderItem,
  emptyState,
  loadingSkeleton,
  allLoadedMessage = "You've seen all items",
  showLoadMore = true,
  skeletonCount = 6,
  scrollKey,
  className = '',
  onItemsLoaded,
}: InfiniteScrollProps<T>) {
  const {
    items,
    state,
    sentinelRef,
    fetchNextPage,
    refetch,
    isFetchingNextPage,
    isRefetching,
    hasNextPage,
    totalCount,
  } = useInfiniteScroll<T>({ queryKey, queryFn, scrollKey })

  const prevCountRef = useRef(0)

  useEffect(() => {
    if (items.length > prevCountRef.current) {
      const diff = items.length - prevCountRef.current
      onItemsLoaded?.(diff)
    }
    prevCountRef.current = items.length
  }, [items.length, onItemsLoaded])

  // ── Refetching state ──
  if (isRefetching) {
    return (
      <div className={className}>
        {loadingSkeleton ?? <DefaultSkeletonGrid count={skeletonCount} />}
      </div>
    )
  }

  // ── Empty state ──
  if (state === 'empty') {
    return (
      <div className={className}>
        {emptyState ?? <DefaultEmptyState />}
      </div>
    )
  }

  // ── Idle / initial loading ──
  if (state === 'idle' && items.length === 0) {
    return (
      <div className={className}>
        {loadingSkeleton ?? <DefaultSkeletonGrid count={skeletonCount} />}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ITEMS COUNTER (aria-live only) */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.length > 0 && `${items.length} items loaded`}
      </div>

      {/* FEED CONTAINER */}
      <div
        role="feed"
        aria-busy={isFetchingNextPage}
        aria-label="Items feed"
      >
        {/* ITEMS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <article
              key={item.id}
              role="article"
              aria-setsize={totalCount ?? items.length}
              aria-posinset={index + 1}
            >
              {renderItem(item, index)}
            </article>
          ))}
        </div>

        {/* SENTINEL */}
        {hasNextPage && (
          <div
            ref={sentinelRef}
            className="h-4"
            aria-hidden="true"
          />
        )}

        {/* LOADING MORE SKELETON */}
        {isFetchingNextPage && (
          loadingSkeleton ?? <DefaultSkeletonGrid count={skeletonCount} />
        )}

        {/* ALL LOADED */}
        {!hasNextPage && items.length > 0 && (
          <p
            className="text-center text-sm text-muted-foreground py-8"
            role="status"
            aria-live="polite"
          >
            {allLoadedMessage}
          </p>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div
            className="flex flex-col items-center justify-center gap-3 py-6"
            role="alert"
          >
            <p className="text-sm text-destructive">
              Unable to load more items
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* LOAD MORE BUTTON (a11y fallback) */}
      {showLoadMore && hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            aria-label="Load more items"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// EXAMPLE USAGE
// ──────────────────────────────────────────────

/*
 * ── Types ──

interface ActivityItem {
  id: string
  user: { name: string; avatar: string }
  action: string
  target: string
  timestamp: string
}

 * ── Query Hook ──

function useActivityFeed() {
  return {
    queryKey: ['activity-feed'],
    queryFn: async ({ cursor }: { cursor?: string; offset?: number }) => {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      params.set('limit', '12')

      const res = await fetch(`/api/activity?${params}`)
      if (!res.ok) throw new Error('Failed to fetch activity')

      return res.json() as Promise<PageResponse<ActivityItem>>
    },
  }
}

 * ── ActivityFeed Component ──

export function ActivityFeed() {
  const { queryKey, queryFn } = useActivityFeed()

  return (
    <InfiniteScrollFeed
      queryKey={queryKey}
      queryFn={queryFn}
      renderItem={(item) => (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Avatar>
              <AvatarImage src={item.user.avatar} alt={item.user.name} />
              <AvatarFallback>{item.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{item.user.name}</p>
              <p className="text-xs text-muted-foreground">{item.timestamp}</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="font-medium">{item.user.name}</span>{' '}
              {item.action}{' '}
              <span className="font-medium">{item.target}</span>
            </p>
          </CardContent>
        </Card>
      )}
      skeletonCount={6}
      scrollKey="activity-scroll"
      allLoadedMessage="You've seen all activities"
    />
  )
}
*/
