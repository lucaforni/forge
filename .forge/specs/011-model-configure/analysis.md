# Cross-Artifact Analysis — 011-model-configure

> Adversarial consistency report (`/forge-analyze`, Feature track). Produced by
> `forge-reviewer`. Cross-validates spec ↔ plan ↔ ADR-004/005/006 ↔ installer
> source. MUST find real issues.

| Field | Value |
| --- | --- |
| Date | 2026-10-08 |
| Spec | `.forge/specs/011-model-configure/spec.md` (Status: Clarified) |
| Plan | `.forge/specs/011-model-configure/plan.md` (Status: Draft) |
| ADRs | ADR-004, ADR-005, ADR-006 (all **Proposed**) |
| Constitution | `.forge/constitution.md` (uncustomized template — evaluated vs `AGENTS.md` + `.forge-meta/constitution.md`; non-blocking flag) |
| Verdict | **CONDITIONAL** — 2 blocking (CRITICAL) contradictions with installer reality; fix before `/forge-tasks` |

---

## 1. Dimension Scorecard

| Dimension | Result | Notes |
| --- | --- | --- |
| FR coverage (spec → plan) | **PASS** | FR-001…009 each map to a §4.1 function + §8 test row + §10 traceability row |
| NFR measurability | **CONDITIONAL** | NFR-001/003/004/005 measurable; NFR-002/006 are review-checklist only (acceptable but weakest) |
| Traceability (plan → spec) | **PASS** | No orphan plan elements; every component traces to an FR/US |
| ADR validity | **CONDITIONAL** | All 3 ADRs exist and are coherent, but **Status: Proposed**, not Accepted — ADR gate not closed |
| Assumption-log closure | **PASS (w/ noted residue)** | preset-home + policy-default RESOLVED; cost-hint-sufficiency + presets-revival-impact remain Unvalidated (correctly carried, not blocking) |
| Scope guard (no Flow-C leak) | **PASS** | Dynamic per-task routing kept out of plan; static tier map only |
| Contradiction hunt | **FAIL** | Two CRITICAL contradictions between plan claims and installer source (see B-1, B-2); one WARNING (B-3) |
| Constitution compliance | **PASS (non-blocking flag)** | Template uncustomized; evaluated vs 5-article meta-constitution — no violations found |

**Overall: CONDITIONAL — proceed to `/forge-tasks` only after B-1 and B-2 are
reconciled in the plan/ADR-004.** They are plan-correctness defects, not spec
defects, so the spec need not change.

---

## 2. Blocking Issues

### B-1 — CRITICAL — "Managed keys" list contradicts the installer's own `FORGE_MANAGED_KEYS`

- **Where:** spec §7 / §2 (`spec.md:92`), FR-002 (`spec.md:57`); plan §2 "Managed
  keys" (`plan.md:73-78`), §5 read-only reference (`plan.md:191`), §6.2
  (`plan.md:208`) vs `installer/platforms/opencode.ts:52-59`.
- **Contradiction:** The spec/plan define the *managed* (rewritten) set as
  **`model` / `providers` / `agents`** and the *user-owned* (preserved) set as
  `$schema`, `permissions`, `mcp`, `instructions`, `subagent_depth`,
  `default_agent`. The installer's actual `FORGE_MANAGED_KEYS` =
  `["$schema","default_agent","instructions","agents","mcp","subagent_depth"]`.
  This is nearly the inverse: the installer treats `instructions`, `mcp`,
  `subagent_depth`, `default_agent` as **FORGE-managed**, and does **not** list
  `model` or `providers` at all.
- **Impact:** The plan names `opencode.ts` `FORGE_MANAGED_KEYS` as the anchor to
  "keep managed-key list consistent" (`plan.md:191`), but the two lists are
  incompatible. `mergeManagedKeys` built against the spec's list would diverge
  from the installer's seed-once behaviour, producing two competing definitions
  of "managed" in the same repo. Whichever wins, the other breaks.
- **Fix:** Reconcile explicitly in the plan: either (a) declare the reconfigure
  command's managed set as an **independent, narrower** set (`model`,
  `providers`, `agents`) and document that it deliberately differs from
  `FORGE_MANAGED_KEYS` (different lifecycle: install-seed vs user-invoked
  rewrite), or (b) extend/alias `FORGE_MANAGED_KEYS`. Current wording implies
  reuse, which is false.

### B-2 — CRITICAL — "create-once `user-template`" for `.forge/presets.json` is NOT what the cited mechanism produces

- **Where:** plan §2.4 (`plan.md:60-61`), §5 modify row (`plan.md:178`), §7
  Phase 1 task 1-2 (`plan.md:221-222`), §8.2 projection smoke (`plan.md:314`),
  ADR-004 Decision §3 (`ADR-004…:38-42`) vs `installer/projection.ts:218-247`.
