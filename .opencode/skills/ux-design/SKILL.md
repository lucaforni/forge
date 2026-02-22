---
name: ux-design
description: Structured UX/UI design methodology for FORGE workflows — personas, user journeys, wireframes, component specs, design tokens, and accessibility standards
license: MIT
compatibility: opencode
metadata:
  audience: forge-ux
  workflow: forge
---

## Purpose

You are now operating under the FORGE UX design protocol. This skill provides
the structured methodology, conventions, and checklists for producing
complete, traceable UX/UI design artifacts in Markdown format.

## The UX Design Process

Execute design in this order. Each step produces an artifact that feeds the next.

### Step 1: Persona Definition

Define 2-3 personas per feature. Each persona must include:

```
### Persona: [Name]
Role: [Job title or user type]
Goal: [Primary goal when using this feature]
Pain points: [Top 2-3 frustrations with current solution]
Tech literacy: [Low / Medium / High]
Device preference: [Desktop / Mobile / Both]
Accessibility needs: [None / Screen reader / Motor / Visual]
Quote: "[A sentence that captures their perspective]"
```

**Rules:**
- Base personas on the user stories in the spec. Do NOT invent demographics
  unrelated to the feature.
- At least one persona should represent a lower-tech-literacy user.
- If accessibility needs are present, they drive WCAG requirements.

### Step 2: User Journey Mapping

For each persona, map their journey through the feature:

```
### Journey: [Persona Name] — [Journey Name]
Trigger: [What makes them start this journey]

Steps:
  1. [Action] → [Outcome/feedback]
  2. [Action] → [Outcome/feedback]
  3. ...

Outcome: [What success looks like]

Emotional Map:
  Step 1: 😐 Neutral — [why]
  Step 2: 😤 Frustrated — [why]
  Step 3: 😊 Relieved — [why]
  Outcome: 🎉 Satisfied — [why]

Edge Cases from this journey:
  - Error: [What happens if step N fails]
  - Empty: [What if there is no data]
  - Permission denied: [What if access is restricted]
```

### Step 3: Screen Inventory

Before wireframing, list all screens in the feature:

| # | Screen Name | Triggered By | Primary Action | FR Ref |
|---|-------------|-------------|----------------|--------|
| 1 | [Name] | [Entry point] | [Main task] | FR-NNN |
| 2 | ... | | | |

Identify: which screens are NEW vs. which are EXISTING screens being modified.

### Step 4: Wireframing

See the wireframe convention in the `/forge-wireframe` command. Key rules:

1. **One wireframe per screen.** Do not combine multiple screens in one frame.
2. **Mobile-first** unless the project is desktop-only.
3. **Show all states**: default, loading, error, empty, success, disabled.
4. **Label everything**: every element needs a label, even if "TBD".
5. **Reference FRs**: annotate which requirement each component addresses.

### Step 5: Component Specification

For each reusable component identified in wireframes:

```
### Component: [Component Name]
Type: [Button / Input / Card / Modal / Table / Form / Navigation / ...]
Used on screens: [Screen 1, Screen 2, ...]
FR coverage: [FR-NNN, FR-NNN]

| Property | Value |
|----------|-------|
| Variants | primary, secondary, destructive, ghost |
| Sizes | sm, md, lg |
| States | default, hover, active, disabled, loading, error |

Slot / Content:
  - [slot name]: [description of what goes here]

Behavior:
  - On click: [what happens]
  - On keyboard Enter/Space: [same as click / different behavior]
  - On focus: [focus ring style, aria announcement]

A11y:
  - Role: [button / textbox / dialog / list / etc.]
  - aria-label pattern: "[text]" or aria-labelledby="[id]"
  - Keyboard: [Tab to focus, Enter/Space to activate, Esc to dismiss]
```

### Step 6: Design Token Specification

Define tokens in a CSS-custom-property-compatible format:

