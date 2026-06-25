// ============================================================
// Template: Account Settings Panel
// Pattern: settings-panel
// Stack: shadcn/ui Tabs + RHF v7 + Zod + React Query + Sonner
// USAGE: Copiare e adattare sezioni, schemi, mutation
// ============================================================

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  User,
  Bell,
  Shield,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface SettingsSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<{ onStatusChange?: (status: SectionStatus) => void }>
}

type SectionStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error'

interface UserProfile {
  name: string
  email: string
  avatarUrl: string | null
}

interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  marketing: boolean
  orderUpdates: boolean
  securityAlerts: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
}

interface UserPreferences {
  language: string
  timezone: string
  theme: 'light' | 'dark' | 'system'
}

interface ApiError {
  message: string
  field?: string
  fields?: { field: string; message: string }[]
}

// ──────────────────────────────────────────────
// ZOD SCHEMAS
// ──────────────────────────────────────────────

const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Maximum 100 characters'),
  email: z.string().email('Enter a valid email address'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter current password'),
    newPassword: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[a-z]/, 'At least one lowercase letter')
      .regex(/[0-9]/, 'At least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const preferencesSchema = z.object({
  language: z.string().min(1, 'Select a language'),
  timezone: z.string().min(1, 'Select a timezone'),
  theme: z.enum(['light', 'dark', 'system']),
})

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>
type PreferencesValues = z.infer<typeof preferencesSchema>

// ──────────────────────────────────────────────
// MOCK DATA
// ──────────────────────────────────────────────

const LANGUAGES = [
  { label: 'Italian', value: 'it' },
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Español', value: 'es' },
]

const TIMEZONES = [
  { label: 'Europe/Rome (UTC+1)', value: 'Europe/Rome' },
  { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
  { label: 'Europe/Paris (UTC+1)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (UTC+1)', value: 'Europe/Berlin' },
  { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (UTC-8)', value: 'America/Los_Angeles' },
]

const THEME_OPTIONS = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
]

// ──────────────────────────────────────────────
// API MOCK (sostituire con fetch reale)
// ──────────────────────────────────────────────

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/settings/profile')
  if (!res.ok) throw new Error('Error loading profile')
  return res.json()
}

async function updateProfileApi(data: ProfileValues): Promise<UserProfile> {
  const res = await fetch('/api/settings/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw err
  }
  return res.json()
}

async function fetchNotifications(): Promise<NotificationPreferences> {
  const res = await fetch('/api/settings/notifications')
  if (!res.ok) throw new Error('Error loading notifications')
  return res.json()
}

async function updateNotificationsApi(
  data: NotificationPreferences,
): Promise<NotificationPreferences> {
  const res = await fetch('/api/settings/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw err
  }
  return res.json()
}

