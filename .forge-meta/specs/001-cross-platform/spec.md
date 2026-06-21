# Spec: 001 - Cross-Platform Support (Claude Code & Codex CLI)

> Feature specification for porting FORGE from OpenCode-exclusive to a
> multi-platform methodology framework that also runs on Claude Code and
> Codex CLI. Created by `forge-pm` via `/forge-specify`.

| Field   | Value                       |
| ------- | --------------------------- |
| Status  | Draft                       |
| Author  | forge-pm                    |
| Date    | 2026-06-21                  |
| Track   | Epic                        |
| Spec ID | 001                         |
| Scope   | Meta-development (FORGE itself) |

> **⚠️ CONSTITUTIONAL BLOCKER**: This spec proposes a change that violates
> Article 1.2 of the current FORGE constitution ("OpenCode-native: FORGE
> is built specifically for OpenCode"). A constitutional amendment is a
> **hard prerequisite** for this work — see Section 13. Until the
> amendment is ratified, this spec is **provisional**.

---

## 1. Overview

FORGE currently runs exclusively on OpenCode. This spec defines the work
required to make FORGE a **platform-agnostic methodology framework** that
installs and runs natively on three target platforms with a single shared
codebase:

| Platform     | Vendor    | Native Layout                                                   |
| ------------ | --------- | --------------------------------------------------------------- |
| OpenCode     | OpenCode  | `.opencode/{agents,commands,skills,tools,plugins}/`, `opencode.json` |
| Claude Code  | Anthropic | `.claude/{agents,commands,skills,hooks}/`, `.claude/settings.json`, `CLAUDE.md` |
| Codex CLI    | OpenAI    | `.codex/{agents,commands}/`, `.agents/skills/`, `.codex/config.toml`, `AGENTS.md` |

The strategy is **single source of truth + per-platform projection**:
authored artifacts (agents, commands, skills, project instructions) are
maintained once in their canonical Markdown form, then installed/symlinked
into the layout each detected platform expects. Platform-specific
divergences (config schema, hook/event system, custom-tool runtime) are
isolated to thin adapter layers.

The outcome is: an existing OpenCode FORGE user sees **zero behavior
change**; a new Claude Code or Codex CLI user gets a fully functional
FORGE installation from a single command.

## 2. Problem Statement

FORGE's value proposition — structured AI-assisted workflows with
constitution-driven governance — is locked behind a single agentic-coding
runtime, OpenCode. This single-runtime coupling creates four concrete
problems: a closed addressable market, an adoption blocker for teams
standardized on alternative runtimes, methodology-vs-product credibility
optics, and compounding maintenance cost for any future port. The
remainder of this section quantifies the coupling, enumerates the pain
points, and explains why the work is timely.

**Current coupling (verified inventory):**

| Coupling                     | Count | Location                          |
| ---------------------------- | ----- | --------------------------------- |
| Agent definitions            | 9     | `.opencode/agents/*.md`           |
| Slash commands               | 24    | `.opencode/commands/*.md`         |
| Skills                       | 12    | `.opencode/skills/*/SKILL.md`     |
| Custom tools (TS)            | 3     | `.opencode/tools/*.ts`            |
| Plugins (TS)                 | 3     | `.opencode/plugins/*.ts`          |
| Root config                  | 1     | `opencode.json`                   |
| Installer                    | 1     | `install-forge.ts` (~1360 lines)  |
| Subagent-spawn primitive     | —     | OpenCode `task` tool              |
| Project instructions         | 1     | `AGENTS.md`                       |

**Pain points:**

1. **Market exclusion** — Claude Code (Anthropic) and Codex CLI (OpenAI)
   together represent a substantial share of the AI-coding tooling
   audience. FORGE is invisible to them.
2. **Methodology adoption risk** — teams that standardize on a non-OpenCode
   runtime cannot adopt FORGE without abandoning their toolchain.
3. **Vendor lock-in optics** — a methodology framework that mandates a
   specific vendor's runtime is structurally less credible as a
   *methodology* than as a *product*.
4. **Maintenance scaling concern** — without a designed cross-platform
   strategy, future ports would each require a 1360-line installer
   rewrite plus tool/plugin reimplementation. The cost compounds.

**Why now:** Claude Code and Codex CLI have both reached feature parity
sufficient to host FORGE's primitives — native subagents, MCP-based tool
extensibility, SKILL.md-compatible skill loading, and Markdown-based
agent/command authoring. The translation surface is small and
well-defined *today*; it may grow as each platform diverges.

## 3. User Stories

Five stories cover the principal personas: new Claude Code user, new
Codex CLI user, existing OpenCode user (regression guarantee), FORGE
maintainer (DX guarantee), and multi-platform user. Each story has
testable Given/When/Then acceptance criteria.

### US-001: Claude Code user installs FORGE

**As a** Claude Code user starting a new project, **I want** to install
FORGE with a single command, **so that** I can use all `/forge-*` slash
commands and FORGE subagents without learning OpenCode.

**Acceptance Criteria:**
- Given a project directory with only `.claude/` present, when the user
  runs the FORGE installer, then `.claude/agents/`, `.claude/commands/`,
  `.claude/skills/`, `.claude/settings.json`, and `CLAUDE.md` are created
  or updated.
- Given the install completes, when the user opens Claude Code in that
  project, then all 24 `/forge-*` commands are discoverable.
- Given the user invokes `/forge-specify`, when Claude Code dispatches to
  the `forge-pm` subagent, then the subagent loads the same instructions
  and skills it loads on OpenCode.
- Given a custom tool is invoked (e.g. `validate-spec`), when it runs
  through the MCP server, then it returns the same output schema as the
  OpenCode version.

### US-002: Codex CLI user installs FORGE

**As a** Codex CLI user, **I want** to install FORGE with a single
command, **so that** I can use the full FORGE workflow inside Codex.

**Acceptance Criteria:**
- Given a project directory with only `.codex/` present, when the user
  runs the FORGE installer, then `.codex/`, `.agents/skills/`,
  `.codex/config.toml`, and `AGENTS.md` are created or updated.
- Given the install completes, when the user runs Codex CLI in that
  project, then all 24 FORGE commands are available and all 9 FORGE
  subagents are spawnable.
- Given the user invokes a command that spawns parallel subagents, when
  Codex CLI uses its native worker model, then the orchestration behaves
  semantically equivalently to OpenCode's `task` tool (same inputs,
  same outputs, same handoff contract).
