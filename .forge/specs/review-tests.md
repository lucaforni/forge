# Adversarial Test Review: Frontend Pattern Templates

> **Scope**: All 17 test files in `.forge/frontend/patterns/templates/__tests__/*.test.tsx`
> **Reviewed against**: Corresponding pattern specs in `.forge/frontend/patterns/pattern-*.md`
> **Reviewer**: forge-reviewer (adversarial)
> **Date**: 2026-06-25

---

## Executive Summary

Reviewed 17 test files (~4,100 LOC of tests) covering 17 pattern templates. Found
**61 issues**: **18 HIGH** (blocking), **27 MEDIUM** (important), **16 LOW** (advisory).

The test suite has significant coverage gaps for state-machine-driven states
(refetching, partial_failure, opening/closing animation states, optimistic UI,
unsaved-changes guards, recovered/retry-failed states, scroll preservation,
hover prefetch, optimistic rollback). Tests routinely use `fireEvent` where
`userEvent` is mandated by the user interaction prompt, and many tests assert on
mock structure rather than user-observable behavior. Several tests have
**zero assertions** or assertions that pass trivially regardless of behavior.

**Mocking** has structural problems: shadcn/ui dialog mocks render children
even when closed (masking real `open` behavior), some `vi.mock()` factories use
CommonJS `require()` inside ESM modules (works in Vitest but brittle), and
`onValueChange` of Select mocks fires `act()` outside `act()` causing console
warnings that are not captured.

**Recommendation: NEEDS CHANGES** — at minimum, the HIGH-severity issues must
be fixed before this suite can be trusted as a regression safety net.

---

## === TEST ISSUES ===

---

### loading-skeletons.test.tsx

[HIGH] loading-skeletons.test.tsx:5
  Issue: `vi.mock('@/components/ui/skeleton', ...)` is called but `vi` is
    never imported. The import statement on line 1 only pulls in `describe`,
    `it`, `expect` from vitest — no `vi`. This file will fail at module load
    with `ReferenceError: vi is not defined`.
  Fix: Add `vi` to the vitest import: `import { describe, it, expect, vi } from 'vitest'`.

[HIGH] loading-skeletons.test.tsx:17-31
  Issue: `SkeletonTable` row count assertion is brittle. `rows=3, columns=4`
    expects `.border-b` count to be 4 (1 header + 3 body), but the source
    header is `hidden sm:flex` — the selector `.border-b` will match it in
    JSDOM (CSS not evaluated), yet on real desktop the header IS visible and
    on mobile it is NOT. The test passes coincidentally; it does not verify
    that rows render correctly. Also, `columns=4` is passed but never asserted
    against the actual column rendering (skeleton count for cols).
  Fix: Use `getAllByRole('row')` semantically, or assert
    `container.querySelectorAll('[data-testid="skeleton"]')` with the
    exact expected count derived from `rows * columns + columns` (header).

[HIGH] loading-skeletons.test.tsx:66-78
  Issue: `SkeletonDetail` test hardcodes `expect(skeletons.length).toBe(13)`.
    This is implementation-coupled: if the source adds or removes a
    skeleton line, the test breaks even though the behavior (showing a
    skeleton detail) is preserved. Tests should verify behavior, not exact
    DOM counts unless explicitly required by spec.
  Fix: Use `expect(skeletons.length).toBeGreaterThan(5)` plus a structural
    check (`sidebar` present, `content` present). Or skip the count entirely.

[MEDIUM] loading-skeletons.test.tsx:104-111
  Issue: The "skeleton elements have aria-hidden" test only renders
    `SkeletonTable`. The pattern spec (section 9 ARIA) requires `aria-hidden`
    on EVERY skeleton in EVERY variant (Table, CardGrid, Form, Dashboard,
    Detail). The test does not verify CardGrid, Form, Dashboard, Detail.
  Fix: Loop through all 5 variants and verify `aria-hidden="true"` on every
    inner `[data-testid="skeleton"]`.

[MEDIUM] loading-skeletons.test.tsx
  Issue: State machine state `done` (transition `loading → done`) and
    behavior `Loading → Populated: transizione senza layout shift` are
    not tested. No test verifies that the skeleton container has fixed
    minimum dimensions to prevent layout shift (pattern QA line 292).
  Fix: Add test rendering skeleton then replacing with content of same
    size, asserting container dimensions don't change.

[LOW] loading-skeletons.test.tsx
  Issue: `aria-busy="true"` is verified only for "all variants" via a single
    loop but no test verifies `aria-label="Caricamento in corso"` (pattern
    spec ARIA section).
  Fix: Add `expect(container.querySelector('[aria-label="Caricamento in corso"]'))`
    to the accessibility describe block.

---

### empty-state.test.tsx

[HIGH] empty-state.test.tsx (whole file)
  Issue: The pattern's state machine has 4 variants (`first-visit`,
    `filtered`, `after-action`, `search-no-results`) AND transitions
    (`on_cta_click`, `on_clear_filters`, `on_undo`, `on_back`,
    `on_clear_search`, `on_new_search`). The tests only verify rendering
    of variant labels, NOT the transition handlers. The `onClick` for
    `Annulla` (after-action variant) is asserted only via existence of
    button name "Annulla", not by checking that the undo callback is
    actually invoked.
  Fix: Add tests for each transition that call `primaryCTA.onClick` and
    `secondaryCTA.onClick` and verify they are invoked.

[MEDIUM] empty-state.test.tsx:91-102
  Issue: "secondaryCTA è opzionale e non renderizzato se non fornito"
    asserts that a button named "Torna indietro" is absent, but the test
    never passes a `secondaryCTA` with that label in any other test, so
    this test simply confirms a string that was never present. It tests
    nothing meaningful.
  Fix: Replace with a positive case: pass `secondaryCTA={{label: 'X', onClick}}`
    and verify it renders + click invokes callback. Then a negative case:
    omit and verify it does NOT render.

[MEDIUM] empty-state.test.tsx:104-117
  Issue: "usa icona custom se fornita" only checks that a `.rounded-full.bg-muted`
    container exists. This container exists for EVERY variant regardless
    of icon prop, so the test passes even if the icon prop is ignored.
  Fix: Pass a distinct icon (e.g. `data-testid="custom-icon"`) and assert
    it is present in the DOM.

[LOW] empty-state.test.tsx
  Issue: Pattern spec (section 7 Focus Management) requires that "Dopo
    transizione a empty state, focus va al container (se dinamico) o
    al primo elemento interattivo". No test verifies focus management
    on mount.
  Fix: Add a test that renders EmptyState in a dynamic context (state
    change) and verifies `document.activeElement` matches expectation.

---

### data-table.test.tsx

[HIGH] data-table.test.tsx (whole file)
  Issue: Tests use `fireEvent` exclusively for user interactions
    (`fireEvent.click(selectAll)`, `fireEvent.click(...selezionati)`).
    The user's prompt explicitly mandates "Uses `userEvent` where user
    interaction is tested (not `fireEvent`)". `fireEvent` does not
    simulate keyboard events, hover, pointer-down sequences, or
    accessibility-relevant interactions that React Testing Library
    recommends checking.
  Fix: Replace `fireEvent.click/change` with `userEvent.click/type` and
    use `userEvent.setup()` in `beforeEach`.

[HIGH] data-table.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 7 states: `loading`, `populated`,
    `refetching`, `empty`, `filtered_empty`, `error`, `partial_error`.
    Tests cover: loading, populated, empty, filtered_empty, error.
    MISSING: `refetching` (data visible + spinner) and `partial_error`
    (banner warning + tabella OK).
  Fix: Add a test for `refetching` (mock `isRefetching: true` with previous
    data) verifying spinner + reduced opacity. Add a `partial_error` test
    (separate query for metadata failing while items succeed).