- **Contradiction:** ADR-004 and the plan both assert `presets.json` will project
  as a **`user-template`** (create-once, never overwritten on update). But the
  only mechanism they cite is *removing `"presets.json"` from
  `EXCLUDED_TEMPLATES`*. `catalogNeutralArtifacts` hardcodes
  `category: "config"` for **every** neutral template (`projection.ts:237`).
  `config` category = **regenerate-on-update**, the opposite of create-once.
  The `user-template` category is only applied via the separate hardcoded sets
  `USER_OWNED_FRONTEND_FILES` (`projection.ts:144`) and `SCAFFOLD_FILES`
  (`projection.ts:125-129`) — neither of which `presets.json` joins by merely
  un-excluding it.
- **Impact:** As planned, un-excluding `presets.json` ships it as a `config`
  artifact that **overwrites the user's tuned `.forge/presets.json` on every
  FORGE update** — directly defeating ADR-004's stated goal ("a user's tuned
  presets survive FORGE upgrades") and persona P2's JTBD ("without losing
  customizations", `discovery-brief.md:11`). The Phase-1 test (`plan.md:222`,
  "planned once and never overwritten on update") would FAIL against the
  described implementation.
- **Fix:** The plan must add the concrete create-once wiring, not just the
  un-exclude. Options: route `presets.json` through a `user-template` branch
  (e.g. a `USER_OWNED_NEUTRAL_FILES` set mirroring `USER_OWNED_FRONTEND_FILES`,
  or a `SCAFFOLD_FILES`-style entry projecting
  `templates/presets.json` → `.forge/presets.json`). Note the naming nuance:
  ADR-004 §3 wants the built-in to stay at `.forge/templates/presets.json`
  (fallback, `config`) AND a create-once `.forge/presets.json` (active) — that
  is **two** projection targets from one source, which the current un-exclude
  produces as exactly **one** (`.forge/templates/presets.json`). The active
  `.forge/presets.json` the resolver reads (FR-001/006) is never created at all
  under the plan as written.

---

## 3. Non-Blocking Findings

### B-3 — WARNING — Seed-once model handling collides with reconfigure's rewrite contract

- **Where:** `installer/platforms/opencode.ts:98-101` (`config.model` set only
  when `existing?.model === undefined`) and `:114-116` (same for
  `subagent_depth`) vs FR-002/FR-008 (`spec.md:57,63`), plan §4.1
  `mergeManagedKeys` (`plan.md:140`).
- **Issue:** The installer deliberately **never rewrites** `model` once the user
  has one (seed-once). The reconfigure command must do the opposite — *replace*
  `model` on every differing apply. The plan reuses `config.ts` helpers
  (`stripJsonComments`, `readExistingJsonConfig`) but must NOT reuse
  `generateOpenCodeConfig`'s seed-once path. The plan doesn't call out this
  divergence, risking an implementer wiring reconfigure through the seed-once
  generator and getting a silent no-op on `model`.
- **Fix:** Add an explicit note in §4.1 / §6.2 that `mergeManagedKeys` owns the
  rewrite and must bypass `generateOpenCodeConfig`'s seed-once gating.

### B-4 — WARNING — `cheap` policy is unsatisfiable on paid-only presets; cost-hint/privacy tests under-specified

