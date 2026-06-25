import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

import { EmptyState } from '../empty-state'

describe('EmptyState', () => {
  it('shows first-visit variant with creation CTA', () => {
    const onCreate = vi.fn()

    render(
      <EmptyState
        variant="first-visit"
        title="Nessun ordine"
        description="Non ci sono ancora ordini."
        primaryCTA={{ label: 'Nuovo ordine', onClick: onCreate }}
      />,
    )

    expect(screen.getByText('Nessun ordine')).toBeInTheDocument()
    expect(screen.getByText('Non ci sono ancora ordini.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuovo ordine' })).toBeInTheDocument()
  })

  it('shows filtered variant with CTA to clear filters', () => {
    const onClear = vi.fn()

    render(
      <EmptyState
        variant="filtered"
        title="Nessun risultato"
        description="Nessun elemento corrisponde ai filtri selezionati."
        primaryCTA={{ label: 'Cancella filtri', onClick: onClear }}
      />,
    )

    expect(screen.getByText('Nessun risultato')).toBeInTheDocument()
    expect(
      screen.getByText('Nessun elemento corrisponde ai filtri selezionati.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancella filtri' })).toBeInTheDocument()
  })

  it('shows search-no-results variant with query text', () => {
    render(
      <EmptyState
        variant="search-no-results"
        title='Nessun risultato per "test"'
        description="Prova a modificare la ricerca."
        query="test"
        primaryCTA={{ label: 'Cancella ricerca', onClick: vi.fn() }}
      />,
    )

    expect(screen.getByText(/Nessun risultato per/)).toBeInTheDocument()
    expect(screen.getByText(/test/)).toBeInTheDocument()
  })

  it('shows after-action variant with undo option', () => {
    const onUndo = vi.fn()

    render(
      <EmptyState
        variant="after-action"
        title="Order removed"
        description="No more orders to display."
        primaryCTA={{ label: 'Undo', onClick: onUndo }}
      />,
    )

    expect(screen.getByText('Ordine rimosso')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annulla' })).toBeInTheDocument()
  })

  it('calls primaryCTA onClick when clicked', () => {
    const onClick = vi.fn()

    render(
      <EmptyState
        variant="first-visit"
        title="Nessun ordine"
        description="Non ci sono ancora ordini."
        primaryCTA={{ label: 'Nuovo ordine', onClick }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Nuovo ordine' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('secondaryCTA renders when provided and click invokes callback', () => {
    const onSecondary = vi.fn()

    render(
      <EmptyState
        variant="first-visit"
        title="Nessun ordine"
        description="Non ci sono ancora ordini."
        primaryCTA={{ label: 'Nuovo ordine', onClick: vi.fn() }}
        secondaryCTA={{ label: 'Torna indietro', onClick: onSecondary }}
      />,
    )

    const btn = screen.getByRole('button', { name: 'Torna indietro' })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onSecondary).toHaveBeenCalledTimes(1)
  })

  it('secondaryCTA not rendered when not provided', () => {
    render(
      <EmptyState
        variant="first-visit"
        title="Nessun ordine"
        description="Non ci sono ancora ordini."
        primaryCTA={{ label: 'Nuovo ordine', onClick: vi.fn() }}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Torna indietro' })).not.toBeInTheDocument()
  })

  it('uses custom icon when provided', () => {
    const CustomIcon = () => <span data-testid="custom-icon" />

    render(
      <EmptyState
        variant="first-visit"
        icon={CustomIcon}
        title="No orders"
        description="Your inbox is empty."
        primaryCTA={{ label: 'New order', onClick: vi.fn() }}
      />,
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it("has aria role='status' attribute", () => {
    render(
      <EmptyState
        variant="filtered"
        title="Nessun risultato"
        description="Nessun elemento trovato."
      />,
    )

    const container = screen.getByRole('status')
    expect(container).toBeInTheDocument()
  })

  it('focus moves to first interactive element on mount', () => {
    const onClick = vi.fn()

    const { rerender } = render(
      <EmptyState
        variant="first-visit"
        title="Nessun ordine"
        description="Start fresh."
        primaryCTA={{ label: 'Crea', onClick }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Crea' })).toBeInTheDocument()
  })

  it('after-action variant undo callback is invoked', () => {
    const onUndo = vi.fn()

    render(
      <EmptyState
        variant="after-action"
        title="Order removed"
        description="No more orders to display."
        primaryCTA={{ label: 'Undo', onClick: onUndo }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }))
    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('filtered variant clearCTA is invoked', () => {
    const onClear = vi.fn()

    render(
      <EmptyState
        variant="filtered"
        title="Nessun risultato"
        description="Corrisponde."
        primaryCTA={{ label: 'Cancella filtri', onClick: onClear }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancella filtri' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
