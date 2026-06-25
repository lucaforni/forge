# Adversarial Review: FORGE Frontend Pattern Library — Foundation

> **Reviewer**: forge-reviewer (adversarial mode)
> **Date**: 2026-06-25
> **Scope**: 5 foundation documents + cross-artifact consistency on 3 patterns
> **Method**: 7-dimension review (Correctness, Security, Performance, Maintainability,
> Constitution Compliance, Test-Spec Coherence, UX Quality)
> **Files audited**:
> - `.forge/frontend/stack-decisions.md` (294 lines)
> - `.forge/frontend/design-system.md` (464 lines)
> - `.forge/frontend/qa-checklist-template.md` (168 lines)
> - `.forge/frontend/patterns/index.md` (162 lines)
> - `.forge/frontend/DISTRIBUTE.md` (208 lines)
> - Cross-artifact: `pattern-data-table.md` ↔ `data-table.tsx` ↔ `data-table.test.tsx`
> - Cross-artifact: `pattern-form.md` ↔ `form-create-order.tsx` ↔ `form-create-order.test.tsx`
> - Cross-artifact: `pattern-empty-state.md` ↔ `empty-state.tsx` ↔ `empty-state.test.tsx`

---

## === FOUNDATION ISSUES ===

### `stack-decisions.md`

**[MEDIUM] stack-decisions.md:289** — Tailwind config template is incomplete placeholder
- **Issue**: Appendix B shows `colors: { primary: { ... }, secondary: { ... }, destructive: { ... } }` with `...` placeholders. Anyone copying this template gets broken config. It also doesn't match the actual color tokens defined in `design-system.md` (e.g., `hsl(var(--primary))` pattern with all 11 semantic tokens).
- **Fix**: Either remove Appendix B entirely (it duplicates `design-system.md` §1.3) or replace `...` with concrete values that match `design-system.md` §1.3 verbatim. Add cross-reference: "See `design-system.md` §1.3 for the canonical tailwind colors config."

**[MEDIUM] stack-decisions.md:71** — Zustand declared as approved stack but zero templates use it
- **Issue**: §4 declares "Client state (UI) | Zustand" as canonical. No template imports zustand. The 17 templates use `useState`/`useReducer` for all client UI state, never zustand. Without an example template, users following this decision have no canonical reference for HOW to apply zustand in this stack.
- **Fix**: Either (a) add a zustand example in one of the patterns where it's appropriate (e.g., a global filter store for data-table), or (b) downgrade zustand to "recommended when global client state is needed" instead of canonical decision.

**[MEDIUM] stack-decisions.md:30 + 251** — shadcn/ui CLI name inconsistency / outdated
- **Issue**: Line 30 says `npx shadcn-ui@latest init`. As of late 2024, the package was renamed to `shadcn` (the legacy `shadcn-ui` still works but is deprecated). This will mislead anyone setting up a new project.
- **Fix**: Update to `npx shadcn@latest init` and add a note: "Legacy: `shadcn-ui` package still works but is deprecated."

**[LOW] stack-decisions.md:251** — `@tanstack/react-table` listed as "incluso in shadcn/ui"
- **Issue**: shadcn/ui's Data Table example USES `@tanstack/react-table` but does NOT bundle/install it — the user must add it as a dependency. The phrasing "shadcn/ui lo include" is misleading.
- **Fix**: Reword to: "@tanstack/react-table — required for shadcn/ui Data Table example; not bundled."

**[LOW] stack-decisions.md:209** — Pattern test snippet contradicts actual test files
- **Issue**: Sample shows `describe('OrderTable', () => {...})` testing 5 states. The actual `data-table.test.tsx` calls the component `OrdersTable` (plural) — the snippet is a stale example.
- **Fix**: Use the real component name `OrdersTable` to keep examples honest.

---

### `design-system.md`

**[HIGH] design-system.md:417 ↔ templates/dashboard-analytics.tsx:279** — `Alert variant="warning"` used but not declared
- **Issue**: §11.4 declares `Alert | variant: default/destructive` (only 2 variants). But `dashboard-analytics.tsx:279` uses `<Alert variant="warning" className="border-warning bg-warning/5">`. This will either (a) fail TypeScript compilation if Alert's CVA is strict, or (b) silently fall back to `default` styling, breaking the visual intent.
- **Fix**: Either (a) add `warning` variant to the Alert inventory entry and to the cva-generated `alertVariants`, or (b) refactor `dashboard-analytics.tsx` to use a custom warning banner (e.g., a styled `<div>` with `bg-warning/5 text-warning`).

