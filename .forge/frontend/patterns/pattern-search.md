# Pattern: Search with Autocomplete + Filters

**Severity**: Core · **Stack**: React + shadcn/ui + React Query + Tailwind
**Depends on**: Command, Input, Popover, Badge, Card, Button, Select, Skeleton, Checkbox

---

## 1. When to Use

**Use this pattern when**:
- The user needs to search content with real-time suggestions
- Results need to be filtered by categories, attributes, or tags
- Data comes from the server with full-text search and filters
- The user needs to explore results in card/grid format (catalog)
- Recent search history should be persisted

**Do NOT use this pattern when**:
- Tabular structure with sorting → Data Table pattern
- Local-only search on in-memory array → `useMemo` + client-side filter
- Fewer than 10 total results → Static list or Select with search
- No suggestions/autocomplete needed → simple Input + search button
- Infinite feed without structured search → Infinite Scroll

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Command | Dropdown autocomplete suggestions | default — with `shouldFilter={false}` for server-side suggestions |
| CommandInput | Search input inside Command | default |
| CommandEmpty | No suggestions found | default |
| CommandGroup | Suggestion groups | default |
| CommandItem | Single navigable suggestion | default |
| Input | Main search field (or use CommandInput) | default — with Search icon |
| Popover | Wrapper for suggestions dropdown | default — `open` controlled |
| Badge | Active filters as removable chips | variant: secondary/outline |
| Card | Search results in grid | default |
| CardHeader | Result card header | default |
| CardContent | Result card body | default |
| CardFooter | Card footer (e.g. price, CTA) | default |
| Button | CTA, clear search, clear filters | variant: default/ghost/outline; size: sm |
| Select | Single selection filters | default |
| Checkbox | Multi-select list filters | default |
| Skeleton | Loading state for result grid | default — shape: card |
| ScrollArea | Scrollable area for suggestions | default |

---

## 3. JSX Structure

```tsx
<div className="space-y-6">
  {/* ── SEARCH INPUT + AUTOCOMPLETE ── */}
  <div className="relative">
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products, categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10"
          role="combobox"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-controls="search-suggestions"
          aria-activedescendant={activeSuggestionId}
          aria-autocomplete="list"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Mobile: toggle filters */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={() => setShowMobileFilters(true)}
        aria-label="Filters"
      >
        <Filter className="h-4 w-4" />
      </Button>
    </div>

    {/* SUGGESTIONS DROPDOWN */}
    {showSuggestions && query.length >= 2 && (
      <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverContent
          id="search-suggestions"
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList>
              <CommandEmpty>No suggestions</CommandEmpty>
              <CommandGroup heading="Suggestions">
                {suggestions.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.label}
                    onSelect={() => handleSelectSuggestion(s)}
                    onMouseEnter={() => setActiveIndex(suggestions.indexOf(s))}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {s.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {recentSearches.length > 0 && !query && (
                <CommandGroup heading="Recent searches">
                  {recentSearches.map((r, i) => (
                    <CommandItem
                      key={i}
                      value={r}
                      onSelect={() => handleSelectRecent(r)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {r}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )}
  </div>

  {/* ── FILTER CHIPS ── */}
  {hasActiveFilters && (
    <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Active filters">
      {activeFilterChips.map((chip) => (
        <Badge key={chip.id} variant="outline" className="gap-1 pr-1">
          {chip.label}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1"
            onClick={() => removeFilter(chip.id)}
            aria-label={`Remove filter ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
        Clear all
      </Button>
    </div>
  )}

  {/* ── BODY: FILTER SIDEBAR + RESULTS ── */}
  <div className="flex gap-6">
    {/* FILTER SIDEBAR (desktop) */}
    <aside className="hidden lg:block w-64 shrink-0 space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Category</h3>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3">Price</h3>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label key={range.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedPriceRanges.includes(range.value)}
                onCheckedChange={() => togglePriceRange(range.value)}
              />
              {range.label}
            </label>
          ))}
        </div>
      </div>
    </aside>

    {/* MOBILE FILTER SHEET (omitted for brevity — use Sheet component) */}

    {/* RESULTS AREA */}
    <div className="flex-1 min-w-0">
      {/* Results count + sort */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {resultsCount > 0
            ? `${resultsCount} ${resultsCount === 1 ? 'result' : 'results'}`
            : 'No results'}
        </p>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[180px]" aria-label="Sort results">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* RESULTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="aspect-video bg-muted flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <h3 className="font-semibold truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {item.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold">{formatPrice(item.price)}</span>
                <Badge variant="secondary">{item.category}</Badge>
              </div>
            </CardContent>
            <CardFooter className="px-4 pb-4 pt-0">
              <Button className="w-full" size="sm" onClick={() => onViewDetails(item)}>
                Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* PAGINATION / LOAD MORE */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center mt-8">
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
      )}
    </div>
  </div>
