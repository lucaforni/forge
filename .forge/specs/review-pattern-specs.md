# Adversarial Review — Frontend Pattern Specs

**Reviewer**: forge-reviewer (adversarial)
**Scope**: `.forge/frontend/patterns/` — 17 pattern files + `index.md`
**Date**: 2026-06-25
**Method**: structural completeness · content quality · cross-pattern consistency · index ↔ spec alignment

---

## Executive Summary

Reviewed all 17 pattern files plus `index.md`. Every file has the 9 required top-level
section headings, but the review surfaced **38 distinct issues**:

| Severity | Count | Bucket |
|---|---|---|
| HIGH | 9 | code-level correctness in JSX examples, malformed YAML state machine, severity claims in index out of sync with files, Italian grammar in user-facing strings |
| MEDIUM | 18 | naming inconsistencies, type drift across patterns, "states covered" counts in index broken, terminology drift |
| LOW | 11 | typos, style inconsistencies, stale numbers |

**Headline findings**:

1. **Index `Pattern Matrix` is materially out of sync with the pattern files** — 5 patterns have a different "Severity" in the index than in the file; the "States covered" column is wrong or contradictory for **at least 15 of 17 patterns** (wrong counts, names that don't exist in the file, etc.).
2. **Three patterns ship broken JSX examples** — `pattern-empty-state.md` uses lowercase `<icon>`; `pattern-settings-panel.md` JSX omits the required `<Tabs>` wrapper; `pattern-data-table.md` references an out-of-scope `ids` variable in `onSuccess`; `pattern-kpi-card.md` reads `data.current` without the null guard it applies one line down; `pattern-infinite-scroll.md` references undefined `globalIndex`.
3. **`pattern-confirmation.md` has a malformed YAML state machine** — the Countdown sub-pattern uses transitions outside any state block, omits required `description` / `ui` / `transitions` keys, and would not parse with any structured YAML consumer.
4. **`pattern-master-detail.md` lists `variant: github` for the `Button` component** — `github` is not a shadcn Button variant.
5. **`pattern-wizard.md` contains Chinese characters** (`一步式`) embedded in Italian prose.

The pattern library is broadly internally coherent in tone and method, but the
above issues will hurt any agent (or human) trying to use these specs as
machine-readable input.

---

## === PATTERN SPEC ISSUES ===

### HIGH

[HIGH] pattern-empty-state.md
  Section: 3. Composizione JSX (line 45)
  Issue: JSX uses lowercase `<icon className=... />`. In JSX, lowercase tag
    names render as DOM elements (`<icon>` would render as an unknown HTML
    element), not as the React component referenced by the `icon` prop. The
    prop is typed `icon: React.ElementType` (line 118), so the variable name
    must be capitalised when used as a tag, or destructured to a capitalised
    alias (e.g. `const Icon = icon`).
  Fix: Change to `<Icon className="h-8 w-8 text-muted-foreground" />` and add
    `const Icon = icon` (or rename the prop), matching the pattern used in
    `pattern-kpi-card.md` line 52–55.

[HIGH] pattern-settings-panel.md
  Section: 3. Composizione JSX (lines 48–77)
  Issue: The JSX example renders `<TabsList>`, `<TabsTrigger>`, and
    `<TabsContent>` but never opens an enclosing `<Tabs>` wrapper. shadcn/ui
    Tabs require the `<Tabs>` component (which provides Radix context) for
    `value`, `onValueChange`, `data-[state=active]`, and `aria-selected` to
    work. The example as written will throw at runtime ("TabsList must be
    used within Tabs").
  Fix: Wrap the entire `<div className="flex flex-col lg:flex-row gap-6">`
    in `<Tabs value={activeSection} onValueChange={setActiveSection}>` and
    close it before `</div>`.

[HIGH] pattern-data-table.md
  Section: 5. Data Flow (lines 245–254)
  Issue: `onSuccess: () => { ... toast.success(\`${ids.length} elementi
    eliminati\`) }` — `ids` is the parameter name of `mutationFn`, not in
    scope inside `onSuccess`. React Query's `onSuccess` signature is
    `(data, variables, context) => void`, so the deleted IDs are accessible
    only via the second argument. As written this throws `ReferenceError:
    ids is not defined`.
  Fix: Change to `onSuccess: (_, ids) => { ...
    toast.success(\`${ids.length} elementi eliminati\`) }`.

[HIGH] pattern-kpi-card.md
  Section: 3. Composizione JSX (line 64)
  Issue: `{format(data.current)}` is rendered unconditionally, but `data` is
    declared optional (`data?: KpiData` in `KpiCardProps`, line 194), and
    the trend block one line down correctly guards with `{data && (...)}`.
    When `isLoading` or `data === undefined`, this line throws "Cannot read
    properties of undefined (reading 'current')".
  Fix: Either guard the value block (`{data ? format(data.current) : '—'}`)
    or render the skeleton variant when `!data` and return early at the top
    of the component.

[HIGH] pattern-infinite-scroll.md
  Section: 3. Composizione JSX (lines 59–64)
  Issue: `items.map((item, index) => (... aria-posinset={globalIndex} ...))`.
    `globalIndex` is never defined; the map callback exposes only `item`
    and `index`. Additionally `aria-setsize={totalCount}` references
    `totalCount`, which the docs define as the return-value name of the
    hook (`UseInfiniteScrollReturn.totalCount` line 370) but the JSX block
    never destructures it. Both will crash at runtime.
  Fix: Compute `const globalIndex = items.indexOf(item) + 1` (or use the
    map `index + 1`) and destructure `totalCount` from the hook before the
    map. Also clarify whether the value is 1-based (as `aria-posinset`
    requires) — `index + 1` is the safer expression.

[HIGH] pattern-master-detail.md
  Section: 2. Componenti shadcn/ui (line 38)
  Issue: Lists `Button` variants as `default/ghost/outline/github`. `github`
    is not a valid shadcn/ui Button variant. The official set is
    `default | destructive | outline | secondary | ghost | link`. This will
    mislead any implementer following the spec literally.
  Fix: Change to `variant: default/ghost/outline` (or include `secondary`
    if used). Likely a typo for `ghost`.

[HIGH] pattern-confirmation.md
  Section: 4. State Machine (lines 206–246 — Countdown sub-pattern)
  Issue: The second YAML state machine ("Pattern: Countdown") is structurally
    malformed:
      • Line 213: `idle → showing (trigger click)` — a transition outside
        any state's `transitions:` key. Invalid.
      • Line 240–242: `submitting:` block lacks `description:`, `ui:`, and
        an explicit `transitions:` key — it just lists arrows directly
        under the state name. Inconsistent with every other state block in
        the entire library.
      • Lines 244–245: `success → idle` and `error → showing` are bare
        arrows with no surrounding state body. The `success` and `error`
        states are never properly declared for Countdown.
    Any agent attempting to parse this YAML to build a state graph (the
    stated purpose of the section) will fail or produce a broken graph.
  Fix: Rewrite the Countdown sub-pattern following the same template used
    by Type-to-Confirm (each state has `description`, `ui`, `transitions`,
    and transitions are arrows inside the `transitions:` block). Also
    consider splitting Countdown and Undo into their own H3 subsections
    rather than chained YAML documents inside one fenced block.

[HIGH] pattern-wizard.md
  Section: 1. Quando Usare (line 19)
  Issue: `- Configurazione一步式 con sezioni collassabili → accordion o tabs`
    — contains Chinese characters `一步式` ("one-step style") embedded in
    Italian prose. Almost certainly a translation-tool artefact.
  Fix: Replace with `Configurazione a step singolo con sezioni collassabili`
    (or `Configurazione monofase`).

[HIGH] pattern-search.md
  Section: 3. Composizione JSX (line 206)
  Issue: Italian pluralisation bug in user-facing string:
    `${resultsCount} risultato${resultsCount !== 1 ? 'i' : ''}` produces
    "1 risultato", "0 risultatoi", "2 risultatoi". Correct Italian plural
    of "risultato" is "risultati" (the `-o` becomes `-i`, not appended).
    The bug appears in copy that is rendered to end-users and is announced
    by screen readers via `aria-live="polite"` (line 204).
  Fix:
    ```tsx
    `${resultsCount} ${resultsCount === 1 ? 'risultato' : 'risultati'}`
    ```

### MEDIUM

[MEDIUM] pattern-kpi-card.md
  Section: 2. Componenti
  Issue: Section heading is `## 2. Componenti` (line 24), missing the
    `shadcn/ui` qualifier used by all other patterns ("## 2. Componenti
    shadcn/ui"). This breaks the "consistent section ordering and naming"
    rule and means a grep-based section index will miss this pattern.
  Fix: Rename to `## 2. Componenti shadcn/ui` to match the other 15
    patterns. (Same fix needed for `pattern-notification.md`, below.)

[MEDIUM] pattern-notification.md
  Section: 2. Componenti
  Issue: Section heading is `## 2. Componenti` (line 25), missing the
    `shadcn/ui` qualifier. Notification depends on Sonner not shadcn, so the
    author may have intentionally dropped it, but the inconsistency
    contradicts the index's claim that every pattern lists "Componenti
    shadcn/ui" (see Nuovo Pattern Checklist line 155 of `index.md`).
  Fix: Rename to `## 2. Componenti shadcn/ui` (Toaster IS a shadcn-compatible
    wrapper around Sonner, and Button is used in the table), or update the
    canonical section name in the checklist to just "Componenti".

[MEDIUM] pattern-kpi-card.md
  Section: 3. Composizione JSX (line 71)
  Issue: `trendColor(data.trend, data.changePercent > 0)` — the second
    argument is whether the change is positive, but the prop in §6
    (`higherIsBetter?: boolean`, line 198) and the QA checklist (line 249)
    describe a `higherIsBetter` semantic. Passing `changePercent > 0`
    instead of `higherIsBetter` means the colour logic is wrong for any
    metric where "down is good" (e.g. error count, latency). The JSX and
    the contract disagree.
  Fix: Pass `higherIsBetter` (a prop) into `trendColor`, e.g.
    `trendColor(data.trend, higherIsBetter)`, then internally combine
    direction + better-is-up to decide green/red.

[MEDIUM] pattern-confirmation.md
  Section: 3. Composizione JSX (lines 60–82) + 5. Data Flow (line 257)
  Issue: The confirm word is hardcoded as `"CONFIRMA"`. This is neither
    Italian (`CONFERMA`) nor English (`CONFIRM`). The whole spec is in
    Italian, so end-users would expect "CONFERMA". Inconsistent with the
    surrounding language and likely to confuse end-users typing the word.
  Fix: Change to `CONFERMA` throughout (lines 60, 65, 82, 162, 170, 257,
    377, 400, 426, 466). Or, since §6 types it as configurable
    (`confirmWord?: string`), make the default `CONFERMA`.

[MEDIUM] pattern-confirmation.md
  Section: Front-matter
  Issue: Severity in file is `Interaction` (line 3), but index.md Pattern
    Matrix lists it as `Advanced`. The "Confirmation Flow" is a critical
    interaction pattern that arguably IS interaction-level — but the index
    contradicts the file. Pick one.
  Fix: Decide canonical severity. If `Advanced` is correct (per index), fix
    the file. If `Interaction` is correct, fix the index matrix row.

[MEDIUM] pattern-command-palette.md
  Section: Front-matter
  Issue: Severity in file is `Core` (line 3), index Pattern Matrix says
    `Advanced`. Command Palette is explicitly described in §1 as power-user
    navigation that "complementa" primary navigation, which sounds Advanced.
    Pick one.
  Fix: Align file and index.

[MEDIUM] pattern-drawer-panel.md
  Section: Front-matter
  Issue: Severity in file is `Core` (line 3), index Pattern Matrix says
    `Interaction`. Drawer/Sheet is described as supporting either listing
    detail (master-detail companion) or inline editing — both are
    interaction concerns. Pick one.
  Fix: Align file and index.

[MEDIUM] pattern-kpi-card.md
  Section: Front-matter
  Issue: Severity in file is `Core` (line 3), index Pattern Matrix says
    `Dashboard`. KPI Card is described in §1 as a dashboard component
    (rows, sparklines, vs-period). `Dashboard` seems correct; `Core` in the
    file is inconsistent.
  Fix: Align file and index — likely change file from `Core` to `Dashboard`.

[MEDIUM] pattern-wizard.md
  Section: Front-matter
  Issue: Severity in file is `Core` (line 3), index Pattern Matrix says
    `Advanced`. Wizards are advanced patterns. Likely file is wrong.
  Fix: Align file and index — likely change file from `Core` to `Advanced`.

[MEDIUM] pattern-master-detail.md
  Section: 1. Quando Usare (lines 17, 20) + index.md (matrix row 10)
  Issue: Refers to the Drawer pattern as "Drawer/Sheet" (no spaces around
    the slash), while `pattern-modal-flow.md` line 18 uses "Drawer / Sheet"
    (with spaces), and `index.md` line 82 uses "Drawer / Sheet". The file
    itself is titled "Drawer/Sheet Panel" (no spaces). Three different
    spellings across the library.
  Fix: Pick one canonical form ("Drawer / Sheet" matches the index) and
    use it everywhere, including the pattern title.

[MEDIUM] pattern-confirmation.md
  Section: 4. State Machine
  Issue: The state machine fenced block contains TWO top-level patterns
    (`Pattern: TypeToConfirm` and `Pattern: Countdown`) separated by a
    `---` document marker. None of the other 16 files use this construct.
    It is genuinely confusing — the `---` reads as a Markdown horizontal
    rule inside a YAML block, but is actually a YAML multi-document
    separator. Most YAML parsers will see two documents in one stream and
    return either an error or only the first.
  Fix: Either use two separate fenced YAML blocks (one per sub-pattern)
    with a short Markdown heading between them, or merge into a single
    `States:` block with namespaced states (e.g. `type-to-confirm/idle`,
    `countdown/idle`).

[MEDIUM] pattern-loading-skeleton.md
  Section: 1. Quando Usare
  Issue: No bullet list under "Usa questo pattern quando" — only a
    prose paragraph: "Usa questo pattern SEMPRE quando il contenuto si
    carica in modo asincrono…". Every other pattern provides ≥ 2 bullets
    in this subsection. Fails the consistency requirement that both
    "use when" and "not use when" have bullets.
  Fix: Convert the SEMPRE rule into at least 2 explicit "use when" bullets,
    e.g.:
      - Contenuto > 25% della viewport in fase di caricamento asincrono
      - Layout tabellare / grid che apparirà dopo fetch
      - Pagine di dashboard / detail con più zone da popolare

[MEDIUM] pattern-empty-state.md
  Section: 1. Quando Usare
  Issue: Same issue as Loading Skeleton — "Usa questo pattern SEMPRE…" is
    a single prose sentence, no use-when bullets. Only "Varianti" is
    bulleted (which describes the variants, not when to use the pattern).
  Fix: Add explicit use-when bullets BEFORE Varianti, e.g. "Quando una lista
    può essere vuota", "Quando un fetch ritorna 0 record dopo filtraggio",
    "Quando una pagina destinata a contenuto utente è ancora vuota".

[MEDIUM] index.md
  Section: Pattern Matrix (States covered column)
  Issue: The "States covered" column is wrong or stale for at least 15 of
    17 rows. Examples (all verified against the YAML state machines in the
    files):
      • Data Table — claim "6 (loading, populated, empty, filtered-empty,
        error, refetching)". Actual: 7 — `loading, populated, refetching,
        empty, filtered_empty, error, partial_error`.
      • Form — claim "6". Actual: 7 (idle, typing, field-error, submitting,
        submission-blocked, success, server-error).
      • Search — claim "6 …". Actual: 10 (idle, typing, suggestions,
        selecting, searching, results, no-results, filtered-no-results,
        error, empty-query).
      • Master-Detail — claim "5 (initial, loading-detail, loaded, error,
        selection-changed)". Actual: 7 (initial, list-loaded, selecting,
        detail-loaded, detail-error, list-loading, list-error). Also, the
        state NAMES in the index ("loading-detail", "selection-changed")
        do not exist in the file.
      • Dashboard — claim "5 …". Actual: 6.
      • KPI Card — claim "5 (loading, populated, stale, error, trend)".
        Actual: 4. "trend" is not a state.
      • Modal Flow — claim "5 (closed, opening, open, submitting,
        success, error)" — but lists 6 names. Actual: 7 (adds
        `dismissing`).
      • Drawer/Sheet — claim "4". Actual: 9.
      • Notification — claim "4". Actual: 4 but one name differs
        (`dismissing_paused`, not `dismissing`).
      • Wizard — claim "5 (step-N, step-N-valid, step-N-invalid,
        submitting, complete)". File has no `step-N-valid` or `complete`
        state.
      • Infinite Scroll — claim "5". Actual: 6 (adds `refetching`).
      • Command Palette — claim "4". Actual: 8.
      • Settings Panel — claim "4". Actual: 5 per-section + 2 page-level.
      • Confirmation Flow — claim "4 (idle, confirming, confirmed,
        cancelled) + timeout". None of "confirmed" or "cancelled" exist
        in the file; the file has TypeToConfirm + Countdown each with
        their own states.
      • Empty State — claim "4 (first-visit, filtered, after-action,
        loading→empty)". Actual file uses `search-no-results`, not
        `loading→empty`.
      • Loading Skeleton — claim "5 (table, card, form, dashboard,
        detail)". These are VARIANTS in §3, not states. Actual states: 2.
      • Error Recovery — claim "4 (inline, full-page, toast, boundary)".
        These are VARIANTS in §1, not states. Actual states: 6.
    Only Data Table's actual states match the claim for any 6, by
    coincidence; even there the state name `partial_error` is missing.
  Fix: Audit each row by reading the actual file's `States:` block and
    rewrite the column with (count, list-of-state-ids). Or remove the
    column entirely if not load-bearing — it is currently misleading.

[MEDIUM] index.md
  Section: Header (line 3)
  Issue: `> **Target**: 15 pattern per React + shadcn/ui + Tailwind`. There
    are 17 pattern files in the matrix and 17 files on disk. The "Target:
    15" is stale.
  Fix: Update to `Target: 17 pattern` (or remove the explicit number and
    write "Pattern attuali: vedi matrice").

[MEDIUM] index.md
  Section: Nuovo Pattern Checklist (lines 153–162)
  Issue: Lists "Sezioni obbligatorie" as 8 items but every pattern in the
    library has 9 sections. The list also names them in English ("When to
    use / When NOT to use", "Component composition", etc.) while the
    actual section headers in every pattern are in Italian ("Quando
    Usare", "Componenti shadcn/ui", etc.). A new contributor following
    this checklist will produce a non-conforming pattern.
  Fix: Renumber to 9 (add `QA Checklist`) and translate to the Italian
    section names actually used:
      1. Quando Usare (use / NOT use)
      2. Componenti shadcn/ui
      3. Composizione JSX
      4. State Machine (YAML)
      5. Data Flow
      6. TypeScript Types
      7. Accessibilità
      8. Responsive
      9. QA Checklist

[MEDIUM] Cross-cutting — icon prop typing
  Section: 6. TypeScript Types
  Issue: The "icon" prop is typed three different ways across patterns:
      • `React.ElementType` — pattern-empty-state.md (lines 118, 141)
      • `LucideIcon` — pattern-kpi-card.md (line 195)
      • `React.ComponentType<{ className?: string }>` —
        pattern-settings-panel.md (line 320), pattern-drawer-panel.md
        (line 232), pattern-command-palette.md (line 291)
    Same concept, three types. A consumer code generator would produce
    inconsistent props, and `React.ElementType` is materially looser
    (allows raw DOM strings) than the other two.
  Fix: Standardise on `React.ComponentType<{ className?: string }>` (most
    explicit) or `LucideIcon` (most precise to the actual library used).
    Update all six occurrences.

[MEDIUM] pattern-confirmation.md
  Section: 3. Composizione JSX (line 67)
  Issue: `<Input ... autoComplete="off" />` is good, but the field has no
    `id` and there is no `<Label>` element associated with it. The QA
    checklist (line 426) requires "label chiaro", but the JSX uses a
    `<p>` tag for the instruction, which is not an accessible label. Fails
    the §7 ARIA promise (`aria-label="Digita CONFIRMA per procedere"`,
    line 377). Either the `aria-label` must actually be on the `<Input>`,
    or a `<Label htmlFor="...">` must wrap/precede it.
  Fix: Add `id="confirm-input"` to Input, `aria-label="Digita CONFERMA per
    procedere"`, and remove the standalone `<p>` instruction OR turn it
    into a `<Label htmlFor="confirm-input">`.

### LOW

[LOW] pattern-modal-flow.md
  Section: 9. QA Checklist (line 364)
  Issue: Typo — "messagio" → "messaggio". Same checklist also has minor
    capitalisation drift ("modale" vs "modal" used interchangeably).
  Fix: Spell-check pass for Italian.

[LOW] pattern-settings-panel.md
  Section: 9. QA Checklist (line 421)
  Issue: Typo — "refinenement Zod" → "refinement Zod".
  Fix: Spell-correct.

[LOW] pattern-settings-panel.md
  Section: 9. QA Checklist (line 422)
  Issue: Typo — "possibilià" → "possibilità" (missing `t`).
  Fix: Spell-correct.

[LOW] pattern-wizard.md
  Section: 9. QA Checklist (line 405)
  Issue: Typo — "localStorage ripple stato" → "localStorage ripristina
    stato" (or "ripopola"). "Ripple" is English and not the intended verb.
  Fix: Spell-correct.

[LOW] pattern-notification.md
  Section: 4. State Machine (line 122)
  Issue: "Timer resumé on mouse leave" — `resumé` is French/English for
    CV; correct verb in Italian is "riprende". Also mixes English in an
    otherwise-Italian block.
  Fix: Change to "Timer riprende al mouse leave".

[LOW] pattern-dashboard.md
  Section: 3. Composizione JSX (heading)
  Issue: Section header is `## 3. Composizione JSX (Five-Zone Anatomy)`.
    The parenthetical addition is helpful but breaks the exact section-name
    consistency. Other files use the bare `## 3. Composizione JSX`.
  Fix: Either keep the addition and document it as allowed (suffix
    annotations OK), or move the "Five-Zone Anatomy" note into a
    subheading on the next line.

[LOW] pattern-confirmation.md
  Section: 1. Title (line 1)
  Issue: Title is `# Pattern: Confirmation Flow (AlertDialog / Type-to-
    Confirm / Countdown / Undo)`. Long and inconsistent with the brief
    titles used elsewhere. The parenthetical exposes that this is really
    three patterns merged into one file — a structural smell.
  Fix: Either shorten the title to `# Pattern: Confirmation Flow` and add
    a "Varianti" section like Empty State does, or split into separate
    files (`pattern-type-to-confirm.md`, etc.) and remove the parenthetical.

[LOW] pattern-master-detail.md
  Section: 5. Data Flow (line 184)
  Issue: `queryFn: () => api.getOrderDetail(id!)` uses the non-null
    assertion operator `id!` while the enabling guard is on
    `enabled: !!id`. This is fine at runtime but the spec is supposed to
    teach safe patterns — `id!` propagates "trust me" type-erasure that
    other patterns avoid. Other patterns (pattern-drawer-panel.md
    line 183) use the same `id!` trick. Decide whether this is the
    library's blessed style.
  Fix: Either accept this idiom and add a one-line comment to that effect,
    or replace with `if (!id) return Promise.reject()` style.

[LOW] index.md
  Section: Pattern Matrix (line 89)
  Issue: "Confirmation Flow | Advanced | AlertDialog, Button | 4 (idle,
    confirming, confirmed, cancelled) + timeout | ✅". The `+ timeout`
    addendum is opaque — countdown variant? undo? The notation does not
    appear elsewhere. Also the Template column reads `✅` for all 17
    rows; the README/DISTRIBUTE.md confirms all 17 templates exist, but a
    single-emoji column carries no information.
  Fix: Drop the constant `Template ✅` column, or change it to list the
    template filename(s) for each pattern.

[LOW] index.md
  Section: Decision Tree (line 56–58)
  Issue: The Decision Tree mentions "AlertDialog" specifically as the
    Modal Flow component, but the same row in the matrix
    (`Modal Flow | Interaction | Dialog, AlertDialog`) lists both. The
    tree should mirror the spec or be explicit that AlertDialog is one
    variant.
  Fix: Change `→ Pattern: MODAL FLOW (AlertDialog)` to `→ Pattern: MODAL
    FLOW (Dialog or AlertDialog)`.

[LOW] pattern-data-table.md
  Section: 5. Data Flow (line 249)
  Issue: Same code block contains `mutationFn: (ids: string[]) =>
    api.deleteItems(ids)` followed by a `toast.success` referencing
    `ids.length`. Even when fixed (see HIGH above), the spec should also
    illustrate the `onSuccess` signature explicitly because most React
    Query newcomers miss the second parameter. Worth adding a comment in
    the code.
  Fix: After fixing the runtime bug, add: `// React Query passes (data,
    variables) — `variables` is the array of ids we mutated`.

---

## === CROSS-PATTERN INCONSISTENCIES ===

1. **Section 2 heading drift** (`Componenti shadcn/ui` vs `Componenti`)
   - 15 of 17 use `## 2. Componenti shadcn/ui`.
   - `pattern-kpi-card.md` and `pattern-notification.md` use bare
     `## 2. Componenti`.
   - Impact: A grep / table-of-contents generator that looks for the
     canonical heading will skip those two patterns.

2. **Drawer/Sheet naming triple-spelling**
   - File title: `Drawer/Sheet Panel` (no space)
   - `pattern-master-detail.md`: `Drawer/Sheet` (no space)
   - `pattern-modal-flow.md`: `Drawer / Sheet` (with spaces)
   - `index.md` matrix: `Drawer / Sheet` (with spaces)
   - Filename: `pattern-drawer-panel.md` (no "sheet" at all)
   - Pick one.

3. **State Machine `Pattern:` name casing**
   - PascalCase: `Pattern: DataTable`, `MasterDetail`, `KpiCard`,
     `LoadingSkeleton`, `ModalFlow`, `DrawerSheetPanel`, `ErrorRecovery`,
     `CommandPalette`, `SettingsPanel`, `EmptyState`, `InfiniteScroll`,
     `TypeToConfirm`, `Countdown`.
   - Single-word: `Form`, `Search`, `Dashboard`, `Notification`, `Wizard`.
   - Inconsistent with file/feature naming. The PascalCase is the
     dominant convention but `DrawerSheetPanel` is also the only entry
     that adds the "Panel" suffix to its state-machine name.

4. **`Severity` taxonomy is unstable**
   - Values used across files: `Core`, `Core (cross-cutting)`,
     `Dashboard`, `Dashboard (cross-cutting)`, `Interaction`,
     `Interaction (cross-cutting)`, `Advanced`.
   - Values used in index matrix: `Core`, `Core (cross)`, `Dashboard`,
     `Dashboard (cross)`, `Interaction`, `Interaction (cross)`,
     `Advanced`.
   - "cross-cutting" vs "cross" — pick a spelling.
   - 5 patterns have mismatched severity between file and index (see
     dedicated entries above).

5. **Initial-state convention**
   - 9 patterns use `Initial: idle`.
   - 4 patterns use a domain-specific initial (`closed` for modal/drawer/
     command-palette; `loading` for data-table / dashboard / kpi-card /
     loading-skeleton).
   - 1 uses a meta value: `Initial: variant_determined_by_context`
     (`pattern-empty-state.md`). This is the only non-literal initial state
     in the library and is unparseable by a state-machine generator.
   - `pattern-wizard.md` uses `Initial: step-1_idle` which is a templated
     state name unique to Wizard.
   - Decide whether the field is a literal state name (most patterns) or
     free-form (Empty State).

6. **"loading state" terminology**
   - Files variously refer to: `loading skeleton`, `skeleton`, `loading
     state`, `Loading Skeleton`, `loading`.
   - Specifically `pattern-empty-state.md` line 214 says "loading
     skeleton" and `pattern-data-table.md` line 40 says "Loading state",
     while the canonical pattern is "Loading Skeleton".
   - Pick the proper-noun reference `Loading Skeleton` (linking back to
     the pattern name) when referring to the pattern; lowercase
     `skeleton` for a generic noun.

7. **Stack declarations differ in formatting**
   - `pattern-form.md`: `React Hook Form v7 + Zod + shadcn/ui Form`
   - `pattern-data-table.md`: `shadcn/ui + React Query + Tailwind`
   - `pattern-search.md`: `React + shadcn/ui + React Query + Tailwind`
   - `pattern-infinite-scroll.md`: `React + shadcn/ui + TanStack React Query
     + Tailwind`
   - "React Query" vs "TanStack React Query" for the same library — pick
     one.
   - Inclusion/exclusion of "React" and "Tailwind" is inconsistent — they
     are universal across the library.

8. **`onClick`-on-`<Card>` accessibility pattern**
   - `pattern-master-detail.md` line 58: `<Card ... onClick={...}>` with
     `role="option"` — fine because role is set.
   - `pattern-kpi-card.md` lines 43–48 sets `role={onClick ? "button" :
     "article"}` and `tabIndex={onClick ? 0 : undefined}` — better.
   - `pattern-empty-state.md` puts `onClick` on `<Button>` (correct
     semantic).
   - Cross-pattern: when a `<Card>` becomes interactive, only one pattern
     (kpi-card) gets it right (role + tabIndex + keyboard handlers
     implicit via button role). Master-Detail omits tabIndex and keyboard
     handlers (Enter/Space) entirely.

9. **`useResponsiveSheetSide` hook only declared in one pattern**
   - `pattern-drawer-panel.md` provides a `useResponsiveSheetSide` hook
     (lines 326–338) that decides `right` vs `bottom`.
   - `pattern-modal-flow.md` uses the same conceptual flip
     (`fixed inset-0` on mobile vs centred on desktop) but inlines it
     into Tailwind classes (line 343) with no hook.
   - Either share the hook between patterns or decide the responsive
     story per-pattern is fine. Document the choice.

10. **QA Checklist headings differ in granularity**
    - Most patterns use: `### Pattern-Specific`, `### Stati Verificati`,
      `### Data Flow`.
    - `pattern-loading-skeleton.md` adds `### Accessibilità
      Pattern-Specific` (line 303) — extra header not in the template.
    - `pattern-error-recovery.md` adds `### Accessibilità
      Pattern-Specific` (line 334) — same.
    - `pattern-infinite-scroll.md` adds `### Accessibilità
      Pattern-Specific` (line 483) — same.
    - Three patterns add a 4th heading that the other 14 do not. Either
      promote to the template or fold into the existing sections.

---

## === INDEX ↔ SPEC ALIGNMENT ===

### Files vs Index

| Filename                       | In Index? | Index name                |
|--------------------------------|-----------|----------------------------|
| pattern-data-table.md          | ✓        | Data Table                 |
| pattern-form.md                | ✓        | Form                       |
| pattern-search.md              | ✓        | Search                     |
| pattern-master-detail.md       | ✓        | Master-Detail              |
| pattern-empty-state.md         | ✓        | Empty State                |
| pattern-dashboard.md           | ✓        | Dashboard                  |
| pattern-kpi-card.md            | ✓        | KPI Card                   |
| pattern-loading-skeleton.md    | ✓        | Loading Skeleton           |
| pattern-modal-flow.md          | ✓        | Modal Flow                 |
| pattern-drawer-panel.md        | ✓        | Drawer / Sheet (name drift) |
| pattern-notification.md        | ✓        | Notification               |
| pattern-error-recovery.md      | ✓        | Error Recovery             |
| pattern-wizard.md              | ✓        | Wizard                     |
| pattern-infinite-scroll.md     | ✓        | Infinite Scroll            |
| pattern-command-palette.md     | ✓        | Command Palette            |
| pattern-settings-panel.md      | ✓        | Settings Panel             |
| pattern-confirmation.md        | ✓        | Confirmation Flow          |

**Result**: 17 files, 17 index entries. **No orphans in either
direction.**

### Severity — File vs Index

| Pattern              | File           | Index Matrix      | Match |
|----------------------|----------------|-------------------|-------|
| Data Table           | Core           | Core              | ✓     |
| Form                 | Core           | Core              | ✓     |
| Search               | Core           | Core              | ✓     |
| Master-Detail        | Core           | Core              | ✓     |
| Empty State          | Core (cross-cutting) | Core (cross) | ~ (spelling)|
| Dashboard            | Dashboard      | Dashboard         | ✓     |
| **KPI Card**         | **Core**       | **Dashboard**     | **✗** |
| Loading Skeleton     | Dashboard (cross-cutting) | Dashboard (cross) | ~ |
| Modal Flow           | Interaction    | Interaction       | ✓     |
| **Drawer / Sheet**   | **Core**       | **Interaction**   | **✗** |
| Notification         | Interaction    | Interaction       | ✓     |
| Error Recovery       | Interaction (cross-cutting) | Interaction (cross) | ~ |
| **Wizard**           | **Core**       | **Advanced**      | **✗** |
| Infinite Scroll      | Advanced       | Advanced          | ✓     |
| **Command Palette**  | **Core**       | **Advanced**      | **✗** |
| Settings Panel       | Advanced       | Advanced          | ✓     |
| **Confirmation Flow**| **Interaction**| **Advanced**      | **✗** |

**5 hard mismatches**, **3 spelling-only drift** (cross-cutting / cross),
**9 exact matches**. The index cannot be trusted to communicate severity.

### Dipendenze — File vs Index

Spot-check across all 17 files:
- Index "Dipende da" column maps loosely to the file's `**Dipende da**`
  line but uses different formats:
  - Index uses very short, comma-separated lists (e.g. "Pagination, Select,
    Badge" for Data Table).
  - Files use slightly longer lists with more detail (e.g. "Pagination,
    Select, Badge, Input, Checkbox, DropdownMenu" for Data Table — 6 vs 3).
- `pattern-infinite-scroll.md` lists `Card, Skeleton, Button, ScrollArea,
  Badge (optional)` but index says `— (IntersectionObserver)`. The index is
  describing the *underlying browser API*, not the shadcn dependencies.
  Different axes; this column needs a definition.
- Inconsistent treatment. Pick: "list canonical shadcn dependencies" or
  "list the most distinctive single dependency".

### Stati Coperti — File vs Index

See dedicated MEDIUM finding above: **15 of 17 rows are wrong or
contradictory**.

### Decision Tree — internal consistency

- The Decision Tree (lines 11–65 of index.md) does NOT reference Confirmation
  Flow explicitly; the only mention is via "Modal Flow" or "AlertDialog".
  Confirmation Flow has its own pattern (HIGH-frequency: type-to-confirm,
  countdown, undo) but is invisible in the tree.
- Likewise Loading Skeleton appears under "Stato transitorio" but is not
  cross-linked to its pattern entry the way Empty State is.

**Fix**: Add `Conferma di azione distruttiva CRITICA / type-to-confirm? →
Pattern: CONFIRMATION FLOW` under the CONFERMARE branch, between Modal
Flow and Drawer.

### Nuovo Pattern Checklist — internal consistency

See dedicated MEDIUM finding above: lists 8 sections, library has 9; uses
English, files use Italian.

---

## Summary

**Issues found**: 38 total.
- **HIGH**: 9 (must fix before this library is treated as authoritative)
- **MEDIUM**: 18 (fix in a follow-up sweep)
- **LOW**: 11 (next maintenance pass)

**Recommendation**: NEEDS CHANGES

Top three actions, ranked by leverage:
1. **Audit `index.md`** end-to-end against every pattern file. The matrix's
   `Severity` and `States covered` columns are misleading enough that they
   should be treated as broken. Fix or delete.
2. **Validate every JSX example** with a `tsc --noEmit` pass on a minimal
   scaffold. The 5 HIGH JSX issues are the kind a typechecker catches in
   under a second.
3. **Fix `pattern-confirmation.md` state machine YAML**, and consider
   splitting the three variants (Type-to-Confirm, Countdown, Undo) into
   sibling patterns or formal Varianti sections; the current "two YAML
   documents in one fenced block" is the only one of its kind in the
   library.

---

*Generated by `forge-reviewer` subagent, adversarial protocol. No issue
suppressed; positive observations omitted per skill rules.*
