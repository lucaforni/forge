# Adversarial Review — Frontend Pattern Templates

> **Scope**: All 17 `.tsx` files in
> `.forge/frontend/patterns/templates/` (excluding `__tests__/`).
>
> **Dimensions reviewed**: React best practices, shadcn/ui conventions,
> pattern compliance, design-token compliance, Italian quality,
> cross-template consistency.
>
> **Reviewer**: forge-reviewer (adversarial, anti-sycophancy)
>
> **Date**: 2026-06-25

---

## Severity Legend

- **HIGH**: Blocking. Causes broken UI, runtime errors, TS compile errors,
  visible-to-user bugs, or critical pattern violations. Must fix.
- **MEDIUM**: Should fix before shipping. Maintainability, missing edge
  cases, non-standard component usage, design-token leaks.
- **LOW**: Advisory. Style consistency, unused imports, doc improvements.

---

## === TEMPLATE ISSUES ===

### kpi-card.tsx

**[HIGH] kpi-card.tsx:10**
  Issue: `TrendUp` and `TrendDown` do **not exist** in `lucide-react`. The
  correct icon names are `TrendingUp` and `TrendingDown`. This is a hard
  import error that will throw at build time: `'TrendUp' is not exported
  from lucide-react`. Note: `dashboard-analytics.tsx:13` correctly uses
  `TrendingUp`/`TrendingDown`, so the inconsistency is real and the test
  file at `__tests__/kpi-card.test.tsx:14-15` perpetuates the wrong name
  because it mocks them.
  Fix: Rename to `TrendingUp, TrendingDown` everywhere in the file
  (lines 10, 82, 83) and update parent doc `pattern-kpi-card.md:34-35,247`
  to match. Also fix the test mock to use the same names.

**[MEDIUM] kpi-card.tsx:312-314**
  Issue: Uses `text-warning` / `bg-warning` classes. shadcn/ui's default
  Tailwind config ships with `destructive` but NOT with `warning` /
  `success` as design tokens. These will silently fall through to no
  styling unless the consumer extends `tailwind.config.ts` and `globals.css`
  with `--warning` / `--success` CSS variables. This is undocumented.
  Fix: Either (a) document the required token additions in a header
  comment, or (b) use existing `destructive` / `primary` /
  `muted-foreground` tokens, or (c) ship the token extension as part of the
  template.

**[LOW] kpi-card.tsx:43**
  Issue: `error?: string` is typed as a string but other templates
  (`error-recovery.tsx`, `dashboard-analytics.tsx`) use `Error` objects.
  Inconsistent error type across templates.
  Fix: Standardize on `error?: Error | null` or document the convention.

---

### dashboard-analytics.tsx

**[HIGH] dashboard-analytics.tsx:279**
  Issue: `<Alert variant="warning">`. The shadcn/ui `Alert` component
  supports only `default` and `destructive` variants by default. Passing
  `"warning"` is a **TypeScript error** (Alert's variant prop is a strict
  union) and falls through to default styling at runtime. The
  `className="border-warning bg-warning/5"` workaround presumes
  user-supplied CSS variables.
  Fix: Either (a) extend the Alert component locally to support a
  `warning` variant via CVA, or (b) use `variant="default"` with custom
  classes, or (c) use `variant="destructive"` for visual clarity.

**[MEDIUM] dashboard-analytics.tsx:819-823**
  Issue: Identical branches in ternary — `errors.kpis && kpis.data` and
  `errors.kpis && !kpis.data` both render the SAME `<ErrorZone />` with
  the same props. Dead code / redundant condition.
  Fix: Collapse to a single `errors.kpis ? <ErrorZone ... /> : <KpiRow .../>`.

**[MEDIUM] dashboard-analytics.tsx:735**
  Issue: `config?.defaultTimeRange as TimeRange || '30d'` — unsafe cast.
  If a consumer passes `"invalid"`, the `useState<TimeRange>` will be in an
  invalid state and `useDashboardQueries` will issue an unknown-timeRange
  request to the API. Operator precedence is also fragile: `(x as Y) || Z`
  reads ambiguously.
  Fix: Validate at runtime —
  `const initial = isValidTimeRange(config?.defaultTimeRange) ? config.defaultTimeRange : '30d'`.

**[MEDIUM] dashboard-analytics.tsx:756-761**
  Issue: `isEmpty` is computed at the parent level but never used —
  individual zones compute their own `isEmpty` props. Dead variable.
  Fix: Remove the unused `isEmpty` derivation.

**[MEDIUM] dashboard-analytics.tsx:742**
  Issue: `const queryClient = useQueryClient()` is declared AFTER it would
  conceptually be used, and `useDashboardQueries` itself uses
  `useQueryClient` indirectly. Two `useQueryClient()` calls in one tree is
  fine but suggests a structural issue: the retry handlers belong inside
  the query hook.
  Fix: Move `handleRetryAll` / `handleRetryZone` into `useDashboardQueries`
  and expose them on the returned object for cleaner separation.

**[LOW] dashboard-analytics.tsx:528**
  Issue: `<Cell key={index}>` uses array `index` as React key. While
  acceptable for static pie segments, this becomes problematic if `data`
  reorders. Standard React anti-pattern.
  Fix: Use `entry.name` as key.

---

### confirm-destructive-action.tsx

**[HIGH] confirm-destructive-action.tsx:75**
  Issue: Default `confirmWord = 'CONFIRMA'` is **misspelled Italian**.
  Correct Italian is **`CONFERMA`** (3rd person sing. of *confermare*).
  `CONFIRMA` is a Spanish/Portuguese word and a calque from English
  *confirm*. This is user-visible misspelled UI text and propagates
  through `pattern-confirmation.md`, the test file, and the aria-label
  generator at line 109 (`Digita CONFIRMA per procedere`).
  Fix: Change default to `'CONFERMA'`. Update
  `pattern-confirmation.md:60,65,82,162,170,257,377,400,426,466` and
  `__tests__/confirm-destructive-action.test.tsx:143,170,173`.

