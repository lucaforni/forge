# Changelog

All notable changes to FORGE are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] · 2026-10-19

> The `v2.1.0` tag carries **97 commits** since `v2.0.0` — the first release
> that includes the cross-platform port. The `[2.0.0]` notes below describe
> only what the `v2.0.0` tag actually contains.

### Added

- **Cross-platform support** — OpenCode, Claude Code and Codex CLI, from a
  single canonical source projected per platform (ADR-001)
  ([#3](https://github.com/lucaforni/forge/pull/3)).
- Platform-aware auto-detection installer with SHA-256 manifest and drift
  detection, plus an install-contract test that fails when the installer
  stops shipping something an artifact references
  ([#76](https://github.com/lucaforni/forge/pull/76)).
- Shared MCP server (`mcp-server/`) for cross-platform custom tools
  ([#3](https://github.com/lucaforni/forge/pull/3)).
- Frontend pattern library — 17 UI pattern specifications with templates,
  design tokens and QA checklists (epic `E01`).
- Native Claude and Codex projection of every artifact
  ([#88](https://github.com/lucaforni/forge/pull/88)).
- Quality gates that enforce the constitution rather than describe it:
  coverage gate, token budgets, shell lint, typecheck and contract test
  ([#77](https://github.com/lucaforni/forge/pull/77)).
- Security posture: OpenSSF Scorecard, CodeQL, Dependabot across all three
  manifests, code-scanning alerts resolved, and no key material in the test
  harness logs
  ([#8](https://github.com/lucaforni/forge/pull/8),
  [#17](https://github.com/lucaforni/forge/pull/17),
  [#19](https://github.com/lucaforni/forge/pull/19),
  [#27](https://github.com/lucaforni/forge/pull/27),
  [#30](https://github.com/lucaforni/forge/pull/30)).
- Three-level smoke-test harness on NVIDIA NIM and OpenCode Zen
  ([#28](https://github.com/lucaforni/forge/pull/28)).

- `/forge-model-configure`: regenerate `model`/`providers`/`agents` in
  `opencode.json` from a versioned provider preset with a required
  `--policy=quality|speed|cheap`, key-scoped merge + timestamped backup +
  idempotency, per-tier cost hints, and a free-model privacy gate
  (warn always, confirm on private/undetectable repos). Backed by
  `installer/model-config.ts`; CLI alias
  `install-forge.ts --reconfigure --provider=<id> --policy=<p>`
  (spec `011-model-configure`, ADRs 004–006; closes the #72 preset orphan)

- **Interactive discovery skills** — three guided workshops wired into the
  orchestrator's discovery auto-suggest: `idea-exploration` (diverge → probe →
  converge → canvas, with a fixed rubric), `feature-discovery` (users, flows,
  edges, NFRs and an explicit scope line, with an assumption log), and
  `interactive-planning` (milestones, a trade-off round, an accepted-risk
  commitment template and an architect-decision guardrail). The orchestrator
  suggests the right one when a request is still vague; the suggestion never
  blocks the workflow
  ([#101](https://github.com/lucaforni/forge/pull/101))

- `subagent_depth` support: the installer seeds `subagent_depth: 5` into
  `opencode.json` on fresh install, and on update when the key is absent.
  OpenCode defaults to 1, which prevents subagents from launching subagents
  and breaks FORGE's fan-out (orchestrator → parallel workers → delegated
  subtasks, including dual-model review). An explicit user value always wins,
  including `0`
  ([#103](https://github.com/lucaforni/forge/pull/103))

### Fixed

- **OpenCode v2 installs were left in a failed state**: the installer now
  populates the plugin's own dependencies, and the v2 permission order is
  corrected with governance loaded through the plugin
  ([#92](https://github.com/lucaforni/forge/pull/92),
  [#94](https://github.com/lucaforni/forge/pull/94))
- The installer no longer walks `node_modules` when cataloguing artifacts,
  which polluted the manifest with the local build's dependencies
  ([#81](https://github.com/lucaforni/forge/pull/81))
- **CI and CodeQL now run on `develop`.** The workflows still triggered only
  on `main` after the branch policy moved feature PRs to `develop`, so every
  feature PR ran zero checks — "all CI checks must pass before merge" was
  not enforced on the branch where work lands
  ([#113](https://github.com/lucaforni/forge/pull/113),
  `DEC-2026-HF-002`)

- GitHub Copilot model IDs realigned to provider-available generations:
  reasoning `claude-opus-4.7` → `claude-opus-4.8`, execution/default
  `claude-sonnet-4.6` → `claude-sonnet-5.5`, fallback `claude-opus-4.6` →
  `claude-opus-4.8-fast` (peer `gpt-5.3-codex` unchanged) across
  `opencode.json`, templates, `installer/config.ts`, and the
  `github-copilot` preset — subagents were failing to launch
  (`DEC-2026-HF-001`)

- `decision-archiver` skill had no YAML frontmatter, so the runtime never
  registered it and `/forge-archive-decisions` was non-functional
  ([#59](https://github.com/lucaforni/forge/issues/59))
- `tests/smoke/nim-pilot.ts` was syntactically invalid (6 missing commas);
  `tsc --noEmit` exited 1 ([#60](https://github.com/lucaforni/forge/issues/60))
- `tsconfig.json` did not declare `types`, so `@types/node` and the Vitest
  globals were not resolved — ~80 spurious errors masked 20 real ones
  ([#60](https://github.com/lucaforni/forge/issues/60))
- `mcp-server/` was missing from `.github/dependabot.yml` despite declaring
  runtime dependencies ([#74](https://github.com/lucaforni/forge/issues/74))

### Removed

- `.opencode/tools/` — the OpenCode-native copies of the MCP tools, deleted
  rather than distributed. They duplicated `mcp-server/src/tools/` with
  divergent algorithms, and shipping both would distribute a known-
  inconsistent pair; the MCP server is the cross-platform tool surface
  ([#68](https://github.com/lucaforni/forge/issues/68)).

### Migration (upgrading from 2.0.0)

- **Delete `.opencode/tools/` in your project.** The installer never removes
  files it no longer ships, so a 2.0.0 project keeps three stale tools
  (`sprint-status.ts`, `trace-requirements.ts`, `validate-spec.ts`) sitting
  next to the MCP server that now provides them — the exact duplication
  they were deleted for:
  ```bash
  rm -rf .opencode/tools
  ```
- **The `--provider`, `--non-interactive` and `--no-backup` flags documented
  in `README-INSTALLER.md` and in the distributed `.opencode/docs/` do not
  exist.** The parser rejects them and exits with code 4. The supported
  flags are `--interactive`, `--force`, `--verbose`, `--update` and
  `--reconfigure`. To change the models, use
  `install-forge.ts --reconfigure --provider=<id> --policy=<quality|speed|cheap>`.
- Per-file interactive backup prompts are not implemented: a file that
  already exists is backed up before being overwritten, with no prompt to
  skip it.

### Changed

- **`develop` is the integration branch and `main` is release-only.** The
  branch and release policy is now written down in `AGENTS.md`: feature and
  fix PRs base on `develop`, `main` advances only through an explicit
  `chore(release): …` merge, and hotfixes land on `develop` first and ride
  the next release
  ([#101](https://github.com/lucaforni/forge/pull/101), commit `4f1b1ba`)

- **Documentation now states what the installer actually does.** `INSTALL.md`
  lost 146 lines of duplicated v1 content and an entire provider-preset
  section documenting flags that do not exist in the argument parser
  ([#72](https://github.com/lucaforni/forge/issues/72)). Per-platform install
  tables now mark what ships today versus the target state
  ([#56](https://github.com/lucaforni/forge/issues/56),
  [#57](https://github.com/lucaforni/forge/issues/57),
  [#70](https://github.com/lucaforni/forge/issues/70),
  [#71](https://github.com/lucaforni/forge/issues/71)).
- `README.md` documents the platform-directory precondition that previously
  made the Quick Start fail at step 1
  ([#58](https://github.com/lucaforni/forge/issues/58)); the duplicated
  project-structure block was removed and sprint paths corrected.
- `CONTRIBUTING.md` no longer points contributors at the gitignored `dev/`
  workspace, and its constitution and review sections match reality
  ([#74](https://github.com/lucaforni/forge/issues/74)).
- `AGENTS.md` was never customised — all 9 `CUSTOMIZE` markers removed, the
  false ESLint/Prettier stack claim dropped, and the review dimension count
  corrected from 5 to 7 ([#74](https://github.com/lucaforni/forge/issues/74)).

### Governance

- Constitution **Art. 2.2**: the blanket "zero runtime dependencies" claim was
  false. Replaced with a scoped rule — zero for the installer layer,
  explicitly justified and lockfiled for distributed runtime components.
- Constitution **Art. 4.1**: the flat 80% coverage gate had never been
  measured and was unreachable. Replaced with a staged baseline → gate →
  target tied to what CI actually runs
  ([#61](https://github.com/lucaforni/forge/issues/61)).
- Constitution **Art. 4.2**: the agent token budget now measures *effective
  context* (agent file + mandatory skills), not file size
  ([#73](https://github.com/lucaforni/forge/issues/73)).
- Constitution **Art. 4.4** (new): every mechanically checkable article
  requires a CI check. Articles without one are labelled as statements of
  intent.
- Constitution **Art. 5.2** (new): English is required for all distributed
  and public-facing artifacts, with known open violations enumerated
  ([#62](https://github.com/lucaforni/forge/issues/62)).

### Language

- `SECURITY.md`, all three GitHub issue/PR templates, the CI and Dependabot
  comments, and the distributed `frontend-pattern-library` skill translated
  from Italian to English
  ([#62](https://github.com/lucaforni/forge/issues/62)).

## [2.0.0]

> **Note.** The `v2.0.0` tag (2026-06-18) predates the cross-platform port:
> it contains the provider-presets engine only. The installer, the MCP
> server, the frontend pattern library and the cross-platform projection
> described in the previous changelog draft shipped **after** that tag and
> are therefore part of **2.1.0**, which is the first release to carry
> them. The entries below are the ones the tag actually contains.

### Added

- **Provider presets engine with multi-provider support** and interactive
  installation.
- `/forge-ux` and `/forge-wireframe` commands with the `forge-ux` agent.
- Dual-model adversarial review (`forge-reviewer` + `forge-reviewer-peer`).

> See [`docs/meta-development/project-plan.md`](docs/meta-development/project-plan.md)
> for the full roadmap and
> [`.forge-meta/knowledge/adr/`](.forge-meta/knowledge/adr/) for architecture
> decisions.

## [1.4.1] · [1.4.0] · [1.1.0]

Pre-2.0 releases predate this changelog. See the
[git history](https://github.com/lucaforni/forge/commits/main) and release
tags for details.

[Unreleased]: https://github.com/lucaforni/forge/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/lucaforni/forge/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/lucaforni/forge/releases/tag/v2.0.0
[1.4.1]: https://github.com/lucaforni/forge/releases/tag/v1.4.1
[1.4.0]: https://github.com/lucaforni/forge/releases/tag/v1.4.0
[1.1.0]: https://github.com/lucaforni/forge/releases/tag/v1.1.0
