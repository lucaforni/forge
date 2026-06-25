// ============================================================
// Template: Empty State
// Pattern: empty-state
// Stack: React + shadcn/ui + Tailwind
// USAGE: Usare in TUTTI i pattern quando non ci sono dati
// ============================================================

'use client'

import {
  Package,
  SearchX,
  FileX,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export type EmptyStateVariant =
  | 'first-visit'
  | 'filtered'
  | 'after-action'
  | 'search-no-results'

export interface EmptyStateCTA {
  label: string
  onClick: () => void
  disabled?: boolean
}

export interface EmptyStateProps {
  variant: EmptyStateVariant
  icon?: LucideIcon
  title: string
  description: string
  primaryCTA?: EmptyStateCTA
  secondaryCTA?: EmptyStateCTA
  /** Query che non ha dato risultati (solo variant: search-no-results) */
  query?: string
  /** Nome dell'elemento al singolare (per first-visit) */
  itemName?: string
  className?: string
}

// ──────────────────────────────────────────────
// DEFAULT ICONS PER VARIANT
// ──────────────────────────────────────────────

const DEFAULT_ICONS: Record<EmptyStateVariant, LucideIcon> = {
  'first-visit': Package,
  'filtered': SearchX,
  'after-action': FileX,
  'search-no-results': SearchX,
}

// ──────────────────────────────────────────────
// HELPERS: Prebuilt configs per casi comuni
// ──────────────────────────────────────────────

export const EmptyStatePresets = {
  /** Nessun dato mai creato nel sistema */
  firstVisit: (
    itemName: string,
    onCreate: () => void,
    options?: { icon?: LucideIcon; description?: string; secondaryCTA?: EmptyStateCTA },
  ): EmptyStateProps => ({
    variant: 'first-visit',
    icon: options?.icon,
    title: `No ${itemName}`,
    description: options?.description ?? `No ${itemName} yet. Create one to get started.`,
    primaryCTA: { label: `New ${itemName}`, onClick: onCreate },
    secondaryCTA: options?.secondaryCTA,
  }),

  /** Filtri attivi ma nessun risultato */
  filtered: (
    onClearFilters: () => void,
    options?: { title?: string; description?: string; icon?: LucideIcon; secondaryCTA?: EmptyStateCTA },
  ): EmptyStateProps => ({
    variant: 'filtered',
    icon: options?.icon,
    title: options?.title ?? 'No results',
    description: options?.description ?? 'No items match the selected filters.',
    primaryCTA: { label: 'Clear filters', onClick: onClearFilters },
    secondaryCTA: options?.secondaryCTA,
  }),

  /** Ricerca senza risultati per query specifica */
  searchNoResults: (
    query: string,
    onClearSearch: () => void,
    options?: { suggestion?: string; icon?: LucideIcon },
  ): EmptyStateProps => ({
    variant: 'search-no-results',
    icon: options?.icon,
    title: `No results for "${query}"`,
    description: options?.suggestion
      ? `Did you mean "${options.suggestion}"?`
      : 'Try modifying your search.',
    primaryCTA: { label: 'Clear search', onClick: onClearSearch },
    query,
  }),

  /** Ultimo elemento rimosso */
  afterAction: (
    itemName: string,
    onUndo?: () => void,
    onBack?: () => void,
    options?: { icon?: LucideIcon },
  ): EmptyStateProps => ({
    variant: 'after-action',
    icon: options?.icon,
    title: `${itemName} removed`,
    description: `No more ${itemName.toLowerCase()} to display.`,
    primaryCTA: onUndo ? { label: 'Undo', onClick: onUndo } : undefined,
    secondaryCTA: onBack ? { label: 'Go back', onClick: onBack } : undefined,
  }),
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function EmptyState({
  variant,
  icon: Icon,
  title,
  description,
  primaryCTA,
  secondaryCTA,
  query,
  className = '',
}: EmptyStateProps) {
  const IconComponent = Icon ?? DEFAULT_ICONS[variant] ?? Package

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
      role="status"
      aria-live="polite"
    >
      {/* ICON */}
      <div className="mb-4 rounded-full bg-muted p-4" aria-hidden="true">
        <IconComponent className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* TITLE */}
      <h3 className="text-lg font-semibold text-foreground">
        {title}
      </h3>

      {/* DESCRIPTION */}
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>

      {/* HELPER TEXT for filtered empty */}
      {variant === 'filtered' && (
        <p className="mt-1 text-xs text-muted-foreground">
          Active filters may be too restrictive.
        </p>
      )}

      {/* SUGGESTION for search-no-results */}
      {variant === 'search-no-results' && !description.includes('"') && query && (
        <p className="mt-1 text-xs text-muted-foreground">
          Search &ldquo;{query}&rdquo; returned no results.
        </p>
      )}

      {/* PRIMARY CTA */}
      {primaryCTA && (
        <Button
          className="mt-6"
          onClick={primaryCTA.onClick}
          disabled={primaryCTA.disabled}
        >
          {primaryCTA.label}
        </Button>
      )}

      {/* SECONDARY CTA */}
      {secondaryCTA && (
        <Button
          variant="link"
          className="mt-2"
          onClick={secondaryCTA.onClick}
        >
          {secondaryCTA.label}
        </Button>
      )}
    </div>
  )
}
