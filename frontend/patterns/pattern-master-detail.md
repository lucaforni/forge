# Pattern: Master-Detail

**Severity**: Core · **Stack**: shadcn/ui + React Query + Tailwind
**Depends on**: ScrollArea, Sheet, Tabs, Skeleton, Badge, Button, Separator

---

## 1. When to Use

**Use this pattern when**:
- The user needs to browse a list and see details of a selected element
- Examples: email list + reading, orders list + detail, product catalog + product detail
- List and detail data have separate APIs (cache separation)
- Navigation between list items with immediate feedback

**Do NOT use this pattern when**:
- Create/edit data flow (use Form or Drawer / Sheet)
- Simple list without detail (use Data Table or Card list)
- Flat data without selection hierarchy
- Inline editing in the detail (use Drawer / Sheet)
- Side-by-side comparison of multiple items

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| ScrollArea | Scrollable list container | default |
| Card | List item | default |
| CardHeader, CardTitle, CardDescription | List item header | default |
| Sheet | Mobile detail (replaces right panel) | default |
| SheetTrigger, SheetContent, SheetHeader, SheetTitle | Sheet structure | side="right", side="bottom" |
| Tabs | Detail sections | default |
| TabsList, TabsTrigger, TabsContent | Tabs structure | default |
| Skeleton | List and detail loading state | default |
| Badge | Item status (e.g. order status) | variant: secondary/success/warning/destructive |
| Button | Actions (retry, close detail) | variant: default/ghost/outline |
| Separator | List item separation | default |
| Avatar | If item has associated user | default |

---

## 3. JSX Structure

```tsx
<div className="flex h-[calc(100vh-4rem)]">
  {/* LIST PANEL */}
  <aside className="w-full lg:w-[380px] border-r shrink-0">
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2" role="listbox" aria-label="Items list">
        {items.map((item) => (
          <Card
            key={item.id}
            role="option"
            aria-selected={item.id === selectedId}
            data-selected={item.id === selectedId}
            onClick={() => handleSelect(item.id)}
            onMouseEnter={() => prefetchDetail(item.id)}
            className="cursor-pointer transition-colors data-[selected=true]:border-primary data-[selected=true]:bg-accent"
          >
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
              </div>
              <CardDescription className="text-xs">{item.subtitle}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </ScrollArea>
  </aside>

  {/* DETAIL PANEL — desktop */}
  <main className="hidden lg:flex flex-1 flex-col">
    {selectedId ? <DetailPanel /> : <EmptyDetail />}
  </main>

  {/* DETAIL PANEL — mobile (Sheet) */}
  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
    <SheetContent side="bottom" className="h-[85vh]">
      <SheetHeader>
        <SheetTitle>{detailData?.title}</SheetTitle>
      </SheetHeader>
      {selectedId && <DetailPanel />}
    </SheetContent>
  </Sheet>
</div>
```

---

## 4. State Machine

```yaml
Pattern: MasterDetail
Initial: initial

States:
  initial:
    description: "No element selected"
    ui: "Empty list (skeleton) + right panel: 'Select an item'"
    transitions:
      on_list_loaded → list-loaded
      on_list_error → list-error

  list-loaded:
    description: "List loaded, no selection"
    ui: "Populated list + right panel: 'Select an item'"
    transitions:
      on_select → selecting

  selecting:
    description: "Click on item, selection in progress"
    ui: "Highlighted item (bg-accent + border-primary), detail skeleton"
    transitions:
      on_detail_loaded → detail-loaded
      on_detail_error → detail-error
      on_select_different → selecting (change selection, reload detail)

  detail-loaded:
    description: "Detail loaded and displayed"
    ui: "Detail panel with tabs + data, persistent list item highlight"
    transitions:
      on_select_different → selecting
      on_close_detail → list-loaded (desktop: deselect, mobile: Sheet close)

  detail-error:
    description: "Detail loading error"
    ui: "Detail: error alert + 'Try again', list item still highlighted"
    transitions:
      on_retry → selecting
      on_select_different → selecting

  list-loading:
    description: "List refresh (previous data visible)"
    ui: "List with reduced opacity + spinner, detail unchanged"
    transitions:
      on_list_loaded → detail-loaded (if selection existed) or list-loaded
      on_list_error → list-error

  list-error:
    description: "List loading error"
    ui: "Error alert + 'Try again' instead of list"
    transitions:
      on_retry → list-loading
```

---

## 5. Data Flow

### 5.1 URL State

```
URL: /orders?selected=ord_123

Parameters:
  selected: string — ID of the selected element (source of truth)
```

Selection is synchronized with URL via `useSearchParams`.
Browser Back/Forward navigates between selections.
Absence of `selected` param = initial state.

### 5.2 React Query

```tsx
// List hook (always active)
function useOrdersListQuery() {
  return useQuery({
    queryKey: ['orders-list'],
    queryFn: () => api.getOrdersList(),
    staleTime: 60_000, // 1min — list changes less often
  })
}

// Detail hook (active only with selectedId)
function useOrderDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => api.getOrderDetail(id!),
    // enabled: !!id ensures id is non-null when queryFn is called
    enabled: !!id,
    staleTime: 30_000,
  })
}

// Prefetch (hover)
function usePrefetchOrderDetail() {
  const queryClient = useQueryClient()
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['order-detail', id],
      queryFn: () => api.getOrderDetail(id),
      staleTime: 30_000,
    })
  }
}
```

### 5.3 Cache Strategy

```
List key:  ['orders-list']
Detail key: ['order-detail', id]
List stale time: 60s (changes less often)
Detail stale time: 30s
GC time: 5min
Cache separation: list and detail do NOT share data
Prefetch: hover on item starts detail prefetch (staleTime > 0 avoids duplicate requests)
Invalidation: mutation on order → invalidates ['order-detail', id] AND ['orders-list']
```

