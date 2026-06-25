# Pattern: Notification / Toast

**Severity**: Interaction · **Stack**: Sonner + React Query + Lucide
**Depends on**: Toaster (Sonner), Button (undo action)

---

## 1. When to Use

**Use this pattern when**:
- Success/error feedback after a mutation (create, edit, delete)
- Brief system messages (e.g. "Status updated")
- Non-critical alerts that do not require immediate action
- Action with undo (e.g. "Item deleted. Undo")

**Do NOT use this pattern when**:
- Critical error requiring user action → Error Recovery pattern
- Persistent message that stays until manual dismiss → Alert / Banner
- Inline validation errors in a form → Form pattern (FormMessage)
- Destructive action confirmation → Modal Flow / Confirmation Flow
- Loading states → Skeleton / inline spinner

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Toaster | Renders toasts in root layout | default (sonner) |
| toast | Function to show notifications | `.success()`, `.error()`, `.info()`, custom |
| Button | Optional: undo action inside toast | variant: outline, size: sm |

Icons: Lucide — `CheckCircle2` (success), `XCircle` (error), `Info` (info), `Undo2` (undo action)

---

## 3. JSX Structure

### 3.1 Toaster in Root Layout

```tsx
// app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Toaster
          richColors
          closeButton
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'text-sm',
          }}
        />
      </body>
    </html>
  )
}
```

### 3.2 Toast in Mutation

```tsx
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Success toast
toast.success('Order created', {
  description: `Order #${id} was created successfully`,
  icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
})

// Error toast
toast.error('Error', {
  description: error.message,
  icon: <XCircle className="h-4 w-4 text-red-500" />,
})

// Undo toast
toast('Item deleted', {
  description: `"${name}" has been removed`,
  action: {
    label: 'Undo',
    onClick: () => rollback(),
  },
  duration: 6000, // longer to give time to click
})
```

---

## 4. State Machine

```yaml
Pattern: Notification
Initial: idle

States:
  idle:
    description: "No active notifications"
    ui: "No toast visible. Toaster rendered but empty."
    transitions:
      on_toast_triggered → showing

  showing:
    description: "Notification visible for user feedback"
    ui: "Toast positioned top-right (desktop) / bottom-center (mobile). Icon + title + optional description. Auto-dismiss in 4s (default)."
    transitions:
      on_auto_dismiss → idle
      on_manual_dismiss → idle
      on_action_click → idle (executes undo)
      on_new_toast → stacked
      on_hover → dismissing_paused

  dismissing_paused:
    description: "Hover on toast — dismiss timer paused"
    ui: "Toast remains visible. Timer resumes on mouse leave."
    transitions:
      on_mouse_leave → showing (timer resumes)
      on_manual_dismiss → idle

  stacked:
    description: "Multiple simultaneous toasts"
    ui: "Toasts stacked vertically. Newest on top. Each follows its own timer."
    transitions:
      on_top_dismiss → stacked (next remains)
      on_all_dismissed → idle
```

---

## 5. Data Flow

### 5.1 Mutation → Toast

```tsx
const createItem = useMutation({
  mutationFn: api.createItem,
  onSuccess: (data) => {
    toast.success('Created successfully', {
      description: `${data.name} has been created`,
    })
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
  onError: (error: ApiError) => {
    toast.error('Error', {
      description: error.message,
    })
  },
})
```

### 5.2 Toast with Undo

```tsx
const deleteItem = useMutation({
  mutationFn: (id: string) => api.deleteItem(id),
  onSuccess: (_, deletedId) => {
    const { undo } = useUndoStack()
    toast('Item deleted', {
      description: 'You can undo within 6 seconds',
      action: {
        label: 'Undo',
        onClick: () => undo(deletedId),
      },
      duration: 6000,
    })
  },
  onError: (error) => {
    toast.error('Error', { description: error.message })
  },
})
```

### 5.3 Sonner Promise Toast (for long operations)

```tsx
toast.promise(api.createItem(data), {
  loading: 'Creating...',
  success: (data) => `"${data.name}" created successfully`,
  error: (err) => `Error: ${err.message}`,
})
```

---

## 6. TypeScript Types

```tsx
export interface NotificationToast {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'info' | 'default'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
}

// Hook for mutation with toast
export interface UseToastMutationOptions<TData, TError, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  successMessage?: string
  successDescription?: (data: TData) => string
  errorMessage?: string
  errorDescription?: (error: TError) => string
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
  invalidateQueries?: string[][]
  undoAction?: {
    label: string
    onClick: (data: TData) => void
  }
}

