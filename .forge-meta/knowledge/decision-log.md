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

## 2026-10-06 | Session: hotfix model IDs (011-model-configure unblocks)

**Status:** `completed`
**Tags:** `hotfix`, `models`, `github-copilot`, `installer`
**Spec Refs:** `011-model-configure`
**Decision ID:** `DEC-2026-HF-001`

### Context

All `forge-*` subagents pinned to `github-copilot/claude-opus-4.7` /
`claude-sonnet-4.6` started failing: provider reports those IDs unavailable
(available: `claude-opus-4.8`, `claude-opus-4.8-fast`, `claude-sonnet-5.5`,
`gpt-5.3-codex`, …). `forge-pm` and clarify subagents crashed, blocking 011.

### Decisions

1. **[COMPLETED]** Hotfix: swap model IDs only, no structural change
   - **Rationale:** Mechanical ID realignment (`opus-4.7`→`opus-4.8`,
     `sonnet-4.6`→`sonnet-5.5`, fallback `opus-4.6`→`opus-4.8-fast`;
     peer `gpt-5.3-codex` unchanged) across `opencode.json`,
     `.opencode/templates/opencode.json`, `installer/config.ts`,
     `presets.json` (github-copilot preset only). Other presets, docs
     examples left for 011 / docs pass. Scope exceeds Hotfix file-count
     but change is mechanical — recorded here per Spec-Code Traceability.
   - **Impact:** High (unblocks all subagents)
   - **Alternatives considered:**
     - Wait for provider to restore old IDs: rejected — no ETA, framework unusable.
     - Full 011 first: rejected — 011 itself needs working subagents for plan/review.
   - **Follow-up:** 011-model-configure makes this class of outage self-service.
     Explicit 011 docs-pass item (from hotfix review W1): sweep distributed
     `.opencode/docs/*` (FORGE-CUSTOMIZATION.md tier tables, UPDATING-FORGE.md
     examples) still advertising dead `opus-4.7`/`opus-4.6`/`sonnet-4.6` IDs.
     `opencode.json.example-customized` intentionally untouched: it is NOT
     distributed (EXCLUDED_TEMPLATES) and serves as merge-fixture illustration.
   - **Review:** primary `forge-reviewer` APPROVE, no CRITICAL (W1 + I1/I2 noted).
     Peer reviewer unavailable (infra: free-tier routing error, not model-related);
     human review is the second lens for this hotfix.

## 2026-10-08 | Session: 011-model-configure implement (Phases 1-5)

**Status:** `completed`
**Tags:** `feature`, `models`, `installer`, `spec-011`
**Spec Refs:** `011-model-configure`
**Decision ID:** `DEC-2026-011`

### Context

Full Feature track: discovery, spec (Clarified), plan, analyze
(CONDITIONAL, B-1/B-2), plan revision, tasks (28), implement Phases 1-5
in-orchestrator. Hotfix DEC-2026-HF-001 unblocked subagents first.

### Decisions

1. **[COMPLETED]** `/forge-model-configure` + `installer/model-config.ts` + `--reconfigure` alias
   - **Rationale:** Static policy routing (quality/speed/cheap) over versioned
     presets; dynamic per-task switching deferred. Dual-target projection
     (fallback `config` + active create-once `user-template`); two-list key
     contract with invariant test; fail-closed privacy gate.
   - **Impact:** High (new command surface, installer behavior)
   - **Deviations recorded in tasks.md:** (a) presets REMOVED from
     EXCLUDED_TEMPLATES (plan prose said keep - keeping ships nothing);
     (b) non-targeted tiers keep agentModels defaults; (c) AbortError removed
     as unreachable; (d) inline fixtures over fixtures dir.
   - **Review:** primary NEEDS CHANGES -> 7/7 fixed + tests (analysis.md s6).
     Peer unavailable (infra). Human review pending as second lens.
   - **Follow-up:** merge decision (human); remaining W1 docs prose
     (UPDATING-FORGE.md examples) rides a docs pass.

## 2026-10-19 | Session: hotfix CI trigger on `develop`

**Status:** `completed`
**Tags:** `hotfix`, `ci`, `branching`, `governance`
**Spec Refs:** —
**Decision ID:** `DEC-2026-HF-002`

### Context

