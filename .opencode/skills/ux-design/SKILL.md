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

FORGE UX design protocol. Structured methodology, conventions, and checklists for producing complete, traceable UX/UI design artifacts in Markdown.

## Process

Execute in order. Each step produces an artifact that feeds the next.

### Step 1: Persona Definition

2-3 personas per feature. Each:

```
### Persona: [Name]
Role: [Job title or user type]
Goal: [Primary goal using this feature]
Pain points: [Top 2-3 frustrations with current solution]
Tech literacy: [Low / Medium / High]
Device preference: [Desktop / Mobile / Both]
Accessibility needs: [None / Screen reader / Motor / Visual]
Quote: "[A sentence capturing their perspective]"
```

**Rules:**
- Base on user stories in spec. Don't invent unrelated demographics.
- ≥ 1 persona represents a lower-tech-literacy user.
- Accessibility needs drive WCAG requirements.

### Step 2: User Journey Mapping

Per persona:

```
### Journey: [Persona Name] — [Journey Name]
Trigger: [What makes them start]

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
  - Error: [If step N fails]
  - Empty: [If no data]
  - Permission denied: [If access restricted]
```

### Step 3: Screen Inventory

Before wireframing, list all screens:

| # | Screen Name | Triggered By | Primary Action | FR Ref |
|---|-------------|-------------|----------------|--------|
| 1 | [Name] | [Entry point] | [Main task] | FR-NNN |
| 2 | ... | | | |

Identify: NEW vs EXISTING screens being modified.

### Step 4: Wireframing

See `/forge-wireframe` for convention. Key rules:

1. **One wireframe per screen.** Don't combine multiple in one frame.
2. **Mobile-first** unless project is desktop-only.
3. **Show all states**: default, loading, error, empty, success, disabled.
4. **Label everything** (even "TBD").
5. **Reference FRs**: annotate which requirement each component addresses.

### Step 5: Component Specification

Per reusable component identified in wireframes:

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
  - On keyboard Enter/Space: [same as click / different]
  - On focus: [focus ring style, aria announcement]

A11y:
  - Role: [button / textbox / dialog / list / etc.]
  - aria-label pattern: "[text]" or aria-labelledby="[id]"
  - Keyboard: [Tab to focus, Enter/Space to activate, Esc to dismiss]
```

### Step 6: Design Token Specification

If existing design system at `.forge/ux/design-system.md`, reference its tokens. Otherwise define tokens using CSS custom property format:

| Category | Tokens to define |
|----------|-----------------|
| Colors | primary (500/600), error, success, neutral (900/100) |
| Typography | font-size (xs/sm/base/lg/xl/2xl), line-height (tight/normal) |
| Spacing | scale-4 (1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px, 12=48px) |
| Border Radius | sm=4px, md=8px, lg=16px, full=9999px |
| Shadows | sm (subtle), md (cards), lg (modals/dropdowns) |

Naming: `--token-category-scale` (e.g., `--color-primary-500`, `--space-4`, `--radius-md`).

## Accessibility Checklist (WCAG 2.1 AA)

Apply per screen before finalizing.

**Perceivable**
- [ ] All images have `alt` (decorative: `alt=""`).
- [ ] Color is not the only way to convey info.
- [ ] Text contrast ≥ 4.5:1 (body), ≥ 3:1 (large text ≥ 18px bold); interactive elements ≥ 3:1.
- [ ] Text resizable to 200% without horizontal scroll; no flashing > 3/sec.

**Operable**
- [ ] All functionality keyboard-accessible; no keyboard traps (except intentional: modals trap, Esc releases).
- [ ] Skip-nav link; tab order logical and matches visual order.
- [ ] Focus indicator visible; touch targets ≥ 44×44px (mobile); no time limits (or user can extend).

**Understandable**
- [ ] Page language declared; error messages identify field + describe issue.
- [ ] All inputs have visible labels (not only placeholders); required fields indicated beyond color.
- [ ] Consistent navigation + component behavior across pages.

**Robust**
- [ ] Valid HTML structure (headings, landmarks, lists used correctly).
- [ ] All form elements have associated labels; status updates announced via `aria-live`.
- [ ] Modals: focus trap + `role="dialog"` + `aria-labelledby`; custom components have correct ARIA roles.

## Platform-Specific Conventions

### Web (SPA/SSR)
- Navigation: `<nav>` landmark, keyboard-navigable.
- Loading: skeleton screens preferred over spinners for content.
- SSR: define loading skeleton in wireframe to prevent layout shift.
- Forms: validate on blur, not on keystroke.

### Mobile
- **iOS** (Apple HIG): NavigationController pattern + back gesture; tap targets ≥ 44pt; modal as bottom sheet (not full screen).
- **Android / Material 3**: FAB for primary action; bottom nav for 3-5 sections; Snackbar for non-critical feedback (not Toast).
- **Both**: define safe area insets in wireframe.

### API (DX Design)
- Error format: `{ "error": { "code": "...", "message": "...", "field": "..." } }`.
- Pagination: cursor-based preferred for large datasets.
- Field naming: consistent casing (camelCase for JSON).
- Document all 4xx responses in design spec.

### Design System
- Component inventory before adding new: search existing first.
- Variants over new components: prefer extending.
- Document usage guidelines AND anti-patterns.
- Include visual regression test targets in component spec.

## Quality Gates

Before handoff to `/forge-plan`:

- [ ] All screens in Screen Inventory have wireframes.
- [ ] All wireframes have state inventory (min: default, error, empty).
- [ ] All screens have accessibility annotations.
- [ ] All FRs from spec covered by ≥ 1 wireframe element.
- [ ] Design tokens defined or referenced.
- [ ] No `[NEEDS CLARIFICATION]` markers remain (or explicitly deferred).
- [ ] `user-journey.md` saved.
- [ ] `design-spec.md` saved.
