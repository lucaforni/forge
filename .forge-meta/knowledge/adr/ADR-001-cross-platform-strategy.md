# ADR-001: Cross-Platform Porting Strategy

## Status
**Accepted** — 2026-06-21

## Context
FORGE was built exclusively for OpenCode. Claude Code (Anthropic) and Codex CLI (OpenAI) now provide sufficient extensibility (native subagents, MCP tools, SKILL.md skills, custom commands) to host FORGE's workflow. Porting expands FORGE's addressable market and removes vendor-lock-in optics from a methodology framework.

## Decision
Adopt a **single-source-of-truth + per-platform projection** architecture:

1. **Canonical artifacts** (agents, commands, skills) live in `.opencode/` — this remains the authoritative source.
2. **Install-time projection** copies/symlinks/generates platform-correct layouts:
   - OpenCode → `.opencode/` (already there, no change)
   - Claude Code → `.claude/` + `CLAUDE.md` (via `@AGENTS.md` import)
   - Codex CLI → `.codex/` + `.agents/skills/` + `AGENTS.md`
3. **Custom tools** (validate-spec, trace-requirements, sprint-status) are exposed as a single MCP server (`forge-mcp-server`) reachable from all three platforms.
4. **Plugins** are adapted per-platform hooks system; graceful degradation where no equivalent event exists.
5. **Installer** is refactored into shared core + per-platform adapter modules.

## Consequences
- **Positive**: Single-maintenance for all platforms; OpenCode users see zero regression; Claude Code / Codex CLI users get full FORGE.
- **Negative**: Installer complexity increases; MCP server is a new runtime dependency; plugin behavior differs slightly per platform.
- **Risk**: Per-platform projection drift (mitigated by CI equivalence check); Codex CLI removing `.claude/agents/` fallback (mitigated by native TOML generation).

## Amendment Reference
Constitution Article 1.2 amended on 2026-06-21 — replaced "OpenCode-native" with "Multi-platform" principle.

## Related Documents
- Spec: `.forge-meta/specs/001-cross-platform/spec.md`
- Constitution: `.forge-meta/constitution.md`
