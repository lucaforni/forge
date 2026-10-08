# Plan: 011 - Automatic Model Reconfiguration + Policy Routing

> Technical implementation plan for the Feature track. Created by
> `forge-architect` via `/forge-plan`.

| Field  | Value |
| ------ | ----- |
| Status | Revised (post-analysis) |
| Author | forge-architect |
| Date   | 2026-10-06 (rev. 2026-10-08) |
| Track  | Feature |
| Spec   | `.forge/specs/011-model-configure/spec.md` |
| Reviewer | `.forge/specs/011-model-configure/analysis.md` (CONDITIONAL) |

> **Revision note (2026-10-08).** This plan was revised to clear the two
> CRITICAL contradictions and two WARNINGs raised in `analysis.md`:
> **B-1** managed-key list contradiction (resolved in §2.5 — two distinct,
> documented lists); **B-2** broken create-once projection (resolved in
> §2.4 / §5 / §7 Phase 1 — dual-target projection via a new
> `USER_TEMPLATE_FILES` scaffold entry, not a bare un-exclude); **B-3**
> seed-once bypass note (§4.1a); **B-4** `cheap`-resolves-to-paid test row
> (§8.1). ADR-004/005/006 flipped **Proposed → Accepted**. Spec unchanged.

---

## 1. Overview

This plan implements `/forge-model-configure --provider <id> --policy <quality|speed|cheap>`:
a deterministic, offline-first command that regenerates **only** the
`model` / `providers` / `agents` keys of `opencode.json` from a versioned
provider preset, with a timestamped backup, key-scoped merge, idempotency,
a per-tier cost hint, and a privacy gate for free (`-free`) models.

Approach (per ADR-004/005/006):