- **Where:** plan §3 policy matrix (`plan.md:111`, "cheapest/free … prefer
  `-free`"), FR-004 (`spec.md:59`) vs `presets.json` `github-copilot`
  `alternatives.execution` = `["claude-sonnet-5.5"]` and `openai`/`google`
  (no `-free` anywhere).
- **Issue:** For 4 of 6 presets there is no `-free` model, so `--policy cheap`
  silently selects a **paid** execution model. That is defensible, but then the
  cost-hint test (`plan.md:294`) and privacy-gate test (`plan.md:296`) must
  include the case "cheap resolved to paid, no `-free`, no privacy prompt,
  paid-upgrade confirm DOES fire." The test plan only enumerates the `-free`
  path. The `-free` presets (only `opencode-free`) are the sole trigger for
  FR-007 — worth stating so coverage isn't accidentally one-sided.
- **Fix:** Add a test row: "`cheap` on paid-only preset → no privacy notice,
  cost hint marks paid, confirm required."

### B-5 — WARNING — ADRs are `Proposed`, not `Accepted`; plan Status `Draft`

- **Where:** ADR-004/005/006 Status lines; plan.md:8.
- **Issue:** `adversarial-review`'s Analyze checklist requires "Referenced ADRs
  exist and are **Accepted**." All three are **Proposed**. Governance-wise the
  ADR gate is open. For a solo dogfooding flow this is low-risk, but it should
  be an explicit accept step before implementation, not left Proposed through
  `/forge-tasks`.
- **Fix:** Flip ADR-004/005/006 to Accepted (after B-1/B-2 reconciliation, since
  B-2 changes ADR-004's mechanism) and move plan to an agreed status.

### B-6 — INFO — Line-number drift in plan §5 modify map

- **Where:** plan §5 (`plan.md:179`) cites `config.ts` "L45-58" for
  `DEFAULT_MODEL`/`REASONING_MODEL`/`PEER_REVIEW_MODEL`.
- **Issue:** Those constants are at `config.ts:45`, `:57`, `:58`;
  `DEFAULT_SUBAGENT_DEPTH` (`:56`) sits between them, so "L45-58" is a loose
  span that also swallows an unrelated constant. `defaultAgentConfigs` L61-73 is
  correct.
- **Fix:** Tighten to `L45, L57-58` (+ `L61-73`).

### B-7 — INFO — NFR-002 / NFR-006 are review-checklist assertions, not automated tests

- **Where:** `spec.md:71,75`; `plan.md:315,299,343`.
- **Issue:** NFR-002 (routing ~0s / no per-task LLM call) and NFR-006
  (actionable messages) are verified by "code review assertion" / "review
  checklist." These are legitimate for a static-routing invariant and prose
  quality, but they are the only two NFRs with no executable gate. Acceptable;
  flag so the reviewer is explicitly tasked at review time.

---

## 4. Verified-Clean Checks (evidence)

- **FR→plan coverage:** FR-001…009 each have a §4.1 function, a §8.1/§8.1a test
  row, and a §10 traceability row. No gaps.
- **Exit-code consistency:** `0/1/2` identical across spec §8 (`spec.md:105`),
  spec US-003/FR-003 (exit 2 usage), plan §3.2 table (`plan.md:99-103`), and
  edge-case table (`spec.md:81-87`). Consistent. (Note: spec §8 maps exit 1 to
  "availability/privacy-gate decline"; plan adds "cost-confirm declined" to
  exit 1 — a superset, not a conflict; recommend back-porting the cost-confirm
  clause into spec §8 for symmetry — INFO.)
- **Scope guard:** Flow C (dynamic per-task routing) is OUT in spec §10
  (`spec.md:115`), discovery §6 (`discovery-brief.md:72`), and absent from the
  plan's component/phase design. No leak.
- **Assumption closure:** `preset-home` and `policy-default` both marked
  RESOLVED 2026-10-06 in spec §11 (`spec.md:122-123`) and discovery §8. The two
  Unvalidated assumptions (cost-hint-sufficiency, presets-revival-impact) are
  correctly carried forward; presets-revival-impact is precisely what B-2
  surfaces as still unproven.
- **US-002 peer≠reviewer:** preset tier map assigns `forge-reviewer` to
  `reasoning` and `forge-reviewer-peer` to a distinct `peer` family in all
  presets that define `peer` (`presets.json:22-40` etc.); matches
  `buildManagedKeys` responsibility (`plan.md:135`). Note: `openai`/`google`
  presets have **no `peer` tier** — `buildManagedKeys` must fall back
  gracefully (not asserted in test plan — minor, folds into B-4 completeness).

---

## 5. Recommendation

**Verdict: CONDITIONAL.** The spec is internally sound and fully traced; the
blockers are plan/ADR-vs-reality contradictions, both concentrated in the
projection mechanism (B-2) and the managed-key definition (B-1).

Before `/forge-tasks`:

1. Fix **B-1** — state the reconfigure managed set (`model`/`providers`/`agents`)
   as intentionally distinct from installer `FORGE_MANAGED_KEYS`, or reconcile.
2. Fix **B-2** — add the concrete create-once + dual-target projection wiring in
   plan §7 Phase 1 and ADR-004; un-excluding alone is insufficient and ships the
   opposite behaviour.
3. Address **B-3** (seed-once bypass note) and **B-4** (paid-`cheap` test row) in
   the plan/test matrix.
4. Flip ADR-004/005/006 to **Accepted** after the above.

B-6/B-7 and the exit-1 symmetry note are INFO and may ride into implementation.

**Issues found: 7 (2 CRITICAL, 3 WARNING, 2 INFO).**

## 6. Follow-up (2026-10-08, Forge implement)

All B-items resolved by plan revision (architect, same day): B-1 two-list
contract (§2.5 + invariant test), B-2 dual-target scaffold mechanism (ADR-004
rewritten), B-3/B-4 folded in, ADRs Accepted. Implementation complete
(28/28 tasks mirate: 26 done, 5.4/5.5 this entry).
`/forge-review` primary: NEEDS CHANGES with 2 CRITICAL (dry-run gate ordering,
missing composition tests) — both fixed in `installer/model-config.ts`
(dry-run previews consent gates, exits 0; availability still aborts) + 4 new
tests; 3 WARNING fixed (conditional gh/git subprocess, --list-empty exit-1
contract locked by test + spec, parseModelRef unification); 2 INFO fixed
(dead try/catch removed, `-free` contract in presets `_comment`). Suite:
183/183 targeted, 363 full + 1 pre-existing env failure. Peer review
unavailable (persistent free-tier infra error) — human review is second lens.
Verdict carried to: READY FOR HUMAN REVIEW (no open CRITICAL).