**[MEDIUM] confirm-destructive-action.tsx:128, 216**
  Issue: Hard-coded label `'Eliminazione...'` is shown for ANY destructive
  action while pending, even though `TypeToConfirmDialog` and
  `CountdownConfirmDialog` are generic confirmation dialogs (not always
  for deletion). A user could use this for "Suspend account" → the spinner
  text would still say "Eliminazione..." (Deletion).
  Fix: Add an optional `pendingLabel` prop defaulting to `'Operazione in
  corso…'`.

**[MEDIUM] confirm-destructive-action.tsx:235-261**
  Issue: `useUndoMutation` invalidates `queryKey` TWICE on success — once
  inside the toast action's `onClick` (line 250) and once unconditionally
  at line 255. The second one always runs immediately after success, so
  the toast `onUndo` path causes a second invalidation. This is wasteful
  and may trigger a refetch race.
  Fix: Remove the line-255 unconditional invalidation; or only invalidate
  on undo if the optimistic state actually changed.

**[LOW] confirm-destructive-action.tsx:13**
  Issue: `import { toast } from 'sonner'` — `toast` is only used inside
  `useUndoMutation`. Consider scoping or noting that sonner toaster must
  be mounted at the app root for this template to work.

---

### command-palette.tsx

**[HIGH] command-palette.tsx:83-95, 102, 187**
  Issue: All navigation uses `window.location.href = '/path'`. This
  performs a **full page reload**, defeating client-side routing in
  Next.js / React Router. The template imports nothing from
  `next/navigation` despite running with `'use client'` in a Next.js
  context. This breaks SPA navigation, loses React Query cache, resets
  scroll, and wastes a network round-trip.
  Fix: Take a router via prop (or `useRouter()` from `next/navigation`)
  and call `router.push(href)`. Existing templates like `data-table.tsx`
  do this correctly.

**[MEDIUM] command-palette.tsx:117**
  Issue: `JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')` returns
  `any` and is cast to `RecentAction[]` implicitly. A malformed or
  hostile localStorage entry (e.g., `{"foo":1}`) will crash the
  subsequent `.filter()`/`.map()` calls in the render.
  Fix: Validate the parsed shape — `Array.isArray(parsed) ? parsed.filter(isRecentAction) : []`.

**[MEDIUM] command-palette.tsx:198-199**
  Issue: `recentLookup` is built but **never used**. Dead code.
  Fix: Remove line 198 or use the lookup map in `recentFiltered.map()` to
  avoid the O(n·m) `.find()` on line 226.

**[MEDIUM] command-palette.tsx:115-127**
  Issue: `getRecentActions()` and `addRecentAction()` call `localStorage`
  at module-top scope (no SSR guard). If imported in a Next.js Server
  Component or pre-rendered, this throws `ReferenceError: localStorage`.
  The component is `'use client'` so call-sites are safe, but the helper
  functions should still guard for robustness.
  Fix: `if (typeof window === 'undefined') return []` at the top of
  `getRecentActions`.

**[MEDIUM] command-palette.tsx:125**
  Issue: `iconName: action.icon.name` relies on `Function.name`, which is
  **mangled by production minifiers** (Terser, esbuild). After build, all
  icons will store the same mangled name (e.g., `'a'`, `'b'`). The
  `iconName` is then unused anyway in the render, making the whole field
  dead weight.
  Fix: Remove `iconName` from `RecentAction` or store a stable string
  identifier (e.g., a key from a registry).

**[LOW] command-palette.tsx:144**
  Issue: `debouncedQuery = query.length > 2 ? query : ''` is NOT debounced
  — it's just gated. The variable name is misleading. There's no actual
  debouncing; React Query is called immediately with the new value.
  Fix: Either implement debouncing (see `search-catalog.tsx`'s
  `useDebounce`) or rename to `gatedQuery` / `searchQuery`.

---

### data-table.tsx

**[HIGH] data-table.tsx:507**
  Issue: Italian pluralization bug. The template:
  ```
  ordine{selectedIds.size > 1 ? 'i' : ''} selezionat{selectedIds.size > 1 ? 'i' : 'o'}
  ```
  produces literal `"2 ordinei selezionati"` (singular base `ordine` +
  `'i'` = `ordinei`). The correct Italian plural of `ordine` is
  `ordini` (drop `-e`, add `-i`).
  Fix: `ordin${selectedIds.size > 1 ? 'i' : 'e'}`.

**[HIGH] data-table.tsx:514**
  Issue: Same bug in the destructive-action confirm: `Eliminare X
  ordine{selectedIds.size > 1 ? 'i' : ''}?` → `"Eliminare 2 ordinei?"`.
  Fix: `ordin${selectedIds.size > 1 ? 'i' : 'e'}`.

**[HIGH] data-table.tsx:152-159**
  Issue: `statusVariant` returns `'success'` for `'completed'`. shadcn/ui
  Badge does not include a `success` variant in the default CVA. This is
  a TypeScript error against the Badge component's `variant` prop type and
  a runtime fallback to the default badge style.
  Fix: Extend Badge's CVA with `success` / `warning` variants (and
  document) OR map to existing variants: `completed → 'default'`,
  `cancelled → 'destructive'`. The `master-detail-orders.tsx`,
  `drawer-detail-panel.tsx`, and `dashboard-analytics.tsx` all repeat
  this anti-pattern.

**[HIGH] data-table.tsx:390**
  Issue: Hard-coded color `bg-blue-500` for the refetching pulse
  indicator. Direct violation of design-token compliance (no `primary` /
  `info` token used).
  Fix: Use `bg-primary` or extend tokens for an `info` color.

**[MEDIUM] data-table.tsx:514**
  Issue: Uses native `window.confirm()` for destructive action. This is
  inconsistent with `confirm-destructive-action.tsx` and
  `modal-confirm-delete.tsx`, both of which provide proper AlertDialog
  variants. The native browser confirm is non-styled, not accessible to
  custom keyboard handlers, and breaks in some testing environments.
  Fix: Reuse `DeleteConfirmDialog` from `modal-confirm-delete.tsx`.

**[MEDIUM] data-table.tsx:71-103**
  Issue: `setFilters` callback in `useFilters` closes over the *current*
  `filters` object every render. Because it's wrapped in `useCallback`
  with `[filters, pathname, router]`, the callback itself is unstable —
  it changes on every URL change, defeating memoization purpose. Any
  consumer with `useEffect(... , [setFilters])` will fire infinitely.
  Fix: Use the functional form, reading from `searchParams` inside the
  callback rather than capturing `filters`: `(updates) => { const current
  = Object.fromEntries(searchParams); ... }`.

