# Decision Log

> This file captures session-level decisions made during development. The
> `session-knowledge` plugin auto-appends entries when sessions end. Important
> decisions should be promoted to formal ADRs in `.forge/knowledge/adr/`.
>
> **Format**: Each entry records the date, session context, and decisions made.
>
> **Maintenance**: Weekly review by tech lead. Promote significant decisions
> to ADRs. Archive stale entries.

---

<!-- Decisions will be appended below by the session-knowledge plugin and /forge-adr command -->

> **Backfill note (2026-09-17):** the `session-knowledge` plugin never fired
> on this repository — the entries below reconstruct the audit-phase
> decisions (all real, all merged to `main`) so the log is not empty.
> They are labeled backfilled.

## 2026-09-17 | Session: 2026-09 project audit + Phases 0–3B (backfilled)

**Status:** `completed`
**Tags:** `audit`, `installer`, `governance`, `meta-development`
**Spec Refs:** `004-installer-contract`, `005-ci-quality-gates`, `006-framework-coherence`, `007-phase3b`
**Decision ID:** `DEC-2026-001`

### Context

Full-repo audit (agents/commands/skills × code/tests/CI × docs/UX) found the
framework surface had drifted from its implementation: the installer shipped
3 of 7 documented directories, coverage was unmeasurable, the constitution
asserted falsehoods, and the v2.0 feature itself had 0/32 tasks checked.
Remediation ran as Phases 0–3B, each through spec → implement → adversarial
review → merge, closing 16 of 19 audit issues.

### Decisions

1. **[COMPLETED]** Templates and docs install platform-neutral under `.forge/`
   - **Rationale:** One path resolves identically on OpenCode, Claude Code
     and Codex; per-platform copies would triple content and stay broken on
     two platforms out of three.
   - **Impact:** High
   - **Alternatives considered:**
     - Per-platform `templates/` dirs: rejected — triplicates content.
     - Inline templates into commands: rejected — bloats every command file.
   - **Follow-up:** #70/#71 for the remaining projection gaps.

2. **[COMPLETED]** `.opencode/tools/` deleted rather than distributed (#68)
   - **Rationale:** It duplicated the MCP tools with divergent results and
     was never installed; shipping both would distribute a known-inconsistent
     pair. The MCP server is the constitutional tool surface (Art. 3.1).
   - **Impact:** High (−1,947 LOC)
   - **Trade-offs:** The plan File-Map discovery variant is gone; recorded
     as a possible enhancement, not a second implementation.

3. **[COMPLETED]** Constitution amended to state what is true (Art. 2.2, 4.1,
   4.2, 4.4 new, 5.2 new)
   - **Rationale:** A constitution that asserts falsehoods produces wrong
     compliance verdicts. Every compliance check derives from these premises.
   - **Impact:** High
   - **Follow-up:** #84 for the UX-chain effective budget (since closed by
     spec 008 work — see below).

4. **[COMPLETED]** Token budgets gate file sizes and report effective context
   - **Rationale:** Gating effective context immediately would fail CI on the
     current UX design; the honest state is units-gated plus
     effective-reported. Split `data-presentation` 3,845 → 2,597 regardless.
   - **Impact:** Medium
   - **Follow-up:** #84 (UX chain toward 5,000 effective).

5. **[COMPLETED]** Merge-don't-clobber for `opencode.json`, with backup
   - **Rationale:** Silently discarding user configuration on update is data
     loss. Unknown keys, custom models, own agents and MCP servers survive;
     the previous file is backed up first.
   - **Impact:** High

## 2026-09-17 | Session: spec 008 close-out (backfilled)

**Status:** `completed`
**Tags:** `governance`, `ux`, `budgets`
**Spec Refs:** `008-closeout`
**Decision ID:** `DEC-2026-002`

### Context

Closing audit issues #74 (residuals) and #84 (UX chain).

### Decisions

1. **[COMPLETED]** Budget the guaranteed load; report the worst case
   - **Rationale:** Conditional skills (`data-presentation`, `ux-review`)
     load only when their stated conditions hold. Gating the worst case
     would punish documented optionality; ignoring conditionals over-counts
     by construction. Mandatory effective ≤ 5,000 is gated per agent.
   - **Impact:** Medium
   - **Alternatives considered:**
     - Gate worst-case: rejected — fails CI on legitimate conditional design.
     - Report-only everything: rejected — no enforcement at all.
   - **Follow-up:** none; rule encoded in `scripts/check-token-budget.ts`.

2. **[COMPLETED]** Slim by deduplication, not by removing methodology
   - **Rationale:** The UX chain's weight was duplicated wireframe blocks
     (now single-homed in the wireframe command) and checklist bulk in
     `ux-design` (now on-demand references). No gate, check or process step
     removed — the cuts are all redundancy.
   - **Impact:** Medium (`forge-ux` mandatory 8,785 → 4,522 including the
     `ux-design` split and conditional partition).

3. **[COMPLETED]** 001-cross-platform closed as history, not rewritten
   - **Rationale:** Ticking 32 boxes by another hand months later would
     falsify the tracking record. A close-out record with per-group verdicts
     plus ADR-002/003 (scoped to the verifiable) is the truthful artifact.
   - **Impact:** Low
