# Plan: 010 - OpenCode v2 Compatibility

> Technical implementation plan for Feature track. Created via `/forge-plan`.

| Field | Value |
| --- | --- |
| Status | Draft |
| Author | forge-architect |
| Date | 2026-09-21 |
| Track | Feature |
| Spec | `.forge/specs/010-opencode-v2-support/spec.md` |

---

## 1. Overview

Three independent workstreams, one per spec problem area. Order matters only where tests pin output: plugins first (new directory layout changes the installer catalogue), then config generation, then frontmatter renames (which change projection-adapter inputs). Docs last.

Key discovery during planning (not in spec): **toasts exist only in CLI plugins** (`@opencode/plugin/tui` → `context.ui.toast.show`). The server plugin API (`@opencode/plugin`) has no toast/notify surface. Watchers therefore split: detection helpers stay shared/pure, toast delivery moves to a `tui.ts` entry. `session-knowledge` stays server-only (no UI surface needed).

Second discovery: the Claude/Codex projection adapters key off V1 frontmatter names (`permission`, `variant`, `subtask`). Renaming canonical files to native V2 without updating the adapters would leak `permissions:`/`subagent:` onto platforms that don't understand them. Adapters must accept both shapes.

## 2. T-001 verdict (D-1): clean V2-only cut

Ship V2-native plugins with **no dual `server()` shape**. Rationale: the freeze tag `v2.0.0-opencode-v1-last` is precisely the v1 support story — v1 users pin the tag. A dual export doubles every hook implementation for a transition window with no owner. Spec §D-1 recommendation (dual) is superseded by this verdict; T-001 is closed by this plan.

## 3. Component Design

### 3.1 Plugin directories (FR-001–FR-004)

- **Location**: `.opencode/plugins/<name>/` (directory form; v2 discovers `plugins/`, `index.ts` entry convention per v2 plugin docs).
- **Layout per watcher** (`pre-commit-gate`, `spec-watcher`):
  - `shared.ts` — pure detection helpers, zero SDK imports (fileExists, requirement-ID extraction, issue shaping). Direct port of current logic, unit-testable without the SDK.
  - `index.ts` — server entry: `import { Plugin } from "@opencode/plugin"`, `export default Plugin.define({ id, setup })`. Minimal setup (no server-side hooks needed for watchers; toast lives client-side).
  - `tui.ts` — CLI entry: `import { Plugin } from "@opencode/plugin/tui"`, `Plugin.define({ id: "<name>.tui", setup(context) })`, `context.data.listen` filtering `details.type === "file.edited"`, checks from `shared.ts`, `context.ui.toast.show(...)`. Returns unsubscribe for cleanup.
  - `package.json` — `{"name": ..., "type": "module", "exports": {".": "./index.ts", "./tui": "./tui.ts"}}` mirroring the documented published-package shape so both entries resolve.
- **`session-knowledge`** (server-only): `index.ts` + `shared.ts`, no `tui.ts`:
  - `session.idle` via `ctx.event.subscribe({ signal })` in a void async loop; cleanup aborts the controller (documented pattern).
  - Messages via `ctx.session.context({ sessionID })`; defensive access to message shape (`unknown` casts — exact `SessionMessageInfo` part layout verified at runtime, T-017).
  - Knowledge injection via `ctx.session.hook("compaction", (event) => { event.system.push({ type: "text", text }) })` replacing `experimental.session.compacting` + `output.context.push`.
- **Root manifest**: `.opencode/package.json` dependency `@opencode-ai/plugin@1.18.30` → `@opencode/plugin@2.0.12` (verified on npm registry 2026-09-21) + lockfile regen.
- **Debounce state**: per-process `Set`/`Map` as today. Note: tui plugins run per terminal client — two terminals may double-toast; acceptable for advisory, documented in-file.
- **Open verification items** (T-016/017): `file.edited` event name in the v2 stream, toast `info`/`error` variants, `environment` key on local MCP servers, agent-file `mode: subagent` acceptance, JSON `path` on agents.

### 3.2 Config generation (FR-005–FR-006)

- **Location**: `installer/platforms/opencode.ts`
- Rewrite `generateOpenCodeConfig` to emit native V2:
  - `agents` (was `agent`): entries `{...prior, model?, path?}`; read legacy `agent` + native `agents` on input, V2 wins per entry, write `agents` only.
  - `permissions[]` (was `permission.bash` + top-level tool keys): ordered specific→general; `shell` (was `bash`), single `edit: ask` (covers old `edit`+`write`), `read/glob/grep/skill/question: allow`. Seeded on fresh install only — never rewrite an existing block of either shape (security posture unchanged).
  - `mcp.servers` (was flat `mcp`): keep user flat entries verbatim, write FORGE servers under `servers` (bounded mixing inside `mcp` is explicitly supported by v2).
  - Keep `default_agent`, `model`, `instructions` (no-migration fields per v2 guide).
