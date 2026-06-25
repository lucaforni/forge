# Pattern: Wizard / Multi-step

**Severity**: Advanced · **Stack**: React Hook Form v7 + Zod + shadcn/ui Form + React Query
**Depends on**: Card, Button, Progress, Form, Input, Select, Checkbox, Alert

---

## 1. When to Use

**Use this pattern when**:
- Multi-step form (registration, checkout, guided setup)
- Complex data entry divided into logical phases
- User onboarding flows with progressive steps
- Each step has independent validation but data is collected for a final submit

**Do NOT use this pattern when**:
- Single form with few fields → Form pattern
- Linear page sequence without shared state → server-side pagination
- Single-step configuration with collapsible sections → accordion or tabs
- Confirmation only without input → AlertDialog

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Card | Wizard step container | default |
| CardHeader | Header with current step title | default |
| CardContent | Body with step fields | default |
| CardFooter | Navigation buttons (back/next/submit) | default |
| Button | Step navigation, final submit | variant: default/secondary/outline |
| Progress | Global progress bar | default |
| Form | Form wrapper with React Hook Form context | default |
| FormField | Links RHF field to UI markup | default |
| FormItem | Label + control + message container | default |
| FormLabel | Field label | default |
| FormControl | Input control wrapper | default |
| FormMessage | Field error message | default |
| Input | Text, email | default |
| Select | Role/option selection from closed list | default |
| Checkbox | Multiple interests, preferences | default |
| Alert | Generic error / validation summary | variant: destructive |
| Badge | Step labels (numbered circles) | variant: default/secondary/outline |

---

## 3. JSX Structure

```tsx
<div className="mx-auto max-w-2xl">
  <Card>
    <CardHeader>
      {/* ── Step indicator ── */}
      <div className="mb-6" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
        <Progress value={(currentStep / totalSteps) * 100} className="mb-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          {steps.map((s, i) => (
            <span key={s.id} data-active={i + 1 === currentStep} className="data-[active=true]:font-semibold data-[active=true]:text-foreground">
              {i + 1}. {s.title}
            </span>
          ))}
        </div>
      </div>

      {/* ── Step title ── */}
      <CardTitle>{currentStepData.title}</CardTitle>
      {currentStepData.description && (
        <CardDescription>{currentStepData.description}</CardDescription>
      )}
    </CardHeader>

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} aria-describedby="step-description">
        <CardContent className="space-y-4">
          {/* ── Root error ── */}
          {rootError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}

          {/* ── Step fields ── */}
          <fieldset disabled={isSubmitting}>
            <CurrentStepComponent />
          </fieldset>
        </CardContent>

        {/* ── Footer ── */}
        <CardFooter className="flex justify-between border-t pt-6">
          <Button type="button" variant="outline" onClick={onBack} disabled={currentStep === 1 || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
            Back
          </Button>
          {isLastStep ? (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Confirm and submit'}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </form>
    </Form>
  </Card>
</div>
```

---

## 4. State Machine

```yaml
Pattern: Wizard
Initial: step-1_idle

States:
  step-N_idle:
    description: "Step N open, no interaction"
    ui: "Step indicator shows step N active. Empty fields with defaults. Back button enabled (if N > 1). Next button enabled."
    transitions:
      on_field_change → step-N_typing
      on_next_click → step-N_invalid (if validation fails)
      on_next_click_valid → step-(N+1)_idle
      on_back_click → step-(N-1)_idle (data preserved)

  step-N_typing:
    description: "User is filling out step N"
    ui: "Editable fields. Validation on onBlur."
    transitions:
      on_blur_error → step-N_invalid
      on_blur_valid → step-N_typing (no error)
      on_next_click → step-N_invalid (if errors)
      on_next_click_valid → step-(N+1)_idle
      on_back_click → step-(N-1)_idle

  step-N_invalid:
    description: "Validation error on step N"
    ui: "FormMessage below fields in error. Error summary at top. Next remains enabled."
    transitions:
      on_fix_on_blur → step-N_typing
      on_next_click → step-N_invalid (re-validation fails)
      on_next_click_valid → step-(N+1)_idle
      on_back_click → step-(N-1)_idle

  submitting:
    description: "Final submit of all data"
    ui: "All fields disabled. Submit button shows spinner + 'Submitting...'. Back disabled. Progress bar shows final step."
    transitions:
      on_success → success
      on_server_error → server-error

  success:
    description: "Submit completed successfully"
    ui: "Confirmation screen with success icon. CTA to continue (e.g. 'Go to dashboard')."
    transitions:
      on_cta_click → (exits wizard)

  server-error:
    description: "API error during submit"
    ui: "Alert banner with error message. Fields re-editable. Submit button re-enabled."
    transitions:
      on_field_change → step-N_typing
      on_submit_click → submitting

Global:
  - step-N → step-(N+1): transition only after positive step N validation
  - Cannot skip a step (no direct click on future step indicators)
  - Back does not require validation (preserves entered data)
```

---

## 5. Data Flow

### 5.1 Per-step Zod Schema (partial)

```tsx
import { z } from 'zod'

// Step 1: Basic info
const step1Schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  company: z.string().min(1, 'Enter your company name'),
})

// Step 2: Preferences
const step2Schema = z.object({
  role: z.enum(['developer', 'designer', 'manager', 'other'], {
    required_error: 'Select a role',
  }),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
})

// Step 3: Confirmation (no new fields, only review)
const step3Schema = z.object({}).optional()

// Combined schema for submit
const fullSchema = step1Schema.merge(step2Schema)
type WizardData = z.infer<typeof fullSchema>
```