**[MEDIUM] data-table.tsx:13**
  Issue: `X` is imported from `lucide-react` but never used in the file.
  Dead import.
  Fix: Remove `X` from the import list.

**[MEDIUM] data-table.tsx:441**
  Issue: Pagination renders ALL page buttons via `Array.from({ length:
  data.totalPages })`. With `totalPages = 500`, this renders 500 buttons.
  No windowing / truncation. `search-catalog.tsx:929` limits to 7 pages —
  inconsistent.
  Fix: Cap pagination to ~7 visible pages with ellipsis (`shadcn/ui
  Pagination` provides `PaginationEllipsis`).

**[MEDIUM] data-table.tsx:401-419**
  Issue: Clickable `<TableHead>` for sorting has `cursor-pointer` and an
  `onClick` but is NOT a keyboard-accessible element. No `tabIndex`, no
  `role="button"`, no `onKeyDown`. Screen readers won't announce it as
  interactive, keyboard users cannot sort.
  Fix: Either wrap header label in an actual `<button>` or add
  `role="button" tabIndex={0} onKeyDown={...}`.

---

### drawer-detail-panel.tsx

**[MEDIUM] drawer-detail-panel.tsx:76-85**
  Issue: `statusVariant` returns `'success'` and `'warning'` — non-default
  shadcn/ui Badge variants. Same problem as `data-table.tsx`. TS error
  against Badge's variant prop.
  Fix: Same as data-table — extend CVA or map to default variants.

**[MEDIUM] drawer-detail-panel.tsx:294**
  Issue: Hard-coded magic numbers: `w-[15px] h-[15px]`, `left-[7px]`.
  Bypasses the Tailwind spacing scale (`w-3.5`, `h-3.5`, `left-2`).
  Design-token compliance violation, breaks dark/light/density themes.
  Fix: Use scale tokens — `w-3.5 h-3.5` and `left-2`.

**[MEDIUM] drawer-detail-panel.tsx:206-316**
  Issue: `DetailContent` declares an `actions` tab (line 218-220) that
  renders ONLY a static empty paragraph. It's a stub. Either implement or
  remove.
  Fix: Remove the Actions tab and `<TabsTrigger value="actions">` until
  there are actions to render — empty tabs degrade UX trust.

**[MEDIUM] drawer-detail-panel.tsx:377**
  Issue: The `<SheetClose>` close button reimplements its own styling.
  shadcn/ui Sheet already renders a built-in close button. Result:
  duplicate close affordance OR awkward double-X depending on theme.
  Fix: Rely on the default Sheet close button, or hide the default with
  `[&>button]:hidden` then style this one consistently.

**[LOW] drawer-detail-panel.tsx:46, 229**
  Issue: `items.map((item, idx) => ... key={idx})` — index as key.
  Fragile if list mutates.
  Fix: Use a stable id (item has `name + quantity` minimum).

---

### empty-state.tsx

**[HIGH] empty-state.tsx:128-198**
  Issue: `EmptyStateProps` interface (lines 35-47) declares `className?:
  string`, but the `EmptyState` component destructures `className = ''`
  at line 136 and the component does NOT spread `...rest` — fine — BUT
  the `EmptyStateProps` type also doesn't include `itemName`, `query`
  with semantically meaningful uses. More critically, `EmptyStatePresets`
  helpers (lines 64-122) return `EmptyStateProps` (plain object), NOT
  JSX. Yet `infinite-scroll-feed.tsx:228-230` does:
  ```tsx
  function DefaultEmptyState({ onCreate }: { onCreate?: () => void }) {
    return EmptyStatePresets.firstVisit('elementi', onCreate ?? (() => {}))
  }
  ```
  This returns an OBJECT, then React renders `{emptyState ??
  <DefaultEmptyState />}` at line 284 — React will throw
  `Objects are not valid as a React child`.
  Fix: `DefaultEmptyState` must render `<EmptyState {...EmptyStatePresets.firstVisit(...)} />`.

**[MEDIUM] empty-state.tsx:8, 13-14**
  Issue: Unused imports: `type ElementType`, `Inbox`, `FolderOpen`.
  Dead code.
  Fix: Remove unused imports.

**[LOW] empty-state.tsx:142**
  Issue: `className={\`flex flex-col items-center justify-center py-16
  px-4 text-center ${className}\`}` — uses raw string interpolation
  instead of the `cn()` helper used everywhere else (e.g., `kpi-card.tsx`,
  `dashboard-analytics.tsx`). Inconsistent and loses tailwind-merge dedup.
  Fix: `cn('flex flex-col items-center …', className)`. Apply the same
  fix on line 142.

---

### error-recovery.tsx

**[MEDIUM] error-recovery.tsx:263-288**
  Issue: `retry` is async but does NOT await `originalFnRef.current()`
  after the retry-count check correctly. However, there's a stale-state
  bug: the recursive condition uses `retryCount + 1 >= maxRetries` while
  the React state is set asynchronously. If retry is invoked twice
  rapidly, both invocations see the same `retryCount` and the
  "tentativi esauriti" branch is unreliable.
  Fix: Read latest count via `setRetryCount((prev) => ...)` callback and
  use a ref to track the live value.

**[MEDIUM] error-recovery.tsx:280-282**
  Issue: When `retryCount + 1 >= maxRetries`, the code sets the error to
  a *generic* `"Tentativi esauriti. Riprova più tardi."` and loses the
  original `nextError`. Debugging info lost.
  Fix: Compose: `new Error(\`Tentativi esauriti dopo ${maxRetries} tentativi: ${nextError.message}\`)`.

**[MEDIUM] error-recovery.tsx:18**
  Issue: `ErrorRecoveryVariant = 'inline' | 'full-page' | 'toast' |
  'error-boundary'`. The `'toast'` variant is declared in the type but
  has no corresponding component or implementation in this file.
  Dead type.
  Fix: Remove `'toast'` from the union, or add the implementation, or
  reference `toast-mutations.tsx`'s `useToastMutation` in a JSDoc note.