- Given the user requests a custom tool, when the MCP server is reachable,
  then results are identical to OpenCode.

### US-003: Existing OpenCode user — zero regression

**As an** existing FORGE user on OpenCode, **I want** the cross-platform
work to have no observable effect, **so that** my workflows, slash
commands, and subagent behavior are unchanged.

**Acceptance Criteria:**
- Given an existing OpenCode FORGE installation, when the user upgrades
  to the cross-platform release, then `.opencode/` contents are
  byte-identical for agents, commands, and skills (excluding the optional
  MCP-server configuration block in `opencode.json`).
- Given the upgraded installation, when the user runs any `/forge-*`
  command, then output is functionally identical to pre-upgrade (asserted
  by a regression suite of representative commands).
- Given the upgrade, when the user inspects FORGE artifacts in `.forge/`,
  then nothing in the user's data has been moved, renamed, or rewritten.

### US-004: FORGE maintainer — single codebase

**As a** FORGE maintainer, **I want** to maintain one source of truth for
agents, commands, and skills, **so that** a fix or feature ships to all
platforms in a single PR with no duplicated edits.

**Acceptance Criteria:**
- Given a change to any agent in `.opencode/agents/`, when CI runs, then
  the installer's projection for `.claude/agents/` and `.codex/agents/`
  is verified to be derived (not hand-edited).
- Given a new skill is added, when the installer runs on each platform,
  then the skill is installed to each platform's correct skill location
  without per-skill code changes in the installer.
- Given a platform-specific divergence is necessary (e.g. a hook event
  with no equivalent), when the maintainer adds it, then the divergence
  is isolated to a single adapter file per platform and not scattered
  across agents/commands/skills.

### US-005: User has multiple platforms installed

**As a** user with both `.claude/` and `.codex/` directories in the same
project, **I want** FORGE to install correctly for all detected
platforms, **so that** I can switch between runtimes freely.

**Acceptance Criteria:**
- Given a project containing `.opencode/`, `.claude/`, and `.codex/`,
  when the installer runs, then artifacts are installed into all three
  layouts.
- Given multi-platform install, when the user runs the same command in
  any of the three runtimes, then results are semantically equivalent.

## 4. Functional Requirements

