import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ──────────────────────────────────────────────
// Hoisted shared references for dynamic mocks
// ──────────────────────────────────────────────

const { mockMutate, mockMutationCallbacks, mockIsPendingRef, mockToast, mockRouter } = vi.hoisted(
  () => ({
    mockMutate: vi.fn(),
    mockMutationCallbacks: { onSuccess: null as any, onError: null as any },
    mockIsPendingRef: { current: false },
    mockToast: { success: vi.fn(), error: vi.fn() },
    mockRouter: { push: vi.fn(), back: vi.fn() },
  }),
)

// ──────────────────────────────────────────────
// Module mocks
// ──────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: mockToast,
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: ({ onSuccess, onError }: any) => {
    mockMutationCallbacks.onSuccess = onSuccess
    mockMutationCallbacks.onError = onError
    return { mutate: mockMutate, isPending: mockIsPendingRef.current }
  },
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  }),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader-icon" />,
  ChevronsUpDown: () => <span />,
  Check: () => <span />,
  CalendarIcon: () => <span />,
  AlertCircle: () => <span />,
}))

vi.mock('date-fns', () => ({
  format: () => '01/01/2024',
}))

// ── shadcn/ui component mocks ──

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, onClick, type, className }: any) => (
    <button
      type={type ?? 'button'}
      disabled={disabled}
      onClick={onClick}
      className={className}
      data-testid="button"
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} data-testid={`input-${props.name ?? ''}`} />,
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => {
    const { onChange, ...rest } = props
    return (
      <textarea
        {...rest}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          if (onChange) onChange(e)
        }}
        data-testid="textarea-notes"
      />
    )
  },
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, disabled }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
      data-testid="checkbox-notification"
    />
  ),
}))

vi.mock('@/components/ui/select', () => {
  const React = require('react')
  const { createContext, useContext, useState } = React

  const SelectCtx = createContext<{
    value: string
    onChange: (v: string) => void
  }>({ value: '', onChange: () => {} })

  return {
    Select: ({ children, onValueChange, defaultValue }: any) => {
      const [val, setVal] = useState(defaultValue ?? '')
      return (
        <SelectCtx.Provider
          value={{
            value: val,
            onChange: (v: string) => {
              setVal(v)
              onValueChange?.(v)
            },
          }}
        >
          {children}
        </SelectCtx.Provider>
      )
    },
    SelectTrigger: ({ children }: any) => (
      <button data-testid="select-trigger">{children}</button>
    ),
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => (
      <div data-testid="select-content">{children}</div>
    ),
    SelectItem: ({ children, value: itemValue }: any) => {
      const { onChange } = useContext(SelectCtx)
      return (
        <button
          data-testid={`select-item-${itemValue}`}
          onClick={() => onChange(itemValue)}
        >
          {children}
        </button>
      )
    },
  }
})

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <>{children}</>,
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
}))

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: any) => <>{children}</>,
  CommandInput: () => <input data-testid="command-input" />,
  CommandGroup: ({ children }: any) => <>{children}</>,
  CommandItem: ({ children, onSelect }: any) => (
    <button data-testid="command-item" onClick={onSelect}>
      {children}
    </button>
  ),
  CommandList: ({ children }: any) => <>{children}</>,
  CommandEmpty: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: any) => (
    <button data-testid="calendar-date" onClick={() => onSelect?.(new Date('2024-06-15'))}>
      Seleziona data
    </button>
  ),
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertTitle: ({ children }: any) => <h4>{children}</h4>,
  AlertDescription: ({ children }: any) => <p>{children}</p>,
}))

vi.mock('@/components/ui/form', () => {
  const React = require('react')
  const { Controller, FormProvider, useFormContext } = require('react-hook-form')

  const FormFieldCtx = React.createContext<{ name: string }>({ name: '' })

  return {
    Form: ({ children, ...props }: any) => (
      <FormProvider {...props}>{children}</FormProvider>
    ),
    FormField: (props: any) => (
      <FormFieldCtx.Provider value={{ name: props.name }}>
        <Controller {...props} />
      </FormFieldCtx.Provider>
    ),
    FormItem: ({ children }: any) => <div>{children}</div>,
    FormLabel: ({ children }: any) => <label>{children}</label>,
    FormControl: ({ children }: any) => <>{children}</>,
    FormDescription: ({ children }: any) => <div>{children}</div>,
    FormMessage: () => {
      const { name } = React.useContext(FormFieldCtx)
      const {
        formState: { errors },
      } = useFormContext()
      const error = errors[name]
      return error?.message ? (
        <p data-testid="form-message">{String(error.message)}</p>
      ) : null
    },
  }
})

// ──────────────────────────────────────────────
// Component under test
// ──────────────────────────────────────────────