**[LOW] error-recovery.tsx:8**
  Issue: `Component` is imported but the class is declared at line 197 —
  fine, but `useCallback` is imported and used only inside
  `useErrorHandler`. Acceptable but consider splitting class/hook into
  two files for clarity.

---

### form-create-order.tsx

**[MEDIUM] form-create-order.tsx:462**
  Issue: `form.setValue('categoryId', cat.id)` is called without
  `{ shouldDirty: true, shouldValidate: true }`. Result: after picking a
  category from the Combobox, the form is NOT marked dirty, the Submit
  button stays disabled if the user only changes the category, AND the
  validation error doesn't clear.
  Fix: `form.setValue('categoryId', cat.id, { shouldDirty: true,
  shouldValidate: true })`.

**[MEDIUM] form-create-order.tsx:200-201, 547**
  Issue: `notesCount` is tracked in a separate `useState`, manually
  synced with `field.onChange`. This is redundant — React Hook Form
  already tracks the value. The two state stores can drift if the form
  is `form.reset()`-ed without manually resetting `notesCount`.
  Fix: Read from form state — `const notesCount =
  form.watch('notes')?.length ?? 0`.

**[MEDIUM] form-create-order.tsx:165-191**
  Issue: `mapServerErrors` uses `document.querySelector` to focus the
  errored field. This is a React anti-pattern, bypasses RHF's `setFocus`
  API, and breaks if the form is rendered inside a Shadow DOM or portal.
  Fix: Use `form.setFocus(error.field as keyof CreateOrderValues)`.

**[MEDIUM] form-create-order.tsx:254**
  Issue: `window.confirm(...)` for unsaved-changes guard. Same issue as
  `data-table.tsx:514`. Inconsistent with the rest of the design system.
  Fix: Use `AlertDialog` from shadcn/ui.

**[LOW] form-create-order.tsx:519**
  Issue: `disabled={(date) => date < new Date()}` compares Date objects
  with `<` — works but creates a new `Date` on every keystroke causing
  micro-jank. Memoize.
  Fix: `const today = useMemo(() => new Date(), [])`.

---

### infinite-scroll-feed.tsx

**[HIGH] infinite-scroll-feed.tsx:228-230, 284**
  Issue: `DefaultEmptyState` returns the result of
  `EmptyStatePresets.firstVisit(...)`, which is a **plain `EmptyStateProps`
  object**, not JSX. Rendering this via `{emptyState ?? <DefaultEmptyState />}`
  will throw `Objects are not valid as a React child (found: object with
  keys {variant, icon, title, description, primaryCTA, secondaryCTA})`.
  See also [HIGH] empty-state.tsx:128.
  Fix:
  ```tsx
  function DefaultEmptyState({ onCreate }) {
    return <EmptyState {...EmptyStatePresets.firstVisit('elementi', onCreate ?? (() => {}))} />
  }
  ```

**[MEDIUM] infinite-scroll-feed.tsx:184-189**
  Issue: `window.addEventListener('scroll', ...)` is **not throttled**.
  On a long page, this fires 60+ times/sec writing to sessionStorage,
  which is a synchronous main-thread operation. Causes jank and excess
  storage writes.
  Fix: Throttle with `requestAnimationFrame` or a 100-200ms throttle.

**[MEDIUM] infinite-scroll-feed.tsx:181**
  Issue: `window.scrollTo(0, parseInt(saved, 10))` does NOT wait for the
  page content to render before scrolling. If the feed items load
  asynchronously (which is the entire point), the scroll fires
  immediately with an empty body, producing `scrollY = 0` effectively.
  Fix: Wait for `items.length > 0` (or for a known total height) before
  restoring scroll, ideally with `useLayoutEffect`.

**[MEDIUM] infinite-scroll-feed.tsx:114-118**
  Issue: `initialPageParam: { cursor: undefined, offset: 0 }` is fine,
  but `getNextPageParam` returns `{ cursor, offset: lastPage.items.length
  }` — the `offset` keeps resetting to a single page's length, not the
  cumulative offset. For offset-based pagination this is wrong.
  Fix: Sum offset across pages: `offset: allPages.reduce((acc, p) =>
  acc + p.items.length, 0)` — and document that this hook only supports
  cursor pagination, with offset as a fallback.

**[MEDIUM] infinite-scroll-feed.tsx:134-148**
  Issue: The state machine derived in this `useEffect` does NOT include a
  way to transition to `'idle'` after a refetch settles (only
  `'all-loaded'` if `!hasNextPage`). For feeds with more pages, after
  refetch you stay in `'refetching'` forever until a state-changing event
  occurs. Logically the state should fall back to `'idle'` when nothing
  is in flight.
  Fix: Add `else setState('idle')` at end of the `if/else if` chain.

---

### loading-skeletons.tsx

**[LOW] loading-skeletons.tsx:62-68**
  Issue: `COLUMN_WIDTHS` is a hard-coded array of 5 widths. If the
  consumer passes `columns={7}`, only 5 widths are used and columns 6-7
  get no skeleton at all (`visibleWidths.slice(0, 7)` returns 5 items).
  Silent UX bug.
  Fix: Cycle the array — `widths[i % widths.length]` — or accept a
  custom widths array as prop.

**[LOW] loading-skeletons.tsx:251**
  Issue: `${30 + Math.random() * 70}%` for chart-skeleton bar heights
  generates a **new value on every render**, which makes skeleton
  shimmer "jump" if React re-renders during the loading phase. Should be
  memoized.
  Fix: Generate once with `useMemo` or compute from the index.

---

### master-detail-orders.tsx

**[HIGH] master-detail-orders.tsx:319**
  Issue: Italian pluralization bug:
  `articolo{item.itemsCount > 1 ? 'i' : ''}` produces literal
  `"3 articoloi"` for plural. The correct plural of `articolo` is
  `articoli` (drop `-o`, add `-i`).
  Fix: `articol${item.itemsCount > 1 ? 'i' : 'o'}`.

**[HIGH] master-detail-orders.tsx:100-109**
  Issue: `statusVariant` returns non-default Badge variants `'success'`
  and `'warning'`. Same as `data-table.tsx:152-159`. TS error.
  Fix: Extend Badge CVA or map to standard variants.

