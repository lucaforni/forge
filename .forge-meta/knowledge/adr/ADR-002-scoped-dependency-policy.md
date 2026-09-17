# ADR-002: Scoped Runtime-Dependency Policy

## Status
**Accepted** — 2026-09-17 (authored at close-out of spec 001; substance ratified earlier — see below)

## Context
The original Art. 2.2 ("zero runtime dependencies for core framework") was
written when FORGE shipped no executable code of its own. The v2.0 port
added two components that cannot honestly meet it: `mcp-server/` needs a
protocol implementation (`@modelcontextprotocol/sdk`; no viable builtin),
and it ships untranspiled sources, so it needs a loader (`tsx`, removable
by adding a build step). The OpenCode-native side needs the platform SDK
(`@opencode-ai/plugin`). T-006 asked for this classification in June 2026;
it was never written, and the tension sat unresolved until the 2026-09
audit re-derived it independently.

## Decision
Replace the blanket ban with a scoped rule (constitution Art. 2.2,
amended 2026-09-17):

1. The **installer layer** (`installer/`, `install-forge.ts`) keeps zero
   runtime dependencies — Node builtins only. It runs before anything is
   installed, so it must never require a fetch. Enforced by inspection
   (no manifest declares runtime deps there).
2. **Distributed runtime components** may declare runtime dependencies, but
   each requires an explicit justification in the Art. 2.2 table, a
   committed lockfile, and Dependabot registration. Current set:
   `@modelcontextprotocol/sdk` + `tsx` (`mcp-server/`),
   `@opencode-ai/plugin` (`.opencode/`).

## Consequences
- **Positive**: the constitution describes reality, so compliance verdicts
  derived from it are sound; `mcp-server/` gained a lockfile and CI
  coverage (#77, #82).
- **Negative**: every new runtime dependency now needs a justification row
  and a lockfile — deliberate friction.
- **Risk**: none new; the dependencies already shipped. The risk was the
  false claim, now removed.

## Amendment Reference
Constitution Art. 2.2 amended 2026-09-17 (audit Phase 0).

## Related Documents
- Spec: `.forge-meta/specs/001-cross-platform/spec.md` (T-006)
- Constitution: `.forge-meta/constitution.md`, Art. 2.2
