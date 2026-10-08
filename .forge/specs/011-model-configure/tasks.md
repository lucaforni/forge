# Tasks: 011 - Automatic Model Reconfiguration + Policy Routing

> Ordered task breakdown with parallelism markers and requirement traceability.
> Created by `forge-scrum` via `/forge-tasks`.

| Field   | Value       |
| ------- | ----------- |
| Status  | Pending     |
| Author  | forge-scrum |
| Date    | 2026-10-08  |
| Spec    | `.forge/specs/011-model-configure/spec.md` (Clarified) |
| Plan    | `.forge/specs/011-model-configure/plan.md` (Revised 2026-10-08; ADR-004/005/006 Accepted) |

---

## Legend

- `[FR-NNN]` / `[NFR-NNN]` — requirement implemented (traceability)
- `[P]` — parallelizable with other `[P]` tasks in the same phase
- Size: S <30m · M 30m–2h · L 2–4h (no XL; all split)
- Status: `[ ]` pending · `[x]` done · `[-]` skipped
- Paths relative to repo root. Tests live in `tests/unit/` (Vitest, `installer/**` coverage gate 85/78/80).
- **Convention (applies to every task):** no new runtime deps; English-only user strings; kebab-case files, camelCase fns; every abort message states what + why + next command (NFR-006).

---

## Phase 1: Preset projection (dual-target) + scaffold entry  — plan §2.4, §7 P1, ADR-004

- [x] **1.1** `[M]` `[FR-001]` `[FR-006]` Add create-once `user-template` projection of presets
  - **File**: `installer/projection.ts`
  - **Type**: Modify
  - **Description**: Add `USER_TEMPLATE_FILES` set (mirror `SCAFFOLD_FILES`) projecting `templates/presets.json` → `.forge/presets.json`, category `user-template`, existence check (never overwritten on update). **Keep `"presets.json"` in `EXCLUDED_TEMPLATES`** so the neutral path still emits the `config` fallback at `.forge/templates/presets.json` (B-2). One source, two targets.
  - **Spec/Plan**: spec §7, §12; plan §2.4, §5
  - **Dependencies**: None
  - **Estimated**: 1–1.5h
  - **Done 2026-10-08 (Forge, implement)**: implemented as `USER_TEMPLATE_FILES` + `catalogUserTemplateFiles()` wired into `catalogForgeArtifacts`. DEVIATION NOTE: `"presets.json"` was REMOVED from `EXCLUDED_TEMPLATES` (not kept) — keeping it ships nothing through the neutral path (excluded = skipped), which contradicts spec §12 ("Remove … from EXCLUDED_TEMPLATES"), the ADR-004 Accepted table (fallback EXISTS at `.forge/templates/presets.json`), FR-006, and task 1.2's own assertion (b). `contract.test.ts` updated to assert the fallback ships. Net effect is exactly "one source, two targets".

- [x] **1.2** `[M]` `[FR-001]` Projection unit test for dual-target
  - **File**: `tests/unit/projection-presets.test.ts` (or extend existing projection test)
  - **Type**: Create
  - **Description**: Assert (a) `.forge/presets.json` planned exactly once as `user-template` and skipped when it already exists (update path); (b) `.forge/templates/presets.json` still planned as `config`; (c) both come from the single built-in source.
  - **Spec/Plan**: plan §7 P1 task 2, §8.2
  - **Dependencies**: 1.1
  - **Estimated**: 1h
  - **Done 2026-10-08 (Forge, implement)**: added `describe("presets.json dual-target projection")` in `tests/unit/projection.test.ts` (3 tests: catalog categories+identical checksum, fresh-install creates both, tuned active skipped while fallback refreshes). `contract.test.ts` "generated configs" test split + new fallback/active test. Targeted suites: 114/114 pass.

## Phase 2: `installer/model-config.ts` lib — plan §4.1, §7 P2–P3

> **Done 2026-10-08 (Forge, implement)**: all 2.1–2.11 implemented in `installer/model-config.ts` (~600 lines: resolvePresets, selectTierModels, buildManagedKeys, checkAvailability, mergeManagedKeys, backup/write, computeCostHint, detectRepoVisibility, evaluatePrivacyGate, applyReconfigure/runReconfigure) + 2.11 `buildDefaultConfig(projectRoot, {provider})` preset override in `installer/config.ts` (no-opts callers unchanged). Deviations: (a) non-targeted tiers keep `agentModels` defaults (not `alternatives[0]`); (b) 2.10 kept whole (no split needed); (c) top-level `model` = selected execution model.

