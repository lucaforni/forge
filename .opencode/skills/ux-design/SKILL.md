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

If the project has an existing design system at `.forge/ux/design-system.md`,
reference existing tokens. Otherwise define tokens using CSS custom property
format across these categories:

| Category | Tokens to define |
|----------|-----------------|
| Colors | primary (500/600), error, success, neutral (900/100) |
| Typography | font-size (xs/sm/base/lg/xl/2xl), line-height (tight/normal) |
| Spacing | scale-4 (1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px, 12=48px) |
| Border Radius | sm=4px, md=8px, lg=16px, full=9999px |
| Shadows | sm (subtle), md (cards), lg (modals/dropdowns) |

Use `--token-category-scale` naming convention (e.g., `--color-primary-500`,
`--space-4`, `--radius-md`).

## Accessibility Checklist (WCAG 2.1 AA)

Apply to every screen before finalizing:

**Perceivable**
- [ ] All images have `alt` text (decorative: `alt=""`)
- [ ] Color is not the only way to convey information
- [ ] Text contrast ≥ 4.5:1 (body), ≥ 3:1 (large text ≥ 18px bold); interactive elements ≥ 3:1
- [ ] Text resizable to 200% without horizontal scrolling; no flashing > 3/sec

**Operable**
- [ ] All functionality accessible by keyboard; no keyboard traps (except intentional: modals trap, Esc releases)
- [ ] Skip navigation link provided; tab order logical and matches visual order
- [ ] Focus indicator visible; touch targets ≥ 44×44px (mobile); no time limits (or user can extend)

**Understandable**
- [ ] Page language declared; error messages identify field and describe the issue
- [ ] All inputs have visible labels (not only placeholders); required fields indicated beyond color
- [ ] Consistent navigation and component behavior across pages

**Robust**
- [ ] Valid HTML structure (headings, landmarks, lists used correctly)
- [ ] All form elements have associated labels; status updates announced via `aria-live`
- [ ] Modals: focus trap + `role="dialog"` + `aria-labelledby`; custom components have correct ARIA roles

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
