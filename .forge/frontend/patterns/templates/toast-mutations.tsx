// ============================================================
// Template: Toast Mutations
// Pattern: notification
// Stack: sonner + @tanstack/react-query + lucide-react
// USAGE: Copiare e adattare hook, config, e composizioni
// ============================================================

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export interface ToastMutationOptions<TData, TError, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  successMessage?: string
  successDescription?: (data: TData) => string
  errorMessage?: string
  errorDescription?: (error: TError) => string
  invalidateQueries?: string[][]
  undoAction?: {
    label: string
    description?: string
    duration?: number
    onUndo: (data: TData, variables: TVariables) => void
  }
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
}

// ──────────────────────────────────────────────
// GENERIC HOOK: useToastMutation
// ──────────────────────────────────────────────

export function useToastMutation<TData, TError extends { message?: string }, TVariables>(
  options: ToastMutationOptions<TData, TError, TVariables>,
) {
  const queryClient = useQueryClient()
  const {
    mutationFn,
    successMessage = 'Operation completed',
    successDescription,
    errorMessage = 'Error',
    errorDescription,
    invalidateQueries,
    undoAction,
    onSuccess,
    onError,
  } = options

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      if (undoAction) {
        toast(undoAction.label, {
          description: undoAction.description,
          icon: <Undo2 className="h-4 w-4" />,
          action: {
            label: 'Undo',
            onClick: () => undoAction.onUndo(data, variables),
          },
          duration: undoAction.duration ?? 6000,
        })
      } else {
        toast.success(successMessage, {
          description: successDescription?.(data),
          icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
        })
      }

      if (invalidateQueries) {
        for (const key of invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: key })
        }
      }

      onSuccess?.(data)
    },
    onError: (error: TError) => {
      toast.error(errorMessage, {
        description: errorDescription?.(error) ?? error.message,
        icon: <XCircle className="h-4 w-4 text-destructive" />,
      })
      onError?.(error)
    },
  })
}

// ──────────────────────────────────────────────
// API TYPES (esempio)
// ──────────────────────────────────────────────

interface Item {
  id: string
  name: string
}

interface CreateItemPayload {
  name: string
  description?: string
}

interface ApiError {
  message: string
  status?: number
}

// ──────────────────────────────────────────────
// EXAMPLE: useCreateItemToast
// ──────────────────────────────────────────────

const API_BASE = '/api'

async function createItemApi(data: CreateItemPayload): Promise<Item> {
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw err
  }
  return res.json()
}

export function useCreateItemToast() {
  return useToastMutation<Item, ApiError, CreateItemPayload>({
    mutationFn: createItemApi,
    successMessage: 'Item created',
    successDescription: (data) => `"${data.name}" created successfully`,
    errorMessage: 'Creation error',
    errorDescription: (error) => error.message,
    invalidateQueries: [['items']],
  })
}

// ──────────────────────────────────────────────
// EXAMPLE: useDeleteItemToast (con undo)
// ──────────────────────────────────────────────

async function deleteItemApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw err
  }
}

export function useDeleteItemToast(onRestore: (id: string) => Promise<void>) {
  return useToastMutation<void, ApiError, string>({
    mutationFn: deleteItemApi,
    successMessage: 'Item deleted',
    invalidateQueries: [['items']],
    undoAction: {
      label: 'Item deleted',
      description: 'You can undo within 6 seconds',
      onUndo: (restoredId: void, variables: string) => onRestore(variables),
    },
  })
}

// ──────────────────────────────────────────────
// EXAMPLE: useUpdateItemToast
// ──────────────────────────────────────────────

interface UpdateItemPayload extends Partial<CreateItemPayload> {
  id: string
}

async function updateItemApi(data: UpdateItemPayload): Promise<Item> {
  const res = await fetch(`${API_BASE}/items/${data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw err
  }
  return res.json()
}

export function useUpdateItemToast() {
  return useToastMutation<Item, ApiError, UpdateItemPayload>({
    mutationFn: updateItemApi,
    successMessage: 'Item updated',
    successDescription: (data) => `"${data.name}" updated`,
    errorMessage: 'Update error',
    errorDescription: (error) => error.message,
    invalidateQueries: [['items'], ['item']],
  })
}

// ──────────────────────────────────────────────
// EXAMPLE: Sonner Toaster Config
// ──────────────────────────────────────────────

// Copiare in app/layout.tsx:
// <Toaster
//   richColors
//   closeButton
//   position={isMobile ? 'bottom-center' : 'top-right'}
//   toastOptions={{
//     duration: 4000,
//     className: 'text-sm',
//   }}
//   visibleToasts={5}
//   expand
// />

// ──────────────────────────────────────────────
// EXAMPLE: Toast Promise (operazioni lunghe)
// ──────────────────────────────────────────────

 // Uso diretto senza hook per operazioni singole:
// toast.promise(api.exportData(filters), {
//   loading: 'Exporting...',
//   success: (data) => `File "${data.filename}" ready for download`,
//   error: (err) => `Export error: ${err.message}`,
// })

// ──────────────────────────────────────────────
// EXAMPLE: Toast Informativo
// ──────────────────────────────────────────────

// toast.info('New update available', {
//   description: 'Version 2.1.0 is ready for installation',
//   icon: <Info className="h-4 w-4 text-primary" />,
//   duration: 8000,
//   action: {
//     label: 'Update',
//     onClick: () => router.refresh(),
//   },
// })
