import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ──────────────────────────────────────────────
// Hoisted shared references for dynamic mocks
// ──────────────────────────────────────────────

const { mockMutate, mockMutationCallbacks, mockQueryClient, mockToast } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockMutationCallbacks: { onSuccess: null as any, onError: null as any },
  mockQueryClient: { invalidateQueries: vi.fn() },
  mockToast: { success: vi.fn(), error: vi.fn() },
}))

// ──────────────────────────────────────────────
// Module mocks
// ──────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: mockToast,
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: ({ onSuccess, onError }: any) => {
    mockMutationCallbacks.onSuccess = onSuccess
    mockMutationCallbacks.onError = onError
    return { mutate: mockMutate, isPending: false }
  },
  useQueryClient: () => mockQueryClient,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-triangle-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
}))

// ── shadcn/ui alert-dialog mock ──

vi.mock('@/components/ui/alert-dialog', () => {
  const React = require('react')
  const AlertDialogCtx = React.createContext<{
    open: boolean
    onOpenChange: (v: boolean) => void
  }>({ open: false, onOpenChange: () => {} })

  return {
    AlertDialog: ({ children, open, onOpenChange }: any) =>
      open ? (
        <AlertDialogCtx.Provider value={{ open, onOpenChange }}>
          <div data-testid="alert-dialog">{children}</div>
        </AlertDialogCtx.Provider>
      ) : null,
    AlertDialogContent: ({ children }: any) => {
      const { onOpenChange } = React.useContext(AlertDialogCtx)
      return (
        <div
          data-testid="alert-dialog-content"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Escape') onOpenChange(false)
          }}
        >
          {children}
        </div>
      )
    },
    AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
    AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
    AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
    AlertDialogCancel: ({ children, disabled }: any) => {
      const { onOpenChange } = React.useContext(AlertDialogCtx)
      return (
        <button
          data-testid="cancel-btn"
          disabled={disabled}
          onClick={() => onOpenChange(false)}
        >
          {children}
        </button>
      )
    },
    AlertDialogAction: ({ children, disabled, onClick }: any) => (
      <button
        data-testid="confirm-btn"
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    ),
  }
})

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert-error" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => <p>{children}</p>,
}))

// ──────────────────────────────────────────────
// Components under test
// ──────────────────────────────────────────────

import {
  DeleteConfirmDialog,
  useDeleteItem,
  DeleteConfirmDialogWithHook,
} from '../modal-confirm-delete'

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('DeleteConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    itemName: 'Cliente Mario Rossi',
    onConfirm: vi.fn(),
    isPending: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows dialog with warning message', () => {
    render(<DeleteConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Eliminare Cliente Mario Rossi?')).toBeDefined()
    expect(
      screen.getByText(/This action cannot be undone/),
    ).toBeDefined()
    expect(screen.getByTestId('alert-triangle-icon')).toBeDefined()
  })

  it('cancel button closes dialog', () => {
    const onOpenChange = vi.fn()
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        onOpenChange={onOpenChange}
      />,
    )

    fireEvent.click(screen.getByTestId('cancel-btn'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('confirm button is disabled during loading', () => {
    render(<DeleteConfirmDialog {...defaultProps} isPending={true} />)

    expect(screen.getByTestId('confirm-btn')).toBeDisabled()
    expect(screen.getByText('Eliminazione...')).toBeDefined()
    expect(screen.getByTestId('loader-icon')).toBeDefined()
  })

  it('cancel button is disabled during loading', () => {
    render(<DeleteConfirmDialog {...defaultProps} isPending={true} />)

    expect(screen.getByTestId('cancel-btn')).toBeDisabled()
  })

  it('confirm calls onConfirm on click', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByTestId('confirm-btn'))

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('shows error message when mutation fails', () => {
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        error="Errore di connessione al server"
      />,
    )

    expect(screen.getByTestId('alert-error')).toBeDefined()
    expect(screen.getByText('Errore di connessione al server')).toBeDefined()
  })

  it('does not show error alert if error is null', () => {
    render(<DeleteConfirmDialog {...defaultProps} error={null} />)

    expect(screen.queryByTestId('alert-error')).toBeNull()
  })

  it('shows success toast on completion', async () => {
    const mutationFn = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()

    render(
      <DeleteConfirmDialogWithHook
        open={true}
        onOpenChange={onOpenChange}
        itemName="test item"
        mutationFn={mutationFn}
        queryKey={['items']}
      />,
    )

    fireEvent.click(screen.getByTestId('confirm-btn'))

    expect(mockMutate).toHaveBeenCalledOnce()

    mockMutationCallbacks.onSuccess()

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        'test item eliminato con successo',
      )
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('shows error when mutation fails (via hook)', async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error('Errore API'))
    const onOpenChange = vi.fn()

    render(
      <DeleteConfirmDialogWithHook
        open={true}
        onOpenChange={onOpenChange}
        itemName="test item"
        mutationFn={mutationFn}
        queryKey={['items']}
      />,
    )

    fireEvent.click(screen.getByTestId('confirm-btn'))

    mockMutationCallbacks.onError(new Error('Errore API'))

    await waitFor(() => {
      expect(screen.getByText('Errore API')).toBeDefined()
    })
  })

  it('focus moves between buttons with Tab', async () => {
    const user = userEvent.setup()
    render(<DeleteConfirmDialog {...defaultProps} />)

    const cancelBtn = screen.getByTestId('cancel-btn')
    const confirmBtn = screen.getByTestId('confirm-btn')

    cancelBtn.focus()
    expect(document.activeElement).toBe(cancelBtn)

    await user.tab()
    expect(document.activeElement).toBe(confirmBtn)
  })

  it('Esc key closes dialog', () => {
    const onOpenChange = vi.fn()
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        onOpenChange={onOpenChange}
      />,
    )

    fireEvent.keyDown(screen.getByTestId('alert-dialog-content'), {
      key: 'Escape',
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders nothing if open=false', () => {
    render(
      <DeleteConfirmDialog {...defaultProps} open={false} />,
    )

    expect(screen.queryByTestId('alert-dialog')).toBeNull()
  })
})

describe('useDeleteItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutationCallbacks.onSuccess = null
    mockMutationCallbacks.onError = null
  })

  it('invalidates cache and closes dialog on success', () => {
    const onOpenChange = vi.fn()

    function TestHarness() {
      const { confirm } = useDeleteItem({
        itemName: 'ordine',
        mutationFn: vi.fn(),
        queryKey: ['orders'],
        onOpenChange,
      })
      return <button data-testid="trigger" onClick={confirm} />
    }

    render(<TestHarness />)
    fireEvent.click(screen.getByTestId('trigger'))

    expect(mockMutate).toHaveBeenCalled()

    mockMutationCallbacks.onSuccess()

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['orders'],
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockToast.success).toHaveBeenCalledWith('ordine eliminato con successo')
  })

  it('sets error state on error', () => {
    const onOpenChange = vi.fn()

    function TestHarness() {
      const { confirm, error } = useDeleteItem({
        itemName: 'ordine',
        mutationFn: vi.fn(),
        queryKey: ['orders'],
        onOpenChange,
      })
      return (
        <div>
          <button data-testid="trigger" onClick={confirm} />
          {error && <span data-testid="error-msg">{error}</span>}
        </div>
      )
    }

    render(<TestHarness />)
    fireEvent.click(screen.getByTestId('trigger'))

    mockMutationCallbacks.onError(new Error('Something went wrong'))

    expect(screen.getByTestId('error-msg').textContent).toBe(
      'Something went wrong',
    )
  })
})
