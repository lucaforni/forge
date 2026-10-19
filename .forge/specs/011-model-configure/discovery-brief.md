# Discovery Brief — Automatic Model Reconfiguration + Policy Routing (011-model-configure)

Status: `Complete — chained to /forge-specify` · Date: 2026-10-06
Source: feature-discovery workshop (3 rounds) · Language of record: English (user session in Italian)

## 1. Personas + JTBD

| Persona | Job-to-be-done |
|---------|----------------|
| **P1 Solo-dev** (Luca) — works alone, hates hand-editing JSON | When I switch provider or start a new project, I want one command to regenerate `opencode.json` from the provider preset, so I can avoid manual edits and broken configs. |
| **P2 FORGE maintainer** — keeps presets for many projects | When models change upstream, I want versioned presets + policy to roll out, so teams get updated defaults without losing customizations. |
| **P3 Team user** — uses installed FORGE | When I run a task, I want quality for design/plan/analyze and speed elsewhere, with cost made explicit, so I don't burn money or wait needlessly. |

Out-of-persona: billing/admin of Zen accounts (not covered).

## 2. Happy-path flows

**Flow A — Manual reconfigure (v1 core)**
Trigger: user runs `/forge-model-configure --provider <id> --policy <quality|speed|cheap>`.
Steps: 1) list presets from `.forge/presets.json` (fallback: built-in) → 2) backup `opencode.json` → 3) merge `models`+`agents` sections only, preserve rest → 4) verify model IDs exist in preset → 5) print applied tier table + cost hint.
Outcome: `opencode.json` regenerated, backup kept, no silent overwrite.

**Flow B — Static policy routing (v1 core, no per-task LLM call)**
Trigger: any FORGE phase starts.
Steps: 1) read policy + preset tier map → 2) reasoning agents (`forge-pm`, `forge-architect`, `forge-reviewer`, `forge-ux`) → `reasoning` model (quality) → 3) execution agents (`forge`, `forge-scrum`, `forge-qa`, `forge-analyst`) → `execution` model (speed/cheap) → 4) `forge-reviewer-peer` → `peer` model (different family).
Outcome: design/plan/analyze favor quality, implement/test favor speed, zero added latency per task.

Deferred Flow C (Future): fully dynamic per-task routing via scope-detection score → live model switch. Explicitly OUT of v1 (see §6).

## 3. Edge-case table

| Case | Trigger | Expected behavior | FR-candidate |
|------|---------|-------------------|--------------|
| Model not on account (e.g. opus-4.7 missing) | Preset model unavailable | **Avviso e stop** — abort with message + fallback hint, do not silently downgrade | FR-FD-005 |
| Customized opencode.json | User has manual edits outside models/agents | **Merge backup** — backup file, merge only managed keys, list preserved keys | FR-FD-002 |
| Preset file missing/corrupt | `.forge/presets.json` absent | Fall back to built-in presets, warn `Standalone — not chained` | FR-FD-006 |
| Free model on private repo | Policy `cheap`/free default + private code + Zen free model | v1: **free allowed by default WITH privacy warning + explicit confirm on private repos** (user decision 2026-10-06). Future: `--allow-free-private` opt-in / allowlist | FR-FD-007 (v1 warn+confirm, full guard Future) |
| Provider API down | Live model list unreachable | Proceed from preset (static), warn verification skipped | FR-FD-008 |
| Double-run / idempotent | Command run twice same args | Second run is no-op with "unchanged" message, no extra backup | FR-FD-009 |
| Cost surprise | Paid strong model selected | Print cost hint (free/paid, strong/cheap) before apply, require confirm on tier upgrade | FR-FD-004 |

## 4. FR-candidate list (testable)

- **FR-FD-001** — `/forge-model-configure` lists available provider presets (`id`, `name`, `defaultModel`, tier table) from versioned presets file.
- **FR-FD-002** — Apply merges only `model`/`providers`/`agents` keys, backs up existing `opencode.json` to `opencode.json.bak.<ts>`, preserves all other keys (verified by diff test).
- **FR-FD-003** — `--policy quality|speed|cheap` maps to tier selection: `quality`→strongest reasoning, `speed`→fastest execution, `cheap`→cheapest/free execution; default policy is explicit (no hidden default).
- **FR-FD-004** — Cost dimension: command prints free-vs-paid + strong-vs-cheap hint per tier and asks confirm on paid upgrade (unit test on output).
- **FR-FD-005** — Availability check against preset model list; on miss → `Avviso e stop` with fallback suggestion (no silent fallback).
- **FR-FD-006** — Preset resolution order: `.forge/presets.json` > built-in `.opencode/templates/presets.json`; missing file → fallback + warning.
- **FR-FD-007** — (v1, decided 2026-10-06) Free-model privacy gate: when selected model is `-free`, print privacy trade-off notice; on private repos require explicit confirm before apply. Full opt-in block (`--allow-free-private`) is Future.
- **FR-FD-008** — Static-first: no network call required for apply; live verification is best-effort only.
- **FR-FD-009** — Idempotency: re-apply same preset+policy is detected and skipped.

