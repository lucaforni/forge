# Pattern: Infinite Scroll

**Severity**: Advanced · **Stack**: React + shadcn/ui + TanStack React Query + Tailwind
**Depends on**: Card, Skeleton, Button, ScrollArea, Badge (optional)
**Applies to**: Continuous feeds, activity logs, notifications, browse-centric content

---

## 1. When to Use

**Use this pattern when**:
- Content organized as a linear feed loaded in chunks (pages/cursors)
- The browsing experience is exploratory (user scrolls without a specific goal)
- The number of items is unpredictable or potentially unlimited
- You want to reduce friction compared to traditional pagination

**Variants**:
- **cursor-based**: API returns a cursor for the next page (more common, more robust)
- **offset-based**: API uses page/offset (simple but fragile if data changes)

**Do NOT use**:
- Data requiring sorting/comparison between rows → Data Table pattern
- Search results with ranking → Search pattern
- Admin panels with batch actions → Data Table + Pagination
- Fewer than 20 total items → Static list (single page)

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Card | Container for single feed item | default — with `overflow-hidden` if needed |
| CardHeader | Item header (avatar, title, date) | default |
| CardContent | Item body (description, content) | default |
| CardFooter | Item footer (actions: like, comment, share) | default |
| Skeleton | Placeholder during loading | default — shape: Card for item, 6 skeletons |
| Skeleton (sentinel) | End-of-page placeholder for observer | default — small, position: absolute |
| Button | Fallback "Load more" for a11y/keyboard | variant: outline, size: default |
| Button | Retry on error | variant: secondary, size: sm |
| ScrollArea | (Optional) custom scroll container | default |
| Badge | (Optional) tag on item (category, status) | variant: secondary/outline |

---

## 3. JSX Structure

```tsx
<div className="space-y-6">
  {/* FEED CONTAINER */}
  <div
    id="infinite-feed"
    role="feed"
    aria-busy={isFetching}
    aria-label="Item feed"
  >
    {/* ITEM LIST */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <article
          key={item.id}
          role="article"
          aria-setsize={totalCount}
          aria-posinset={index + 1}
        >
          <Card>
            <CardHeader>...</CardHeader>
            <CardContent>...</CardContent>
            <CardFooter>...</CardFooter>
          </Card>
        </article>
      ))}
    </div>

    {/* SENTINEL (IntersectionObserver target) */}
    {hasNextPage && (
      <div
        ref={sentinelRef}
        className="h-4"
        aria-hidden="true"
      />
    )}

    {/* LOADING MORE SKELETON */}
    {isFetchingNextPage && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={`skel-${i}`}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )}

    {/* ALL LOADED INDICATOR */}
    {!hasNextPage && items.length > 0 && (
      <p
        className="text-center text-sm text-muted-foreground py-8"
        role="status"
        aria-live="polite"
      >
        You've seen all items
      </p>
    )}

    {/* ERROR BANNER */}
    {isError && (
      <div className="flex items-center justify-center gap-3 py-4">
        <p className="text-sm text-destructive">
          Could not load more items
        </p>
        <Button variant="secondary" size="sm" onClick={refetch}>
          Try again
        </Button>
      </div>
    )}
  </div>

  {/* LOAD MORE BUTTON (a11y fallback) */}
  {hasNextPage && (
    <div className="flex justify-center">
      <Button
        variant="outline"
        onClick={fetchNextPage}
        disabled={isFetchingNextPage}
        aria-label="Load more items"
      >
        {isFetchingNextPage ? 'Loading...' : 'Load more'}
      </Button>
    </div>
  )}
</div>
```

---

## 4. State Machine

```yaml
Pattern: InfiniteScroll
Initial: idle

States:
  idle:
    description: "Initial state, first API request"
    ui: "Skeleton grid (6 card placeholders). Scroll not yet active."
    transitions:
      on_mount → loading-more

  loading-more:
    description: "API request in progress for next page"
    ui: "Skeleton cards at bottom of feed (6 cards with pulse). Scroll disabled. Sentinel visible."
    transitions:
      on_success → idle (if more pages) / all-loaded (if last) / empty (if 0 total items)
      on_error → error

  all-loaded:
    description: "All pages loaded, none available"
    ui: "'You've seen all items' at bottom. Sentinel disappeared. Load More hidden."
    transitions:
      on_refetch → refetching

  empty:
    description: "Zero total items (first page empty)"
    ui: "EmptyState pattern (first-visit variant: 'No items' + CTA 'Create'). No skeletons."
    transitions:
      on_retry → loading-more
      on_refetch → refetching

  error:
    description: "Error during page fetch"
    ui: "Error banner at bottom ('Could not load items' + 'Try again'). Already loaded items remain visible."
    transitions:
      on_retry → loading-more
      on_refetch → refetching

  refetching:
    description: "Manual refresh of entire feed (pull-to-refresh or button)"
    ui: "Skeleton replacing existing content (or subtle spinner at top)."
    transitions:
      on_success → idle / all-loaded / empty
      on_error → error (existing content preserved)
```

