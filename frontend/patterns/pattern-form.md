# Pattern: Form + Validation

**Severity**: Core · **Stack**: React Hook Form v7 + Zod + shadcn/ui Form
**Depends on**: Form, Input, Select, Textarea, Checkbox, Switch, Button, Combobox, DatePicker

---

## 1. When to Use

**Use this pattern when**:
- The user needs to enter or edit structured data with validation
- The form has 3+ fields with validation rules (required, format, length)
- Data must be validated client-side BEFORE submission to server
- Submit requires an API call with server-side error handling

**Do NOT use this pattern when**:
- 1-2 simple fields without validation → native HTML form or direct `<form>`
- Search filters (immediate effect, no submit) → Data Table pattern
- Only delete action with confirmation → AlertDialog
- Inline edit settings (immediate toggle) → Switch with direct mutation
- Multi-step form with wizard → Wizard pattern

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Form | Form wrapper with React Hook Form context | default |
| FormField | Links RHF field to UI markup | default |
| FormItem | Container label + control + message | default |
| FormLabel | Field label with required indicator | default |
| FormControl | Input control wrapper | default |
| FormMessage | Field error message | default |
| FormDescription | Help text below field | default |
| Input | Text, email, URL, number | default |
| Select | Selection from closed list (< 20 items) | default |
| Textarea | Multi-line text | default |
| Checkbox | Binary choice or groups | default |
| Switch | Toggle on/off | default |
| Button | Submit, cancel, actions | variant: default/secondary/outline/ghost/destructive |
| Combobox | Select with search (20+ options) | default |
| DatePicker | Single date selection | default |
| Popover | Date picker container / combobox | default |
| Calendar | Calendar grid for DatePicker | default |
| Command | Search for Combobox | default |

---

