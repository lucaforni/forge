# Pattern: Data Table with Filters

**Severity**: Core · **Stack**: shadcn/ui + React Query + Tailwind
**Depends on**: Pagination, Select, Badge, Input, Checkbox, DropdownMenu

---

## 1. When to Use

**Use this pattern when**:
- List of 10+ records with tabular structure
- The user needs to filter, sort, search records
- Data comes from server (server-side pagination)
- The user needs to select records and perform bulk actions
- Each row has contextual actions (edit, delete, view)

**Do NOT use this pattern when**:
- < 10 records → simple list (Cards or list)
- All data loaded in memory → client-side sorting/filtering (use `useMemo`)
- Display only (no interaction) → static Table
- Hierarchical data → Tree or nested accordion
- Social-style feed → Infinite Scroll

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Table | Tabular structure | default |
| TableHeader | Column header with sort | default |
| TableBody | Data rows | default |
| Input | Text search | default |
| Select | Selection filters | default |
| Badge | Row states/colors | variant: secondary/success/warning/destructive |
| Button | CTAs, actions | variant: default/ghost/outline; size: sm |
| Pagination | Page navigation | default |
| Checkbox | Row selection | default |
| DropdownMenu | Per-row actions | default |
| Skeleton | Loading state | default — shape: table row |

---

## 3. JSX Structure

```tsx
<div className="space-y-4">
  {/* FILTER BAR */}
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10"
      />
    </div>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
    {hasActiveFilters && (
      <Button variant="ghost" size="sm" onClick={clearFilters}>
        Clear filters
      </Button>
    )}
  </div>

  {/* TABLE */}
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
            Name {sortIcon('name')}
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => toggleSort('status')}>
            Status {sortIcon('status')}
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.items.map((item) => (
          <TableRow key={item.id}>
            <TableCell><Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell><Badge variant={statusVariant(item.status)}>{item.status}</Badge></TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  {/* BULK ACTIONS BAR (conditional) */}
  {selectedIds.size > 0 && (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
      <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
      <Button variant="destructive" size="sm" onClick={bulkDelete}>Delete selected</Button>
    </div>
  )}

  {/* PAGINATION */}
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} />
      </PaginationItem>
      {renderPageNumbers()}
      <PaginationItem>
        <PaginationNext onClick={() => setPage(p => p + 1)} />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</div>
```

---

## 4. State Machine

```yaml
Pattern: DataTable
Initial: loading

States:
  loading:
    description: "First load, no previous data"
    ui: "Skeleton table (5 rows with pulse animation)"
    transitions:
      on_success → populated
      on_error → error

  populated:
    description: "Data loaded and displayed"
    ui: "Table with rows + pagination"
    transitions:
      on_filter_change → refetching
      on_sort_change → refetching
      on_page_change → refetching
      on_refresh → refetching
      on_all_data_deleted → empty
      on_mutation_success → populated (same filters, fresh data)

  refetching:
    description: "Filter/sort/page change with previous data visible"
    ui: "Reduced opacity on table + small spinner top right"
    transitions:
      on_success → populated
      on_error → error (old data lost)

  empty:
    description: "No records in database (first visit)"
    ui: "Empty State (first-visit): icon + 'No data' + CTA 'Create new'"
    transitions:
      on_filter_applied → filtered_empty
      on_data_created → populated

  filtered_empty:
    description: "Active filters but no results"
    ui: "Empty State (filtered): 'No results for these filters' + 'Clear filters'"
    transitions:
      on_filters_cleared → empty (or populated if data exists without filters)
      on_filter_change → refetching

  error:
    description: "API error"
    ui: "Error Recovery inline: warning icon + message + 'Try again'"
    transitions:
      on_retry → refetching (if data existed) or loading (if first load)

  partial_error:
    description: "Some data loaded, some not (e.g. table OK, metadata KO)"
    ui: "Warning banner above table: 'Some data is unavailable' + retry"
    transitions:
      on_retry_success → populated
      on_retry_fail → partial_error (persists)
```

---

## 5. Data Flow

### 5.1 URL State (source of truth)

```
URL: /items?search=test&status=active&sort=name&order=asc&page=1

Parameters:
  search: string     — text search
  status: string     — status filter (or pipe-separated for multi)
  sort: string       — sort field
  order: asc|desc    — sort direction
  page: number       — current page (1-based)
  pageSize: number   — items per page (default: 20)
```

### 5.2 React Query

