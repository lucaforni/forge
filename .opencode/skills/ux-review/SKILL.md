---
name: ux-review
description: UX quality review dimension for forge-reviewer — evaluates usability, accessibility (WCAG 2.1 AA), design consistency, and UX anti-patterns in implemented code
license: MIT
compatibility: opencode
metadata:
  audience: forge-reviewer
  workflow: forge
---

## Purpose

You are now adding the **6th review dimension: UX Quality** to your adversarial
code review. This skill extends the standard 5-dimension review with structured
checks for usability, accessibility compliance, design system consistency, and
UX anti-patterns in the implementation.

This dimension is activated when:
- A `design-spec.md` or `user-journey.md` exists for the feature being reviewed.
- The implementation includes UI components, screens, or user-facing interactions.
- The PR modifies CSS, component files, or template/view files.

## Dimension 6: UX Quality

### 6a. Spec-to-Implementation Fidelity

Compare the implementation against `.forge/specs/NNN-slug/design-spec.md`:

- [ ] Every wireframe screen has a corresponding implemented view
- [ ] Component states match spec (default, loading, error, empty, success)
- [ ] Interactive elements listed in spec are implemented
- [ ] FR traceability: each FR cited in design-spec is reflected in code
- [ ] No extra screens or flows added without spec coverage

**Flag if**: A state from the spec is missing (common: empty state, error state).
**Flag if**: An element is present in code but not in the spec (undocumented addition).

### 6b. Accessibility (WCAG 2.1 AA)

Check the following in HTML/JSX/component code:

| Criterion | What to Check in Code |
|-----------|----------------------|
| 1.1.1 Alt text | `<img>` has `alt`, decorative: `alt=""` |
| 1.4.3 Contrast | CSS color values meet ratio (flag suspect combinations) |
| 1.4.4 Resize | No px-based font sizes in body text (use rem) |
| 2.1.1 Keyboard | No click-only handlers without keyboard equivalent |
| 2.4.3 Focus order | `tabindex` values are not arbitrarily set |
| 2.4.7 Focus visible | No `outline: none` or `outline: 0` without replacement |
| 3.3.1 Error ID | Error messages are text, not only color/icon |
| 3.3.2 Labels | `<input>` elements have associated `<label>` |
| 4.1.2 ARIA | Interactive custom components have role, name, state |

**Critical flags** (block merge):
- `outline: none` on focusable elements without a visible replacement
- `<img>` without `alt` attribute
- Form inputs without associated labels
- Custom interactive elements (`div`, `span` with onClick) without
  `role`, `tabindex`, and keyboard handler

**Warning flags** (should fix):
- `tabindex` > 0 (breaks natural tab order)
- Missing `aria-live` on dynamic content areas (toasts, form errors)
- Missing `aria-label` on icon-only buttons
- Dialog without `role="dialog"` + `aria-labelledby` + focus trap

### 6c. Design System Consistency

If `.forge/ux/design-system.md` exists:

- [ ] Colors used match defined tokens (no hardcoded hex values)
- [ ] Spacing uses token values (no magic pixel values)
- [ ] Typography uses defined scale (no arbitrary font sizes)
- [ ] New components follow existing component patterns
- [ ] No new design tokens introduced without updating design-system.md

**Flag if**: Hardcoded hex colors are used instead of CSS variables.
**Flag if**: New spacing values appear (e.g., `padding: 13px`) not in the token scale.
**Flag if**: A new UI component duplicates an existing one from the design system.

### 6d. Usability Anti-Patterns

Check for known UX anti-patterns in the implementation:

| Anti-Pattern | Code Signal | Issue |
|---|---|---|
| Mystery meat navigation | Icon-only buttons without labels | Users cannot identify purpose |
| Disabled states with no explanation | `disabled` attribute + no tooltip | Users don't know why |
| Premature validation | `onChange` validation (not `onBlur`) | Errors appear while typing |
| Destructive actions without confirmation | DELETE/submit with no confirm step | Accidental data loss |
| Missing loading feedback | Async action with no spinner/skeleton | User thinks nothing happened |
| Missing empty states | List renders nothing on empty array | Confusing blank screen |
| Broken mobile targets | Touch targets < 44×44px | Unusable on mobile |
| Placeholder as label | `<input placeholder="Name">` without label | Label disappears on focus |
| Auto-advance without warning | Form auto-submits / auto-redirects | Disorienting |
| Long unbounded lists | List render without pagination/limit | Performance + UX issue |

### 6e. Responsive and Platform Behavior

- [ ] Viewport meta tag present (web): `<meta name="viewport" ...>`
- [ ] No horizontal scroll on mobile (CSS overflow-x)
- [ ] Touch targets ≥ 44×44px on mobile components
- [ ] Images use responsive sizing (`max-width: 100%` or srcset)
- [ ] Text does not overflow containers on small screens
- [ ] Modals/drawers are scrollable if content is long

## Output Format for UX Dimension

Report UX findings using the same severity format as other dimensions:

```
[CRITICAL] UX:ACCESSIBILITY - src/components/Button.tsx:34
  Icon-only button has no accessible label.
  Impact: Screen reader users cannot identify the button's purpose. Fails
  WCAG 2.4.6 and 4.1.2. This blocks users with visual impairments.
  Suggestion: Add aria-label="[action description]" to the button element.

[WARNING] UX:CONSISTENCY - src/pages/Dashboard.tsx:112
  Hardcoded color #2563eb used instead of design token --color-primary-500.
  Impact: If the design system color changes, this element will not update.
  Suggestion: Replace with var(--color-primary-500) or the project's token
  equivalent.

[WARNING] UX:ANTI-PATTERN - src/components/UserList.tsx:67
  List renders empty div when users array is empty. No empty state shown.
  Impact: Users see a blank area with no explanation or call to action.
  Suggestion: Add an empty state component per design-spec.md Section 4.2.

[INFO] UX:ACCESSIBILITY - src/forms/LoginForm.tsx:23
  Error message relies on red color alone (no text prefix like "Error:").
  Impact: Users with color blindness may miss the error state.
  Suggestion: Prefix error messages with "Error:" or add an error icon
  with aria-hidden="true".
```

## When to Escalate to CRITICAL

Escalate to CRITICAL (blocking merge) for:
1. Any keyboard navigation blocker (users cannot complete the flow)
2. Missing form labels (affects all assistive technology users)
3. `outline: none` without visible focus replacement
4. Missing `alt` attributes on informational images
5. Implemented flow that is completely absent from the spec (unreviewed UX)

## Integration with Standard Review

When including UX review findings:

1. Add UX as Dimension 6 in your review output.
2. Count UX issues toward the minimum 3-issue requirement.
3. Update the summary line:

```
Summary: X issues found. Y CRITICAL (blocking), Z WARNING, W INFO.
         Dimensions reviewed: Correctness, Security, Performance,
         Maintainability, Constitution, UX Quality
```

## When Design Spec Is Absent

If no `design-spec.md` exists for the feature:

1. Flag this as a WARNING:
   ```
   [WARNING] UX:PROCESS - [feature path]
     No design-spec.md found for this feature. UX review cannot verify
     spec-to-implementation fidelity.
     Suggestion: Run /forge-ux to produce a design spec, or retroactively
     document the implemented UX in design-spec.md.
   ```
2. Still apply checks 6b (Accessibility), 6c (Design System), 6d (Anti-patterns),
   and 6e (Responsive). These do not require a spec.