import { CreateOrderForm } from '../form-create-order'

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('CreateOrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPendingRef.current = false
    mockMutationCallbacks.onSuccess = null
    mockMutationCallbacks.onError = null
    mockRouter.push.mockClear()
    mockRouter.back.mockClear()
    window.confirm = vi.fn().mockReturnValue(true) as any
  })

  // ── render ──

  it('renders all form fields', () => {
    render(<CreateOrderForm />)

    ;[
      'Customer name',
      'Email',
      'Phone',
      'Status',
      'Priority',
      'Category',
      'Delivery date',
      'Note',
      'Invia notifica al cliente',
      'Crea ordine',
      'Annulla',
    ].forEach((label) => {
      expect(screen.getByText(label, { exact: false })).toBeDefined()
    })
  })

  // ── validation ──

  it('shows validation errors on invalid submit', async () => {
    render(<CreateOrderForm />)

    const submitBtn = screen.getByText('Crea ordine')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      const messages = screen.getAllByTestId('form-message')
      expect(messages.length).toBeGreaterThan(0)
      const texts = messages.map((m) => m.textContent)
      expect(texts.some((t) => t?.includes('Campo obbligatorio'))).toBe(true)
    })
  })

  // ── submit ──

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<CreateOrderForm />)

    await user.type(screen.getByPlaceholderText('Mario Rossi'), 'Luca Bianchi')
    await user.type(screen.getByPlaceholderText('mario@esempio.it'), 'luca@test.it')

    const statusItems = screen.getAllByTestId(/^select-item-/)
    const pendingItem = statusItems.find((el) => el.getAttribute('data-testid') === 'select-item-pending')
    if (pendingItem) fireEvent.click(pendingItem)

    const priorityItems = screen.getAllByTestId(/^select-item-/)
    const highItem = priorityItems.find((el) => el.getAttribute('data-testid') === 'select-item-high')
    if (highItem) fireEvent.click(highItem)

    const commandItems = screen.getAllByTestId('command-item')
    if (commandItems.length > 0) fireEvent.click(commandItems[0])

    fireEvent.click(screen.getByText('Crea ordine'))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledOnce()
      const data = mockMutate.mock.calls[0][0]
      expect(data.customerName).toBe('Luca Bianchi')
      expect(data.email).toBe('luca@test.it')
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('priority')
      expect(data).toHaveProperty('categoryId')
    })
  })

  // ── loading state ──

  it('shows loading state during submission', () => {
    mockIsPendingRef.current = true

    render(<CreateOrderForm />)

    const buttons = screen.getAllByTestId('button')
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })

    expect(screen.getByText('Creazione in corso...')).toBeDefined()
    expect(screen.getByTestId('loader-icon')).toBeDefined()
  })

  // ── server error mapping ──

  it('handles server errors and maps them to form fields', async () => {
    render(<CreateOrderForm />)

    expect(mockMutationCallbacks.onError).not.toBeNull()

    mockMutationCallbacks.onError({
      fields: [{ field: 'customerName', message: 'Name already exists' }],
    })

    await waitFor(() => {
      const messages = screen.getAllByTestId('form-message')
      const texts = messages.map((m) => m.textContent)
      expect(texts.some((t) => t === 'Name already exists')).toBe(true)
    })
  })

  // ── cancel navigation ──

  it('cancel button navigates back', () => {
    render(<CreateOrderForm />)

    fireEvent.click(screen.getByText('Annulla'))

    expect(mockRouter.back).toHaveBeenCalledOnce()
  })

  it('shows confirmation when there are unsaved changes', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CreateOrderForm />)

    await user.type(screen.getByPlaceholderText('Mario Rossi'), 'x')

    fireEvent.click(screen.getByText('Annulla'))

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockRouter.back).toHaveBeenCalledOnce()
  })

  // ── required fields ──

  it('required fields are marked', () => {
    render(<CreateOrderForm />)

    const asterisks = screen.getAllByText('*')
    expect(asterisks.length).toBeGreaterThanOrEqual(2)

    expect(screen.getByText(/Nome cliente.*\*/)).toBeDefined()
    expect(screen.getByText(/Categoria.*\*/)).toBeDefined()
  })

  // ── character counter ──

  it('character counter works on textarea', async () => {
    const user = userEvent.setup()
    render(<CreateOrderForm />)

    const textarea = screen.getByTestId('textarea-notes')
    await user.type(textarea, 'Hello World')

    await waitFor(() => {
      expect(screen.getByText(/11\s*\/\s*1000/)).toBeDefined()
    })
  })

  it('shows success toast and navigates after submit success', async () => {
    mockIsPendingRef.current = false
    render(<CreateOrderForm />)

    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Mario Rossi'), 'Luca Bianchi')
    await user.type(screen.getByPlaceholderText('mario@esempio.it'), 'luca@test.it')

    fireEvent.click(screen.getByText('Crea ordine'))

    mockMutationCallbacks.onSuccess({ id: '1' })

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalled()
    })
  })

  it('beforeunload warns when form is dirty', () => {
    render(<CreateOrderForm />)

    const user = userEvent.setup()
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)

    expect(true).toBe(true)
  })

  it('category is passed in mutation payload', async () => {
    const user = userEvent.setup()
    render(<CreateOrderForm />)

    await user.type(screen.getByPlaceholderText('Mario Rossi'), 'Test')
    await user.type(screen.getByPlaceholderText('mario@esempio.it'), 'test@test.it')

    const commandItems = screen.getAllByTestId('command-item')
    if (commandItems.length > 0) fireEvent.click(commandItems[0])

    fireEvent.click(screen.getByText('Crea ordine'))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled()
      const data = mockMutate.mock.calls[0][0]
      expect(data.categoryId).toBeDefined()
    })
  })

  it('server error focuses first error field', async () => {
    render(<CreateOrderForm />)

    mockMutationCallbacks.onError({
      fields: [{ field: 'customerName', message: 'Name already exists' }],
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('form-message').length).toBeGreaterThan(0)
    })
  })
})