### 5.2 Partial form per step with React Hook Form

```tsx
// Combined Zod resolver for current step
function getStepSchema(step: number): z.ZodObject<any> {
  switch (step) {
    case 1: return step1Schema
    case 2: return step2Schema
    case 3: return step3Schema
    default: return step1Schema
  }
}

const form = useForm<WizardData>({
  resolver: zodResolver(getStepSchema(currentStep)),
  defaultValues: {
    name: '',
    email: '',
    company: '',
    role: undefined,
    interests: [],
  },
  mode: 'onBlur',
})
```

### 5.3 Final submit with React Query Mutation

```tsx
const submitMutation = useMutation({
  mutationFn: (data: WizardData) => api.submitOnboarding(data),
  onSuccess: () => {
    toast.success('Onboarding complete!')
    localStorage.removeItem(WIZARD_STORAGE_KEY)
    setStep('success')
  },
  onError: (error: ApiError) => {
    form.setError('root', { message: error.message })
    toast.error('Error during submission')
  },
})
```

### 5.4 Progress persistence (localStorage)

```tsx
const WIZARD_STORAGE_KEY = 'onboarding-wizard'

function saveProgress(currentStep: number, data: Partial<WizardData>) {
  localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ currentStep, data }))
}

function loadProgress(): { currentStep: number; data: Partial<WizardData> } | null {
  const saved = localStorage.getItem(WIZARD_STORAGE_KEY)
  if (!saved) return null
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

// Save on every step change
useEffect(() => {
  saveProgress(currentStep, form.getValues())
}, [currentStep])

// Save on every field change
useEffect(() => {
  const sub = form.watch(() => saveProgress(currentStep, form.getValues()))
  return () => sub.unsubscribe()
}, [currentStep, form])
```

---

## 6. TypeScript Types

```tsx
export interface WizardStep {
  id: string
  title: string
  description?: string
  schema: z.ZodObject<any>
  component: React.ComponentType
}

export interface WizardState {
  currentStep: number
  stepsData: Partial<WizardData>
  isSubmitting: boolean
}

export interface WizardProps {
  steps: WizardStep[]
  onSubmit: (data: any) => Promise<void>
  storageKey?: string
  onComplete?: () => void
}

export type WizardNavigation = 'next' | 'back' | 'submit'

export interface WizardContextValue {
  currentStep: number
  totalSteps: number
  goNext: () => void
  goBack: () => void
  goToStep: (step: number) => void
  stepsData: Partial<WizardData>
  updateStepData: (step: number, data: any) => void
}
```

---

## 7. Accessibility

### ARIA
- Step indicator: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Each step link/button: `aria-label="Step N of M: Step title"`
- Main form: `aria-describedby` referring to current step description
- Active section: `aria-current="step"`
- Error summary: `role="alert"` announced by screen reader

### Keyboard Navigation
- Enter: advance to next step / submit
- Escape: return to previous step (if applicable)
- On entering a new step: focus moves to first editable field
- After failed validation: focus on first field in error
- Tab order: step indicator (no interaction) → fields → navigation

### Focus Management
- On step change: focus on `<CardTitle>` or first field
- On back: focus on "Next" button of previous step
- On error: focus on first field with error
- On success: focus on confirmation screen CTA

### Live Region
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {currentStepData.title} — Step {currentStep} of {totalSteps}
</div>
```

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| ≥ 768px | Horizontal step indicator with text labels. Centered card `max-w-2xl`. Buttons in a row. |
| < 768px | Compact step indicator (current numbers only). Full-width buttons. Full-width card. Progress bar on top. |

```tsx
// Responsive step indicator
<div className="hidden md:flex justify-between text-sm">
  {/* Full labels */}
</div>
<div className="flex md:hidden items-center gap-2 text-sm">
  <Badge variant="default">{currentStep}/{totalSteps}</Badge>
  <span>{currentStepData.title}</span>
</div>

// Responsive footer buttons
<div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t">
  {/* Back + Next/Submit */}
</div>
```

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Per-step validation: Next must execute step validation BEFORE advancing
- [ ] Back preserves data: going back does NOT clear filled fields
- [ ] Progress indicator: updates on each step change (numeric + bar)
- [ ] Final submit: ALL data (step 1..N) sent together, not just current step
- [ ] Cannot skip: click on future step indicators does not advance (read-only only)
- [ ] Step error visibility: current step error visible before being able to advance
- [ ] Persistence: progress saved in localStorage, restored on refresh
- [ ] Success screen: confirmation screen with CTA after successful submit
- [ ] Loading state: all fields disabled + spinner during submit + back disabled
- [ ] Server error mapping: generic error shown as Alert. Per-field error mapped via FormMessage.
- [ ] Cleanup: localStorage.persist removed on success/cancellation
- [ ] Unsaved changes: `beforeunload` if wizard is in progress (dirty)

### States Verified
- [ ] Step 1 idle: empty fields, next enabled, back disabled
- [ ] Step 1 invalid: errors shown, next validates and blocks
- [ ] Step 2 with back: step 1 data preserved
- [ ] Step N typing: smooth transition, minimal re-renders
- [ ] Submitting: everything disabled, spinner, back disabled
- [ ] Success: confirmation screen, localStorage cleared
- [ ] Server error: alert + fields re-editable
- [ ] Refresh mid-wizard: localStorage restores state and current step

### Data Flow
- [ ] Per-step Zod schema validated on Next
- [ ] Combined schema on submit (merge all step data)
- [ ] React Query mutation with loading/error/success handling
- [ ] localStorage: set on every change, clear on success
- [ ] Default values for ALL fields across all steps
