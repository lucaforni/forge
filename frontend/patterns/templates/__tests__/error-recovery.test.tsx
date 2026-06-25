import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'

import {
  InlineError,
  FullPageError,
  ErrorBoundary,
  useErrorHandler,
} from '../error-recovery'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('InlineError', () => {
  it('shows error message and retry button', () => {
    const onRetry = vi.fn()
    const error = new Error('Connessione fallita')

    render(<InlineError error={error} onRetry={onRetry} />)

    expect(screen.getByText('Errore')).toBeInTheDocument()
    expect(screen.getByText('Connessione fallita')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Riprova' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('calls onRetry when clicking retry button', () => {
    const onRetry = vi.fn()

    render(<InlineError error={new Error('Errore')} onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: 'Riprova' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('FullPageError', () => {
  it('shows error with link to home', () => {
    const onRetry = vi.fn()
    const onGoHome = vi.fn()

    render(
      <FullPageError
        error={new Error('Errore interno server')}
        onRetry={onRetry}
        onGoHome={onGoHome}
      />,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Errore interno server')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Riprova' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Torna alla home' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

describe('ErrorBoundary', () => {
  function ThrowError({ message }: { message: string }) {
    throw new Error(message)
  }

  it('catches errors and shows fallback', () => {
    const fallback = vi.fn((error: Error, _reset: () => void) => (
      <div>{error.message}</div>
    ))

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError message="Errore critico" />
      </ErrorBoundary>,
    )

    expect(fallback).toHaveBeenCalledTimes(1)
    expect(fallback).toHaveBeenCalledWith(expect.any(Error), expect.any(Function))
    expect(screen.getByText('Errore critico')).toBeInTheDocument()
  })

  it('reset function works and restores children', () => {
    function Child({ shouldThrow }: { shouldThrow: boolean }) {
      if (shouldThrow) throw new Error('Fallito')
      return <div>Contenuto ripristinato</div>
    }

    const { rerender } = render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <p>{error.message}</p>
            <button onClick={reset}>Riprova</button>
          </div>
        )}
      >
        <Child shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Fallito')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Riprova' }))

    rerender(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <p>{error.message}</p>
            <button onClick={reset}>Riprova</button>
          </div>
        )}
      >
        <Child shouldThrow={false} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Contenuto ripristinato')).toBeInTheDocument()
  })
})

describe('useErrorHandler', () => {
  it('retries with retry after failure', async () => {
    const mockFn = vi.fn().mockRejectedValueOnce(new Error('API error'))

    function TestComponent() {
      const { error, isRetrying, handleError, retry } = useErrorHandler({
        maxRetries: 2,
        retryDelay: 50,
      })

      return (
        <div>
          {error && <div data-testid="error">{error.message}</div>}
          <div data-testid="retrying">{isRetrying ? 'true' : 'false'}</div>
          <button
            data-testid="handle"
            onClick={() => handleError(new Error('API error'), mockFn)}
          >
            Handle
          </button>
          <button data-testid="retry" onClick={retry}>
            Retry
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    fireEvent.click(screen.getByTestId('handle'))
    expect(screen.getByTestId('error')).toHaveTextContent('API error')

    await act(async () => {
      fireEvent.click(screen.getByTestId('retry'))
    })

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  it('after max retries shows fail message', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('API error'))

    function TestComponent() {
      const { error, isRetrying, handleError, retry } = useErrorHandler({
        maxRetries: 3,
        retryDelay: 10,
      })

      return (
        <div>
          {error && <div data-testid="error">{error.message}</div>}
          <button
            data-testid="handle"
            onClick={() => handleError(new Error('API error'), mockFn)}
          >
            Handle
          </button>
          <button data-testid="retry" onClick={retry}>
            Retry
          </button>
        </div>
      )
    }

    render(<TestComponent />)
    fireEvent.click(screen.getByTestId('handle'))

    await act(async () => {
      fireEvent.click(screen.getByTestId('retry'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('retry'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('retry'))
    })

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(3)
    })
  })

  it('clears error on successful retry', async () => {
    const mockFn = vi.fn().mockRejectedValueOnce(new Error('API error'))

    function TestComponent() {
      const { error, isRetrying, handleError, retry } = useErrorHandler({
        maxRetries: 3,
        retryDelay: 10,
      })

      return (
        <div>
          {error && <div data-testid="error">{error.message}</div>}
          <button
            data-testid="handle"
            onClick={() => handleError(new Error('API error'), mockFn)}
          >
            Handle
          </button>
          <button data-testid="retry" onClick={retry}>
            Retry
          </button>
        </div>
      )
    }

    render(<TestComponent />)
    fireEvent.click(screen.getByTestId('handle'))

    expect(screen.getByTestId('error')).toHaveTextContent('API error')

    mockFn.mockResolvedValueOnce(undefined)

    await act(async () => {
      fireEvent.click(screen.getByTestId('retry'))
    })

    await waitFor(() => {
      expect(screen.queryByTestId('error')).toBeNull()
    })
  })
})
