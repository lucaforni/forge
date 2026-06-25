# Design System

> **Target**: shadcn/ui + Tailwind CSS
> **Status**: Approved · **Last updated**: 2026-06-24
> **Every pattern references these tokens. Never invent a value outside this document.**

---

## 1. Colors

### 1.1 Base Palette

Defined as CSS custom properties on `:root` (light) and `.dark` (dark mode).

```css
:root {
  /* Neutrals (slate) — stored as HSL components for shadcn/ui Tailwind compatibility */
  --neutral-50:  210 40% 98%;
  --neutral-100: 210 40% 96%;
  --neutral-200: 210 40% 91%;
  --neutral-300: 210 40% 84%;
  --neutral-400: 210 40% 65%;
  --neutral-500: 210 40% 47%;
  --neutral-600: 210 40% 35%;
  --neutral-700: 210 40% 25%;
  --neutral-800: 210 40% 16%;
  --neutral-900: 210 40% 10%;
  --neutral-950: 210 40% 5%;

  /* Primary (blue) */
  --primary-50:  214 100% 97%;
  --primary-100: 214 95% 93%;
  --primary-200: 214 95% 87%;
  --primary-300: 214 95% 78%;
  --primary-400: 214 90% 68%;
  --primary-500: 217 91% 60%;
  --primary-600: 221 83% 53%;
  --primary-700: 221 80% 46%;
  --primary-800: 221 70% 40%;
  --primary-900: 221 65% 32%;
  --primary-950: 221 57% 21%;

  /* Success (emerald) */
  --success-50:  152 81% 96%;
  --success-100: 152 81% 90%;
  --success-200: 152 76% 80%;
  --success-300: 152 65% 68%;
  --success-400: 152 60% 52%;
  --success-500: 152 84% 39%;
  --success-600: 152 83% 30%;
  --success-700: 152 93% 24%;
  --success-800: 152 79% 20%;
  --success-900: 152 70% 16%;
  --success-950: 152 67% 9%;

  /* Warning (amber) */
  --warning-50:  48 100% 96%;
  --warning-100: 48 96% 89%;
  --warning-200: 48 98% 77%;
  --warning-300: 48 97% 65%;
  --warning-400: 48 96% 53%;
  --warning-500: 38 92% 50%;
  --warning-600: 33 96% 44%;
  --warning-700: 30 93% 37%;
  --warning-800: 30 83% 31%;
  --warning-900: 30 78% 27%;
  --warning-950: 30 80% 14%;

  /* Destructive / Error (red) */
  --destructive-50:  0 86% 97%;
  --destructive-100: 0 86% 93%;
  --destructive-200: 0 86% 87%;
  --destructive-300: 0 86% 80%;
  --destructive-400: 0 80% 71%;
  --destructive-500: 0 84% 60%;
  --destructive-600: 0 72% 51%;
  --destructive-700: 0 74% 42%;
  --destructive-800: 0 70% 35%;
  --destructive-900: 0 63% 31%;
  --destructive-950: 0 75% 15%;
}
```

### 1.2 Semantic Tokens (shadcn/ui compatible)

