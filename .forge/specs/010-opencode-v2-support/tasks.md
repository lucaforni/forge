# Tasks — 010 OpenCode v2 Compatibility

| Field | Value |
|---|---|
| **Spec** | [`spec.md`](spec.md) |
| **Status** | In Progress (T-001–T-015 done; T-016–T-019 open) |
| **Track** | Feature |

Sizing: `[S]` <30min · `[M]` 30min–2h · `[L]` 2–4h · `[P]` parallelizable

Freeze tag `v2.0.0-opencode-v1-last` already placed on `3476f55` (do not move it).

---

## Phase 1 — Plugin port (`[FR-001]`–`[FR-004]`)

- [x] T-001 `[M]` `[FR-004]` `[D-1]` Decide dual `server()+setup()` vs V2-only cut → **verdict: clean V2-only cut** (freeze tag covers v1; see `plan.md` §2)
      → `.forge/specs/010-opencode-v2-support/spec.md`, `plan.md`
- [x] T-002 `[L]` `[FR-001]` Port `pre-commit-gate.ts` to `Plugin.define({id, setup})`: `file.edited` via `ctx.event.subscribe`, toast via v2 path, `setup` cleanup for debounce timers
      → `.opencode/plugins/pre-commit-gate/` (`index.ts` server entry + `tui.ts` toast entry + `shared.ts` pure helpers + `package.json` exports map). Toast delivery had to move client-side: server API has no toast surface (verified in v2 plugin docs 2026-09-21)
- [x] T-003 `[L]` `[FR-002]` Port `session-knowledge.ts`: idle extraction via event subscription + `ctx.session` read, knowledge injection via `ctx.session.hook("compaction", …)`, state via `ctx.storage`, dedup set preserved
      → `.opencode/plugins/session-knowledge/` (`index.ts` server-only, no tui + `shared.ts`). In-memory dedup set kept (no durable state needed); `experimental.session.compacting` → `compaction` hook with `event.system.push`
- [x] T-004 `[M]` `[FR-003]` Port `spec-watcher.ts` (same subscribe+toast pattern; FR/NFR-ID diff logic unchanged)
      → `.opencode/plugins/spec-watcher/` (`index.ts` + `tui.ts` + `shared.ts` + `package.json`)
- [x] T-005 `[S]` `[FR-004]` Update `.opencode/package.json` (+ lockfile) to the v2 plugin package; keep or drop `1.18.30` per T-001 verdict
      → `.opencode/package.json`, `.opencode/package-lock.json` now `@opencode/plugin@2.0.12` (registry-verified; lockfile regenerated via `npm install --package-lock-only`). All 8 plugin files typecheck clean (`--strict`) against the real SDK in scratch dir

## Phase 2 — Config generation (`[FR-005]`–`[FR-006]`)

- [x] T-006 `[M]` `[FR-005]` Emit native V2 in `generateOpenCodeConfig`: `permissions[]`, `agents` (`system`/`disabled`/`model#variant`/`permissions[]`), `providers` (`package`+`settings`), `mcp.servers` (`disabled`, split `timeout`); move `request.body` fields (`temperature`, `top_p`, provider `options`)
      → `installer/platforms/opencode.ts`, `installer/config.ts`. Done: `permissions[]` (ordered, shell/edit actions), `agents` (V1 folded in, V2 wins), `mcp.servers` (flat user entries preserved). `ForgeConfigModel` carries no temperature/variant/timeout data, so no `request.body`/timeout emission was needed — internal model unchanged by design
- [x] T-007 `[M]` `[FR-006]` Update `FORGE_MANAGED_KEYS` + merge: user V1 keys preserved verbatim, regenerated keys native, V2-wins-on-conflict, no nested V1/V2 mixing inside one entry
      → `installer/platforms/opencode.ts`, `installer/install.ts` (no `install.ts` change needed — merge lives in the emitter). Legacy `agent` folds into `agents` and is dropped; legacy `permission` is never rewritten; `FORGE_MANAGED_KEYS` now lists `agents`
- [x] T-008 `[S]` `[P]` `[FR-005]` Refresh fallback templates (`templates/opencode.json`, `opencode.json.example-customized`) to native V2 shape
      → `.opencode/templates/opencode.json`, `.opencode/templates/opencode.json.example-customized` (+ root `opencode.json` dogfooded to native V2)

## Phase 3 — Frontmatter renames (`[FR-007]`)

- [x] T-009 `[M]` `[P]` `[FR-007]` Rename agent frontmatter (`variant`→`model#variant`, `task`→`subagent`, `bash`→`shell`, `write`/`patch`→`edit`); resolve `mode: subagent` per D-3
      → `.opencode/agents/*.md`. Done via script: `permission:`→`permissions[]` (order+semantics preserved), bare `variant: high` dropped (meaningless without a model), `mode: subagent` kept per D-3 (runtime verify). One script bug caught and fixed: nested `bash:` rules were dropped on first pass — restored from git and re-converted, verified per file
- [x] T-010 `[M]` `[P]` `[FR-007]` Rename command frontmatter (`subtask`→`subagent`, `variant`→`model#variant`); sanity-check background-delegation wording in dual-review commands
      → `.opencode/commands/*.md`. 17/17 `^subtask:` → `^subagent:`; only prose mention left is `forge-implement.md` body ("review subtask", still accurate Task-tool language). Adapters updated in the same pass: Claude `TOOL_MAP` + `mapPermissionsArray()` + denylists, Codex command denylist

