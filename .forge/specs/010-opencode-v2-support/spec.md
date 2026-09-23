# Spec 010 — OpenCode v2 Compatibility

| Field | Value |
|---|---|
| **ID** | 010-opencode-v2-support |
| **Track** | Feature |
| **Status** | In Progress — Phases 1–5 implemented and gated; Phase 6 (T-016–T-018) pending v2 runtime + dual-model review |
| **Created** | 2026-09-21 |
| **Upstream** | OpenCode v2 migration guide (`opencode.ai/v2/docs/migrate-v1/`); compatibility analysis 2026-09-21 |
| **Freeze tag** | `v2.0.0-opencode-v1-last` (HEAD `3476f55`) — last FORGE compatible with OpenCode v1 |
| **Constitution** | `.forge-meta/constitution.md` (5 articles) |

---

## Problem

OpenCode v2 ships three intentional breaking changes: plugin API, server API/clients, `tui.json(c)` → global `cli.json`. Everything else V1-supported is meant to keep working via in-memory normalization.

FORGE straddles both sides of that line:

1. **The 3 shipped plugins are V1-only and will not run on v2** (`@opencode-ai/plugin`, object return with `event` / `experimental.*` hooks). This is the hard break — silent loss of pre-commit gate, session knowledge, and spec watcher.
2. **The installer generates V1-native config shapes** (`agent`, `permission.bash`, `provider`, flat `mcp`). They still load on v2 through normalization, but every new install bakes in legacy syntax plus future warnings.
3. **Frontmatter uses legacy keys** (`subtask`, `variant`, `task`/`bash`/`write` permissions) across 9 agents and 24 commands. Auto-translated today, but `subtask` delegation semantics changed (background execution) and need verification.

## Goal

A fresh FORGE install works natively on OpenCode v2 — plugins load, generated `opencode.json` is native V2 shape, frontmatter uses native keys — while documenting the v1 freeze tag for users who stay behind.

## Non-Goals