```css
:root {
  --background:         var(--neutral-50);
  --foreground:         var(--neutral-900);
  --card:               0 0% 100%;
  --card-foreground:    var(--neutral-900);
  --popover:            0 0% 100%;
  --popover-foreground: var(--neutral-900);

  --primary:             var(--primary-600);
  --primary-foreground:  0 0% 100%;
  --secondary:           var(--neutral-100);
  --secondary-foreground: var(--neutral-800);
  --muted:               var(--neutral-100);
  --muted-foreground:    var(--neutral-500);
  --accent:              var(--primary-50);
  --accent-foreground:   var(--primary-800);

  --destructive:           var(--destructive-500);
  --destructive-foreground: 0 0% 100%;
  --success:               var(--success-600);
  --success-foreground:    0 0% 100%;
  --warning:               var(--warning-500);
  --warning-foreground:    210 40% 5%;

  --border:            var(--neutral-200);
  --input:             var(--neutral-200);
  --ring:              var(--primary-400);
}

.dark {
  --background:         var(--neutral-950);
  --foreground:         var(--neutral-50);
  --card:               var(--neutral-900);
  --card-foreground:    var(--neutral-50);
  --popover:            var(--neutral-900);
  --popover-foreground: var(--neutral-50);

  --primary:             var(--primary-500);
  --primary-foreground:  0 0% 100%;
  --secondary:           var(--neutral-800);
  --secondary-foreground: var(--neutral-100);
  --muted:               var(--neutral-800);
  --muted-foreground:    var(--neutral-400);
  --accent:              var(--primary-950);
  --accent-foreground:   var(--primary-200);

  --destructive:           var(--destructive-600);
  --destructive-foreground: 0 0% 100%;
  --success:               var(--success-500);
  --success-foreground:    0 0% 100%;
  --warning:               var(--warning-400);
  --warning-foreground:    210 40% 5%;

  --border:            var(--neutral-800);
  --input:             var(--neutral-700);
  --ring:              var(--primary-400);
}
```

### 1.3 Tailwind Config

```ts
// tailwind.config.ts
colors: {
  border:        "hsl(var(--border))",
  input:         "hsl(var(--input))",
  ring:          "hsl(var(--ring))",
  background:    "hsl(var(--background))",
  foreground:    "hsl(var(--foreground))",
  primary: {
    DEFAULT:     "hsl(var(--primary))",
    foreground:  "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT:     "hsl(var(--secondary))",
    foreground:  "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT:     "hsl(var(--destructive))",
    foreground:  "hsl(var(--destructive-foreground))",
  },
  muted: {
    DEFAULT:     "hsl(var(--muted))",
    foreground:  "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT:     "hsl(var(--accent))",
    foreground:  "hsl(var(--accent-foreground))",
  },
  success: {
    DEFAULT:      "hsl(var(--success))",
    foreground:   "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT:      "hsl(var(--warning))",
    foreground:   "hsl(var(--warning-foreground))",
  },
}
```

### 1.4 Color Usage Map

| Token | Usage | Examples |
|-------|-----|--------|
| `background` | Page background | `<body>`, `<main>` |
| `foreground` | Primary text | `<p>`, `<h1>`, `<label>` |
| `card` | Card/sheet/dialog background | `<Card>`, `<Dialog>`, `<Sheet>` |
| `primary` | Primary CTAs, links | `<Button variant="primary">`, `<a>` |
| `secondary` | Secondary CTAs, tags | `<Button variant="secondary">` |
| `muted` | Subtle background, metadata | `<footer>`, `<small>`, placeholder |
| `destructive` | Dangerous actions, errors | `Delete`, error message |
| `success` | Positive states | "Completed" badge, success toast |
| `warning` | Attention | "Pending" badge, warning alert |
| `border` | Component borders | `<Card>`, `<Input>`, `<Separator>` |
| `input` | Input background, form borders | `<Input>`, `<Select>`, `<Textarea>` |
| `ring` | Focus ring | `focus-visible:ring-2` |

---

## 2. Typography

### 2.1 Font Family

```css
:root {
  --font-sans:  'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;
}
```

Tailwind: `font-sans`, `font-mono` configured by default.

### 2.2 Font Size Scale

| Token | Size | Line Height | Tailwind | Usage |
|-------|------|-------------|----------|-----|
| --text-xs | 0.75rem (12px) | 1rem (16px) | `text-xs` | Label, metadata, notes |
| --text-sm | 0.875rem (14px) | 1.25rem (20px) | `text-sm` | Secondary body, caption |
| --text-base | 1rem (16px) | 1.5rem (24px) | `text-base` | Primary body |
| --text-lg | 1.125rem (18px) | 1.75rem (28px) | `text-lg` | Intro, lead |
| --text-xl | 1.25rem (20px) | 1.75rem (28px) | `text-xl` | h4, subtitle |
| --text-2xl | 1.5rem (24px) | 2rem (32px) | `text-2xl` | h3 |
| --text-3xl | 1.875rem (30px) | 2.25rem (36px) | `text-3xl` | h2 |
| --text-4xl | 2.25rem (36px) | 2.5rem (40px) | `text-4xl` | h1 |

