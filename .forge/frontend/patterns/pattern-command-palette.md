# Pattern: Command Palette (Cmd+K)

**Severity**: Advanced · **Stack**: shadcn/ui Command + Dialog + React Query + sonner
**Depends on**: Command, Dialog, Badge, Button, Lucide icons

---

## 1. When to Use

**Use this pattern when**:
- The user needs to quickly navigate between pages/features without using the mouse
- Quick actions are needed (create, export, search) accessible from any screen
- The application has many pages/features and traditional navigation is slow
- Power-user navigation: reduce clicks for experienced users

**Do NOT use this pattern when**:
- Searching within a single page → Search pattern
- Replacing the primary navigation menu (the palette is complementary)
- Fewer than 5 total pages/actions → native routing + buttons is sufficient

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Command | Main palette container with native navigation | default |
| CommandInput | Search field with built-in filtering | default |
| CommandEmpty | "No results" state | default |
| CommandGroup | Action group with heading | default |
| CommandItem | Single navigable action | default |
| CommandSeparator | Divider between groups | default |
| Dialog | Overlay wrapper for the palette | default |
| Badge | Keyboard shortcut (e.g. `⌘N`) | variant: `outline` + custom classes |
| Button | Trigger to open the palette | variant: `outline` |

---

## 3. JSX Structure

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="p-0 gap-0 sm:max-w-2xl [&>button]:hidden">
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search actions, pages..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-8 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No results</p>
          </div>
        </CommandEmpty>

        {recentActions.length > 0 && !query && (
          <>
            <CommandGroup heading="Recent">
              {recentActions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={action.label}
                  onSelect={() => handleSelect(action)}
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {action.shortcut}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigation">
          {navigateActions.map((action) => (
            <CommandItem
              key={action.id}
              value={action.label}
              onSelect={() => handleSelect(action)}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
              {action.shortcut && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {action.shortcut}
                </Badge>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.id}
              value={action.label}
              onSelect={() => handleSelect(action)}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
              {action.shortcut && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {action.shortcut}
                </Badge>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {dynamicResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Search">
              {dynamicResults.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => handleSelectDynamic(item)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  </DialogContent>
</Dialog>
```

---

## 4. State Machine

```yaml
Pattern: CommandPalette
Initial: closed

States:
  closed:
    description: "Palette hidden, global listener active"
    ui: "Trigger Cmd+K. No overlay."
    transitions:
      on_global_cmdk → opening

  opening:
    description: "Opening animation"
    ui: "Dialog overlay fade-in + content scale-in. Input receives focus automatically."
    transitions:
      on_animation_end → active

  active:
    description: "Input focused, palette ready"
    ui: "Empty input with placeholder. Shows static + recent actions."
    transitions:
      on_type (query === '') → active
      on_type (query.length > 0) → searching
      on_select → selected
      on_escape → closing

  searching:
    description: "Local filtering + API search in progress"
    ui: "Command filters static actions locally. API call if query > 2 characters."
    transitions:
      on_type → searching (debounce 150ms)
      on_select → selected
      on_results (dynamic) → results
      on_no_results_local → no-results
      on_escape → closing

  results:
    description: "Static + dynamic results visible"
    ui: "Result groups. Static actions filtered locally + entities from API."
    transitions:
      on_type → searching
      on_select → selected
      on_escape → closing

  no-results:
    description: "Query active but zero results"
    ui: "CommandEmpty visible: 'No results for {query}'"
    transitions:
      on_type → searching
      on_escape → closing

  selected:
    description: "Action executed"
    ui: "Palette closes. Action executed (navigation, command, opening entity). Recent actions updated."
    transitions:
      on_action_complete → closing

  closing:
    description: "Closing animation"
    ui: "Overlay fade-out. Input loses focus."
    transitions:
      on_animation_end → closed
```

---

## 5. Data Flow

### 5.1 Static Actions (config)

```tsx
const NAVIGATE_ACTIONS: CommandAction[] = [
  { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '⌘⇧H', onSelect: () => router.push('/'), group: 'navigation' },
  { id: 'nav-orders', label: 'Orders', icon: ShoppingCart, shortcut: '⌘1', onSelect: () => router.push('/orders'), group: 'navigation' },
  { id: 'nav-catalog', label: 'Catalog', icon: Package, shortcut: '⌘2', onSelect: () => router.push('/catalog'), group: 'navigation' },
  { id: 'nav-customers', label: 'Customers', icon: Users, shortcut: '⌘3', onSelect: () => router.push('/customers'), group: 'navigation' },
]

const QUICK_ACTIONS: CommandAction[] = [
  { id: 'action-new-order', label: 'New order', icon: Plus, shortcut: '⌘N', onSelect: () => router.push('/orders/new'), group: 'quick-actions' },
  { id: 'action-export', label: 'Export report', icon: Download, onSelect: () => exportReport(), group: 'quick-actions' },
]
```

### 5.2 Dynamic Results (React Query)

```tsx
function usePaletteSearch(query: string) {
  return useQuery({
    queryKey: ['palette-search', query],
    queryFn: () => api.searchEntities(query),
    enabled: query.length > 2,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
```

### 5.3 Recent Actions (localStorage)

```tsx
const RECENT_KEY = 'palette-recent'
const MAX_RECENT = 5

function getRecentActions(): RecentAction[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function addRecentAction(action: CommandAction) {
  const recent = getRecentActions().filter(r => r.id !== action.id)
  recent.unshift({ id: action.id, label: action.label, icon: action.icon.name, timestamp: Date.now() })
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}
```

### 5.4 Global Listener

```tsx
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen(prev => !prev)
    }
  }
  document.addEventListener('keydown', down)
  return () => document.removeEventListener('keydown', down)
}, [])
```

---

## 6. TypeScript Types

```tsx
interface CommandAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  onSelect: () => void
  group: string
}

interface CommandGroup {
  heading: string
  actions: CommandAction[]
}

interface DynamicResult {
  id: string
  label: string
  subtitle: string
  href: string
}

interface RecentAction {
  id: string
  label: string
  icon: string  // icon name for lookup
  timestamp: number
}

interface CommandPaletteProps {
  navigateActions: CommandAction[]
  quickActions: CommandAction[]
  onSearch?: (query: string) => Promise<DynamicResult[]>
  placeholder?: string
}
```

---

## 7. Accessibility

### ARIA

| Element | Attribute | Value |
|----------|-----------|--------|
| Dialog | `role` | `dialog` |
| Dialog | `aria-modal` | `true` |
| Command | `role` | `listbox` (implements combobox pattern) |
| CommandInput | `role` | `combobox` |
| CommandInput | `aria-expanded` | `true` |
| CommandInput | `aria-activedescendant` | id of the current item |
| CommandList | `role` | `listbox` |
| CommandItem | `role` | `option` |
| CommandItem (active) | `aria-selected` | `true` |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `⌘K` / `Ctrl+K` | Open/close the palette (global) |
| Esc | Close the palette |
| Arrow Down | Next item in the current group |
| Arrow Up | Previous item in the current group |
| Arrow Down (last of group) | Jump to first of next group (built-in Command) |
| Enter | Select the active item |
| Tab | Close the palette (built-in Dialog) |

### Focus Management

- **Initial focus**: CommandInput receives focus automatically on open
- **Focus trap**: built-in Dialog — focus cycles inside the palette
- **Return focus**: focus returns to the element that activated Cmd+K
- **aria-activedescendant**: updates while navigating with Arrow keys

### Screen Reader Flow

```
1. "Search actions pages: text field, combobox"
2. "{heading} group, {N} results" (when group is navigated)
3. "{label}, shortcut {shortcut}" (item navigation)
4. "No results" (empty state)
```

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| < 640px | Full screen: `fixed inset-0 rounded-none`, `m-0`, `h-dvh`, vertical scroll. Input at top, list below. |
| ≥ 640px | Centered: `sm:max-w-2xl`, `sm:rounded-lg`, max height 70vh with scroll. |

```tsx
// shadcn/ui handles responsiveness built-in, but for full-screen mobile:
<DialogContent className="fixed inset-0 rounded-none p-0 gap-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-2xl sm:rounded-lg">
```

---

## 9. QA Checklist

### Pattern-Specific
- [ ] `⌘K` opens the palette from any page/focus
- [ ] `⌘K` with palette already open closes it (toggle)
- [ ] Esc closes the palette
- [ ] Arrow Down/Up navigate between items with visual highlight
- [ ] Enter executes the selected action AND closes the palette
- [ ] Click outside the palette closes it
- [ ] Input filters static actions locally while typing
- [ ] If query > 2 characters, API search starts (debounce 150ms)
- [ ] "No results" state with icon and text visible when filter matches nothing
- [ ] Action executed: router.push navigation OR command, palette closed
- [ ] Recent: last 5 actions saved in localStorage, shown when query is empty
- [ ] Recent: clicking an action moves it to top (or no duplicate)
- [ ] Shortcut badge visible for actions with shortcut
- [ ] Separator between action groups

### States Verified
- [ ] Closed: palette not visible, global listener active
- [ ] Opening: smooth animation, input focused
- [ ] Active: empty input, static + recent actions visible
- [ ] Searching: local filter + loading indicator for API
- [ ] Results: action groups + dynamic results
- [ ] No results: empty state
- [ ] Selected: action executed, palette closed, recent actions updated

### Data Flow
- [ ] Static actions configurable via array (navigateActions + quickActions)
- [ ] Dynamic search with React Query, queryKey includes query
- [ ] Recent actions: localStorage, max 5, timestamp-sorted
- [ ] Debounce 150ms to avoid overwhelming API on fast typing
- [ ] Global listener does not interfere with other Cmd+K shortcuts (e.g. in text editor)
- [ ] onSelect navigates with `router.push()` for pages, executes callback for commands
