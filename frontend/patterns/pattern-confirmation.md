# Pattern: Confirmation Flow

**Severity**: Advanced · **Stack**: shadcn/ui AlertDialog + Input + Button + Lucide + sonner + React Query
**Depends on**: AlertDialog, Button, Input, Alert, toast (sonner)

---

## 1. When to Use

**Use this pattern when**:
- The user is about to perform a destructive action that cannot be undone (bulk delete, account deletion, irreversible financial action)
- Extra attention is needed: type-to-confirm forces reading, countdown slows impulsive action
- The action is undoable within a short time window (e.g. soft delete, status change)

**Do NOT use this pattern when**:
- Simple "Are you sure?" confirmation — use simple AlertDialog from the Modal Flow pattern
- Action easily undoable with external undo (e.g. trash bin) — toast with undo is sufficient
- Positive feedback (success) — use sonner toast directly
- Complex forms with multiple fields — use Form pattern

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| AlertDialog | Confirmation modal container | default |
| AlertDialogContent | Content wrapper | default |
| AlertDialogHeader | Header with icon + title | default |
| AlertDialogTitle | Warning title | default |
| AlertDialogDescription | Detailed description | default |
| AlertDialogFooter | Footer with actions | default |
| AlertDialogCancel | Cancel button | default |
| Button | Confirm (destructive) | variant: `destructive` |
| Input | "Type to confirm" field | default |
| Alert | Mutation error | variant: `destructive` |
| toast | Sonner for undo / notification | default |

---

## 3. JSX Structure

### 3.1 Type-to-Confirm

```tsx
<AlertDialog open={open} onOpenChange={onOpenChange}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <AlertDialogTitle>{title}</AlertDialogTitle>
      </div>
      <AlertDialogDescription>
        {description}
      </AlertDialogDescription>
    </AlertDialogHeader>

    <div className="space-y-2">
      <p className="text-sm font-medium">
        Type <strong>CONFIRM</strong> to proceed
      </p>
      <Input
        value={typedText}
        onChange={(e) => setTypedText(e.target.value)}
        id="confirm-input"
        aria-label="Type CONFIRM to proceed"
        placeholder="CONFIRM"
        disabled={isPending}
        autoComplete="off"
      />
    </div>

    {error && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    <AlertDialogFooter>
      <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
      <Button
        variant="destructive"
        disabled={typedText !== 'CONFIRM' || isPending}
        onClick={onConfirm}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Deleting...
          </>
        ) : 'Confirm'}
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3.2 Countdown

```tsx
<AlertDialog open={open} onOpenChange={onOpenChange}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <AlertDialogTitle>{title}</AlertDialogTitle>
      </div>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>

    <div className="flex items-center justify-center py-4">
      <div className="text-4xl font-bold tabular-nums text-destructive">{countdown}</div>
    </div>

    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <Button
        variant="destructive"
        disabled={countdown > 0 || isPending}
        onClick={onConfirm}
      >
        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {isPending ? 'Deleting...' : 'Confirm'}
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3.3 Action with Undo Toast

```tsx
const executeWithUndo = (action: () => Promise<void>, undoAction: () => Promise<void>) => {
  toast('Item deleted', {
    description: 'You can undo within 5 seconds',
    action: {
      label: 'Undo',
      onClick: () => undoAction(),
    },
    duration: 5000,
  })
  action()
}
```

---

## 4. State Machine