</div>
```

---

## 4. State Machine

```yaml
Pattern: Search
Initial: idle

States:
  idle:
    description: "Initial state, empty query"
    ui: "Empty input with placeholder. Suggestions dropdown closed. Shows recent searches if present."
    transitions:
      on_type → typing
      on_focus → idle (shows recent if available)

  typing:
    description: "User typing, debounce in progress"
    ui: "Text in input visible. No dropdown. No API request."
    transitions:
      on_debounce_complete (query.length >= 2) → suggestions
      on_debounce_complete (query.length < 2) → idle
      on_clear → empty-query

  suggestions:
    description: "Suggestions dropdown visible with matches"
    ui: "Popover open with Command. Navigable suggestions list with arrow keys."
    transitions:
      on_select_suggestion → selecting
      on_type → typing (new character, closes suggestions)
      on_escape → idle (close dropdown)
      on_blur → idle (if focus exits)

  selecting:
    description: "User selected a suggestion"
    ui: "Dropdown closes. Query updates. Brief transition (50ms) to searching."
    transitions:
      on_query_set → searching

  searching:
    description: "API request in progress for results"
    ui: "Skeleton cards (6 cards with pulse). Input maintains text. Dropdown closed."
    transitions:
      on_success → results
      on_error → error
      on_type → typing (new search interrupts)

  results:
    description: "Results successfully displayed"
    ui: "Card grid. Results count. Active filters visible as chips. Pagination."
    transitions:
      on_type → typing
      on_filter_change → searching
      on_sort_change → searching
      on_page_change → searching
      on_clear → empty-query
      on_error (refetch failed with previous data) → results (error banner)

  no-results:
    description: "Query active but zero results"
    ui: "Empty state: 'No results for {query}'. Suggestions: 'Try {alternative}' or 'Clear filters'."
    transitions:
      on_type → typing
      on_filter_change → searching
      on_clear → empty-query

  filtered-no-results:
    description: "Active filters + query produce zero results"
    ui: "Empty state: 'No results for these filters'. Prominent 'Clear filters' button."
    transitions:
      on_filters_cleared → results (or no-results if only query)
      on_filter_change → searching
      on_type → typing

  error:
    description: "API error during search"
    ui: "Error banner: 'Could not load results'. 'Try again' button. Input remains editable."
    transitions:
      on_retry → searching
      on_type → typing (try again with new query)
      on_filter_change → searching

  empty-query:
    description: "Query cleared by user, input empty"
    ui: "Results hidden. Shows recent searches (from localStorage) or 'Start typing to search' placeholder."
    transitions:
      on_type → typing
```

---

## 5. Data Flow

### 5.1 URL State (source of truth)

```
URL: /catalog?q=shoes&category=shoes&price=50-100&sort=price-asc&page=1

Parameters:
  q: string        — search query
  category: string — category filter
  price: string    — price range (e.g. "50-100" or "50+" or "*-50")
  sort: string     — sort order
  page: number     — current page (1-based)
