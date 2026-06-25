# Pattern: Drawer / Sheet Panel

**Severity**: Interaction · **Stack**: shadcn/ui Sheet + React Query + Tailwind
**Depends on**: Sheet, ScrollArea, Tabs, Skeleton, Button, Separator, Form, Alert

---

## 1. When to Use

**Use this pattern when**:
- The user needs to see a record's detail WITHOUT losing the context of the underlying list
- Quick inline editing of a record (e.g. status change, individual fields)
- Configuration / settings / options panels
- Mobile navigation (replaces full-width pages with slide-in panel)

**Do NOT use this pattern when**:
- Destructive confirmations or critical actions (use AlertDialog / Modal)
- Complex forms with 10+ fields (use Form + dedicated page)
- Primary app navigation (use sidebar or native layout)
- Side-by-side comparison of multiple items (use Master-Detail)

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Sheet | Side panel container | default |
| SheetTrigger | Element that opens the Sheet | asChild |
| SheetContent | Sheet body with side variant | side="right" / side="bottom" |
| SheetHeader | Header with padding | default |
| SheetTitle | Panel title | default |
| SheetDescription | Optional description | default |
| SheetClose | Close button (X) | default |
| ScrollArea | Scrollable content | default |
| Tabs | Detail sections | default |
| TabsList, TabsTrigger, TabsContent | Tabs structure | default |
| Skeleton | Loading state | default |
| Badge | Record status | variant: secondary/success/warning/destructive |
| Button | Actions (close, retry, save) | variant: default/ghost/outline |
| Separator | Section separation | default |
| Form | Inline editing | default |
| Alert | Loading error | variant: destructive |

---

## 3. JSX Structure

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  {/* Trigger (optional — can be controlled externally) */}
  <SheetTrigger asChild>
    <Button>Open detail</Button>
  </SheetTrigger>

  <SheetContent
    side={side} // "right" on desktop, "bottom" on mobile
    className={cn(
      "p-0",
      side === "right" && "w-full sm:w-[500px]",
      side === "bottom" && "h-[85vh] rounded-t-xl",
    )}
  >
    <SheetHeader className="px-6 pt-6 pb-0">
      <div className="flex items-center justify-between">
        <SheetTitle>{title}</SheetTitle>
        <SheetClose />
      </div>
      {description && <SheetDescription>{description}</SheetDescription>}
    </SheetHeader>

    <ScrollArea className="flex-1 px-6 py-4">
      {/* Main content */}
      {children}
    </ScrollArea>

    {footer && (
      <div className="border-t px-6 py-4">
        {footer}
      </div>
    )}
  </SheetContent>
</Sheet>
```

---

## 4. State Machine

```yaml
Pattern: DrawerSheetPanel
Initial: closed

States:
  closed:
    description: "Sheet closed, not rendered"
    ui: "Trigger visible (if present). Underlying list content interactable."
    transitions:
      on_trigger_click → opening

  opening:
    description: "Slide-in animation in progress"
    ui: "Sheet overlay + panel transitioning (300ms). Background scroll blocked."
    transitions:
      on_animation_end → open

  open:
    description: "Sheet open, content to load"
    ui: "Panel visible. Loading skeleton."
    transitions:
      on_content_load_start → loading-content
      on_close → closing

  loading-content:
    description: "Data loading in progress"
    ui: "Panel with skeleton (3-4 block structure). Overlay maintained."
    transitions:
      on_content_loaded → loaded
      on_content_error → error
      on_close → closing

  loaded:
    description: "Detail loaded and displayed"
    ui: "Tabs with data. Scroll enabled. Actions available."
    transitions:
      on_tab_change → loaded (tab change, no reload)
      on_close → closing
      on_edit_start → editing (if inline form)

  editing:
    description: "Inline editing in progress"
    ui: "Editable fields. Save/Cancel buttons in footer."
    transitions:
      on_save → submitting
      on_cancel → loaded (reset data)

  submitting:
    description: "Saving in progress"
    ui: "Fields disabled. Save button with spinner. 'Saving...'"
    transitions:
      on_success → loaded (data updated, success toast)
      on_submit_error → editing (error mapped to fields)

  error:
    description: "Content loading error"
    ui: "Error alert + 'Try again'. Close button available."
    transitions:
      on_retry → loading-content
      on_close → closing

  closing:
    description: "Slide-out animation in progress"
    ui: "Panel transitioning out (300ms)."
    transitions:
      on_animation_end → closed (Sheet unmounted, focus returns to trigger)
```

---

## 5. Data Flow

### 5.1 URL State

```
URL: /orders?detail=ord_123

Parameters:
  detail: string — ID of the open record (source of truth)
```

Open state is controlled by the parent via URL param `?detail=id`.
`useSearchParams` synchronizes open/close.
Browser Back/Forward navigates between details.
Absence of `detail` param = closed state.

### 5.2 React Query (separate from list)

```tsx
// Detail hook (active only with detailId — separate cache from list)
function useDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ['detail', id],
    queryFn: () => api.getDetail(id!),
    enabled: !!id,        // DON'T load until Sheet is open
    staleTime: 30_000,
  })
}

// Prefetch on trigger hover
function usePrefetchDetail() {
  const queryClient = useQueryClient()
  return useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['detail', id],
      queryFn: () => api.getDetail(id),
      staleTime: 30_000,
    })
  }, [queryClient])
}
```

### 5.3 Cache Strategy

```
Detail key: ['detail', id]
Cache completely separate from parent list.
Stale time: 30s (reload if you return after closing/reopening)
GC time: 5min
Prefetch: hover on trigger starts prefetch (optional)
Invalidation: mutation on record → invalidates ['detail', id] AND parent list query
```

### 5.4 API Response Shape

```tsx
interface ApiResponse<T> {
  data: T
  error?: string
}
```

---

## 6. TypeScript Types

```tsx
// ── Detail Sheet (read-only) ──