```yaml
Pattern: TypeToConfirm
Initial: idle

States:
  idle:
    description: "Initial state, trigger visible"
    ui: "Trigger button/icon."
    transitions:
      on_trigger_click → confirming

  confirming:
    description: "Dialog open, input empty"
    ui: "AlertDialog visible. 'CONFIRM' input empty. Confirm button disabled."
    transitions:
      on_escape → idle (close)
      on_cancel → idle
      on_type → typing

  typing:
    description: "User typing in field"
    ui: "Input value updated. Confirm button enabled if matches 'CONFIRM'."
    transitions:
      on_text_matches → ready
      on_type (different) → typing
      on_escape → idle
      on_cancel → idle

  ready:
    description: "Text matches, button active"
    ui: "Confirm button enabled."
    transitions:
      on_confirm → submitting
      on_type (different) → typing
      on_escape → idle
      on_cancel → idle

  submitting:
    description: "Mutation in progress"
    ui: "Button disabled + spinner. Input disabled. Errors hidden."
    transitions:
      on_success → success
      on_error → error

  success:
    description: "Operation completed"
    ui: "Success toast. Dialog closes."
    transitions:
      on_dialog_close → idle

  error:
    description: "Error during mutation"
    ui: "Error alert visible inside dialog. Input and button re-enabled. Dialog stays open."
    transitions:
      on_retry → submitting
      on_cancel → idle

```

### 4.2 Pattern: Countdown

```yaml
Pattern: Countdown
Initial: idle

States:
  idle:
    description: "Initial state, trigger visible"
    ui: "Trigger button/icon."
    transitions:
      on_trigger_click → showing

  showing:
    description: "Dialog open, countdown starts"
    ui: "Countdown visible. Confirm button disabled."
    transitions:
      on_tick → counting
      on_cancel → idle
      on_escape → idle

  counting:
    description: "Countdown in progress"
    ui: "Decreasing number visible. Button disabled until 0."
    transitions:
      on_tick (countdown > 0) → counting
      on_countdown_zero → ready
      on_cancel → idle
      on_escape → idle

  ready:
    description: "Countdown finished, action possible"
    ui: "Confirm button enabled."
    transitions:
      on_confirm → submitting
      on_cancel → idle
      on_escape → idle

  submitting:
    description: "Mutation in progress"
    ui: "Button disabled + spinner. Countdown hidden."
    transitions:
      on_success → success
      on_error → error

  success:
    description: "Operation completed"
    ui: "Success toast. Dialog closes."
    transitions:
      on_dialog_close → idle

  error:
    description: "Error during mutation"
    ui: "Error alert visible inside dialog. Dialog stays open."
    transitions:
      on_retry → submitting
      on_cancel → showing
```

---

## 5. Data Flow

### 5.1 Type-to-Confirm

```tsx
const [open, setOpen] = useState(false)
const [typedText, setTypedText] = useState('')
const confirmWord = 'CONFIRM'

const deleteMutation = useMutation({
  mutationFn: () => api.deleteItems(ids),
  onSuccess: () => {
    toast.success('Items deleted')
    queryClient.invalidateQueries({ queryKey: ['items'] })
    setOpen(false)
    setTypedText('')
  },
  onError: (err: Error) => {
    setError(err.message)
  },
})
```

### 5.2 Countdown

```tsx
const [countdown, setCountdown] = useState(10)

useEffect(() => {
  if (!open) return
  setCountdown(10)
  const interval = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        clearInterval(interval)
        return 0
      }
      return prev - 1
    })
  }, 1000)
  return () => clearInterval(interval)
}, [open])
```

### 5.3 Undo with Sonner

```tsx
function useUndoMutation<TData, TVariables>({
  mutationFn,
  undoMutationFn,
  queryKey,
  successMessage,
}: UseUndoMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      toast(successMessage, {
        description: 'You can undo within 5 seconds',
        action: {
          label: 'Undo',
          onClick: () => {
            undoMutationFn(variables)
            toast.success('Action undone')
            queryClient.invalidateQueries({ queryKey })
          },
        },
        duration: 5000,
      })
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
```

---

## 6. TypeScript Types

```tsx
type ConfirmationVariant = 'type-to-confirm' | 'countdown' | 'undo'

interface ConfirmationFlowProps {
  title: string
  description: string
  confirmText?: string
  variant: ConfirmationVariant
  onConfirm: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending?: boolean
  error?: string | null
}

interface TypeToConfirmProps extends ConfirmationFlowProps {
  variant: 'type-to-confirm'
  confirmWord?: string
}

interface CountdownProps extends ConfirmationFlowProps {
  variant: 'countdown'
  duration?: number
}

interface UseUndoMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  undoMutationFn: (variables: TVariables) => Promise<unknown>
  queryKey: string[]
  successMessage: string
}
```

