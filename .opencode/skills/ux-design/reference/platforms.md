# UX Design Reference: Platform Conventions

On-demand detail for `ux-design`. Load when designing for a specific
platform — not upfront.

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