## 3. JSX Structure

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    {/* ── SECTION: Basic information ── */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic information</h3>

      <FormField
        control={form.control}
        name="customerName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Customer name <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Mario Rossi" {...field} />
            </FormControl>
            <FormDescription>
              Customer first and last name
            </FormDescription>
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="mario@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+39 123 456 7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>

    {/* ── SECTION: Order details ── */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Order details</h3>

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Order notes..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sendNotification"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-3 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Send notification to customer</FormLabel>
              <FormDescription>
                The customer will receive a confirmation email
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>

    {/* ── FOOTER ── */}
    <div className="flex items-center justify-end gap-3 pt-4 border-t">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </div>
  </form>
</Form>
```

---

## 4. State Machine

```yaml
Pattern: Form
Initial: idle

States:
  idle:
    description: "Initial form, no data entered"
    ui: "Empty fields with placeholders. Submit button enabled."
    transitions:
      on_field_change → typing (first character)
      on_submit_click → submitting

  typing:
    description: "User is typing (per-field validation on onBlur)"
    ui: "Editable fields. Any errors shown below field after onBlur."
    transitions:
      on_blur_with_error → field-error
      on_blur_valid → typing (no error)
      on_submit_click → submitting

  field-error:
    description: "Validation error on one or more fields"
    ui: "<FormMessage> shows error below field. Submit button enabled (clickable)."
    transitions:
      on_fix_on_blur → typing (error removed)
      on_submit_click → submitting (RHF validates all first)

  submitting:
    description: "Submitting, form disabled"
    ui: "All fields disabled. Submit button shows spinner + 'Saving...'"
    transitions:
      on_success → success
      on_server_error → server-error
      on_field_validation_fail → submission-blocked

  submission-blocked:
    description: "Client validation failed on submit"
    ui: "First field with error receives focus. Submit button remains enabled."
    transitions:
      on_fix_on_blur → typing
      on_submit_click → submitting

  success:
    description: "Operation completed successfully"
    ui: "Success toast. Navigation to detail/list page. Or inline confirmation message."
    transitions:
      on_toast_dismiss → idle (same form)
      on_navigate → (exits form)

  server-error:
    description: "Generic API error or mapped to specific fields"
    ui: "Alert banner at top of form for generic error. Errors mapped to specific fields via <FormMessage>. Fields re-editable."
    transitions:
      on_field_change → typing (server error removed from modified field)
      on_submit_click → submitting
```

---

## 5. Data Flow

### 5.1 Zod Schema + React Hook Form

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const orderFormSchema = z.object({
  customerName: z.string().min(2, 'Name too short').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed']),
  notes: z.string().max(1000, 'Maximum 1000 characters').optional(),
  sendNotification: z.boolean().default(false),
})

type OrderFormValues = z.infer<typeof orderFormSchema>

const form = useForm<OrderFormValues>({
  resolver: zodResolver(orderFormSchema),
  defaultValues: {
    customerName: '',
    email: '',
    phone: '',
    status: 'pending',
    notes: '',
    sendNotification: false,
  },
  mode: 'onBlur', // per-field validation on onBlur
})
```

### 5.2 Submit with React Query Mutation

```tsx
const createOrder = useMutation({
  mutationFn: (data: OrderFormValues) => api.createOrder(data),
  onSuccess: () => {
    toast.success('Order created successfully')
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    router.push('/orders')
  },
  onError: (error: ApiError) => {
    mapServerErrors(error, form)
  },
})
```

### 5.3 Server Error Mapping

```tsx
function mapServerErrors(error: ApiError, form: UseFormReturn<FormValues>) {
  // Case 1: generic error
  if (!error.field) {
    form.setError('root', { message: error.message })
    return
  }
  // Case 2: error mapped to specific field
  form.setError(error.field as keyof FormValues, {
    message: error.message,
  })
  // Field in error receives focus
  const el = document.querySelector(`[name="${error.field}"]`)
  if (el instanceof HTMLElement) el.focus()
}
```

### 5.4 Optimistic UI (for update)

```tsx
const updateOrder = useMutation({
  mutationFn: (data: OrderFormValues) => api.updateOrder(id, data),
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: ['orders'] })
    const previous = queryClient.getQueryData(['orders'])
    queryClient.setQueryData(['order', id], data) // optimistic update
    return { previous }
  },
  onError: (_err, _data, context) => {
    queryClient.setQueryData(['orders'], context?.previous)
    toast.error('Error saving')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
  },
})
```

### 5.5 Unsaved Changes Warning

```tsx
const isDirty = form.formState.isDirty

useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [isDirty])

// Next.js App Router: confirm before navigating away
useEffect(() => {
  if (isDirty) {
    router.events?.on('routeChangeStart', confirmLeave)
    return () => router.events?.off('routeChangeStart', confirmLeave)
  }
}, [isDirty])
```

---

## 6. TypeScript Types

```tsx
// Shared client/server schema
export const orderFormSchema = z.object({
  customerName: z.string().min(2, 'Name too short').max(100, 'Maximum 100 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string()
    .regex(/^[\d\s+()-]{7,20}$/, 'Invalid number')
    .optional()
    .or(z.literal('')),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
  notes: z.string().max(1000, 'Maximum 1000 characters').optional(),
  sendNotification: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  categoryId: z.string().min(1, 'Select a category'),
  deliveryDate: z.date().optional(),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>

// Component props
export interface CreateOrderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

// API Error shape
export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiError {
  message: string
  field?: string
  fields?: ApiFieldError[]
}

// Response
export interface CreateOrderResponse {
  id: string
}
```

---

## 7. Accessibility

### Label-Input Association
- shadcn/ui `FormLabel` uses `htmlFor` automatically via `FormItem` context
- `aria-describedby` on input connected to `FormMessage` and `FormDescription`
- `aria-required="true"` on required fields (Reflect in Zod schema)

### Error Messages
- `FormMessage` has `id` generated automatically by shadcn/ui Form
- Connection via `aria-describedby` input → error message
- Screen reader announces error when it appears (implicit live region)

### Fieldset / Legend
- Related field groups use `<fieldset>` + `<legend>`
- Checkbox/radio group: `<fieldset>` with `<legend>` as group label
- Switch associated with `FormLabel` inside `FormItem`

### Required Indicator
- Required fields: label with ` <span className="text-destructive">*</span>`
- `aria-required="true"` on the control

### Keyboard Navigation
- Tab order: follows visual DOM order
- Submit: Enter from any field (except Textarea — Shift+Enter for newline)
- Cancel: Escape (optional, with global listener)
- Select: Arrow keys to navigate options
- Combobox: Arrow keys + typeahead to filter options
- DatePicker: Arrow keys to navigate calendar, Enter to select
- Switch: Space to toggle

### Focus Management
- First field with error receives focus after failed validation
- On success: focus moves to confirmation message or navigates
- On cancel: focus returns to the element that opened the form (if sheet/dialog)

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| ≥ 768px | Related fields side-by-side with `grid grid-cols-2 gap-4`. Form max-width `max-w-2xl`. |
| < 768px | Single column. Full-width inputs. Full-width button on mobile. |

```tsx
// Responsive field pattern
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField ... />  {/* email */}
  <FormField ... />  {/* phone */}
</div>

// Form container
<div className="w-full max-w-2xl mx-auto px-4 md:px-6">
  <Form ...>
    ...
  </Form>
</div>
```

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Field validation: error shown on onBlur (not while typing)
- [ ] Field validation: error removed when field becomes valid
- [ ] Submit button: loading spinner + disabled during `submitting` state
- [ ] Submit button: re-enables after server-error (user can fix and retry)
- [ ] Server error mapping: generic error shown as Alert at top of form
- [ ] Server error mapping: per-field error shown via FormMessage
- [ ] Server error mapping: field in error receives focus
- [ ] Required fields: marked with `*` visually AND `aria-required`
- [ ] Character limits: shown if applicable (e.g. "120/1000 characters")
- [ ] Unsaved changes: `beforeunload` warning if form is dirty
- [ ] Unsaved changes: confirmation on internal navigation (router event)
- [ ] Keyboard tab order: logical, does not skip fields
- [ ] Disabled state: all fields disabled during submit
- [ ] Success: sonner toast + navigation or inline message
- [ ] Cancel: returns to previous page or closes sheet/dialog
- [ ] DatePicker: keyboard navigable (arrow keys for days)
- [ ] Combobox: filters options while typing, keyboard navigable
- [ ] Checkbox/Switch: label clickable to activate (FormLabel ensures this)
- [ ] Mobile: full-width button, single column fields
- [ ] Focus trap: if form is in Dialog/Sheet, focus stays inside

### States Verified
- [ ] Idle: empty fields, placeholders visible, button enabled
- [ ] Typing: smooth typing, no excessive re-render
- [ ] Field error: error visible below specific field, other fields OK
- [ ] Submitting: everything disabled, spinner on button
- [ ] Success: toast + invalidate query + navigation
- [ ] Server error: alert banner + field error + fields re-editable

### Data Flow
- [ ] Zod schema: validation synced with TypeScript type
- [ ] Default values: present for ALL fields (never undefined)
- [ ] Mode: `onBlur` (not `onChange` for long forms)
- [ ] React Query: mutationKey depends on context
- [ ] Optimistic update: rollback on error
- [ ] Invalidate query: on success, updates list