- [x] **2.1** `[M]` `[FR-001]` `[FR-006]` `[NFR-005]` Module skeleton + `MODEL_MANAGED_KEYS` + `resolvePresets`
  - **File**: `installer/model-config.ts`
  - **Type**: Create
  - **Description**: Export types, `MODEL_MANAGED_KEYS = ["model","providers","agents"]` (distinct from `FORGE_MANAGED_KEYS`, §2.5). `resolvePresets(projectRoot)`: `.forge/presets.json` > `.forge/templates/presets.json`/built-in; missing/corrupt → fallback + `Standalone — not chained` warning. JSONC-safe via `stripJsonComments`. No network.
  - **Spec/Plan**: plan §2.5, §4.1
  - **Dependencies**: 1.1
  - **Estimated**: 1.5h

- [x] **2.2** `[M]` `[FR-003]` `selectTierModels` policy matrix
  - **File**: `installer/model-config.ts`
  - **Type**: Modify
  - **Description**: quality→`alternatives.reasoning[0]`; speed→`alternatives.execution[0]`; cheap→cheapest/prefer `-free` of `alternatives.execution`, falling back to `agentModels.execution.model` (may be paid). Missing/invalid policy → usage error (exit 2) listing valid values.
  - **Spec/Plan**: plan §3 matrix
  - **Dependencies**: 2.1
  - **Estimated**: 1h

- [x] **2.3** `[M]` `[FR-003]` `buildManagedKeys` (agent→tier assignment)
  - **File**: `installer/model-config.ts`
  - **Type**: Modify
  - **Description**: Return `{model, providers, agents}`; pm/architect/reviewer/ux→reasoning; forge/scrum/qa/analyst→execution; `forge-reviewer-peer`→peer with different family than `forge-reviewer`. Deterministic key ordering (NFR-004).
  - **Spec/Plan**: spec US-002; plan §4.1
  - **Dependencies**: 2.2
  - **Estimated**: 1–1.5h

- [x] **2.4** `[S]` `[FR-005]` `[NFR-006]` `[P]` `checkAvailability`
  - **File**: `installer/model-config.ts`
  - **Type**: Modify
  - **Description**: Verify each tier model is in preset model list; on miss return `ok:false` + missing[] + fallback hint (alternative `--policy` / other preset) → exit 1, no write. No silent downgrade.
  - **Spec/Plan**: spec edge 1; plan §4.1
  - **Dependencies**: 2.2
  - **Estimated**: 30m

- [x] **2.5** `[M]` `[FR-002]` `[FR-008]` `[NFR-003]` `[NFR-004]` `mergeManagedKeys` (seed-once bypass)
  - **File**: `installer/model-config.ts`
  - **Type**: Modify
  - **Description**: Replace only `MODEL_MANAGED_KEYS`; preserve all other keys byte-identical; return `{next, changed, preservedKeys[]}`; no-op detection. **MUST NOT route via `generateOpenCodeConfig`** (§4.1a seed-once). Within `agents`, rewrite only each entry's `model` field.
  - **Spec/Plan**: plan §4.1, §4.1a
  - **Dependencies**: 2.3
  - **Estimated**: 1.5–2h

- [x] **2.6** `[M]` `[FR-002]` `[FR-008]` `[NFR-003]` Timestamped backup + write
  - **File**: `installer/model-config.ts`
  - **Type**: Modify
  - **Description**: `opencode.json.bak.<YYYYMMDD-HHMMSS>` written before any differing write; exactly one per apply; none when unchanged. Injectable clock for deterministic tests.
  - **Spec/Plan**: spec §7; plan §2.4
  - **Dependencies**: 2.5
  - **Estimated**: 1h

- [x] **2.7** `[M]` `[FR-004]` `[P]` `computeCostHint`
  - **File**: `installer/model-config.ts`
  - **Type**: Modify
  - **Description**: Per-tier free/paid + strong/cheap lines; `paidUpgrade` true on free→paid vs prev models; paid tier from `cheap` is labelled paid (no free claim).
  - **Spec/Plan**: spec US-003; plan §4.1, §8.1 (cheap→paid)
  - **Dependencies**: 2.2
  - **Estimated**: 1h

