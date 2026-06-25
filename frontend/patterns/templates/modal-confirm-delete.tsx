// ============================================================
// Template: Delete Confirm Dialog
// Pattern: modal-flow (AlertDialog variant)
// Stack: React + shadcn/ui AlertDialog + Lucide + sonner + React Query
// USAGE: Copiare e adattare itemName, mutation, queryKey
// ============================================================

'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, AlertCircle, Loader2 } from 'lucide-react'
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

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  onConfirm: () => void
  isPending?: boolean
  error?: string | null
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function DeleteConfirmDialog({
  itemName,
  onConfirm,
  open,
  onOpenChange,
  isPending = false,
  error = null,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            <AlertDialogTitle>
              Delete {itemName}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This action cannot be undone. The item will be permanently deleted
            from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>

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
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Confirm deletion'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ──────────────────────────────────────────────
// HOOK: Pre-configured mutation example
// ──────────────────────────────────────────────

interface UseDeleteItemOptions {
  itemName: string
  mutationFn: () => Promise<void>
  queryKey: string[]
  onOpenChange: (open: boolean) => void
  onError?: (error: Error) => void
}

export function useDeleteItem({
  itemName,
  mutationFn,
  queryKey,
  onOpenChange,
  onError,
}: UseDeleteItemOptions) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(`${itemName} deleted successfully`)
      queryClient.invalidateQueries({ queryKey })
      onOpenChange(false)
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message)
      onError?.(err)
    },
  })

  return {
    isPending: mutation.isPending,
    error,
    confirm: () => mutation.mutate(),
  }
}

// ──────────────────────────────────────────────
// COMPOSITE: Dialog + hook together
// ──────────────────────────────────────────────

interface DeleteConfirmDialogWithHookProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  mutationFn: () => Promise<void>
  queryKey: string[]
}

export function DeleteConfirmDialogWithHook({
  open,
  onOpenChange,
  itemName,
  mutationFn,
  queryKey,
}: DeleteConfirmDialogWithHookProps) {
  const { isPending, error, confirm } = useDeleteItem({
    itemName,
    mutationFn,
    queryKey,
    onOpenChange,
  })

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      itemName={itemName}
      onConfirm={confirm}
      isPending={isPending}
      error={error}
    />
  )
}