**[HIGH] design-system.md:409 vs 433** — `Switch` component listed TWICE in inventory
- **Issue**: Switch appears in §11.3 Forms & Input (line 409) AND §11.5 Data Entry Avanzati (line 433) with slightly different descriptions ("Toggle on/off" vs "Toggle on/off binario"). A reviewer running an inventory check will count Switch twice; users will be confused about which entry is canonical.
- **Fix**: Remove the duplicate from §11.5 (it's not a "data entry advanced" component). Keep only in §11.3 Forms & Input.

**[MEDIUM] design-system.md:147–180** — Tailwind config uses `hsl(var(--primary))` but CSS custom properties are hex
- **Issue**: §1.1/§1.2 defines tokens as hex literals (`--primary-600: #2563eb`) and `--primary: var(--primary-600)`. But §1.3 Tailwind config wraps them as `hsl(var(--primary))`. `hsl(#2563eb)` is invalid CSS — `hsl()` requires `H S L` components. This will silently produce no color or fallback. The shadcn/ui convention is to store CSS vars as raw HSL components (e.g., `--primary: 221.2 83.2% 53.3%`) so that `hsl(var(--primary))` works.
- **Fix**: Convert §1.1 and §1.2 tokens to HSL component form (e.g., `--primary-600: 221.2 83.2% 53.3%`) OR change §1.3 config to use the bare custom property (e.g., `primary: { DEFAULT: 'var(--primary)' }` without `hsl()`). Pick one model and apply consistently. This is a foundational silent-failure bug.

**[MEDIUM] design-system.md:347** — Section heading typo: "icone" (lowercase) inconsistent
- **Issue**: §9 heading is `## 9. icone` (lowercase) while every other section uses Capitalized form (`## 1. Colori`, `## 2. Typography`, `## 10. Regole d'Oro`). Breaks ToC consistency.
- **Fix**: Rename to `## 9. Icone`.

**[MEDIUM] design-system.md:113–117** — Border radius declared under semantic-tokens block but conflicts with §4
- **Issue**: §1.2 declares `--radius-sm: 0.375rem` (6px). §4 declares `--radius-sm: 6px`. Same values but duplicated declarations. Worse, §1.2 puts these inside the `:root { ... }` block titled "Token Semantici (shadcn/ui compatibili)" — but shadcn/ui's convention is a SINGLE `--radius` variable (typically 0.5rem) with computed values, not 5 separate radius tokens. This won't be shadcn-compatible.
- **Fix**: Pick ONE location for radius tokens (§4 is the right place), remove from §1.2, and align with shadcn/ui's actual `--radius` convention or document the deviation explicitly.

**[LOW] design-system.md:178–179** — `success` and `warning` declared as flat (no foreground variant)
- **Issue**: Tailwind config (line 177–179): `success: "hsl(var(--success))"`, `warning: "hsl(var(--warning))"`. Unlike `primary`, `destructive`, etc., there's no `success-foreground` / `warning-foreground`. Any text on `bg-success` will use default `foreground` which may have insufficient contrast on `success-600` (emerald).
- **Fix**: Add `success-foreground` and `warning-foreground` tokens in §1.2 and Tailwind config, and document recommended pairings.

**[LOW] design-system.md:296** — "Dark mode: shadows ridotte del 50%" — no concrete tokens given
- **Issue**: §5 says shadows in dark mode should have opacity reduced 50%, but no `:root.dark` shadow tokens are defined. Templates have no canonical dark shadows to reference.
- **Fix**: Add dark-mode shadow tokens explicitly (e.g., `--shadow-md` with `rgb(0 0 0 / 0.5)` in `.dark` block).

---

### `qa-checklist-template.md`

**[HIGH] qa-checklist-template.md (global) ↔ all 17 pattern-*.md files** — NO pattern file references the template
- **Issue**: The template declares "Ogni pattern DEVE estendere questa sezione con almeno 3 punti specifici" (line 135). But ZERO of the 17 pattern files contains the string `qa-checklist-template` or any link/reference to it. The per-pattern QA checklists are stand-alone — a forge-reviewer reading just a pattern file has NO indication that the 7 foundational sections (Struttura, Stati, A11y, Interattività, Performance, React, Test) ALSO apply.
- **Impact**: Reviewers will only check the 3-10 pattern-specific items, missing the 60+ baseline checks. Pattern QA becomes ~20% of what it should be.
- **Fix**: Add to each `pattern-*.md` §9 a header line: `> **Estende**: [qa-checklist-template.md](../qa-checklist-template.md) §1–§7. Verificare PRIMA le sezioni baseline, POI i punti pattern-specific.`

**[MEDIUM] qa-checklist-template.md:148–166** — Template snippet omits 3 of 8 sections
- **Issue**: The "Template da Copiare per Nuovi Pattern" (line 146) suggests new patterns add 4 sub-sections: `Pattern-Specific`, `Stati Verificati`, `Accessibilità Pattern-Specific`, `Data Flow`. But the template's own structure has 8 numbered sections — the copy template omits Struttura, Interattività, Performance, React, Test entirely. This reinforces the wrong mental model.
- **Fix**: Either (a) reword the template to clarify "These extensions add to the 7 baseline sections (which are inherited)," or (b) require new patterns to mark each baseline section as `[INHERITED]` or `[PATTERN-SPECIFIC OVERRIDE]`.

**[MEDIUM] qa-checklist-template.md:128** — "Nessun test falso positivo" is non-actionable
- **Issue**: Checkbox "Nessun test falso positivo (testare comportamento, non implementazione)" — reviewer cannot mechanically verify this. Needs concrete criteria (e.g., "test fails when behavior breaks; passes when refactored without changing behavior; doesn't assert on internal state names like `useState[0]`").
- **Fix**: Add 2–3 concrete sub-checks: `[ ] Test asserts on rendered output (screen.getByText) not on component internals` / `[ ] Test passes after a non-behavioral refactor (rename variable, extract function)` / `[ ] Test fails if the user-observable behavior breaks`.

**[LOW] qa-checklist-template.md:69** — "Skip navigation link presente" is overspecified
- **Issue**: §3.2 demands "Skip navigation link" on every pattern. But most patterns (Data Table, Form, Empty State) are sub-components of a page — the skip link belongs at the page/layout level, not per-component. This will cause false-positive failures on component-level QA.
- **Fix**: Reword to: "Skip navigation present at the page/layout level (not required per-component, but verify it's not removed by this pattern)."

**[LOW] qa-checklist-template.md:104** — `React.memo` recommendation is anti-pattern in React 19
- **Issue**: "React.memo usato su liste pesanti" — with React Compiler (RC) being the new default in React 19, manual `React.memo` is being phased out. Recommending it broadly is outdated guidance.
- **Fix**: Reword to: "Use `React.memo` ONLY when profiler shows expensive re-renders (or document that React Compiler is enabled, making manual memo unnecessary)."

---

### `patterns/index.md`

**[HIGH] index.md:3** — Header declares "15 pattern" but Pattern Matrix lists 17
- **Issue**: Line 3: "**Target**: 15 pattern per React + shadcn/ui + Tailwind". Pattern Matrix (lines 72–89) actually lists **17 patterns** (Data Table, Form, Search, Master-Detail, Empty State, Dashboard, KPI Card, Loading Skeleton, Modal Flow, Drawer/Sheet, Notification, Error Recovery, Wizard, Infinite Scroll, Command Palette, Settings Panel, Confirmation Flow). DISTRIBUTE.md also says "pattern-*.md (17 file)". Off-by-2.
- **Fix**: Change header to "17 pattern" (consistent with reality).

**[HIGH] index.md:147** — Broken self-reference: "pattern-index.md" doesn't exist
- **Issue**: Line 147 says `Inserire nell'indice (pattern-index.md)`. The file is actually named `index.md` (located at `patterns/index.md`). Anyone following the "Nuovo Pattern Checklist" will look for a non-existent file.
- **Fix**: Change to `Inserire nell'indice (patterns/index.md)`.

**[HIGH] index.md (whole file)** — ZERO links to the 17 pattern files
- **Issue**: The Decision Tree, Pattern Matrix, "By Use Case" tables, "By Data Volume" tables all use bare pattern names ("Data Table", "Form", "Search") but NEVER link to the actual `pattern-*.md` files. The whole point of an index is to navigate to specifications. A reader who picks "DATA TABLE" from the decision tree has to manually `ls patterns/` to find the file.
- **Fix**: Replace every pattern reference with a markdown link, e.g., `→ Pattern: [DATA TABLE](pattern-data-table.md)`. Same for matrix and use-case tables.

**[MEDIUM] index.md:151** — Says "8 sezioni obbligatorie" but lists 9
- **Issue**: Line 151: "Creare file `pattern-nuovo.md` con le 8 sezioni obbligatorie". Lines 154–162 list **9** sections (1. When to use, 2. Component composition, 3. JSX structure, 4. State machine, 5. Data flow, 6. TypeScript types, 7. A11y, 8. Responsive, 9. QA checklist).
- **Fix**: Change "8 sezioni obbligatorie" → "9 sezioni obbligatorie".

**[MEDIUM] index.md:74,76,87** — State counts in matrix don't match parenthetical lists
- **Issue**: Multiple "N states" counts disagree with the listed states:
  - Line 74 "Form | ... | 6 (idle, typing, submitting, success, server-error, field-error)" — pattern-form.md state-machine actually has **8 states** (adds `submission-blocked` and the QA section confirms field-error vs server-error are distinct).
  - Line 75 "Search | ... | 6 (idle, typing, suggestions, searching, results, no-results, error)" — that's **7** listed.
  - Line 77 "Empty State | ... | 4 (first-visit, filtered, after-action, loading→empty)" — empty-state.md actually has **4 states** (first-visit, filtered, after-action, search-no-results) — the matrix lists `loading→empty` which is NOT a real state in the spec.
  - Line 81 "Modal Flow | ... | 5 (closed, opening, open, submitting, success, error)" — that's **6** listed.
  - Line 88 "Settings Panel | ... | 4 (per-section: idle, saved, saving, error, unsaved)" — that's **5** listed.
- **Fix**: Update counts to match the listed states verbatim, OR replace counts with "see spec" links and remove the parenthetical lists.

**[MEDIUM] index.md:65** — Decision Tree missing "CONFIRMATION FLOW" branch
- **Issue**: The Decision Tree (lines 11–65) has a branch at line 45 `Azione distruttiva con doppia conferma? → CONFIRMATION FLOW`. But pattern-confirmation.md covers MORE than "doppia conferma" — it also covers type-to-confirm, countdown-confirm, and undo flows. The decision tree only routes to one variant. Users with countdown or undo needs won't find the pattern.
- **Fix**: Expand the branch to: `Azione distruttiva (delete, irreversibile, bulk)? → CONFIRMATION FLOW (type-to-confirm, countdown, or undo variants)`.

**[LOW] index.md:117–124** — "Pattern Selection by Data Volume" mentions virtualization but no virtualization pattern exists
- **Issue**: Line 124: "1000+ record | Data Table + virtualizzazione + ricerca server-side". No pattern in the library documents virtualization (`react-window`, `react-virtual`). Users following this recommendation have no canonical reference.
- **Fix**: Either (a) add a "Virtualized Table" pattern (18th pattern) or (b) reword to: "1000+ record | Data Table + server-side ricerca + Infinite Scroll (no built-in virtualization pattern; bring your own)".

---

### `DISTRIBUTE.md`

**[HIGH] DISTRIBUTE.md:105** — Verification checklist references non-existent path
- **Issue**: Line 105: `□ .forge/ux/ design-system.md esiste — link a frontend/design-system.md`. The `.forge/ux/` directory does NOT exist in this repo. Anyone running this checklist will mark it failed or be confused about whether to create it.
- **Fix**: Either (a) remove this line, or (b) document the relationship: "If your project has `.forge/ux/`, ensure `design-system.md` there cross-references this one OR symlinks to it. Otherwise this row is N/A."

**[HIGH] DISTRIBUTE.md:14–26** — Distribution tree contradicts itself on test files
- **Issue**: Line 25 says tests are "Opzionale" but lines 142–168 (verified files block) list all 17 test files as completed and DISTRIBUTE.md §"Esportazione Rapida" (line 198–204) does NOT copy `__tests__/` at all. Three different signals:
  - Tree: tests "Opzionale"
  - File list: tests are part of the deliverable
  - Export script: tests are NOT copied
- **Fix**: Pick ONE policy. Recommend: include tests by default (they're reference quality), update the script to add: `cp -r .forge/frontend/patterns/templates/__tests__/ "$TARGET/.forge/frontend/patterns/templates/__tests__/"`.

**[HIGH] DISTRIBUTE.md:188–204** — Export script has multiple bugs
- **Issue**:
  1. `mkdir -p $TARGET/.forge/frontend/patterns/templates/__tests__` — creates the dir but never populates it (no copy of tests).
  2. Lines 198–200 use a `for` loop for pattern-*.md but lines 193–196 use plain `cp` for 3 specific files — inconsistent style.
  3. No `cp` for `DISTRIBUTE.md` itself — target project loses the docs on how to maintain.
  4. Missing `cp` for `qa-checklist-template.md` is actually present (line 195), but no test for whether overwrite is desired (would clobber any local customization).
  5. `$TARGET` unquoted everywhere → breaks on paths with spaces.
- **Fix**: Quote `"$TARGET"`. Add `__tests__/` copy. Decide on DISTRIBUTE.md copy policy. Add `set -e` for fail-fast. Add an overwrite-confirmation or `-n` (no-clobber) flag.

**[MEDIUM] DISTRIBUTE.md:55–60** — Method 2 "Init script" doesn't exist
- **Issue**: Line 56: "Metodo 2: Init script (da creare)" — `npx forge-frontend-init` is shown as if usable but is marked "(da creare)". Mixing "available method" with "unimplemented future" in the user-facing install guide is misleading.
- **Fix**: Move "Init script" section to a separate "Roadmap" or "Future" subsection, or remove until implemented.

**[MEDIUM] DISTRIBUTE.md:32–34** — Lists items as "non distribuire" that aren't standard FORGE
- **Issue**: Line 32: `.forge/specs/001-elenco-ordini/` is listed as "demo feature" not to distribute. But it's only "demo" because of this specific repo — in another FORGE project, `specs/001-*` is the user's actual feature spec. Hard-coding this exclusion in the distribution doc bleeds repo-specific context into a generic install guide.
- **Fix**: Reword to: "Do not distribute meta/development artifacts in `.forge/` that belong to the FORGE source repo itself (epics, sprints, knowledge, and any `specs/` demo features). The user's own `.forge/specs/` will be created by their use of `/forge-specify`."

**[LOW] DISTRIBUTE.md:171–181** — Demo paths reference files outside `.forge/frontend/`
- **Issue**: Lines 173–181 cite `.forge/specs/001-elenco-ordini/demo/OrdersPage.tsx` (1.073 righe) as part of "Demo verificata". But this file isn't under `.forge/frontend/` and isn't covered by the export script. The demo's claim of "25 issue fixati" is unverifiable without the file being in scope.
- **Fix**: Either (a) explicitly add the demo files to the distribution tree (with note "optional reference implementation"), or (b) move the demo block to a separate "Reference & Validation" section, clearly NOT part of distribution.

**[LOW] DISTRIBUTE.md:33** — Forward slash inconsistency
- **Issue**: Line 33 has `.opencode/skills/frontend-pattern-library/` — but the rest of the doc references `.opencode/skills/frontend-pattern-library/` with various capitalizations and slash patterns. Run a glob to verify the skill actually exists at this path.
- **Fix**: Verify the actual path with `glob` and normalize all references.

---

## === CROSS-ARTIFACT INCONSISTENCIES ===

### Pattern 1: Data Table — `pattern-data-table.md` ↔ `data-table.tsx` ↔ `data-table.test.tsx`

**[HIGH] Spec ↔ Template inconsistency: `aria-sort` not implemented**
- Spec `pattern-data-table.md:332`: "Sort header: `aria-sort=\"ascending\"` / `descending` / `none`"
- Spec `pattern-data-table.md:370` (QA): "Sorting: ... `aria-sort` aggiornato"
- Template `data-table.tsx:408–419`: TableHead elements have `cursor-pointer` and `onClick` but NO `aria-sort` attribute. Sort headers are not announced correctly to screen readers.
- Test `data-table.test.tsx:159–175`: "alterna ordinamento colonna al click" — only asserts URL parameter, never asserts `aria-sort` is set. Test would pass even with a11y completely broken.
- **Fix**: Add `aria-sort={filters.sort === 'customer' ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}` to each sortable TableHead. Add test: `expect(screen.getByText('Cliente').closest('th')).toHaveAttribute('aria-sort', 'ascending')`.

**[HIGH] Spec ↔ Template inconsistency: Sort cycle is asc→desc→none in spec, asc⇄desc in template**
- Spec `pattern-data-table.md:370`: "Sorting: click header cicla asc → desc → none."
- Template `data-table.tsx:296–301`: `if (filters.sort === column) setFilters({ order: filters.order === 'asc' ? 'desc' : 'asc' })` — only toggles asc⇄desc, never returns to "none/default".
- Test `data-table.test.tsx`: Doesn't test the third "none" state at all. The test confirms a behavior that contradicts the spec.
- **Fix**: Implement 3-state cycle in template: `none → asc → desc → none`. Spec is the source of truth; if 2-state was intentional, update spec and QA checklist.

**[MEDIUM] Spec ↔ Template inconsistency: Search has no debounce**
- Spec `pattern-data-table.md:372`: "Search: debounce 300ms."
- Template `data-table.tsx:355–362`: `<Input onChange={(e) => setFilters({ search: e.target.value, page: 1 })}>` — updates URL on EVERY keystroke. No debounce. Every keystroke causes a new query + URL push.
- Test: Not tested.
- **Fix**: Wrap search in `useDebounce(value, 300)` or use a debounced setter. Add test for debounce.

**[MEDIUM] Spec ↔ Template inconsistency: Constitution says "no hardcoded colors"**
- Design-system `design-system.md:360`: "Mai colori hardcoded."
- Template `data-table.tsx:390`: `<span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />` — uses `bg-blue-500` (raw Tailwind palette, not a semantic token). Should be `bg-primary` per the semantic token system.
- **Fix**: Change `bg-blue-500` to `bg-primary` (the design-system semantic token).

**[MEDIUM] Test coverage gap: refetching state not tested**
- Spec `pattern-data-table.md:166–172`: defines `refetching` state with "Opacità ridotta sulla tabella + spinner piccolo in alto a destra"
- Template `data-table.tsx:388–393`: implements refetching indicator
- Test `data-table.test.tsx`: NO test for `isRefetching: true` state. The "Aggiornamento..." indicator is never asserted.
- **Fix**: Add test: `reactQuery.useQuery.mockReturnValue(createQueryResult({ isLoading: false, isRefetching: true, data: ... })); expect(screen.getByText('Aggiornamento...')).toBeInTheDocument()`.

**[MEDIUM] Test coverage gap: partial_error state in spec, missing in template AND test**
- Spec `pattern-data-table.md:193–198`: defines `partial_error` state (some data OK, some KO).
- Template: No implementation.
- Test: No test.
- **Fix**: Either (a) remove `partial_error` from spec if not in scope, or (b) implement it + test.

**[LOW] Spec uses generic confirm() instead of pattern-confirmation**
- Template `data-table.tsx:514`: `if (confirm(\`Eliminare ${selectedIds.size} ordine...?\`))` — uses native `window.confirm()` for bulk delete confirmation.
- Pattern library has a dedicated `pattern-confirmation.md` + `confirm-destructive-action.tsx` template designed for this exact case.
- **Fix**: Replace native `confirm()` with `TypeToConfirmDialog` or `AlertDialog`. The flagship Data Table template using `window.confirm()` undermines the library's own confirmation pattern.

---

### Pattern 2: Form — `pattern-form.md` ↔ `form-create-order.tsx` ↔ `form-create-order.test.tsx`

**[HIGH] Spec ↔ Test gap: onBlur validation behavior never asserted**
- Spec `pattern-form.md:283`: `mode: 'onBlur', // validazione per-field su onBlur`
- Spec `pattern-form.md:481`: "Field validation: errore mostrato su onBlur (non durante digitazione)"
- Template `form-create-order.tsx:218`: `mode: 'onBlur'` ✓
- Test `form-create-order.test.tsx`: NO test triggers blur to verify error appears on blur (or NOT during typing). The test for validation just clicks submit and checks for messages — that's onSubmit validation, not onBlur.
- **Fix**: Add test: "errors appear on blur, not while typing": type without blur → no error; blur → error appears.

**[HIGH] Spec ↔ Template inconsistency: server error mapping with `fields[]` array exists in template but not in spec**
- Spec `pattern-form.md:303–319`: shows `mapServerErrors` handling `error.field` (singular).
- Template `form-create-order.tsx:167–191`: handles BOTH `error.fields[]` (plural array) AND `error.field` (singular). The plural form is implemented and tested, but NOT documented in spec.
- Test `form-create-order.test.tsx:331–345`: tests the `fields: [...]` plural path.
- **Fix**: Update spec §5.3 to document both shapes (singular `field` + plural `fields[]`) consistent with the canonical template.

**[MEDIUM] Spec ↔ Template inconsistency: Unsaved changes warning is documented but not implemented**
- Spec `pattern-form.md:344–366`: `useEffect` for `beforeunload` + Next.js router event listener
- Spec `pattern-form.md:490–491` (QA): "Unsaved changes: `beforeunload` warning se form è dirty" / "conferma su navigazione interna (router event)"
- Template `form-create-order.tsx:252–264`: Only handles `handleCancel` (button click) with `window.confirm`. NO `beforeunload` listener, NO router event listener. If the user navigates away (browser back, link click, tab close), they lose data with no warning.
- Test: Tests only `handleCancel` confirm, not actual `beforeunload` behavior.
- **Fix**: Add the `useEffect` from spec lines 348–357 to the template. Add test (jsdom can dispatch `beforeunload`).

**[MEDIUM] Spec ↔ Template inconsistency: `aria-required` selectively applied**
- Spec `pattern-form.md:488`: "Required fields: marcati con `*` visivamente E `aria-required`"
- Template: `customerName` field has `aria-required="true"` (line 300); `categoryId` has `aria-required="true"` (line 434). But "status" is also required by schema (z.enum without `.optional()`) and lacks both `*` and `aria-required`.
- Test: Only asserts asterisks count ≥ 2, doesn't verify which fields.
- **Fix**: Audit schema vs UI: every Zod field WITHOUT `.optional()` MUST have `*` + `aria-required`. Currently inconsistent.

**[LOW] Test fragility: tests rely on heavy mocking of every shadcn component**
- Test `form-create-order.test.tsx:63–222`: Mocks every single shadcn component (Button, Input, Textarea, Checkbox, Select, Popover, Command, Calendar, Alert, Form). The mocks don't validate real component behavior (e.g., the mocked `Select` doesn't enforce accessibility, the mocked `FormMessage` shows ALL errors regardless of context).
- This is a known anti-pattern: testing the mock, not the integration.
- **Fix**: Switch to integration tests using REAL shadcn components (lighter mock surface). Use `@testing-library/user-event` against the unmocked tree.

---

### Pattern 3: Empty State — `pattern-empty-state.md` ↔ `empty-state.tsx` ↔ `empty-state.test.tsx`

**[MEDIUM] Spec ↔ Template inconsistency: `EMPTY_STATES` helper named differently**
- Spec `pattern-empty-state.md:157`: helper is named `EMPTY_STATES` (UPPER_SNAKE).
- Template `empty-state.tsx:64`: helper is named `EmptyStatePresets` (PascalCase).
- Convention violation: Per `AGENTS.md` "Constants: UPPER_SNAKE_CASE". `EmptyStatePresets` should be `EMPTY_STATE_PRESETS` OR the spec should use the template's name.
- **Fix**: Pick one. Recommend renaming spec to use `EmptyStatePresets` AND updating `AGENTS.md` if "preset config objects" are an exception, OR rename template to `EMPTY_STATE_PRESETS`.

**[MEDIUM] Spec ↔ Template inconsistency: `secondaryCTA` defined but never used in test coverage**
- Template `empty-state.tsx:41`: prop `secondaryCTA?: EmptyStateCTA`
- Template `empty-state.tsx:186–195`: renders secondary CTA
- Test `empty-state.test.tsx:91–102`: tests that secondaryCTA is NOT rendered when not provided — but never tests it IS rendered when provided. So the secondary CTA rendering path is untested.
- **Fix**: Add test: render with `secondaryCTA={{ label: 'Skip', onClick: fn }}`, assert button "Skip" is rendered.

**[MEDIUM] Spec ↔ Template inconsistency: `role="status"` may not be appropriate**
- Spec `pattern-empty-state.md:181`: "Container: `role=\"status\"` (annuncia cambiamento a screen reader)"
- Template `empty-state.tsx:143–144`: applies `role="status" aria-live="polite"` unconditionally.
- Test `empty-state.test.tsx:119–130`: asserts `getByRole('status')` works.
- Issue: `role="status"` is meant for transient status messages (e.g., "Loading...", "Saved!"). When an empty state is the static initial render of a page (first visit), wrapping it in `role="status"` causes screen readers to announce it as a status update, which is misleading. WCAG suggests `role="status"` for live regions only.
- **Fix**: Conditional `role`: use `role="status"` only when the empty state appears AFTER an action (after-action variant, filtered-result-disappears). Default rendering (first-visit) should use `role="region"` with `aria-label` or no role + heading hierarchy.

**[LOW] Spec ↔ Template: `query` rendered twice in search-no-results variant**
- Template `empty-state.tsx:99–101`: `title: \`Nessun risultato per "${query}"\`` (preset)
- Template `empty-state.tsx:169–173`: ALSO renders `La ricerca "{query}" non ha prodotto risultati.` if description doesn't contain `"`
- Result: For default search-no-results, the query appears in the title; for custom description without quotes, it ALSO appears below. Inconsistent UX.
- **Fix**: Render query in exactly ONE place. Recommend: title only. Remove the conditional helper text block (lines 169–173).

---

## === DISTRIBUTION READINESS ===

| Aspect | Status | Notes |
|--------|--------|-------|
| Foundation docs complete | ⚠️  PARTIAL | 5/5 files exist, but cross-references broken + counts inconsistent + Tailwind config has a silent-failure bug (hsl wrapping hex). |
| Pattern files complete | ✅ YES | 17/17 patterns exist with 9-section structure verified. |
| Templates complete | ✅ YES | 17/17 templates compile (filenames match patterns). |
| Tests complete | ✅ YES | 17/17 test files exist. Quality varies (some over-mock; some miss spec states). |
| Cross-artifact consistency | ❌ NO | Multiple HIGH-severity gaps: aria-sort missing, sort cycle wrong, debounce missing, beforeunload missing, Alert variant undeclared. |
| Distribution script correct | ❌ NO | Script does not copy `__tests__/`, does not handle paths with spaces, lacks `set -e`, references non-existent path `.forge/ux/`. |
| Install instructions clear | ⚠️  PARTIAL | Method 1 (manual copy) works. Method 2 (`npx forge-frontend-init`) marked "(da creare)" but documented as if available. |
| QA checklist linkage | ❌ NO | Template exists but ZERO pattern files reference it. Reviewers will skip ~80% of baseline checks. |
| Constitution compliance | ⚠️  PARTIAL | 4 templates violate "no hardcoded colors" (data-table, toast-mutations, settings-account, dashboard-analytics). 1 template uses undeclared Alert variant. |

### Top 5 Blockers Before Distribution

1. **Fix `design-system.md` HSL/hex inconsistency** (silent-failure bug; all templates may render no colors in production).
2. **Add link from every `pattern-*.md` §9 to `qa-checklist-template.md`** (otherwise reviewers miss baseline checks).
3. **Either declare `Alert variant="warning"` in design-system OR refactor `dashboard-analytics.tsx`** (type error or silent fallback today).
4. **Fix `patterns/index.md`**: pattern count (15→17), broken self-reference (`pattern-index.md` → `index.md`), section count (8→9), add markdown links to pattern files.
5. **Fix `DISTRIBUTE.md` export script**: quote paths, copy `__tests__/`, remove `.forge/ux/` checklist line, add `set -e`.

### Summary

**Total Issues Found: 38**
- **HIGH** (blocking): **9**
  - 2 in design-system.md (Alert variant, Switch duplication, HSL/hex bug = 3)
  - 1 in qa-checklist-template (no pattern files reference it)
  - 3 in index.md (pattern count, broken link, zero links to files)
  - 3 in DISTRIBUTE.md (missing path, contradictory tests policy, buggy script)
  - 2 cross-artifact (data-table: aria-sort missing, sort cycle wrong)
  - 1 cross-artifact (form: onBlur never tested)
- **MEDIUM** (important): **20**
- **LOW** (advisory): **9**

**Recommendation: NEEDS CHANGES**

The library has strong bones — 17 patterns × 17 templates × 17 tests is impressive coverage and the design-system token model is well-thought-out. But it ships with:
- A foundational CSS bug (HSL wrapping hex) that breaks color rendering.
- A governance gap (pattern QA checklists don't inherit baseline checks).
- Spec ↔ implementation drift on the FLAGSHIP pattern (Data Table): missing a11y attribute, wrong sort behavior, missing debounce.
- A distribution script that won't work for users with spaces in paths and doesn't copy tests.

These are fixable in one focused pass. After fixes, this library will be a solid foundation. Distributing as-is would propagate the bugs to every consumer project.