## Phase 4 — Tests (`[FR-008]`, `[NFR-002]`–`[NFR-003]`)

- [x] T-011 `[M]` `[FR-004]` Update contract test: plugin manifest assertion matches new package + 3 ported plugins
      → `tests/unit/contract.test.ts` (directory layout, tui entries on watchers only, `@opencode/plugin` present / `@opencode-ai/plugin` absent)
- [x] T-012 `[M]` `[FR-005]` `[FR-006]` Unit tests: fresh config has no singular legacy keys; V1 user config merges (keys kept, FORGE keys native)
      → `tests/unit/config.test.ts`, `tests/unit/platforms.test.ts` (rewritten: native assertions + legacy-fold + native-wins + never-rewrite-permissions)
- [x] T-013 `[S]` `[FR-007]` Coherence test: zero legacy frontmatter keys in distributed agents/commands
      → `tests/unit/plugins.test.ts` (new, 18 tests: shared helpers for all 3 plugins + `mapPermissionsArray`). Coherence suite itself needed no change (markdown vocabularies untouched)
- [x] T-014 `[S]` `[NFR-002]` `[NFR-003]` Idempotency re-run + `tsc --noEmit` (≤ baseline) + full `npm test`
      → 298/298 green, `tsc` 0 errors (baseline was ≤20), coverage gate passes (87.5% lines / 82.5% branches / 82.8% funcs)

## Phase 5 — Docs (`[FR-009]`)

- [x] T-015 `[M]` `[P]` `[FR-009]` Document v2 prerequisite (remove package-managed v1), `cli.json` auto-migration, what was ported, freeze-tag pointer
      → `INSTALL.md` (v2 callout + SDK row), `README.md` (v2 note), `.opencode/docs/FORGE-CUSTOMIZATION.md` (v2 banner + §9.1/9.2/9.3 rewritten to server/tui shape + §10.1 `mcp.servers`), `.opencode/docs/UPDATING-FORGE.md` (merge table v2 note + v2 key names in example), `.forge-meta/constitution.md` (SDK name). Deliberately not rewritten: working V1 config snippets (v2 normalizes them — banner covers them) and historical specs/ADRs

## Phase 6 — Verification (`[FR-010]`)

- [ ] T-016 `[M]` `[FR-010]` V2 setup check on a scratch project: models, credentials, agents, permissions, MCP servers, plugin list
- [ ] T-017 `[M]` `[FR-001]`–`[FR-003]` Exercise every ported hook/transform/tool + reload/cleanup + clean-project options/state
- [ ] T-018 `[S]` Run `/forge-review` (dual-model) on the diff; resolve CRITICAL findings
- [ ] T-019 `[S]` Tick off completed tasks above (no abandoned tracking artifact); flip spec Status → Implemented

## Phase 7 — Review fixes (`[FR-005]`, `[FR-006]`, spec 004 `[FR-008]`)

Verification pass against the V2 docs surfaced two defects in the generated config. Both fixed.

- [x] T-020 `[M]` `[FR-005]` Fix permission-array ordering. V2 evaluates the array with **last-match-wins**, so the broad `shell * → ask` must precede the specific allows. The previous `specific → general` order made the catch-all shadow every allow, leaving the allowlist inert. `defaultPermissions()` and both fallback templates reordered; `shell` exceptions use the documented `"cmd *"` idiom. Regression tests resolve the effective effect with last-match-wins semantics (`effectiveEffect` in `tests/unit/platforms.test.ts`)
      → `installer/platforms/opencode.ts`, `.opencode/templates/opencode.json`, `.opencode/templates/opencode.json.example-customized`
- [x] T-021 `[M]` `[FR-006]` `[FR-008]` Fix governance loading. V2 accepts but **does not resolve** the `instructions` key, so the constitution and decision log never reached the model. `session-knowledge` now registers a `context` hook that injects `.forge/constitution.md` + recent decision-log entries into every model request (mtime/size-cached). `instructions` stays as a V1-compat key with an accurate comment
      → `.opencode/plugins/session-knowledge/{index,shared}.ts`, `tests/unit/plugins.test.ts`
- [x] T-022 `[S]` Remediate Dependabot alert #19 (GHSA-8988-4f7v-96qf): `@opentelemetry/core < 2.8.0` reached transitively through `@opencode/plugin` → `@opencode/util`. Upstream still pins core `2.6.1` at `@opencode/util@2.0.15`, so an npm `overrides` entry pins `@opentelemetry/core` to `2.8.0` (the first patched release). `npm audit` clean; installer contract test still green
      → `.opencode/package.json`, `.opencode/package-lock.json`

---


## Summary

| Metric | Value |
|---|---|
| Total tasks | 19 (T-001–T-019) |
| Total phases | 6 |
| Parallelizable tasks | T-008, T-009, T-010, T-015 (`[P]`) |
| Requirements covered | FR-001–FR-010, NFR-001–NFR-004 |

---

## Cross-References

| Document | Path |
|---|---|
| Spec | `.forge/specs/010-opencode-v2-support/spec.md` |
| Freeze tag | `v2.0.0-opencode-v1-last` |
| Plan | (via `/forge-plan` if Feature track requires it) |