- [x] **2.8** `[S]` `[FR-007]` `[NFR-005]` `[P]` `detectRepoVisibility`
  - **File**: `installer/model-config.ts`
  - **Type**: Modify
  - **Description**: Best-effort `gh repo view --json isPrivate` → `git remote`; return `public|private|unknown`; offline/error → `unknown` (treated private, assumption stated). Injectable exec for tests.
  - **Spec/Plan**: ADR-006; spec §7
  - **Dependencies**: 2.1
  - **Estimated**: 45m

- [x] **2.9** `[M]` `[FR-007]` `evaluatePrivacyGate`
  - **File**: `installer/model-config.ts`
  - **Type**: Modify
  - **Description**: `-free` → notice always; private/unknown + no `--allow-free-private`/`--yes` → block (non-interactive fails closed with exact flag). Non-`-free` tiers → no notice, gate suppressed.
  - **Spec/Plan**: spec US-003, edge 4; ADR-006
  - **Dependencies**: 2.3, 2.8
  - **Estimated**: 1h

- [x] **2.10** `[L]` `[FR-009]` `[FR-004]` `[FR-005]` `[FR-007]` `[NFR-006]` `applyReconfigure` orchestration + rendering + exit codes
  - **File**: `installer/model-config.ts`
  - **Type**: Modify
  - **Description**: Order: resolve → select → build → availability → cost → privacy → merge → (dry-run | backup+write | unchanged). Exit 0/1/2. Render output blocks (a)–(f) per spec §9 (plain text). `--list` renderer (FR-001). `--dry-run` prints tier table + diff summary, no write. `--yes` confirms paid upgrade.
  - **Spec/Plan**: spec §8, §9; plan §3, §4.1
  - **Dependencies**: 2.4, 2.6, 2.7, 2.9
  - **Estimated**: 2.5–3.5h ⚠ near-L ceiling; split into 2.10a (orchestrate + exit codes) and 2.10b (render + `--list` + `--dry-run`) if it exceeds 3h

- [x] **2.11** `[M]` `[FR-001]` Preset-driven defaults in `installer/config.ts`
  - **File**: `installer/config.ts`
  - **Type**: Modify (`DEFAULT_MODEL` L45, `REASONING_MODEL`/`PEER_REVIEW_MODEL` L57-58, `defaultAgentConfigs` L61-73)
  - **Description**: Derive defaults from resolved preset when available; keep constants as fallback. Must not change output for existing installs/tests. **Scope guard:** touches the installer fresh-install path—keep diff minimal; if existing installer tests break beyond constant plumbing, defer to follow-up spec rather than expand.
  - **Spec/Plan**: spec §12; plan §5
  - **Dependencies**: 2.1
  - **Estimated**: 1–1.5h

## Phase 3: Command file + `--reconfigure` alias — plan §4.2–4.3, §7 P4

- [x] **3.1** `[M]` `[FR-001]` `[FR-003]` `[FR-009]` Author command file
  - **File**: `.opencode/commands/forge-model-configure.md`
  - **Type**: Create
  - **Description**: Frontmatter `agent: forge` (mirror `forge-quick.md`); args/flags, policy matrix, exit codes, output-block contract, examples (`--list`, apply, `--dry-run`, CI flags). Thin: delegates to lib, no branching logic. English only.
  - **Spec/Plan**: spec §8, §9; plan §4.2
  - **Dependencies**: 2.10
  - **Estimated**: 1h

- [x] **3.2** `[M]` `[FR-001]` `[P]` Wire `--reconfigure` alias
  - **File**: `install-forge.ts`
  - **Type**: Modify
  - **Description**: Delegate `--reconfigure` to `installer/model-config.ts` if trivial; else print one-line note pointing to `/forge-model-configure`. Preserve existing flag behaviour.
  - **Spec/Plan**: ADR-005; plan §4.3
  - **Dependencies**: 2.10
  - **Estimated**: 1h (≤1.5h)

- [x] **3.3** `[S]` `[P]` Update "To reconfigure" comment
  - **File**: `.opencode/templates/opencode.json` (L15-17)
  - **Type**: Modify
  - **Description**: Point to `/forge-model-configure`; keep `--reconfigure` as alias mention.
  - **Spec/Plan**: spec §12
  - **Dependencies**: 3.1
  - **Estimated**: 15m

## Phase 4: Unit + snapshot tests — plan §8.1/§8.1a

> **Done 2026-10-08 (Forge, implement, with Phase 2)**: `tests/unit/model-config.test.ts` — 40 tests covering 4.1–4.5 in one file (inline fixtures instead of `fixtures/model-config/` dir; determinism asserted via stringify-equality rather than snapshot files). 40/40 pass.

