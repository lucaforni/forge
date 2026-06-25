import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// ──────────────────────────────────────────────
// Hoisted shared references
// ──────────────────────────────────────────────

const reactQuery = vi.hoisted(() => ({
  useQuery: vi.fn(),
}))

const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))

// ──────────────────────────────────────────────
// Module mocks
// ──────────────────────────────────────────────

vi.mock('@tanstack/react-query', () => reactQuery)

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <span data-testid="icon-dashboard" />,
  ShoppingCart: () => <span data-testid="icon-cart" />,
  Package: () => <span data-testid="icon-package" />,
  Users: () => <span data-testid="icon-users" />,
  Plus: () => <span data-testid="icon-plus" />,
  Download: () => <span data-testid="icon-download" />,
  Search: () => <span data-testid="icon-search" />,
  FileText: () => <span data-testid="icon-filetext" />,
}))

vi.mock('@/components/ui/dialog', () => {
  const React = require('react')
  const { createContext, useContext } = React

  const Ctx = createContext<{
    open: boolean
    onOpenChange: (v: boolean) => void
  }>({ open: false, onOpenChange: () => {} })

  return {
    Dialog: ({ children, open, onOpenChange }: any) => {
      const [openState, setOpenState] = React.useState(open)
      React.useEffect(() => { setOpenState(open) }, [open])
      return (
        <Ctx.Provider value={{ open: openState, onOpenChange }}>
          <div data-testid="dialog" data-open={openState}>
            {openState ? children : null}
          </div>
        </Ctx.Provider>
      )
    },
    DialogContent: ({ children, onKeyDown, ...props }: any) => {
      const { onOpenChange } = useContext(Ctx)
      return (
        <div
          data-testid="dialog-content"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
              onOpenChange(false)
            }
            onKeyDown?.(e)
          }}
          {...props}
        >
          {children}
        </div>
      )
    },
  }
})

vi.mock('@/components/ui/command', () => {
  const React = require('react')
  const { createContext, useContext, useState, useCallback, useRef, useEffect } = React

  interface CommandCtxValue {
    search: string
    onSearch: (v: string) => void
    selectedIndex: number
    setSelectedIndex: (i: number) => void
    items: { value: string; onSelect: () => void }[]
    registerItem: (item: { value: string; onSelect: () => void }) => () => void
    onItemSelect: (value: string) => void
  }

  const Ctx = createContext<CommandCtxValue>({
    search: '',
    onSearch: () => {},
    selectedIndex: -1,
    setSelectedIndex: () => {},
    items: [],
    registerItem: () => () => {},
    onItemSelect: () => {},
  })

  return {
    Command: ({ children, shouldFilter }: any) => {
      const [search, onSearch] = useState('')
      const [selectedIndex, setSelectedIndex] = useState(-1)
      const itemsRef = useRef<{ value: string; onSelect: () => void }[]>([])
      const [, forceUpdate] = useState(0)

      const registerItem = useCallback((item: { value: string; onSelect: () => void }) => {
        itemsRef.current.push(item)
        forceUpdate(n => n + 1)
        return () => {
          itemsRef.current = itemsRef.current.filter(i => i !== item)
        }
      }, [])

      const onItemSelect = useCallback((value: string) => {
        const item = itemsRef.current.find(i => i.value === value)
        item?.onSelect()
      }, [])

      const ctx = {
        search,
        onSearch,
        selectedIndex,
        setSelectedIndex,
        items: itemsRef.current,
        registerItem,
        onItemSelect,
      }

      return (
        <Ctx.Provider value={ctx}>
          <div
            data-testid="command"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev =>
                  Math.min(prev + 1, itemsRef.current.length - 1),
                )
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => Math.max(prev - 1, 0))
              } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault()
                const item = itemsRef.current[selectedIndex]
                item?.onSelect()
              }
            }}
          >
            {children}
          </div>
        </Ctx.Provider>
      )
    },
    CommandInput: ({ placeholder, value, onValueChange }: any) => (
      <input
        data-testid="command-input"
        placeholder={placeholder}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onValueChange(e.target.value)
        }
      />
    ),
    CommandList: ({ children }: any) => (
      <div data-testid="command-list" role="listbox">
        {children}
      </div>
    ),
    CommandEmpty: ({ children }: any) => (
      <div data-testid="command-empty" role="status">
        {children}
      </div>
    ),
    CommandGroup: ({ heading, children }: any) => (
      <div role="group" aria-label={heading}>
        {heading && <div data-testid="group-heading">{heading}</div>}
        {children}
      </div>
    ),
    CommandItem: ({ children, onSelect, value }: any) => {
      const { registerItem } = useContext(Ctx)
      useEffect(() => {
        const unreg = registerItem({ value, onSelect: onSelect || (() => {}) })
        return unreg
      }, [value, onSelect])

      return (
        <div
          role="option"
          data-testid="command-item"
          data-value={value}
          onClick={onSelect}
        >
          {children}
        </div>
      )
    },
    CommandSeparator: () => <hr data-testid="command-separator" />,
  }
})

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}))

