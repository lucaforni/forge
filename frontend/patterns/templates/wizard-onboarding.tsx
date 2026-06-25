// ============================================================
// Template: Onboarding Wizard (3 step)
// Pattern: wizard
// Stack: React Hook Form v7 + Zod + shadcn/ui + React Query
// USAGE: Copiare e adattare step, schemas, mutation
// ============================================================

'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PartyPopper,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// ──────────────────────────────────────────────
// ZOD SCHEMAS (per-step + combined)
// ──────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  company: z.string().min(1, 'Enter your company name'),
})

const step2Schema = z.object({
    role: z.enum(['developer', 'designer', 'manager', 'marketing', 'other'], {
      errorMap: () => ({ message: 'Select your role' }),
    }),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
})

const step3Schema = z.object({})

const fullSchema = step1Schema.merge(step2Schema)

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type WizardData = Step1Data & Step2Data

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export interface OnboardingWizardProps {
  onComplete?: () => void
}

interface ApiError {
  message: string
  field?: string
}

// ──────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────

const WIZARD_STORAGE_KEY = 'onboarding-wizard'

const TOTAL_STEPS = 3

const ROLES = [
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Project Manager', value: 'manager' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Other', value: 'other' },
] as const

const INTEREST_OPTIONS = [
  { label: 'Artificial Intelligence', value: 'ai' },
  { label: 'Cloud & DevOps', value: 'cloud' },
  { label: 'Frontend', value: 'frontend' },
  { label: 'Backend', value: 'backend' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Cybersecurity', value: 'security' },
  { label: 'Data Science', value: 'data' },
  { label: 'UX Research', value: 'ux' },
] as const

// ──────────────────────────────────────────────
// WIZARD CONTEXT
// ──────────────────────────────────────────────

interface WizardContextValue {
  currentStep: number
  totalSteps: number
  goNext: () => void
  goBack: () => void
  stepsData: Partial<WizardData>
  updateStepData: (step: number, data: Partial<WizardData>) => void
  isSubmitting: boolean
}

const WizardContext = createContext<WizardContextValue | null>(null)

function useWizardContext() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizardContext must be used within WizardProvider')
  return ctx
}

// ──────────────────────────────────────────────
// STEP COMPONENTS
// ──────────────────────────────────────────────