- `FORGE_MANAGED_KEYS`: `agent` → `agents` (keep `mcp` — still the managed top-level key, now with `servers` inside).
- Templates `.opencode/templates/opencode.json` + `opencode.json.example-customized`: `provider` → `providers` (`options` → `settings` on models), `agent` → `agents` (drop bare `variant`), `permission` → `permissions[]`, `mcp` → `mcp.servers`. Root `opencode.json` (dogfooding config) migrated the same way.

### 3.3 Frontmatter + projection adapters (FR-007)

- Agents (9 files): `permission:` → `permissions:` (array `{action, resource, effect}`; actions renamed `bash`→`shell`, `task`→`subagent`, `write`→`edit`); drop bare `variant: high` (V1 `variant` without `model` is meaningless once `model#variant` is the mechanism); **keep** `mode: subagent` (v2 file key `mode` exists for `primary`; `subagent` acceptance is a runtime verify item, D-3 verdict: keep).
- Commands (24 files): `subtask: true` → `subagent: true`. Body text mentioning "subtask via Task tool" stays (Task-tool invocation is still the mechanism).
- `installer/platforms/claude-code.ts`: `DROPPED_AGENT_KEYS` += `permissions`; `DROPPED_COMMAND_KEYS` += `subagent`; `TOOL_MAP` += `shell→Bash`, `subagent→Task` (keep legacy keys); new `mapPermissionsArray()` extracting `action:` values from the V2 array form, non-`*` resources recorded as NOTEs.
- `installer/platforms/codex.ts`: command denylist += `subagent` (agents already ship body-only, unaffected).
- Smoke fixture `tests/smoke/opencode.smoke.test.ts:58` keeps V1 `permission` deliberately (v2 normalizes V1; smoke harness is version-sensitive and not run here).

## 4. File Map

### Files to Create

| Path | Purpose | Size |
| --- | --- | --- |
| `.forge/specs/010-opencode-v2-support/plan.md` | This plan | S |
| `.opencode/plugins/pre-commit-gate/{index,shared,tui,package}.json/ts` | V2 watcher plugin (4 files) | M |
| `.opencode/plugins/spec-watcher/{index,shared,tui,package}.json/ts` | V2 watcher plugin (4 files) | M |
| `.opencode/plugins/session-knowledge/{index,shared}.ts` | V2 server plugin (2 files, no tui) | M |

### Files to Modify

| Path | Section/Lines | Change | Effort |
| --- | --- | --- | --- |
| `.forge/specs/010-opencode-v2-support/{spec,tasks}.md` | D-1, T-001 | Record cut verdict, tick T-001 | S |
| `installer/platforms/opencode.ts` | `FORGE_MANAGED_KEYS`, `generateOpenCodeConfig`, `defaultPermissions` | Native V2 emission + merge | M |
| `.opencode/templates/opencode.json`, `opencode.json.example-customized` | Whole file | Native V2 shape | S |
| `opencode.json` (root) | `agent`, `provider`, `permission`, `mcp` blocks | Dogfood native V2 | S |
| `.opencode/agents/*.md` (9) | Frontmatter | `permission`→`permissions`, drop bare `variant` | S |
| `.opencode/commands/*.md` (~20) | Frontmatter | `subtask`→`subagent` | S |
| `installer/platforms/claude-code.ts` | `TOOL_MAP`, denylists, `projectClaudeAgent` | V2 array permissions | M |
| `installer/platforms/codex.ts` | Command denylist | Drop `subagent` | S |
| `.opencode/package.json`, `.opencode/package-lock.json` | deps | `@opencode/plugin@2.0.12` | S |
| `tests/unit/platforms.test.ts` | Config assertions | `permissions`/`agents`/`mcp.servers` | S |
| `tests/unit/contract.test.ts:144-153` | Plugin install test | Directory layout + new manifest dep | S |
| `tests/unit/projection-platforms.test.ts` | Claude/Codex assertions | V2 key drops, tools mapping | S |
| `INSTALL.md`, `README.md`, `.opencode/docs/FORGE-CUSTOMIZATION.md`, `.opencode/docs/UPDATING-FORGE.md` | Plugin/config sections | v2 prerequisite, freeze-tag pointer | M |

### Files to Delete

| Path | Reason | Migration Notes |
| --- | --- | --- |
| `.opencode/plugins/pre-commit-gate.ts` | Superseded by `pre-commit-gate/` directory | Logic moves to `shared.ts` verbatim |
| `.opencode/plugins/session-knowledge.ts` | Superseded by `session-knowledge/` directory | Logic moves to `shared.ts` verbatim |
| `.opencode/plugins/spec-watcher.ts` | Superseded by `spec-watcher/` directory | Logic moves to `shared.ts` verbatim |

### Files to Reference (Read-only)

| Path | Purpose |
| --- | --- |
| `.forge-meta/constitution.md` | Validate decisions (5 articles) |
| `opencode.ai/v2/docs/migrate-v1/`, `/v2/docs/build/plugins*` | Normative v2 shapes (fetched 2026-09-21) |

## 5. Dependencies

### 5.1 New