| ID     | Requirement                                                                                                                                                                                                                | Priority | Story Ref       |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| FR-001 | Installer MUST auto-detect supported platforms by probing for `.opencode/`, `.claude/`, and `.codex/` directories in the project root; presence of any of these is sufficient to mark that platform as a target.            | Must     | US-001, US-002, US-005 |
| FR-002 | Installer MUST generate platform-correct root config: `opencode.json` (JSON schema), `.claude/settings.json` (JSON schema), `.codex/config.toml` (TOML), from a single internal config model.                                | Must     | US-001, US-002  |
| FR-003 | The three existing custom tools (`validate-spec`, `trace-requirements`, `sprint-status`) MUST be exposed as a single MCP server (`forge-mcp-server`) reachable from all three platforms via each platform's MCP client configuration. | Must     | US-001, US-002, US-004 |
| FR-004 | Plugin behaviors (`pre-commit-gate`, `session-knowledge`, `spec-watcher`) MUST be projected into each platform's native hook/event system, preserving observable effects (Git hook gate, session-end knowledge capture, spec change watching).                                                                                                                  | Must     | US-001, US-002  |
| FR-005 | Agent files (9 files, Markdown + YAML frontmatter) MUST install to each platform's expected location: `.opencode/agents/`, `.claude/agents/`, and Codex CLI native agent location. Per RISK-009, the installer MUST NOT rely on Codex CLI's `.claude/agents/` fallback as the sole mechanism: `.codex/agents/*.toml` (or current Codex-native form) MUST be generated directly — see Open Question OQ-04.                                                                                       | Must     | US-001, US-002, US-004 |
| FR-006 | Command files (24 files) MUST install to each platform's expected location: `.opencode/commands/`, `.claude/commands/`, `.codex/commands/`.                                                                                | Must     | US-001, US-002  |
| FR-007 | Skill files (12 skill directories) MUST install to each platform's expected location: `.opencode/skills/*/SKILL.md`, `.claude/skills/*/SKILL.md`, `.agents/skills/*/SKILL.md`.                                              | Must     | US-001, US-002  |
| FR-008 | Project-instruction file MUST be single-source. Canonical content is in `AGENTS.md` at project root. `CLAUDE.md` MUST use Claude Code's `@AGENTS.md` import syntax rather than a content copy (per RISK-005, to prevent per-platform divergence). Codex CLI reads `AGENTS.md` natively, no projection needed.                                                                                                                                                                                                            | Must     | US-001, US-002  |
| FR-009 | Existing OpenCode installations MUST continue to work unchanged after upgrade. The cross-platform installer running on an OpenCode-only project MUST produce a byte-identical `.opencode/` tree compared to the legacy installer (excluding the optional new MCP-server config block).                                                                                                                                                                                  | Must     | US-003          |
| FR-010 | A single install entry point (`bun run install-forge` or equivalent) MUST handle fresh installs, upgrades, and multi-platform installs without per-platform flags. Auto-detection from FR-001 drives platform selection.                                                                                                                                                                                                                                                | Must     | US-001, US-002, US-003, US-005 |
| FR-011 | Subagent dispatch on platforms lacking the OpenCode `task` tool MUST be implemented via the platform's native subagent invocation primitive (Claude Code `@-mention`; Codex CLI worker spawn). The mapping MUST preserve a documented **subagent-dispatch contract** (per RISK-004) consisting of: (a) input serialization format (JSON envelope), (b) output return format (structured JSON when caller expects structured; markdown otherwise), (c) error envelope format, (d) maximum recursion depth per platform. The contract is normative and published in `docs/meta-development/subagent-contract.md`.                                                                                                                            | Must     | US-001, US-002, US-004 |
| FR-012 | The installer MUST print a post-install summary listing: detected platforms, files installed per platform, location of MCP-server config, and any skipped artifacts (with reasons). Errors must be actionable.                                                                                                                                                                                                                                                                                | Should   | US-001, US-002  |
| FR-013 | The installer MUST support an `--dry-run` flag that prints the planned operations without writing files.                                                                                                                   | Should   | US-001, US-002, US-005 |
| FR-014 | The installer MUST detect prior FORGE installations (any platform) and preserve user-edited files. Detection is checksum-based; on drift, behavior depends on mode: **non-interactive (default)** backs up the drifted file to `.forge/.backups/<timestamp>/<original-path>` (inside `.forge/`, which is `.gitignored` by convention) and proceeds; **interactive** (`--interactive`) shows a unified diff and prompts per file (`overwrite` / `keep` / `merge`). Post-install summary MUST surface the backup path prominently when any backup was made — see Open Question OQ-07 and RISK-007.                    | Must     | US-003          |
| FR-015 | If no supported platform directory is detected, the installer MUST exit non-zero with a clear message explaining which directories are looked for and how to create one (e.g. `mkdir .claude` or initializing the IDE).    | Must     | US-001, US-002  |
| FR-016 | When the MCP server is unreachable, each FORGE custom-tool invocation MUST return a structured, user-facing error stating (a) which tool was invoked, (b) the expected MCP server location, (c) the suggested remediation command (e.g. `bun run mcp-server`). Host commands MUST NOT crash silently. Per RISK-002.                                                                                                                                                                                                                                                                                                            | Must     | US-001, US-002  |
| FR-017 | CI MUST enforce per-platform projection consistency by running `install-forge --dry-run --check` against a representative project fixture for each platform and asserting **0 diff** against checked-in snapshot outputs. Any agent/command/skill addition that forgets a platform projection MUST fail CI. Per RISK-003.                                                                                                                                                                                                                                                                                                       | Must     | US-004          |
| FR-018 | CI MUST enforce single-source-of-truth for content artifacts via a checksum-equivalence check: after install, the SHA-256 of `.opencode/agents/X.md`, `.claude/agents/X.md`, and the Codex projection of X MUST be equal (or, where format conversion is required, derived deterministically from a recorded build manifest). Per RISK-005.                                                                                                                                                                                                                                                                                       | Must     | US-004          |
| FR-019 | The repository MUST maintain a **platform deviation log** at `docs/meta-development/platform-deviations.md` cataloging every observed per-platform quirk, its scope, and any workaround applied. Each new deviation requires an entry. Per RISK-008.                                                                                                                                                                                                                                                                                                                                                                            | Should   | US-004          |

## 5. Non-Functional Requirements

