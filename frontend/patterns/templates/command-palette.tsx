// ============================================================
// Template: Command Palette (Cmd+K)
// Pattern: command-palette
// Stack: React + shadcn/ui Command + Dialog + Lucide + React Query + sonner
// USAGE: Copiare, adattare actions, searchEntities, router
// ============================================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Plus,
  Download,
  Search,
  FileText,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface CommandAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  href?: string
  onSelect: () => void
  group: string
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
  timestamp: number
}

interface CommandPaletteProps {
  navigateActions?: CommandAction[]
  quickActions?: CommandAction[]
  searchEntities?: (query: string) => Promise<DynamicResult[]>
  placeholder?: string
  onOpenChange?: (open: boolean) => void
}

// ──────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────

const RECENT_KEY = 'palette-recent'
const MAX_RECENT = 5

const DEFAULT_NAVIGATE: CommandAction[] = [
  {
    id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard,
    shortcut: '⌘⇧H', onSelect: () => {}, group: 'navigazione', href: '/',
  },
  {
    id: 'nav-orders', label: 'Ordini', icon: ShoppingCart,
    shortcut: '⌘1', onSelect: () => {}, group: 'navigazione', href: '/orders',
  },
  {
    id: 'nav-catalog', label: 'Catalogo', icon: Package,
    shortcut: '⌘2', onSelect: () => {}, group: 'navigazione', href: '/catalog',
  },
  {
    id: 'nav-customers', label: 'Clienti', icon: Users,
    shortcut: '⌘3', onSelect: () => {}, group: 'navigazione', href: '/customers',
  },
]

const DEFAULT_QUICK_ACTIONS: CommandAction[] = [
  {
    id: 'action-new-order', label: 'Nuovo ordine', icon: Plus,
    shortcut: '⌘N', onSelect: () => {}, group: 'azioni-rapide', href: '/orders/new',
  },
  {
    id: 'action-export', label: 'Esporta report', icon: Download,
    onSelect: () => { /* trigger export */ },
    group: 'azioni-rapide',
  },
]

// ──────────────────────────────────────────────
// RECENT ACTIONS HELPERS
// ──────────────────────────────────────────────

function getRecentActions(): RecentAction[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r: unknown): r is RecentAction =>
        typeof r === 'object' && r !== null && 'id' in r && 'label' in r && 'timestamp' in r,
    )
  } catch {
    return []
  }
}

function addRecentAction(action: CommandAction) {
  if (typeof window === 'undefined') return
  const recent = getRecentActions().filter(r => r.id !== action.id)
  recent.unshift({ id: action.id, label: action.label, timestamp: Date.now() })
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function CommandPalette({
  navigateActions = DEFAULT_NAVIGATE,
  quickActions = DEFAULT_QUICK_ACTIONS,
  searchEntities,
  placeholder = 'Search actions, pages...',
  onOpenChange: onParentOpenChange,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recentActions, setRecentActions] = useState<RecentAction[]>([])
  const router = useRouter()

  const searchQuery = query.length > 2 ? query : ''

  const { data: dynamicResults = [] } = useQuery({
    queryKey: ['palette-search', searchQuery],
    queryFn: () => searchEntities?.(searchQuery) ?? Promise.resolve([]),
    enabled: searchQuery.length > 2 && !!searchEntities,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })

  // ── global Cmd+K listener ──
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

  // ── reset query on open ──
  useEffect(() => {
    if (open) {
      setQuery('')
      setRecentActions(getRecentActions())
    }
  }, [open])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    onParentOpenChange?.(newOpen)
  }, [onParentOpenChange])

  const handleSelect = useCallback((action: CommandAction) => {
    addRecentAction(action)
    handleOpenChange(false)
    if (action.href) {
      router.push(action.href)
    } else {
      action.onSelect()
    }
  }, [handleOpenChange, router])

  const handleSelectDynamic = useCallback((result: DynamicResult) => {
    handleOpenChange(false)
    router.push(result.href)
  }, [handleOpenChange, router])

  const allActions = [...navigateActions, ...quickActions]
  const filteredStatic = query
    ? allActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : allActions

  const filteredNavigate = filteredStatic.filter(a => a.group === 'navigazione')
  const filteredQuick = filteredStatic.filter(a => a.group === 'azioni-rapide')

  const recentFiltered = recentActions.filter(r => allActions.some(a => a.id === r.id))
  const hasResults = filteredNavigate.length > 0 || filteredQuick.length > 0 || dynamicResults.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed inset-0 rounded-none p-0 gap-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-2xl sm:rounded-lg [&>button]:hidden"
        aria-describedby={undefined}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
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

            {recentFiltered.length > 0 && !query && (
              <>
                <CommandGroup heading="Recent">
                  {recentFiltered.slice(0, 3).map((recent) => {
                    const action = allActions.find(a => a.id === recent.id)
                    if (!action) return null
                    const Icon = action.icon
                    return (
                      <CommandItem
                        key={recent.id}
                        value={action.label}
                        onSelect={() => handleSelect(action)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{action.label}</span>
                        {action.shortcut && (
                          <Badge variant="outline" className="ml-auto text-xs font-mono">
                            {action.shortcut}
                          </Badge>
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {filteredNavigate.length > 0 && (
              <CommandGroup heading="Navigation">
                {filteredNavigate.map((action) => {
                  const Icon = action.icon
                  return (
                    <CommandItem
                      key={action.id}
                      value={action.label}
                      onSelect={() => handleSelect(action)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{action.label}</span>
                      {action.shortcut && (
                        <Badge variant="outline" className="ml-auto text-xs font-mono">
                          {action.shortcut}
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {filteredNavigate.length > 0 && filteredQuick.length > 0 && (
              <CommandSeparator />
            )}

            {filteredQuick.length > 0 && (
              <CommandGroup heading="Quick actions">
                {filteredQuick.map((action) => {
                  const Icon = action.icon
                  return (
                    <CommandItem
                      key={action.id}
                      value={action.label}
                      onSelect={() => handleSelect(action)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{action.label}</span>
                      {action.shortcut && (
                        <Badge variant="outline" className="ml-auto text-xs font-mono">
                          {action.shortcut}
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {dynamicResults.length > 0 && (
              <>
                {filteredNavigate.length > 0 || filteredQuick.length > 0 ? (
                  <CommandSeparator />
                ) : null}
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
  )
}