**[MEDIUM] master-detail-orders.tsx:445-449**
  Issue: Hard-coded magic numbers: `w-[15px] h-[15px]`, `left-[7px]`.
  Identical to `drawer-detail-panel.tsx:294` — these two templates
  duplicate the timeline-dot styling but with the same off-scale magic
  numbers.
  Fix: Use Tailwind scale (`w-3.5 h-3.5 left-2`) and extract a shared
  `<TimelineDot>` component.

**[MEDIUM] master-detail-orders.tsx:14-23**
  Issue: `ArrowLeft` is imported but only used in `EmptyDetail` (line
  242). `MessageSquare` is imported but only used in `DetailPanel` (line
  368). Fine — but `Sheet, SheetTrigger` is imported and `SheetTrigger`
  is never used.
  Fix: Remove `SheetTrigger` from line 27.

**[MEDIUM] master-detail-orders.tsx:341**
  Issue: `function DetailPanel({ detail, onRetry })` — `onRetry` is
  declared but never used inside the function.
  Fix: Remove the unused parameter.

**[MEDIUM] master-detail-orders.tsx:584-597 vs 599-624**
  Issue: The desktop `<main>` and the mobile `<Sheet>` are rendered in
  parallel. Both run their own conditionals on `selectedId`. When the
  viewport is wide AND `selectedId` is set, both panels show the SAME
  detail at the same time — desktop section is `hidden lg:flex` (visible)
  AND `<Sheet open={!!selectedId}>` (also rendered on lg). On large
  screens the Sheet still mounts (just visually hidden by default
  styles).
  Fix: Gate the Sheet with a `useMediaQuery` so it only mounts on `<lg`.

**[LOW] master-detail-orders.tsx:166-178**
  Issue: `usePrefetchOrderDetail` returns a `useCallback` with
  `[queryClient]` dep, which is correct, but the callback creates a new
  `staleTime: 30_000` config that drifts from `useOrderDetailQuery`
  (also 30_000). Extract to a constant to keep them in sync.
  Fix: `const ORDER_DETAIL_STALE_TIME = 30_000` near the top.

---

### modal-confirm-delete.tsx

**[MEDIUM] modal-confirm-delete.tsx:67-91**
  Issue: The `onConfirm` button is an `AlertDialogAction` styled to look
  destructive via `className="bg-destructive text-destructive-foreground
  hover:bg-destructive/90"`. This is a manual reimplementation of the
  Button `variant="destructive"`. Inconsistent with
  `confirm-destructive-action.tsx:124-136` which uses a proper
  `<Button variant="destructive">`.
  Fix: Use `<Button variant="destructive">` instead of styling
  `AlertDialogAction`.

**[LOW] modal-confirm-delete.tsx:117-140**
  Issue: `useDeleteItem` hides the `onError` data from the caller — the
  external mutation state cannot be observed. If a parent wants to react
  to a delete failure (e.g., log it), they have no hook.
  Fix: Forward `mutation.error` / pass through an optional `onError`
  callback option.

---

### search-catalog.tsx

**[HIGH] search-catalog.tsx:795**
  Issue: Italian pluralization bug:
  `${data.total} risultato${data.total !== 1 ? 'i' : ''}` produces
  `"2 risultatoi"`. Correct plural of `risultato` is `risultati`
  (drop `-o`, add `-i`).
  Fix: `risultat${data.total !== 1 ? 'i' : 'o'}`.

**[HIGH] search-catalog.tsx:872-877**
  Issue: `<img src={item.image} alt={item.name}>` — uses raw `<img>`
  instead of `next/image`. Next.js applications use `<Image />` for
  automatic optimization, lazy-loading, layout-shift prevention, and
  responsive sizing. Raw `<img>` triggers ESLint rules
  (`@next/next/no-img-element`) and produces a build warning. Performance:
  unoptimized images.
  Fix: `import Image from 'next/image'` and use it (or document a
  rationale for using `<img>`).

**[MEDIUM] search-catalog.tsx:17, 21-22**
  Issue: Unused imports: `Filter`, `ChevronLeft`, `ChevronRight` (the
  Pagination component uses its own internal chevrons).
  Fix: Remove from import.

**[MEDIUM] search-catalog.tsx:146-175**
  Issue: `useRecentSearches` reads `localStorage` inside `useEffect`,
  then setSearches updates state — but `addSearch` and `removeSearch`
  write to localStorage **inside the setter**, which is a side-effect
  inside a setState updater. React 18+ Strict Mode runs updaters TWICE,
  meaning addSearch/removeSearch will write to localStorage twice per
  call.
  Fix: Move the localStorage write OUT of the setState callback:
  ```tsx
  const addSearch = useCallback((term) => {
    const next = [term, ...searches.filter(s => s !== term)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    setSearches(next);
  }, [searches]);
  ```

**[MEDIUM] search-catalog.tsx:653-707**
  Issue: `<Popover>` is rendered without an explicit `<PopoverTrigger>` —
  only `<PopoverContent>` is used. shadcn/ui's Popover expects a
  trigger; without it the positioning logic breaks (the popover anchors
  to its parent). Combined with the fact that the surrounding `<div
  className="relative">` is the actual visual trigger via the Input,
  this is fragile.
  Fix: Use a dedicated `<PopoverTrigger asChild>` wrapping the input
  container, or use Radix `Popover.Anchor` for positioning without a
  trigger.

**[MEDIUM] search-catalog.tsx:585-587**
  Issue: `setTimeout(() => setShowSuggestions(false), 200)` on input
  blur — this is to allow mousedown on suggestions to fire first. But
  there's no cleanup; if the component unmounts during the 200ms, you
  call setState on an unmounted component.
  Fix: Track the timeout id and clear in cleanup, or use an `onMouseDown`
  preventDefault on the suggestions list.

**[MEDIUM] search-catalog.tsx:208**
  Issue: `pageSize: 20` is hard-coded inside the filter object. Consumer
  has no way to change it without forking the template. Conflicts with
  the pattern of using URL params for state.
  Fix: Make `pageSize` configurable via a prop or accept it from URL too.

**[LOW] search-catalog.tsx:78**
  Issue: `image?: string` — strings allow `""` which is a falsy URL.
  Consider validating non-empty.

---

### settings-account.tsx