// Recommended Sonner Toaster props
export interface ToasterConfig {
  position?: 'top-right' | 'bottom-center'
  richColors?: boolean
  closeButton?: boolean
  duration?: number
  expand?: boolean
  visibleToasts?: number
}
```

---

## 7. Accessibility

### ARIA Roles & Live Regions
- Success toast: `role="status"` + `aria-live="polite"` (non-intrusive announcement)
- Error toast: `role="alert"` + `aria-live="assertive"` (immediate announcement)
- Sonner applies these attributes automatically

### Focus Management
- Toast does NOT steal focus — user continues interacting with the page
- If toast has an action (e.g. undo), the button is focusable via Tab
- On toast dismiss, focus stays on current element

### Keyboard
- Escape: closes the most recent toast
- Tab: reaches any actions in the toast
- Enter/Space: activates the toast action

### Screen Reader Flow
```
Success: "Notification: Created successfully. 'Order name' has been created."
Error:   "Alert: Error. 'Error message'. Button: Close"
Undo:    "Notification: Item deleted. Button: Undo"
```

### Contrast
- Success/error icons: green (#16a34a) and red (#dc2626) on toast background
- Text: at least 4.5:1 contrast ratio on toast background
- Sonner `richColors` ensures adequate contrast

---

## 8. Responsive

| Breakpoint | Behavior |
|------------|--------------|
| ≥ 768px | Toasts top-right (`position: top-right`). Max-width 380px. |
| < 768px | Toasts bottom-center (`position: bottom-center`). Full-width with margins. Stack upward. |

```tsx
// Responsive config
<Toaster
  position={isMobile ? 'bottom-center' : 'top-right'}
  richColors
  closeButton
  expand={!isMobile}
  visibleToasts={isMobile ? 3 : 5}
/>
```

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Success toast: green icon (`CheckCircle2`) + title + optional description
- [ ] Error toast: red icon (`XCircle`) + error message from API
- [ ] Info toast: blue/gray icon (`Info`) for informational messages
- [ ] Auto-dismiss after 4 seconds (default) or custom duration
- [ ] Hover on toast pauses dismiss timer
- [ ] Stack working: 3+ toasts stack without overlapping
- [ ] Undo action: clickable button, executes rollback, toast disappears
- [ ] Close button (X) always visible for manual dismiss
- [ ] Accessibility: screen reader announces with correct role (status/alert)
- [ ] Escape key closes the most recent toast
- [ ] Promise toast: shows loading → success/error with appropriate message
- [ ] Responsive: top-right on desktop, bottom-center on mobile
- [ ] Does not steal focus — user continues typing/interacting
- [ ] Mobile touch: swipe to dismiss
- [ ] Visibility limit: max 5 visible toasts, older are queued

### States Verified
- [ ] Idle: no toast visible, Toaster present in DOM
- [ ] Showing: toast with icon + title + description, timer starts
- [ ] Dismissing: fade-out animation, timer expired or X click
- [ ] Stacked: 3 toasts stacked, each with own timer
- [ ] Dismiss paused: hover blocks timer, mouse leave resumes

### Data Flow
- [ ] onSuccess mutation → toast.success()
- [ ] onError mutation → toast.error() with API message
- [ ] Undo toast: action.onClick executes rollback + invalidate query
- [ ] Promise toast: loading/success/error handled automatically
- [ ] Toaster config: position, duration, richColors, closeButton