### 5.4 API Response Shape

```tsx
interface ApiResponse<T> {
  data: T
  error?: string
}

interface PaginatedList<T> {
  items: T[]
  total: number
}
```

---

## 6. TypeScript Types

```tsx
interface ListItem {
  id: string
  title: string
  subtitle: string
  status: string
  meta?: {
    label: string
    value: string
  }[]
}

interface DetailData {
  id: string
  title: string
  status: string
  sections: DetailSection[]
  metadata: Record<string, string>
  timeline: TimelineEvent[]
  notes: Note[]
}

interface DetailSection {
  id: string
  label: string
  content: React.ReactNode
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

interface MasterDetailProps {
  listQueryKey?: string[]
  detailQueryKey?: string[]
  onItemSelect?: (id: string) => void
  emptyState?: {
    icon?: React.ReactNode
    title?: string
    description?: string
  }
  renderListItem?: (item: ListItem, isSelected: boolean) => React.ReactNode
  renderDetail?: (data: DetailData) => React.ReactNode
}
```

---

## 7. Accessibility

### ARIA Roles
- List: `role="listbox"` with `aria-label="List {items}"`
- List item: `role="option"` with `aria-selected={true|false}`
- Detail panel: `role="region"` with `aria-label="Detail {element name}"`
- Tabs: `role="tablist"`, tab `role="tab"` with `aria-selected`, panels `role="tabpanel"`
- Mobile Sheet: `role="dialog"` with `aria-modal="true"` (handled by shadcn/Sheet)
- Loading: `aria-busy="true"` on container

### Keyboard Navigation
| Key | Action |
|-------|--------|
| Arrow Up | Navigate to previous item in list |
| Arrow Down | Navigate to next item in list |
| Enter | Select the item and open detail (desktop) / Sheet (mobile) |
| Escape | Desktop: deselect. Mobile: close Sheet |
| Tab | Move focus between list and detail panel |
| Shift+Tab | Move focus backward |

### Screen Reader Flow
```
1. "Orders list. {N} items. Use up/down arrows to navigate"
2. "Order {customer}, {amount}, {status}. Selected: {yes/no}"
3. "Order detail {customer}. Panel with {M} sections: Details, Timeline, Notes"
4. "Tab {name}: {content}"
```

### Focus Management
- When selecting an item, focus moves to the detail panel
- When closing the detail (Esc/deselect), focus returns to the last selected item
- Mobile Sheet: focus trap inside Sheet (handled by shadcn)
- On Sheet close, focus returns to the item that opened it

---

## 8. Responsive

| Breakpoint | List Behavior | Detail Behavior |
|------------|--------------------|------------------------|
| ≥ 1024px | Left panel 380px, scrollable | Right panel flex-1, side-by-side |
| < 1024px | Full-width list | Sheet from bottom (85vh) on item click |
| < 640px | Reduced padding list (p-3) | Full-screen Sheet (100vh) |

Sheet: side="bottom" with `h-[85vh]` on tablet, `h-full` on mobile.
Transition: list uses `transition-colors` on highlight, detail fade-in with `animate-in`.

---

## 9. QA Checklist

### Pattern-Specific
- [ ] List: ScrollArea works with long content (native or custom scroll)
- [ ] Selection: item click → visual highlight + URL updated (+ replace, not push)
- [ ] Deselection: same item click or Esc → highlight removed, URL without selected
- [ ] Detail: loaded only when selectedId is present (enabled: !!id in useQuery)
- [ ] Prefetch: hover on item starts prefetch without blocking UI
- [ ] Cache separation: list and detail have different queryKeys
- [ ] Mobile Sheet: opens on item click < 1024px, closes with Esc/click outside
- [ ] Mobile Sheet: detail content loads AFTER opening (not preloaded)
- [ ] Sync: Sheet closed → selectedId removed (or maintained? decide per use case)
- [ ] List loading: 5-6 skeleton cards with pulse animation
- [ ] Detail loading: tabs structure skeleton (3 skeletons per section)
- [ ] Empty list: "No data" state with icon
- [ ] Empty detail: "Select an item" with left arrow icon
- [ ] List error: alert + retry, previous detail not lost
- [ ] Detail error: inline in panel, list item still highlighted, retry available
- [ ] Keyboard: Arrow Up/Down navigates list, Enter selects, Esc deselects
- [ ] Back/Forward: browser history navigates between selections (URL synced)
- [ ] Responsive: side-by-side ≥ 1024px, Sheet < 1024px, test browser resize
- [ ] Focus state: focus visible on list items (ring outline)

### States Verified
- [ ] Initial: list skeleton + "Select an item" on right
- [ ] List loaded: populated list, no item highlight, empty detail
- [ ] Selecting: item highlight, detail skeleton, URL updated
- [ ] Detail loaded: tabs with data, persistent item highlight
- [ ] Selection changed: old detail removed, new skeleton, new detail loaded
- [ ] Close detail: detail hidden, list visible, URL clean
- [ ] Error detail: error message + retry, item highlight not lost
- [ ] Error list: error message + retry, list not available
- [ ] Mobile: item click → Sheet opens, detail loaded in Sheet
- [ ] Mobile Sheet close: detail hidden, list visible, selectedId removed

### Data Flow
- [ ] URL param `selected` read on startup (loads detail if present)
- [ ] Browser back: URL changes, detail updates
- [ ] Browser forward: same logic
- [ ] Prefetch: hover calls prefetchQuery with correct queryKey
- [ ] Invalidation: mutation on order → list + detail invalidated
- [ ] StaleTime respected: no extra requests within window
- [ ] GC time: detail not requested for 5min → garbage collected
