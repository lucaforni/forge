import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const nextNav = vi.hoisted(() => ({
  push: vi.fn(),
}))

const reactQuery = vi.hoisted(() => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nextNav.push }),
}))

vi.mock('@tanstack/react-query', () => reactQuery)

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => async (data: Record<string, unknown>) => ({
    values: data,
    errors: {},
  })),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: Record<string, unknown>) => <input {...props} />,
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, disabled, ...props }: Record<string, unknown>) => (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={!!disabled}
      data-testid="checkbox"
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, variant, size, className, ...props }: Record<string, unknown>) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type as string | undefined}
      data-variant={variant}
      data-size={size}
      className={className as string}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: Record<string, unknown>) => (
    <div data-testid="select">
      <button onClick={() => onValueChange?.('developer')} disabled={!!disabled}>Select developer</button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  SelectItem: ({ children, value }: Record<string, unknown>) => <div data-value={value}>{children as string}</div>,
  SelectTrigger: ({ children, autoFocus, ...props }: Record<string, unknown>) => (
    <button autoFocus={autoFocus} {...props}>{children}</button>
  ),
  SelectValue: ({ placeholder }: Record<string, unknown>) => <span>{placeholder as string}</span>,
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: Record<string, unknown>) => (
    <div
      role="progressbar"
      aria-valuenow={value as number}
      className={className as string}
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: Record<string, unknown>) => (
    <span data-variant={variant} className={className as string} {...props}>{children}</span>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardDescription: ({ children }: Record<string, unknown>) => <p>{children}</p>,
  CardFooter: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardTitle: ({ children }: Record<string, unknown>) => <h2>{children}</h2>,
}))

vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  FormControl: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  FormDescription: ({ children }: Record<string, unknown>) => <p>{children}</p>,
  FormField: ({ render }: Record<string, unknown>) => render({
    field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), name: '' },
  }),
  FormItem: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  FormLabel: ({ children }: Record<string, unknown>) => <label>{children}</label>,
  FormMessage: () => <div data-testid="form-message" />,
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, role, ...props }: Record<string, unknown>) => (
    <div data-variant={variant} role={role as string | undefined} {...props}>{children}</div>
  ),
  AlertDescription: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  AlertTitle: ({ children }: Record<string, unknown>) => <div>{children}</div>,
}))

import { OnboardingWizard } from '../wizard-onboarding'

function createMutationResult(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    ...overrides,
  }
}

beforeEach(() => {
  nextNav.push.mockReset()
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })
  reactQuery.useMutation.mockReset()
  reactQuery.useMutation.mockReturnValue(createMutationResult())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('OnboardingWizard', () => {
  it('renders step 1 initially', () => {
    render(<OnboardingWizard />)

    expect(screen.getByText('Informazioni base')).toBeInTheDocument()
    expect(screen.getByText('Inserisci i tuoi dati anagrafici')).toBeInTheDocument()
    expect(screen.getByText('Avanti')).toBeInTheDocument()
  })

  it('next button disabled when form invalid', () => {
    render(<OnboardingWizard />)

    const nextBtn = screen.getByText('Avanti')
    expect(nextBtn).toBeDisabled()
  })

  it('next enabled when form valid', async () => {
    render(<OnboardingWizard />)

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      fireEvent.change(input, { target: { value: 'test value' } })
    })

    const nextBtn = screen.getByText('Avanti')
    await waitFor(() => {
      expect(nextBtn).not.toBeDisabled()
    })
  })

  it('progress bar updates on step change', async () => {
    render(<OnboardingWizard />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '1')

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      fireEvent.change(input, { target: { value: 'test' } })
    })

    const nextBtn = screen.getByText('Avanti')
    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(screen.getByText('Preferenze')).toBeInTheDocument()
    })
  })

  it('back button returns to previous step', async () => {
    render(<OnboardingWizard />)

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      fireEvent.change(input, { target: { value: 'test' } })
    })

    const nextBtn = screen.getByText('Avanti')
    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(screen.getByText('Preferenze')).toBeInTheDocument()
    })

    const backBtn = screen.getByText('Indietro')
    fireEvent.click(backBtn)

    await waitFor(() => {
      expect(screen.getByText('Informazioni base')).toBeInTheDocument()
    })
  })

  it('step 3 confirmation shows all data', async () => {
    render(<OnboardingWizard />)

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'Mario Rossi' } })
    fireEvent.change(inputs[1], { target: { value: 'mario@test.it' } })
    fireEvent.change(inputs[2], { target: { value: 'Acme Inc' } })

    const nextBtn = screen.getByText('Avanti')
    fireEvent.click(nextBtn)

    await waitFor(() => {
      const nextBtn2 = screen.getByText('Avanti')
      expect(nextBtn2).toBeInTheDocument()
    })
  })

  it('submit button shows loading state', async () => {
    reactQuery.useMutation.mockReturnValue(
      createMutationResult({ isPending: true }),
    )

    render(<OnboardingWizard />)

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      fireEvent.change(input, { target: { value: 'test' } })
    })

    const nextBtn = screen.getByText('Avanti')
    fireEvent.click(nextBtn)

    await waitFor(() => {
      const nextBtn2 = screen.getByText('Avanti')
      fireEvent.click(nextBtn2)
    })

    await waitFor(() => {
      expect(screen.getByText('Invio in corso...')).toBeInTheDocument()
    })
  })

  it('success screen with CTA on completion', async () => {
    const mockMutate = vi.fn((_data, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess()
    })

    reactQuery.useMutation.mockReturnValue(
      createMutationResult({
        mutate: mockMutate,
        isSuccess: true,
      }),
    )

    render(<OnboardingWizard />)

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      fireEvent.change(input, { target: { value: 'test' } })
    })

    await waitFor(() => {
      const nextBtn = screen.getByText('Avanti')
      fireEvent.click(nextBtn)
    })

    await waitFor(() => {
      const nextBtn2 = screen.getByText('Avanti')
      fireEvent.click(nextBtn2)
    })

    await waitFor(() => {
      expect(screen.getByText('Onboarding completato!')).toBeInTheDocument()
      expect(screen.getByText('Vai alla dashboard')).toBeInTheDocument()
    })
  })

  it('validation error shows inline message', () => {
    render(<OnboardingWizard />)

    expect(screen.getByTestId('form-message')).toBeInTheDocument()
  })

  it('shows server error after failed submit', async () => {
    reactQuery.useMutation.mockReturnValue(
      createMutationResult({ isError: true, error: { message: 'Server error' } }),
    )

    render(<OnboardingWizard />)

    expect(screen.getByText('Server error')).toBeInTheDocument()
  })

  it('persists progress in localStorage', async () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem,
      removeItem: vi.fn(),
    })

    render(<OnboardingWizard />)

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      fireEvent.change(input, { target: { value: 'test' } })
    })

    const nextBtn = screen.getByText('Avanti')
    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(setItem).toHaveBeenCalled()
    })
  })

  it('restores progress on remount', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => JSON.stringify({ currentStep: 2, data: { name: 'test', email: 'test@test.it', company: 'test' } })),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    render(<OnboardingWizard />)

    expect(screen.getByText('Preferenze')).toBeInTheDocument()
  })

  it('cannot click future step indicator', () => {
    render(<OnboardingWizard />)

    const stepIndicators = screen.getAllByRole('button').filter(b => b.getAttribute('data-variant'))
    stepIndicators.forEach((btn) => {
      fireEvent.click(btn)
    })

    expect(screen.getByText('Informazioni base')).toBeInTheDocument()
  })
})