- Supporting OpenCode v1 and v2 plugin implementations indefinitely (one transition window, then V2-only).
- Porting Claude Code / Codex projections to anything v2-specific (separate problem, #70/#71 track).
- Adopting v2-only server API features beyond what the plugins need.

---

## Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| **FR-001** | Port `pre-commit-gate.ts` to `@opencode/plugin` (`Plugin.define({id, setup})`, `ctx.event.subscribe` for `file.edited`, v2 toast/notify path) | Plugin appears in v2 plugin list; toast fires on spec-tracked edit |
| **FR-002** | Port `session-knowledge.ts`: `session.idle` via `ctx.event.subscribe`, message read via `ctx.session` domain, compaction injection via `ctx.session.hook("compaction", …)` | Idle appends to decision-log; compacted session retains injected knowledge |
| **FR-003** | Port `spec-watcher.ts` (same `file.edited` + toast pattern as FR-001, spec/plan/tasks consistency check preserved) | Edit to `.forge/specs/*/spec.md` with uncovered FR-ID triggers advisory |
| **FR-004** | Ship `.opencode/package.json` declaring the v2 plugin package; decide dual `server()+setup()` transition export vs clean V2-only cut | Contract test asserts manifest matches implementation import |
| **FR-005** | `generateOpenCodeConfig` emits native V2 shapes: `permissions[]` (`shell`/`subagent`/`edit`), `agents` (`system`, `disabled`, `model#variant`, `permissions[]`), `providers` (`package` with `aisdk:` prefix, `settings`), `mcp.servers` (`disabled`, split `timeout`), `commands`/`snapshots`/`media` renames where generated | Unit test on generated config: no singular legacy keys in fresh output |
| **FR-006** | Update `FORGE_MANAGED_KEYS` and merge logic so existing user V1 configs are preserved but regenerated keys come out native V2 (V1+V2 coexistence: V2 wins on conflict, no nested mixing inside one agent/provider entry) | Unit test: V1 user config + regenerate → user keys kept, FORGE keys native |
| **FR-007** | Rename frontmatter to native keys across agents/commands (`subtask`→`subagent`, `variant`→`model#variant`, `task`→`subagent` / `bash`→`shell` / `write`+`patch`→`edit` permissions, `prompt`→`system` in JSON config); verify `mode: subagent` in `forge-reviewer.md` against v2 Agents reference | Grep test: zero legacy keys in `.opencode/agents|commands`; dual-review still synthesizes A+B |
| **FR-008** | Update installer contract + unit tests: plugin manifest assertion, native config assertions, frontmatter coherence assertion | `npm test` green; coverage gate still passes |
| **FR-009** | Docs: v2 install prerequisite (remove package-managed v1, v2 replaces binary), what auto-migrates (`cli.json`), what was ported, v1 freeze tag pointer; update `INSTALL.md`, `README.md`, `FORGE-CUSTOMIZATION.md`, `UPDATING-FORGE.md` | Docs reference `v2.0.0-opencode-v1-last` and v2 guide links |
| **FR-010** | Manual V2 verification checklist passes: models/credentials, agents, permissions, MCP servers, plugin list + per-plugin hook exercise + reload/cleanup, clean-project options/state | Checklist recorded in spec (all boxes ticked or issues filed) |

## Non-Functional Requirements

| ID | Requirement | Metric |
|---|---|---|
| **NFR-001** | Installer stays dependency-free (Art. 2.2) | No new imports outside `node:*` |
| **NFR-002** | Install stays idempotent — second run writes nothing (spec 004 NFR-003) | Manifest checksum equality test |
| **NFR-003** | `tsc --noEmit` does not regress | Error count ≤ current baseline |
| **NFR-004** | Plugin transforms stay replayable per v2 contract (synchronous, cheap, side-effect-free; `reload()` on data change) | Review checklist in each plugin file |

---

## Design Decisions

### D-1 — Dual `server()+setup()` export vs clean cut

**Verdict (plan phase, 2026-09-21): clean V2-only cut.** The freeze tag
`v2.0.0-opencode-v1-last` is the v1 support story — v1 users pin the tag.
A dual export doubles every hook implementation for a transition window
with no owner. `Plugin.define({ id, setup })` only; no `server()` shape.

### D-2 — Emit native V2, don't just rely on normalization

Normalization keeps V1 configs alive, but newly generated files should be native (explicit `permissions[]` ordering is a readability/security win and removes warning noise). Merge path must still accept V1 user files quietly.

### D-3 — `mode: subagent` needs a verdict, not a silent rename

`forge-reviewer.md` is the only agent using `mode:` frontmatter. The v2 guide covers `mode` *maps* in JSON config, not this file-level key. Look it up in the v2 Agents reference during implementation; either map it to the documented equivalent or delete with rationale.

---

## Constitution Compliance

| Article | Status | Notes |
|---|---|---|
| Art. 1 Core Principles | Compliant | Preserves dual-model review governance; no workflow bypass |
| Art. 2 Technology Stack | Compliant | NFR-001: installer dependency-free; plugin dep moves to `@opencode/plugin` (platform SDK, same category as before) |
| Art. 3 Architecture Patterns | Compliant | MCP server untouched (cross-platform tool surface); plugins stay OpenCode-only projection (§ D-3) |
| Art. 4 Quality Standards | Compliant | FR-008 + NFR-002/003: contract tests, idempotency, typecheck gate |
| Art. 5 Naming & Conventions | Compliant | FR-007 kebab-case/camelCase untouched; renames are upstream-mandated keys |

---

## Cross-References

| Document | Path |
|---|---|
| Constitution | `.forge-meta/constitution.md` |
| Freeze tag | `v2.0.0-opencode-v1-last` (`3476f55`) |
| Tasks | `.forge/specs/010-opencode-v2-support/tasks.md` |
| Installer | `installer/platforms/opencode.ts`, `installer/config.ts`, `installer/projection.ts` |
| Plugins | `.opencode/plugins/*.ts`, `.opencode/package.json` |
| V2 guides | `opencode.ai/v2/docs/migrate-v1/`, `/v2/docs/build/plugins/migrate-v1/` |