interface DetailSheetTab {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  content: React.ReactNode | ((data: DetailData) => React.ReactNode)
}

interface DetailSheetProps {
  trigger?: React.ReactNode
  title: string
  description?: string
  queryKey: string[]
  queryFn: (id: string) => Promise<DetailData>
  tabs: DetailSheetTab[]
  onClose?: () => void
}

// ── Form Sheet (inline editing) ──

interface FormSheetProps<TData, TValues> {
  trigger?: React.ReactNode
  title: string
  description?: string
  initialData?: TData
  formComponent: React.ComponentType<{
    initialData?: TData
    onSuccess?: () => void
    onCancel?: () => void
  }>
  onClose?: () => void
}

// ── Detail data ──

interface DetailData {
  id: string
  title: string
  status: string
  sections: Record<string, unknown>
  metadata: Record<string, string>
  timeline: TimelineEvent[]
}

interface TimelineEvent {
  id: string
  type: string
  description: string
  timestamp: string
  actor: string
}
```

---

## 7. Accessibility

### ARIA
- Sheet: `role="dialog"` with `aria-modal="true"` (handled by shadcn/Sheet)
- SheetContent: `aria-label` describes the panel content
- Trigger: `aria-haspopup="dialog"` + `aria-expanded={open}` (handled by shadcn/SheetTrigger)
- Tabs: `role="tablist"`, tab `role="tab"` with `aria-selected`, panels `role="tabpanel"`
- Loading: `aria-busy="true"` on ScrollArea container

### Keyboard Navigation
| Key | Action |
|-------|--------|
| Escape | Close Sheet (return to closed state) |
| Tab | Move focus between elements within Sheet |
| Shift+Tab | Move focus backward |
| Enter / Space | Activate trigger (if focus on trigger) |

### Screen Reader Flow
```
1. "Detail panel {title}. Press Escape to close."
2. "Loading detail..." (skeleton)
3. "Detail {title}. {N} sections: Details, Timeline, Actions"
```

### Focus Management
- Focus trap within Sheet (handled by shadcn)
- When Sheet opens: focus on first focusable element (usually close button or title)
- When Sheet closes: focus RETURNS to the trigger element that opened it
- Prevent background scroll: `pointer-events-none` on body (handled by shadcn)
- On mobile (bottom sheet): same focus rules + native swipe-to-close handling

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| ≥ 768px | Sheet from right, 500px width, full height |
| < 768px | Sheet from bottom, 85vh height, top corners rounded (`rounded-t-xl`) |
| < 640px | Bottom sheet full-screen (100vh) optional |

```tsx
// Side determination via custom hook
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

// Conditional classes
className={cn(
  "p-0",
  side === "right" && "w-full sm:w-[500px]",
  side === "bottom" && "h-[85vh] rounded-t-xl",
)}
```

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Sheet open: background list not scrollable (overflow hidden on body)
- [ ] Sheet closed: list scroll restored
- [ ] Animation: smooth slide-in/slide-out (300ms, standard shadcn easing)
- [ ] Escape key: Sheet closes with animation, focus returns to trigger
- [ ] Click outside (overlay): Sheet closes (default shadcn behavior)
- [ ] Focus trap: Tab cycling stays within Sheet
- [ ] Close button (X): visible and functional in header
- [ ] Trigger hover: data prefetch started (optional, depending on implementation)
- [ ] Loading: skeleton visible during fetch (not white flash)
- [ ] Error: message + Retry button, can close the Sheet
- [ ] Tabs: tab change without reloading data (data already in cache)
- [ ] Editing: editable field, Save/Cancel buttons in footer
- [ ] Editing: submit disables fields and shows spinner
- [ ] Editing: submit error mapped to specific field or generic alert
- [ ] Cache: detail NOT loaded if Sheet closed (enabled: !!id)
- [ ] Cache: staleTime respected (30s), no extra requests
- [ ] Mobile: Sheet from bottom with rounded top corners + drag indicator (if swipe-to-close)
- [ ] Mobile: 85vh height, scrollable content (ScrollArea)
- [ ] Desktop: Sheet from right with fixed 500px width
- [ ] URL sync: `?detail=id` updated on open/close (replace, not push)
- [ ] Back/Forward: browser history navigates between opens/closes
- [ ] Focus: on close, focus returns to the trigger that opened the Sheet
- [ ] Screen reader: "Detail panel {title}. Press Escape to close."
- [ ] Same Sheet reopened: fresh data if staleTime expired

### States Verified
- [ ] Closed: Sheet not rendered, trigger visible
- [ ] Opening: slide-in + overlay, background scroll blocked
- [ ] Open / Loading: structured skeleton (header + 3-4 rows)
- [ ] Loaded: data visible in tabs, scroll working
- [ ] Editing: editable fields, Save/Cancel present
- [ ] Submitting: fields disabled, spinner on Save
- [ ] Error: alert + retry, close available
- [ ] Closing: slide-out, focus returned to trigger
- [ ] Mobile: bottom sheet 85vh with rounded top
- [ ] Desktop: right sheet 500px

### Data Flow
- [ ] URL param `detail` read on startup (if present, opens sheet and loads data)
- [ ] URL param updated on open/close with `replace` (not push)
- [ ] React Query: enabled: !!detailId (no fetch when Sheet closed)
- [ ] Prefetch: hover on trigger calls prefetchQuery
- [ ] Invalidation: mutation → `invalidateQueries(['detail', id])` + parent list
- [ ] StaleTime: 30s respected (no extra requests within window)
- [ ] GC time: 5min, detail not requested → garbage collected
- [ ] Cache separation: detail does NOT share data with parent list