## 5. NFR targets

| NFR | Metric + Target | Verification |
|-----|-----------------|--------------|
| Speed (reconfigure) | Wall time < 2 min (Standard, user-chosen) | Timed smoke test on fixture project |
| Speed (routing) | Added latency per task < 5 s (static map ⇒ ~0 s) | No per-task LLM call in v1; assert in code review |
| Safety | Zero silent overwrites; 100% applies produce backup when file differs | Unit test: backup exists + preserved keys intact |
| Determinism | Same preset+policy ⇒ byte-identical `models`/`agents` sections | Snapshot test |
| Operability | Works offline (no network) | Test with network stubbed off |

## 6. Scope line

**In (v1):**
- `/forge-model-configure` command (manual + `--provider` + `--policy`), file-versioned config + backup/merge, tier map reasoning/execution/peer (revives `presets.json`, fixes orphan #72).
- Policy dimensions quality/speed **+ cost** (`cheap` tier, free-vs-paid hint + confirm).
- Storage: versioned files (`File versionato`): presets + generated `opencode.json`, backup on change.

**Out (explicit, with rationale):**
- Full dynamic per-task auto-switching (Flow C) — deferred: user chose `Statico + policy` for determinism and zero latency; dynamic adds nondeterminism + cost risk. Revisit after v1 telemetry.
- Privacy hard guard (block free on private repos) — deferred: user chose `Con costi` over `Con privacy` for v1; v1 ships warning only (FR-FD-007 reduced). Rationale: unblocks cheap Zen usage now, guard needs repo-visibility detection + opt-in UX not yet designed.
- Live `opencode models` verification as gate — deferred to best-effort: keeps offline support.

**Future:**
- Per-phase routing (design/plan/analyze pinned to quality even under `speed` policy).
- Privacy opt-in (`--allow-free-private`, per-repo allowlist, default-deny on private).
- Live availability probe + automatic fallback chain.
- Budget caps / cost ledger per sprint.

## 7. Assumption log

| Assumption | Evidence | Validation status | Impact if wrong |
|------------|----------|-------------------|-----------------|
| Tier map (reasoning=quality, execution=speed) matches real quality needs | Workshop agreement; presets already encode this | Validated (workshop) | Wrong mapping wastes money or degrades specs |
| Static routing is enough; per-task difficulty detection not needed in v1 | User accepted `Statico + policy` cut | Validated (round 3) | v1 feels rigid; triggers Flow C revival |
| Cost hint (free/paid label) is enough; no real price API needed | User chose `Con costi` as label+confirm, not metering | Unvalidated — owner: PM in spec | Underestimates spend; needs price source |
| `presets.json` can be revived as source of truth | Exists but `EXCLUDED_TEMPLATES` (#72 orphan) | Unvalidated — owner: architect in plan | Installer projection must change |
| Free-by-default is acceptable for low-risk tasks | Round-3 pick `Default free` | **Unvalidated, HIGH IMPACT** — see Conflict below | Privacy leak on private code |

## 8. Open Questions / [NEEDS CLARIFICATION]

- **[RESOLVED 2026-10-06] (was NEEDS CLARIFICATION):** Conflict Default free vs privacy — **decided: free ok di default ma con avviso privacy + conferma sui repo privati**. Spec must encode warn+confirm gate; hard opt-in stays Future.
- **[NEEDS CLARIFICATION] (owner: architect):** Where does `presets.json` live post-revival — `.forge/presets.json` versioned per project vs global? Projection change from `EXCLUDED_TEMPLATES`?
- **[NEEDS CLARIFICATION] (owner: PM):** Exact `--policy` values and default when flag omitted (fail-closed vs default `quality`?).

### Conflict Protocol note

```
Decision: Default free (round 3 pick) vs Privacy caution (round 2 context + user message 2026-10-06)
- Trade-off: free Zen models cut cost to zero but may train on / retain private code; blocking them by default protects privacy but removes the cheapest path.
- Recommendation: v1 = free allowed by default ONLY with visible privacy notice + per-run confirm on private repos (compromise between picks); hard block (opt-in flag) in Future.
- Awaiting: user pick (confirm compromise / force Default free everywhere / force Opt-in everywhere).
```

## 9. Handoff to /forge-specify

Feed FR-FD-001…009 as spec FRs; NFR table as NFR targets; Scope line §6 as In/Out; Assumption log + Open Questions as `[NEEDS CLARIFICATION]` items. Suggested spec ID: `011-model-configure`. Suggested track: **Feature** (scope-detection ~2.9/5: ~8-12 files, installer+command+presets, new command surface, new policy pattern).