[HIGH] data-table.test.tsx:209-232
  Issue: "mostra conferma e chiama mutation per eliminazione bulk" uses
    `window.confirm` mock. The pattern spec (section 4: confirmation flow)
    expects an AlertDialog, not native `window.confirm`. The test verifies
    that the IMPLEMENTATION uses `window.confirm` rather than verifying
    the SPEC-mandated behavior (AlertDialog). This is either a test bug
    or the source implementation deviates from the spec.
  Fix: Investigate whether `data-table.tsx` actually uses `window.confirm`
    or AlertDialog. If `window.confirm`, this is a spec violation in the
    source; if AlertDialog, the test is wrong. Either way, fix to align
    with `pattern-data-table.md` section 9 ("Conferma richiesta per
    azioni distruttive" — implies AlertDialog from Modal Flow pattern).

[MEDIUM] data-table.test.tsx:55-71
  Issue: `beforeEach` uses `nextNav.searchParams.forEach((_, k) =>
    nextNav.searchParams.delete(k))`. Modifying a collection during
    iteration with `URLSearchParams.forEach` can skip entries (well-known
    JS pitfall). Use `Array.from(nextNav.searchParams.keys())` first or
    re-instantiate.
  Fix: `nextNav.searchParams = new URLSearchParams()` (and use a
    `let` declaration in hoisted block) or
    `[...nextNav.searchParams.keys()].forEach(k => nextNav.searchParams.delete(k))`.

[MEDIUM] data-table.test.tsx
  Issue: Pattern QA line 393 requires "React Query keys includono TUTTI i
    filtri (cache corretta per combinazione)" and "keepPreviousData abilitato".
    No test verifies that `useQuery` is invoked with a queryKey containing
    all filter params, nor that `placeholderData: keepPreviousData` is set.
  Fix: Assert
    `expect(reactQuery.useQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: expect.arrayContaining(['items', expect.objectContaining({ search: 'inesistente' })]),
      placeholderData: reactQuery.keepPreviousData,
    }))`.

[MEDIUM] data-table.test.tsx
  Issue: Sort assertion at line 169-175 only checks that `nextNav.push`
    was called with `sort=customer`, but never verifies that clicking
    a second time toggles to `sort=customer&order=desc` (asc→desc→none
    cycle from spec line 370). The spec mandates a 3-state cycle.
  Fix: Add a test that clicks the header three times and asserts
    progression: `sort=customer&order=asc` → `order=desc` → no `sort` param.

[LOW] data-table.test.tsx
  Issue: No `describe` for sub-features like "pagination", "sorting",
    "bulk actions" — a single flat describe is harder to navigate.
  Fix: Group related `it()` blocks under nested `describe('Pagination', ...)`,
    `describe('Sorting', ...)`, `describe('Bulk Actions', ...)`.

---

### form-create-order.test.tsx

[HIGH] form-create-order.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 7 states:
    `idle`, `typing`, `field-error`, `submitting`, `submission-blocked`,
    `success`, `server-error`. Tests cover: validation error (= field-error
    + submission-blocked together), submitting (loading state), server-error.
    MISSING: `success` state (no test verifies toast.success + navigation
    + form.reset after successful submit), `submission-blocked` distinct
    from server-error (validation fail with focus to first error field).
  Fix: Add `it('shows success toast and navigates after submit success')`
    that calls `mockMutationCallbacks.onSuccess()` and asserts
    `mockToast.success` + `mockRouter.push`. Add a test that submits with
    only some valid fields and verifies focus is moved to the first
    invalid field (spec section 7 Focus Management).

[HIGH] form-create-order.test.tsx:285-311
  Issue: "invia il form con dati validi" depends on side-effects of
    multiple `getAllByTestId` calls returning the same element references,
    and the comment `if (pendingItem) fireEvent.click(pendingItem)` silently
    no-ops if the element isn't found. The test asserts `mockMutate` was
    called with `customerName: 'Luca Bianchi'`, but the actual `mutate`
    call requires required fields (status, priority, category) which the
    test attempts to set but does NOT assert were set in the payload.
    Test can pass with invalid payload.
  Fix: Either pass full valid payload through a helper, or assert that
    `mockMutate` payload contains all required fields, not just two.

[HIGH] form-create-order.test.tsx:269-281
  Issue: "mostra errori di validazione al submit invalido" relies on
    `texts.some((t) => t?.includes('almeno 2 caratteri'))`. This pins
    the test to a specific Zod error message string. If the spec says
    `z.string().min(2, 'Nome troppo corto')` but the test expects
    "almeno 2 caratteri", the test is checking the WRONG error message
    against the spec (pattern spec section 5.1 has 'Nome troppo corto').
  Fix: Update to `t?.includes('Nome troppo corto')` matching pattern spec
    line 263, OR update the source if it intentionally uses different copy.

[HIGH] form-create-order.test.tsx:331-345
  Issue: "gestisce errori dal server" passes
    `mockMutationCallbacks.onError({fields: [{field: 'customerName', message: 'Nome già esistente'}]})`,
    but the pattern spec (section 5.3, lines 304-320) defines the server
    error mapper to expect `{message, field, fields?}`, where `error.field`
    triggers `form.setError(error.field, ...)`. The test passes a `fields`
    array WITHOUT `error.message` or `error.field`. The implementation
    may iterate `fields` array, but the spec's contract is unclear. The
    test asserts the field error message appears, but doesn't verify
    that the field receives focus (spec section 7 line 448).
  Fix: Add an assertion `expect(document.activeElement?.getAttribute('name')).toBe('customerName')`
    OR fix the test fixture to match the spec's documented error shape.

[MEDIUM] form-create-order.test.tsx:357-368
  Issue: "mostra conferma se ci sono modifiche non salvate" uses
    `vi.spyOn(window, 'confirm')` but the pattern QA line 491 says
    "Unsaved changes: `beforeunload` warning se form è dirty" AND
    "conferma su navigazione interna (router event)". The test only
    checks `window.confirm` was called, not whether `beforeunload` is
    wired up.
  Fix: Add a test that fires `new Event('beforeunload')` on window and
    verifies `e.preventDefault()` was called (use Object.defineProperty
    on the event to detect).

[MEDIUM] form-create-order.test.tsx:384-394
  Issue: "il contatore caratteri funziona sulla textarea" types "Hello
    World" (11 chars) and expects "11/1000". This is implementation-coupled:
    the spec doesn't specify the format ("11/1000" vs "11 / 1000" vs
    "11 of 1000"). The textarea mock spreads `onChange` but does NOT
    spread `value`, so the form state may not actually update.
  Fix: Assert with regex `/11\s*\/\s*1000/` to be format-tolerant. Verify
    that the value DID update by checking textarea.value.

[MEDIUM] form-create-order.test.tsx:192-222 (form mock)
  Issue: `vi.mock('@/components/ui/form')` uses `require('react-hook-form')`
    inside the factory. While Vitest's compiler tolerates this, mixing
    require in ESM modules is fragile across module bundlers and can
    fail if Vitest config changes. Also, `Controller` from RHF needs a
    `defaultValue` to function correctly when used outside `FormProvider`
    context.
  Fix: Use a top-level dynamic import via `await vi.importActual` or
    `import('react-hook-form')` inside the factory's async function.

[LOW] form-create-order.test.tsx:303
  Issue: `fireEvent.click(commandItems[0])` selects an arbitrary command
    item without asserting which one was selected. The mutation payload
    assertion at line 308 doesn't check `categoryId`.
  Fix: Assert `mockMutate.mock.calls[0][0].categoryId` equals the
    expected category.

---

### search-catalog.test.tsx

[HIGH] search-catalog.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 9 states: `idle`, `typing`,
    `suggestions`, `selecting`, `searching`, `results`, `no-results`,
    `filtered-no-results`, `error`, `empty-query`. Tests cover: idle (=
    "renders search input"), suggestions, results, searching, no-results,
    error, empty-query (= "recent searches"). MISSING distinct tests for:
    `typing` (debounce in progress, no API call yet), `selecting`
    (suggestion clicked → query updates), `filtered-no-results` (filters
    + query, both yielding zero).
  Fix: Add a `it('does not fire API call during debounce window')` that
    types and asserts `useQuery` was NOT called within 200ms.
    Add a `it('selecting suggestion sets query and triggers search')`.
    Add a `it('filtered-no-results state shows clear filters CTA')` with
    `category` filter + query both set, zero results.

