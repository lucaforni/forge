# Pattern: Loading Skeleton

**Severity**: Dashboard (cross-cutting) · **Stack**: shadcn/ui + Tailwind
**Depends on**: Skeleton
**Applies to**: ALL patterns that load asynchronous data

---

## 1. When to Use

**Use this pattern when**:
- Content > 25% of viewport during asynchronous loading
- Tabular/grid layout that will appear after fetch
- Dashboard / detail pages with multiple zones to populate
- Any area showing data after an API call (fetch, mutation)

**Do NOT use**:
- Short actions (<500ms) → spinner (e.g. Button with `loading` state)
- Error state → Error Recovery pattern
- Empty state after loading → Empty State pattern
- SPA page transitions → spinner or page transition

**Golden rule**: If content occupies > 25% of the viewport, use skeleton. If it's micro (badge, icon, single label), use spinner.

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Skeleton | Placeholder for every content shape | default — shape via className (h-4 w-full, h-10 w-20, etc.) |

No icons needed. Skeleton is purely CSS (`animate-pulse` + background).

---

## 3. JSX Structure

### 3.1 SkeletonTable

```tsx
<div className="space-y-4" aria-busy="true" aria-label="Loading">
  {/* HEADER ROW */}
  <div className="flex items-center gap-4 py-3">
    <Skeleton className="h-4 w-4" aria-hidden="true" /> {/* checkbox */}
    <Skeleton className="h-4 w-24" aria-hidden="true" />
    <Skeleton className="h-4 w-32" aria-hidden="true" />
    <Skeleton className="h-4 w-20" aria-hidden="true" />
    <Skeleton className="h-4 w-28" aria-hidden="true" />
  </div>
  {/* BODY ROWS × 5 */}
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="flex items-center gap-4 py-3">
      <Skeleton className="h-4 w-4" aria-hidden="true" />
      <Skeleton className="h-4 w-24" aria-hidden="true" />
      <Skeleton className="h-4 w-32" aria-hidden="true" />
      <Skeleton className="h-4 w-20" aria-hidden="true" />
      <Skeleton className="h-4 w-28" aria-hidden="true" />
    </div>
  ))}
</div>
```

### 3.2 SkeletonCardGrid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading">
  {Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="rounded-lg border p-4 space-y-3">
      <Skeleton className="w-full h-40 rounded-md" aria-hidden="true" />
      <Skeleton className="h-4 w-3/4" aria-hidden="true" />
      <Skeleton className="h-4 w-1/2" aria-hidden="true" />
    </div>
  ))}
</div>
```

### 3.3 SkeletonForm

```tsx
<div className="space-y-6 max-w-lg" aria-busy="true" aria-label="Loading">
  {Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="space-y-2">
      <Skeleton className="h-4 w-20" aria-hidden="true" /> {/* label */}
      <Skeleton className="h-10 w-full rounded-md" aria-hidden="true" /> {/* input */}
    </div>
  ))}
  {/* BUTTON */}
  <Skeleton className="h-10 w-32 rounded-md" aria-hidden="true" />
</div>
```

### 3.4 SkeletonDashboard

```tsx
<div className="space-y-6" aria-busy="true" aria-label="Loading">
  {/* KPI ROW */}
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-4 w-16" aria-hidden="true" />
        <Skeleton className="h-8 w-24" aria-hidden="true" />
        <Skeleton className="h-4 w-12" aria-hidden="true" />
      </div>
    ))}
  </div>

  {/* CHARTS × 2 */}
  <div className="grid gap-4 lg:grid-cols-2">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="rounded-lg border p-6">
        <Skeleton className="h-5 w-32 mb-4" aria-hidden="true" />
        <Skeleton className="w-full h-[350px] rounded-md" aria-hidden="true" />
      </div>
    ))}
  </div>

  {/* TABLE SKELETON */}
  <div className="rounded-lg border p-4">
    <Skeleton className="h-5 w-40 mb-4" aria-hidden="true" />
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-2">
        <Skeleton className="h-4 w-4" aria-hidden="true" />
        <Skeleton className="h-4 w-24" aria-hidden="true" />
        <Skeleton className="h-4 w-32" aria-hidden="true" />
        <Skeleton className="h-4 w-20" aria-hidden="true" />
      </div>
    ))}
  </div>
</div>
```

### 3.5 SkeletonDetail

```tsx
<div className="flex gap-6" aria-busy="true" aria-label="Loading">
  {/* SIDEBAR — narrow */}
  <aside className="w-[280px] flex-shrink-0 space-y-4">
    <Skeleton className="w-full h-32 rounded-lg" aria-hidden="true" />
    <Skeleton className="h-4 w-3/4" aria-hidden="true" />
    <Skeleton className="h-4 w-1/2" aria-hidden="true" />
    <Skeleton className="h-4 w-2/3" aria-hidden="true" />
  </aside>

  {/* CONTENT AREA — wide */}
  <div className="flex-1 space-y-4">
    <Skeleton className="w-full h-64 rounded-lg" aria-hidden="true" />
    <Skeleton className="h-4 w-full" aria-hidden="true" />
    <Skeleton className="h-4 w-full" aria-hidden="true" />
    <Skeleton className="h-4 w-3/4" aria-hidden="true" />
    <Skeleton className="h-4 w-5/6" aria-hidden="true" />
    <Skeleton className="h-4 w-2/3" aria-hidden="true" />
  </div>
