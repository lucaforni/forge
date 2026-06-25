# Stack Decisions

> **Target**: React projects with shadcn/ui + Tailwind CSS
> **Status**: Approved · **Last updated**: 2026-06-24
> **Purpose**: Define the frontend stack, conventions, and code generation rules ONCE.
> **All patterns in this library ASSUME these decisions.**

---

## 1. Framework

| Decision | Choice | Rationale |
|-----------|--------|-------------|
| Framework | React 18+ (Next.js App Router / Vite + React Router) | shadcn/ui requires React |
| Routing | Next.js App Router (preferred) or React Router v6+ | Server Components, RSC, nested layouts |
| Rendering | SSR + Client Components where needed | Perf, SEO, progressive UX |
| TypeScript | Strict mode | `strict: true` in tsconfig — no exceptions |

**Rule**: `'use client'` only when hooks, events, or client-side state are needed.
Everything else is a Server Component by default.

---

## 2. Component Library

| Decision | Choice | Rationale |
|-----------|--------|-------------|
| Library | shadcn/ui (Radix primitives + Tailwind) | Built-in accessibility, native Tailwind, copy-customize |
| Version | Latest (Radix v1 + class-variance-authority) | Stable API, React 18 |
| Installation | `npx shadcn@latest init` (legacy: `shadcn-ui` still works but is deprecated) | Components copied into the project, not an external dependency |
| Customization | Direct modification of component files | shadcn/ui is a registry, not a library — modify in-place |

**Rule**: Do NOT create new components if an existing shadcn/ui component
can be extended with `variant` or `className`. When extending, use
`cva()` (class-variance-authority) for variants.

---

## 3. Styling

| Decision | Choice | Rationale |
|-----------|--------|-------------|
| Engine | Tailwind CSS v3+ | Utility-first, consistency via design tokens |
| Config | `tailwind.config.ts` with extends for custom colors | Design tokens → Tailwind classes |
| Variants | `class-variance-authority` (cva) | Native shadcn/ui pattern |
| Class merging | `tailwind-merge` (cn helper) | shadcn/ui standard |
| Animations | Tailwind `animate-` + CSS transitions | No external libraries for simple animations |
| Theme | CSS custom properties for dark/light mode | `next-themes` for React |

Standard helper:

```tsx
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Rule**: Never use arbitrary CSS strings. Every color, spacing, border-radius
must match a design token or a Tailwind class. No exceptions.

---

## 4. State Management

| State | Solution | Rationale |
|-------|-----------|-------------|
| Server state (API data) | TanStack React Query v5 | Caching, refetch, optimistic updates, SSR |
| Client state (UI) | `useState`/`useReducer` (default), Zustand (when global UI state is needed) | Zustand is recommended only for UI state shared across components not in the same hierarchy |
| URL state (filters, page) | useSearchParams (Next.js) or useSearchParams (React Router) | Shareable, bookmarkable |
| Form state | React Hook Form v7 | Performant, minimal re-renders |
| Form validation | Zod (shared schema client/server) | TypeScript-first, composable |
| File upload | React Dropzone + upload mutation | Established pattern |

**React Query pattern**:
```tsx
// Query
export function useItems(filters: Filters) {
  return useQuery({
    queryKey: ['items', filters],
    queryFn: () => api.getItems(filters),
    placeholderData: keepPreviousData, // smooth transition
  })
}

// Mutation
export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NewItem) => api.createItem(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })
}
```

---

## 5. Forms

| Rule | Detail |
|--------|-----------|
| Schema | Zod defined ONCE, shared client/server |
| Custom hook | `useZodForm` wrapper that unifies RHF + Zod |
| Error display | Per-field with shadcn/ui `<FormMessage>` |
| Submit | `handleSubmit` with Zod validation + mutation |
| Server error | Catch from mutation, map to field errors |
| Debounce | Validation onBlur (not onKeystroke for long forms) |
| Optimistic | useMutation onMutate for immediate updates |

---

## 6. Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx
│   └── (routes)/
├── components/             # UI components
│   ├── ui/                 # shadcn/ui components (generated)
│   └── features/           # Feature-specific components
├── lib/                    # Utility functions
│   ├── utils.ts            # cn helper
│   └── api.ts              # API client
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
├── queries/                # React Query hooks (useItems, useCreateItem...)
└── schemas/                # Zod schemas
```