```tsx
// Query hook
export function useItemsQuery() {
  const searchParams = useSearchParams()
  const filters = {
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? 'all',
    sort: searchParams.get('sort') ?? 'createdAt',
    order: (searchParams.get('order') ?? 'desc') as 'asc' | 'desc',
    page: Number(searchParams.get('page') ?? '1'),
    pageSize: 20,
  }

  return useQuery({
    queryKey: ['items', filters],
    queryFn: () => api.getItems(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000, // 30s
  })
}

// Mutation hook
export function useDeleteItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => api.deleteItems(ids),
    // React Query onSuccess receives (data, variables) — variables is the ids array
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      toast.success(`${ids.length} items deleted`)
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    },
  })
}
```

### 5.3 API Response Shape

```tsx
interface PaginatedResponse<T> {
  items: T[]
  total: number         // total records (for pagination)
  page: number          // current page
  pageSize: number      // per page
  totalPages: number    // total pages
}
```

### 5.4 Cache Strategy

```
Query key: ['items', { search, status, sort, order, page }]
Stale time: 30s (data considered fresh)
GC time: 5min
keepPreviousData: true (smooth transition between pages)
Invalidate on: create, update, delete mutations
```

---

## 6. TypeScript Types

```tsx
// Base types
interface DataItem {
  id: string
  [key: string]: unknown
}

interface ColumnDef<T> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  cell: (item: T) => React.ReactNode
}

// Component props
interface DataTableProps<T extends DataItem> {
  columns: ColumnDef<T>[]
  query: UseQueryResult<PaginatedResponse<T>>
  filters: FilterConfig[]
  searchable?: boolean
  selectable?: boolean
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
  emptyState?: {
    firstVisit: EmptyStateConfig
    filtered: EmptyStateConfig
  }
}

interface FilterConfig {
  id: string
  label: string
  type: 'search' | 'select' | 'date-range'
  options?: { label: string; value: string }[]
  paramKey: string
}
```

---

## 7. Accessibility

### ARIA Roles
- Table: `role="grid"` (interactive) or default `table` (read-only)
- Checkbox header: `aria-label="Select all rows"`
- Checkbox row: `aria-label="Select row {item.name}"`
- Pagination: nav with `aria-label="Page navigation"`
- Sort header: `aria-sort="ascending"` / `descending` / `none`

### Keyboard Navigation
- Tab: navigates filters → table → pagination
- Arrow Up/Down: navigates rows when table has focus
- Space: toggle current row selection
- Enter: open row actions or navigate to detail
- Left/right arrows: navigate pages (when focus on pagination)

### Screen Reader Flow
```
1. "Table: {name}. {N} columns, {M} rows"
2. "Sorted by {column} {direction}"
3. "Page {N} of {M}"
4. "Row {N} of {M}: {contents}"
5. "{N} items selected" (when selection changes)
```

### Contrast
- Status badges: verify color contrast on background (success/warning/destructive)
- Sort indicator: not only color (add arrow icon)
- Active filter chips: contrasting background + X icon

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| ≥ 1024px | Full table, inline filters, full pagination |
| 768-1023px | Horizontally scrollable table, filters in 2 rows |
| < 768px | Scrollable table, collapsed filters with "Filters (N)" button, compact pagination |

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Sorting: header click cycles asc → desc → none. Sort icon visible. `aria-sort` updated
- [ ] Pagination: page and pageSize in URL. Back button preserves page. Prev/next buttons disabled at edges
- [ ] Search: debounce 300ms. URL updates. Field has search icon + clear button
- [ ] Filters: URL updates on each change. Multi-filter supported. "Clear filters" resets ALL filters
- [ ] Selection: header checkbox toggles all/none. Selection persists between pages? (decide: per-tab or not)
- [ ] Bulk actions: bar visible only with selection. Count "N selected". Confirmation required for destructive actions
- [ ] Row actions: DropdownMenu with at least 2 actions. Trigger with `MoreHorizontal` icon and `aria-label`
- [ ] Empty state: "No data" (first visit) vs "No results" (filtered). Visible trigger to create new
- [ ] Loading: skeleton matches table structure (5 rows, same columns). Smooth transition to real data
- [ ] Error: inline within table, not full-page. Retry preserves current filters

### States Verified
- [ ] Loading initial: skeleton shows table structure
- [ ] Populated: data with correct sorting, pagination working
- [ ] Empty (first visit): icon + "No data" + CTA "Create new"
- [ ] Empty (filtered): "No results" + "Clear filters"
- [ ] Error: message + retry + does not lose filters
- [ ] Refetching: previous data visible, spinner top right
- [ ] Refetch with error: error shown but previous data still visible

### Data Flow
- [ ] URL params updated on each interaction (search, sort, filter, page)
- [ ] Browser Back/Forward works (same URL = same table state)
- [ ] React Query keys include ALL filters (correct cache per combination)
- [ ] `keepPreviousData` enabled (smooth transition)
- [ ] Mutations invalidate queries (create, update, delete)
- [ ] StaleTime > 0 (no refetch on every mount)