</div>
```

---

## 4. State Machine

```yaml
Pattern: LoadingSkeleton
Initial: loading

States:
  loading:
    description: "Data loading — no previous content"
    ui: "Skeleton matching the final content structure"
    transitions:
      on_success → done (or populated in host pattern)
      on_error → error (Error Recovery in host pattern)

  done:
    description: "Loading complete"
    ui: "Real content replaces skeleton"
    transitions: ~
```

No complex transitions. The skeleton is purely presentational and is removed when the host pattern receives data.

---

## 5. Data Flow

No data. Purely presentational. The skeleton does not fetch, has no internal state, accepts no data.

The only "logic": show/hide based on the loading state of the host pattern.

```tsx
// Host pattern: conditional rendering
{isLoading ? <SkeletonTable rows={5} columns={5} /> : <DataTable data={data} />}
```

---

## 6. TypeScript Types

```tsx
export type SkeletonVariant = 'table' | 'card-grid' | 'form' | 'dashboard' | 'detail'

export interface SkeletonConfig {
  variant: SkeletonVariant
  rows?: number       // table: number of rows, card-grid: number of cards
  columns?: number    // table: number of visible columns
  height?: number     // chart: height in px (default: 350)
  cardCount?: number  // card-grid: number of cards (default: 6)
  fieldCount?: number // form: number of fields (default: 4)
  className?: string
}

export interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export interface SkeletonCardGridProps {
  cardCount?: number
  columns?: { sm?: number; md?: number; lg?: number }
  className?: string
}

export interface SkeletonFormProps {
  fieldCount?: number
  className?: string
}

export interface SkeletonDashboardProps {
  kpiCount?: number
  chartCount?: number
  chartHeight?: number
  tableRows?: number
  className?: string
}

export interface SkeletonDetailProps {
  className?: string
}
```

---

## 7. Accessibility

### ARIA
- Container: `aria-busy="true"` (tells screen reader content is loading)
- Container: `aria-label="Loading"` (announces status)
- Each skeleton: `aria-hidden="true"` (decorative, not interactive — should not be read by SR)

### Screen Reader Flow
```
"Loading. Please wait."
→ (when loading ends) "[Real content announced by host pattern]"
```

### Focus Management
- Skeleton does not receive focus (non-interactive elements, `aria-hidden="true"`)
- When loading ends, focus does not change automatically (user maintains position)
- If skeleton is in a navigation context (e.g. detail), after loading focus on `<h1>` of content

### Note
- Do NOT use `aria-live="polite"` on skeleton — loading may be long and cause repeated announcements
- If skeleton has `animate-pulse`, ensure movement does not exceed 3 flashes/second (WCAG 2.1 — 2.3.1)
  - Tailwind's `animate-pulse` is compliant (gradual opacity transition, not flashing)

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| ≥ 1024px | Full layout: full table, 3-4 column grid, extended dashboard, visible sidebar |
| 768-1023px | Reduced columns: card-grid 2 columns, KPI 2 columns, hidden sidebar (vertical skeleton) |
| < 768px | Single column: card-grid 1 column, KPI 1 column, detail page vertical stack (sidebar above content) |

**Responsive rules per variant**:
- `SkeletonTable`: on mobile, hide last 2 columns (show only essential columns)
- `SkeletonCardGrid`: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- `SkeletonDashboard`: KPI `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, charts stack on mobile
- `SkeletonDetail`: sidebar + content `flex-col lg:flex-row`
- `SkeletonForm`: full-width on mobile (`max-w-none`)

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Skeleton matches the final content layout (same structure, not generic block)
- [ ] Skeleton has animation (`animate-pulse`) — not static
- [ ] No layout shift when skeleton is replaced by real content (same dimensions)
- [ ] Different variants for each content type (table, card, form, dashboard, detail)
- [ ] Skeleton does not show spinner or "Loading..." text — only visual placeholders
- [ ] Smooth transition: skeleton → content (no flash, no momentary white space)
- [ ] On mobile, skeleton shows reduced structure (fewer columns, single column grid)
- [ ] Skeleton does not interfere with other states (empty, error) — disappears before they appear
- [ ] Container has fixed dimensions/minimum height to avoid layout shift
- [ ] Skeleton uses `bg-muted` / `bg-muted-foreground/20` tokens for placeholder color (not hardcoded)
- [ ] `animate-pulse` does not exceed 3 flashes/second (WCAG 2.3.1 compliant)
- [ ] Skeleton for images has correct aspect ratio (e.g. `aspect-video`, `aspect-square`)

### States Verified
- [ ] Loading (first time): skeleton shows complete structure
- [ ] Refetching: skeleton does not appear — previous data remains visible (if host pattern supports)
- [ ] Loading → Populated: transition without layout shift
- [ ] Loading → Error: skeleton disappears, Error Recovery appears

### Accessibility Pattern-Specific
- [ ] Container has `aria-busy="true"` during loading
- [ ] Container has `aria-label="Loading"`
- [ ] Each `<Skeleton>` has `aria-hidden="true"` (decorative)
- [ ] Focus not trapped in skeleton (non-focusable elements)
- [ ] Animation does not cause dizziness/seizures (WCAG 2.3.1 — prefers `prefers-reduced-motion`)

### Data Flow
- [ ] No internal data fetching — purely presentational
- [ ] Skeleton conditioned on `isLoading` state of host pattern
- [ ] Skeleton dimensions calculated on expected content (not random)