| ID      | Category        | Requirement                                                                                                                                                          | Target                                                                 |
| ------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| NFR-001 | Performance     | Install completes in under 10 seconds on a typical project (1 detected platform, SSD, warm filesystem cache).                                                        | P95 wall-clock < 10s; P50 < 4s. Measured by installer self-instrumentation. |
| NFR-002 | Compatibility   | All currently-passing OpenCode FORGE behaviors continue to pass after upgrade. Regression coverage is **snapshot-based**: before the refactor, baseline outputs are captured for each FORGE command and each subagent invocation in a representative project; after the refactor, snapshots must match. Per RISK-001.                                                                                       | 100% of regression suite green; ≥ 24/24 command snapshots and ≥ 9/9 subagent snapshots match byte-for-byte (or via a documented stable-diff allowlist). |
| NFR-003 | Usability       | Platform detection is fully automatic — no `--platform=` flag required for normal use. A flag MAY exist to override detection but is not the default path.            | 0 required flags for the happy path on each platform.               |
| NFR-004 | Maintainability | Cross-platform code reuse: shared source-of-truth content (agents, commands, skills, project instructions) MUST NOT be duplicated. Per-platform divergence is confined to adapters. | ≥ 80% of installer + content lines are platform-agnostic; per-platform adapter code ≤ 20%. Measured by `cloc` against tagged regions. |
| NFR-005 | Footprint       | Token budgets from constitution Article 4.2 are preserved unchanged on every platform.                                                                               | Each agent ≤ 5k tokens, each skill ≤ 3k tokens, total session ≤ 50k.   |
| NFR-006 | Reliability     | Installer is idempotent — running twice in a row on the same project produces the same state and zero spurious writes.                                                | 0 filesystem writes on the 2nd run (verified by checksum).             |
| NFR-007 | Observability   | Installer logs every file written and every file skipped at INFO level. ERROR-level messages name the file, the reason, and the suggested fix.                       | 100% of write operations logged; 100% of error messages include a remediation hint. |
| NFR-008 | Security        | Installer runs without root/admin privileges and never writes outside the target project directory.                                                                  | 0 writes outside CWD; 0 `sudo`/admin invocations required.             |
| NFR-009 | Portability     | Installer runs on macOS (Intel + Apple Silicon), Linux (x64 + ARM64), and Windows (WSL2). Native Windows is out of scope (see Section 7).                              | 5/5 target OS combinations green in CI (macOS-x64, macOS-arm64, Linux-x64, Linux-arm64, WSL2). |

## 6. Edge Cases & Error Scenarios

| #  | Scenario                                                                                                                | Expected Behavior                                                                                                                                                       |
| -- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | User has both `.claude/` and `.codex/` (no `.opencode/`).                                                              | Both platforms are detected; installer installs to both layouts; post-install summary lists both. No prompt required.                                                   |
| 2  | User has all three: `.opencode/`, `.claude/`, `.codex/`.                                                                | All three detected; install to all three. MCP-server config block added to each platform's config.                                                                      |
| 3  | User has only `.opencode/` (legacy install).                                                                            | Behaves identically to legacy installer. Optional: post-install message hints that `.claude/` or `.codex/` would also be installable if present.                       |
| 4  | No platform directories present.                                                                                        | Installer exits non-zero per FR-015 with the message: which directories were looked for, and how to create them.                                                        |
| 5  | User has hand-edited `.opencode/agents/forge-pm.md` (or any artifact).                                                  | Installer detects checksum drift and per FR-014 either backs up to `.forge-backup-<timestamp>/` or prompts (decision pending in OQ-07). Never silently overwrites.       |
| 6  | User runs installer as non-root on a directory they own.                                                                | Install succeeds. No privilege escalation. (NFR-008.)                                                                                                                   |
| 7  | User runs installer as non-root on a directory they do not own (permission denied).                                     | Installer exits non-zero with a clear permission-error message and the path that failed.                                                                                |
| 8  | Update vs fresh install — re-run of installer on an existing FORGE install.                                             | Files unchanged from last install are not rewritten (NFR-006). Files with drift are handled per FR-014. New FORGE artifacts (e.g. new agent added in this release) are installed. |
| 9  | A platform's native subagent primitive fails or is unavailable mid-run (Claude Code @-mention 404, Codex worker crash). | Command surfaces the platform-specific error verbatim plus a FORGE-level wrapper explaining which subagent was being invoked and what the user can do.                  |
| 10 | MCP-server binary is missing or unreachable when a custom tool is invoked.                                              | Tool call returns a structured error with: server expected location, last known status, and the command to (re)start it. The host command does not crash silently.     |
| 11 | User's `opencode.json`/`settings.json`/`config.toml` contains pre-existing keys that conflict with FORGE-managed keys.   | Installer warns, lists the conflicting keys, and per OQ-09 either merges with backup or aborts requesting manual resolution.                                            |
| 12 | Disk space exhaustion during install.                                                                                   | Installer aborts cleanly, no partial writes left behind (or, if partial, lists them and instructs cleanup). Exit code distinguishes this from logic errors.             |
| 13 | Two platforms attempt to spawn the *same* FORGE subagent concurrently in the same project.                              | Out of scope for v1 — subagent processes are stateless w.r.t. each other; concurrency is the platform's responsibility. Documented as a known limitation.               |
| 14 | Codex CLI version that does *not* fall back to `.claude/agents/` (older or unrelated build).                            | Installer detects Codex version (if possible) and writes `.codex/agents/*.toml` directly; if version detection fails, writes both `.codex/` and `.claude/` agent forms. See OQ-04. |
| 15 | User installs FORGE on a Windows shell *not* in WSL2.                                                                   | Installer exits non-zero with a message that native Windows is unsupported in v1 and recommends WSL2.                                                                   |

## 7. Data Requirements

This spec does not introduce new persistent data structures within
`.forge/`. It introduces **installer-internal data models** that are
not user-facing:

| Entity                  | Purpose                                                                                  | Storage                          |
| ----------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- |
| `PlatformDescriptor`    | One per supported platform; declares directory layout, config format, hook/event names. | In-code constant in installer.   |
| `CanonicalArtifact`     | Source-of-truth representation of an agent/command/skill (path, content, frontmatter).   | Files in `.opencode/` (canonical, per FR-009). |
| `InstallPlan`           | Per-run computed list of write operations, keyed by platform.                            | Ephemeral; printable via `--dry-run`. |
| `InstallManifest`       | Written to `.forge/.install-manifest.json` after each install — records what was placed where, with checksums, to enable idempotency (NFR-006) and drift detection (FR-014). | `.forge/.install-manifest.json`. |