function Step1BasicInfo({ form }: { form: ReturnType<typeof useForm<WizardData>> }) {
  const { isSubmitting } = useWizardContext()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Full name <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Mario Rossi"
                aria-required="true"
                disabled={isSubmitting}
                autoFocus
                {...field}
              />
            </FormControl>
              <FormDescription>Your first and last name</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="mario@esempio.it"
                  aria-required="true"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Company <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Acme Inc."
                  aria-required="true"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

function Step2Preferences({ form }: { form: ReturnType<typeof useForm<WizardData>> }) {
  const { isSubmitting } = useWizardContext()

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Role <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isSubmitting}
            >
              <FormControl>
                <SelectTrigger autoFocus>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>Your primary role in the company</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="interests"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel>
                Interests <span className="text-destructive">*</span>
              </FormLabel>
              <FormDescription>
                Select one or more areas of interest
              </FormDescription>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTEREST_OPTIONS.map((opt) => (
                <FormField
                  key={opt.value}
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem
                      key={opt.value}
                      className="flex flex-row items-start gap-3 rounded-md border p-3"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value ?? []
                            if (checked) {
                              field.onChange([...current, opt.value])
                            } else {
                              field.onChange(
                                current.filter((v) => v !== opt.value),
                              )
                            }
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {opt.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function Step3Confirmation({ form }: { form: ReturnType<typeof useForm<WizardData>> }) {
  const values = form.getValues()

  return (
    <div className="space-y-6">
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Review your data</AlertTitle>
        <AlertDescription>
          Before submitting, check that all information is correct.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Basic information
        </h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{values.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{values.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Company</dt>
            <dd className="font-medium">{values.company}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Preferences
        </h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">
              {ROLES.find((r) => r.value === values.role)?.label ?? values.role}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Interests</dt>
            <dd className="font-medium">
              {values.interests
                ?.map(
                  (v) => INTEREST_OPTIONS.find((o) => o.value === v)?.label ?? v,
                )
                .join(', ') ?? '-'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// SUCCESS SCREEN
// ──────────────────────────────────────────────

function SuccessScreen() {
  const router = useRouter()

  return (
    <Card className="mx-auto max-w-lg text-center">
      <CardContent className="pt-12 pb-10 space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <PartyPopper className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">Onboarding completed!</CardTitle>
          <CardDescription className="text-base">
            Welcome aboard! Your account has been configured successfully.
          </CardDescription>
        </div>
        <Button
          size="lg"
          onClick={() => router.push('/dashboard')}
          className="mt-4"
        >
          Go to dashboard
        </Button>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// STEP DEFINITIONS
// ──────────────────────────────────────────────

const STEPS = [
  {
    id: 'basic-info',
    title: 'Basic information',
    description: 'Enter your personal details',
    schema: step1Schema,
    component: Step1BasicInfo,
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Configure your preferences',
    schema: step2Schema,
    component: Step2Preferences,
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    description: 'Review and confirm your data',
    schema: step3Schema,
    component: Step3Confirmation,
  },
] as const

// ──────────────────────────────────────────────
// API MOCK (sostituire con fetch reale)
// ──────────────────────────────────────────────

async function submitOnboardingApi(data: WizardData): Promise<{ success: boolean }> {
  const res = await fetch('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error: ApiError = await res.json()
    throw error
  }
  return res.json()
}

// ──────────────────────────────────────────────
// STORAGE HELPERS
// ──────────────────────────────────────────────

function saveProgress(currentStep: number, data: Partial<WizardData>) {
  try {
    localStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({ currentStep, data }),
    )
  } catch {
    // localStorage might be full or unavailable
  }
}

function loadProgress(): {
  currentStep: number
  data: Partial<WizardData>
} | null {
  try {
    const saved = localStorage.getItem(WIZARD_STORAGE_KEY)
    if (!saved) return null
    return JSON.parse(saved)
  } catch {
    return null
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(WIZARD_STORAGE_KEY)
  } catch {
    // ignore
  }
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // ── Form ──

  const form = useForm<WizardData>({
    resolver: zodResolver(STEPS[currentStep - 1].schema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      role: undefined,
      interests: [],
    },
    mode: 'onBlur',
  })

  const rootError = form.formState.errors.root?.message

  // ── Restore progress from localStorage ──

  useEffect(() => {
    const saved = loadProgress()
    if (saved) {
      setCurrentStep(saved.currentStep)
      const parsed = fullSchema.partial().safeParse(saved.data)
      if (parsed.success) {
        for (const [key, value] of Object.entries(parsed.data)) {
          form.setValue(key as keyof WizardData, value, { shouldValidate: false })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount to restore saved progress
  }, [])

  // ── Persist progress ──

  useEffect(() => {
    const sub = form.watch(() => {
      saveProgress(currentStep, form.getValues())
    })
    return () => sub.unsubscribe()
  }, [currentStep, form])

  // ── Focus management ──

  useEffect(() => {
    const timer = setTimeout(() => {
      const schema = STEPS[currentStep - 1].schema
      if (schema instanceof z.ZodObject && Object.keys(schema.shape).length > 0) {
        const firstFieldName = Object.keys(schema.shape)[0]
        const firstInput = document.querySelector(`[name="${firstFieldName}"]`)
        if (firstInput instanceof HTMLElement) firstInput.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [currentStep])

  // ── Schema switch on step change ──

  useEffect(() => {
    form.clearErrors('root')
    form.clearErrors()
  }, [currentStep, form])

  // ── Mutation ──

  const mutation = useMutation({
    mutationFn: submitOnboardingApi,
    onSuccess: () => {
      clearProgress()
      setIsSubmitting(false)
      setIsSuccess(true)
      toast.success('Onboarding completed successfully!')
      queryClient.invalidateQueries({ queryKey: ['onboarding'] })
      // Expected query key: useQuery({ queryKey: ['onboarding'] }) in the consumer app
      onComplete?.()
    },
    onError: (error: ApiError) => {
      setIsSubmitting(false)
      if (error.field) {
        form.setError(error.field as keyof WizardData, {
          message: error.message,
        })
      } else {
        form.setError('root', { message: error.message })
      }
      toast.error('Error during submission')
    },
  })

  // ── Navigators ──

  const goNext = useCallback(async () => {
    const isValid = await form.trigger()
    if (!isValid) return
    saveProgress(currentStep, form.getValues())
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  }, [form, currentStep])

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  const handleSubmit = useCallback(
    async (data: WizardData) => {
      setIsSubmitting(true)
      mutation.mutate(data)
    },
    [mutation],
  )

  // ── Render ──

  if (isSuccess) return <SuccessScreen />

  const currentStepData = STEPS[currentStep - 1]
  const isLastStep = currentStep === TOTAL_STEPS
  const StepComponent = currentStepData.component
  const progressPercent = (currentStep / TOTAL_STEPS) * 100

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        totalSteps: TOTAL_STEPS,
        goNext,
        goBack,
        stepsData: form.getValues(),
        updateStepData: () => {},
        isSubmitting,
      }}
    >
      <div className="mx-auto max-w-2xl">
        <Card>
          {/* ── Progress indicator ── */}
          <CardHeader>
            <div
              role="progressbar"
              aria-valuenow={currentStep}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              className="mb-6"
            >
              <Progress value={progressPercent} className="mb-3" />
              <div className="hidden md:flex justify-between text-sm text-muted-foreground">
                {STEPS.map((s, i) => {
                  const stepNum = i + 1
                  const isActive = stepNum === currentStep
                  const isCompleted = stepNum < currentStep
                  return (
                    <div
                      key={s.id}
                      data-active={isActive}
                      data-completed={isCompleted}
                      className="flex items-center gap-2 data-[active=true]:font-semibold data-[active=true]:text-foreground"
                    >
                      <Badge
                        variant={isActive ? 'default' : isCompleted ? 'secondary' : 'outline'}
                        className="rounded-full w-6 h-6 p-0 flex items-center justify-center"
                        aria-label={`Step ${stepNum} of ${TOTAL_STEPS}: ${s.title}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          stepNum
                        )}
                      </Badge>
                      <span className="data-[active=false]:hidden lg:data-[active=false]:inline">
                        {s.title}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex md:hidden items-center gap-2 text-sm">
                <Badge variant="default" className="rounded-full">
                  {currentStep}/{TOTAL_STEPS}
                </Badge>
                <span className="font-medium">{currentStepData.title}</span>
              </div>
            </div>

            <CardTitle>{currentStepData.title}</CardTitle>
            <CardDescription id="step-description">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>

          {/* ── Form ── */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <CardContent className="space-y-4">
                {/* Live region for screen reader */}
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className="sr-only"
                >
                  {currentStepData.title} — Step {currentStep} of {TOTAL_STEPS}
                </div>

                {/* Root error */}
                {rootError && (
                  <Alert variant="destructive" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{rootError}</AlertDescription>
                  </Alert>
                )}

                {/* Step fields */}
                <fieldset disabled={isSubmitting}>
                  <StepComponent form={form} />
                </fieldset>
              </CardContent>

              {/* ── Footer ── */}
              <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 1 || isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  )}
                  Back
                </Button>

                {isLastStep ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {isSubmitting ? 'Submitting...' : 'Confirm and complete'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </WizardContext.Provider>
  )
}

  