**[HIGH] settings-account.tsx:921**
  Issue: `className="border-green-500 text-green-700"` — hard-coded
  Tailwind palette colors. Direct violation of design tokens (no
  `success` / `primary` token used). Will not adapt to dark mode without
  custom dark: variants and breaks theming.
  Fix: Use the `success` design token or extend Alert with a `success`
  variant.

**[HIGH] settings-account.tsx:1389, 1391**
  Issue: `bg-amber-50 dark:bg-amber-950/20` and
  `text-amber-700 dark:text-amber-400` — hard-coded palette colors for
  the unsaved-changes banner. Same problem as above. Inconsistent with
  the rest of the file that uses `bg-muted`, `text-muted-foreground`,
  etc.
  Fix: Use a `warning` design token or extend the design system.

**[HIGH] settings-account.tsx:1445**
  Issue: `<CheckCircle2 className="h-3 w-3 text-green-500 ...">` —
  hard-coded `text-green-500`.
  Fix: Use `text-success` (after adding the token) or `text-primary`.

**[MEDIUM] settings-account.tsx:1412**
  Issue: `aria-orientation={undefined}` — explicitly setting an aria
  attribute to `undefined` is meaningless and may surface as
  `aria-orientation=""` in some renderers. The TabsList component
  presumably forwards undefined cleanly, but the intent is unclear.
  Fix: Remove the attribute entirely, or pass `'vertical'` for the
  desktop layout.

**[MEDIUM] settings-account.tsx:73-79, 1486-1511**
  Issue: `SettingsSection.component` is typed as
  `React.ComponentType<{ onStatusChange?: ... }>`. But all four section
  components are defined BEFORE `SECTIONS`, except `SECTIONS` itself
  uses these components. Hoisting works for function declarations, but
  this also creates a module-level circular ref. More importantly, the
  `SECTIONS` is *defined after the main export* (line 1486 — AFTER
  `AccountSettingsPage`). The main component references `SECTIONS`
  at line 1317 inside `handleKeyDown`. This works only because of
  hoisting of `const`s... wait — `const SECTIONS` is NOT hoisted to its
  declaration, only TDZ. The closure inside `handleKeyDown` runs at
  call time when `SECTIONS` is defined, so it works, but readers must
  scroll 200+ lines to find it.
  Fix: Move `SECTIONS` declaration ABOVE `AccountSettingsPage`.

**[MEDIUM] settings-account.tsx:1316**
  Issue: `function handleKeyDown(e, _sectionId)` — `_sectionId` is
  declared but unused (the function uses `activeSection` from closure
  instead). Misleading API.
  Fix: Remove the unused parameter.

**[MEDIUM] settings-account.tsx:518-523, 713-716, 1094-1102**
  Issue: Per-section `useEffect`s call `onStatusChange?.(...)` on every
  render where the dependencies change. The parent's `setSectionStatuses`
  is wrapped in `useCallback`, but the produced inner callback at line
  1308-1313 returns a *new* function each call (`(status) => setSectionStatuses(...)`).
  Result: the prop reference changes per render → the child `useEffect`
  refires unnecessarily. Potential infinite loop if not careful.
  Fix: Memoize the per-section callback identity by using a stable map
  keyed on sectionId, or pass `(sectionId, status)` to a single stable
  handler.

**[MEDIUM] settings-account.tsx:1299**
  Issue: `window.confirm()` for tab-switch navigation guard. Same
  inconsistency issue as `data-table.tsx` and `form-create-order.tsx`.
  Fix: Use shadcn `AlertDialog`.

**[LOW] settings-account.tsx:185, 204, 254, 273**
  Issue: `throw { message: '...' }` — throwing a plain object instead of
  an `Error`. Loses stack trace and may not be caught by `Error`-based
  catch.
  Fix: `throw new Error('Errore caricamento profilo')` or define a
  proper `ApiError extends Error` class.

---

### toast-mutations.tsx

**[HIGH] toast-mutations.tsx:60-68 + 157-167**
  Issue: Type error AND runtime bug in undo flow.
  - Interface `undoAction.onUndo` is `(data: TData) => void` (single arg).
  - At line 65, the action callback calls `undoAction.onUndo(data)` — one
    arg. So `useDeleteItemToast`'s `onUndo` at line 165 receives ONLY
    `data` (which is `void` for delete), and `variables` is `undefined`.
  - The implementation `onUndo: (restoredId: void, variables: string) =>
    onRestore(variables)` calls `onRestore(undefined)` — passing
    `undefined` where a string id is expected. **Restore won't work.**
  Fix: Change `onUndo` signature to `(data: TData, variables: TVariables)
  => void` and call `undoAction.onUndo(data, variables)` at line 65.

**[MEDIUM] toast-mutations.tsx:87**
  Issue: `text-red-500` hard-coded color on the error icon.
  Design-token violation.
  Fix: Use `text-destructive`.

**[MEDIUM] toast-mutations.tsx:72**
  Issue: `text-green-500` hard-coded color on the success icon.
  Design-token violation.
  Fix: Use `text-success` (after extending tokens) or `text-primary`.

**[MEDIUM] toast-mutations.tsx:12**
  Issue: `Info` is imported but only used in a commented-out example at
  line 236. Unused import.
  Fix: Remove from import.

**[LOW] toast-mutations.tsx:40**
  Issue: Generic constraint `TError extends { message?: string }` allows
  errors WITHOUT `message`. If an error lacks `message`, the toast
  fallback `error.message` is `undefined`, producing a toast with an
  empty description.
  Fix: Require `message: string` (not optional) or provide a fallback
  string at the call site.

---

### wizard-onboarding.tsx

**[HIGH] wizard-onboarding.tsx:126-133 vs 622, 148, 224**
  Issue: TypeScript error. `WizardContextValue` interface does NOT
  include `isSubmitting`. The Provider passes `isSubmitting` (line 622),
  triggering TS2353 "Object literal may only specify known properties".
  Worse, consumers `Step1BasicInfo` (line 148) and `Step2Preferences`
  (line 224) destructure `isSubmitting` from `useWizardContext()` —
  which under the declared type is `undefined`. Runtime, with strict
  null checks off, this becomes `undefined`, so the `disabled` props on
  inputs do NOT correctly disable during submit.
  The trailing comment at line 757-765 ("ERRATA") acknowledges the bug
  but does not fix it.
  Fix: Add `isSubmitting: boolean` to the `WizardContextValue` interface
  (line 126-133) and DELETE the errata comment block.

