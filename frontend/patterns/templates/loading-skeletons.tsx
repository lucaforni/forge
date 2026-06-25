// ============================================================
// Template: Loading Skeletons
// Pattern: loading-skeleton
// Stack: React + shadcn/ui + Tailwind
// USAGE: Use while content loads asynchronously.
//        Match SKELETON STRUCTURE to final content layout.
// ============================================================

'use client'

import { Skeleton } from '@/components/ui/skeleton'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export type SkeletonVariant =
  | 'table'
  | 'card-grid'
  | 'form'
  | 'dashboard'
  | 'detail'

export interface SkeletonTableProps {
  /** Number of body rows (default: 5) */
  rows?: number
  /** Number of visible columns (default: 5) */
  columns?: number
  className?: string
}

export interface SkeletonCardGridProps {
  /** Number of card placeholders (default: 6) */
  cardCount?: number
  className?: string
}

export interface SkeletonFormProps {
  /** Number of form fields (default: 4) */
  fieldCount?: number
  className?: string
}

export interface SkeletonDashboardProps {
  /** KPI card skeletons (default: 4) */
  kpiCount?: number
  /** Chart skeletons (default: 2) */
  chartCount?: number
  /** Chart skeleton height in px (default: 350) */
  chartHeight?: number
  /** Table skeleton rows (default: 5) */
  tableRows?: number
  className?: string
}

export interface SkeletonDetailProps {
  className?: string
}

// ──────────────────────────────────────────────
// COLUMN WIDTH PRESETS
// ──────────────────────────────────────────────

const COLUMN_WIDTHS = [
  'h-4 w-4',    // checkbox
  'h-4 w-24',   // name / short text
  'h-4 w-32',   // description / medium text
  'h-4 w-20',   // status / badge
  'h-4 w-28',   // date / long text
]

// ──────────────────────────────────────────────
// COMPONENTS
// ──────────────────────────────────────────────

/**
 * SkeletonTable
 *
 * Mimics a data table with header row + body rows + checkbox column.
 * - Desktop: all columns visible
 * - Mobile: last 2 columns hidden
 *
 * @example
 *   <SkeletonTable rows={5} columns={5} />
 */