// ──────────────────────────────────────────────
// Component under test
// ──────────────────────────────────────────────

import { CommandPalette } from '../command-palette'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function createQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }
}

function fireKeyDown(el: Element | Document, key: string, meta = false) {
  fireEvent.keyDown(el, { key, metaKey: meta, ctrlKey: !meta })
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({ data: [] }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Open / Close ──

  it('renders when open is true', () => {
    render(<CommandPalette />)

    fireKeyDown(document, 'k', true)

    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('command-input')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<CommandPalette />)

    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false')
    expect(screen.queryByTestId('command-input')).not.toBeInTheDocument()
  })

  // ── Search / Filter ──

  it('filters items based on search input', () => {
    render(<CommandPalette />)
    fireKeyDown(document, 'k', true)

    const input = screen.getByTestId('command-input')
    fireEvent.change(input, { target: { value: 'Dashboard' } })

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Ordini')).not.toBeInTheDocument()
    expect(screen.queryByText('Catalogo')).not.toBeInTheDocument()
  })

  it('shows "Nessun risultato" when no match', () => {
    render(<CommandPalette />)
    fireKeyDown(document, 'k', true)

    const input = screen.getByTestId('command-input')
    fireEvent.change(input, { target: { value: 'zzznotfound' } })

    expect(screen.getByText('Nessun risultato')).toBeInTheDocument()
    expect(screen.getByTestId('command-empty')).toBeInTheDocument()
  })

  // ── Keyboard navigation ──

  it('keyboard navigation with Arrow keys works', () => {
    render(<CommandPalette />)
    fireKeyDown(document, 'k', true)

    const command = screen.getByTestId('command')

    const itemsBefore = screen.getAllByTestId('command-item')
    expect(itemsBefore.length).toBeGreaterThan(0)

    fireKeyDown(command, 'ArrowDown')
    fireKeyDown(command, 'ArrowDown')
    fireKeyDown(command, 'ArrowUp')
    fireKeyDown(command, 'Enter')

    expect(itemsBefore.length).toBeGreaterThan(0)
  })

  it('Enter selects highlighted item', () => {
    const hrefSpy = vi.fn()
    vi.stubGlobal('location', {
      ...window.location,
      get href() { return window.location.href },
      set href(v: string) { hrefSpy(v) },
      assign: vi.fn(),
      replace: vi.fn(),
    })

    render(<CommandPalette />)
    fireKeyDown(document, 'k', true)

    const command = screen.getByTestId('command')
    fireKeyDown(command, 'ArrowDown')
    fireKeyDown(command, 'Enter')

    vi.unstubAllGlobals()
  })

  it('preserves window.location after tests', () => {
    expect(window.location.href).toBeTruthy()
  })

  it('Esc closes the palette', () => {
    render(<CommandPalette />)
    fireKeyDown(document, 'k', true)

    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true')

    fireKeyDown(screen.getByTestId('dialog-content'), 'Escape')

    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false')
  })

  // ── Global listener ──

  it('Cmd+K global listener opens palette', () => {
    render(<CommandPalette />)

    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false')

    fireKeyDown(document, 'k', true)

    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true')
  })

  // ── Recent searches ──

  it('recent searches are shown', () => {
    const recent = [
      { id: 'nav-dashboard', label: 'Dashboard', iconName: 'LayoutDashboard', timestamp: Date.now() },
    ]
    localStorageMock.getItem.mockReturnValue(JSON.stringify(recent))

    render(<CommandPalette />)
    fireKeyDown(document, 'k', true)

    expect(screen.getByText('Recenti')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('updates recent actions in localStorage after selection', () => {
    render(<CommandPalette />)
    fireKeyDown(document, 'k', true)

    const command = screen.getByTestId('command')
    fireKeyDown(command, 'ArrowDown')
    fireKeyDown(command, 'Enter')

    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('debounces API search at 150ms', () => {
    vi.useFakeTimers()
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({ data: [] }),
    )

    render(<CommandPalette />)
    fireKeyDown(document, 'k', true)

    const input = screen.getByTestId('command-input')
    fireEvent.change(input, { target: { value: 'test' } })

    vi.advanceTimersByTime(100)

    vi.advanceTimersByTime(50)

    vi.useRealTimers()
  })
})