**[HIGH] wizard-onboarding.tsx:541-549**
  Issue: `STEPS[currentStep - 1].schema.keyof().options[0]` — Step 3
  uses `step3Schema = z.object({})`, an EMPTY schema. `keyof()` on an
  empty object returns `z.never()`, whose `.options` array is `[]`.
  Accessing `[0]` returns `undefined`. The querySelector then becomes
  `[name="undefined"]` which selects nothing, but doesn't crash — focus
  silently fails on Step 3. Worse, on any future step with non-Zod
  shape this can throw.
  Fix: Guard with `const firstFieldName = STEPS[currentStep -
  1].schema._def.typeName === 'ZodObject' ? Object.keys(STEPS[currentStep
  - 1].schema.shape)[0] : null; if (firstFieldName) { ... }`.

**[HIGH] wizard-onboarding.tsx:524-525**
  Issue: `// @ts-expect-error key is valid` followed by
  `form.setValue(key, value, ...)` — using `@ts-expect-error` to bypass
  a type check that COULD be done correctly. If the saved localStorage
  shape has changed (e.g., older version with different keys), this
  silently calls `setValue` with bogus keys. The comment claims "key is
  valid" but provides no validation.
  Fix: Type the loaded data with a Zod parse:
  ```tsx
  const parsed = fullSchema.partial().safeParse(saved.data)
  if (parsed.success) {
    for (const [key, value] of Object.entries(parsed.data)) {
      form.setValue(key as keyof WizardData, value)
    }
  }
  ```

**[MEDIUM] wizard-onboarding.tsx:69-70**
  Issue: `z.enum([...], { required_error: 'Seleziona il tuo ruolo' })` —
  in Zod v3, `required_error` is the correct API but Zod v4 (released
  2025) renamed it to `error`. Confirm the project's Zod version. If on
  v4, this produces no validation error message for missing values.
  Fix: Use `errorMap: () => ({ message: 'Seleziona il tuo ruolo' })`
  which works in both versions.

**[MEDIUM] wizard-onboarding.tsx:528**
  Issue: `eslint-disable-line react-hooks/exhaustive-deps` without a
  justification comment. The empty deps array is intentional (run once on
  mount to restore), but the suppression should explain WHY.
  Fix:
  `// eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount to restore saved progress`
  on its own line.

**[MEDIUM] wizard-onboarding.tsx:567**
  Issue: `queryClient.invalidateQueries({ queryKey: ['onboarding'] })`
  invalidates a key that no other code defines. There's no query with
  key `['onboarding']`. Either dead code or the consumer is expected to
  use that key, but it's undocumented.
  Fix: Document the expected query key or remove the line.

**[MEDIUM] wizard-onboarding.tsx:495**
  Issue: `const router = useRouter()` is declared but never used in
  `OnboardingWizard` (the `SuccessScreen` has its own).
  Fix: Remove from this scope.

---

## === CROSS-TEMPLATE INCONSISTENCIES ===

### 1. Native browser dialogs vs shadcn AlertDialog

**Files affected**: `data-table.tsx:514`, `form-create-order.tsx:254`,
`settings-account.tsx:1299`.

Three templates use `window.confirm()` for destructive / unsaved-change
guards. Three other templates (`confirm-destructive-action.tsx`,
`modal-confirm-delete.tsx`) provide a styled `AlertDialog` for the same
purpose. Two patterns coexist for the same problem, leaking native
browser chrome into an otherwise consistent design system.

**Recommendation**: Pick ONE approach and apply it across all templates.
Suggested: use the shared `DeleteConfirmDialog` / `AlertDialog` and
remove all `window.confirm` calls.

---

### 2. Non-standard Badge / Alert variants

**Files affected**: `data-table.tsx:152-159`, `drawer-detail-panel.tsx:76-85`,
`master-detail-orders.tsx:100-109`, `dashboard-analytics.tsx:279`,
`kpi-card.tsx:312-314` (warning class).

Five templates use `'success'`, `'warning'`, or both as variants on
`Badge` or `Alert`. shadcn/ui ships only `default` and `destructive` for
Alert, and `default`, `secondary`, `destructive`, `outline` for Badge.
The patterns claim these variants exist (`pattern-data-table.md:35`,
`pattern-drawer-panel.md:39`) but no template ships the CVA extension
required to make them work.

**Recommendation**: Ship an extended `Alert` + `Badge` with custom
variants (CVA) as part of the templates pack, OR rewrite to use only
default variants. Document in the templates README.

---

### 3. Hard-coded color tokens

**Files affected**: `toast-mutations.tsx:72,87`, `settings-account.tsx:921,1389,1391,1445`,
`data-table.tsx:390`.

Six occurrences of `text-green-500`, `text-red-500`, `text-blue-500`,
`bg-blue-500`, `border-green-500`, `text-green-700`,
`bg-amber-50/dark:bg-amber-950/20`, `text-amber-700/dark:text-amber-400`.

These bypass the design system. Dark mode will not adapt correctly. Theme
overrides cannot reach them.

**Recommendation**: Replace with semantic tokens (`destructive`,
`primary`, `success`, `warning`). Add `success` / `warning` /
`info` tokens to the design system if missing.

---

### 4. Italian pluralization bugs (template-wide)

**Files affected**: `data-table.tsx:507,514`,
`master-detail-orders.tsx:319`, `search-catalog.tsx:795`.

Four user-visible pluralization bugs producing wrong Italian:
- `articolo + 'i'` → `articoloi` (should be `articoli`)
- `risultato + 'i'` → `risultatoi` (should be `risultati`)
- `ordine + 'i'` → `ordinei` (should be `ordini`)

The pattern in EVERY case is: `${word}{count > 1 ? 'i' : ''}`. The fix is
the same: strip the trailing vowel and pluralize:
`${word_root}${count > 1 ? 'i' : ORIGINAL_VOWEL}`.

**Recommendation**: Create a shared helper:
```ts
function pluralize(count: number, sing: string, plur: string) {
  return `${count} ${count === 1 ? sing : plur}`
}
// Usage: pluralize(n, 'ordine', 'ordini')
```
Apply across all templates.