```

### 5.2 React Query — Suggestions (separate from results)

```tsx
// Suggestions hook (separate cache, short stale time)
export function useSuggestions(query: string) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => api.getSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 60_000, // 1 min — suggestions change rarely
    gcTime: 5 * 60_000,
  })
}

// Results hook (with filters)
export function useSearchResults() {
  const searchParams = useSearchParams()
  const filters = {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? 'all',
    price: searchParams.get('price') ?? '',
    sort: searchParams.get('sort') ?? 'relevance',
    page: Number(searchParams.get('page') ?? '1'),
    pageSize: 20,
  }

  return useQuery({
    queryKey: ['search-results', filters],
    queryFn: () => api.search(filters),
    enabled: filters.q.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
```

### 5.3 API Response Shape

```tsx
interface SearchResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  suggestions?: string[]  // alternative search terms for "no results"
}

interface Suggestion {
  id: string
  label: string
  type: 'product' | 'category' | 'recent'
}
```

### 5.4 Cache Strategy

```
Suggestions:
  Key: ['search-suggestions', query]
  staleTime: 60s (suggestions change rarely)
  gcTime: 5min

Results:
  Key: ['search-results', { q, category, price, sort, page }]
  staleTime: 30s
  gcTime: 5min
  keepPreviousData: true (smooth transition between pages/filters)

Recent Searches (localStorage):
  Key: 'recent-searches'
  Max items: 10
  Format: string[]
  Update: every time the user performs a search (submit or select suggestion)
```

### 5.5 Debounce

```tsx
import { useCallback, useRef, useState } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Usage:
const [query, setQuery] = useState('')
const debouncedQuery = useDebounce(query, 300)
```

---

## 6. TypeScript Types

```tsx
// ── Search Result ──
interface SearchResult {
  id: string
  name: string
  description: string
  image?: string
  price: number
  category: string
  tags: string[]
}

// ── Filter ──
interface FilterOption {
  id: string
  label: string
  type: 'select' | 'checkbox' | 'range' | 'toggle'
  options?: { label: string; value: string }[]
  paramKey: string
  defaultValue?: string | string[]
}

// ── Suggestion ──
interface SuggestionItem {
  id: string
  label: string
  type: 'product' | 'category' | 'query'
  href?: string
}

// ── Props ──
interface SearchCatalogProps {
  title?: string
  basePath?: string
  filters?: FilterOption[]
  onItemClick?: (item: SearchResult) => void
  emptyState?: {
    noQuery: EmptyStateConfig   // no query entered
    noResults: EmptyStateConfig // query with no results
    filtered: EmptyStateConfig  // filters + no results
  }
}

interface EmptyStateConfig {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

// ── Paginated Response ──
interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  spellingSuggestion?: string  // "Did you mean: shoes"
}

// ── Filter Chip (internal state) ──
interface ActiveFilterChip {
  id: string
  label: string
  onRemove: () => void
}
```

---

## 7. Accessibility

### ARIA — Combobox Pattern

- Input: `role="combobox"`, `aria-expanded="true|false"`, `aria-controls="id-suggestions"`, `aria-activedescendant="id-option-{n}"`, `aria-autocomplete="list"`
- Dropdown: `role="listbox"`, `id="id-suggestions"`
- Options: `role="option"`, `id="id-option-{n}"`, `aria-selected="true|false"`
- Auto suggestions: must be announced by screen reader (live region or count)

### Live Region

- Results count: `<p role="status" aria-live="polite">` — announces "{N} results found"
- Loading state: `aria-busy="true"` on results container
- Error state: alert role or `aria-live="assertive"` for error message
- "No results": announced via live region when activated

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Down | Navigate next suggestion in list |
| Arrow Up | Navigate previous suggestion |
| Enter | Select active suggestion / execute search |
| Escape | Close suggestions dropdown / remove filter focus |
| Tab | Exit search field (close dropdown) |
| Arrow Down (from empty input) | Open recent searches list |

### Contrast & Feedback

- Active filter badge: X icon with `aria-label="Remove filter {name}"`
- Input clear button: `aria-label="Clear search text"`
- Skeleton: `aria-hidden="true"` to not confuse screen reader

### Screen Reader Flow

```
1. "Search: text field, autocomplete, suggestions list"
2. "{N} suggestions available" (when dropdown opens)
3. "{label}, suggestion {n} of {m}" (arrow navigation)
4. "{N} results found" (after search)
5. "Active filter: {label}. Press X to remove"
```

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| ≥ 1024px | Search input full-width (max-w-xl). Filter sidebar visible on left (w-64). Results grid 3 columns. |
| 768-1023px | Search input full-width. Filter sidebar hidden — replaced by filter bar above results or Sheet toggle. Results grid 2 columns. |
| < 768px | Search input full-width with filter icon on right. Filters in closable Sheet. Results grid 1 column. Hidden filter tab: Badge chips above results show only "Filters (N)" count. |

```tsx
// Filter visibility
<aside className="hidden lg:block w-64 shrink-0 space-y-6">
  {/* Desktop filter sidebar */}
</aside>

<Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
  <SheetTrigger asChild>
    <Button variant="outline" size="sm" className="lg:hidden">
      <Filter className="h-4 w-4 mr-2" />
      Filters
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    {/* Mobile filter content */}
  </SheetContent>
</Sheet>

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
```

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Debounce 300ms: no search on every keystroke
- [ ] Suggestions dropdown: opens only if query >= 2 characters
- [ ] Suggestions dropdown: closes on Escape, blur, selection
- [ ] Keyboard navigation: Arrow Down/Up navigates suggestions, Enter selects, Escape closes
- [ ] `aria-activedescendant` updates while navigating suggestions
- [ ] Clear button in input: resets query AND results, shows recent searches
- [ ] Filter chips: Removable Badges with X. "Clear all" resets ALL filters
- [ ] Filter sidebar: Select and Checkbox update URL and trigger refetch
- [ ] Sort: sort order change refetches results. Default "Relevance"
- [ ] Pagination: page in URL. Back button preserves page. Previous disabled on page 1
- [ ] Recent searches: localStorage, max 10 items, deduplicated, shown when query is empty
- [ ] Empty state (no query): shows recent searches or "Start typing to search"
- [ ] Empty state (no results): "No results for '{query}'" + alternative suggestions
- [ ] Empty state (filtered no results): "No results for these filters" + "Clear filters"
- [ ] Loading skeleton: 6 card skeletons with pulse animation, matches real card structure
- [ ] Error state: inline banner with message + "Try again". Input editable. Does not lose query

### States Verified
- [ ] Idle (no query): empty input, recent searches visible
- [ ] Typing (debounce): smooth typing, no API calls during
- [ ] Suggestions: dropdown with navigable list, `aria-expanded="true"`
- [ ] Selecting: suggestion selection sets query and starts search
- [ ] Searching (loading): skeleton cards visible. Input editable
- [ ] Results: card grid with results, filters, pagination
- [ ] No results: specific empty state with alternative suggestions
- [ ] Filtered no results: empty state with "Clear filters"
- [ ] Error: message + retry. Query preserved. Input working
- [ ] Empty query (clear): empty input, results disappeared, recent searches

### Data Flow
- [ ] URL params: q, category, price, sort, page updated on every interaction
- [ ] Back/Forward: URL determines complete state (search + filters + page)
- [ ] Suggestions: separate cache from results (different queryKey)
- [ ] Results: `keepPreviousData` enabled (smooth transition between pages/filters)
- [ ] Recent searches: localStorage synced, max 10, reverse chronological order
- [ ] StaleTime suggestions: 60s (no refetch on every dropdown open)
- [ ] StaleTime results: 30s (fresh data but not obsessive)
- [ ] Debounce: 300ms input → query param. Immediate submit on suggestion selection
