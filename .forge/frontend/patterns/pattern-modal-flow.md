# Pattern: Modal Flow (Dialog / AlertDialog)

**Severity**: Interaction · **Stack**: shadcn/ui Dialog + AlertDialog + React Query + sonner
**Depends on**: Dialog, AlertDialog, Button, Form, Input (for form in modal)

---

## 1. When to Use

**Use this pattern when**:
- The user must confirm a destructive action (delete) → AlertDialog
- The user must fill out a quick form without losing context → Dialog + Form
- Quick feedback on completed operation (success/error message)
- Actions requiring immediate attention before proceeding

**Do NOT use this pattern when**:
- Complex multi-step flows → Wizard pattern
- Content that benefits from a side-by-side view → Drawer / Sheet
- Navigation between pages → native routing
- Extended information panel → Master-Detail
- Non-blocking temporary notifications → Notification (sonner toast)

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Dialog | Generic modal container (form, info) | default |
| AlertDialog | Destructive confirmation (delete) | default |
| DialogTrigger | Button that opens the dialog | asChild |
| DialogContent | Content wrapper + overlay | default |
| DialogHeader | Header with title + description | default |
| DialogTitle | Dialog title | default |
| DialogDescription | Description / warning | default |
| DialogFooter | Footer with actions | default |
| AlertDialogAction | Confirm button (AlertDialog) | default |
| AlertDialogCancel | Cancel button (AlertDialog) | default |
| Button | Custom actions in footer | variant: default/secondary/outline/ghost/destructive |
| Form | Form inside Dialog | default |
| Input | Form fields inside Dialog | default |

---

## 3. JSX Structure

### 3.1 Dialog for Form

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField ... />
        {/* other fields */}
      </form>
    </Form>

    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
      <Button type="submit" disabled={isPending} onClick={form.handleSubmit(onSubmit)}>
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isPending ? 'Saving...' : 'Save'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3.2 AlertDialog for Destructive Confirmation

```tsx
<AlertDialog open={open} onOpenChange={onOpenChange}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        <AlertDialogTitle>{title}</AlertDialogTitle>
      </div>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    {error && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        disabled={isPending}
        onClick={onConfirm}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Deleting...
          </>
        ) : (
          'Confirm'
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 4. State Machine

```yaml
Pattern: ModalFlow
Initial: closed

States:
  closed:
    description: "Modal closed, trigger visible"
    ui: "Trigger button/icon. No overlay."
    transitions:
      on_trigger_click → opening

  opening:
    description: "Opening animation (brief)"
    ui: "Overlay fade-in + modal scale-in. Duration ~150ms."
    transitions:
      on_animation_end → open

  open:
    description: "Modal open, user interacting"
    ui: "Content visible. Focus trap active. Esc to close."
    transitions:
      on_submit → submitting (Dialog)
      on_confirm → submitting (AlertDialog)
      on_escape → dismissing
      on_outside_click → dismissing (Dialog ONLY)
      on_cancel_click → dismissing

  submitting:
    description: "Operation in progress"
    ui: "Buttons disabled + spinner. Fields disabled (form). Errors hidden."
    transitions:
      on_success → success
      on_error → error

  success:
    description: "Operation completed"
    ui: "Success toast (sonner). Modal closes. Queries invalidated."
    transitions:
      on_toast_dismiss → closed
      on_auto_close (2s) → closed

  error:
    description: "Error during submit"
    ui: "Error message visible inside modal. Buttons re-enabled. Modal stays open."
    transitions:
      on_retry → submitting
      on_cancel → dismissing

  dismissing:
    description: "Closing animation"
    ui: "Overlay fade-out + modal scale-out. Duration ~150ms."
    transitions:
      on_animation_end → closed
```

---

## 5. Data Flow

### 5.1 Open State (Parent-controlled)

```tsx
const [isOpen, setIsOpen] = useState(false)

<DeleteConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  itemName="Order #1234"
  onConfirm={() => deleteMutation.mutate(id)}
/>
```

### 5.2 Mutation with React Query

```tsx
const deleteOrder = useMutation({
  mutationFn: (id: string) => api.deleteOrder(id),
  onSuccess: () => {
    toast.success('Item deleted successfully')
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    onOpenChange(false) // closes the modal
  },
  onError: (error: Error) => {
    setError(error.message) // shows error, stays open
  },
})
```

### 5.3 Form in Dialog with React Hook Form

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ },
})

const createItem = useMutation({
  mutationFn: (data: FormValues) => api.createItem(data),
  onSuccess: () => {
    toast.success('Item created')
    queryClient.invalidateQueries({ queryKey: ['items'] })
    onOpenChange(false)
    form.reset()
  },
  onError: (error: ApiError) => {
    if (error.field) {
      form.setError(error.field as keyof FormValues, { message: error.message })
    } else {
      setError(error.message)
    }
  },
})
```