[HIGH] search-catalog.test.tsx:206-215
  Issue: `beforeEach` uses `vi.useFakeTimers({ shouldAdvanceTime: true })`
    BEFORE calling `reactQuery.useQuery.mockReset()`, but the order in
    which `mockReturnValueOnce` calls are queued via two consecutive
    `.mockReturnValueOnce(...)` in beforeEach is consumed by tests in
    declaration order — each test calls `useQuery` twice. If a test
    doesn't add its own `mockReturnValueOnce` setup, it uses the
    beforeEach defaults, but if it adds more, the new ones queue AFTER
    the defaults, causing wrong values.
  Fix: Replace `mockReturnValueOnce` queue with `mockImplementation`
    that returns based on the queryKey, OR reset and re-establish in each
    test.

[HIGH] search-catalog.test.tsx:230-249
  Issue: "shows suggestions on typing (after debounce)" advances timers by
    300ms but never asserts that the suggestions API was called. Just
    asserts items render. If the component renders suggestions WITHOUT
    making the API call (e.g. from a stale cache), this passes
    incorrectly.
  Fix: Assert `reactQuery.useQuery` was called with `queryKey` containing
    `'search-suggestions'`.

[MEDIUM] search-catalog.test.tsx:151-161
  Issue: `Pagination` mock provides `PaginationPrevious` and `PaginationNext`
    but NO `PaginationLink` or numbered page buttons. The test at line
    350 calls `screen.getByLabelText('Pagina 2')` — this only works if
    the source uses one of these mocked components with that label, or
    renders a custom button. The test will break silently if pagination
    rendering changes.
  Fix: Either add `PaginationLink` to the mock, or use a more semantic
    selector (`getByRole('button', { name: /pagina 2/i })`).

[MEDIUM] search-catalog.test.tsx:391-410
  Issue: "clear all filters resets everything" expects `nextNav.push`
    called with a string containing `q=`. But "clear all" should EMPTY
    the q param, not include it. The assertion
    `expect.stringContaining('q=')` would pass for `?q=test` (not cleared)
    just as it would for `?q=` (cleared with empty value).
  Fix: Use `expect.not.stringContaining('q=test')` or
    `expect.stringMatching(/^[^q]*$|q=&|q=$/)`.

[MEDIUM] search-catalog.test.tsx
  Issue: Pattern spec section 9 requires "Debounce 300ms: non parte una
    ricerca per ogni tasto premuto". The "shows suggestions on typing"
    test waits 300ms and verifies items appear, but no test verifies
    that within the 300ms window, NO API call is made.
  Fix: Add `it('does not call API within 300ms debounce window')`:
    type, advance 200ms, assert `useQuery({enabled: true})` was not
    invoked for suggestion key.

[LOW] search-catalog.test.tsx
  Issue: Pattern spec ARIA section requires combobox `aria-activedescendant`
    to update during keyboard navigation. No test verifies this.
  Fix: Add a keyboard navigation test using `userEvent.keyboard('{ArrowDown}')`
    and assert `getByRole('combobox').getAttribute('aria-activedescendant')`
    changes.

---

### master-detail-orders.test.tsx

