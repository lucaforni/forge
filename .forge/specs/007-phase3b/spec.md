# Tech Spec 007 — Phase 3B: One Tool Implementation + Token Budget

| Field | Value |
|---|---|
| **ID** | 007-phase3b |
| **Track** | Feature |
| **Status** | Implemented |
| **Created** | 2026-09-17 |
| **Upstream** | 2026-09 audit; issues #68, #73 |

---

## Problem

**#68 — Three tools, two implementations each.** `validate-spec`,
`trace-requirements` and `sprint-status` exist in `.opencode/tools/`
(1,947 LOC) and `mcp-server/src/tools/` with divergent algorithms and
different results for the same input. Spec 004 § D-2 already decided the
MCP server is canonical (Art. 3.1) and `.opencode/tools/` is not
distributed — but the duplicate still exists, still diverges, and six
command/agent references still invoke functions (`rebuildSequenceFile()`)
that are unreachable dead code even in their own file.

**#73 — One skill over budget, budget measuring the wrong thing.**
`data-presentation/SKILL.md` is 449 lines / ~3,845 tokens against the
3,000-token Art. 4.2 limit. And the limit itself counts file size while
real cost is agent file + loaded skills (`forge-ux` loads ~9.6k effective
tokens through a 2,122-token file).

---

## Decisions

### D-1 — Consolidate on the MCP implementation, port what is uniquely valuable

`mcp-server/` is canonical. Ported into it:

| From `.opencode/tools/validate-spec.ts` | Target |
|---|---|
| FR checks (missing description / priority / story reference) | New `frIssues` array + counts; the MCP model had **zero** FR checks |
| Constitution article-row checks (row without status) | New `constitutionIssues` array; the absent-section case is already covered by `missingSections` and is not duplicated |
| Cross-reference body checks (no constitution/architecture mention) | New `crossReferenceIssues` array; absent section already covered |

Not ported: the OpenCode trace variant (plan File-Map-driven discovery).
The MCP brute-force discovery covers the same contract and is tested
(88%); the File-Map strategy is recorded as a possible enhancement, not a
second implementation. The OpenCode sprint-status migration engine and
sequence rebuild are orchestration steps, not tool functions — the two
`rebuildSequenceFile()` references become explicit agent steps.

`.opencode/tools/` (1,947 LOC, undistributed, partially dead) is deleted.

### D-2 — Split data-presentation by progressive disclosure

`SKILL.md` keeps decision logic: purpose, triggers, Step 0 (drives
everything), condensed Steps 1–5 (intent table, anatomy, decision tree,
storytelling order), integration contracts, quality gates. Step numbering
is preserved so existing cross-references (`Step 4.1`) keep working.

Detail tables move to two on-demand references:

- `reference/visualization.md` — hygiene rules, anti-patterns, KPI anatomy,
  composition, responsive rules
- `reference/interaction.md` — navigation patterns, state tables, filter
  rules, search parameters, query-builder spec, segmentation, annotation,
  microcopy

Target: core ≤ 2,600 tokens (margin under the 3,000 gate).

### D-3 — The budget script measures; the constitution gates units

`scripts/check-token-budget.ts` scans agent files for backtick-quoted skill
names (the one declaration style every agent file actually uses, verified
against all 12) and reports per-agent effective context. It **gates** what
is gateable today — skill files ≤ 3,000, agent files ≤ 5,000 — and
**reports** effective context. Constitution Art. 4.2 is amended to say
exactly that, with the measured table; the 5,000-effective target stays an
explicit aspiration (Art. 4.4) until the UX chain is slimmed, tracked as a
follow-up — not silently passed, not quietly dropped.

---

## Tasks

- [x] T-001 `[M]` Port FR/constitution/cross-ref checks to MCP `validate-spec`; extend result model, scoring, formatter; tests
- [x] T-002 `[S]` Rewrite the 6 `rebuildSequenceFile()` / migration-function references as explicit agent steps
- [x] T-003 `[S]` Delete `.opencode/tools/`; update AGENTS.md structure notes (tools removed, plugins distributed)
- [x] T-004 `[L]` Split `data-presentation` into core + 2 references; verify core ≤ 2,600 tokens
- [x] T-005 `[M]` `scripts/check-token-budget.ts` + CI `budgets` job; amend Art. 4.2/4.4
- [ ] T-006 `[S]` Full verification; adversarial review; resolve CRITICAL findings

## Acceptance Criteria

- [x] AC-1 — `.opencode/tools/` does not exist; no reference to its functions remains
- [x] AC-2 — MCP `validate-spec` flags undescribed FRs, status-less constitution rows, thin cross-references (7 new tests)
- [x] AC-3 — `data-presentation/SKILL.md` at 2,597 tokens; step numbers stable; cross-references intact
- [x] AC-4 — `npm run budgets` gates skill/agent file sizes in the `budgets` CI job; effective context reported
- [x] AC-5 — `npm test` green (245 tests); `tsc` clean; coverage gate holds (87.7% lines)
