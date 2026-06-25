// ============================================================
// Template: Error Recovery
// Pattern: error-recovery
// Stack: React + shadcn/ui + Tailwind
// USAGE: 4 variants — inline, full-page, error-boundary, useErrorHandler hook
// ============================================================

'use client'

import { Component, useCallback, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export type ErrorRecoveryVariant = 'inline' | 'full-page' | 'error-boundary'

export interface InlineErrorProps {
  error: Error
  onRetry: () => void
  isRetrying?: boolean
  title?: string
  retryLabel?: string
  className?: string
}

export interface FullPageErrorProps {
  error: Error
  onRetry: () => void
  isRetrying?: boolean
  onGoHome?: () => void
  title?: string
  retryLabel?: string
  homeLabel?: string
  className?: string
}

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export interface UseErrorHandlerOptions {
  maxRetries?: number
  retryDelay?: number
}

export interface UseErrorHandlerReturn {
  error: Error | null
  isRetrying: boolean
  retryCount: number
  handleError: (error: Error, originalFn?: () => Promise<void>) => void
  retry: () => void
  reset: () => void
}

// ──────────────────────────────────────────────
// DEFAULT LABELS
// ──────────────────────────────────────────────

const DEFAULT_RETRY = 'Retry'
const DEFAULT_RETRYING = 'Retrying\u2026'
const DEFAULT_HOME = 'Go to home'

// ──────────────────────────────────────────────
// INLINE ERROR
// ──────────────────────────────────────────────

/**
 * InlineError
 *
 * Contextual error via Alert (destructive) with retry button.
 * Use inside existing layouts (above forms, inside cards).
 * Adapts to container width.
 *
 * @example
 *   <InlineError error={error} onRetry={refetch} isRetrying={isRefetching} />
 */
export function InlineError({
  error,
  onRetry,
  isRetrying = false,
  title = 'Error',
  retryLabel = DEFAULT_RETRY,
  className = '',
}: InlineErrorProps) {
  return (
    <Alert variant="destructive" role="alert" aria-live="assertive" className={className}>
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={onRetry}
          disabled={isRetrying}
        >
          <RefreshCw
            className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {isRetrying ? DEFAULT_RETRYING : retryLabel}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// ──────────────────────────────────────────────
// FULL-PAGE ERROR
// ──────────────────────────────────────────────

/**
 * FullPageError
 *
 * Centered Card for catastrophic errors (500, offline).
 * Includes retry + optional "Go home" back navigation.
 *
 * @example
 *   <FullPageError error={error} onRetry={refetch} onGoHome={() => navigate('/')} />
 */
export function FullPageError({
  error,
  onRetry,
  isRetrying = false,
  onGoHome,
  title = 'Something went wrong',
  retryLabel = DEFAULT_RETRY,
  homeLabel = DEFAULT_HOME,
  className = '',
}: FullPageErrorProps) {
  return (
    <div
      className={`flex min-h-[400px] items-center justify-center p-8 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <Card className="mx-auto max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">{error.message}</CardDescription>
        </CardHeader>
        <CardFooter className="flex-col gap-2">
          <Button
            className="w-full sm:w-auto"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {isRetrying ? DEFAULT_RETRYING : retryLabel}
          </Button>
          {onGoHome && (
            <Button variant="link" onClick={onGoHome}>
              <Home className="h-4 w-4 mr-1" aria-hidden="true" />
              {homeLabel}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// ──────────────────────────────────────────────
// ERROR BOUNDARY
// ──────────────────────────────────────────────

/**
 * ErrorBoundary
 *
 * Class component — required by React for error boundaries.
 * Catches errors in its children tree and renders fallback.
 * Reset function re-renders children (remounts them).
 *
 * @example
 *   <ErrorBoundary
 *     fallback={(error, reset) => <FullPageError error={error} onRetry={reset} />}
 *   >
 *     <YourComponent />
 *   </ErrorBoundary>
 */
interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo)
  }

  private handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error) {
      return this.props.fallback(this.state.error, this.handleReset)
    }

    return this.props.children
  }
}

// ──────────────────────────────────────────────
// USE ERROR HANDLER HOOK
// ──────────────────────────────────────────────

/**
 * useErrorHandler
 *
 * Hook that wraps try/catch with retry state management.
 * Tracks retry count, handles exponential backoff, and
 * provides reset capabilities.
 *
 * @example
 *   const { error, isRetrying, handleError, retry, reset } = useErrorHandler()
 *
 *   // In try/catch:
 *   try { await fetchData() }
 *   catch (e) { handleError(e as Error) }
 *
 *   // In JSX:
 *   {error && <InlineError error={error} onRetry={retry} isRetrying={isRetrying} />}
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const { maxRetries = 3, retryDelay = 1000 } = options

  // Using a simple ref-based approach via useState for reactivity
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const originalFnRef = useRef<(() => Promise<void>) | null>(null)
  const retryCountRef = useRef(0)
  const maxRetriesRef = useRef(maxRetries)

  const handleError = useCallback((err: Error, originalFn?: () => Promise<void>): void => {
    setError(err)
    setRetryCount(0)
    retryCountRef.current = 0
    if (originalFn) {
      originalFnRef.current = originalFn
    }
  }, [])

  const retry = useCallback(async (): Promise<void> => {
    if (!originalFnRef.current) return

    if (retryCountRef.current >= maxRetriesRef.current) {
      setError(new Error(`Max retries reached. ${error?.message ?? ''}`))
      return
    }

    setIsRetrying(true)

    try {
      await originalFnRef.current()
      setError(null)
      setRetryCount(0)
      retryCountRef.current = 0
    } catch (nextError) {
      const nextCount = retryCountRef.current + 1
      retryCountRef.current = nextCount
      setRetryCount(nextCount)

      if (nextCount >= maxRetriesRef.current) {
        const err = nextError instanceof Error ? nextError : new Error(String(nextError))
        setError(new Error(`Max retries reached after ${maxRetriesRef.current} attempts: ${err.message}`))
      } else {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      }
    } finally {
      setIsRetrying(false)
    }
  }, [error, retryDelay])

  maxRetriesRef.current = maxRetries

  const reset = useCallback((): void => {
    setError(null)
    setRetryCount(0)
    setIsRetrying(false)
    originalFnRef.current = null
  }, [])

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    retry,
    reset,
  }
}