### 5.4 Reset on Close

```tsx
const handleOpenChange = (open: boolean) => {
  if (!open) {
    setError(null)    // reset errors
    form?.reset()     // reset form if present
  }
  onOpenChange(open)
}
```

---

## 6. TypeScript Types

```tsx
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  isPending?: boolean
  error?: string | null
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  formComponent: React.ReactNode
  onSubmit: () => void
  isPending?: boolean
  error?: string | null
  submitLabel?: string
  cancelLabel?: string
}

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  onConfirm: () => void
  isPending?: boolean
  error?: string | null
}

interface FormValues {
  // depends on context — define for each specific form
}
```

---

## 7. Accessibility

### ARIA

| Element | Attribute | Value |
|----------|-----------|--------|
| Content | `role` | `dialog` (Dialog), `alertdialog` (AlertDialog) |
| Content | `aria-modal` | `true` |
| Content | `aria-labelledby` | → `DialogTitle` id |
| Content | `aria-describedby` | → `DialogDescription` id (if present) |
| Cancel button | `aria-label` | "Cancel" |
| Confirm button | `aria-label` | action description (e.g. "Delete order") |

### Focus Management

- **Focus trap**: built-in Radix — focus cycles within modal
- **Initial focus**: first interactive element (confirm button for AlertDialog, first input for Dialog)
- **Return focus**: focus returns to trigger when modal closes
- **Esc**: closes modal (built-in Radix)
- **Click outside**: closes Dialog (default), does NOT close AlertDialog (intended behavior for destructive actions)

### Keyboard Navigation

```
Tab:         navigate between interactive elements within modal
Shift+Tab:   navigate in reverse order
Esc:         close modal (AlertDialog: built-in, Dialog: built-in)
Enter:       activate focused button
Space:       activate focused button
```

### Screen Reader Flow

```
1. Announce modal title
2. Announce description/warning
3. Focus on first interactive element
4. "Press Escape to close"
5. On submit: announce loading state
6. On error: "Error: [message]"
7. On success: announce toast
```

---

## 8. Responsive

| Breakpoint | Dialog | AlertDialog |
|------------|--------|-------------|
| < 640px | Full-screen sheet: `fixed inset-0 rounded-none`, padding 16px, buttons full-width | Full-screen sheet: same logic, padding 16px, buttons full-width vertical stack |
| ≥ 640px | Centered: `sm:max-w-[425px] sm:rounded-lg`, padding 24px, buttons side-by-side | Centered: `sm:max-w-md sm:rounded-lg`, padding 24px, buttons side-by-side |

```tsx
// shadcn/ui built-in responsive handling:
// DialogContent already uses responsive classes sm:*
// Extra customization:
<DialogContent className="fixed inset-0 rounded-none sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-[425px] sm:rounded-lg">
```

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Focus trap: Tab cycles only within modal, does not escape
- [ ] Focus trap: Shift+Tab cycles in reverse order
- [ ] Esc: closes modal (both types)
- [ ] Click outside: closes Dialog, does NOT close AlertDialog
- [ ] Click outside on overlay: dismiss confirmed (Dialog)
- [ ] Submitting: buttons disabled + spinner on confirm/submit
- [ ] Submitting: form fields disabled if present
- [ ] Error: message visible inside modal, buttons re-enabled, modal stays open
- [ ] Success: sonner toast, modal closes, queries invalidated
- [ ] Success: form reset after close
- [ ] Reset error: when reopening modal, errors reset
- [ ] Return focus: focus returns to trigger after close
- [ ] aria-modal="true" and role="dialog"/"alertdialog" present
- [ ] aria-labelledby connected to title
- [ ] aria-describedby connected to description
- [ ] Mobile (<640px): full-width sheet, full buttons, adequate padding
- [ ] Desktop (≥640px): centered, max-width, adequate padding
- [ ] Animation: smooth open/close transition (~150ms)
- [ ] Scroll lock: body scroll blocked when modal open

### States Verified
- [ ] Closed: trigger visible and interactable
- [ ] Opening: animation without artifacts
- [ ] Open: content visible, focus trap active, scroll blocked
- [ ] Submitting: spinner + disabled, visible feedback
- [ ] Success: toast + modal close
- [ ] Error: error visible, modal stays open

### Data Flow
- [ ] Open state controlled by parent (useState)
- [ ] Form data: React Hook Form + Zod validation
- [ ] Mutation: onSuccess → close + invalidate queries
- [ ] Mutation: onError → stay open + error message
- [ ] Reset: on close, form and errors reset
- [ ] Toast: sonner for success/error notification
