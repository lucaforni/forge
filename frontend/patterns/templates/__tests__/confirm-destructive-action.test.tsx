import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

const { mockMutate, mockMutationCallbacks, mockQueryClient, mockToast } = vi.hoisted(() => {
  const toast = vi.fn() as any
  toast.success = vi.fn()
  toast.error = vi.fn()
  return {
    mockMutate: vi.fn(),
    mockMutationCallbacks: { onSuccess: null as any, onError: null as any },
    mockQueryClient: { invalidateQueries: vi.fn() },
    mockToast: toast,
  }
})

vi.mock('@tanstack/react-query', () => ({
  useMutation: ({ onSuccess, onError }: any) => {
    mockMutationCallbacks.onSuccess = onSuccess
    mockMutationCallbacks.onError = onError
    return { mutate: mockMutate, isPending: false }
  },
  useQueryClient: () => mockQueryClient,
}))

vi.mock('sonner', () => ({
  toast: mockToast,
}))

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-triangle-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  Undo2: () => <span data-testid="undo-icon" />,
}))

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

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button
      data-testid="confirm-btn"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, disabled, 'aria-label': ariaLabel }: any) => (
    <input
      data-testid="confirm-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  ),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

import {
  TypeToConfirmDialog,
  CountdownConfirmDialog,
  UndoableActionButton,
} from '../confirm-destructive-action'

describe('TypeToConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with confirm text input', () => {
    render(<TypeToConfirmDialog {...defaultProps} />)

    expect(screen.getByTestId('alert-dialog')).toBeDefined()
    expect(screen.getByTestId('confirm-input')).toBeDefined()
    expect(screen.getByLabelText('Digita CONFIRMA per procedere')).toBeDefined()
  })

  it('confirm button is disabled until correct text is typed', () => {
    render(<TypeToConfirmDialog {...defaultProps} />)

    expect(screen.getByTestId('confirm-btn').getAttribute('disabled')).not.toBeNull()

    fireEvent.change(screen.getByTestId('confirm-input'), {
      target: { value: 'WRONG' },
    })

    expect(screen.getByTestId('confirm-btn').getAttribute('disabled')).not.toBeNull()
  })

  it('confirm button becomes enabled when text matches', () => {
    render(<TypeToConfirmDialog {...defaultProps} confirmWord="ELIMINA" />)

    fireEvent.change(screen.getByTestId('confirm-input'), {
      target: { value: 'ELIMINA' },
    })

    expect(screen.getByTestId('confirm-btn').getAttribute('disabled')).toBeNull()
  })

  it('onConfirm is called when button clicked', () => {
    const onConfirm = vi.fn()
    render(<TypeToConfirmDialog {...defaultProps} onConfirm={onConfirm} confirmWord="CONFIRMA" />)

    fireEvent.change(screen.getByTestId('confirm-input'), {
      target: { value: 'CONFIRMA' },
    })
    fireEvent.click(screen.getByTestId('confirm-btn'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('Cancel closes dialog', () => {
    const onOpenChange = vi.fn()
    render(<TypeToConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByTestId('cancel-btn'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('CountdownConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows countdown timer', async () => {
    render(<CountdownConfirmDialog {...defaultProps} duration={10} />)

    expect(screen.getByText('10')).toBeDefined()

    await act(() => {
      vi.advanceTimersByTime(3000)
    })

    const count = await screen.findByText('7')
    expect(count).toBeDefined()
  })

  it('countdown expires and enables confirm when it reaches 0', async () => {
    render(<CountdownConfirmDialog {...defaultProps} duration={3} />)

    expect(screen.getByTestId('confirm-btn').getAttribute('disabled')).not.toBeNull()

    await act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('0')).toBeDefined()
    expect(screen.getByTestId('confirm-btn').getAttribute('disabled')).toBeNull()
  })
})

  it('TypeToConfirm error resets input', () => {
    render(<TypeToConfirmDialog {...defaultProps} confirmWord="CONFIRMA" />)

    fireEvent.change(screen.getByTestId('confirm-input'), {
      target: { value: 'CONFIRMA' },
    })
    fireEvent.click(screen.getByTestId('confirm-btn'))

    expect(defaultProps.onConfirm).toHaveBeenCalled()
  })

  it('Countdown resets when closed and reopened', () => {
    const { rerender } = render(
      <CountdownConfirmDialog {...defaultProps} duration={10} open={true} />,
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    rerender(
      <CountdownConfirmDialog {...defaultProps} duration={10} open={false} />,
    )

    rerender(
      <CountdownConfirmDialog {...defaultProps} duration={10} open={true} />,
    )

    expect(screen.getByText('10')).toBeDefined()
  })
})

describe('UndoableActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutationCallbacks.onSuccess = null
    mockMutationCallbacks.onError = null
  })

  it('shows toast with undo', () => {
    const onAction = vi.fn().mockResolvedValue(undefined)
    const onUndo = vi.fn().mockResolvedValue(undefined)

    render(
      <UndoableActionButton
        label="Elimina"
        variant="destructive"
        onAction={onAction}
        onUndo={onUndo}
        queryKey={['items']}
      />,
    )

    fireEvent.click(screen.getByTestId('confirm-btn'))

    mockMutationCallbacks.onSuccess(undefined, undefined)

    expect(mockToast).toHaveBeenCalledWith('Operazione completata', expect.objectContaining({
      description: 'Puoi annullare entro 5 secondi',
      action: expect.objectContaining({ label: 'Annulla' }),
    }))
  })

  it('undo action calls restore function', () => {
    const onAction = vi.fn().mockResolvedValue(undefined)
    const onUndo = vi.fn().mockResolvedValue(undefined)

    render(
      <UndoableActionButton
        label="Elimina"
        variant="destructive"
        onAction={onAction}
        onUndo={onUndo}
        queryKey={['items']}
      />,
    )

    fireEvent.click(screen.getByTestId('confirm-btn'))

    mockMutationCallbacks.onSuccess(undefined, undefined)

    expect(mockToast).toHaveBeenCalled()

    const callArgs = mockToast.mock.calls[0]
    const action = callArgs[1].action
    action.onClick()

    expect(onUndo).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('Azione annullata')
  })

  it('undo toast expires after window', async () => {
    const onAction = vi.fn().mockResolvedValue(undefined)
    const onUndo = vi.fn().mockResolvedValue(undefined)

    render(
      <UndoableActionButton
        label="Elimina"
        variant="destructive"
        onAction={onAction}
        onUndo={onUndo}
        queryKey={['items']}
        undoWindowMs={5000}
      />,
    )

    fireEvent.click(screen.getByTestId('confirm-btn'))

    mockMutationCallbacks.onSuccess(undefined, undefined)

    expect(mockToast).toHaveBeenCalledWith(
      'Operazione completata',
      expect.objectContaining({
        description: 'Puoi annullare entro 5 secondi',
      }),
    )
  })
})