async function toggleNotificationApi(
  id: keyof NotificationPreferences,
  enabled: boolean,
): Promise<void> {
  const res = await fetch(`/api/settings/notifications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw err
  }
}

async function updatePasswordApi(
  data: PasswordValues,
): Promise<void> {
  const res = await fetch('/api/settings/security/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw err
  }
}

async function fetchTwoFactor(): Promise<boolean> {
  const res = await fetch('/api/settings/security/two-factor')
  if (!res.ok) throw new Error('Error loading 2FA settings')
  const data: { enabled: boolean } = await res.json()
  return data.enabled
}

async function toggleTwoFactorApi(enabled: boolean): Promise<void> {
  const res = await fetch('/api/settings/security/two-factor', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw err
  }
}

async function fetchPreferences(): Promise<UserPreferences> {
  const res = await fetch('/api/settings/preferences')
  if (!res.ok) throw new Error('Error loading preferences')
  return res.json()
}

async function updatePreferencesApi(
  data: PreferencesValues,
): Promise<UserPreferences> {
  const res = await fetch('/api/settings/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw err
  }
  return res.json()
}

// ──────────────────────────────────────────────
// SERVER ERROR MAPPER
// ──────────────────────────────────────────────

function mapServerErrors<T extends Record<string, unknown>>(
  error: ApiError,
  setError: (field: keyof T, error: { message: string }) => void,
  firstFieldName?: string,
) {
  if (error.fields) {
    for (const f of error.fields) {
      setError(f.field as keyof T, { message: f.message })
    }
    const target = error.fields[0].field
    const el = document.querySelector(`[name="${target}"]`)
    if (el instanceof HTMLElement) el.focus()
    return
  }
  if (error.field) {
    setError(error.field as keyof T, { message: error.message })
    const el = document.querySelector(`[name="${error.field}"]`)
    if (el instanceof HTMLElement) el.focus()
    return
  }
}

// ──────────────────────────────────────────────
// REACT QUERY HOOKS (per-sezione)
// ──────────────────────────────────────────────

function useProfileSettings() {
  return useQuery({
    queryKey: ['settings', 'profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60_000,
  })
}

function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfileApi,
    onSuccess: () => {
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['settings', 'profile'] })
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Error saving profile')
    },
  })
}

function useNotificationSettings() {
  return useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: fetchNotifications,
    staleTime: 5 * 60_000,
  })
}

function useUpdateNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateNotificationsApi,
    onSuccess: () => {
      toast.success('Notifications updated')
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] })
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Error saving notifications')
    },
  })
}

function useToggleNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: keyof NotificationPreferences; enabled: boolean }) =>
      toggleNotificationApi(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['settings', 'notifications'] })
      const previous = queryClient.getQueryData<NotificationPreferences>([
        'settings',
        'notifications',
      ])
      queryClient.setQueryData<NotificationPreferences>(
        ['settings', 'notifications'],
        (old) => (old ? { ...old, [id]: enabled } : old),
      )
      return { previous }
    },
    onError: (_err, { id }, context) => {
      queryClient.setQueryData(['settings', 'notifications'], context?.previous)
      toast.error('Error updating notification')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] })
    },
  })
}

function useUpdatePassword() {
  return useMutation({
    mutationFn: updatePasswordApi,
    onSuccess: () => {
      toast.success('Password updated successfully')
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Error changing password')
    },
  })
}

function useTwoFactorSettings() {
  return useQuery({
    queryKey: ['settings', 'security', 'two-factor'],
    queryFn: fetchTwoFactor,
    staleTime: 5 * 60_000,
  })
}

function useToggleTwoFactor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleTwoFactorApi,
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: ['settings', 'security', 'two-factor'] })
      const previous = queryClient.getQueryData<boolean>([
        'settings',
        'security',
        'two-factor',
      ])
      queryClient.setQueryData<boolean>(
        ['settings', 'security', 'two-factor'],
        enabled,
      )
      return { previous }
    },
    onError: (_err, _enabled, context) => {
      queryClient.setQueryData(['settings', 'security', 'two-factor'], context?.previous)
      toast.error("Errore nell'aggiornamento della sicurezza")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'security', 'two-factor'] })
    },
  })
}

function usePreferencesSettings() {
  return useQuery({
    queryKey: ['settings', 'preferences'],
    queryFn: fetchPreferences,
    staleTime: 5 * 60_000,
  })
}

function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePreferencesApi,
    onSuccess: () => {
      toast.success('Preferences updated')
      queryClient.invalidateQueries({ queryKey: ['settings', 'preferences'] })
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Error saving preferences')
    },
  })
}

// ──────────────────────────────────────────────
// SKELETON COMPONENT
// ──────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
        ))}
        <div className="h-10 w-24 bg-muted rounded animate-pulse ml-auto" />
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// SECTION COMPONENTS
// ──────────────────────────────────────────────

// ── Profile Section ──

function ProfileSection({
  onStatusChange,
}: {
  onStatusChange?: (status: SectionStatus) => void
}) {
  const { data, isLoading } = useProfileSettings()
  const updateProfile = useUpdateProfile()

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
    mode: 'onBlur',
  })

  const prevDataRef = useRef(data)
  useEffect(() => {
    if (data && data !== prevDataRef.current) {
      form.reset({ name: data.name, email: data.email })
      prevDataRef.current = data
    }
  }, [data, form])

  const isSaving = updateProfile.isPending
  const serverError = updateProfile.error as ApiError | null
  const isDirty = form.formState.isDirty

  useEffect(() => {
    if (isSaving) onStatusChange?.('saving')
    else if (serverError) onStatusChange?.('error')
    else if (isDirty) onStatusChange?.('editing')
    else onStatusChange?.('idle')
  }, [isSaving, serverError, isDirty, onStatusChange])

  function onSubmit(values: ProfileValues) {
    updateProfile.mutate(values, {
      onSuccess: () => {
        form.reset(values)
        onStatusChange?.('saved')
        setTimeout(() => onStatusChange?.('idle'), 2000)
      },
      onError: (error: ApiError) => {
        mapServerErrors<ProfileValues>(error, (field, err) =>
          form.setError(field, err),
        )
        onStatusChange?.('error')
      },
    })
  }

  if (isLoading) return <SectionSkeleton />

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="flex-1">
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your public name, email, and profile photo</CardDescription>
        </div>
        {updateProfile.isSuccess && (
          <Badge variant="secondary" className="gap-1 shrink-0">
            <CheckCircle2 className="h-3 w-3" />
            Saved
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={data?.avatarUrl ?? undefined} />
            <AvatarFallback className="text-lg">
              {data?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or GIF. Max 2MB.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              aria-label="Upload profile photo"
            >
              Upload
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && !serverError.field && !serverError.fields && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{serverError.message}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Mario Rossi"
                      disabled={isSaving}
                      aria-required="true"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="mario@esempio.it"
                      disabled={isSaving}
                      aria-required="true"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              {isDirty && (
                <p className="text-xs text-muted-foreground mr-auto">
                  Unsaved changes
                </p>
              )}
              <Button
                type="submit"
                disabled={isSaving || !isDirty}
                aria-busy={isSaving}
              >
                {isSaving && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// ── Notifications Section ──

const NOTIFICATION_ITEMS: {
  id: keyof NotificationPreferences
  label: string
  description: string
}[] = [
  {
    id: 'email',
    label: 'Email notifications',
    description: 'Receive updates via email',
  },
  {
    id: 'push',
    label: 'Push notifications',
    description: 'Receive notifications on browser and mobile devices',
  },
  {
    id: 'sms',
    label: 'SMS notifications',
    description: 'Receive updates via SMS',
  },
  {
    id: 'marketing',
    label: 'Marketing and promotions',
    description: 'Offers, discounts, and news',
  },
  {
    id: 'orderUpdates',
    label: 'Order updates',
    description: 'Order status, shipping, and deliveries',
  },
  {
    id: 'securityAlerts',
    label: 'Security alerts',
    description: 'Login attempts, password changes',
  },
]

function NotificationsSection({
  onStatusChange,
}: {
  onStatusChange?: (status: SectionStatus) => void
}) {
  const { data, isLoading } = useNotificationSettings()
  const updateNotifications = useUpdateNotifications()
  const toggleNotification = useToggleNotification()
  const queryClient = useQueryClient()

  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set())

  const isSaving = updateNotifications.isPending
  const serverError = updateNotifications.error as ApiError | null

  // Track any optimistic change as dirty
  const hasChanges = dirtyFields.size > 0

  useEffect(() => {
    if (hasChanges) onStatusChange?.('editing')
    else onStatusChange?.('idle')
  }, [hasChanges, onStatusChange])

  function handleToggle(id: keyof NotificationPreferences, enabled: boolean) {
    setDirtyFields((prev) => new Set(prev).add(id))
    toggleNotification.mutate(
      { id, enabled },
      {
        onError: () => {
          setDirtyFields((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          onStatusChange?.('error')
        },
        onSuccess: () => {
          setDirtyFields((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          onStatusChange?.('saved')
          setTimeout(() => onStatusChange?.('idle'), 2000)
        },
      },
    )
  }

  function handleSaveAll() {
    if (!data) return
    updateNotifications.mutate(data, {
      onSuccess: () => {
        setDirtyFields(new Set())
        onStatusChange?.('saved')
        setTimeout(() => onStatusChange?.('idle'), 2000)
      },
      onError: () => {
        onStatusChange?.('error')
      },
    })
  }

  if (isLoading) return <SectionSkeleton />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{serverError.message}</AlertDescription>
          </Alert>
        )}

        {NOTIFICATION_ITEMS.map((item) => {
          const enabled = data?.[item.id] ?? false
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-0.5">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  id={`notif-label-${item.id}`}
                >
                  {item.label}
                </label>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => handleToggle(item.id, checked)}
                disabled={isSaving}
                aria-label={item.label}
                aria-labelledby={`notif-label-${item.id}`}
              />
            </div>
          )
        })}

        <div className="flex items-center justify-end gap-3 pt-2">
          {hasChanges && (
            <p className="text-xs text-muted-foreground mr-auto">
              Unsaved changes
            </p>
          )}
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || !hasChanges}
            aria-busy={isSaving}
          >
            {isSaving && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isSaving ? 'Saving...' : 'Save all'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Security Section ──

function SecuritySection({
  onStatusChange,
}: {
  onStatusChange?: (status: SectionStatus) => void
}) {
  const { data: isTwoFactorEnabled, isLoading: is2faLoading } =
    useTwoFactorSettings()
  const updatePassword = useUpdatePassword()
  const toggleTwoFactor = useToggleTwoFactor()

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  })

  const isSavingPassword = updatePassword.isPending
  const passwordError = updatePassword.error as ApiError | null
  const isPasswordDirty = passwordForm.formState.isDirty
  const passwordSuccess = updatePassword.isSuccess

  const [twoFactorStatus, setTwoFactorStatus] = useState<SectionStatus>('idle')

  // Reset password form after success
  useEffect(() => {
    if (passwordSuccess) {
      passwordForm.reset()
      const timer = setTimeout(() => updatePassword.reset(), 2000)
      return () => clearTimeout(timer)
    }
  }, [passwordSuccess, passwordForm, updatePassword])

  const overallStatus: SectionStatus = isSavingPassword
    ? 'saving'
    : passwordError
      ? 'error'
      : isPasswordDirty
        ? 'editing'
        : twoFactorStatus === 'editing' || twoFactorStatus === 'saving'
          ? twoFactorStatus
          : passwordSuccess
            ? 'saved'
            : 'idle'

  useEffect(() => {
    onStatusChange?.(overallStatus)
  }, [overallStatus, onStatusChange])

  function onPasswordSubmit(values: PasswordValues) {
    updatePassword.mutate(values, {
      onError: (error: ApiError) => {
        mapServerErrors<PasswordValues>(error, (field, err) =>
          passwordForm.setError(field, err),
        )
        if (!error.field && !error.fields) {
          passwordForm.setError('root', { message: error.message })
        }
      },
    })
  }

  const currentPwdError =
    passwordForm.formState.errors.currentPassword?.message
  const newPwdError = passwordForm.formState.errors.newPassword?.message
  const confirmPwdError = passwordForm.formState.errors.confirmPassword?.message
  const rootError = passwordForm.formState.errors.root?.message

  if (is2faLoading) return <SectionSkeleton />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Manage your account password and security options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* ── Change Password ── */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Change password</h3>
            <p className="text-sm text-muted-foreground">
          At least 8 characters, one uppercase, one lowercase, and one number
            </p>
          </div>

          {passwordSuccess && (
            <Alert variant="default" className="border-primary text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Password updated</AlertTitle>
              <AlertDescription>
                Your password has been changed successfully
              </AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            {rootError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}

            {/* Current Password */}
            <FormItem>
              <FormLabel htmlFor="currentPassword">Current password</FormLabel>
              <FormControl>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  disabled={isSavingPassword}
                  aria-required="true"
                  aria-invalid={!!currentPwdError}
                  {...passwordForm.register('currentPassword')}
                />
              </FormControl>
              {currentPwdError && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {currentPwdError}
                </p>
              )}
            </FormItem>

            {/* New Password */}
            <FormItem>
              <FormLabel htmlFor="newPassword">New password</FormLabel>
              <FormControl>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  disabled={isSavingPassword}
                  aria-required="true"
                  aria-invalid={!!newPwdError}
                  {...passwordForm.register('newPassword')}
                />
              </FormControl>
              {newPwdError && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {newPwdError}
                </p>
              )}
            </FormItem>

            {/* Confirm Password */}
            <FormItem>
              <FormLabel htmlFor="confirmPassword">Confirm new password</FormLabel>
              <FormControl>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  disabled={isSavingPassword}
                  aria-required="true"
                  aria-invalid={!!confirmPwdError}
                  {...passwordForm.register('confirmPassword')}
                />
              </FormControl>
              {confirmPwdError && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {confirmPwdError}
                </p>
              )}
            </FormItem>

            <div className="flex items-center justify-end gap-3 pt-2">
              {isPasswordDirty && (
                <p className="text-xs text-muted-foreground mr-auto">
                  Unsaved changes
                </p>
              )}
              <Button
                type="submit"
                disabled={isSavingPassword || !isPasswordDirty}
                aria-busy={isSavingPassword}
              >
                {isSavingPassword && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isSavingPassword ? 'Saving...' : 'Update password'}
              </Button>
            </div>
          </form>
        </div>

        <Separator />

        {/* ── Two-Factor Authentication ── */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <label className="text-sm font-medium leading-none" id="2fa-label">
              Two-factor authentication (2FA)
            </label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            checked={isTwoFactorEnabled ?? false}
            onCheckedChange={(enabled) => {
              setTwoFactorStatus('saving')
              toggleTwoFactor.mutate(enabled, {
                onSuccess: () => {
                  setTwoFactorStatus('saved')
                  setTimeout(() => setTwoFactorStatus('idle'), 2000)
                },
                onError: () => {
                  setTwoFactorStatus('error')
                },
              })
            }}
            disabled={toggleTwoFactor.isPending}
            aria-label="Two-factor authentication"
            aria-labelledby="2fa-label"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Preferences Section ──

function PreferencesSection({
  onStatusChange,
}: {
  onStatusChange?: (status: SectionStatus) => void
}) {
  const { data, isLoading } = usePreferencesSettings()
  const updatePreferences = useUpdatePreferences()

  const form = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { language: '', timezone: '', theme: 'system' },
    mode: 'onBlur',
  })

  const prevDataRef = useRef(data)
  useEffect(() => {
    if (data && data !== prevDataRef.current) {
      form.reset({
        language: data.language,
        timezone: data.timezone,
        theme: data.theme,
      })
      prevDataRef.current = data
    }
  }, [data, form])

  const isSaving = updatePreferences.isPending
  const serverError = updatePreferences.error as ApiError | null
  const isDirty = form.formState.isDirty
  const isSuccess = updatePreferences.isSuccess

  useEffect(() => {
    if (isSaving) onStatusChange?.('saving')
    else if (serverError) onStatusChange?.('error')
    else if (isDirty) onStatusChange?.('editing')
    else if (isSuccess) {
      onStatusChange?.('saved')
      setTimeout(() => onStatusChange?.('idle'), 2000)
    } else onStatusChange?.('idle')
  }, [isSaving, serverError, isDirty, isSuccess, onStatusChange])

  function onSubmit(values: PreferencesValues) {
    updatePreferences.mutate(values, {
      onSuccess: () => {
        form.reset(values)
      },
      onError: (error: ApiError) => {
        mapServerErrors<PreferencesValues>(error, (field, err) =>
          form.setError(field, err),
        )
      },
    })
  }

  if (isLoading) return <SectionSkeleton />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Language, timezone, and application appearance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && !serverError.field && !serverError.fields && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{serverError.message}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Select language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Select timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Select theme">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {THEME_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the interface theme
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              {isDirty && (
                <p className="text-xs text-muted-foreground mr-auto">
                  Unsaved changes
                </p>
              )}
              <Button
                type="submit"
                disabled={isSaving || !isDirty}
                aria-busy={isSaving}
              >
                {isSaving && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// SECTION CONFIG
// ──────────────────────────────────────────────

const SECTIONS: SettingsSection[] = [
  {
    id: 'profile',
    title: 'Profile',
    icon: User,
    component: ProfileSection,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    component: NotificationsSection,
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    component: SecuritySection,
  },
  {
    id: 'preferences',
    title: 'Preferences',
    icon: Settings,
    component: PreferencesSection,
  },
]

// ──────────────────────────────────────────────
// MAIN SETTINGS PAGE COMPONENT
// ──────────────────────────────────────────────

export function AccountSettingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState('profile')
  const [sectionStatuses, setSectionStatuses] = useState<
    Record<string, SectionStatus>
  >({
    profile: 'idle',
    notifications: 'idle',
    security: 'idle',
    preferences: 'idle',
  })

  const hasUnsavedChanges = useMemo(
    () =>
      Object.values(sectionStatuses).some(
        (s) => s === 'editing' || s === 'saving',
      ),
    [sectionStatuses],
  )

  const allSaved =
    Object.values(sectionStatuses).every(
      (s) => s === 'idle' || s === 'saved',
    ) && Object.values(sectionStatuses).some((s) => s === 'saved')

  const formRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // ── beforeunload guard ──
  useEffect(() => {
    if (hasUnsavedChanges) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [hasUnsavedChanges])

  // ── Tab switch with navigation guard ──
  function handleTabChange(newTab: string) {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Leave without saving?',
      )
      if (!confirmed) return
    }
    setActiveSection(newTab)
  }

  // ── Per-section status callback ──
  const sectionCallbacksRef = useRef<Record<string, (status: SectionStatus) => void>>({})
  const handleStatusChange = useCallback(
    (sectionId: string) => {
      if (!sectionCallbacksRef.current[sectionId]) {
        sectionCallbacksRef.current[sectionId] = (status: SectionStatus) => {
          setSectionStatuses((prev) => ({ ...prev, [sectionId]: status }))
        }
      }
      return sectionCallbacksRef.current[sectionId]
    },
    [],
  )

  // ── Keyboard navigation ──
  function handleKeyDown(e: React.KeyboardEvent) {
    const sections = SECTIONS
    const currentIdx = sections.findIndex((s) => s.id === activeSection)
    let nextIdx: number | null = null

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        nextIdx = (currentIdx + 1) % sections.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        nextIdx = (currentIdx - 1 + sections.length) % sections.length
        break
      case 'Home':
        e.preventDefault()
        nextIdx = 0
        break
      case 'End':
        e.preventDefault()
        nextIdx = sections.length - 1
        break
    }

    if (nextIdx !== null) {
      handleTabChange(sections[nextIdx].id)
      const panel = formRefs.current[sections[nextIdx].id]
      const firstInput = panel?.querySelector<HTMLElement>(
        'input, select, button',
      )
      firstInput?.focus()
    }
  }

  const sectionsStatusList = Object.entries(sectionStatuses)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header ── */}
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Go back"
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
            {allSaved && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                All changes saved
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Unsaved Changes Banner ── */}
      {hasUnsavedChanges && (
        <div className="border-b bg-destructive/10">
          <div className="max-w-5xl mx-auto px-4 py-2">
            <p className="text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              You have unsaved changes in some sections. Complete saving before
              leaving.
            </p>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs
          value={activeSection}
          onValueChange={handleTabChange}
          className="flex flex-col lg:flex-row gap-6 lg:gap-8"
        >
          {/* ── Sidebar: Tab Navigation ── */}
          <aside className="lg:w-64 shrink-0">
            <TabsList
              role="tablist"
              aria-label="Settings sections"
              className={cn(
                'flex lg:flex-col w-full h-auto gap-1 bg-transparent',
                'overflow-x-auto lg:overflow-x-visible',
                'lg:sticky lg:top-24',
              )}
              onKeyDown={(e) => handleKeyDown(e)}
            >
              {SECTIONS.map((section) => {
                const status = sectionStatuses[section.id]
                const Icon = section.icon
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    role="tab"
                    aria-selected={activeSection === section.id}
                    aria-controls={`panel-${section.id}`}
                    id={`tab-${section.id}`}
                    className={cn(
                      'flex items-center gap-3 justify-start w-full px-3 py-2.5',
                      'data-[state=active]:bg-accent shrink-0',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm truncate">{section.title}</span>
                    {status === 'saving' && (
                      <Loader2 className="h-3 w-3 animate-spin ml-auto shrink-0" />
                    )}
                    {status === 'error' && (
                      <AlertCircle className="h-3 w-3 text-destructive ml-auto shrink-0" />
                    )}
                    {status === 'saved' && (
                      <CheckCircle2 className="h-3 w-3 text-primary ml-auto shrink-0" />
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </aside>

          {/* ── Content Area ── */}
          <main className="flex-1 min-w-0 max-w-2xl">
            {SECTIONS.map((section) => (
              <TabsContent
                key={section.id}
                value={section.id}
                role="tabpanel"
                id={`panel-${section.id}`}
                aria-labelledby={`tab-${section.id}`}
                className="mt-0 space-y-6 focus-visible:outline-none"
                tabIndex={-1}
                ref={(el) => {
                  formRefs.current[section.id] = el
                }}
              >
                {section.id === activeSection && (
                  <section.component
                    onStatusChange={handleStatusChange(section.id)}
                  />
                )}
              </TabsContent>
            ))}
          </main>
        </Tabs>
      </div>
    </div>
  )
}