- [x] **4.1** `[L]` `[FR-001]` `[FR-006]` `[FR-003]` `[NFR-005]` Fixtures + resolve/select/build tests
  - **File**: `tests/unit/model-config.test.ts`, `tests/unit/fixtures/model-config/`
  - **Type**: Create
  - **Description**: Fixture `opencode.json` (customized: permissions, mcp, instructions, subagent_depth) + preset variants (free-capable, paid-only). Tests: resolve precedence/missing/corrupt+warning; quality/speed/cheap matrix; unknown policy→exit 2; peer≠reviewer family; **cheap→paid** row (paid-only preset resolves paid; fallback to `agentModels.execution.model`).
  - **Dependencies**: 2.3
  - **Estimated**: 2.5h

- [x] **4.2** `[L]` `[FR-002]` `[FR-008]` `[NFR-003]` `[NFR-004]` Merge/backup/idempotency + snapshots
  - **File**: `tests/unit/model-config.test.ts`
  - **Type**: Modify
  - **Description**: Only managed keys change, others byte-identical, preserved-key count; differing apply → exactly one `.bak.<ts>`; same args twice → "unchanged", exit 0, no backup; **model seed-once bypass** (existing `model` is replaced); snapshots: managed-keys determinism + full merged `opencode.json`.
  - **Dependencies**: 2.6, 4.1
  - **Estimated**: 2–2.5h

- [x] **4.3** `[M]` `[FR-004]` `[FR-007]` `[FR-005]` Gates tests incl. cheap→paid
  - **File**: `tests/unit/model-config.test.ts`
  - **Type**: Modify
  - **Description**: availability miss→exit 1 no write; cost hint per tier; paid upgrade needs `--yes`; **cheap→paid: tier marked paid, confirm fires, no privacy notice**; visibility `gh` ok/offline→`unknown`; privacy gate: `-free` notice always, private block, non-interactive fail-closed, flags confirm, paid tier suppressed.
  - **Dependencies**: 2.9, 4.1
  - **Estimated**: 2–2.5h

- [x] **4.4** `[M]` `[FR-009]` `[NFR-006]` Exit codes, `--dry-run`, message-quality tests
  - **File**: `tests/unit/model-config.test.ts`
  - **Type**: Modify
  - **Description**: Exit 0/1/2 matrix; dry-run prints table+diff and writes nothing (no backup); every abort message contains what + why + next command.
  - **Dependencies**: 2.10, 4.1
  - **Estimated**: 1.5h

- [x] **4.5** `[S]` `[FR-002]` `[P]` Two-list invariant test (B-1)
  - **File**: `tests/unit/model-config.test.ts`
  - **Type**: Modify
  - **Description**: `MODEL_MANAGED_KEYS` = `[model,providers,agents]`; intersection with `FORGE_MANAGED_KEYS` is exactly `{agents}`; `providers` model-only; lists neither equal nor nested.
  - **Dependencies**: 2.1
  - **Estimated**: 30m

- [x] **4.6** `[M]` Run coverage gate and fix gaps
  - **Command**: `npm test && npm run typecheck && npm run test:coverage`
  - **Expected**: green; thresholds ≥85/78/80 maintained with `installer/model-config.ts` included; add tests for uncovered branches.
  - **Dependencies**: 4.1–4.5, 2.11, 3.2
  - **Estimated**: 1h

## Phase 5: Smoke + docs + closeout — plan §8.2

- [x] **5.1** `[M]` `[NFR-001]` `[NFR-005]` Timed offline smoke
  - **File**: `tests/smoke/model-configure.smoke.test.ts` (offline, no provider key needed; use unit-style config if `vitest.smoke.config.ts` requires keys)
  - **Type**: Create
  - **Description**: Reconfigure on fixture project with network stubbed off; assert wall time <2 min (NFR-001), success offline (NFR-005). Also a review assertion/grep-test that no per-task LLM/network call exists in routing (NFR-002).
  - **Dependencies**: 2.10
  - **Estimated**: 1.5h

- [x] **5.2** `[M]` `[FR-001]` `[P]` User docs
  - **File**: `docs/` reconfigure section (or `.forge/docs/`; confirm location)
  - **Type**: Modify
  - **Description**: Document `/forge-model-configure`, policy matrix, free/privacy gate, exit codes, `--reconfigure` alias, presets resolution.
  - **Dependencies**: 3.1
  - **Estimated**: 1h