---

## 5. Data Flow

### 5.1 React Query — useInfiniteQuery

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

interface PageParam {
  cursor?: string
  offset?: number
}

interface PageResponse<T> {
  items: T[]
  nextCursor?: string | null
  total?: number
}

export function useInfiniteFeed<T>(queryKey: string[], queryFn: (param: PageParam) => Promise<PageResponse<T>>) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam),
    initialPageParam: { cursor: undefined, offset: 0 },
    getNextPageParam: (lastPage) => {
      if (!lastPage.nextCursor) return undefined
      return { cursor: lastPage.nextCursor, offset: lastPage.items.length }
    },
  })
}
```

### 5.2 API Response Shape

```tsx
// Cursor-based (preferred)
interface CursorResponse<T> {
  items: T[]
  nextCursor: string | null     // null = last page
  total?: number                // optional, for aria-setsize
}

// Offset-based (alternative)
interface OffsetResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
```

### 5.3 IntersectionObserver Hook

```tsx
import { useEffect, useRef, useCallback } from 'react'

export function useIntersectionSentinel(
  onIntersect: () => void,
  enabled: boolean
) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && enabled) {
        onIntersect()
      }
    },
    [onIntersect, enabled]
  )

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !enabled) return

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px', // trigger 200px before end
    })
    observer.observe(el)

    return () => observer.disconnect()
  }, [handleIntersect, enabled])

  return sentinelRef
}
```

### 5.4 Cache Strategy

```
Query Key: [queryKey] (e.g. ['feed', 'notifications'])
  staleTime: 30s (fresh data but not obsessive refetch on remount)
  gcTime: 5min (keep cache in background)
  getNextPageParam: from last page