The branch policy formalized on 2026-10-06 (commit `4f1b1ba`) moved the base
of feature PRs from `main` to `develop`, but `ci.yml` and `codeql.yml` still
triggered only on `push: main` / `pull_request: main`. Consequence: every PR
targeting `develop` ran **zero** checks — including PR #105 (spec 011) and
the 18 commits already merged into `develop`. "All CI checks must pass before
merge" (AGENTS.md) and the "enforced" rows of the constitution's Art. 4.4
enforcement table were therefore not enforced on the branch where work
actually lands.

### Decisions

1. **[COMPLETED]** Hotfix: trigger CI and CodeQL on `develop` as well as `main`
   - **Rationale:** The trigger must mirror the branch policy. A check that
     does not run is not an enforced rule — the same standard Art. 4.4
     applies to the article itself.
   - **Impact:** Medium — every PR and every push to `develop` now runs the
     full matrix (test ×3 Node versions, coverage gate, token budgets, shell
     lint, CodeQL). **Advisory, not blocking**: with no
     `required_status_checks` a red run still merges, and a direct push to
     `develop` is checked after it lands (see Follow-up #114).
   - **Alternatives considered:**
     - Trigger on `pull_request` only: rejected — a direct push to
       `develop` would then run nothing.
     - Move the release merge to `main`-first: rejected — contradicts the
       documented policy and delays integration.
   - **Follow-up:** #114 — `develop` has no branch protection and neither
     branch has `required_status_checks`; the trigger now runs the checks,
     but nothing blocks a red merge. Also: #115 — Dependabot reads its
     config from the default branch (`main`), where `target-branch` is still
     `main`, so the `target-branch: develop` setting is inert and all 6 open
     Dependabot PRs target the release-only branch.

### Notes

- **Review:** peer reviewer (`forge-reviewer-peer`) APPROVE WITH COMMENTS,
  11 findings, no CRITICAL. The primary reviewer could not run — its model
  pin `github-copilot/claude-opus-4.7` is unavailable (infra, same class as
  DEC-2026-HF-001; fixed by PR #105). Findings F1 and F2 (overstated
  enforcement claims in this log and in AGENTS.md) are applied in this
  commit; F3–F10 are tracked in #114 and #115.
- Verified locally on `origin/develop`: typecheck, 326 tests, coverage
  87.16% statements / 82.67% branches / 83.01% functions (gate 85/78/80),
  token budgets — all green.
- `mcp-server/node_modules` is not committed; run `npm ci` in `mcp-server/`
  before the test suite or `tests/unit/mcp-server.test.ts` fails to import
  `@modelcontextprotocol/sdk`.

## 2026-10-19 | Session: release 2.1.0 (first release under the develop policy)

**Status:** `completed`
**Tags:** `release`, `branching`, `changelog`
**Spec Refs:** —
**Decision ID:** `DEC-2026-REL-001`

### Context

`main` stood at `1329245` (2026-09-28) — **73 commits past the `v2.0.0`
tag** (2026-06-18) and untagged since. `develop` was 24 commits ahead of
`main`, and the `[Unreleased]` changelog section was missing three merged
changes (the discovery skills, `subagent_depth`, and the `develop`/`main`
policy itself).

Worse, the `v2.0.0` **tag** contains only the provider-presets engine: the
installer, the MCP server, the frontend pattern library and the
cross-platform port all landed *after* it, yet the `## [2.0.0]` changelog
section credited them to 2.0.0. The release therefore carries **97
commits** since the tag, and the notes had to say so.

### Decisions

1. **[COMPLETED]** Release `2.1.0` — minor bump, tag `v2.1.0`
   - **Rationale:** `2.1.0` because the release adds user-facing surface
     (`/forge-model-configure`, three discovery skills, `subagent_depth`)
     and the cross-platform port, without a breaking API change.
   - **Impact:** Medium — `main` advances 24 commits (73 past the `v2.0.0`
     tag; 97 since the tag). The version literal moves in `package.json`,
     `mcp-server/package.json`, both lockfiles, `installer/manifest.ts`,
     `installer/install.ts`, `mcp-server/index.ts`, `install-forge.ts`
     (banner + header), `install.sh`, `README.md` (badge),
     `README-INSTALLER.md` and the public docs (`INSTALL.md`,
     `CHEATSHEET.md`, both presentations).
   - **Note:** the changelog was completed **before** tagging, and the
     `## [2.0.0]` section was corrected to describe what the tag actually
     contains. A release note that omits shipped features — or that
     credits a predecessor for shipping them — is the same class of defect
     as a constitution that asserts falsehoods.
   - **Migration:** the release notes now carry an explicit
     "upgrading from 2.0.0" section (remove `.opencode/tools/`, the flags
     that do not exist, the backup-prompt behaviour) — see #119 for the
     installer-side fix.
   - **Follow-up:** #117 — the discovery-skills and `subagent_depth`
     changes were merged without a spec artifact, so they have no
     `NNN-slug/spec.md` to trace to (AGENTS.md, Spec-Code Traceability),
     and their commit messages claim "spec 011" / "012" while `011` is
     already taken by `011-model-configure`. #118 — the distributed docs
     still advertise non-existent CLI flags and the dead model IDs that
     `DEC-2026-HF-001` deprecated. #119 — the installer does not prune
     de-distributed artifacts and mislabels upstream drift as user edits.

### Notes

- **Review:** dual-model `/forge-review` on PR #116 — both lenses ran and
  both returned NEEDS CHANGES. The peer's finding that the changelog
  omitted ~73 commits of shipped work (and credited four of the biggest
  features to a `v2.0.0` tag that does not contain them) was the reason
  this entry now says 97. The primary's CRITICAL — "the unbumped
  lockfiles break `npm ci`" — was **verified false**: `npm ci --dry-run`
  succeeds at the root and in `mcp-server/` with the version mismatch. The
  lockfiles are bumped anyway, for consistency, not because `npm ci`
  requires it.
- Verified locally: typecheck, 378 tests, coverage 87.56% statements /
  83.45% branches / 83.83% functions (gate 85/78/80), token budgets.

## 2026-10-19 | Session: activate the merge gate (branch protection + required checks)

**Status:** `completed`
**Tags:** `governance`, `ci`, `branching`
**Spec Refs:** —
**Decision ID:** `DEC-2026-GOV-001`

### Context

PR #113 made the checks *run* on `develop`; nothing made them *block*. The
GitHub API confirmed: `develop` had no protection at all, `main` had
protection but no `required_status_checks`. The `v2.1.0` release then put
`target-branch: develop` on the default branch, so Dependabot's own PRs
finally target the integration branch.

### Decisions

1. **[COMPLETED]** Branch protection with required status checks on both
   `develop` and `main`
   - **Settings:** required contexts — `test (Node 20.x|22.x|24.x)`,
     `coverage gate`, `token budgets`, `shell lint`,
     `Analyze (javascript-typescript)`; `strict: true` (the branch must be
     up to date with its base, the only native lever against stale checks
     after a base advance); 1 code-owner approval with stale reviews
     dismissed; `enforce_admins: true`; linear history; no force push; no
     deletions; conversation resolution required.
   - **Rationale:** a check that does not block is advisory. `enforce_admins`
     is what makes the guarantee real for a single-maintainer repo, where
     every merge would otherwise be a deliberate admin bypass.
   - **Impact:** High — the merge path changes for everyone. `strict: true`
     means a PR must be rebased onto its base before the required checks
     count.
   - **Trade-off:** the repository is personal, so `restrictions` (who may
     push directly) is unavailable — GitHub allows it only for
     organizations.

2. **[COMPLETED]** A second code owner, to keep the gate operable
   - **Rationale:** a PR author cannot approve their own PR, and
     `require_code_owner_reviews` demands a code owner. With a single code
     owner, the maintainer could never merge their own PR — the gate would
     be a lock, not a gate. `@forniluca77` (the other collaborator with
     write access) is added to `.github/CODEOWNERS`.
   - **Impact:** Medium — the maintainer's PRs need one approval from the
     other account. The trade-off is explicit and reversible.

3. **[COMPLETED]** Dependabot now targets `develop` for real
   - **Rationale:** the `v2.1.0` release merge landed `target-branch:
     develop` on the default branch, which is the only place Dependabot
     reads it from. The setting had been inert for 13 days because it
     existed only on `develop`.
   - **Impact:** Low — Dependabot re-targeted the open PRs, closed the two
     it re-issued, and opened fresh ones against `develop`.

### Follow-up

- #114 — the remaining items are not settings: a coherence test that keeps
  the trigger honest, `codeql.yml` concurrency, and the `cancel-in-progress`
  interaction with required checks.
- #118 — CodeQL on a fork PR: `security-events: write` is unavailable for
  external contributors, so the required `Analyze (javascript-typescript)`
  context may fail for a first-time external contribution. Needs a
  one-off fork-PR test before the first one arrives.
