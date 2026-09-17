# ADR-003: Shared Logic Lives in `mcp-server/src/lib/`

## Status
**Accepted** — 2026-09-17 (authored at close-out of spec 001; scoped to what was actually built)

## Context
T-006 asked for a "shared-core extraction pattern — pure `*-core.ts`
functions with thin per-platform bindings — as the single approved approach
for both tools and plugins". As specified, that pattern was never fully
built: plugins were never split into core + bindings (they remain
single-file, OpenCode-only), and the per-platform tool bindings were
deleted rather than thinned.

## Decision
Record the pattern **as actually applied**, narrowed to tools:

1. Logic shared by MCP tools lives in `mcp-server/src/lib/` as pure,
   dependency-free modules (`spec-parse.ts`, `sprint-parse.ts`), each with
   its own unit tests.
2. Tool implementations (`mcp-server/src/tools/`) are thin orchestrations
   over those modules plus I/O.
3. When a second implementation of the same tool existed
   (`.opencode/tools/`), it was consolidated into the MCP one and deleted
   (#68) — not wrapped, not kept as a "binding".

What this ADR does **not** cover: plugins. They were never split, and no
decision here approves or forbids a future split. If one happens, it gets
its own ADR.

## Consequences
- **Positive**: one implementation per tool, each shared module tested in
  isolation; the consolidation had a documented pattern to follow.
- **Negative**: none observed; the pattern emerged from the work rather
  than constraining it.
- **Risk**: over-generalising this ADR to plugins would misdescribe them —
  hence the explicit scope boundary above.

## Related Documents
- Spec: `.forge-meta/specs/001-cross-platform/spec.md` (T-006)
- Consolidation: `.forge/specs/007-phase3b/spec.md`, #68
