# Pattern: Empty State

**Severity**: Core (cross-cutting) · **Stack**: shadcn/ui + Tailwind
**Depends on**: Card, Button, Lucide icons
**Applies to**: ALL data-displaying patterns

---

## 1. When to Use

**Use this pattern when**:
- A list can be empty after initial loading
- A fetch returns 0 records after filtering or searching
- A page intended for user content is still empty (first visit)
- The last element of a list has been removed

**Variants**:
- **first-visit**: No data in the system (nothing has ever been created). Message: onboarding, CTA to create/import
- **filtered**: Active filters but no results. Message: "No results" + "Clear filters"
- **after-action**: Last action emptied the list (e.g. deleted last element). Message: confirmation + action to go back
- **search-no-results**: Text search with no match. Message: "No results for '{query}'"

**Do NOT use**:
- When data exists (even 1 record) → show the data
- During loading → Skeleton (not empty state)
- As an error screen → Error Recovery pattern

---

## 2. Components

| Component | Usage | Note |
|------------|-----|------|
| Card | Empty state container | `variant: ghost` no border |
| Button | Primary CTA | Variant: default or outline |
| Button (link) | Secondary action | Variant: link |
| Badge | Optional: info tag | For filtered empty |

Icons: Lucide for visual representation (Inbox, SearchX, FileX, Package, etc.)

---

## 3. JSX Structure

```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  {/* ICON */}
  <div className="mb-4 rounded-full bg-muted p-4">
    <Icon className="h-8 w-8 text-muted-foreground" />
  </div>

  {/* TITLE */}
  <h3 className="text-lg font-semibold text-foreground">
    {title}
  </h3>

  {/* DESCRIPTION */}
  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
    {description}
  </p>

  {/* PRIMARY CTA */}
  {primaryCTA && (
    <Button className="mt-6" onClick={primaryCTA.onClick}>
      {primaryCTA.label}
    </Button>
  )}

  {/* SECONDARY CTA (optional) */}
  {secondaryCTA && (
    <Button variant="link" className="mt-2" onClick={secondaryCTA.onClick}>
      {secondaryCTA.label}
    </Button>
  )}
</div>
```

---

## 4. State Machine

```yaml
Pattern: EmptyState
Initial: variant_determined_by_context

States:
  first-visit:
    description: "No data EVER created in the system"
    ui: "Icon + 'No [items] yet' + 'Create the first [item]' + CTA 'New [item]'"
    transitions:
      on_cta_click → form/page to create
      on_data_created → populated (host pattern)

  filtered:
    description: "Active filters but no matching items"
    ui: "Icon (SearchX) + 'No results' + 'Try changing the filters' + CTA 'Clear filters'"
    transitions:
      on_clear_filters → populated (if data exists) or first-visit (if not)

  after-action:
    description: "Last action emptied the list"
    ui: "Icon + 'Item deleted' / 'No [items] remaining' + CTA 'Undo' or 'Go back'"
    transitions:
      on_undo → populated (restore)
      on_back → previous navigation

  search-no-results:
    description: "Text search with no match for specific query"
    ui: "Icon (SearchX) + 'No results for \"{query}\"' + 'Suggestion: [spelling correction]' + CTA 'Clear search'"
    transitions:
      on_clear_search → empty (empty query → show all or first-visit)
      on_new_search → search results
```

---

## 5. Data Flow

```tsx
interface EmptyStateConfig {
  variant: 'first-visit' | 'filtered' | 'after-action' | 'search-no-results'
  icon: React.ElementType
  title: string
  description: string
  primaryCTA?: {
    label: string
    onClick: () => void
  }
  secondaryCTA?: {
    label: string
    onClick: () => void
  }
}
```

No data fetching. Purely presentational. Data comes from the host pattern.

---

## 6. TypeScript Types

```tsx
interface EmptyStateProps {
  variant: 'first-visit' | 'filtered' | 'after-action' | 'search-no-results'
  icon?: React.ElementType
  title: string
  description: string
  primaryCTA?: {
    label: string
    onClick: () => void
    disabled?: boolean
  }
  secondaryCTA?: {
    label: string
    onClick: () => void
  }
  className?: string
}

// Helper: predefined variants for common cases
const EMPTY_STATES = {
  firstVisit: (params: { onCreate: () => void; itemName: string }): EmptyStateProps => ({
    variant: 'first-visit',
    icon: Package,
    title: `No ${params.itemName}`,
    description: `There are no ${params.itemName} yet. Create one to get started.`,
    primaryCTA: { label: `New ${params.itemName}`, onClick: params.onCreate },
  }),
  filtered: (params: { onClear: () => void }): EmptyStateProps => ({
    variant: 'filtered',
    icon: SearchX,
    title: 'No results',
    description: 'No items match the selected filters.',
    primaryCTA: { label: 'Clear filters', onClick: params.onClear },
  }),
  // ...
}
```

---

## 7. Accessibility

### ARIA
- Container: `role="status"` (announces change to screen reader)
- Decorative icon: `aria-hidden="true"`
- CTA: standard `<Button>` with clear label

### Screen Reader Flow
```
"[Title]. [Description]. Button: [CTA]."
```

### Focus Management
- After transitioning to empty state, focus goes to the container (if dynamic) or the first interactive element
- If empty state appears after an action (e.g. deletion), focus goes to the container

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| All | Centered, adaptive padding. Icon reduces to 24px on mobile. CTA full-width on mobile if needed. |

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Empty state appears only when there is no data (not during loading)
- [ ] first-visit variant: encouraging message + clear CTA to create
- [ ] filtered variant: "Clear filters" resets ALL filters (not just one)
- [ ] search-no-results variant: shows the query that produced no results
- [ ] after-action variant: confirmation message + undo or back navigation
- [ ] Smooth transition: from populated to empty (no flash/empty flicker)
- [ ] Empty state never appears if data exists (even 1 record)
- [ ] Empty state does not conflict with loading skeleton

### States Verified
- [ ] first-visit: never created anything — icon + "Create the first" + CTA
- [ ] filtered: active filters, 0 match — "No results" + "Clear filters"
- [ ] search-no-results: specific query 0 match — shows query + suggestion
- [ ] after-action: last item removed — message + undo/back

### Data Flow
- [ ] State derived from host pattern (not separate fetch)
- [ ] Empty state does not make its own API calls
