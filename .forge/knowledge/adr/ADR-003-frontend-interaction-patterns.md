# ADR-003: Frontend Interaction Patterns — Modal, Drawer, Notification, Error

## Status

**Accepted** · 2026-06-24

## Context

Interaction patterns (modal, drawer, toast, error) were handled inconsistently:
sometimes Dialog was used, sometimes Sheet, sometimes custom. Error handling
was duplicated in every component. A unified strategy was needed.

## Decision

### Modal vs Drawer vs Full Page

| Scenario | Component | Rationale |
|----------|-----------|--------|
| Action confirmation (e.g., delete) | AlertDialog | Not dismissable by clicking outside — requires explicit decision |
| In-context form (e.g., quick edit) | Dialog | Context lost if not modal. Full screen on mobile |
| Detail without losing list | Sheet | Side panel preserves context. Mobile: bottom sheet |
| Complex form (5+ fields) | Full page | Better space and navigability |
| Configuration / settings | Sheet | Side panel, persistent across navigations |

### Toast vs Inline Error vs Alert

| Type | When | Behavior |
|------|--------|----------|
| toast.success | Operation completed | 4s, auto-dismiss, green |
| toast.error | Non-critical operation error | 6s, auto-dismiss, red |
| InlineError | Contextual error (part of page) | Permanent until resolved |
| FullPageError | Catastrophic error (entire page) | Permanent, retry or navigate |
| ErrorBoundary | Uncaught React error | Replaces children |

### Error Recovery Strategy

1. Every React Query query/mutation catches errors → passes to toast or inline error
2. Global ErrorBoundary + one per critical section (dashboard, multi-step form)
3. API errors 401/403 → redirect to login
4. Errors 500 → inline error + retry
5. Network error → toast + retry + "offline mode" indicator

### Unified Notification

All notifications go through Sonner (shadcn/ui toast library).
Never `alert()`, never custom toast, never console.log for user feedback.

## Consequences

**Positive**:
- Clear decision on which pattern to use for each scenario
- Unified error handling (not duplicated in every component)
- Toast as the single notification channel
- Clear separation between inline errors (permanent) and toasts (temporary)

**Negative**:
- Sonner is an additional dependency (already included in shadcn/ui)
- ErrorBoundary requires class component (hybrid pattern)
- Some borderline cases (e.g., error in multi-step wizard) may require exceptions

**Mitigations**:
- Sonner is already in the shadcn/ui starter
- ErrorBoundary is a single component, the rest is functional
- Patterns document when to DEVIATE (e.g., wizard: per-step error, not global)