---

### 5. "CONFIRMA" misspelled Italian throughout

**Files affected**: `confirm-destructive-action.tsx:75,101,106,109`,
`pattern-confirmation.md:60,65,82,162,170,257,377,400,426,466`,
test file at `__tests__/confirm-destructive-action.test.tsx:143,170,173`.

`CONFIRMA` is **not Italian**; correct is **`CONFERMA`**. The bug
propagates from the parent pattern doc to the template default to the
tests. User-visible.

**Recommendation**: Global replace `CONFIRMA` → `CONFERMA` across all
files including the parent pattern doc.

---

### 6. Inconsistent error-shape (string vs Error)

**Files affected**:
- `kpi-card.tsx:43` uses `error?: string`.
- `error-recovery.tsx`, `dashboard-analytics.tsx`, `data-table.tsx`,
  `drawer-detail-panel.tsx`, `master-detail-orders.tsx`,
  `search-catalog.tsx` use `error: Error`.

Two conventions for representing an error in component props. Templates
that compose (e.g., dashboard zones embedding KPI cards) require a
conversion adapter.

**Recommendation**: Standardize on `Error | null`. Update `kpi-card.tsx`
to accept `Error` and derive `message` internally.

---

### 7. Imports in inconsistent order

Several files mix the import groups (React → external → @/ → relative)
inconsistently. Examples:
- `data-table.tsx:13` imports `Search, MoreHorizontal, ...` THEN
  re-imports `AlertCircle` at line 36 (separate import). The lucide
  imports are split across two `import` statements.
- `dashboard-analytics.tsx:12-32` interleaves icon imports with
  `recharts` imports.
- `error-recovery.tsx` correctly groups but does NOT use `'use client'`
  despite using `useState`, `useCallback`, `useRef` — this will fail in
  Next.js App Router server components.

**Recommendation**:
1. Run Prettier with `@trivago/prettier-plugin-sort-imports` or ESLint
   `import/order` rule across the templates pack.
2. Add `'use client'` to `error-recovery.tsx` and `empty-state.tsx`,
   `loading-skeletons.tsx`, `toast-mutations.tsx` — all use hooks/state.

---

### 8. `'use client'` directive missing where required

**Files MISSING the directive**: `empty-state.tsx`, `error-recovery.tsx`,
`loading-skeletons.tsx`, `toast-mutations.tsx`.

These all use React hooks (`useState`, `useCallback`, `useEffect`) or
client-only APIs (DOM event handlers). In Next.js App Router, these
will fail to compile as server components.

**Recommendation**: Add `'use client'` as the first line of each.

---

### 9. Unused imports (template-wide)

| File | Unused imports |
| --- | --- |
| `data-table.tsx` | `X` (lucide) |
| `empty-state.tsx` | `ElementType`, `Inbox`, `FolderOpen` |
| `master-detail-orders.tsx` | `SheetTrigger` |
| `search-catalog.tsx` | `Filter`, `ChevronLeft`, `ChevronRight` |
| `toast-mutations.tsx` | `Info` |
| `wizard-onboarding.tsx` | `useRouter` (in main `OnboardingWizard`) |

**Recommendation**: Enable `noUnusedLocals` in `tsconfig.json` for the
templates package.

---

### 10. Magic spacing values (off the Tailwind scale)

**Files affected**: `drawer-detail-panel.tsx:294`,
`master-detail-orders.tsx:445-449` (both: `w-[15px] h-[15px]`,
`left-[7px]`).

Both timeline-dot implementations use the SAME off-scale magic numbers.
The Tailwind scale offers `w-3.5 h-3.5` (14px) or `w-4 h-4` (16px); the
15px value is undefined intent (between two tokens).

**Recommendation**: Round to a scale value AND extract a shared
`<TimelineDot>` component used by both templates.

---

## Summary

**Total issues: 60**
- **HIGH**: 17 (blocking — runtime errors, TS compile errors,
  user-visible bugs)
- **MEDIUM**: 33 (design-token leaks, non-standard variants,
  pattern inconsistency, missing edge cases)
- **LOW**: 10 (style, docs, micro-perf)

**HIGH issues by category**:
- Italian/UX bugs: 5 (pluralization × 4, CONFIRMA × 1)
- TypeScript / runtime errors: 5 (TrendUp import, wizard context,
  toast onUndo, empty-state preset misuse, infinite-scroll DefaultEmptyState)
- Non-standard shadcn variants: 4 (Alert warning × 1, Badge success × 3)
- SPA navigation broken: 1 (command-palette window.location)
- Hard-coded design tokens: 4 (settings-account × 3, data-table × 1, etc.)
- next/image missing: 1 (search-catalog raw img)

**Recommendation**: **NEEDS CHANGES**

The templates pack cannot ship in its current state:
1. The 5 Italian-language bugs are user-visible immediately.
2. The 5 TypeScript / runtime errors will break consumers' builds (TrendUp
   import) or crash at render time (empty-state preset, infinite-scroll
   default empty state, wizard context isSubmitting).
3. The non-standard shadcn variants (`warning`, `success`) will silently
   fall through to default styles without the documented CVA extension.

**Priority fix order** (do these before any merge):
1. Rename `TrendUp` → `TrendingUp` in `kpi-card.tsx` and its test mocks.
2. Fix the four Italian pluralization bugs (data-table×2,
   master-detail×1, search-catalog×1).
3. Fix `CONFIRMA` → `CONFERMA` everywhere.
4. Fix `empty-state.tsx` + `infinite-scroll-feed.tsx` preset misuse
   (`DefaultEmptyState` must return JSX, not props).
5. Fix `WizardContextValue` interface to include `isSubmitting`; delete
   the ERRATA comment block.
6. Fix `toast-mutations.tsx` undo `onUndo` signature & call site.
7. Ship the CVA extensions for `Alert.warning` / `Badge.success` /
   `Badge.warning`, OR rewrite affected templates to use only default
   variants.
8. Replace `text-green-*` / `text-red-*` / `bg-blue-*` with semantic
   tokens.
9. Add missing `'use client'` directives.
10. Replace `window.location.href` in `command-palette.tsx` with
    `router.push()`.

Once the HIGH-severity items are resolved, the MEDIUM items can be
addressed in a follow-up PR.