**Rule**: Feature components in `components/features/[feature-name]/`.
React Query hooks in `queries/` following the pattern `use[ResourceName]`.

---

## 7. File Naming & Exports

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase.tsx | `OrderTable.tsx` |
| Hooks | camelCase with use | `useOrders.ts` |
| Schemas | camelCase | `orderSchema.ts` |
| Types | PascalCase | `Order.ts` (type) |
| Queries | camelCase with use | `useOrdersQuery.ts` |
| Pages | Next.js conventions | `page.tsx`, `layout.tsx` |

**Export rule**: Default export for page components (`page.tsx`).
Named export for everything else. Never mixed exports.

```tsx
// components/features/OrderTable.tsx
export function OrderTable({ ... }: OrderTableProps) { ... }

// app/orders/page.tsx  
export default function OrdersPage() { ... }
```

---

## 8. Data Fetching

| Rule | Detail |
|--------|-----------|
| Server fetch | Direct `fetch` in Server Components (RSC) |
| Client fetch | React Query (cache, dedup, retry) |
| API client | Single `apiClient` with base URL, auth header, error handling |
| Error handling | `apiClient` throws typed errors → React Query `onError` |
| Revalidation | `revalidatePath` / `revalidateTag` for Server Actions |

---

## 9. Accessibility Baseline

| Requirement | Standard |
|-----------|----------|
| Contrast | WCAG 2.1 AA (4.5:1 text, 3:1 large) |
| Keyboard | Everything reachable via Tab + Enter/Esc/Arrows |
| Screen reader | Correct aria-label, aria-describedby, role |
| Focus | Visible focus ring on all interactive elements |
| Heading | h1→h2→h3 hierarchy, no skips |
| Landmarks | `<nav>`, `<main>`, `<aside>` semantic tags |

shadcn/ui provides built-in accessibility via Radix. Do NOT remove ARIA attributes.

---

## 10. Testing Convention

| Layer | Tool | What to test |
|-------|------|-------------|
| Unit | Vitest | Pure functions, hooks, schemas |
| Component | React Testing Library | Rendering, interactions, states |
| Integration | MSW + RTL | Complete flows with mocked APIs |
| E2E | Playwright | Critical paths (deploy preview) |

**Test pattern**:
```tsx
// __tests__/OrdersTable.test.tsx
describe('OrdersTable', () => {
  it('shows skeleton while loading', () => { ... })
  it('shows orders when loaded', () => { ... })
  it('shows empty state when no orders', () => { ... })
  it('shows error with retry button', () => { ... })
  it('filters by status via URL params', () => { ... })
})
```

---

## 11. Responsive Breakpoints

| Name | Width | Layout |
|------|-----------|--------|
| Mobile | 320-767px | Single column, bottom nav |
| Tablet | 768-1023px | 2 columns, sidebar |
| Desktop | 1024-1439px | Full layout |
| Wide | 1440px+ | Full layout, max-width container |

Implementation: Default Tailwind breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`).
Container max-width: `max-w-7xl mx-auto`.

---

## 12. Icons

| Library | Usage |
|----------|-----|
| Lucide React | Primary icons (shadcn/ui default) |
| Inline SVG | Custom icons only if not present in Lucide |

```tsx
import { Search, Trash2 } from "lucide-react"
<Search className="h-4 w-4" />
```

---

## 13. Recommended Additional Packages

| Package | Purpose |
|-----------|-------|
| date-fns | Date formatting |
| zustand | Client state |
| sonner | Toast notifications |
| recharts | Charts (dashboard) |
| @hello-pangea/dnd | Drag & drop |
| next-themes | Dark/light mode |
| @tanstack/react-table | Data table logic — required for shadcn/ui Data Table example; not bundled |

---

## Appendix A: tsconfig.json Template

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Appendix B: tailwind.config.ts Template

> **See [design-system.md §1.3](design-system.md)** for the canonical Tailwind configuration with
> all tokens (primary, secondary, destructive, success, warning, muted, accent, border, input, ring).
> The template below is a minimal skeleton.

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Copy the entire colors block from design-system.md §1.3
        // (includes all semantic tokens: primary, secondary, destructive, success, warning, etc.)
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```