- **Preset source** = `.forge/presets.json` (project override, versioned) >
  built-in `.opencode/templates/presets.json` fallback. Revives the orphaned
  preset engine (#72) by adding a **create-once dual-target projection**
  (see §2.4 / §5 / ADR-004) — NOT by a bare un-exclude (see B-2 below).
- **One logic home** = `installer/model-config.ts` (unit + snapshot tested;
  inside the existing `installer/**` coverage gate). **No skill** (ADR-005).
- **Two thin front doors** = the slash command (primary) and
  `install-forge.ts --reconfigure` (alias), both delegating to the lib.
- **Static tier routing** (no per-task LLM call): reasoning agents → quality
  model, execution agents → speed/cheap model, peer → different family.
- Fully dynamic per-task switching is **out of v1** (spec §10).

There is **no `.forge/architecture/architecture.md`** in this repo — absence
noted; this plan + ADR-004/005/006 stand as the architectural record for the
feature.

## 2. Data Model

No database. "Data" here is file-based config (spec §7).

### 2.1 New Tables

N/A — no relational store.

### 2.2 Modified Tables

N/A.

### 2.3 Indexes

N/A.

### 2.4 Migrations

File-level only:
1. Projection change (ADR-004): the built-in `.opencode/templates/presets.json`
   is projected to **two** targets from one source (see §5, Phase 1):
   - `.forge/templates/presets.json` — `config` category, **regenerate-on-update**,
     the fallback the resolver reads when the project file is absent. Produced
     by the existing `catalogNeutralArtifacts` path (**`presets.json` stays in
     `EXCLUDED_TEMPLATES`** so this remains a plain neutral template).
   - `.forge/presets.json` — `user-template` category, **create-once, never
     overwritten on update**, the active file the resolver prefers (FR-001/006).
     Produced by a new `catalogScaffoldArtifacts`-style entry (a
     `USER_TEMPLATE_FILES` set mirroring `SCAFFOLD_FILES`), with an existence
     check so a user's tuned presets survive FORGE upgrades.

   > **B-2 correction.** A bare un-exclude would route `presets.json` through
   > `catalogNeutralArtifacts`, which hardcodes `category: "config"`
   > (`installer/projection.ts:237`) and targets `.forge/templates/presets.json`
   > only. That is regenerate-on-update (overwrites the user's tuned file) and
   > **never creates** the active `.forge/presets.json` the resolver reads. The
   > create-once behaviour requires the dedicated `user-template` scaffold entry
   > above — the `category: "user-template"` label is applied only by
   > `catalogScaffoldArtifacts` / `USER_OWNED_FRONTEND_FILES`
   > (`projection.ts:190, 266`), never by un-excluding a neutral template.
2. On apply: `opencode.json` managed keys (`model`/`providers`/`agents`)
   rewritten from preset; a timestamped backup
   `opencode.json.bak.<YYYYMMDD-HHMMSS>` is written **before** any differing
   write. All other keys preserved byte-identical.

### Preset / config shapes (reference)

**Preset** (`presets.json` → `presets[id]`):
`name`, `description`, `defaultModel`, `providers{}`, `agentModels{reasoning,execution,peer}`,
`alternatives{reasoning[],execution[],peer[]}`.

**Managed `opencode.json` keys** (owned by *this command*, rewritten):
`model` (= preset `defaultModel`), `providers` (= preset `providers`),
`agents` (= per-agent `{ model }` from the resolved tier map).

**User-owned keys** (preserved verbatim by this command): `$schema`,
`permissions`, `mcp`, `instructions`, `subagent_depth`, `default_agent`, and
any unknown key.

### 2.5 Two distinct managed-key lists — reconciliation (B-1)

> **B-1 resolution.** The installer already defines
> `FORGE_MANAGED_KEYS = ["$schema","default_agent","instructions","agents","mcp","subagent_depth"]`
> (`installer/platforms/opencode.ts:52-59`). The reconfigure command's managed
> set (`model`/`providers`/`agents`) is **deliberately different** — it is NOT a
> reuse or alias of `FORGE_MANAGED_KEYS`. The two lists exist because they serve
> **different lifecycles**, and the plan must not silently redefine either.

| List | Owner / file | Lifecycle | Keys |
| --- | --- | --- | --- |
| `FORGE_MANAGED_KEYS` | installer, `opencode.ts:52-59` | **install/update seed-once + regen** — written during `generateOpenCodeConfig`; `model`/`subagent_depth` are *seeded-once* (set only when absent, `opencode.ts:98-116`), the rest regenerated/merged | `$schema`, `default_agent`, `instructions`, `agents`, `mcp`, `subagent_depth` |
| `MODEL_MANAGED_KEYS` (new) | this command, `installer/model-config.ts` | **user-invoked rewrite** — replaced on every differing `/forge-model-configure` apply, with backup | `model`, `providers`, `agents` |

**Relationship (the two-list contract):**

- They are **not** nested or inverse by design; the only intersection is
  `agents`. `FORGE_MANAGED_KEYS` regenerates `agents` structurally on
  install/update (adds the FORGE agent block); `MODEL_MANAGED_KEYS` rewrites
  only the **`model` field within each agent entry** on reconfigure.
- `model` is in `MODEL_MANAGED_KEYS` but is **seed-once** under
  `FORGE_MANAGED_KEYS` — i.e. the installer never rewrites `model` after the
  user has one, while reconfigure explicitly *does* (see §4.1a, B-3).
- `providers` is owned **only** by `MODEL_MANAGED_KEYS`; the installer does not
  touch it at all.
- Everything in `FORGE_MANAGED_KEYS` that is **not** in `MODEL_MANAGED_KEYS`
  (`$schema`, `default_agent`, `instructions`, `mcp`, `subagent_depth`) is in
  the reconfigure command's **user-owned / preserved** set above.

`MODEL_MANAGED_KEYS` is declared and owned in `installer/model-config.ts` as an
explicit exported constant. A unit test asserts the relationship above so the
two lists cannot drift silently (see §8.1, "two-list invariant").

## 3. API Endpoints

No HTTP API. CLI/slash-command surface (spec §8):

### 3.1 `/forge-model-configure --list`

- **Description**: Print presets (`id`, `name`, `defaultModel`, tier table)
  from the resolved presets file. Resolution: `.forge/presets.json` > built-in;
  missing/corrupt → fallback + `Standalone — not chained` warning.
- **Exit**: 0 always (read-only).

### 3.2 `/forge-model-configure --provider <id> --policy <quality|speed|cheap> [--dry-run] [--yes] [--allow-free-private]`

- **Description**: Resolve preset + policy → tier map; cost hint; privacy gate;
  backup + key-scoped merge; idempotent re-apply.
- **Flags**: `--policy` **REQUIRED** (FR-003); `--dry-run` previews tier table +
  diff, writes nothing (FR-009); `--yes` confirms paid upgrade;
  `--allow-free-private` confirms free-on-private (ADR-006).
- **Exit codes**:
  | Code | Meaning |
  | --- | --- |
  | 0 | applied, or unchanged (idempotent) |
  | 1 | aborted — model unavailable, privacy-gate declined, or cost-confirm declined |
  | 2 | usage error — unknown `--provider`, missing/invalid `--policy`; no file touched |

### `--policy` → tier matrix (FR-003)

| `--policy` | reasoning tier | execution tier | peer tier |
| --- | --- | --- | --- |
| `quality` | `alternatives.reasoning[0]` (strongest) | `agentModels.execution.model` | `agentModels.peer.model` |
| `speed`   | `agentModels.reasoning.model` | `alternatives.execution[0]` (fastest) | `agentModels.peer.model` |
| `cheap`   | `agentModels.reasoning.model` | cheapest/free of `alternatives.execution` (prefer `-free`) | `agentModels.peer.model` |

Selection is driven by preset `alternatives`; a preset with no alternative for a
tier falls back to that tier's `agentModels.*.model`. `--policy` omitted → exit
2 listing valid values (fail-closed, decided 2026-10-06).

## 4. Component Design

### 4.1 `installer/model-config.ts` (new, the logic home)

- **Purpose**: All preset resolution, policy/tier mapping, merge/backup,
  idempotency, cost-hint and privacy-gate logic. The single testable unit.
- **Location**: `installer/model-config.ts`
- **Responsibilities**: resolve presets; map policy→tier; build managed keys;
  key-scoped merge with backup; detect idempotency; compute cost hint; evaluate
  privacy gate; produce exit codes + rendered output blocks.
- **Dependencies**: `node:fs`, `node:child_process` (best-effort `gh`/`git`),
  `installer/config.ts` (`stripJsonComments`, `readExistingJsonConfig`).
- **Key functions**:

  | Function | Parameters | Returns | Description |
  | --- | --- | --- | --- |
  | `resolvePresets` | `projectRoot` | `{ presets, source, warning? }` | `.forge/presets.json` > built-in; fallback + warning on miss/corrupt (FR-001/006, ADR-004) |
  | `selectTierModels` | `preset, policy` | `{ reasoning, execution, peer }` | Policy→tier map via `alternatives` (FR-003) |
  | `buildManagedKeys` | `preset, tierModels` | `{ model, providers, agents }` | Agent→tier assignment; peer ≠ reviewer family (US-002) |
  | `checkAvailability` | `preset, tierModels` | `{ ok, missing[] }` | Model in preset model list; miss → abort hint (FR-005) |
  | `computeCostHint` | `preset, tierModels, prevModels` | `{ lines[], paidUpgrade }` | free/paid + strong/cheap per tier (FR-004) |
  | `evaluatePrivacyGate` | `tierModels, repoVisibility, flags` | `{ notice?, block, reason }` | `-free` notice always; private → confirm; fail-closed (FR-007, ADR-006) |
  | `detectRepoVisibility` | `projectRoot` | `'public'\|'private'\|'unknown'` | best-effort `gh`→`git remote`; `unknown` treated private (ADR-006) |
  | `mergeManagedKeys` | `existing, managed` | `{ next, changed, preservedKeys[] }` | Replace only managed keys; preserve rest; detect no-op (FR-002/008, NFR-003/004) |
  | `applyReconfigure` | `opts` | `{ exitCode, output, backupPath? }` | Orchestrates; writes backup then file unless `--dry-run`/unchanged |

- **Exported constant**: `MODEL_MANAGED_KEYS = ["model","providers","agents"]`
  (see §2.5). Owned here, deliberately distinct from `opencode.ts`
  `FORGE_MANAGED_KEYS`.

#### 4.1a Seed-once bypass (B-3)

> **B-3 note.** `mergeManagedKeys` owns the rewrite and **MUST NOT** route
> through `generateOpenCodeConfig` (`opencode.ts:73`). The installer's generator
> gates `model` behind a seed-once check — `config.model` is set **only when
> `existing?.model === undefined`** (`opencode.ts:98-101`), and `subagent_depth`
> the same way (`:114-116`). That is correct for *fresh-install generation*: an
> explicit user model is never overwritten on install/update.
>
> Reconfigure is the **opposite contract**: it is an explicit, user-invoked
> action whose entire purpose is to *replace* `model` (and `providers`/`agents`)
> on every differing apply (FR-002/FR-008). An implementer who wired reconfigure
> through `generateOpenCodeConfig` would get a **silent no-op on `model`**
> whenever the user already has one — exactly the failure to avoid. `config.ts`
> helpers (`stripJsonComments`, `readExistingJsonConfig`) are reused for
> JSONC-safe read/parse; the generator's seed-once path is **not**. The
> seed-once semantics apply to fresh-install generation only, never to this
> user-invoked rewrite.

### 4.2 `.opencode/commands/forge-model-configure.md` (new, thin surface)

- **Purpose**: Slash-command entry; parse args → call lib → render blocks.
- **Location**: `.opencode/commands/forge-model-configure.md` (frontmatter
  `agent: forge`, mirrors `forge-quick.md`).
- **Responsibilities**: argument/flag documentation, policy matrix, exit codes,
  examples, output-block contract (spec §9). **No branching logic** — delegates.

### 4.3 `install-forge.ts --reconfigure` (modified, alias)

- **Purpose**: Keep the existing `--reconfigure` affordance working as a thin
  alias to `installer/model-config.ts` (ADR-005). If non-trivial to wire,
  delegate with a one-line note pointing at the command.

## 5. File Map

> Paths relative to repo root (FORGE meta-dev). Working dir is `dev/`; spec and
> artifacts live at repo root `.forge/`.

### Files to Create

| Path | Purpose | Size |
| --- | --- | --- |
| `installer/model-config.ts` | Preset resolution, policy/tier map, merge/backup, cost + privacy gates (logic home) | L |
| `.opencode/commands/forge-model-configure.md` | Slash-command surface (args, policy matrix, exit codes, examples) | M |
| `tests/unit/model-config.test.ts` | Unit + snapshot: merge/backup, idempotency, gates, determinism | L |
| `tests/unit/fixtures/model-config/` | Fixture `opencode.json` + presets variants | S |
| `.forge/knowledge/adr/ADR-004-preset-home-and-projection.md` | ADR (created) | S |
| `.forge/knowledge/adr/ADR-005-reconfig-surface-and-logic-home.md` | ADR (created) | S |
| `.forge/knowledge/adr/ADR-006-privacy-gate-heuristic-fail-closed.md` | ADR (created) | S |

### Files to Modify

| Path | Section/Lines | Change | Effort |
| --- | --- | --- | --- |
| `installer/projection.ts` | `catalogScaffoldArtifacts` / new `USER_TEMPLATE_FILES` set; `EXCLUDED_TEMPLATES` **unchanged** | Add create-once `user-template` projection `templates/presets.json` → `.forge/presets.json` (mirror `SCAFFOLD_FILES`, with existence check). **Keep `"presets.json"` in `EXCLUDED_TEMPLATES`** so the neutral path still ships the `config` fallback to `.forge/templates/presets.json`. Two targets, one source (ADR-004, B-2) | M |
| `installer/config.ts` | `DEFAULT_MODEL` (`L45`), `REASONING_MODEL`/`PEER_REVIEW_MODEL` (`L57-58`), `defaultAgentConfigs` (`L61-73`) | Derive defaults from resolved preset where available; keep constants as fallback | M |
| `.opencode/templates/opencode.json` | L15-17 comment | Point "To reconfigure" at `/forge-model-configure`; keep `--reconfigure` as alias mention | S |
| `install-forge.ts` (root) | `--reconfigure` handling | Wire to `installer/model-config.ts` or delegate note | S/M |

### Files to Delete (if any)

None. (`presets.json` is revived, not removed.)

### Files to Reference (Read-only)

| Path | Purpose |
| --- | --- |
| `installer/platforms/opencode.ts` | `FORGE_MANAGED_KEYS` + seed-once semantics — reference ONLY. This command's `MODEL_MANAGED_KEYS` is intentionally distinct (see §2.5); do NOT reuse this list, and do NOT route through `generateOpenCodeConfig`'s seed-once path (§4.1a) |
| `installer/config.ts` | Reuse `stripJsonComments` / `readExistingJsonConfig` for JSONC-safe parse |
| `.opencode/templates/presets.json` | Built-in preset shape + fallback source |
| `.forge/constitution.md` | Governance (uncustomized template — see §11 note) |

## 6. Dependencies

### 6.1 New

| Package | Version | Purpose |
| --- | --- | --- |
| — | — | **None.** Node `fs` + `child_process` only (Art. 2 / NFR-005) |

### 6.2 Internal

- `installer/config.ts` — `stripJsonComments`, `readExistingJsonConfig`.
- `installer/projection.ts` — dual-target projection of `presets.json` (neutral
  `config` fallback + new `user-template` create-once active file).
- `installer/platforms/opencode.ts` — managed-key semantics (**reference only**;
  `MODEL_MANAGED_KEYS` is distinct, §2.5; seed-once bypassed, §4.1a).

## 7. Implementation Phases

### Phase 1: Revive presets + projection

**Objective**: `.forge/presets.json` resolves in a fresh install (create-once,
survives updates) **and** `.forge/templates/presets.json` ships as the
regenerate-on-update fallback; orphan #72 closed.

**Modify**:
- `installer/projection.ts` — add a `USER_TEMPLATE_FILES` set (mirroring
  `SCAFFOLD_FILES`) that projects `templates/presets.json` → `.forge/presets.json`
  as `user-template` (create-once, existence check). **Keep** `"presets.json"` in
  `EXCLUDED_TEMPLATES` so the neutral path still emits the `config` fallback at
  `.forge/templates/presets.json`. · effort M

**Tasks**:
1. [ ] Add create-once `user-template` projection of `templates/presets.json`
   → `.forge/presets.json` (one source → two targets, per §2.4/ADR-004).
   Do NOT remove `presets.json` from `EXCLUDED_TEMPLATES` (B-2).
2. [ ] `tests/unit` projection assertion against the **real** mechanism:
   (a) `.forge/presets.json` is planned exactly once with category
   `user-template` and is **not** overwritten on update (existence check);
   (b) `.forge/templates/presets.json` is still planned as `config`
   (regenerate-on-update). Both targets present, from the single built-in source.

### Phase 2: Core logic lib

**Objective**: Deterministic preset resolution, policy map, merge/backup, idempotency.

**Create**:
- `installer/model-config.ts` — `resolvePresets`, `selectTierModels`,
  `buildManagedKeys`, `mergeManagedKeys`, `checkAvailability` · deps: Phase 1 · effort L

**Tasks**:
1. [ ] `resolvePresets` with fallback + warning (FR-001/006).
2. [ ] `selectTierModels` policy matrix (FR-003); unknown policy → usage error.
3. [ ] `buildManagedKeys` with peer≠reviewer family (US-002).
4. [ ] `mergeManagedKeys`: replace only `model`/`providers`/`agents`, preserve rest, detect no-op (FR-002/008, NFR-003/004).
5. [ ] Timestamped backup before differing write; none when unchanged.
6. [ ] `checkAvailability` abort + fallback hint on miss (FR-005).

### Phase 3: Cost + privacy gates

**Objective**: Cost hint + paid-upgrade confirm; `-free` privacy gate fail-closed.

**Create**:
- extend `installer/model-config.ts` — `computeCostHint`, `evaluatePrivacyGate`,
  `detectRepoVisibility`, `applyReconfigure` · deps: Phase 2 · effort M

**Tasks**:
1. [ ] `computeCostHint` per-tier free/paid + strong/cheap; confirm on paid upgrade (FR-004).
2. [ ] `detectRepoVisibility` best-effort `gh`→`git`; `unknown`→private (ADR-006).
3. [ ] `evaluatePrivacyGate`: `-free` notice always; private → confirm; non-interactive w/o flag → exit 1 (FR-007).
4. [ ] `applyReconfigure` orchestration + exit codes 0/1/2.

### Phase 4: Surfaces + docs

**Objective**: Command + `--reconfigure` alias + comment/doc updates.

**Create**:
- `.opencode/commands/forge-model-configure.md` — thin surface · deps: Phase 3 · effort M

**Modify**:
- `installer/config.ts` — preset-driven defaults w/ constant fallback · effort M
- `.opencode/templates/opencode.json` — reconfigure comment · effort S
- `install-forge.ts` — wire `--reconfigure` alias · effort S/M

**Tasks**:
1. [ ] Author command file (args, policy matrix, exit codes, output blocks, examples).
2. [ ] `--dry-run` tier table + diff summary, no write (FR-009).
3. [ ] Wire `--reconfigure` alias to the lib.
4. [ ] Update reconfigure comment + user docs.

### Phase 5: Tests

**Objective**: Unit + snapshot + timed smoke mapped to FR/NFR.

**Create**:
- `tests/unit/model-config.test.ts` + fixtures · deps: Phases 2-4 · effort L

**Tasks**: see §8.

## 8. Testing Strategy

### 8.1 Unit Tests

| Component | Test Focus | Maps to |
| --- | --- | --- |
| `resolvePresets` | project > built-in; missing/corrupt → fallback + warning | FR-001, FR-006, NFR-005 |
| `selectTierModels` | quality/speed/cheap matrix; unknown policy → usage err | FR-003 |
| `selectTierModels` (cheap→paid) | `cheap` on a paid-only preset (no `-free` in `alternatives.execution`, e.g. `github-copilot`/`openai`/`google`) resolves to a **paid** execution model; falls back to `agentModels.execution.model` when no alternative | FR-003, FR-004, B-4 |
| `buildManagedKeys` | agent→tier map; peer≠reviewer family | US-002 |
| `mergeManagedKeys` | only managed keys change; all others byte-identical; preserved-key count | FR-002, NFR-003 |
| backup | differing apply → exactly one `.bak.<ts>`; unchanged → none | FR-002, FR-008, NFR-003 |
| idempotency | same preset+policy twice → "unchanged", exit 0, no backup | FR-008 |
| `checkAvailability` | missing model → abort + fallback hint, exit 1, no write | FR-005, edge 1 |
| `computeCostHint` | per-tier free/paid + strong/cheap; paid upgrade → confirm | FR-004 |
| `computeCostHint` (cheap→paid) | **`cheap` resolved to paid, no `-free`:** cost hint marks the tier **paid** (not free), paid-upgrade **confirm still fires**, and **no privacy notice** is emitted (privacy gate is `-free`-only) | FR-004, FR-007, B-4 |
| two-list invariant | `MODEL_MANAGED_KEYS = [model,providers,agents]`; asserts the §2.5 relationship vs `FORGE_MANAGED_KEYS`: intersection is exactly `{agents}`; `providers` is model-only; `model` is seed-once installer-side but rewritten here; the two lists are neither equal nor nested | FR-002, §2.5, B-1 |
| `detectRepoVisibility` | `gh` ok → bool; offline/no remote → `unknown` | NFR-005, ADR-006 |
| `evaluatePrivacyGate` | `-free` notice always; private → confirm; non-interactive w/o flag → exit 1; **paid (non-`-free`) tier → no notice, gate suppressed** | FR-007, edge 4, B-4 |
| exit codes | 0 applied/unchanged, 1 abort, 2 usage | §8 spec |
| `--dry-run` | prints tier table + diff, writes nothing | FR-009 |
| message quality | every abort states what+why+next | NFR-006 |

### 8.1a Snapshot Tests

| Snapshot | Focus | Maps to |
| --- | --- | --- |
| managed-keys output | same preset+policy ⇒ byte-identical `model`/`providers`/`agents` | NFR-004 |
| full `opencode.json` after merge | preserved keys unchanged vs fixture | FR-002 |

### 8.2 Integration / Smoke Tests

| Scenario | Dependencies | Maps to |
| --- | --- | --- |
| Timed reconfigure on fixture project < 2 min | fixture `opencode.json` + presets | NFR-001 |
| Offline apply (network stubbed off) | network stub | NFR-005 |
| Projection: `.forge/presets.json` created once (`user-template`), not overwritten on update; `.forge/templates/presets.json` still planned as `config` fallback | install plan | ADR-004, B-2 |
| No per-task LLM call (static routing) | code review assertion | NFR-002 |

## 9. Architectural Decisions

| ADR | Decision | Status |
| --- | --- | --- |
| ADR-004 | Preset home `.forge/presets.json` + built-in fallback; **dual-target projection** — neutral `config` fallback at `.forge/templates/presets.json` (stays in `EXCLUDED_TEMPLATES`) + new create-once `user-template` at `.forge/presets.json` | **Accepted** |
| ADR-005 | Surface = slash command + `--reconfigure` alias; logic home = `installer/model-config.ts` (skill rejected) | **Accepted** |
| ADR-006 | Privacy gate repo-visibility heuristic fails **closed** (undetectable ⇒ private) | **Accepted** |

## 10. Requirement Traceability

| Requirement | Plan Section | Implementation Path |
| --- | --- | --- |
| FR-001 (`--list`, resolution order) | §3.1, §4.1 `resolvePresets` | `installer/model-config.ts` |
| FR-002 (merge only managed keys + backup) | §4.1 `mergeManagedKeys`, §2.4 | `installer/model-config.ts` |
| FR-003 (`--policy` required + matrix) | §3, §4.1 `selectTierModels` | `installer/model-config.ts` |
| FR-004 (cost hint + confirm) | §4.1 `computeCostHint` | `installer/model-config.ts` |
| FR-005 (availability abort) | §4.1 `checkAvailability` | `installer/model-config.ts` |
| FR-006 (offline-first resolution) | §4.1 `resolvePresets` | `installer/model-config.ts` |
| FR-007 (privacy gate) | §4.1 `evaluatePrivacyGate`, ADR-006 | `installer/model-config.ts` |
| FR-008 (idempotency) | §4.1 `mergeManagedKeys` | `installer/model-config.ts` |
| FR-009 (`--dry-run`) | §4.2, Phase 4 | command + lib |
| NFR-001 (< 2 min) | §8.2 timed smoke | `tests/smoke` |
| NFR-002 (routing ~0s) | §8.2 review assertion | static tier map |
| NFR-003 (zero silent overwrite) | §8.1 backup tests | `installer/model-config.ts` |
| NFR-004 (determinism) | §8.1a snapshot | `installer/model-config.ts` |
| NFR-005 (offline) | §8.2 network stub | `installer/model-config.ts` |
| NFR-006 (actionable messages) | §8.1 message quality | `installer/model-config.ts` |

## 11. Constitution Compliance

> Repo `.forge/constitution.md` is the uncustomized template (all `CUSTOMIZE`
> placeholders). Per spec note and task instruction, governance is evaluated
> against `AGENTS.md` conventions + `.forge-meta/constitution.md` (**5
> articles**: Core Principles, Technology Stack, Architecture Patterns, Quality
> Standards, Naming & Conventions). The 9-row template below is mapped onto
> those 5; rows 6-9 are N/A for this repo. **Non-blocking flag raised.**

| Article | Status | Notes |
| --- | --- | --- |
| Art. 1 — Core Principles | ✅ Pass | Backup + key-scoped merge + Avviso-e-stop + privacy confirm = safety-first; offline-first; no silent overwrite |
| Art. 2 — Technology Stack | ✅ Pass | No new runtime deps; Node `fs`/`child_process` only; tsx untranspiled, Vitest |
| Art. 3 — Architecture Patterns | ✅ Pass | Installer stays config owner; reuses presets/tier pattern; one logic home, thin surfaces |
| Art. 4 — Quality Standards | ✅ Pass | Logic inside `installer/**` coverage gate (85/78/80); unit + snapshot + timed smoke; dual review pre-merge |
| Art. 5 — Naming & Conventions | ✅ Pass | kebab-case command/files, camelCase fns, English-only user strings |
| Art. 6 | N/A | Not defined in repo's 5-article constitution |
| Art. 7 | N/A | — |
| Art. 8 | N/A | — |
| Art. 9 | N/A | — |

---

## Cross-References

| Document | Path |
| --- | --- |
| Spec | `.forge/specs/011-model-configure/spec.md` |
| Discovery | `.forge/specs/011-model-configure/discovery-brief.md` |
| Architecture | — (no `.forge/architecture/architecture.md`; this plan + ADRs are the record) |
| Tasks | `.forge/specs/011-model-configure/tasks.md` <!-- /forge-tasks --> |
| Constitution | `.forge/constitution.md` (uncustomized — see §11) |
| ADRs | `.forge/knowledge/adr/ADR-004…006` |
