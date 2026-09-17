# Changelog

All notable changes to FORGE are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

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

### Changed

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

### Added

- **Cross-platform support** — OpenCode, Claude Code and Codex CLI, from a
  single canonical source projected per platform (ADR-001).
- Platform-aware auto-detection installer with SHA-256 manifest and drift
  detection.
- Shared MCP server (`mcp-server/`) for cross-platform custom tools.
- Frontend pattern library — 17 UI pattern specifications with templates,
  design tokens and QA checklists (epic `E01`).
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

[Unreleased]: https://github.com/lucaforni/forge/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/lucaforni/forge/releases/tag/v2.0.0
[1.4.1]: https://github.com/lucaforni/forge/releases/tag/v1.4.1
[1.4.0]: https://github.com/lucaforni/forge/releases/tag/v1.4.0
[1.1.0]: https://github.com/lucaforni/forge/releases/tag/v1.1.0
