# Pattern: Error Recovery

**Severity**: Interaction (cross-cutting) · **Stack**: shadcn/ui + Tailwind
**Depends on**: Alert, Button, Card, Separator, Sonner
**Applies to**: ALL patterns that perform async operations or may fail

---

## 1. When to Use

**Use this pattern** in response to:
- API errors (4xx, 5xx)
- Network failures (offline, timeout, DNS)
- Permission denied / authorization errors
- Server validation errors
- React Error Boundary catches (unhandled exceptions)

**Variants**:
- **inline**: Contextual error in existing flow (e.g. above/below a form, inside a card). Does not break layout.
- **full-page**: Catastrophic error (e.g. global 500, absolute offline). Centered, with emergency navigation.
- **toast**: Non-blocking error with limited duration. Via Sonner (see Notification pattern).
- **error-boundary**: Component wrapper that catches errors in children with fallback UI.

**Do NOT use**:
- During loading → Skeleton pattern
- Empty data state → Empty State pattern
- Field-by-field errors → inline error in Form pattern
- Silent operations (e.g. failed background refresh, invisible automatic retry)
- console.log / sentry only error without user feedback

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Alert | Inline error container | `variant: destructive` |
| AlertTitle | Error title | — |
| AlertDescription | Description or details | — |
| Button | Retry / Escalate / Home | variant: default, outline, link |
| Card | Full-page error container | default |
| CardHeader | Icon area | — |
| CardTitle | Full-page error title | — |
| CardDescription | Full-page error details | — |
| CardFooter | Full-page error actions | — |
| Separator | Divider for collapsible details | — |
| Sonner | Toast error notifications | `toast.error()` |

Lucide icons: `AlertTriangle`, `RefreshCw`, `Home`, `ExternalLink`

---

## 3. JSX Structure

### 3.1 Inline Error

```tsx
<Alert variant="destructive" role="alert">
  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
  <AlertTitle>{title}</AlertTitle>
  <AlertDescription>
    <p>{description}</p>
    <Button
      variant="outline"
      size="sm"
      className="mt-2"
      onClick={onRetry}
      disabled={isRetrying}
    >
      <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
      {isRetrying ? 'Retrying...' : 'Try again'}
    </Button>
  </AlertDescription>
</Alert>
```

### 3.2 Full-Page Error

```tsx
<div className="flex min-h-[400px] items-center justify-center p-8">
  <Card className="mx-auto max-w-md w-full text-center">
    <CardHeader>
      <div className="mx-auto mb-2 rounded-full bg-destructive/10 p-4 w-fit">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription className="text-base">{description}</CardDescription>
    </CardHeader>
    <CardFooter className="flex-col gap-2">
      <Button className="w-full sm:w-auto" onClick={onRetry} disabled={isRetrying}>
        <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Retrying...' : 'Try again'}
      </Button>
      <Button variant="link" onClick={onGoHome}>
        <Home className="h-4 w-4 mr-1" />
        Back to home
      </Button>
    </CardFooter>
  </Card>
</div>
```

### 3.3 Toast Error

```tsx
import { toast } from 'sonner'

// In a handler:
toast.error('Operation failed', {
  description: error.message,
  action: {
    label: 'Try again',
    onClick: () => retry(),
  },
  duration: 5000,
})
```

### 3.4 Error Boundary

```tsx
<ErrorBoundary
  fallback={(error, reset) => (
    <FullPageError
      title="Something went wrong"
      description={error.message}
      onRetry={reset}
    />
  )}
  onError={(error, info) => {
    console.error('Caught by boundary:', error, info)
  }}
>
  <YourComponent />
</ErrorBoundary>
```

---

## 4. State Machine

```yaml
Pattern: ErrorRecovery
Initial: idle

States:
  idle:
    description: "No error — normal operation"
    ui: "Normal host pattern content"
    transitions:
      on_error_caught → error

  error:
    description: "Error detected — user feedback shown"
    ui: "Current variant (inline / full-page / toast / boundary)"
    transitions:
      on_retry_click → retrying
      on_escalate → escalated

  retrying:
    description: "New attempt in progress"
    ui: "Same variant, button disabled + spinner"
    transitions:
      on_success → recovered
      on_error_again → retry-failed (after N attempts) or → error (count attempts)

  recovered:
    description: "Operation succeeded on retry"
    ui: "Idle — normal content, optional success toast"
    transitions:
      on_new_operation → idle

  retry-failed:
    description: "Retries exhausted (N=3) without success"
    ui: "Message 'Try again later' + CTA Escalate"
    transitions:
      on_escalate → escalated

  escalated:
    description: "Redirect to support / page refresh"
    ui: "Redirect message or help desk opening"
    transitions: ~
```

---

## 5. Data Flow

```
┌──────────────┐     error      ┌──────────┐     retry()     ┌──────────┐
│  React Query  │ ─────────────→ │  Error   │ ─────────────→  │ Retrying │
│  try/catch    │                │ Recovery │                  │          │
│  ErrorBoundary│                │   Hook   │                  │          │
└──────────────┘                └──────────┘                  └──────────┘
                                       │                           │
                                       │                           │
                              ┌────────▼────────┐        ┌────────▼────────┐
                              │  Error Display   │        │  Success → Idle │
                              │  (Alert / Card   │        │  New fetch      │
                              │   / Toast / FB)  │        └─────────────────┘
                              └─────────────────┘
                                       │
                                       │ onEscalate()
                                       ▼
                              ┌─────────────────┐
                              │  Navigate to     │
                              │  /support or     │
                              │  /help           │
                              └─────────────────┘
```

