// ============================================================
// Template: Search Catalog with Autocomplete + Filters
// Pattern: search
// Stack: React + shadcn/ui + React Query + Tailwind
// USAGE: Copiare e adattare domini, filtri, query API, card rendering
// ============================================================

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  Search,
  X,
  Clock,
  SlidersHorizontal,
  Package,
  AlertCircle,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface SearchResult {
  id: string
  name: string
  description: string
  image?: string
  price: number
  category: string
  tags: string[]
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  spellingSuggestion?: string
}

interface SuggestionItem {
  id: string
  label: string
  type: 'product' | 'category' | 'query'
}

interface SearchFilters {
  q: string
  category: string
  price: string
  sort: string
  page: number
  pageSize: number
}

interface SearchCatalogProps {
  title?: string
  basePath?: string
  pageSize?: number
  onItemClick?: (item: SearchResult) => void
}

// ──────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Clothing', value: 'abbigliamento' },
  { label: 'Accessories', value: 'accessori' },
  { label: 'Footwear', value: 'calzature' },
  { label: 'Sports', value: 'sport' },
  { label: 'Electronics', value: 'elettronica' },
  { label: 'Home', value: 'casa' },
]

const PRICE_RANGES = [
  { label: 'Up to \u20AC25', value: '0-25' },
  { label: '\u20AC25 \u2013 \u20AC50', value: '25-50' },
  { label: '\u20AC50 \u2013 \u20AC100', value: '50-100' },
  { label: 'Over \u20AC100', value: '100+' },
]

const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: lowest first', value: 'price-asc' },
  { label: 'Price: highest first', value: 'price-desc' },
  { label: 'Name', value: 'name' },
]

const RECENT_SEARCHES_KEY = 'recent-searches'
const MAX_RECENT_SEARCHES = 10

// ──────────────────────────────────────────────
// HOOK: Recent Searches (localStorage)
// ──────────────────────────────────────────────

function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (stored) {
      try {
        setSearches(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [])

  const addSearch = useCallback((term: string) => {
    if (!term.trim()) return
    setSearches((prev) => {
      const next = [term, ...prev.filter((s) => s !== term)].slice(0, MAX_RECENT_SEARCHES)
      return next
    })
  }, [])

  // Sync to localStorage after state updates
  useEffect(() => {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches))
  }, [searches])

  const removeSearch = useCallback((term: string) => {
    setSearches((prev) => prev.filter((s) => s !== term))
  }, [])

  return { searches, addSearch, removeSearch }
}

// ──────────────────────────────────────────────
// HOOK: Debounce
// ──────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// ──────────────────────────────────────────────
// HOOK: URL Params State
// ──────────────────────────────────────────────

function useFilters(defaultPageSize = 20): [SearchFilters, (updates: Partial<SearchFilters>) => void] {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters: SearchFilters = {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? 'all',
    price: searchParams.get('price') ?? '',
    sort: searchParams.get('sort') ?? 'relevance',
    page: Number(searchParams.get('page') ?? '1'),
    pageSize: defaultPageSize,
  }

  const setFilters = useCallback(
    (updates: Partial<SearchFilters>) => {
      const next = { ...filters, ...updates }
      const params = new URLSearchParams()

      if (next.q) params.set('q', next.q)
      if (next.category !== 'all') params.set('category', next.category)
      if (next.price) params.set('price', next.price)
      if (next.sort !== 'relevance') params.set('sort', next.sort)
      if (next.page > 1) params.set('page', String(next.page))

      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [filters, pathname, router],
  )

  return [filters, setFilters]
}

// ──────────────────────────────────────────────
// HOOK: Suggestions API
// ──────────────────────────────────────────────

async function fetchSuggestions(query: string): Promise<SuggestionItem[]> {
  const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  return res.json()
}

function useSuggestions(query: string) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => fetchSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 60_000,
  })
}

// ──────────────────────────────────────────────
// HOOK: Search Results API
// ──────────────────────────────────────────────

async function fetchResults(filters: SearchFilters): Promise<PaginatedResponse<SearchResult>> {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    sort: filters.sort,
  })
  if (filters.q) params.set('q', filters.q)
  if (filters.category !== 'all') params.set('category', filters.category)
  if (filters.price) params.set('price', filters.price)

  const res = await fetch(`/api/search?${params}`)
  if (!res.ok) throw new Error(`Error: ${res.statusText}`)
  return res.json()
}

