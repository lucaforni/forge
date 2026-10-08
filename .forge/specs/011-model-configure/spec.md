# Spec: 011 - Automatic Model Reconfiguration + Policy Routing

> Feature specification for Feature track. Created by Forge orchestrator (forge-pm model unavailable on github-copilot — dogfooding the very problem this spec solves — via `/forge-specify` fallback).

| Field   | Value      |
| ------- | ---------- |
| Status  | Ready  |
| Author  | Forge (orchestrator, PM-fallback) |
| Date    | 2026-10-06 |
| Track   | Feature    |
| Spec ID | 011-model-configure |

---

## 1. Overview

One command — `/forge-model-configure --provider <id> --policy <quality|speed|cheap>` — regenerates the `model`/`providers`/`agents` sections of `opencode.json` from a versioned provider preset, with backup + merge, cost hint, and a privacy gate for free Zen models (free allowed by default, but with warning + explicit confirm on private repos). Static tier routing (reasoning agents → quality model, execution agents → speed/cheap model, peer reviewer → different family) delivers "strong model for design, fast model for execution" with zero per-task latency. Fully dynamic per-task switching is explicitly out of v1.

## 2. Problem Statement

Model IDs are hardcoded in three places (`installer/config.ts` defaults, `.opencode/templates/opencode.json` fallback, root `opencode.json` dogfooding config) while the structured alternative — `.opencode/templates/presets.json` (6 providers, reasoning/execution/peer tiers) — is excluded from distribution (`EXCLUDED_TEMPLATES`, orphan #72). Result: switching provider means hand-editing JSON; choosing between quality (opus/pro), speed (sonnet/flash), cost (free Zen vs paid strong), and privacy (free sacrifices privacy) is a difficult manual operation with no guardrails. The PM agent itself just failed with "model claude-opus-4.7 not available" — the exact failure this spec prevents via `Avviso e stop` + fallback hint.

## 3. User Stories

### US-001: Reconfigure from provider

**As a** solo-dev, **I want** to run `/forge-model-configure --provider opencode-free --policy cheap`, **so that** `opencode.json` is regenerated without hand edits.

**Acceptance Criteria:**
- Given a valid preset id, when I run the command, then `model`/`providers`/`agents` are replaced from the preset and all other keys are preserved byte-identical.
- Given an existing `opencode.json` that differs, when I apply, then a timestamped backup `opencode.json.bak.<ts>` exists before writing.
- Given the same preset+policy applied twice, when I re-run, then the second run reports "unchanged" and creates no new backup.

### US-002: Quality for design, speed for execution

**As a** team user, **I want** reasoning agents on the strong model and execution agents on the fast/cheap model, **so that** specs/plans/reviews favor quality while implement/test favor speed.

**Acceptance Criteria:**
- Given preset `github-copilot`, when applied with any policy, then `forge-pm/architect/reviewer/ux` share the `reasoning` model, `forge/scrum/qa/analyst` share the `execution` model, and `forge-reviewer-peer` uses a different family than `forge-reviewer`.
- Given `--policy quality`, when applied, then the strongest reasoning alternative is selected; given `--policy speed`, the fastest execution; given `--policy cheap`, the cheapest/free execution (per preset `alternatives`).
- Given any task starts, when routing resolves, then no network call is required (static map, ~0s overhead).

### US-003: Cost made explicit, privacy gated

**As a** solo-dev using Zen, **I want** free-vs-paid called out with a privacy warning + confirm on private repos, **so that** I don't leak private code to free models by accident nor get a surprise bill.

**Acceptance Criteria:**
- Given a selected model ending in `-free`, when applying, then a privacy trade-off notice is printed always.
- Given the repo is private (git remote / config check) and the model is `-free`, when applying without explicit confirm, then the command stops and asks for confirmation (non-interactive mode fails closed with exit code + message).
- Given a tier upgrade from free to paid, when applying, then a cost hint (free/paid, strong/cheap per tier) is printed and confirmation is required.

## 4. Functional Requirements

| ID     | Requirement | Priority | Story Ref |
| ------ | ----------- | -------- | --------- |
| FR-001 | Command lists presets (`id`, `name`, `defaultModel`, tier table) from resolved presets file (`--list`); resolution order `.forge/presets.json` > built-in, missing file → fallback + warning | Must | US-001 |
| FR-002 | Apply merges ONLY `model`/`providers`/`agents` keys, backs up to `opencode.json.bak.<ts>` when differing, preserves all other keys | Must | US-001 |
| FR-003 | `--policy quality|speed|cheap` is REQUIRED (fail-closed, decided 2026-10-06); maps to tier selection via preset `alternatives`; omitting it is a usage error (exit 2) listing valid values | Must | US-002 |
| FR-004 | Cost hint printed per tier (free/paid, strong/cheap) + confirm required on paid upgrade; output is unit-tested | Must | US-003 |
| FR-005 | Availability check against preset model list; on miss → abort (`Avviso e stop`) with message + fallback hint, never silent downgrade | Must | US-001 |
| FR-006 | Preset resolution + offline-first: no network required; live verification (if any) is best-effort warning only | Must | US-001 |
| FR-007 | Free-model privacy gate v1: `-free` always prints privacy notice; on private repos requires explicit confirm (interactive prompt or `--allow-free-private` / `--yes` flag); non-interactive without confirm fails closed | Must | US-003 |
| FR-008 | Idempotency: same preset+policy re-applied → "unchanged", no backup, exit 0 | Should | US-001 |
| FR-009 | `--dry-run` prints resulting tier table + diff summary without writing | Should | US-001 |

## 5. Non-Functional Requirements

| ID      | Category    | Requirement | Target |
| ------- | ----------- | ----------- | ------ |
| NFR-001 | Performance | Reconfigure wall time | < 2 min on fixture project (timed smoke test) |
| NFR-002 | Performance | Per-task routing overhead | < 5 s; v1 static ⇒ ~0 s, asserted in review (no per-task LLM call) |
| NFR-003 | Reliability | Zero silent overwrites; backup on every differing apply | 100% of differing applies produce backup (unit test) |
| NFR-004 | Determinism | Same preset+policy ⇒ byte-identical managed sections | Snapshot test |
| NFR-005 | Operability | Works offline | Passes with network stubbed off |
| NFR-006 | Usability | Every abort/fallback message is actionable (what + why + next command) | Review checklist |

## 6. Edge Cases & Error Scenarios

| #  | Scenario | Expected Behavior |
| -- | -------- | ----------------- |
| 1  | Preset model not on account (e.g. opus-4.7 missing) | Abort with message + fallback hint (e.g. try `--policy` alternative or another preset); exit non-zero |
| 2  | Heavily customized `opencode.json` | Merge managed keys only; report preserved keys; backup first |
| 3  | `presets.json` missing/corrupt | Fall back to built-in presets, warn `Standalone — not chained`, continue |
| 4  | Free model + private repo, no confirm | Stop, print privacy notice + required flag; non-interactive fails closed |
| 5  | Provider API / live list unreachable | Proceed from preset, warn verification skipped |
| 6  | Double-run same args | "unchanged", no new backup, exit 0 |
| 7  | Unknown `--provider` / `--policy` | Usage error listing valid values, exit 2, no file touched |

## 7. Data Requirements

- **Preset source (revived, decided 2026-10-06):** `.forge/presets.json` (project override, versioned) > `.opencode/templates/presets.json` (built-in fallback). `installer/projection.ts` must stop excluding `presets.json` and project it to `.forge/presets.json`.
- **Generated config:** `opencode.json` managed keys = `model`, `providers`, `agents` only. All other keys (permissions, mcp, instructions, subagent_depth) are user-owned and preserved.
- **Backup:** sibling `opencode.json.bak.<YYYYMMDD-HHMMSS>`; never more than one backup per differing apply; unchanged apply creates none.
- **Repo-visibility signal (v1 heuristic):** git remote URL / `gh repo view --json isPrivate` best-effort; undetectable → treat as private (fail closed) and state assumption in output.

## 8. API Requirements

Slash command (no HTTP API):

| Invocation | Description |
| ------ | ---- |
| `/forge-model-configure --list` | List presets + tier table |
| `/forge-model-configure --provider <id> --policy <quality\|speed\|cheap> [--dry-run] [--yes] [--allow-free-private]` | Apply preset+policy; `--dry-run` previews, `--yes` confirms paid upgrade, `--allow-free-private` confirms free-on-private (both required in non-interactive mode when triggered) |

Exit codes: `0` applied/unchanged, `1` aborted (availability/privacy-gate decline), `2` usage error. `--list` with no presets installed is a degraded environment → exit `1` with a reinstall hint (locked by test, not an abort of any apply).

## 9. UX/UI Notes

- CLI-first. Output blocks: (a) resolved preset + policy, (b) tier table `reasoning → model (agents…)`, `execution → …`, `peer → …`, (c) cost hint per tier, (d) privacy notice when `-free`, (e) backup path + preserved-keys count, (f) next step (`Verify: …`). All English (constitution Art. 5.2 distribution rule).
- Non-interactive (CI) mode: prompts become hard stops with the exact flag to re-run with.
- Accessibility: plain-text, no color-only signaling.

## 10. Out of Scope

- Fully dynamic per-task auto-switching via scope-detection score (Flow C) — Future after v1 telemetry.
- Privacy hard block / allowlist / per-repo policy file — Future (`--allow-free-private` flag shape reserved but only used as confirm in v1).
- Live `opencode models` gating, price API / metering, budget caps / cost ledger.
- Changing installer platform projection beyond un-excluding `presets.json` distribution (detailed in plan).

## 11. Open Questions

- [RESOLVED 2026-10-06] Preset home: `.forge/presets.json` versioned per project + built-in fallback (picked `Forge presets`).
- [RESOLVED 2026-10-06] `--policy` omitted: fail-closed, required flag (picked `Required`). Usage error exit 2 with valid values.

Resolved in discovery (2026-10-06): free allowed by default WITH privacy notice + explicit confirm on private repos (compromise). Hard opt-in everywhere and free-everywhere both rejected.

## 12. Implementation Scope

> Paths relative to repo root (FORGE meta-dev; installer ships to user projects).

### New Components

| Component Type | Path | Description |
|----------------|------|-------------|
| Command | `.opencode/commands/forge-model-configure.md` | Slash-command definition (args, policy matrix, exit codes, examples) |
| Skill or lib | `.opencode/skills/model-routing/SKILL.md` (or `installer/model-config.ts` if skill rejected in plan) | Preset resolution + tier/policy map + merge/backup + privacy/cost gates (testable unit) |
| Tests | `tests/unit/model-config.test.ts` (+ fixtures) | Merge/backup, idempotency, gates, snapshot determinism |

### Modified Components

| Path | Modification Type | Description |
|------|-------------------|-------------|
| `installer/projection.ts` | Enhancement | Remove `presets.json` from `EXCLUDED_TEMPLATES` (fix orphan #72); project to `.forge/presets.json` or platform-neutral target decided in plan |
| `installer/config.ts` | Refactor | Replace hardcoded `DEFAULT_MODEL`/`REASONING_MODEL`/`PEER_REVIEW_MODEL` with preset-driven values (keep constants as fallback) |
| `.opencode/templates/opencode.json` | Enhancement | Point "To reconfigure" comment to `/forge-model-configure` (keep `--reconfigure` mention as alias) |
| `install-forge.ts` (root) | Enhancement | Wire `--reconfigure` to shared model-config logic if trivial; otherwise delegate note |

### Documentation Updates

| Path | Section | Update Description |
|------|---------|--------------------|
| `.forge/docs/` (user docs) or `docs/` | Reconfigure section | Document `/forge-model-configure`, policy matrix, free/privacy gate, exit codes |

## 13. Constitution Compliance

| Article | Status | Notes |
| ------- | ------ | ----- |
| Art. 1 | ✅ Pass | Backup/merge + Avviso-e-stop + privacy confirm = safety-first; offline-first operability |
| Art. 2 | ✅ Pass | No new runtime deps; no stack change (uses existing presets shape + Node fs) |
| Art. 3 | ✅ Pass | Reuses tier pattern already in presets; installer remains source of generated config |
| Art. 4 | ✅ Pass | Coverage via unit (merge/gates/idempotency) + snapshot (determinism) + timed smoke (NFR-001); dual review required pre-merge |
| Art. 5 | ✅ Pass | Naming: kebab-case command + files, camelCase fns; English-only user strings |

> Note: repo `.forge/constitution.md` is still the uncustomized template (all `CUSTOMIZE` placeholders) — governance evaluated against `AGENTS.md` + `.forge-meta/constitution.md` (5 articles) instead; flag raised, non-blocking.

---

## Cross-References

| Document     | Path                                  |
| ------------ | ------------------------------------- |
| Constitution | `.forge/constitution.md`              |
| Discovery    | `.forge/specs/011-model-configure/discovery-brief.md` |
| Architecture | `.forge/architecture/architecture.md` |
| Plan         | `.forge/specs/011-model-configure/plan.md` <!-- /forge-plan --> |
| Tasks        | `.forge/specs/011-model-configure/tasks.md` <!-- /forge-tasks --> |
| PRD          | — (Feature track)                |