```markdown
## Design Tokens

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| --color-primary-500 | #0066CC | Primary CTA, links |
| --color-primary-600 | #0052A3 | Hover state |
| --color-error-500 | #CC0000 | Error states, destructive actions |
| --color-success-500 | #007A33 | Success states |
| --color-neutral-900 | #111827 | Body text |
| --color-neutral-100 | #F3F4F6 | Backgrounds |

### Typography
| Token | Value | Usage |
|-------|-------|-------|
| --font-size-xs | 12px / 0.75rem | Captions, labels |
| --font-size-sm | 14px / 0.875rem | Secondary text |
| --font-size-base | 16px / 1rem | Body text |
| --font-size-lg | 18px / 1.125rem | Subheadings |
| --font-size-xl | 24px / 1.5rem | Section headings |
| --font-size-2xl | 32px / 2rem | Page titles |
| --line-height-tight | 1.25 | Headings |
| --line-height-normal | 1.5 | Body |

### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Internal padding (tight) |
| --space-2 | 8px | Icon gaps, tight stacking |
| --space-3 | 12px | Compact padding |
| --space-4 | 16px | Default padding |
| --space-6 | 24px | Section spacing |
| --space-8 | 32px | Section separation |
| --space-12 | 48px | Page-level spacing |

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| --radius-sm | 4px | Inputs, tags |
| --radius-md | 8px | Cards, buttons |
| --radius-lg | 16px | Modals, panels |
| --radius-full | 9999px | Pills, avatars |

### Shadows
| Token | Value | Usage |
|-------|-------|-------|
| --shadow-sm | 0 1px 2px rgba(0,0,0,.05) | Subtle lift |
| --shadow-md | 0 4px 6px rgba(0,0,0,.07) | Cards |
| --shadow-lg | 0 10px 15px rgba(0,0,0,.1) | Modals, dropdowns |
```

## Accessibility Checklist

Apply this checklist to every screen before finalizing:

### Perceivable
- [ ] All images have `alt` text (decorative: `alt=""`)
- [ ] Color is not the only way to convey information
- [ ] Text contrast ≥ 4.5:1 (body), ≥ 3:1 (large text ≥ 18px bold)
- [ ] Interactive element contrast ≥ 3:1
- [ ] Text can be resized to 200% without horizontal scrolling
- [ ] No content flashes more than 3 times per second

### Operable
- [ ] All functionality accessible by keyboard alone
- [ ] No keyboard traps (except intentional: modals must have Esc)
- [ ] Skip navigation link provided
- [ ] Tab order is logical and matches visual order
- [ ] Focus indicator visible on all interactive elements
- [ ] Touch targets ≥ 44×44px (mobile)
- [ ] No time limits, or user can extend them

### Understandable
- [ ] Page language declared
- [ ] Error messages identify the field and describe the issue
- [ ] All inputs have visible labels (not just placeholders)
- [ ] Required fields indicated (not only by color)
- [ ] Consistent navigation across pages
- [ ] Consistent component behavior across pages

### Robust
- [ ] Valid HTML structure (headings, landmarks, lists used correctly)
- [ ] All form elements have associated labels
- [ ] Status updates announced via `aria-live`
- [ ] Modals have focus trap + `role="dialog"` + `aria-labelledby`
- [ ] Custom components have correct ARIA roles and states

## Platform-Specific Conventions

### Web (SPA/SSR)
- Navigation: `<nav>` landmark, keyboard-navigable
- Loading states: skeleton screens preferred over spinners for content
- SSR: define loading skeleton in wireframe to prevent layout shift
- Forms: validate on blur, not on keystroke (less disruptive)

### Mobile (React Native / Flutter)
- iOS: Follow Apple Human Interface Guidelines
  - Navigation: NavigationController pattern, back gesture
  - Tap targets: minimum 44pt
  - Modal: sheet from bottom (not full screen)
- Android / Material: Follow Material Design 3
  - FAB for primary action
  - Bottom navigation for 3-5 sections
  - Snackbar for non-critical feedback (not Toast)
- Both: define safe area insets in wireframe

### API (DX Design)
- Error response format: `{ "error": { "code": "...", "message": "...", "field": "..." } }`
- Pagination: prefer cursor-based over page-number for large datasets
- Field naming: consistent casing (camelCase for JSON)
- Document all 4xx responses in the design spec

### Design System
- Component inventory before adding new: search existing first
- Variants over new components: prefer extending existing components
- Document usage guidelines AND anti-patterns
- Include visual regression test targets in component spec

## Quality Gates

Before handing off to `/forge-plan`:

- [ ] All screens in Screen Inventory have wireframes
- [ ] All wireframes have state inventory (min: default, error, empty)
- [ ] All screens have accessibility annotations
- [ ] All FRs from spec are covered by at least one wireframe element
- [ ] Design tokens are defined or referenced
- [ ] No `[NEEDS CLARIFICATION]` markers remain (or are explicitly deferred)
- [ ] user-journey.md saved
- [ ] design-spec.md saved