```

### 5.5 Scroll Position Preservation

```tsx
// Save position on navigation
useEffect(() => {
  const handleScroll = () => {
    sessionStorage.setItem(scrollKey, String(window.scrollY))
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [scrollKey])

// Restore on return
useEffect(() => {
  const saved = sessionStorage.getItem(scrollKey)
  if (saved) {
    window.scrollTo(0, parseInt(saved, 10))
  }
}, [scrollKey])
```

---

## 6. TypeScript Types

```tsx
import { type InfiniteData } from '@tanstack/react-query'

// ── Generic Item ──
interface FeedItem {
  id: string
  [key: string]: unknown
}

// ── Props ──
interface InfiniteScrollProps<T extends FeedItem> {
  /** React Query key for cache and refetch */
  queryKey: string[]
  /** Fetch function per page (cursor or offset) */
  queryFn: (param: { cursor?: string; offset?: number }) => Promise<{
    items: T[]
    nextCursor?: string | null
    total?: number
  }>
  /** Render for single item */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Empty state component (first-visit variant) */
  emptyState?: React.ReactNode
  /** Loading skeleton component (default: 6 card skeletons) */
  loadingSkeleton?: React.ReactNode
  /** Text for "all loaded" (default: "You've seen all items") */
  allLoadedMessage?: string
  /** Enable fallback "Load More" button (default: true) */
  showLoadMore?: boolean
  /** Number of skeleton cards in loading (default: 6) */
  skeletonCount?: number
  /** Key for saving scroll position (sessionStorage) */
  scrollKey?: string
  className?: string
}

// ── State (for custom hook) ──
type InfiniteScrollState = 'idle' | 'loading-more' | 'all-loaded' | 'empty' | 'error' | 'refetching'

// ── Paginated Response ──
interface PageResponse<T> {
  items: T[]
  nextCursor?: string | null
  total?: number
}

// ── Custom Hook Return ──
interface UseInfiniteScrollReturn<T> {
  items: T[]
  state: InfiniteScrollState
  sentinelRef: React.RefObject<HTMLDivElement | null>
  fetchNextPage: () => void
  refetch: () => void
  isFetchingNextPage: boolean
  isRefetching: boolean
  hasNextPage: boolean
  totalCount?: number
}
```

---

## 7. Accessibility

### ARIA — Feed Pattern

| Element | ARIA Attribute | Value |
|----------|---------------|--------|
| Feed container | `role="feed"` | — |
| Feed container | `aria-busy` | `true` during fetch |
| Feed container | `aria-label` | "Feed [items]" |
| Single item | `role="article"` | — |
| Single item (numbered) | `aria-setsize` | Total known items |
| Single item (numbered) | `aria-posinset` | Global position (1-based) |
| Load More button | `aria-label` | "Load more items" |
| Skeleton container | `aria-hidden` | `true` |
| "All loaded" | `role="status"` + `aria-live="polite"` | Announce to screen readers |
| Error banner | `role="alert"` | Immediate announcement |

### Keyboard Navigation

| Element | Interaction |
|----------|-------------|
| Load More button | Tab for focus, Enter/Space to load |
| Feed items | Tab navigates between cards (if interactive: link, button inside article) |
| Sentinel | Not focusable (hidden div) |

### Screen Reader Flow

```
1. "Feed [items], [N] items loaded"
2. "Loading in progress" (when sentinel triggers new page)
3. "[N] new items loaded" (aria-live="polite")
4. "You've seen all items" (end of feed)
5. "Error: could not load. Button: Try again" (error)
```

### Live Regions

- New items loaded: announce with `aria-live="polite"` via a separate container
- Error: `role="alert"` or `aria-live="assertive"`
- Loading state: `aria-busy="true"` on the feed container

### Focus Management

- After "Load More" click: focus stays on button (or moves to first new item)
- After error + retry: focus goes to the "Try again" button
- After navigation: scroll position preserved via sessionStorage

---

## 8. Responsive

| Breakpoint | Card Grid | Behavior |
|------------|-------------|---------------|
| < 768px (mobile) | 1 column | Full-width cards. Skeleton: 4 cards. Load More button full-width. |
| 768-1023px (tablet) | 2 columns | Side-by-side cards. Skeleton: 4 cards (2×2). |
| 1024px+ (desktop) | 3 columns | 3-card grid. Skeleton: 6 cards (3×2). |

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* items */}
</div>
```

### Loading per breakpoint

```tsx
const skeletonCount = useMemo(() => {
  if (typeof window === 'undefined') return 6
  if (window.innerWidth < 768) return 4
  if (window.innerWidth < 1024) return 4
  return 6
}, [])
```

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Scroll to bottom triggers fetch of next page (IntersectionObserver)
- [ ] Sentinel div is positioned just after the last item, visible to user
- [ ] Load More button (a11y fallback) works and loads next page
- [ ] Loading skeleton shown during fetch (matches real card structure)
- [ ] "All loaded" indicator appears when `hasNextPage === false` (only if at least 1 item)
- [ ] Error shows message + "Try again" without losing already loaded items
- [ ] No duplicate items between successive pages (getNextPageParam correct)
- [ ] Scroll position preserved on back/forward navigation (sessionStorage)
- [ ] IntersectionObserver cleanup on unmount (no memory leak)
- [ ] Empty state (first-visit) shown when total items === 0
- [ ] Manual refetch preserves scroll position
- [ ] aria-setsize and aria-posinset updated dynamically

### States Verified
- [ ] idle: initial state, loading skeleton visible
- [ ] loading-more: skeleton at bottom, sentinel active, new items arriving
- [ ] all-loaded: "You've seen all items", no scroll trigger
- [ ] empty: EmptyState (first-visit) with CTA "Create" / "Start"
- [ ] error: inline error with retry, previous items preserved
- [ ] refetching: full feed refresh, existing content replaced

### Data Flow
- [ ] useInfiniteQuery: queryKey, queryFn, getNextPageParam configured
- [ ] Pages flattened with `data.pages.flatMap(p => p.items)` (no duplicate items)
- [ ] getNextPageParam returns `undefined` when no more pages
- [ ] Cache: staleTime 30s, gcTime 5min, optional preventive prefetch
- [ ] Scroll position saved in sessionStorage before navigation

### Accessibility Pattern-Specific
- [ ] `role="feed"` on container, `role="article"` on item
- [ ] aria-setsize + aria-posinset on numbered items
- [ ] Load More button (keyboard navigable) present as fallback
- [ ] aria-live="polite" to announce "N new items loaded"
- [ ] aria-busy="true" on container during fetch
- [ ] Skeleton: `aria-hidden="true"` (does not confuse screen reader)
