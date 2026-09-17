# UX Design Reference: Accessibility

On-demand detail for `ux-design`. Load when annotating a screen for
accessibility — not upfront.

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