| Package | Version | Purpose |
| --- | --- | --- |
| `@opencode/plugin` | `2.0.12` | V2 server plugin SDK (replaces `@opencode-ai/plugin`) |

### 5.2 Internal

- `installer/frontmatter.ts` (unchanged — denylist engine already handles new keys once adapters list them)
- `installer/projection.ts` (`catalogOpenCodeOnlyArtifacts` walks directories already; no change needed)
- `installer/config.ts` (ForgeConfigModel unchanged — V2 mapping lives in the opencode adapter)

## 6. Implementation Phases

### Phase 1: Plugins

**Objective**: V2-native plugin tree; catalogue picks it up with no projection change.

**Create**: the 10 plugin files above · deps: none · effort: L
**Modify**: `.opencode/package.json` + lockfile · effort: S
**Delete**: 3 legacy `.ts` files · effort: S
**Tasks**: T-001 (verdict, done by this plan), T-002–T-005.

### Phase 2: Config + frontmatter + adapters

**Objective**: fresh installs emit native V2; canonical files use native keys; Claude/Codex output unchanged in meaning.

**Modify**: `installer/platforms/opencode.ts`, templates, root `opencode.json`, 9 agents, ~20 commands, both adapters · effort: L total, parallelizable per file group.
**Tasks**: T-006–T-010.

### Phase 3: Tests + docs + verify-what-we-can

**Objective**: gates green; docs point at v2 + freeze tag.

**Modify**: 3 test files, 4 docs · effort: M.
**Tasks**: T-011–T-015, then T-019 bookkeeping. T-016–T-018 stay open (need v2 runtime / dual-model review).

## 7. Testing Strategy

### 7.1 Unit Tests

| Component | Test Focus |
| --- | --- |
| `generateOpenCodeConfig` | Fresh output has `agents`/`permissions`/`mcp.servers`, no `agent`/`permission`; V1 user config merges (keys kept, FORGE keys native); non-object guards warn naming the right key |
| Claude projection | `permissions:` dropped, tools mapped incl. `shell`/`subagent`, non-`*` resources → NOTE; `subagent:` dropped from commands |
| Contract | Plugin dirs + `index.ts`/`tui.ts` + manifest dep installed; identity projection still covers `plugins/` recursively |
| Shared plugin helpers | Pure functions (requirement-ID extraction, issue shaping) importable without SDK — new lightweight suite |

### 7.2 Integration Tests

| Scenario | Dependencies |
| --- | --- |
| `run()` backup flow with V1 user config | Merged native output preserves `theme`/`model` (existing FR-010 tests, updated expectations) |
| Second-run idempotency | Unchanged (checksum engine untouched) |

## 8. Architectural Decisions

| ADR | Decision | Status |
| --- | --- | --- |
| D-1 | Clean V2-only cut, no dual `server()` shape (freeze tag covers v1) | Decided (this plan) |
| D-2 | Emit native V2 for generated files; accept V1 on input (merge) | Decided (spec) |
| D-3 | Keep `mode: subagent` + JSON `path`; runtime-verify on v2 | Decided (this plan) |
| Toast | Watchers split server/tui; session-knowledge server-only | Decided (this plan) |

## 9. Requirement Traceability

| Requirement | Plan Section | Implementation Path |
| --- | --- | --- |
| FR-001 | §3.1, §6 Phase 1 | `.opencode/plugins/pre-commit-gate/` |
| FR-002 | §3.1, §6 Phase 1 | `.opencode/plugins/session-knowledge/` |
| FR-003 | §3.1, §6 Phase 1 | `.opencode/plugins/spec-watcher/` |
| FR-004 | §3.1 | `.opencode/package.json` + per-dir exports |
| FR-005 | §3.2, §6 Phase 2 | `installer/platforms/opencode.ts` |
| FR-006 | §3.2 | `FORGE_MANAGED_KEYS` + merge |
| FR-007 | §3.3, §6 Phase 2 | agents/commands + both adapters |
| FR-008 | §7 | `tests/unit/*.test.ts` |
| FR-009 | §6 Phase 3 | INSTALL/README/CUSTOMIZATION/UPDATING |
| FR-010 | §3.1 open items | Manual (T-016/017, blocked on v2 runtime) |
| NFR-001–004 | §7 | No new installer imports; idempotency/typecheck gates |

## 10. Constitution Compliance

| Article | Status | Notes |
| --- | --- | --- |
| Art. 1 | Compliant | Dual-model review + task tracking preserved |
| Art. 2 | Compliant | Installer stays `node:*`-only; plugin SDK swap is same-category (platform SDK) |
| Art. 3 | Compliant | MCP server untouched; plugins remain OpenCode-only projection |
| Art. 4 | Compliant | Contract/unit gates updated, not weakened |
| Art. 5 | Compliant | English artifacts; kebab-case/camelCase untouched |

---

## Cross-References

| Document | Path |
| --- | --- |
| Spec | `.forge/specs/010-opencode-v2-support/spec.md` |
| Tasks | `.forge/specs/010-opencode-v2-support/tasks.md` |
| Constitution | `.forge-meta/constitution.md` |