## 8. API Requirements

No HTTP API. Two CLI / IPC surfaces:

| Surface                  | Caller                            | Description                                                                                                |
| ------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `install-forge` CLI      | Human / CI                        | Entry point. Flags: `--dry-run`, `--platform=<name>` (override detection, advanced), `--force` (overwrite drift). |
| `forge-mcp-server` (MCP) | OpenCode / Claude Code / Codex CLI | Exposes `validate-spec`, `trace-requirements`, `sprint-status` as MCP tools. Input/output schemas identical to current `.opencode/tools/*.ts`. |

## 9. UX/UI Notes

CLI ergonomics (no GUI):

- Installer output uses concise, scannable lines. No spinners, no ASCII
  art. One line per platform, one line per artifact group.
- Errors include: what failed, where (path), why, and one suggested next
  action.
- `--dry-run` output uses an inline diff format (`+ .claude/agents/forge-pm.md`).
- Per FORGE constitution Article 1.3, error messages must be actionable.
- Accessibility: no color-only signaling. All status uses both color and a
  text prefix (e.g. `[OK]`, `[SKIP]`, `[ERR]`).

## 10. Out of Scope

The following are explicitly **not** in this spec; tracked as future work:

- **Windsurf, Continue.dev, Gemini CLI, Cursor, Cline, Aider, or any other
  agentic coding tool** beyond the three named platforms.
- **Native Windows support** (PowerShell / cmd.exe). WSL2 is supported;
  bare Windows is not (NFR-009 + Edge Case 15).
- **GUI installer** (Electron, Tauri, etc.). CLI only.
- **Platform-specific UI theming or branding** in command/agent outputs.
- **Cross-platform CI/CD** templates for user projects (i.e. GitHub
  Actions / GitLab CI configs that pin a specific FORGE platform).
- **Cross-runtime state migration** — e.g. resuming an in-flight FORGE
  workflow from OpenCode in Claude Code mid-session. (Each platform
  maintains its own session state; FORGE artifacts in `.forge/` are
  durable and shared, which is the only cross-runtime promise.)
- **Reimplementation of custom tools as native plugins per platform**.
  The MCP-server approach (FR-003) is the chosen single mechanism;
  per-platform native tool reimplementation is out of scope.
- **Generated MCP server distribution as a separate npm package on
  npmjs.com**. v1 ships the MCP server bundled in the FORGE repo;
  separate distribution is a future enhancement.

## 11. Open Questions

The following items need user / architect input before implementation
planning (`/forge-plan`). Each is a discrete decision; resolving each
typically requires one round of clarification.

- **[NEEDS CLARIFICATION] OQ-01 — Multi-platform install policy when
  multiple platform directories are present.** Default proposal: install
  to *all detected*. Alternative: prompt the user to pick. Recommendation:
  install to all detected with `--platform=<name>` override available.
- **[NEEDS CLARIFICATION] OQ-02 — Custom-tool packaging.** Bundle the
  MCP server inside the FORGE repo (single binary or `bun run`), or
  publish as a separate npm package (`@forge/mcp-server`)? Bundling is
  simpler for v1; npm publish is better long-term DX.
