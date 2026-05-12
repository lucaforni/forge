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

Adds the **6th review dimension: UX Quality** to adversarial code review. Structured checks for usability, accessibility, design system consistency, and UX anti-patterns.

Activate when:
- `design-spec.md` or `user-journey.md` exists for the feature.
- Implementation includes UI components, screens, or user-facing interactions.
- PR modifies CSS, component, or template/view files.

## Dimension 6: UX Quality

### 6a. Spec-to-Implementation Fidelity

Compare implementation against `.forge/specs/NNN-slug/design-spec.md`:

- [ ] Every wireframe screen has a corresponding implemented view.
- [ ] Component states match spec (default, loading, error, empty, success).
- [ ] Interactive elements in spec are implemented.
- [ ] FR traceability: each FR cited in design-spec reflected in code.
- [ ] No extra screens/flows without spec coverage.

**Flag if**: state from spec is missing (commonly empty or error state).
**Flag if**: element present in code but not in spec (undocumented addition).

### 6b. Accessibility (WCAG 2.1 AA)

| Criterion | Check |
|-----------|-------|
| 1.1.1 Alt text | `<img>` has `alt`, decorative: `alt=""` |
| 1.4.3 Contrast | CSS colors meet ratio (flag suspect combinations) |
| 1.4.4 Resize | No px-based font sizes in body text (use rem) |
| 2.1.1 Keyboard | No click-only handlers without keyboard equivalent |
| 2.4.3 Focus order | `tabindex` not arbitrarily set |
| 2.4.7 Focus visible | No `outline: none` / `outline: 0` without replacement |
| 3.3.1 Error ID | Error messages are text, not only color/icon |
| 3.3.2 Labels | `<input>` has associated `<label>` |
| 4.1.2 ARIA | Custom interactive components have role, name, state |

**CRITICAL (block merge):**
- `outline: none` on focusable elements without visible replacement.
- `<img>` without `alt`.
- Form inputs without associated labels.
- Custom interactive elements (`div`/`span` + onClick) without `role`, `tabindex`, keyboard handler.

**WARNING (should fix):**
- `tabindex` > 0 (breaks tab order).
- Missing `aria-live` on dynamic content (toasts, form errors).
- Missing `aria-label` on icon-only buttons.
- Dialog without `role="dialog"` + `aria-labelledby` + focus trap.

### 6c. Design System Consistency

If `.forge/ux/design-system.md` exists:

- [ ] Colors match defined tokens (no hardcoded hex).
- [ ] Spacing uses tokens (no magic px).
- [ ] Typography uses defined scale.
- [ ] New components follow existing patterns.
- [ ] No new tokens introduced without updating design-system.md.

**Flag if**: hardcoded hex colors instead of CSS variables.
**Flag if**: new spacing values (`padding: 13px`) not in token scale.
**Flag if**: new UI component duplicates existing one from design system.

### 6d. Usability Anti-Patterns

| Anti-Pattern | Code Signal | Issue |
|---|---|---|
| Mystery meat navigation | Icon-only buttons without labels | Users can't identify purpose |
| Disabled with no explanation | `disabled` + no tooltip | Users don't know why |
| Premature validation | `onChange` (not `onBlur`) validation | Errors while typing |
| Destructive without confirmation | DELETE/submit, no confirm step | Accidental data loss |
| Missing loading feedback | Async + no spinner/skeleton | User thinks nothing happened |
| Missing empty states | List renders nothing on empty | Confusing blank screen |
| Broken mobile targets | Touch targets < 44×44px | Unusable on mobile |
| Placeholder as label | `<input placeholder="Name">` no label | Label disappears on focus |
| Auto-advance without warning | Form auto-submits/redirects | Disorienting |
| Long unbounded lists | Render without pagination/limit | Perf + UX issue |

### 6e. Responsive + Platform Behavior

- [ ] Viewport meta tag present (web).
- [ ] No horizontal scroll on mobile (CSS overflow-x).
- [ ] Touch targets ≥ 44×44px on mobile.
- [ ] Images responsive (`max-width: 100%` or srcset).
- [ ] Text doesn't overflow containers on small screens.
- [ ] Modals/drawers scrollable if content is long.

## Output Format

Same severity format as other dimensions:

```
[CRITICAL] UX:ACCESSIBILITY - src/components/Button.tsx:34
  Icon-only button has no accessible label.
  Impact: Screen reader users cannot identify the button's purpose.
  Fails WCAG 2.4.6 and 4.1.2. Blocks users with visual impairments.
  Suggestion: Add aria-label="[action description]" to the button element.

[WARNING] UX:CONSISTENCY - src/pages/Dashboard.tsx:112
  Hardcoded color #2563eb used instead of design token --color-primary-500.
  Impact: If the design system color changes, this element will not update.
  Suggestion: Replace with var(--color-primary-500).

[WARNING] UX:ANTI-PATTERN - src/components/UserList.tsx:67
  List renders empty div when users array is empty. No empty state shown.
  Impact: Users see a blank area with no explanation or call to action.
  Suggestion: Add empty state component per design-spec.md Section 4.2.

[INFO] UX:ACCESSIBILITY - src/forms/LoginForm.tsx:23
  Error message relies on red color alone (no text prefix like "Error:").
  Impact: Users with color blindness may miss the error state.
  Suggestion: Prefix with "Error:" or add an error icon with aria-hidden="true".
```

## Escalate to CRITICAL

1. Any keyboard navigation blocker (users cannot complete the flow).
2. Missing form labels (affects all assistive tech users).
3. `outline: none` without visible focus replacement.
4. Missing `alt` on informational images.
5. Implemented flow completely absent from spec (unreviewed UX).

## Integration with Standard Review

1. Add UX as Dimension 6 in review output.
2. Count UX issues toward minimum 3-issue requirement.
3. Update summary:

```
Summary: X issues found. Y CRITICAL (blocking), Z WARNING, W INFO.
         Dimensions reviewed: Correctness, Security, Performance,
         Maintainability, Constitution, UX Quality
```

## When Design Spec Is Absent

If no `design-spec.md` for the feature:

1. Flag as WARNING:
   ```
   [WARNING] UX:PROCESS - [feature path]
     No design-spec.md found. UX review cannot verify spec-to-implementation
     fidelity.
     Suggestion: Run /forge-ux to produce a design spec, or retroactively
     document the implemented UX in design-spec.md.
   ```
2. Still apply checks 6b (a11y), 6c (design system), 6d (anti-patterns), 6e (responsive). These don't require a spec.