### 2.3 Font Weight

| Weight | Token | Tailwind | Usage |
|--------|-------|----------|-----|
| 400 | --font-normal | `font-normal` | Body text |
| 500 | --font-medium | `font-medium` | Label, button |
| 600 | --font-semibold | `font-semibold` | Subheading, strong |
| 700 | --font-bold | `font-bold` | Heading |

### 2.4 Heading Hierarchy

```css
h1 { font-size: var(--text-4xl); font-weight: 700; line-height: 2.5rem; }
h2 { font-size: var(--text-3xl); font-weight: 600; line-height: 2.25rem; }
h3 { font-size: var(--text-2xl); font-weight: 600; line-height: 2rem; }
h4 { font-size: var(--text-xl);  font-weight: 500; line-height: 1.75rem; }
```

---

## 3. Spacing Scale

Based on multiples of 4px. **Always** use these values, never arbitrary values.

| Token | px | rem | Tailwind | Usage |
|-------|----|-----|----------|-----|
| --space-0 | 0px | 0 | `p-0` | Reset |
| --space-1 | 4px | 0.25rem | `p-1` | Icon gap, badge padding |
| --space-2 | 8px | 0.5rem | `p-2` | Input padding, small gap |
| --space-3 | 12px | 0.75rem | `p-3` | Button padding |
| --space-4 | 16px | 1rem | `p-4` | Card padding, form gap |
| --space-5 | 20px | 1.25rem | `p-5` | Section spacing |
| --space-6 | 24px | 1.5rem | `p-6` | Large card padding |
| --space-8 | 32px | 2rem | `p-8` | Page section margin |
| --space-10 | 40px | 2.5rem | `p-10` | Page padding |
| --space-12 | 48px | 3rem | `p-12` | Large sections |
| --space-16 | 64px | 4rem | `p-16` | Hero sections |
| --space-20 | 80px | 5rem | `p-20` | Max page padding |

**Golden spacing rules**:
- Vertical stack between related elements: `--space-4` (16px)
- Vertical stack between sections: `--space-8` (32px)
- Internal card padding: `--space-6` (24px)
- Gap between label and input: `--space-2` (8px)
- Gap between buttons: `--space-3` (12px)

---

## 4. Border Radius

| Token | Value | Tailwind | Usage |
|-------|--------|----------|-----|
| --radius-sm | 6px | `rounded-sm` | Input, Select, small Button |
| --radius-md | 8px | `rounded-md` | Card, Dialog, default Button |
| --radius-lg | 12px | `rounded-lg` | Sheet, Drawer, large Modal |
| --radius-xl | 16px | `rounded-xl` | Hero card, profile image |
| --radius-full | 9999px | `rounded-full` | Badge, Avatar, Pill |

---

## 5. Shadows

| Token | Value | Tailwind | Usage |
|-------|--------|----------|-----|
| --shadow-sm | 0 1px 2px 0 rgb(0 0 0 / 0.05) | `shadow-sm` | Subtle card, input focus |
| --shadow-md | 0 4px 6px -1px rgb(0 0 0 / 0.1) | `shadow-md` | Card, DropdownMenu |
| --shadow-lg | 0 10px 15px -3px rgb(0 0 0 / 0.1) | `shadow-lg` | Dialog, Sheet, Drawer |
| --shadow-xl | 0 20px 25px -5px rgb(0 0 0 / 0.1) | `shadow-xl` | Modal, Toast |

Dark mode: shadows must be more subtle (opacity reduced by 50%).