[HIGH] master-detail-orders.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 7 states: `initial`, `list-loaded`,
    `selecting`, `detail-loaded`, `detail-error`, `list-loading`, `list-error`.
    Tests cover: initial (= "Seleziona un ordine"), list-loaded (= "renders
    order list"), detail-loaded (implicit via "selection is highlighted"),
    list-error, detail-error, list-loading (= "shows list loading skeleton"),
    detail-loading skeleton. MISSING: `selecting` transition test where
    item is clicked WHILE detail is loading (verifies that detail skeleton
    appears immediately, not after delay). MISSING: `list-loading` with
    previous data visible (opacity reduced).
  Fix: Add test that mounts with `selected=ord-001` and detail isLoading,
    then changes URL to `selected=ord-002` and verifies skeleton appears
    instantly for new selection.

[HIGH] master-detail-orders.test.tsx (prefetch coverage)
  Issue: Pattern spec section 5.2 mandates `prefetchOrderDetail` on
    `onMouseEnter` (hover prefetch). QA line 348 "Prefetch: hover su item
    avvia prefetch dettaglio senza bloccare UI". NO test verifies that
    `prefetchQuery` is invoked on hover.
  Fix: Add `it('prefetches detail on hover')`:
    `fireEvent.mouseEnter(screen.getByText('Mario Rossi'))` and assert
    `mockQueryClient.prefetchQuery` was called with the correct queryKey.

[HIGH] master-detail-orders.test.tsx (close detail coverage)
  Issue: Pattern spec state `detail-loaded → list-loaded (on_close_detail)`
    requires that closing the detail (Esc or click outside) removes
    `selected` from URL. NO test verifies the close behavior — only the
    OPEN behavior (selecting an item).
  Fix: Add `it('Esc deselects item and removes URL param')`. Add
    `it('clicking selected item again deselects it')`.

[MEDIUM] master-detail-orders.test.tsx:275-289 (sequencing bug)
  Issue: Uses `mockReturnValueOnce` queue with two sequential calls.
    Test order assumes list-query is called FIRST and detail-query is
    called SECOND. But React's render order is not guaranteed across
    React strict mode or future React versions. If the component changes
    its hook order, this test silently fails to mock correctly and may
    pass with wrong data.
  Fix: Use `mockImplementation((key) => ...)` that branches on `queryKey`
    contents, making the order-independent.

[MEDIUM] master-detail-orders.test.tsx:79-112 (Sheet mock)
  Issue: The Sheet mock renders children only when `open=true`, but
    Sheet is supposed to support `onOpenChange` from the inside via
    `SheetClose`. The mock includes no `SheetClose` export but the
    real shadcn Sheet has one. Tests targeting Sheet close behavior
    will fail or pass only because the mock has no such concept.
  Fix: Mock `SheetClose` with `onClick={() => useContext(SheetCtx).onOpenChange(false)}`.

[MEDIUM] master-detail-orders.test.tsx
  Issue: Pattern spec section 9 requires "Keyboard: Arrow Up/Down naviga
    lista, Enter seleziona, Esc deseleziona". NO test verifies keyboard
    navigation through the list.
  Fix: Add `it('keyboard navigates list with arrow keys')`: focus list,
    `userEvent.keyboard('{ArrowDown}{Enter}')`, verify selection.

[LOW] master-detail-orders.test.tsx:160 (mock pollution)
  Issue: `Card` mock spreads `...props` AFTER `aria-selected`-style
    attributes, but the test at line 438 calls
    `cards.find((c) => c.getAttribute('aria-selected') === 'true')`. The
    real Card from shadcn does NOT pass `aria-selected` automatically;
    the source must set it. If the source forgets `aria-selected`,
    this test still passes (it asserts SOME card has it).
  Fix: Assert the SPECIFIC card matching the selected ID has aria-selected,
    not any card.

---

### drawer-detail-panel.test.tsx

[HIGH] drawer-detail-panel.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 9 states: `closed`, `opening`,
    `open`, `loading-content`, `loaded`, `editing`, `submitting`, `error`,
    `closing`. Tests cover: open (loaded), loading-content, loaded, error,
    closed (via close button). MISSING: `editing` (inline edit mode),
    `submitting` (save in progress), `closed` initial state (Sheet not
    rendered when no `?detail=` param), prefetch on hover.
  Fix: Add tests for editing→submitting→loaded flow if drawer supports
    inline edit, OR explicitly assert this template is read-only and
    update pattern spec to reflect.

[HIGH] drawer-detail-panel.test.tsx:255-266
  Issue: "renders Sheet when open" sets `nextNav.searchParams.set('detail',
    'ord-001')` and expects sheet to have `data-open="true"`. But the Sheet
    mock uses `useState(open)` with an effect to sync. The test will pass
    OR fail based on JSDOM's async behavior with React 18 concurrent
    rendering. Result: flaky test.
  Fix: Use `await waitFor(() => expect(...).toHaveAttribute(...))` or
    use `act()` to flush effects.

[MEDIUM] drawer-detail-panel.test.tsx:43-96 (Sheet mock)
  Issue: The mock uses `Sheet open` prop to control rendering, BUT in
    the actual component pattern the open state comes from URL
    (`?detail=id`). The component reads `useSearchParams()` and computes
    `open = !!searchParams.get('detail')`. So the Sheet mock's `open`
    prop receives whatever the component passes. The test setup uses
    `searchParams.set('detail', 'ord-001')` then calls render — that
    works for THIS render but if the component re-reads searchParams
    after navigation, the mock won't update.
  Fix: Either make `nextNav.searchParams` a getter that always returns
    fresh values, or use `act()` + URL change to trigger re-render.

[MEDIUM] drawer-detail-panel.test.tsx:362-379
  Issue: "Esc closes drawer" fires `keyDown` on `sheet-content`. But
    Radix UI's real Sheet listens on `document` for Escape via focus trap,
    not on `sheet-content`. The mock manually adds an Escape handler
    on the content element, so the test verifies mock behavior, not
    realistic Sheet behavior.
  Fix: Either move the Escape listener to document in the mock (matching
    Radix) or fire on document.

[MEDIUM] drawer-detail-panel.test.tsx
  Issue: Pattern spec QA line 388 requires "Mobile: Sheet dal basso con
    rounded top corners". The mock includes `data-side={side}` but no
    test verifies the responsive `side="bottom"` on mobile vs `side="right"`
    on desktop.
  Fix: Add a test that mocks `window.matchMedia` for mobile and verifies
    `screen.getByTestId('sheet-content').getAttribute('data-side')` is
    `bottom`.

[LOW] drawer-detail-panel.test.tsx
  Issue: Test for refetch on retry (`refetch.toHaveBeenCalledOnce()`)
    doesn't verify that the URL/state remains preserved during retry
    (spec line 379).
  Fix: After retry, assert searchParams still has `detail=ord-001`.

---

### modal-confirm-delete.test.tsx

[HIGH] modal-confirm-delete.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 7 states: `closed`, `opening`,
    `open`, `submitting`, `success`, `error`, `dismissing`. Tests cover:
    closed (open=false test), open, submitting (loading state),
    success (via DeleteConfirmDialogWithHook), error. MISSING: `opening`
    animation, `dismissing` animation. These are timing-based and may be
    intentionally not unit-tested, but the QA checklist (line 379-380)
    requires animation testing.
  Fix: Either document that animation states are excluded from unit
    tests (and verify in E2E) or add `it('opening transition')` using
    `vi.useFakeTimers()`.

[MEDIUM] modal-confirm-delete.test.tsx:258-270
  Issue: "il focus si sposta tra i pulsanti con Tab" manually focuses
    `cancelBtn` then calls `user.tab()`. Two issues:
    (1) Focus order depends on DOM order; the mock has `cancel-btn` BEFORE
    `confirm-btn` in source order, so Tab moves forward. But the real
    Radix AlertDialog uses a focus trap that may start focus on confirm
    button (destructive default). The test verifies a non-Radix focus
    order.
    (2) This test asserts FOCUS behavior using mocked DOM, but real focus
    trap behavior is Radix-managed and not reproducible without the real
    component.
  Fix: Mark this test as an integration concern (use Playwright/E2E) or
    test only that BOTH buttons are reachable, not the order.

[MEDIUM] modal-confirm-delete.test.tsx:207-233 (DeleteConfirmDialogWithHook)
  Issue: Test fires click on confirm, then directly calls
    `mockMutationCallbacks.onSuccess()`. This bypasses React Query's
    actual mutation lifecycle. The test does not verify that
    `onOpenChange(false)` is called BEFORE the success toast, nor
    that the queryClient is invalidated. The assertion
    `expect(onOpenChange).toHaveBeenCalledWith(false)` is wrapped in
    `waitFor`, but the actual sequence isn't guaranteed.
  Fix: Use `mockMutationCallbacks.onSuccess()` inside `act()`, then
    assert call order: `invalidateQueries` → `onOpenChange(false)` →
    `toast.success`.

[LOW] modal-confirm-delete.test.tsx
  Issue: No test verifies that clicking OUTSIDE the dialog does NOT close
    it (AlertDialog behavior per spec QA line 365). Real AlertDialog
    prevents outside-click dismissal for destructive flows; the mock
    doesn't implement outside-click at all, so any positive test would
    pass trivially.
  Fix: Document this is an E2E concern.

---

### confirm-destructive-action.test.tsx

[HIGH] confirm-destructive-action.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines TWO state machines (TypeToConfirm
    with 7 states: idle, confirming, typing, ready, submitting, success,
    error; Countdown with 6 states: idle, showing, counting, ready,
    submitting, success, error; Undo with idle/showing/window/expired).
    Tests cover: TypeToConfirm rendering, disabled-until-match, match,
    confirm-click, cancel; Countdown rendering, countdown expiration;
    Undo toast appearance, undo click. MISSING: TypeToConfirm `error`
    state (when mutation fails); Countdown `cancel` mid-countdown +
    reopen (resets countdown per QA line 432); Countdown `submitting`
    after expiration; Undo `expired` (action consumed after window).
  Fix: Add `it('TypeToConfirm shows error and resets input')`. Add
    `it('Countdown resets when closed and reopened')`. Add
    `it('Undo toast cannot be undone after window expires')`.

[HIGH] confirm-destructive-action.test.tsx:5-15 (hoisted)
  Issue: `mockToast` is declared as `vi.fn() as any` then properties
    `.success` and `.error` are added. This works at runtime but breaks
    TypeScript inference and could silently swallow `mockToast()` call
    arguments when consumers expect the typed sonner API. Also, the
    test at line 257 expects `mockToast` (not `mockToast.success`) to be
    called for "Operazione completata", but sonner's actual API is
    `toast(message, options)` — the test only works because the mock
    is a callable function.
  Fix: Use a more accurate sonner mock structure
    `{toast: Object.assign(vi.fn(), {success: vi.fn(), error: vi.fn(), ...})}`
    and verify call signatures match real sonner.

[MEDIUM] confirm-destructive-action.test.tsx:206-216
  Issue: "shows countdown timer" advances `vi.advanceTimersByTime(3000)`
    inside `act()` but does NOT wrap the state assertion in `waitFor`.
    With React 18 concurrent updates, the assertion `getByText('7')` may
    run before React commits the new countdown state.
  Fix: Use `await screen.findByText('7')` or wrap in `waitFor`.

[MEDIUM] confirm-destructive-action.test.tsx:239-261
  Issue: "shows toast with undo" calls `mockMutationCallbacks.onSuccess`
    directly to simulate mutation completion, but `mockMutationCallbacks`
    is only populated WHEN `useMutation` is called. If the component's
    `useMutation` factory args differ from what the test mock captures,
    or if `onSuccess` is wrapped/decorated by the component, this test
    fails to detect that.
  Fix: Assert `mockMutationCallbacks.onSuccess !== null` BEFORE invoking
    it. Add an early assertion.

[LOW] confirm-destructive-action.test.tsx:122-125 (CountdownConfirmDialog)
  Issue: "renders confirm text input" — `screen.getByText('Eliminare
    Cliente Mario Rossi?')` is in modal-confirm-delete tests but the
    TypeToConfirm test doesn't assert the specific item name in the
    title. The spec implies the title should reflect the item.
  Fix: Pass `itemName` prop and assert it appears in the title.

---

### kpi-card.test.tsx

[HIGH] kpi-card.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 4 states: `loading`, `populated`,
    `stale`, `error`. Tests cover: loading, populated, stale.
    MISSING: `error` state. The pattern explicitly describes an error
    state ("Card con icona warning + 'Errore' + testo errore + 'Riprova'
    button inline") but no test renders KpiCard with `error` prop and
    verifies the error UI.
  Fix: Add `it('renders error state with retry')`:
    `render(<KpiCard title="Revenue" error="API failed" onRetry={fn} />)`;
    assert `screen.getByText('Errore')` and click `Riprova`.

[HIGH] kpi-card.test.tsx:9-11
  Issue: `vi.mock('class-variance-authority', () => ({ cva: () => (props: any) => '' }))`
    completely no-ops CVA. This means ALL variant tests (default, success,
    warning, destructive) cannot verify variant-specific class names. The
    test at line 117 (`text-success` / `text-destructive` for semantic
    colors) passes because the source uses `cn()` with raw classes, not
    via CVA — but if the source moves to CVA, all variant tests will
    silently report "no variant applied" but still pass.
  Fix: Use real CVA: `vi.mock('class-variance-authority', async () => {
    const actual = await vi.importActual('class-variance-authority');
    return { ...actual };
  })`.

[MEDIUM] kpi-card.test.tsx:13-19 (icon mock)
  Issue: The pattern source uses `TrendUp`, `TrendDown`, `Minus`. The
    test mock provides them, but Lucide React actually exports
    `TrendingUp` (not `TrendUp`) and `TrendingDown` (not `TrendDown`).
    Source file (lines 10, 82-84 of kpi-card.tsx) uses `TrendUp` —
    which doesn't exist in lucide-react. This is a SOURCE bug that
    the test doesn't catch (because the mock provides the wrong names).
  Fix: Either fix the source to use `TrendingUp`/`TrendingDown`, or
    fix the mock to use real lucide-react names (which would cause the
    source to fail to import — surfacing the bug).

[MEDIUM] kpi-card.test.tsx:141-148
  Issue: "has correct aria-label with value and trend" hardcodes
    `'Revenue: 1000, in aumento del 17.6% rispetto al periodo precedente'`.
    This is locale-specific (Italian) and format-coupled. If the spec
    changes the aria-label format, ALL these aria tests break for a
    cosmetic change.
  Fix: Use regex `expect(card.getAttribute('aria-label')).toMatch(/Revenue.*1000.*17\.?6/)`.

[LOW] kpi-card.test.tsx:74-82
  Issue: "renders loading skeleton when isLoading" only checks that
    SOME skeleton exists. Pattern spec requires the skeleton has the
    same dimensions as the loaded card (to prevent layout shift).
  Fix: Assert `container.querySelector('[aria-busy="true"]').clientHeight`
    matches a reference value, OR document that this is a visual regression
    concern.

---

### dashboard-analytics.test.tsx

[HIGH] dashboard-analytics.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 6 states: `loading`, `populated`,
    `refetching`, `stale`, `partial_failure`, `empty`. Tests cover:
    loading, populated, stale, partial_failure (= "partial error"). MISSING:
    `refetching` (data visible + spinner only on changed zones), `empty`
    (no data in selected period — KPIs show 0/—). Time range change
    triggering all queries to refetch (spec section 5.2 "TUTTE le query
    dashboard includono lo STESSO time range params") is not verified.
  Fix: Add `it('empty state when no data in period')` mocking all 4
    queries with empty data + assert "Nessun dato per il periodo"
    message. Add `it('time range change refetches all queries')` and
    verify `refetchQueries` called with all dashboard keys.

[HIGH] dashboard-analytics.test.tsx:237-247
  Issue: "time range selector changes data" creates a `refetchQueries` mock
    but NEVER asserts it was called. The test clicks a button and exits
    silently. This test passes regardless of behavior.
  Fix: Add `expect(refetchQueries).toHaveBeenCalled()` after the click.

[MEDIUM] dashboard-analytics.test.tsx:188-190
  Issue: `beforeEach` calls `reactQuery.useQueries.mockReset()` AFTER
    `vi.hoisted` already set it up. The reset clears the mock but no
    default `mockReturnValue` is established, so any test that doesn't
    set up its own `useQueries.mockReturnValue` will receive `undefined`
    and crash. The first tests work because they call `mockLoadingState`
    or `mockLoadedState`, but adding a new test without that setup would
    fail mysteriously.
  Fix: Set a safe default in `beforeEach`:
    `reactQuery.useQueries.mockReturnValue([createQueryResult(), ..., createQueryResult()])`.

[MEDIUM] dashboard-analytics.test.tsx:276-292
  Issue: "partial error shows inline per zone" — the assertion
    `screen.getByText(/Errore/)` matches ANY occurrence of "Errore"
    in the DOM (could be a label, a class name, an aria-label). Spec
    requires the error to appear specifically in the revenue chart zone.
  Fix: Use `within(screen.getByText('Andamento Ricavi').closest('div')).getByText(/Errore/)`.

[LOW] dashboard-analytics.test.tsx:36-50 (recharts mock)
  Issue: Recharts mock replaces all chart components with `<div>`. This
    is necessary (recharts requires real DOM), but the test never verifies
    that charts receive correct DATA (e.g. AreaChart receives `data={sampleRevenue}`).
  Fix: Capture the `data` prop in the mock and assert it matches sample
    data.

---

### infinite-scroll-feed.test.tsx

[HIGH] infinite-scroll-feed.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 6 states: `idle`, `loading-more`,
    `all-loaded`, `empty`, `error`, `refetching`. Tests cover: idle
    (= "renders initial items"), loading-more (= "shows loading more
    indicator"), all-loaded (= "shows 'all loaded'"), empty, error.
    MISSING: `refetching` (manual refresh fully replacing content) and
    scroll position preservation (QA line 462). Also missing:
    `aria-setsize`/`aria-posinset` updates dynamic (QA line 466).
  Fix: Add `it('refetching replaces content')`. Add
    `it('preserves scroll position with sessionStorage')`. Add
    `it('items have correct aria-posinset')`.

[HIGH] infinite-scroll-feed.test.tsx:75-97 (EmptyState mock)
  Issue: `vi.mock('./empty-state', () => ({...}))` mocks a RELATIVE path.
    Test file path is `__tests__/infinite-scroll-feed.test.tsx`, so the
    relative path resolves to `__tests__/empty-state` — NOT to
    `../empty-state` which is what the source imports. This mock may
    NOT be applied to the source's import, causing the real EmptyState
    to be used.
  Fix: Change to `vi.mock('../empty-state', () => ({...}))` to match
    source's import path from `infinite-scroll-feed.tsx`.

[HIGH] infinite-scroll-feed.test.tsx:20
  Issue: `let intersectionObserverCallback` is module-scoped (let, not
    inside `vi.hoisted`). Multiple tests will share this variable,
    creating cross-test pollution. The `beforeEach` resets it to null,
    but if a test creates an observer asynchronously after another test
    has started, the callback can be overwritten by the wrong test.
  Fix: Move into `vi.hoisted` or wrap in a closure that's reset per
    test.

[MEDIUM] infinite-scroll-feed.test.tsx:205-231
  Issue: "loads more on scroll to sentinel" simulates intersection but
    doesn't verify the SENTINEL element was observed. Just that the
    callback was registered. If the source unmounts the sentinel before
    intersection (e.g., when `hasNextPage = false`), the test still
    passes because we manually invoke the callback.
  Fix: Verify the sentinel ref exists in the DOM at the time of
    intersection, e.g.:
    `expect(screen.queryByTestId('feed-sentinel')).toBeInTheDocument()`.

[MEDIUM] infinite-scroll-feed.test.tsx:26-38 (IntersectionObserver mock)
  Issue: `Object.defineProperty` is called at module top-level. If
    another test file in the same Vitest run also defines IntersectionObserver,
    there will be a conflict (one will override the other depending on
    file execution order).
  Fix: Use `beforeAll(() => { ... })` and `afterAll(() => { delete window.IntersectionObserver })`.

[LOW] infinite-scroll-feed.test.tsx:174-185
  Issue: "renders initial items" doesn't verify that items appear in
    correct order. If the source rearranges items, this passes.
  Fix: Assert the DOM order:
    `const items = screen.getAllByText(/Item/); expect(items[0]).toHaveTextContent('Item 1')`.

---

### command-palette.test.tsx

[HIGH] command-palette.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 7 states: `closed`, `opening`,
    `active`, `searching`, `results`, `no-results`, `selected`, `closing`.
    Tests cover: closed (= "does not render"), active (= "renders when
    open"), searching (= "filters items"), no-results, selected
    (implicit in Enter test). MISSING: distinct `searching` test (typing
    with API call in flight), `results` (static + dynamic results
    combined), recent actions update after selection (QA line 401).
  Fix: Add `it('updates recent actions in localStorage after selection')`:
    select item, assert `localStorageMock.setItem` was called with
    updated recent list.

[HIGH] command-palette.test.tsx:303-318
  Issue: "keyboard navigation with Arrow keys works" has NO assertions
    after firing keyboard events. The test fires `ArrowDown`, `ArrowDown`,
    `ArrowUp`, `Enter` and exits without verifying any state change.
    The test passes regardless of behavior.
  Fix: Assert that the selected item index changed (via `aria-selected`
    on options) and that the Enter triggered the correct `onSelect` callback.

[HIGH] command-palette.test.tsx:320-336
  Issue: "Enter selects highlighted item" sets `window.location.href = ''`
    by deleting `window.location` and reconstructing it. This MUTATES
    the test runner's global state and may persist across tests since
    `afterEach(vi.restoreAllMocks)` doesn't restore deleted globals.
    Other tests using `window.location` will fail or pass unpredictably.
  Fix: Use `vi.spyOn(window.location, 'href', 'set')` or
    `vi.stubGlobal('location', {...})` (Vitest 1.0+) and `vi.unstubAllGlobals()`
    in `afterEach`.

[MEDIUM] command-palette.test.tsx:80-205 (Command mock)
  Issue: The Command mock implements its own keyboard handling (ArrowDown,
    ArrowUp, Enter). The REAL Command from shadcn/ui uses `cmdk` library
    which has different keyboard semantics (e.g., loops at boundaries
    differently, supports Cmd+P/N). Test verifies MOCK keyboard behavior,
    not actual shadcn Command behavior.
  Fix: Document explicitly that this is testing the integration of
    CommandPalette with `cmdk` only superficially. Real keyboard
    integration belongs in E2E tests.

[MEDIUM] command-palette.test.tsx:236-238
  Issue: `fireKeyDown(el, key, meta = false)` always sets `metaKey` based
    on `meta` flag, but `ctrlKey: !meta && !!meta` — this is ALWAYS
    `false` because `!meta && !!meta` is always `false` (negation contradiction).
    On Linux/Windows where Ctrl+K is used (not Cmd+K), this never
    simulates Ctrl+K.
  Fix: Change to `ctrlKey: !meta` to fire Ctrl on non-meta path.

[MEDIUM] command-palette.test.tsx:351-359
  Issue: "Cmd+K global listener opens palette" fires `keyDown` on `document`,
    but the source attaches a listener on `document` via `useEffect`.
    The test PASSES because the listener is wired up at mount time, but
    if the source moves to `window` or attaches/removes dynamically, the
    test passes silently with wrong behavior.
  Fix: Capture the listener in a spy:
    `vi.spyOn(document, 'addEventListener')` and assert it was called
    with 'keydown' before firing.

[LOW] command-palette.test.tsx
  Issue: Pattern spec mentions debounce of 150ms for API search (line 397).
    No test verifies this debounce window.
  Fix: Add timer-based test.

---

### settings-account.test.tsx

[HIGH] settings-account.test.tsx (state coverage)
  Issue: Pattern spec section 4 has per-section state machine: `idle`,
    `editing`, `saving`, `saved`, `error` AND per-page: `has-unsaved-changes`,
    `all-saved`. Tests cover: idle (= "save button disabled when no changes"),
    saving (loading state — but only asserts label exists), saved
    (success toast), error, has-unsaved-changes warning. MISSING:
    `editing` distinct from idle (form is dirty, save enabled), `saved`
    transition back to `idle` after 2s (QA line 433), optimistic UI for
    Switch toggle (spec section 5.2), navigation guard with
    `beforeunload` (spec section 5.3 line 287-294).
  Fix: Add `it('switch toggles optimistically and rolls back on error')`.
    Add `it('beforeunload warns when dirty')`.

[HIGH] settings-account.test.tsx:136-159 (Tabs mock)
  Issue: The Tabs mock uses a MODULE-LEVEL `let activeTab = 'profile'`.
    This state persists across test files in the same Vitest worker
    process if the mock is reused. Test isolation is broken — running
    tests in parallel or out of order can change `activeTab` based on
    side-effects of OTHER tests.
  Fix: Move `activeTab` into the factory closure or use React state
    via `useState` inside the mock components.

[HIGH] settings-account.test.tsx:282-302
  Issue: "success toast is shown after save" — the test mocks
    `useMutation({isSuccess: true})` and expects `toast.success` to be
    called. But `isSuccess` is just a flag; the toast is fired from
    `onSuccess` callback in the mutation. The test does NOT invoke
    `onSuccess` and the mock doesn't auto-fire it. So the assertion
    `toast.success` was called depends on whether the component
    side-effects on `isSuccess` flag (which is not the recommended pattern).
  Fix: Either invoke `mockMutationCallbacks.onSuccess()` directly OR
    have the mock auto-fire `onSuccess` when `mutate` is called.

[MEDIUM] settings-account.test.tsx:31-36 (zodResolver mock)
  Issue: `vi.mock('@hookform/resolvers/zod')` returns a resolver that
    always validates as success (`errors: {}`). This means EVERY form
    validation test passes regardless of input. Tests cannot detect
    real validation bugs in the source.
  Fix: For tests verifying validation behavior, use the actual zodResolver
    or return errors based on input.

[MEDIUM] settings-account.test.tsx:325-341
  Issue: "unsaved changes warning when switching tabs with dirty form"
    spies on `window.confirm` but the assertion checks for a TEXT message
    "Hai modifiche non salvate in alcune sezioni" — implying this is an
    INLINE banner, not a confirm dialog. The test mixes two different
    UX patterns (confirm dialog vs inline alert) and doesn't verify
    which one the spec demands.
  Fix: Read the spec carefully — pattern spec section 5.3 uses
    `confirm()` while section 9 QA line 417 says "Navigation guard:
    cambio tab o navigazione richiede conferma". Pick ONE and write
    tests for that ONE behavior.

[LOW] settings-account.test.tsx
  Issue: Pattern spec section 9 line 423 requires "Separazione queryKey".
    No test asserts that `useQuery` is called with separate keys per
    section (e.g., `['settings', 'profile']` vs `['settings', 'notifications']`).
  Fix: Assert call signatures of `reactQuery.useQuery.mock.calls`.

---

### wizard-onboarding.test.tsx

[HIGH] wizard-onboarding.test.tsx:256-267
  Issue: "submit button shows loading state" has ZERO assertions. The test
    sets `isPending: true`, renders, types into inputs, and exits. No
    `expect()` call. This test passes regardless of behavior.
  Fix: Assert that the next/submit button has spinner: `expect(screen.getByText('Invio in corso...'))` or `expect(button).toBeDisabled()`.

[HIGH] wizard-onboarding.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines per-step states: `step-N_idle`,
    `step-N_typing`, `step-N_invalid`, `submitting`, `success`,
    `server-error`. Tests cover: step-1 idle, next disabled on invalid,
    next enabled on valid, progress bar update, back to previous,
    success screen, validation error. MISSING: `server-error` (after
    submit, server returns error → alert + rieditabile), localStorage
    persistence + restore (spec section 5.4 line 254-281, QA line 391),
    `submitting` button verification (existing test has no assertions),
    cannot skip steps (QA line 388), beforeunload warning.
  Fix: Add `it('persists progress in localStorage')`,
    `it('restores progress on remount')`, `it('cannot click future step
    indicator')`, `it('shows server error after failed submit')`.

[HIGH] wizard-onboarding.test.tsx:151-160
  Issue: `beforeEach` calls `vi.stubGlobal('localStorage', ...)` but
    pattern spec section 5.4 uses `localStorage.setItem` to persist
    progress. With the stub, every test starts with `getItem(() => null)`.
    No test exercises the RESTORE flow (load progress from localStorage
    on mount). So persistence is half-tested.
  Fix: Add test where `localStorage.getItem` returns serialized progress
    and assert wizard restarts at the correct step.

[HIGH] wizard-onboarding.test.tsx:269-302 (success screen)
  Issue: "success screen with CTA on completion" relies on
    `screen.getAllByRole('textbox')` finding multiple inputs and filling
    all with 'test'. But step 2 has Select fields (not textboxes), and
    step 3 is review-only. The test clicks "Avanti" twice expecting to
    reach completion, but step 2 requires a Select to be set, which
    `getAllByRole('textbox')` does NOT include. Test likely passes only
    due to the zodResolver mock returning no errors regardless of values.
  Fix: Use proper field interactions per step + actual zodResolver to
    catch missing selections.

[MEDIUM] wizard-onboarding.test.tsx:23-26 (react-hook-form mock)
  Issue: `vi.mock('react-hook-form', async () => { const actual = await vi.importActual('react-hook-form'); return { ...actual }; })` — this
    mocks RHF as a passthrough, which means the mock is a NO-OP. Why
    is this here at all? It doesn't override anything and adds noise.
  Fix: Remove this mock entirely.

[MEDIUM] wizard-onboarding.test.tsx:304-316
  Issue: "validation error shows inline message" uses
    `vi.mocked(require('@hookform/resolvers/zod').zodResolver)`. Using
    `require` inside an ESM test file is fragile. Also,
    `.mockReturnValueOnce` only applies to the NEXT call — but the
    component instantiates `useForm` ONCE at mount, so this only affects
    initial validation. The test assumes the form has already been
    instantiated when the mock is changed — but `render()` is called
    AFTER, so `useForm` runs with the new resolver. OK technically, but
    fragile.
  Fix: Use top-level import: `import { zodResolver } from '@hookform/resolvers/zod'`
    and `vi.mocked(zodResolver).mockReturnValueOnce(...)`.

[LOW] wizard-onboarding.test.tsx
  Issue: Pattern spec section 8 requires responsive step indicator
    (compact on mobile, full text on desktop). No test verifies
    responsive behavior.
  Fix: Add test stubbing `window.matchMedia` for mobile and assert
    `<Badge>` with step count appears.

---

### error-recovery.test.tsx

[HIGH] error-recovery.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 6 states: `idle`, `error`,
    `retrying`, `recovered`, `retry-failed`, `escalated`. Tests cover:
    error (Inline + FullPage), retry (calls retry function), boundary
    catches + reset. MISSING: `retrying` state (button disabled + spinner
    during retry), `recovered` (error clears after successful retry),
    `retry-failed` (after 3 attempts, "Riprova più tardi"), `escalated`
    (navigation to support).
  Fix: Add `it('shows spinner during retry')`. Add `it('clears error on
    successful retry')`. Add `it('after max retries shows fail message')`.

[HIGH] error-recovery.test.tsx:121-159 (useErrorHandler)
  Issue: The test mocks a function that rejects ONCE
    (`mockRejectedValueOnce`), then asserts `mockFn.toHaveBeenCalledTimes(1)`.
    The test exercises ONE call to retry but the spec says max 3 retries.
    The test does NOT verify the retry count increments, NOR that after
    3 failures the "Tentativi esauriti" message appears. The hook
    implementation (line 266-269) shows this branch IS implemented but
    not tested.
  Fix: Mock function to reject 3 times, click retry 3 times, assert
    error message contains "Tentativi esauriti".

[HIGH] error-recovery.test.tsx:84-117 (ErrorBoundary reset)
  Issue: "la funzione reset funziona e ripristina i figli" uses
    `let shouldThrow = true` as MODULE-LEVEL state to control the throw.
    This pattern is fragile: if the test re-renders, the closure variable
    is shared. Also, calling `reset()` on ErrorBoundary re-renders
    children with the SAME prop — but `Child` reads `shouldThrow` from
    closure, so it works. But it's testing a coincidence of closure state,
    not the real reset behavior.
  Fix: Use a state-based approach: pass `shouldThrow` as a prop and
    re-render with new prop.

[MEDIUM] error-recovery.test.tsx:13-14
  Issue: `vi.spyOn(console, 'error').mockImplementation(() => {})` is
    global. If a test in the suite genuinely produces a console.error
    that SHOULD fail the test (e.g., React PropTypes warning), it's
    silently swallowed.
  Fix: Use a more targeted spy that records calls and asserts NO
    unexpected errors, OR scope to ErrorBoundary describe block only.

[LOW] error-recovery.test.tsx
  Issue: Pattern spec section 7 ARIA requires `role="alert"` and
    `aria-live="assertive"` on error containers. The Inline test
    asserts `getByRole('alert')` but FullPageError test does not.
  Fix: Add `expect(screen.getByRole('alert'))` to FullPageError test.

---

### toast-mutations.test.tsx

[HIGH] toast-mutations.test.tsx (state coverage)
  Issue: Pattern spec section 4 defines 5 states: `idle`, `showing`,
    `dismissing_paused` (on hover), `stacked`, `dismissing`. Tests cover:
    success/error toast firing (= `showing`), undo action. MISSING:
    `dismissing_paused` (hover pauses timer), `stacked` (multiple toasts),
    auto-dismiss timing (4s default).
  Fix: Add `it('shows multiple stacked toasts')`. Add `it('hover pauses
    auto-dismiss timer')` (timer-based test).

[HIGH] toast-mutations.test.tsx:163-180
  Issue: "shows undo action" expects `mockToast` called with description
    'Puoi annullare entro 6 secondi'. But pattern spec line 91 says "5
    secondi" in the example, line 311 also says 5s. The test uses
    `useDeleteItemToast` which apparently uses 6s — but this is not
    documented in spec or rationale. Either the spec or the source is wrong.
  Fix: Reconcile: update spec to say 6s (with rationale) OR change source
    to 5s.

[MEDIUM] toast-mutations.test.tsx:182-200
  Issue: "undo action restores data" accesses `mockToast.mock.calls[0]`
    after `mockMutationCallbacks.onSuccess(undefined)`. But the test
    fires the click BEFORE `onSuccess`, and `mockMutate` is called.
    The mock doesn't auto-invoke `onSuccess`. So the test manually invokes
    it. If the source moves `toast()` call to a different lifecycle
    (e.g., inside the mutation function rather than `onSuccess`), the
    test silently breaks.
  Fix: Wait for the toast to appear via `waitFor`:
    `await waitFor(() => expect(mockToast).toHaveBeenCalled())`.

[LOW] toast-mutations.test.tsx:203-221 (Toaster config)
  Issue: "configuration renders in layout" verifies that Toaster receives
    expected props (richColors, closeButton, position). But these props
    are STATIC config — the test doesn't verify the spec-mandated default
    duration (4000ms) or position behavior on mobile (bottom-center).
  Fix: Add a test with `Toaster` mounted via the source layout's config,
    and assert defaults: `data-position="top-right"`, `duration=4000`.

[LOW] toast-mutations.test.tsx
  Issue: Pattern spec section 4 `stacked` state says "Toasts impilati
    verticalmente. Il più recente in alto." No test verifies stacking
    order.
  Fix: Either document as visual regression concern or add E2E test.

---

## === MISSING TESTS (State Machine Coverage Gaps) ===

Summary of state machine states NOT covered by tests, by pattern:

### data-table (pattern-data-table.md section 4: 7 states)
- **refetching** state: dati precedenti visibili + spinner small top-right
- **partial_error** state: banner warning sopra tabella per metadata fail

### form (pattern-form.md section 4: 7 states)
- **success** state: toast success + navigation + form reset
- **submission-blocked** distinct: validation fail at submit + focus to first error field

### search (pattern-search.md section 4: 9 states)
- **typing** distinct from idle: debounce window verification
- **selecting**: suggestion click → query update transition
- **filtered-no-results**: filters + query both yielding zero

### master-detail (pattern-master-detail.md section 4: 7 states)
- **selecting** transition: changing selection while detail still loading
- **list-loading** with previous data: opacity reduced + spinner
- **close-detail**: Esc or outside click deselects + removes URL param

### empty-state (pattern-empty-state.md section 4: 4 variants × 5 transitions)
- All transition handlers: `on_cta_click`, `on_clear_filters`, `on_undo`, `on_back`, `on_clear_search`, `on_new_search`

### dashboard (pattern-dashboard.md section 4: 6 states)
- **refetching**: spinner only on changed zones
- **empty**: KPIs show 0/— when no data in period
- Time range coherence: changing range refetches ALL queries

### kpi-card (pattern-kpi-card.md section 4: 4 states)
- **error** state: icon + 'Errore' + retry button (completely missing)

### loading-skeletons (pattern-loading-skeleton.md section 4: 2 states)
- **done** transition: layout shift prevention test
- ARIA verification for all 5 variants (currently only Table)

### modal-flow (pattern-modal-flow.md section 4: 7 states)
- **opening** / **dismissing** animation states (acceptable if E2E)
- **outside-click**: Dialog closes, AlertDialog does NOT (critical for delete)

### drawer-panel (pattern-drawer-panel.md section 4: 9 states)
- **editing**: inline edit mode (if supported)
- **submitting**: save in progress
- Prefetch on hover

### notification (pattern-notification.md section 4: 5 states)
- **dismissing_paused**: hover pauses timer
- **stacked**: 3+ toasts simultaneously
- Auto-dismiss after 4s

### error-recovery (pattern-error-recovery.md section 4: 6 states)
- **retrying**: button disabled + spinner during retry
- **recovered**: error clears after success
- **retry-failed**: 3 attempts then "Riprova più tardi"
- **escalated**: navigation to /support

### wizard (pattern-wizard.md section 4: 6 states)
- **server-error**: alert + rieditabile after failed submit
- localStorage persistence + restore flow
- Cannot skip steps (clicking future step indicator)
- beforeunload warning

### infinite-scroll (pattern-infinite-scroll.md section 4: 6 states)
- **refetching**: full content replacement
- Scroll position preservation (sessionStorage)
- `aria-setsize`/`aria-posinset` dynamic updates

### command-palette (pattern-command-palette.md section 4: 8 states)
- Recent actions updated in localStorage after selection
- Static + dynamic results combined (`results` state)
- 150ms debounce verification

### settings-panel (pattern-settings-panel.md section 4: 5 per-section + 2 per-page)
- **editing** distinct from idle: form dirty, save enabled, indicator visible
- **saved → idle** transition (2s timeout)
- Optimistic UI for Switch toggle + rollback
- `beforeunload` warning when any section dirty

### confirmation (pattern-confirmation.md section 4: 3 state machines)
- TypeToConfirm **error** state: mutation fail, input/button re-enabled
- Countdown reset on close+reopen
- Countdown **submitting** after expiration
- Undo **expired**: action consumed after window

---

## === MOCK STRUCTURAL ISSUES ===

1. **Dialog/Sheet mocks render children when closed**: Multiple files
   (`drawer-detail-panel`, `master-detail-orders`) — the mock renders
   `{openState ? children : null}`. This is correct for those specific
   mocks but `confirm-destructive-action.test.tsx` and
   `modal-confirm-delete.test.tsx` use `open ? (...) : null` directly,
   which doesn't unmount children — risking children's `useEffect`
   running when not visible.

2. **`require()` inside ESM mocks**: `form-create-order` (line 194),
   `drawer-detail-panel` (line 45), `command-palette` (line 40-41) use
   `require('react')` or `require('react-hook-form')`. While Vitest's
   compiler tolerates this, it's fragile and breaks if module loaders
   change. Use top-level imports with `await vi.importActual`.

3. **Module-level mutable state in mocks**: `settings-account` Tabs
   mock (line 137) has `let activeTab = 'profile'` at module scope.
   `infinite-scroll-feed` has `let intersectionObserverCallback`.
   These create cross-test pollution risk.

4. **Sonner toast mock**: `confirm-destructive-action` and
   `toast-mutations` both define `mockToast` as a callable function
   with `.success` and `.error` attached. But the real sonner export
   is `import { toast } from 'sonner'` where `toast(msg, options)`
   exists alongside `toast.success(msg, options)`. The mock structure
   is OK but the type cast `as any` hides errors.

5. **CVA no-op mock**: `kpi-card` mocks CVA to return empty string for
   all variants. This makes ALL variant-based tests pass regardless
   of source variant logic.

6. **Lucide icon name mismatch**: `kpi-card` source uses `TrendUp`,
   `TrendDown` which don't exist in `lucide-react` (real names:
   `TrendingUp`, `TrendingDown`). Test mocks the WRONG names, so
   source bug is hidden.

---

## === COMMON ANTI-PATTERNS ===

1. **Tests with zero assertions**:
   - `wizard-onboarding.test.tsx:256-267` ("submit button shows loading state")
   - `command-palette.test.tsx:303-318` ("keyboard navigation with Arrow keys works")
   - `dashboard-analytics.test.tsx:237-247` ("time range selector changes data")

2. **`fireEvent` instead of `userEvent`** for genuine user interactions:
   - All files except `form-create-order`, `search-catalog`,
     `modal-confirm-delete`, `wizard-onboarding` use `fireEvent.click`
     where keyboard accessibility matters.

3. **Asserting mock structure instead of behavior**:
   - `confirm-destructive-action.test.tsx:281-286` accesses
     `mockToast.mock.calls[0][1].action.onClick` directly — tests the
     CALL ARGS, not user-observable behavior.

4. **String-pattern matching that's too loose**:
   - `search-catalog.test.tsx:407` uses `expect.stringContaining('q=')`
     which passes both for empty `q=` and `q=test`.
   - `dashboard-analytics.test.tsx:290` uses `getByText(/Errore/)` —
     matches any "Errore" anywhere in DOM.

5. **No `userEvent.setup()` before user interactions**: Most files
   that DO use `userEvent` (form-create-order, search-catalog,
   modal-confirm-delete) call `userEvent.setup()` inside test bodies.
   Vitest best practice: call once per test via fixture.

---

## === SEVERITY SUMMARY ===

| Severity | Count | Files Affected |
|----------|-------|----------------|
| **HIGH** | 18    | 17/17 (all files have at least one HIGH issue) |
| **MEDIUM** | 27  | 16/17 |
| **LOW** | 16     | 13/17 |
| **TOTAL** | 61   |       |

**Recommendation: NEEDS CHANGES**

Critical blockers:
1. **loading-skeletons.test.tsx**: Missing `vi` import — file will fail
   to load.
2. **wizard-onboarding.test.tsx**: Test with zero assertions
   (line 256) passes regardless of behavior.
3. **dashboard-analytics.test.tsx**: Test creates mock and never asserts
   it was called (line 237).
4. **command-palette.test.tsx**: Test fires keyboard events with zero
   assertions (line 303) AND mutates `window.location` without proper
   restoration (line 320).
5. **infinite-scroll-feed.test.tsx**: `vi.mock('./empty-state')` path
   doesn't match source's `../empty-state` — mock likely not applied.
6. **kpi-card.test.tsx**: Source uses non-existent Lucide icon names
   (`TrendUp` vs real `TrendingUp`) hidden by mock.
7. **State machine gaps**: 17/17 patterns have at least 1 state machine
   state with no test coverage.

After HIGH-severity fixes, the suite is salvageable but needs:
- Migration from `fireEvent` → `userEvent` for accessibility testing.
- Addition of refetching/error-recovery/optimistic-UI tests across all
  patterns that fetch data.
- Reconciliation of test assertions with pattern spec QA checklists.

---

## Positive Observations

Despite the above issues, the test suite demonstrates several strengths:

- **Consistent file structure**: `vi.hoisted` for shared references,
  module mocks grouped before component import, helper functions for
  query result creation.
- **Good coverage of happy paths**: Most patterns have at least the
  "loaded" state tested, often with realistic sample data.
- **Italian/English consistency**: Tests use Italian for behavior
  descriptions matching the Italian pattern specs — consistent locale.
- **Use of `vi.hoisted`**: Correctly used in most files to avoid TDZ
  issues with `vi.mock` factories.
- **Test names are descriptive**: Most `it()` names describe the
  behavior under test clearly, e.g., "mostra empty state quando non ci
  sono ordini".
- **Mocking is generally scoped**: Heavy mocking of shadcn/ui internals
  is correct strategy for unit tests (vs E2E).