- [x] **5.3** `[S]` `[P]` CHANGELOG entry
  - **File**: `CHANGELOG.md`
  - **Type**: Modify
  - **Description**: Note feature + `presets.json` now distributed (closes #72 orphan).
  - **Dependencies**: 4.6
  - **Estimated**: 15m

- [x] **5.4** `[M]` `[ALL]` Run `/forge-review .forge/specs/011-model-configure/`
  - **Expected**: dual review (forge-reviewer + forge-reviewer-peer); fix all CRITICAL.
  - **Dependencies**: 4.6, 5.1, 5.2
  - **Estimated**: 1–2h incl. fixes

- [x] **5.5** `[S]` Decision-log closeout + spec status → Ready
  - **Files**: `.forge-meta/knowledge/decision-log.md` (+ `.forge/knowledge/` if used), `.forge/specs/011-model-configure/spec.md` (Status), this file
  - **Type**: Modify
  - **Description**: Log decisions (dual-target projection, two-list contract, seed-once bypass, fail-closed privacy, cheap→paid semantics); set spec Status → Ready; tick all task boxes; mark tasks Status Done.
  - **Dependencies**: 5.4
  - **Estimated**: 30m

---

## Summary

| Metric | Value |
| --- | --- |
| Total tasks | 28 (+1 possible split of 2.10) |
| Total phases | 5 |
| Parallelizable `[P]` | 9 (2.4, 2.7, 2.8, 3.2, 3.3, 4.5, 5.2, 5.3 + within-phase pairs) |
| Requirements covered | FR-001…009, NFR-001…006 (all) |
| Estimate | ~28–36h (≈4–5 focused days); sizes: 4×L, 17×M, 7×S |
| Scope flags | 2.10 (near L ceiling, pre-split rule); 2.11 (installer fresh-install blast radius, guard noted). Overall remains Feature track — no Epic escalation. |

### Dependency summary

| ID | Title | FR/NFR | Deps |
| --- | --- | --- | --- |
| 1.1 | user-template projection | FR-001/006 | — |
| 1.2 | projection test | FR-001 | 1.1 |
| 2.1 | skeleton + resolvePresets | FR-001/006, NFR-005 | 1.1 |
| 2.2 | selectTierModels | FR-003 | 2.1 |
| 2.3 | buildManagedKeys | FR-003 | 2.2 |
| 2.4 | checkAvailability | FR-005 | 2.2 |
| 2.5 | mergeManagedKeys | FR-002/008, NFR-003/004 | 2.3 |
| 2.6 | backup + write | FR-002/008, NFR-003 | 2.5 |
| 2.7 | computeCostHint | FR-004 | 2.2 |
| 2.8 | detectRepoVisibility | FR-007 | 2.1 |
| 2.9 | evaluatePrivacyGate | FR-007 | 2.3, 2.8 |
| 2.10 | applyReconfigure | FR-004/005/007/009 | 2.4, 2.6, 2.7, 2.9 |
| 2.11 | config.ts preset defaults | FR-001 | 2.1 |
| 3.1 | command file | FR-001/003/009 | 2.10 |
| 3.2 | `--reconfigure` alias | FR-001 | 2.10 |
| 3.3 | template comment | — | 3.1 |
| 4.1–4.5 | tests | see above | see above |
| 4.6 | coverage gate | — | 4.1–4.5, 2.11, 3.2 |
| 5.1 | timed offline smoke | NFR-001/002/005 | 2.10 |
| 5.2 | docs | FR-001 | 3.1 |
| 5.3 | changelog | — | 4.6 |
| 5.4 | `/forge-review` | ALL | 4.6, 5.1, 5.2 |
| 5.5 | decision-log + spec Ready | — | 5.4 |

---

## Cross-References

| Document | Path |
| -------- | ---- |
| Spec | `.forge/specs/011-model-configure/spec.md` |
| Plan | `.forge/specs/011-model-configure/plan.md` |
| Analysis | `.forge/specs/011-model-configure/analysis.md` |

> **Done 2026-10-08 (5.4/5.5)**: primary review NEEDS CHANGES -> all 7 findings fixed in lib+tests+spec+command (see analysis.md section 6). Peer unavailable (infra, persistent) - human review second lens. Spec -> Ready.

> **Ratifica deviazioni 2026-10-08 (human review)**: A Accetta rimozione EXCLUDED_TEMPLATES (dopo spiegazione); B/C/D Accetta. Nessun revert. Via libera a commit+PR.