function useSearchResults(filters: SearchFilters) {
  return useQuery({
    queryKey: ['search-results', filters],
    queryFn: () => fetchResults(filters),
    enabled: filters.q.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function formatPrice(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
}

// ──────────────────────────────────────────────
// SUB-COMPONENTS: STATES
// ──────────────────────────────────────────────

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full rounded-none" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
          <CardFooter className="px-4 pb-4 pt-0">
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Results loading error</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        {error.message}
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function EmptyNoQuery({ recentSearches, onSelectRecent, onRemoveRecent }: {
  recentSearches: string[]
  onSelectRecent: (term: string) => void
  onRemoveRecent: (term: string) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Search className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-lg font-semibold text-foreground">Search catalog</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        Start typing to search for products, categories, and more.
      </p>
      {recentSearches.length > 0 && (
        <div className="mt-8 w-full max-w-sm">
          <p className="text-sm font-medium text-muted-foreground mb-3 text-left">
            Recent searches
          </p>
          <div className="space-y-1">
            {recentSearches.map((term) => (
              <div key={term} className="flex items-center justify-between group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8 px-2 text-sm font-normal"
                  onClick={() => onSelectRecent(term)}
                >
                  <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  {term}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => onRemoveRecent(term)}
                  aria-label={`Remove recent search ${term}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyNoResults({ query, spellingSuggestion, onClearFilters, hasActiveFilters, onSearch }: {
  query: string
  spellingSuggestion?: string
  onClearFilters: () => void
  hasActiveFilters: boolean
  onSearch: (term: string) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-lg font-semibold text-foreground">
        {hasActiveFilters
          ? 'No results for these filters'
          : `No results for "${query}"`}
      </p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        {hasActiveFilters
          ? 'Try removing some filters or modifying your search.'
          : 'Check spelling or use more generic terms.'}
      </p>
      {spellingSuggestion && (
        <Button
          variant="link"
          size="sm"
          className="mt-2"
          onClick={() => onSearch(spellingSuggestion)}
        >
          Did you mean: <span className="font-semibold ml-1">{spellingSuggestion}</span>
        </Button>
      )}
      {hasActiveFilters && (
        <Button variant="outline" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function SearchCatalog({
  title = 'Catalogo',
  basePath,
  pageSize = 20,
  onItemClick,
}: SearchCatalogProps) {
  const [filters, setFilters] = useFilters(pageSize)
  const [query, setQuery] = useState(filters.q)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const pathname = usePathname()
  const router = useRouter()
  const { searches: recentSearches, addSearch, removeSearch } = useRecentSearches()

  const debouncedQuery = useDebounce(query, 300)

  // Sync debounced query to URL
  useEffect(() => {
    if (debouncedQuery !== filters.q) {
      setFilters({ q: debouncedQuery, page: 1 })
    }
  }, [debouncedQuery, filters.q, setFilters])

  // Sync URL q param back to input on navigation
  useEffect(() => {
    setQuery(filters.q)
  }, [filters.q])

  const suggestionsQuery = useSuggestions(debouncedQuery)
  const resultsQuery = useSearchResults(filters)

  const suggestions = suggestionsQuery.data ?? []
  const data = resultsQuery.data
  const isLoading = resultsQuery.isLoading
  const isError = resultsQuery.isError
  const isRefetching = resultsQuery.isRefetching && !resultsQuery.isLoading

  // ── Computed ──

  const hasActiveFilters = filters.category !== 'all' || filters.price !== '' || filters.sort !== 'relevance'

  const selectedPriceRanges = filters.price ? filters.price.split(',') : []

  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = [
    ...(filters.category !== 'all'
      ? [{ id: 'category', label: `Category: ${CATEGORIES.find(c => c.value === filters.category)?.label ?? filters.category}`, onRemove: () => setFilters({ category: 'all', page: 1 }) }]
      : []),
    ...selectedPriceRanges.map((range) => ({
      id: `price-${range}`,
      label: `Price: ${PRICE_RANGES.find(r => r.value === range)?.label ?? range}`,
      onRemove: () => {
        const next = selectedPriceRanges.filter(r => r !== range)
        setFilters({ price: next.join(','), page: 1 })
      },
    })),
  ]

  const showEmptyNoQuery = !filters.q && !isLoading
  const showEmptyNoResults = filters.q && data && data.items.length === 0 && !isLoading
  const showResults = filters.q && data && data.items.length > 0

  // ── Handlers ──

  const handleSearch = useCallback((term: string) => {
    setShowSuggestions(false)
    setActiveIndex(-1)
    addSearch(term)
    setQuery(term)
    setFilters({ q: term, page: 1 })
    inputRef.current?.blur()
  }, [addSearch, setFilters])

  const handleSelectSuggestion = useCallback((suggestion: SuggestionItem) => {
    handleSearch(suggestion.label)
  }, [handleSearch])

  const handleSelectRecent = useCallback((term: string) => {
    handleSearch(term)
  }, [handleSearch])

  const clearAllFilters = useCallback(() => {
    setFilters({ category: 'all', price: '', sort: 'relevance', page: 1 })
  }, [setFilters])

  const clearSearch = useCallback(() => {
    setQuery('')
    setShowSuggestions(false)
    setActiveIndex(-1)
    setFilters({ q: '', page: 1 })
    inputRef.current?.focus()
  }, [setFilters])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) {
        if (e.key === 'Enter' && query) {
          handleSearch(query)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[activeIndex])
          } else {
            handleSearch(query)
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowSuggestions(false)
          setActiveIndex(-1)
          break
      }
    },
    [showSuggestions, suggestions, activeIndex, query, handleSearch, handleSelectSuggestion],
  )

  const handleTogglePriceRange = useCallback((value: string) => {
    const current = new Set(selectedPriceRanges)
    if (current.has(value)) {
      current.delete(value)
    } else {
      current.add(value)
    }
    setFilters({ price: Array.from(current).join(','), page: 1 })
  }, [selectedPriceRanges, setFilters])

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* ── TITLE ── */}
      {title && (
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      )}

      {/* ── SEARCH INPUT ── */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search products, categories..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(-1)
                if (e.target.value.length >= 2) setShowSuggestions(true)
              }}
              onFocus={() => {
                if (query.length >= 2 || recentSearches.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              onBlur={() => {
                clearTimeout(blurTimeoutRef.current)
                blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 200)
              }}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10"
              role="combobox"
              aria-expanded={showSuggestions && (suggestions.length > 0 || (query.length < 2 && recentSearches.length > 0))}
              aria-controls="search-suggestions"
              aria-activedescendant={
                activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
              }
              aria-autocomplete="list"
              aria-label="Search catalog"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Mobile filter toggle */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden shrink-0" aria-label="Open filters">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Filter results by category and price.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <MobileFilterSection
                  title="Category"
                  filters={CATEGORIES}
                  value={filters.category}
                  onChange={(v) => { setFilters({ category: v, page: 1 }); setMobileFiltersOpen(false) }}
                />
                <MobileFilterCheckboxes
                  title="Price"
                  options={PRICE_RANGES}
                  selected={selectedPriceRanges}
                  onChange={handleTogglePriceRange}
                />
                {hasActiveFilters && (
                  <Button variant="outline" className="w-full" onClick={() => { clearAllFilters(); setMobileFiltersOpen(false) }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── SUGGESTIONS DROPDOWN ── */}
        {showSuggestions && (
          <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
            <PopoverContent
              id="search-suggestions"
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command shouldFilter={false}>
                <CommandList>
                  {query.length >= 2 && suggestions.length === 0 && (
                    <CommandEmpty>No suggestions</CommandEmpty>
                  )}

                  {query.length >= 2 && suggestions.length > 0 && (
                    <CommandGroup heading="Suggestions">
                      {suggestions.map((s, i) => (
                        <CommandItem
                          key={s.id}
                          id={`suggestion-${i}`}
                          value={s.label}
                          onSelect={() => handleSelectSuggestion(s)}
                          onMouseEnter={() => setActiveIndex(i)}
                          role="option"
                          aria-selected={activeIndex === i}
                          className={cn(activeIndex === i && 'bg-accent')}
                        >
                          <Search className="mr-2 h-4 w-4" />
                          {s.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {query.length < 2 && recentSearches.length > 0 && (
                    <CommandGroup heading="Recent searches">
                      {recentSearches.map((r, i) => (
                        <CommandItem
                          key={r}
                          id={`recent-${i}`}
                          value={r}
                          onSelect={() => handleSelectRecent(r)}
                          onMouseEnter={() => setActiveIndex(i)}
                          role="option"
                          aria-selected={activeIndex === i}
                          className={cn(activeIndex === i && 'bg-accent')}
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
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Active filters">
          {activeFilterChips.map((chip) => (
            <Badge key={chip.id} variant="outline" className="gap-1 pr-1">
              {chip.label}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1"
                onClick={chip.onRemove}
                aria-label={`Remove filter ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {(hasActiveFilters || filters.sort !== 'relevance') && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* ── BODY: SIDEBAR + RESULTS ── */}
      <div className="flex gap-6">
        {/* DESKTOP FILTER SIDEBAR */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Category</h4>
              <Select
                value={filters.category}
                onValueChange={(v) => setFilters({ category: v, page: 1 })}
              >
                <SelectTrigger aria-label="Filter by category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Price</h4>
              <div className="space-y-2">
                {PRICE_RANGES.map((range) => (
                  <label key={range.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedPriceRanges.includes(range.value)}
                      onCheckedChange={() => handleTogglePriceRange(range.value)}
                    />
                    {range.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN RESULTS AREA */}
        <div className="flex-1 min-w-0" aria-busy={isLoading}>
          {/* Results info + sort */}
          {filters.q && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                {isLoading
                  ? 'Loading...'
                  : showEmptyNoResults
                    ? 'No results'
                    : data
                      ? `${data.total} result${data.total !== 1 ? 's' : ''}`
                      : ''}
              </p>
              <Select
                value={filters.sort}
                onValueChange={(v) => setFilters({ sort: v, page: 1 })}
              >
                <SelectTrigger className="w-[180px]" aria-label="Sort results">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* LOADING (initial) */}
          {isLoading && <ResultsSkeleton />}

          {/* ERROR */}
          {isError && !data && (
            <ErrorState error={resultsQuery.error as Error} onRetry={() => resultsQuery.refetch()} />
          )}

          {/* ERROR (had data, refetch failed) */}
          {isError && data && (
            <div className="mb-4">
              <ErrorState error={resultsQuery.error as Error} onRetry={() => resultsQuery.refetch()} />
            </div>
          )}

          {/* EMPTY: no query entered */}
          {showEmptyNoQuery && (
            <EmptyNoQuery
              recentSearches={recentSearches}
              onSelectRecent={handleSelectRecent}
              onRemoveRecent={removeSearch}
            />
          )}

          {/* EMPTY: no results */}
          {showEmptyNoResults && (
            <EmptyNoResults
              query={filters.q}
              spellingSuggestion={data?.spellingSuggestion}
              onClearFilters={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
              onSearch={handleSearch}
            />
          )}

          {/* RESULTS GRID */}
          {showResults && (
            <>
              <div
                className={cn(
                  'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4',
                  isRefetching && 'opacity-80 transition-opacity',
                )}
              >
                {data.items.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (onItemClick) {
                        onItemClick(item)
                      } else {
                        router.push(`${basePath ?? pathname}/${item.id}`)
                      }
                    }}
                  >
                    <CardHeader className="p-0">
                      <div className="relative aspect-video bg-muted flex items-center justify-center">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          />
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
                      <Button
                        className="w-full"
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onItemClick) {
                            onItemClick(item)
                          } else {
                            router.push(`${basePath ?? pathname}/${item.id}`)
                          }
                        }}
                      >
                        Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* PAGINATION */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <p className="text-sm text-muted-foreground">
                    Page {filters.page} of {data.totalPages}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setFilters({ page: Math.max(1, filters.page - 1) })}
                          aria-disabled={filters.page <= 1}
                          className={filters.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(data.totalPages, 7) }).map((_, i) => {
                        const pageNum = i + 1
                        return (
                          <PaginationItem key={pageNum}>
                            <Button
                              variant={pageNum === filters.page ? 'default' : 'ghost'}
                              size="sm"
                              className="h-8 w-8"
                              onClick={() => setFilters({ page: pageNum })}
                              aria-label={`Page ${pageNum}`}
                              aria-current={pageNum === filters.page ? 'page' : undefined}
                            >
                              {pageNum}
                            </Button>
                          </PaginationItem>
                        )
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setFilters({ page: filters.page + 1 })}
                          aria-disabled={filters.page >= data.totalPages}
                          className={filters.page >= data.totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* REFETCHING INDICATOR */}
              {isRefetching && (
                <div className="flex justify-center mt-4">
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Refreshing results...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// MOBILE SUB-COMPONENTS
// ──────────────────────────────────────────────

function MobileFilterSection({
  title,
  filters,
  value,
  onChange,
}: {
  title: string
  filters: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <div className="space-y-1">
        <Button
          variant={value === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          className="w-full justify-start"
          onClick={() => onChange('all')}
        >
          All
        </Button>
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={value === f.value ? 'secondary' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => onChange(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function MobileFilterCheckboxes({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selected.includes(opt.value)}
              onCheckedChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}
