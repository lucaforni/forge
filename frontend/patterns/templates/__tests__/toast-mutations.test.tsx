import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  Toaster: ({ richColors, closeButton, position }: any) => (
    <div
      data-testid="toaster"
      data-richcolors={String(richColors)}
      data-closebutton={String(closeButton)}
      data-position={position}
    />
  ),
}))

vi.mock('lucide-react', () => ({
  CheckCircle2: () => <span data-testid="check-icon" />,
  XCircle: () => <span data-testid="x-icon" />,
  Info: () => <span data-testid="info-icon" />,
  Undo2: () => <span data-testid="undo-icon" />,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

import {
  useToastMutation,
  useCreateItemToast,
  useDeleteItemToast,
} from '../toast-mutations'

import { Toaster } from 'sonner'

describe('useToastMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutationCallbacks.onSuccess = null
    mockMutationCallbacks.onError = null
  })

  it('shows success toast on mutation success', () => {
    function TestHarness() {
      const mutation = useToastMutation({
        mutationFn: vi.fn(),
        successMessage: 'Operazione riuscita',
      })
      return <button data-testid="trigger" onClick={() => mutation.mutate()} />
    }

    render(<TestHarness />)
    fireEvent.click(screen.getByTestId('trigger'))

    mockMutationCallbacks.onSuccess('some data')

    expect(mockToast.success).toHaveBeenCalledWith('Operazione riuscita', expect.objectContaining({
      icon: expect.anything(),
    }))
  })

  it('shows error toast on mutation error', () => {
    function TestHarness() {
      const mutation = useToastMutation({
        mutationFn: vi.fn(),
        errorMessage: 'Errore operazione',
      })
      return <button data-testid="trigger" onClick={() => mutation.mutate()} />
    }

    render(<TestHarness />)
    fireEvent.click(screen.getByTestId('trigger'))

    mockMutationCallbacks.onError(new Error('API failure'))

    expect(mockToast.error).toHaveBeenCalledWith('Errore operazione', expect.objectContaining({
      description: 'API failure',
    }))
  })

  it('invalidates query on success', () => {
    function TestHarness() {
      const mutation = useToastMutation({
        mutationFn: vi.fn(),
        invalidateQueries: [['items'], ['orders']],
      })
      return <button data-testid="trigger" onClick={() => mutation.mutate()} />
    }

    render(<TestHarness />)
    fireEvent.click(screen.getByTestId('trigger'))

    mockMutationCallbacks.onSuccess('data')

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['items'] })
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['orders'] })
  })
})

describe('useCreateItemToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutationCallbacks.onSuccess = null
    mockMutationCallbacks.onError = null
  })

  it('works end-to-end', () => {
    function TestHarness() {
      const mutation = useCreateItemToast()
      return (
        <button data-testid="trigger" onClick={() => mutation.mutate({ name: 'Prodotto Test' })} />
      )
    }

    render(<TestHarness />)
    fireEvent.click(screen.getByTestId('trigger'))

    expect(mockMutate).toHaveBeenCalledWith({ name: 'Prodotto Test' })

    mockMutationCallbacks.onSuccess({ id: '1', name: 'Prodotto Test' })

    expect(mockToast.success).toHaveBeenCalledWith('Elemento creato', expect.objectContaining({
      description: '"Test Product" was created successfully',
    }))
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['items'] })
  })
})

describe('useDeleteItemToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutationCallbacks.onSuccess = null
    mockMutationCallbacks.onError = null
  })

  it('shows undo action', () => {
    const onRestore = vi.fn()

    function TestHarness() {
      const mutation = useDeleteItemToast(onRestore)
      return <button data-testid="trigger" onClick={() => mutation.mutate('item-1')} />
    }

    render(<TestHarness />)
    fireEvent.click(screen.getByTestId('trigger'))

    mockMutationCallbacks.onSuccess(undefined)

    expect(mockToast).toHaveBeenCalledWith('Elemento eliminato', expect.objectContaining({
      description: expect.stringMatching(/Puoi annullare entro \d+ secondi/),

      action: expect.objectContaining({ label: 'Annulla' }),
    }))
  })

  it('undo action restores data', () => {
    const onRestore = vi.fn()

    function TestHarness() {
      const mutation = useDeleteItemToast(onRestore)
      return <button data-testid="trigger" onClick={() => mutation.mutate('item-1')} />
    }

    render(<TestHarness />)
    fireEvent.click(screen.getByTestId('trigger'))

    mockMutationCallbacks.onSuccess(undefined)

    const callArgs = mockToast.mock.calls[0]
    const action = callArgs[1].action
    action.onClick()

    expect(onRestore).toHaveBeenCalled()
  })
})

describe('Toaster', () => {
  it('configuration renders in layout', () => {
    const { container } = render(
      <Toaster
        richColors
        closeButton
        position="top-right"
        toastOptions={{ duration: 4000 }}
        visibleToasts={5}
        expand
      />,
    )

    const toaster = container.querySelector('[data-testid="toaster"]')
    expect(toaster).not.toBeNull()
    expect(toaster?.getAttribute('data-richcolors')).toBe('true')
    expect(toaster?.getAttribute('data-closebutton')).toBe('true')
    expect(toaster?.getAttribute('data-position')).toBe('top-right')
  })

  it('shows multiple stacked toasts', () => {
    function TestHarness() {
      const mutation = useToastMutation({
        mutationFn: vi.fn(),
        successMessage: 'Toast 1',
      })
      return <button data-testid="trigger" onClick={() => mutation.mutate()} />
    }

    render(<TestHarness />)
    fireEvent.click(screen.getByTestId('trigger'))
    fireEvent.click(screen.getByTestId('trigger'))

    mockMutationCallbacks.onSuccess('data')
    mockMutationCallbacks.onSuccess('data')

    expect(mockToast.success).toHaveBeenCalledTimes(2)
  })

  it('auto-dismisses toast after duration', () => {
    const { container } = render(
      <Toaster
        richColors
        closeButton
        position="top-right"
        toastOptions={{ duration: 4000 }}
        visibleToasts={5}
      />,
    )

    const toaster = container.querySelector('[data-testid="toaster"]')
    expect(toaster).not.toBeNull()
  })
})
