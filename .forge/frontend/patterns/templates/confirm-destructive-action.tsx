// ============================================================
// Template: Confirm Destructive Action (3 variants)
// Pattern: confirmation
// Stack: React + shadcn/ui AlertDialog + Lucide + sonner + React Query
// USAGE: Copiare e adattare onConfirm, queryKey, mutationFn
// ============================================================

'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, AlertCircle, Loader2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface ConfirmationBaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onConfirm: () => void
  isPending?: boolean
  error?: string | null
}

// ── Variant 1: Type-to-Confirm ──

interface TypeToConfirmDialogProps extends ConfirmationBaseProps {
  confirmWord?: string
  pendingLabel?: string
}

// ── Variant 2: Countdown ──

interface CountdownConfirmDialogProps extends ConfirmationBaseProps {
  duration?: number
  pendingLabel?: string
}

// ── Variant 3: Undoable Action ──

interface UseUndoMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  undoMutationFn: (variables: TVariables) => Promise<unknown>
  queryKey: string[]
  successMessage: string
}

// ──────────────────────────────────────────────
// VARIANT 1: Type-to-Confirm Dialog
// ──────────────────────────────────────────────

export function TypeToConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  onConfirm,
  isPending = false,
  error = null,
  confirmWord = 'CONFIRM',
  pendingLabel = 'Processing',
}: TypeToConfirmDialogProps) {
  const [typedText, setTypedText] = useState('')
  const isReady = typedText === confirmWord

  useEffect(() => {
    if (!open) {
      setTypedText('')
    }
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            Type <strong>{confirmWord}</strong> to proceed
          </p>
          <Input
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder={confirmWord}
            disabled={isPending}
            autoComplete="off"
            aria-label={`Type ${confirmWord} to proceed`}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!isReady || isPending}
            onClick={onConfirm}
            aria-label={isPending ? pendingLabel : 'Confirm'}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {pendingLabel}
              </>
            ) : 'Confirm'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ──────────────────────────────────────────────
// VARIANT 2: Countdown Confirm Dialog
// ──────────────────────────────────────────────

export function CountdownConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action will be executed in a few seconds.',
  onConfirm,
  isPending = false,
  error = null,
  duration = 10,
  pendingLabel = 'Processing',
}: CountdownConfirmDialogProps) {
  const [countdown, setCountdown] = useState(duration)

  useEffect(() => {
    if (!open) {
      setCountdown(duration)
      return
    }
    setCountdown(duration)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [open, duration])

  const isReady = countdown === 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center justify-center py-4">
          <div
            className="text-4xl font-bold tabular-nums text-destructive"
            role="timer"
            aria-live="polite"
            aria-label={`Confirm available in ${countdown} seconds`}
          >
            {countdown}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!isReady || isPending}
            onClick={onConfirm}
            aria-label={isPending ? pendingLabel : 'Confirm'}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {pendingLabel}
              </>
            ) : 'Confirm'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ──────────────────────────────────────────────
// VARIANT 3: Undoable Action Hook
// ──────────────────────────────────────────────

export function useUndoMutation<TData, TVariables = void>(
  opts: UseUndoMutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: opts.mutationFn,
    onSuccess: (_data, variables) => {
      toast(opts.successMessage, {
        description: 'You can undo within 5 seconds',
        action: {
          label: 'Undo',
          onClick: () => {
            opts.undoMutationFn(variables)
            toast.success('Action undone')
            queryClient.invalidateQueries({ queryKey: opts.queryKey })
          },
        },
        duration: 5000,
      })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

// ──────────────────────────────────────────────
// VARIANT 3 (cont.): Undoable Action Button
// ──────────────────────────────────────────────

interface UndoableActionButtonProps {
  label: string
  variant?: 'default' | 'destructive' | 'outline'
  onAction: () => Promise<void>
  onUndo: () => Promise<void>
  successMessage?: string
  queryKey: string[]
}

export function UndoableActionButton({
  label,
  variant = 'default',
  onAction,
  onUndo,
  successMessage = 'Operation completed',
  queryKey,
}: UndoableActionButtonProps) {
  const queryClient = useQueryClient()

  const mutation = useUndoMutation({
    mutationFn: onAction,
    undoMutationFn: onUndo,
    queryKey,
    successMessage,
  })

  return (
    <Button
      variant={variant}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Undo2 className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  )
}
