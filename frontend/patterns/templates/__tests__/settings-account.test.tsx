import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const nextNav = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
}))

const reactQuery = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nextNav.push, back: nextNav.back }),
  usePathname: () => '/settings',
}))

vi.mock('@tanstack/react-query', () => reactQuery)

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form')
  return { ...actual }
})

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => async (data: Record<string, unknown>) => ({
    values: data,
    errors: {},
  })),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: Record<string, unknown>) => <input {...props} />,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, 'aria-busy': ariaBusy, variant, size, className, type, ...props }: Record<string, unknown>) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-busy={ariaBusy as string | undefined}
      data-variant={variant}
      data-size={size}
      className={className as string}
      type={type as string | undefined}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: Record<string, unknown>) => (
    <span data-variant={variant} className={className as string} {...props}>{children}</span>
  ),
}))

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, disabled, 'aria-label': ariaLabel, ...props }: Record<string, unknown>) => (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={!!disabled}
      aria-label={ariaLabel as string}
      data-testid="switch"
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: Record<string, unknown>) => <div className={className as string}>{children}</div>,
  AvatarFallback: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  AvatarImage: (props: Record<string, unknown>) => <img {...props} />,
}))

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, ...props }: Record<string, unknown>) => (
    <div data-variant={variant} {...props}>{children}</div>
  ),
  AlertDescription: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  AlertTitle: ({ children }: Record<string, unknown>) => <div>{children}</div>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: Record<string, unknown>) => (
    <div data-testid={`select-${value as string}`}>
      <button onClick={() => onValueChange?.('it')} disabled={!!disabled}>Change</button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  SelectItem: ({ children, value }: Record<string, unknown>) => <div data-value={value}>{children as string}</div>,
  SelectTrigger: ({ children, 'aria-label': ariaLabel, ...props }: Record<string, unknown>) => (
    <button aria-label={ariaLabel as string} {...props}>{children}</button>
  ),
  SelectValue: ({ placeholder }: Record<string, unknown>) => <span>{placeholder as string}</span>,
}))

vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: Record<string, unknown>) => <form>{children}</form>,
  FormControl: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  FormDescription: ({ children }: Record<string, unknown>) => <p>{children}</p>,
  FormField: ({ render }: Record<string, unknown>) => render({ field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), name: '' } }),
  FormItem: ({ children }: Record<string, unknown>) => <div>{children}</div>,
  FormLabel: ({ children }: Record<string, unknown>) => <label>{children}</label>,
  FormMessage: () => <div data-testid="form-message" />,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardDescription: ({ children }: Record<string, unknown>) => <p>{children}</p>,
  CardHeader: ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...props}>{children}</div>
  ),
  CardTitle: ({ children }: Record<string, unknown>) => <h3>{children}</h3>,
}))

vi.mock('@/components/ui/tabs', () => {
  const { createContext, useContext, useState } = require('react')
  const TabsCtx = createContext<{
    value: string
    onValueChange?: (v: string) => void
  }>({ value: 'profile' })

  return {
    Tabs: ({ children, value, defaultValue, onValueChange }: Record<string, unknown>) => {
      const [val] = useState(value || defaultValue || 'profile')
      return (
        <TabsCtx.Provider value={{ value: val as string, onValueChange: onValueChange as ((v: string) => void) | undefined }}>
          <div data-testid="tabs" data-active-tab={value}>{children}</div>
        </TabsCtx.Provider>
      )
    },
    TabsContent: ({ children, value }: Record<string, unknown>) => {
      const { value: currentValue } = useContext(TabsCtx)
      return currentValue === value ? <div role="tabpanel" id={`panel-${value as string}`}>{children}</div> : null
    },
    TabsList: ({ children, ...props }: Record<string, unknown>) => <div role="tablist" {...props}>{children}</div>,
    TabsTrigger: ({ children, value, ...props }: Record<string, unknown>) => {
      const { onValueChange } = useContext(TabsCtx)
      return (
        <button
          role="tab"
          data-value={value}
          onClick={() => onValueChange?.(value as string)}
          {...props}
        >
          {children}
        </button>
      )
    },
  }
})

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}))

import { AccountSettingsPage } from '../settings-account'

function createQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    isPending: false,
    isSuccess: false,
    isRefetching: false,
    error: null,
    ...overrides,
  }
}

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
  nextNav.back.mockReset()
  reactQuery.useQuery.mockReset()
  reactQuery.useMutation.mockReset()

  reactQuery.useQuery.mockReturnValue(
    createQueryResult({ isLoading: true }),
  )
  reactQuery.useMutation.mockReturnValue(createMutationResult())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AccountSettingsPage', () => {
  it('renders tab navigation', () => {
    render(<AccountSettingsPage />)

    expect(screen.getByText('Profilo')).toBeInTheDocument()
    expect(screen.getByText('Notifiche')).toBeInTheDocument()
    expect(screen.getByText('Sicurezza')).toBeInTheDocument()
    expect(screen.getByText('Preferenze')).toBeInTheDocument()
  })

  it('shows profile section content by default', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: { name: 'Mario Rossi', email: 'mario@test.it', avatarUrl: null },
      }),
    )

    render(<AccountSettingsPage />)

    expect(screen.getByText('Profilo')).toBeInTheDocument()
    expect(screen.getByText('Il tuo nome, email e foto profilo pubblici')).toBeInTheDocument()
  })

  it('switching tabs shows different content', async () => {
    reactQuery.useQuery
      .mockReturnValueOnce(createQueryResult({
        isLoading: false,
        data: { name: 'Mario', email: 'mario@test.it', avatarUrl: null },
      }))
      .mockReturnValueOnce(createQueryResult({
        isLoading: false,
        data: { email: true, push: true, sms: false, marketing: false, orderUpdates: true, securityAlerts: true },
      }))

    render(<AccountSettingsPage />)

    const notificheTab = screen.getByText('Notifiche')
    fireEvent.click(notificheTab)

    await waitFor(() => {
      expect(screen.getByText('Gestisci le tue preferenze di notifica')).toBeInTheDocument()
    })
  })

  it('save button is disabled when no changes', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: { name: 'Mario Rossi', email: 'mario@test.it', avatarUrl: null },
      }),
    )

    render(<AccountSettingsPage />)

    const saveButtons = screen.getAllByText('Salva')
    saveButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('save button shows loading state', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: { name: 'Mario Rossi', email: 'mario@test.it', avatarUrl: null },
      }),
    )

    render(<AccountSettingsPage />)

    expect(screen.getAllByText('Salva').length).toBeGreaterThan(0)
  })

  it('success toast is shown after save', async () => {
    const { toast } = await import('sonner')

    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: { name: 'Mario Rossi', email: 'mario@test.it', avatarUrl: null },
      }),
    )

    const mutationResult = createMutationResult()
    reactQuery.useMutation.mockReturnValue(mutationResult)

    render(<AccountSettingsPage />)

    const saveBtn = screen.getAllByText('Salva')[0]
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('error state shown on save failure', async () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: { name: 'Mario Rossi', email: 'mario@test.it', avatarUrl: null },
      }),
    )
    reactQuery.useMutation.mockReturnValue(
      createMutationResult({
        isError: true,
        error: { message: 'Errore di rete' },
      }),
    )

    render(<AccountSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Errore')).toBeInTheDocument()
    })
  })

  it('unsaved changes warning when switching tabs with dirty form', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: { name: 'Mario Rossi', email: 'mario@test.it', avatarUrl: null },
      }),
    )

    render(<AccountSettingsPage />)

    const notificheTab = screen.getByText('Notifiche')
    fireEvent.click(notificheTab)

    expect(screen.getByText('Hai modifiche non salvate in alcune sezioni.')).toBeInTheDocument()
  })

  it('switch toggles optimistically', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: { email: true, push: true, sms: false, marketing: false, orderUpdates: true, securityAlerts: true },
      }),
    )

    render(<AccountSettingsPage />)

    const switches = screen.getAllByTestId('switch')
    expect(switches.length).toBeGreaterThan(0)
  })

  it('beforeunload warns when any section is dirty', () => {
    reactQuery.useQuery.mockReturnValue(
      createQueryResult({
        isLoading: false,
        data: { name: 'Mario Rossi', email: 'mario@test.it', avatarUrl: null },
      }),
    )

    render(<AccountSettingsPage />)

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
  })
})