```css
.dark {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.5);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.5);
}
```

---

## 6. Layout & Container

| Token | Value | Usage |
|-------|--------|-----|
| --container-sm | 640px | Form, wizard |
| --container-md | 768px | Article, detail page |
| --container-lg | 1024px | Content page |
| --container-xl | 1280px | Dashboard, table |
| --container-2xl | 1536px | Full width, max |
| --sidebar-width | 280px | Sidebar navigation |
| --header-height | 64px | Header/Navbar |

---

## 7. Z-Index Scale

| Token | Value | Usage |
|-------|--------|-----|
| --z-dropdown | 50 | DropdownMenu, Popover |
| --z-sticky | 100 | Sticky header, sidebar |
| --z-drawer | 200 | Sheet, Drawer |
| --z-modal | 300 | Dialog, Modal |
| --z-toast | 400 | Toast/Sonner |
| --z-tooltip | 500 | Tooltip |

---

## 8. Transition & Animation

```css
:root {
  --duration-fast:   150ms;
  --duration-normal: 200ms;
  --duration-slow:   300ms;
  --easing-default:  cubic-bezier(0.4, 0, 0.2, 1);
  --easing-enter:    cubic-bezier(0.16, 1, 0.3, 1);
  --easing-exit:     cubic-bezier(0.4, 0, 1, 1);
}

/* Usage pattern */
.component {
  transition: all var(--duration-normal) var(--easing-default);
}
```

---

## 9. Icons

| Rule | Detail |
|--------|-----------|
| Default size | 16px (h-4 w-4) for inline icons |
| Icon size in button | 16px, with 8px gap from text |
| Standalone icon size | 20px (h-5 w-5) or 24px (h-6 w-6) |
| Color | `currentColor` (inherits from surrounding text) |

---

## 10. Golden Rules

1. **Never hardcode colors.** Every color references a semantic token or palette.
2. **Never use arbitrary spacing.** Every distance uses `--space-N`.
3. **Never invent border-radius.** Use `--radius-sm/md/lg/xl/full`.
4. **Never use font-size outside the scale.** Use `--text-*`.
5. **Never use custom shadows.** Use `--shadow-*`.
6. **Always support dark mode.** Every theme has `:root` + `.dark` equivalents.
7. **Consistency over creativity.** A predictable design beats a "creative" but inconsistent one.

---

## 11. shadcn/ui Component Inventory

> Reference: https://ui.shadcn.com/docs/components
> All components assume `'use client'` where needed (Radix requires client-side).
> Default variants: see table. Custom variants: use `cva()`.

### 11.1 Navigation & Layout

| Component | Radix Primitive | Variants | Primary Usage | When NOT to use |
|------------|----------------|----------|----------------|------------------|
| Breadcrumb | — | — | Hierarchical navigation | Main menu |
| NavigationMenu | Root/List/Item | — | Header menu | Breadcrumb |
| ScrollArea | — | — | Custom scroll | Normal overflow |
| Separator | — | — | Divider between sections | Padding (use spacing) |
| Sheet | Dialog | side: top/right/bottom/left | Side panel | Dialog for simple actions |
| Sidebar (shadcn) | — | — | App navigation (pro) | Single page app |
| Tabs | Tabs | — | Content sections | NavigationMenu |

### 11.2 Data Display

| Component | Radix Primitive | Variants | Primary Usage | When NOT to use |
|------------|----------------|----------|----------------|------------------|
| Avatar | — | size: sm/md/lg | Profile photo | Icons (use Icon) |
| Badge | — | variant: default/secondary/destructive/outline | Status, tag, count | Form label |
| Card | — | — | Content container | Page container |
| Table | — | — | Tabular data | Simple list (use Card) |
| Tooltip | Tooltip | — | Supplementary info | Critical content |

### 11.3 Forms & Input