---

## 7. Accessibility

### ARIA

| Element | Attribute | Value |
|----------|-----------|--------|
| AlertDialogContent | `role` | `alertdialog` |
| AlertDialogContent | `aria-modal` | `true` |
| AlertDialogTitle | `aria-labelledby` | title id |
| Input (type-to-confirm) | `aria-label` | "Type CONFIRM to proceed" |
| Confirm button | `aria-label` | action description (e.g. "Confirm deletion") |
| Confirm button | `aria-disabled` | `true` until text matches |

### Focus Management

- **Focus trap**: built-in Radix for AlertDialog
- **Initial focus**: input (type-to-confirm) or cancel button (countdown)
- **Return focus**: to the trigger that opened the dialog
- **Esc**: closes the dialog (built-in AlertDialog — click outside does NOT close)

### Keyboard Navigation

```
Tab:         navigate input/button within dialog
Enter:       activate focused button (disabled if no match)
Esc:         close dialog
```

### Screen Reader Flow

```
1. "Warning: {title}. {description}"
2. "Type CONFIRM to proceed"
3. "{character} of 8 typed" (or similar feedback)
4. "Confirm deletion, button, disabled" → "enabled"
5. On submit: "Operation in progress"
6. On error: "Error: {message}"
```

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| < 640px | Full-screen: `fixed inset-0 rounded-none`, padding 16px, buttons full-width vertical stack. Input full-width. Large centered countdown. |
| ≥ 640px | Centered: `sm:max-w-md sm:rounded-lg`, padding 24px, buttons side-by-side. |

```tsx
// Responsive AlertDialogContent
<AlertDialogContent className="sm:max-w-md">
```

---

## 9. QA Checklist

### Pattern-Specific
- [ ] "Type CONFIRM to proceed" — input present and label clear
- [ ] Confirm button disabled until text EXACTLY matches (case-sensitive)
- [ ] Input autoComplete="off" to avoid browser suggestions
- [ ] Confirm button enables immediately after text matches
- [ ] Countdown: visible timer starts when dialog opens
- [ ] Countdown: confirm button disabled while countdown > 0
- [ ] Countdown: when countdown reaches 0, button enables
- [ ] Countdown: closing and reopening resets countdown
- [ ] Undo: toast appears with "Undo" button
- [ ] Undo: 5 second undo window
- [ ] Undo: clicking "Undo" executes undoMutation and shows "Action undone"
- [ ] Undo: toast expires after 5s — action NOT undoable
- [ ] Mutation pending: button disabled + spinner
- [ ] Mutation error: error visible inside dialog, dialog stays open
- [ ] Mutation success: dialog closed, success toast
- [ ] Esc closes the dialog (all variants)
- [ ] Click outside does NOT close the dialog (AlertDialog behavior)

### States Verified (Type-to-Confirm)
- [ ] Idle: trigger visible
- [ ] Confirming: dialog open, input empty, button disabled
- [ ] Typing: input shows text, button disabled until match
- [ ] Ready: button enabled
- [ ] Submitting: spinner + disabled
- [ ] Success: toast + close
- [ ] Error: error visible, dialog open, input/button re-enabled

### States Verified (Countdown)
- [ ] Showing: dialog open, countdown at initial value
- [ ] Counting: countdown decrements, ticking visible
- [ ] Ready: countdown at 0, button enabled
- [ ] Auto-cancel: dialog does NOT auto-close — user decides
- [ ] Reset: close/reopen resets countdown

### States Verified (Undo)
- [ ] Executed: toast with undo button
- [ ] Undo within window: undoMutation executed, confirmation toast
- [ ] Undo after window: toast disappeared, action consumed

### Data Flow
- [ ] Confirmation word configurable (default "CONFIRM")
- [ ] Countdown duration configurable (default 10s)
- [ ] Undo duration configurable (default 5s)
- [ ] Mutation: onSuccess → invalidate queryKey + close + toast
- [ ] Mutation: onError → stay open + error message
