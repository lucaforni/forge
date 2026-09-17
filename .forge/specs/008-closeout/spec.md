# Tech Spec 008 — Closeout: Governance Residuals + UX Chain

| Field | Value |
|---|---|
| **ID** | 008-closeout |
| **Track** | Feature |
| **Status** | Implemented |
| **Created** | 2026-09-17 |
| **Upstream** | 2026-09 audit; issues #74, #84 |

---

## Problem

**#74 residuals.** Most of #74 closed across Phases 0–2, but four items
remain: the stale split-toolchain annotation (resolved by #82, annotation
left behind), the unimplemented `<!-- CUSTOMIZE -->` grep, six files
assuming the wrong constitution shape, and the abandoned 001-cross-platform
tracking artifacts.

**#84 — the UX chain exceeds the effective budget.** Measured
(`npm run budgets`): `forge-ux` loads 8,420 effective tokens against the
5,000 aspiration. The chain is heavy in three places: the agent file itself
(2,123, duplicating wireframe formats that also live in the wireframe
command), `ux-design` (1,313, checklist-heavy), and unconditional counting
of a conditional skill.

---

## Decisions

### D-1 — Constitutions are context-dependent; the skill disambiguates

User projects use the 9-article template; the FORGE repo uses the 5-article
meta constitution. Files operating on user projects (forge-init,
forge-analyze, forge-architecture, forge-implement) are correct as written
and stay untouched. Fixed: `constitution-compliance/SKILL.md` gains a Step 0
that selects the article map by which constitution is loaded (both maps
shipped in the skill), and `forge-architect-meta.md` enumerates the actual
five meta articles.

### D-2 — Close out 001-cross-platform truthfully, don't rewrite history

The 32 task boxes stay as they are — ticking work by another hand months
later would falsify the record. Instead a close-out record states per group
what shipped (with evidence) and what never happened (with follow-ups).
Spec/plan flip Draft → Shipped with the blocker banner annotated resolved
(the amendment it waited for ratified 2026-06-21). ADR-002/003 are written
now, narrowly scoped to what is verifiable: ADR-002 documents the
dependency decision the Phase 0 amendment already ratified; ADR-003 records
the shared-lib pattern as actually applied to tools. `/Users/luca/` paths
go repo-relative. The decision log is backfilled with the audit-phase
decisions (real decisions, correct dates, labeled backfilled) instead of
staying empty.

### D-3 — Budget the guaranteed load; report the worst case

Skills marked `(conditional)` in agent files load only when their stated
conditions hold (`data-presentation`: data conditions;
`ux-review`: UI changes). The budget script partitions mandatory vs
worst-case, gates mandatory effective ≤ 5,000 for every agent, and keeps
reporting worst-case. This is more accurate, not looser: the old number
over-counted by construction.

### D-4 — Cut duplication, not methodology

`forge-ux.md` drops the two inline wireframe format blocks (~585 tokens)
and points at the `forge-wireframe` command file, which ships in the same
install and which the agent can read on demand — the same indirection
pattern as the skill references. `ux-design` splits like
`data-presentation` did (WCAG + platform conventions → on-demand
reference). No check, gate, or process step is removed.

---

## Tasks

- [x] T-001 `[S]` Remove the stale split-toolchain annotation (Art. 2.1)
- [x] T-002 `[M]` Context-aware `constitution-compliance` skill (dual article maps); fix `forge-architect-meta.md` to five articles
- [x] T-003 `[S]` `<!-- CUSTOMIZE -->` coherence check (templates exempt by design); verify user-facing commands need no change
- [x] T-004 `[M]` 001-cross-platform close-out: record, statuses, ADR-002/003, path hygiene, decision-log backfill
- [x] T-005 `[M]` Mark conditional skills explicitly; script partitions mandatory/worst-case; gate mandatory ≤ 5,000
- [x] T-006 `[M]` Dedup wireframe blocks from `forge-ux.md`; split `ux-design`; amend Art. 4.2 with the outcome
- [x] T-007 `[S]` Full verification; adversarial review; resolve CRITICAL findings

## Review Outcome

Both subagent reviewers were unavailable again (quota + provider
restriction), so the review was performed directly with executed probes:

| Finding | Resolution |
|---|---|
| **`--json` printed human text after the JSON** (`All file budgets hold.` on stdout), breaking machine consumption. | Summary line suppressed under `--json`; violations were already on stderr. Verified parseable. |
| **4,522 vs hand recomputation 4,519** | Rounding, not a bug: the script rounds per file (`Math.round`), the probe truncated. Exact per-file sum matches. |
| **Skipped agent directories were silent** — a deleted agents dir would pass the gate vacuously. | stderr note on skip. |
| **Step 0 ambiguous when both constitutions exist** (the FORGE repo has both). | Explicit rule: both present means meta-development, use Map B. |
| Transplanted §2b repeated its own first line after the new intro. | Deduped. |

Probes also confirmed: Map B titles match the constitution headings exactly;
tagged conditionals carry their conditions inline (no skip-permission risk);
close-out evidence verified against the tree (installer files, `v2.0.0` tag,
28 tracked `.forge` files); conditional partition math rechecked.

## Acceptance Criteria

- [x] AC-1 — No file assumes a 9-article constitution in a meta context (skill is context-aware; meta agent fixed; user files verified correct)
- [x] AC-2 — 001-cross-platform reads as closed history: statuses, close-out record, ADR-002/003 present, no absolute paths, decision log backfilled
- [x] AC-3 — `npm run budgets` gates mandatory effective ≤ 5,000 for every agent and reports worst-case
- [x] AC-4 — `forge-ux` mandatory effective at 4,522 (margin ~480); no gate, check or step removed
- [x] AC-5 — `npm test` green (248 tests); `tsc` clean; coverage gate holds