- Error caught: try/catch, React Query `onError`, Error Boundary `componentDidCatch`
- `onRetry`: calls the original function that failed
- `onEscalate`: navigates to a support page or opens mailto/live chat
- Maximum automatic retries is 3

---

## 6. TypeScript Types

```tsx
export type ErrorRecoveryVariant = 'inline' | 'full-page' | 'toast' | 'error-boundary'

export interface ErrorRecoveryProps {
  error: Error
  onRetry: () => void
  variant: ErrorRecoveryVariant
  /** Custom label for retry (default: "Try again") */
  retryLabel?: string
  /** Callback for "escalate / contact support" */
  onEscalate?: () => void
  /** Whether we are retrying */
  isRetrying?: boolean
  /** Number of failed attempts (shown if > 0) */
  retryCount?: number
  /** Custom title (default: "Error") */
  title?: string
  /** Additional classes */
  className?: string
}

export interface ErrorBoundaryProps {
  children: React.ReactNode
  /** Function that renders the fallback UI. Receives error + reset function */
  fallback: (error: Error, reset: () => void) => React.ReactNode
  /** Callback called when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export interface UseErrorHandlerOptions {
  /** Max retry count (default: 3) */
  maxRetries?: number
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number
}

export interface UseErrorHandlerReturn {
  error: Error | null
  isRetrying: boolean
  retryCount: number
  handleError: (error: Error) => void
  retry: () => void
  reset: () => void
  escalate: () => void
}
```

---

## 7. Accessibility

### ARIA
- Error container: `role="alert"` — immediate announcement to screen reader
- Error container: `aria-live="assertive"` — interrupts ongoing announcements
- Decorative icon: `aria-hidden="true"`
- shadcn/ui Alert with `variant: destructive` already has semantic color + icon (not only color)

### Screen Reader Flow
```
"Inline: [Title]. [Description]. Button: Try again."
"Full-page: [Title]. [Description]. Button: Try again. Link: Back to home."
```

### Focus Management
- When error appears, focus MOVES to the error container (via `autoFocus` on container or `ref` + `.focus()`)
- If inline error in a form, focus on the first error field (see Form pattern)
- After successful retry, focus returns to the content that generated the error
- Error Boundary: focus goes to fallback UI

### Technical Details
- Error details (stack trace, status code) collapsible NEVER hidden
- `<details>` or Accordion for debug info
- Do not expose sensitive details (tokens, passwords, SQL) in the user message

---

## 8. Responsive

| Breakpoint | Inline Error | Full-Page Error | Toast | Error Boundary |
|------------|-------------|----------------|-------|---------------|
| ≥ 1024px | Alert adapts to container width | Card centered max-w-md | Toast standard position bottom-right | Full-page fallback |
| 768-1023px | Full-width in container | Card full-width mx-4 | Toast always visible | Full-page with reduced padding |
| < 768px | Full-width, button full-width | Card full-width mx-2, vertical button stack | Toast full-width bottom | Full-page, reduced title |

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Inline error: Alert + icon + title + description + retry button
- [ ] Full-page error: Centered Card + circle icon + title + description + retry + "Back to home"
- [ ] Toast error: via Sonner with retry action + 5s duration
- [ ] Error Boundary: class component with componentDidCatch + fallback render
- [ ] Retry button disabled with spinner during retry
- [ ] Maximum 3 retry attempts, then show "Try again later" + Escalate
- [ ] Technical details collapsible (not hidden) via `<details>` or Accordion
- [ ] Focus goes to error container when error appears
- [ ] Focus returns to original content after successful retry
- [ ] No sensitive data shown in message (stack trace filtered)
- [ ] Inline error does not break surrounding layout (adapts to container)
- [ ] Full-page error is vertically centered at least 400px
- [ ] useErrorHandler hook: handles error/retryCount/isRetrying/reset
- [ ] Recovered state: error disappears, idle content reappears
- [ ] No conflict with other patterns (Empty State, Skeleton)

### States Verified
- [ ] idle: no error, normal content
- [ ] error: error shown with appropriate feedback
- [ ] retrying: button disabled + spinner, attempt in progress
- [ ] recovered: error removed, content restored
- [ ] retry-failed: after 3 attempts, "Try again later" + Escalate
- [ ] escalated: navigation to support executed

### Accessibility Pattern-Specific
- [ ] Error container: `role="alert"` + `aria-live="assertive"`
- [ ] Decorative icon: `aria-hidden="true"`
- [ ] Retry button clear label ("Try again") — not just icon
- [ ] Technical details collapsible NEVER hidden (use `<details>` for accessible toggle)
- [ ] Color not the only information carrier: icon + text + border (Alert destructive)

### Data Flow
- [ ] Error caught by: React Query onError, try/catch, Error Boundary
- [ ] Retry calls the original function — not a new fetch
- [ ] Escalate navigates to /support or external
- [ ] Retry attempts counted: max 3
- [ ] useErrorHandler can be used standalone (not tied to React Query)