- **[NEEDS CLARIFICATION] OQ-03 — Plugin event mapping coverage.**
  Each platform has a different event vocabulary:
  - OpenCode: `chat.message.received`, `tool.execute.after`, etc.
  - Claude Code: `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, etc.
  - Codex CLI: its plugin system events (verify exact list).

  Concretely: which events does `session-knowledge` listen to today, and
  what is the equivalent on each target platform? If no equivalent
  exists, is the plugin a no-op on that platform (graceful degradation),
  or do we block install?
- **[NEEDS CLARIFICATION] OQ-04 — Codex CLI agent format.** The task
  description states Codex CLI "reads `.claude/agents/` as fallback".
  Verify: does this fallback work in *all* Codex CLI versions we want
  to support, or only recent ones? If older versions need
  `.codex/agents/*.toml` natively, we need a Markdown→TOML translator.
  **Pre-mortem-driven recommendation:** do NOT rely on the fallback
  (RISK-009). Generate `.codex/agents/*.toml` natively from the start
  even if it duplicates content; the fallback may be removed in a
  future Codex release without notice. FR-005 now mandates this.
- **[NEEDS CLARIFICATION] OQ-05 — CLAUDE.md vs AGENTS.md handling.**
  Three options:
  1. Generate both files with identical content (duplication risk).
  2. `CLAUDE.md` = single line `@AGENTS.md` (Claude Code's import
     syntax) pointing to the canonical file.
  3. Symlink `CLAUDE.md` → `AGENTS.md` (cross-platform symlink concerns).

  Recommendation: option 2 (import).
- **[NEEDS CLARIFICATION] OQ-06 — Constitution amendment scope and
  timing.** Article 1.2 "OpenCode-native" must change. Options:
  1. Block this spec until the amendment is ratified.
  2. Proceed in parallel; amendment is a Phase-0 deliverable inside this
     epic.

  **Pre-mortem-driven recommendation:** option 2 with a **hard gate** —
  the amendment is Story 0, blocking all other stories in the
  implementation plan (RISK-006). No code lands until the amendment PR
  is merged. The risk of option 2 without the gate is that the amendment
  silently never lands and FORGE ships internally inconsistent.
- **[NEEDS CLARIFICATION] OQ-07 — Drift handling for user-edited
  artifacts on re-install (FR-014).** Two options:
  1. Always back up to `.forge/.backups/<timestamp>/` and overwrite.
  2. Prompt the user interactively (diff + accept/reject per file).

  **Pre-mortem-driven recommendation:** option 1 as default + `--interactive`
  flag for option 2; backups go under `.forge/.backups/` (inside
  `.forge/` which is `.gitignored` by convention, per RISK-007) rather
  than `.forge-backup-*/` at project root which can accidentally be
  committed. FR-014 has been updated accordingly.
- **[NEEDS CLARIFICATION] OQ-08 — Subagent dispatch semantics on Claude
  Code & Codex (FR-011).** Claude Code's `@-mention` and Codex's
  workers have different invocation, parameter-passing, and result-return
  semantics than OpenCode's `task` tool. Specifically: how are
  parameters passed (string, structured), how is the result returned
  (text, structured), and what is the maximum subagent depth on each
  platform?
- **[NEEDS CLARIFICATION] OQ-09 — Config-key conflict policy (Edge Case
  11).** When the user's existing platform config has keys that overlap
  with FORGE-managed keys, do we (a) merge with our values winning,
  (b) merge with user's values winning, (c) abort?
- **[NEEDS CLARIFICATION] OQ-10 — Versioning of the cross-platform
  release.** Is this `FORGE 2.0` (breaking) or a minor release? Per
  Article 1.2's "Zero breaking changes without migration" principle,
  user-observable changes must be either zero (preferred, per US-003) or
  migrated. Confirm the version label.

## 12. Implementation Scope

> Paths relative to the FORGE repo root (`/Users/luca/dev/opencode/forge/`),
> *not* the `dev/` sandbox. This is meta-development work on FORGE itself.

### New Components

| Component Type      | Path                                                                         | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Installer module    | `install-forge.ts` (refactor existing)                                       | Refactored to platform-detection + platform-projection architecture.         |
| Platform adapter    | `installer/platforms/opencode.ts`                                            | OpenCode-specific paths, config generation, hook translation.                |
| Platform adapter    | `installer/platforms/claude-code.ts`                                         | Claude Code-specific paths, `settings.json` generation, hook translation.    |
| Platform adapter    | `installer/platforms/codex.ts`                                               | Codex CLI-specific paths, `config.toml` generation, plugin translation.      |
| Shared types        | `installer/types.ts`                                                         | `PlatformDescriptor`, `CanonicalArtifact`, `InstallPlan`, `InstallManifest`. |
| MCP server          | `mcp-server/index.ts`                                                        | Wraps `validate-spec`, `trace-requirements`, `sprint-status` as MCP tools.  |
| MCP server config   | `mcp-server/package.json`, `mcp-server/tsconfig.json`                        | Standalone Node entry point.                                                 |
| Detection module    | `installer/detect.ts`                                                        | Probes for `.opencode/`, `.claude/`, `.codex/`; returns target list.         |
| Regression suite    | `tests/regression/opencode-parity.test.ts`                                   | Asserts post-port OpenCode behavior matches a captured baseline.             |
| Constitution amendment | `.forge-meta/constitution.md` (amend Article 1.2 + amendments log)        | Replace "OpenCode-native" with "Platform-agnostic, agentic-coding-runtime-native". |
| ADR                 | `.forge-meta/knowledge/adr/ADR-001-cross-platform-strategy.md`               | Records the platform-projection + MCP-server decisions.                      |

### Modified Components

| Path                                | Modification Type | Description                                                                                          |
| ----------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `install-forge.ts`                  | Refactor          | Decompose monolithic 1360-line installer into shared core + per-platform adapters.                   |
| `opencode.json`                     | Enhancement       | Add MCP-server config block referencing the bundled `forge-mcp-server`.                               |
| `.opencode/plugins/session-knowledge.ts` | Refactor    | Extract platform-agnostic core; wrap with OpenCode-specific hook binding.                            |
| `.opencode/plugins/pre-commit-gate.ts`   | Refactor    | Same pattern: agnostic core + OpenCode hook binding.                                                 |
| `.opencode/plugins/spec-watcher.ts`      | Refactor    | Same pattern.                                                                                        |
| `.opencode/tools/*.ts`              | Refactor          | Move shared logic into `mcp-server/`; thin OpenCode `tool()` wrappers remain (or are deleted in favor of MCP). |
| `AGENTS.md` (repo root)             | Enhancement       | Already canonical for OpenCode + Codex. Confirmed compatible with Claude Code via import.            |

### Documentation Updates

| Path                                              | Section                  | Update Description                                                                                |
| ------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `README.md`                                       | Installation             | New "Supported platforms" table; updated install command examples per platform.                   |
| `docs/meta-development/architecture.md`           | (new section)            | Add "Cross-platform architecture" describing the projection model.                                 |
| `.forge-meta/constitution.md`                     | Article 1.2, Amendments  | Amend "OpenCode-native" principle. Append to Amendments Log.                                       |
| `.forge-meta/knowledge/decision-log.md`           | (append)                 | Record decisions made during this spec → plan → implementation cycle.                              |
| `.forge-meta/knowledge/adr/ADR-001-...`           | (new)                    | Formal ADR for the strategy.                                                                       |
| `docs/meta-development/` (new files)              | n/a                      | Per-platform installation troubleshooting docs.                                                    |

## 13. Constitution Compliance

> ⚠️ See blocker called out at top of spec. This spec is **provisional**
> pending ratification of an Article 1.2 amendment.

The FORGE meta-constitution has **5 articles** (not 9 as in the
template). Per `constitution-compliance` skill guidance, only relevant
articles are evaluated; the rest are marked N/A.

| Article | Title                  | Status         | Notes                                                                                                                                                                                  |
| ------- | ---------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Art. 1  | Core Principles        | **NON-COMPLIANT** (pending amendment) | Art. 1.2's "OpenCode-native: FORGE is built specifically for OpenCode" directly contradicts this spec. **Amendment required as a prerequisite.** Other 1.2 principles (Agent-first, Constitution-as-law, Document precision, Zero breaking changes without migration) are upheld by this spec — see US-003 + NFR-002. Art. 1.3 (UX) upheld by NFR-001, NFR-007, and Section 9. |
| Art. 2  | Technology Stack       | COMPLIANT      | Node.js 20+ and TypeScript 5+ remain the runtime/language. Markdown remains the authoring format. Bun/NPM remain the packaging choice. The MCP server adds *one* runtime concern (an MCP-protocol Node process) but no new language or runtime. Art. 2.2 (zero runtime deps) is preserved for core; the MCP server may carry minimal MCP-SDK dependency — flagged for ADR. Art. 2.3 distribution policy is **strengthened** (more "do-not-distribute" directories may be added — see implementation plan). |
| Art. 3  | Architecture Patterns  | COMPLIANT      | File-based orchestration is preserved on all three platforms (each platform's native layout is also file-based). Code organization (3.2) is preserved; new directories (`installer/`, `mcp-server/`) are additive and respect the "not distributed" boundary for meta-dev artifacts. |
| Art. 4  | Quality Standards      | COMPLIANT      | 4.1 (80% coverage for custom tools): tools are now in `mcp-server/`; coverage requirement carries over (re-asserted in implementation plan). 4.2 (token budgets) preserved — see NFR-005. 4.3 (no meta-dev leakage into distributed files) **explicitly upheld**: per-platform projection logic is in the installer, not in agents/skills/commands. |
| Art. 5  | Naming & Conventions   | COMPLIANT      | Agent files keep `forge-[role].md`. Command files keep `forge-[action].md`. Skills keep `[name]/SKILL.md`. These names are unchanged across platform projections. |

### Tensions

1. **Art. 1.2 OpenCode-native vs cross-platform goal** — irreconcilable
   without amendment. Resolution: amend Art. 1.2 first (OQ-06).
2. **Art. 2.2 Zero runtime dependencies vs MCP server runtime** — the MCP
   server is a separate process; it is *not* the FORGE core. It can be
   classified as a "plugin dependency" per Art. 2.2 ("Plugin
   dependencies are acceptable but minimal"). Resolution: document
   classification in the ADR; keep MCP-SDK pinned.

### Amendments Applied

- 2026-02-16 amendment (Art. 2.3, 4.3 — distribution exclusions) is
  applied: this spec adds `installer/`, `mcp-server/`, and `tests/regression/`
  as additional non-distributed directories.

### Required Future Amendment

| Article | Proposed Change                                                                                                                       | Rationale                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1.2     | Replace **"OpenCode-native: FORGE is built specifically for OpenCode"** with **"Agentic-coding-runtime-native: FORGE runs natively on supported agentic coding runtimes (currently OpenCode, Claude Code, Codex CLI) via per-platform projection from a single source of truth."** | Enables this entire spec while preserving the spirit of the original principle (native, not lowest-common-denominator). |

---

## 14. Risk Register

> This section is the output of a **Pre-mortem Analysis** elicitation
> applied to the spec draft. Each risk imagines a plausible failure
> mode 6 months post-release; mitigations were translated into the
> functional/non-functional requirements above (see "Maps to" column).

| ID       | Failure Scenario                                                                                                                                            | Severity | Likelihood | Mitigation                                                                                                                                                                                                | Maps to                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| RISK-001 | **Silent regression on OpenCode.** Subtle behavior changes ship; users notice slowly; trust erodes. The promised regression suite was thin or never built.   | High     | Medium     | Snapshot-based regression: capture baseline outputs of every command and subagent invocation *before* refactor; require byte-for-byte (or allowlisted-diff) match after.                                  | NFR-002 (tightened), FR-017   |
| RISK-002 | **MCP server is a single point of failure.** When it crashes, all 3 custom tools die across all 3 platforms. Cryptic errors. FORGE gets a flaky reputation. | High     | Medium     | Tool calls must return structured user-facing errors that name the tool, the expected MCP location, and the remediation command. Host command never crashes silently.                                     | see FR-016                        |
| RISK-003 | **Per-platform projection drift.** A new agent is added but the installer forgets to project it to Codex (or Claude). Silently missing commands on one runtime. | High     | High       | CI gate: `install-forge --dry-run --check` against fixtures for each platform; assert 0 diff vs checked-in snapshots. Any new artifact that breaks projection fails CI.                                    | see FR-017                        |
| RISK-004 | **Subagent dispatch contract drift.** OpenCode `task` passes structured args; Claude Code `@-mention` only takes a string; Codex workers something else. Orchestrators break on non-OpenCode platforms. | High     | High       | Define a normative subagent-dispatch contract (JSON envelope for input, structured-vs-prose output, error envelope, max depth). Publish at `docs/meta-development/subagent-contract.md`. Adapter layer per platform translates. | FR-011 (refined), OQ-08       |
| RISK-005 | **Per-platform content divergence.** A "temporary" platform-specific edit lands in `.claude/agents/X.md` and never gets reconciled. Token budgets blown, behavior diverges. | Medium   | High       | Single-source enforcement: SHA-256 equivalence check across all platform projections for the same canonical artifact. `CLAUDE.md` uses `@AGENTS.md` import, not a copy.                                  | FR-008 (refined), FR-018      |
| RISK-006 | **Constitution amendment never ratified.** Code ships; constitution still says "OpenCode-native". FORGE loses methodology credibility (governance framework that doesn't follow its own rules). | High     | Medium     | Amendment is Story 0 in the implementation plan, **blocking** all other stories. No code merges until the amendment PR merges.                                                                            | OQ-06 (recommendation), Section 13 |
| RISK-007 | **Drift backups accidentally committed.** Default backup dir was `.forge-backup-<ts>/` at project root, not in `.gitignore`. Users committed it. Or backups were created silently and users lost work. | Medium   | High       | Default backup location is `.forge/.backups/<ts>/` (inside `.forge/`, conventionally `.gitignored`). Post-install summary surfaces backup path prominently. `--interactive` mode for cautious users.   | FR-014 (refined), OQ-07       |
| RISK-008 | **Platform quirk swamp.** Three platforms × N quirks each = unmaintainable. Bugs that don't repro on the other two. Maintainer burnout.                       | Medium   | High       | Maintain a `platform-deviations.md` log documenting every observed quirk + workaround. PR template requires updating this when a deviation is introduced.                                                  | see FR-019                        |
| RISK-009 | **Codex CLI fallback assumption breaks.** Codex removed its `.claude/agents/` fallback in a minor release. Codex users woke up with no FORGE agents.        | High     | Low-Med    | Do not depend on the fallback. Generate `.codex/agents/*.toml` (or current native form) explicitly from the canonical Markdown source. Verify Codex docs each release.                                     | FR-005 (refined), OQ-04       |
| RISK-010 | **NFR-005 token budgets blown via doubled instructions.** AGENTS.md + CLAUDE.md both loaded by some IDE config, doubling project-instruction context.        | Low      | Medium     | `CLAUDE.md` is a single-line `@AGENTS.md` import (not a copy). Document that loading both as content is a configuration error.                                                                            | FR-008 (refined), NFR-005     |

### Risk-Severity Matrix

```
              Likelihood →
              Low       Medium       High
Severity ↓
  High       RISK-009    RISK-001,    RISK-003,
                         RISK-002,    RISK-004
                         RISK-006
  Medium     —           RISK-010     RISK-005,
                                      RISK-007,
                                      RISK-008
  Low        —           —            —
```

**Top risks for the architect to prioritize:** RISK-003 (projection
drift) and RISK-004 (subagent contract drift) — both High/High and both
likely to bite during *normal* development, not just edge cases.

---

## Cross-References

| Document                    | Path                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| Constitution (meta)         | `.forge-meta/constitution.md`                                         |
| Constitution amendment (proposed) | `.forge-meta/constitution.md` Article 1.2 (see Section 13)       |
| Architecture (meta, new)    | `docs/meta-development/architecture.md` (to be created in plan phase) |
| Research analysis           | (Provided in task brief — to be captured in `docs/meta-development/cross-platform-research.md` during plan) |
| ADR (proposed)              | `.forge-meta/knowledge/adr/ADR-001-cross-platform-strategy.md` (to be created) |
| Plan                        | `<!-- /forge-plan -->`                                                |
| Tasks                       | `<!-- /forge-tasks -->`                                               |
| PRD                         | N/A — spec-level documentation sufficient for Epic track at this size |

### Related FORGE artifacts inventoried during spec authoring

| Type    | Count | Location                          |
| ------- | ----- | --------------------------------- |
| Agents  | 9     | `.opencode/agents/*.md`           |
| Commands | 24   | `.opencode/commands/*.md`         |
| Skills  | 12    | `.opencode/skills/*/SKILL.md`     |
| Tools   | 3     | `.opencode/tools/*.ts` (`sprint-status`, `trace-requirements`, `validate-spec`) |
| Plugins | 3     | `.opencode/plugins/*.ts` (`pre-commit-gate`, `session-knowledge`, `spec-watcher`) |

### Validator findings

While running `validate-spec` against this document, two defects were
found in `.opencode/tools/validate-spec.ts`:

1. **Line 266 — Cross-References regex uses `\Z` anchor.** The regex
   `/## \s*Cross-References([\s\S]*?)(?=\n## |\Z)/` uses `\Z` which is
   not a valid JavaScript regex anchor (Perl-style). JS treats `\Z` as
   a literal `Z` character, causing the Cross-References section check
   to fail when the section is at end of file and doesn't end before
   a literal `Z`. Recommend changing to `(?=\n## |$(?![\s\S]))` or
   splitting into two alternations.
2. **Line 187 — FR-pattern regex spans table-row boundaries.** The
   regex `/\|\s*(FR-\d{3})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/g`
   uses `\s*` which matches newlines, so an FR-NNN reference in any
   trailing table cell (e.g. a "Maps to" column in a Risk Register)
   gets parsed as a malformed FR row spanning into the next table row.
   Recommend anchoring matches to a single line (`[^\n]*?` instead of
   `.*?`, or `m` flag with `^` anchors).

Filed as findings for `forge-architect` to triage; tracked here so they
are not lost.