| Component | Radix Primitive | Variants | Primary Usage | When NOT to use |
|------------|----------------|----------|----------------|------------------|
| Button | — | variant: default/secondary/destructive/ghost/outline/link; size: default/sm/lg/icon | Actions | Links (use Link) |
| Checkbox | Checkbox | — | Binary choice | Switch (for toggle) |
| Form | — | — | Form wrapper with validation | Simple form without validation |
| Input | — | — | Single line text | Long text (use Textarea) |
| Label | — | — | Label for input | Placeholder as label (🚫 never) |
| RadioGroup | RadioGroup | — | Single choice among options | Checkbox (multi) |
| Select | Select | — | Choice from closed list | List > 20 items (use Command) |
| Switch | Switch | — | Toggle on/off | Checkbox (in forms) |
| Textarea | — | — | Multi-line text | Single line input |
| InputOTP | — | — | OTP code | Normal input |

### 11.4 Feedback

| Component | Radix Primitive | Variants | Primary Usage | When NOT to use |
|------------|----------------|----------|----------------|------------------|
| Alert | — | variant: default/destructive/warning | Important contextual messages | Toast for temporary notifications |
| Dialog | Dialog | — | Modal for actions | Sheet for side content |
| Popover | Popover | — | Hover/click content | Tooltip for short texts |
| Skeleton | — | — | Loading placeholder | Spinner (only for punctual actions) |
| Sonner | — | — | Toast notifications | Alert for persistent messages |
| Progress | Progress | — | Progress bar | Skeleton for indeterminate |

### 11.5 Data Entry (Advanced)

| Component | Radix Primitive | Variants | Primary Usage | When NOT to use |
|------------|----------------|----------|----------------|------------------|
| Calendar | — | — | Single date picker | Date range (use DatePicker) |
| Command | Command | — | Autocomplete, Cmd+K palette | Simple Select |
| Combobox | Popover + Command | — | Search + Select (see pattern) | Select < 10 items |
| DatePicker | Popover + Calendar | — | Single date selection | Native input type="date" |
| Slider | Slider | — | Numeric value on range | Input number |

### 11.6 Overlay

| Component | Radix Primitive | Variants | Primary Usage | When NOT to use |
|------------|----------------|----------|----------------|------------------|
| AlertDialog | AlertDialog | — | Confirm destructive action | Dialog for forms |
| Dialog | Dialog | — | Generic modal | Sheet for side content |
| Drawer | Dialog (VAul) | — | Mobile-friendly sheet | Dialog on desktop |
| HoverCard | HoverCard | — | Preview on hover | Tooltip for short text |
| Popover | Popover | — | Contextual menus/actions | Dialog for complex actions |
| Tooltip | Tooltip | — | Short text on hover | Long informational content |

### 11.7 Other

| Component | Variants | Usage | Notes |
|------------|----------|-----|------|
| Accordion | — | Expand/collapse sections | Do not use for navigation |
| DropdownMenu | — | Action menu | Does not replace Select |
| Menubar | — | Classic desktop menu | Not on mobile |
| Pagination | — | Page navigation | Use with Data Table pattern |
| Resizable | — | Resizable panels | Power user dashboard |
| Toggle | variant: default/outline | Active/inactive state button | Not for binary toggle (use Switch) |

### 11.8 Component Composition Rules

1. **Button + Icon**: `<Button><Icon className="h-4 w-4" />{label}</Button>` — never icon without label (except variant="icon").
2. **Form + Input**: shadcn/ui `<FormField>` + `<FormItem>` + `<FormLabel>` + `<FormControl>` + `<FormMessage>`. Never input without label.
3. **Dialog + Form**: `<DialogContent>` contains `<Form>`. Do not nest `<Form>` outside `<Dialog>`.
4. **Table + DropdownMenu**: Row actions inside `<DropdownMenu>`. No more than 3 inline actions.
5. **Card + Badge**: Badge inside Card header for states. No overlapping badges.
6. **Command + Dialog**: For global Cmd+K. Command + Popover for local autocomplete.
