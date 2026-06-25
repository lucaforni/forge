import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: any) => <div data-testid="skeleton" aria-hidden="true" {...props} />,
}))

import {
  SkeletonTable,
  SkeletonCardGrid,
  SkeletonForm,
  SkeletonDashboard,
  SkeletonDetail,
} from '../loading-skeletons'

describe('SkeletonTable', () => {
  it('renders N rows', () => {
    const { container } = render(<SkeletonTable rows={3} columns={4} />)

    const rows = container.querySelectorAll('[role="row"]')
    expect(rows.length).toBe(1)

    const dataRows = container.querySelectorAll('tr')
    expect(dataRows.length).toBe(4)
  })

  it('renders N columns', () => {
    const { container } = render(<SkeletonTable rows={2} columns={3} />)

    const skeletons = container.querySelectorAll('[data-testid="skeleton"]')
    const expectedCount = 2 * 3 + 3
    expect(skeletons.length).toBe(expectedCount)
  })
})

describe('SkeletonCardGrid', () => {
  it('renders N cards', () => {
    const { container } = render(<SkeletonCardGrid cardCount={4} />)

    const cards = container.querySelectorAll('.rounded-lg.border')
    expect(cards.length).toBe(4)
  })
})

describe('SkeletonForm', () => {
  it('renders N fields', () => {
    const { container } = render(<SkeletonForm fieldCount={6} />)

    const fields = container.querySelectorAll('.space-y-2')
    expect(fields.length).toBe(6)
  })
})

describe('SkeletonDashboard', () => {
  it('renders with all zones', () => {
    const { container } = render(<SkeletonDashboard kpiCount={2} chartCount={1} tableRows={3} />)

    const kpiCards = container.querySelectorAll('.rounded-lg.border.p-4.space-y-3')
    expect(kpiCards.length).toBe(2)

    const chartSection = container.querySelector('.rounded-lg.border.p-6')
    expect(chartSection).not.toBeNull()

    const skeletons = container.querySelectorAll('[data-testid="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

describe('SkeletonDetail', () => {
  it('renders sidebar + content', () => {
    const { container } = render(<SkeletonDetail />)

    const sidebar = container.querySelector('aside')
    expect(sidebar).not.toBeNull()

    const contentDiv = sidebar?.nextElementSibling
    expect(contentDiv).not.toBeNull()

    const skeletons = container.querySelectorAll('[data-testid="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(5)
  })
})

describe('Accessibility', () => {
  it('all variants have aria-busy="true"', () => {
    const table = render(<SkeletonTable />)
    expect(table.container.querySelector('[aria-busy="true"]')).not.toBeNull()
    table.unmount()

    const grid = render(<SkeletonCardGrid />)
    expect(grid.container.querySelector('[aria-busy="true"]')).not.toBeNull()
    grid.unmount()

    const form = render(<SkeletonForm />)
    expect(form.container.querySelector('[aria-busy="true"]')).not.toBeNull()
    form.unmount()

    const dashboard = render(<SkeletonDashboard />)
    expect(dashboard.container.querySelector('[aria-busy="true"]')).not.toBeNull()
    dashboard.unmount()

    const detail = render(<SkeletonDetail />)
    expect(detail.container.querySelector('[aria-busy="true"]')).not.toBeNull()
    detail.unmount()
  })

  it('skeleton elements have aria-hidden="true"', () => {
    const variants = [
      () => render(<SkeletonTable rows={2} columns={3} />),
      () => render(<SkeletonCardGrid cardCount={4} />),
      () => render(<SkeletonForm fieldCount={3} />),
      () => render(<SkeletonDashboard kpiCount={2} chartCount={1} tableRows={2} />),
      () => render(<SkeletonDetail />),
    ]

    variants.forEach((renderVariant) => {
      const { container, unmount } = renderVariant()
      const skeletonEls = container.querySelectorAll('[data-testid="skeleton"]')
      expect(skeletonEls.length).toBeGreaterThan(0)
      skeletonEls.forEach((el) => {
        expect(el.getAttribute('aria-hidden')).toBe('true')
      })
      unmount()
    })
  })

  it("has aria-label 'Loading in progress'", () => {
    const { container } = render(<SkeletonTable />)
    expect(container.querySelector('[aria-label="Caricamento in corso"]')).not.toBeNull()
  })

  it('skeleton container preserves layout dimensions', () => {
    const { container } = render(<SkeletonCardGrid cardCount={3} />)
    const skeletonContainer = container.querySelector('[aria-busy="true"]')
    expect(skeletonContainer).not.toBeNull()
    expect(skeletonContainer).toHaveAttribute('aria-busy', 'true')
  })
})