export function SkeletonTable({ rows = 5, columns = 5, className = '' }: SkeletonTableProps) {
  const visibleWidths = Array.from({ length: columns }, (_, i) => COLUMN_WIDTHS[i % COLUMN_WIDTHS.length])

  return (
    <div
      className={`space-y-2 ${className}`}
      aria-busy="true"
      aria-label="Loading..."
    >
      {/* HEADER ROW */}
      <div className="hidden sm:flex items-center gap-4 py-3 border-b">
        {visibleWidths.map((width, i) => (
          <Skeleton key={i} className={width} aria-hidden="true" />
        ))}
      </div>

      {/* BODY ROWS */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 py-3 border-b last:border-0"
        >
          {/* Always show first 3 columns on mobile */}
          {visibleWidths.slice(0, 3).map((width, colIdx) => (
            <Skeleton
              key={colIdx}
              className={`${width} ${colIdx === 0 ? '' : 'hidden sm:block'}`}
              aria-hidden="true"
            />
          ))}
          {/* Remaining columns — desktop only */}
          {visibleWidths.slice(3).map((width, colIdx) => (
            <Skeleton key={colIdx + 3} className={`${width} hidden lg:block`} aria-hidden="true" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonCardGrid
 *
 * Mimics a responsive card grid with image placeholder + text lines.
 * - Desktop: 3 columns
 * - Tablet: 2 columns
 * - Mobile: 1 column
 *
 * @example
 *   <SkeletonCardGrid cardCount={6} />
 */
export function SkeletonCardGrid({ cardCount = 6, className = '' }: SkeletonCardGridProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
      aria-busy="true"
      aria-label="Loading..."
    >
      {Array.from({ length: cardCount }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          {/* Image placeholder */}
          <Skeleton className="w-full h-40 rounded-md" aria-hidden="true" />
          {/* Title line */}
          <Skeleton className="h-4 w-3/4" aria-hidden="true" />
          {/* Description line */}
          <Skeleton className="h-4 w-1/2" aria-hidden="true" />
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonForm
 *
 * Mimics a form with labeled fields + submit button.
 * Full-width on mobile.
 *
 * @example
 *   <SkeletonForm fieldCount={4} />
 */
export function SkeletonForm({ fieldCount = 4, className = '' }: SkeletonFormProps) {
  return (
    <div
      className={`space-y-6 max-w-lg ${className}`}
      aria-busy="true"
      aria-label="Loading..."
    >
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Label */}
          <Skeleton className="h-4 w-20" aria-hidden="true" />
          {/* Input */}
          <Skeleton className="h-10 w-full rounded-md" aria-hidden="true" />
        </div>
      ))}
      {/* Submit button */}
      <Skeleton className="h-10 w-32 rounded-md" aria-hidden="true" />
    </div>
  )
}

/**
 * SkeletonDashboard
 *
 * Composes KPI skeletons + chart skeletons + table skeleton.
 * Full dashboard loading state.
 *
 * @example
 *   <SkeletonDashboard kpiCount={4} chartCount={2} />
 */
export function SkeletonDashboard({
  kpiCount = 4,
  chartCount = 2,
  chartHeight = 350,
  tableRows = 5,
  className = '',
}: SkeletonDashboardProps) {
  return (
    <div
      className={`space-y-6 ${className}`}
      aria-busy="true"
      aria-label="Loading..."
    >
      {/* KPI ROW */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: kpiCount }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-4 w-16" aria-hidden="true" />
            <Skeleton className="h-8 w-24" aria-hidden="true" />
            <Skeleton className="h-4 w-12" aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* CHART ROW */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: chartCount }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <Skeleton className="h-5 w-32 mb-4" aria-hidden="true" />
            <Skeleton
              className="w-full rounded-md"
              style={{ height: chartHeight }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-lg border p-4">
        <Skeleton className="h-5 w-40 mb-4" aria-hidden="true" />
        {Array.from({ length: tableRows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-4 w-4" aria-hidden="true" />
            <Skeleton className="h-4 w-24" aria-hidden="true" />
            <Skeleton className="h-4 w-32" aria-hidden="true" />
            <Skeleton className="h-4 w-20" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * SkeletonDetail
 *
 * Mimics a detail page with sidebar (narrow) + content area (wide).
 * - Desktop: sidebar + content side-by-side
 * - Mobile: stacked vertically (sidebar first)
 *
 * @example
 *   <SkeletonDetail />
 */
export function SkeletonDetail({ className = '' }: SkeletonDetailProps) {
  return (
    <div
      className={`flex flex-col lg:flex-row gap-6 ${className}`}
      aria-busy="true"
      aria-label="Loading..."
    >
      {/* SIDEBAR — narrow */}
      <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
        {/* Avatar / image placeholder */}
        <Skeleton className="w-full h-32 rounded-lg" aria-hidden="true" />
        {/* Sidebar text lines */}
        <Skeleton className="h-4 w-3/4" aria-hidden="true" />
        <Skeleton className="h-4 w-1/2" aria-hidden="true" />
        <Skeleton className="h-4 w-2/3" aria-hidden="true" />
        <Skeleton className="h-4 w-1/3" aria-hidden="true" />
      </aside>

      {/* CONTENT AREA — wide */}
      <div className="flex-1 space-y-4">
        {/* Hero image */}
        <Skeleton className="w-full h-64 rounded-lg" aria-hidden="true" />
        {/* Paragraph lines */}
        <Skeleton className="h-4 w-full" aria-hidden="true" />
        <Skeleton className="h-4 w-full" aria-hidden="true" />
        <Skeleton className="h-4 w-3/4" aria-hidden="true" />
        <Skeleton className="h-4 w-5/6" aria-hidden="true" />
        <Skeleton className="h-4 w-2/3" aria-hidden="true" />
        <Skeleton className="h-4 w-full" aria-hidden="true" />
        <Skeleton className="h-4 w-4/5" aria-hidden="true" />
      </div>
    </div>
  )
}
