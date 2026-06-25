// ============================================================
// Template: Create Order Form
// Pattern: form
// Stack: React Hook Form v7 + Zod + shadcn/ui Form + React Query
// USAGE: Copiare e adattare schema, campi, mutation
// ============================================================

'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ChevronsUpDown, Check, CalendarIcon, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────
// ZOD SCHEMA (condivisibile client/server)
// ──────────────────────────────────────────────

export const createOrderSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Maximum 100 characters'),
  email: z
    .string()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s+()-]{7,20}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
  categoryId: z.string().min(1, 'Select a category'),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().max(1000, 'Maximum 1000 characters').optional(),
  deliveryDate: z.date().optional(),
  sendNotification: z.boolean().default(false),
})

export type CreateOrderValues = z.infer<typeof createOrderSchema>

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export interface CreateOrderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface Category {
  id: string
  name: string
}

interface ApiFieldError {
  field: string
  message: string
}

interface ApiErrorResponse {
  message: string
  field?: string
  fields?: ApiFieldError[]
}

// ──────────────────────────────────────────────
// MOCK DATA (sostituire con API call)
// ──────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: '1', name: 'Elettronica' },
  { id: '2', name: 'Abbigliamento' },
  { id: '3', name: 'Alimentari' },
  { id: '4', name: 'Arredamento' },
  { id: '5', name: 'Sport' },
  { id: '6', name: 'Libri' },
  { id: '7', name: 'Giocattoli' },
  { id: '8', name: 'Other' },
]

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

// ──────────────────────────────────────────────
// API MOCK (sostituire con fetch reale)
// ──────────────────────────────────────────────

async function createOrderApi(data: CreateOrderValues): Promise<{ id: string }> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error: ApiErrorResponse = await res.json()
    throw error
  }
  return res.json()
}

// ──────────────────────────────────────────────
// SERVER ERROR MAPPER
// ──────────────────────────────────────────────

function mapServerErrors(
  error: ApiErrorResponse,
  form: ReturnType<typeof useForm<CreateOrderValues>>,
) {
  if (error.fields) {
    for (const f of error.fields) {
      form.setError(f.field as keyof CreateOrderValues, {
        message: f.message,
      })
    }
    form.setFocus(error.fields[0].field as keyof CreateOrderValues)
    return
  }
  if (error.field) {
    form.setError(error.field as keyof CreateOrderValues, {
      message: error.message,
    })
    form.setFocus(error.field as keyof CreateOrderValues)
    return
  }
  form.setError('root', { message: error.message })
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export function CreateOrderForm({ onSuccess, onCancel }: CreateOrderFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [categoryOpen, setCategoryOpen] = useState(false)

  // ── Form ──

  const form = useForm<CreateOrderValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: '',
      email: '',
      phone: '',
      status: 'pending',
      categoryId: '',
      priority: 'medium',
      notes: '',
      deliveryDate: undefined,
      sendNotification: false,
    },
    mode: 'onBlur',
  })

  const isDirty = form.formState.isDirty
  const serverError = form.formState.errors.root?.message
  const notesCount = form.watch('notes')?.length ?? 0

  // ── Mutation ──

  const createOrder = useMutation({
    mutationFn: createOrderApi,
    onSuccess: (data) => {
      toast.success('Order created successfully')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.setQueryData(['order', data.id], form.getValues())
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/orders')
      }
    },
    onError: (error: unknown) => {
      mapServerErrors(error as ApiErrorResponse, form)
      toast.error('Error creating order')
    },
  })

  // ── Submit ──

  function onSubmit(data: CreateOrderValues) {
    createOrder.mutate(data)
  }

  // ── Cancel ──

  function handleCancel() {
    if (isDirty) {
      const confirmed = window.confirm(
        'There are unsaved changes. Leave anyway?',
      )
      if (!confirmed) return
    }
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  // ── Render ──

  const isSubmitting = createOrder.isPending
  const today = useMemo(() => new Date(), [])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ── ROOT SERVER ERROR ── */}
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* ── SEZIONE: Cliente ── */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold mb-2">
              Customer information
            </legend>

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Customer name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Mario Rossi"
                      aria-required="true"
                      disabled={isSubmitting}
                      {...field}
                    />
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
                      <Input
                        type="email"
                        placeholder="mario@esempio.it"
                        disabled={isSubmitting}
                        {...field}
                      />
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
                      <Input
                        placeholder="+39 123 456 7890"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          {/* ── SEZIONE: Dettagli ordine ── */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold mb-2">
              Order details
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Category <span className="text-destructive">*</span>
                  </FormLabel>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={categoryOpen}
                          aria-required="true"
                          disabled={isSubmitting}
                          className={cn(
                            'w-full justify-between font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? CATEGORIES.find((c) => c.id === field.value)
                                ?.name
                            : 'Select category'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search category..." />
                        <CommandList>
                          <CommandEmpty>
                            No categories found
                          </CommandEmpty>
                          <CommandGroup>
                            {CATEGORIES.map((cat) => (
                              <CommandItem
                                key={cat.id}
                                value={cat.name}
                                onSelect={() => {
                              form.setValue('categoryId', cat.id, { shouldDirty: true, shouldValidate: true })
                              setCategoryOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === cat.id
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {cat.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the product category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected delivery date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          disabled={isSubmitting}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, 'dd/MM/yyyy')
                            : 'Select date'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < today}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Expected delivery date
                  </FormDescription>
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
                      className="min-h-[100px] resize-y"
                      disabled={isSubmitting}
                      maxLength={1000}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Additional notes</span>
                    <span
                      className={cn(
                        notesCount > 900 ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {notesCount}/1000
                    </span>
                  </FormDescription>
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
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Send notification to customer</FormLabel>
                    <FormDescription>
                      The customer will receive an email with order details
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </fieldset>

          {/* ── FOOTER ── */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isSubmitting ? 'Creating...' : 'Create order'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
