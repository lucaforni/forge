# Tasks: 001 - Cross-Platform Support (Claude Code & Codex CLI)

> Ordered task breakdown with parallelism markers and requirement traceability.
> Created by `forge-scrum` via `/forge-tasks`.

| Field  | Value                                             |
| ------ | ------------------------------------------------- |
| Status | Pending                                           |
| Author | forge-scrum                                       |
| Date   | 2026-06-21                                        |
| Spec   | [spec.md](./spec.md)                              |
| Plan   | [plan.md](./plan.md)                              |

---

## Legend

- `[FR-NNN]` / `[NFR-NNN]` — Requirement traceability
- `[P]` — Parallelizable with other `[P]` tasks in the same phase
- Status: `[ ]` pending · `[x]` done · `[-]` skipped
- **Effort**: `[S]` <30min · `[M]` 30min–2h · `[L]` 2–4h · `[XL]` >4h (split)
- All paths are relative to repo root (`/Users/luca/dev/opencode/forge/`)

---

## Phase 1: Regression Baseline + Installer Core Scaffold

> **Goal:** Lock OpenCode behavior before touching a single line of production
> code. Stand up `installer/` types and structure. Regression suite becomes the
> merge gate for all subsequent phases.
>
> **Critical constraint:** T-001 (baseline capture) is a hard blocker for
> everything else in the repo — do not start T-002..T-005 until it is committed.

---

- [ ] **T-001** `[FR-009]` `[NFR-002]` Capture OpenCode regression baseline
  - **Phase**: 1
  - **Files**:
    - `tests/regression/baseline/` (new directory — one snapshot file per command)
    - `tests/regression/fixtures/opencode-project/` (minimal fixture project)
  - **Description**: On the current `main` branch, before any other change,
    run each FORGE custom tool (`validate-spec`, `trace-requirements`,
    `sprint-status`) and representative commands (`/forge-status`, `/forge-help`)
    against a fixture project and save outputs as committed snapshot files.
    These files are the byte-identical reference that every subsequent phase
    must match. The fixture project is a minimal `.forge/` tree with one spec,
    one active sprint, and one epic — sufficient to exercise all three tools.
  - **Dependencies**: None
  - **Effort**: `[M]`

---

- [ ] **T-002** `[NFR-002]` Set up Vitest + CI regression runner
  - **Phase**: 1
  - **Files**:
    - `package.json` (add `vitest ^2`, `smol-toml ^1`, `@types/node ^20` to devDeps)
    - `tests/regression/opencode-parity.test.ts` (new)
    - `.github/workflows/ci.yml` (add regression job or new file)
  - **Description**: Configure Vitest as the project test runner and write
    `opencode-parity.test.ts` that loads each baseline snapshot from T-001,
    re-runs the corresponding tool against the fixture project, and asserts
    byte-identical output. Wire this as a required CI check on every PR so
    regressions block merge automatically.
  - **Dependencies**: T-001
  - **Effort**: `[M]`

---

- [ ] **T-003** `[FR-001]` `[FR-014]` Create `installer/types.ts`
  - **Phase**: 1
  - **Files**:
    - `installer/types.ts` (new)
  - **Description**: Define the four core TypeScript interfaces from plan
    Section 2.1: `Platform`, `PlatformDescriptor`, `InstallOperation`,
    `InstallPlan`, `InstallResult`, `InstallManifest`, and the `HookEvent`
    union. Include JSDoc on every field — these types are the shared contract
    for all installer modules and platform adapters. No implementation logic;
    types only.
  - **Dependencies**: None
  - **Effort**: `[S]`

---

- [ ] **T-004** `[FR-001]` `[FR-015]` `[P]` Create `installer/detect.ts`
  - **Phase**: 1
  - **Files**:
    - `installer/detect.ts` (new)
  - **Description**: Implement `detectPlatforms(projectRoot: string): Platform[]`
    that probes for `.opencode/`, `.claude/`, and `.codex/` directories and
    returns the list of detected platforms. If none are found, return an empty
    array (the caller in `install.ts` handles exit-code-2 per FR-015). Include
    unit tests (8 directory-presence combinations) in
    `tests/unit/detect.test.ts`.
  - **Dependencies**: T-003
  - **Effort**: `[S]`

---

- [ ] **T-005** `[NFR-007]` `[P]` Create `installer/log.ts` + `installer/platforms/opencode.ts`
  - **Phase**: 1
  - **Files**:
    - `installer/log.ts` (new)
    - `installer/platforms/opencode.ts` (new — descriptor only, no emitter yet)
  - **Description**: `log.ts` implements the structured logger with `[OK]`,
    `[SKIP]`, `[ERR]`, `[WARN]`, `[PLAN]`, `[NEW]`, `[UPD]` prefixes and
    both color + text signaling (no color-only per spec Section 9). Respects
    a `--verbose` flag via an exported `setLogLevel()`. `opencode.ts` exports
    the `PlatformDescriptor` constant for OpenCode (detection paths, layout
    dirs, hook events) but no config emitter yet — the existing `opencode.json`
    stays hand-written through Phase 1.
  - **Dependencies**: T-003
  - **Effort**: `[S]`

---

- [ ] **T-006** `[NFR-004]` `[P]` Author ADR-002 + ADR-003
  - **Phase**: 1
  - **Files**:
    - `.forge-meta/knowledge/adr/ADR-002-mcp-sdk-dependency.md` (new)
    - `.forge-meta/knowledge/adr/ADR-003-shared-core-pattern.md` (new)
  - **Description**: ADR-002 classifies `@modelcontextprotocol/sdk` as a
    plugin-level dependency living in `mcp-server/package.json` (not in
    repo-root runtime deps), resolving the Art. 2.2 tension. ADR-003 records
    the shared-core extraction pattern — pure `*-core.ts` functions with thin
    per-platform bindings — as the single approved approach for both tools and
    plugins. Both ADRs move from Proposed → Accepted after the human owner
    reviews them; they unblock Phase 3 and Phase 5 extraction work.
  - **Dependencies**: None
  - **Effort**: `[S]`

---

## Phase 2: Installer Core Modules + CLI Refactor

> **Goal:** Move all logic out of the monolithic `install-forge.ts` into
> focused `installer/` modules. The OpenCode install path now flows through
> the new pipeline and must still produce a byte-identical `.opencode/` tree
> (verified by the Phase 1 regression suite).

---

- [ ] **T-007** `[FR-002]` `[NFR-006]` Create `installer/config.ts` + `installer/manifest.ts`
  - **Phase**: 2
  - **Files**:
    - `installer/config.ts` (new)
    - `installer/manifest.ts` (new)
  - **Description**: `config.ts` builds the internal `ConfigModel` from
    FORGE defaults and merges user-supplied keys per the ADR-007 policy
    (FORGE-managed keys win; user-only keys are preserved; conflicts produce
    a `[WARN]`). `manifest.ts` reads and writes
    `.forge/.install-manifest.json` (schema: `InstallManifest` from
    `types.ts`) and implements the idempotency check — given the same
    project state, a second run produces zero writes (NFR-006). Manifest
    synthesis for pre-cross-platform upgrades (plan Section 2.3) is
    implemented here.
  - **Dependencies**: T-003, T-005
  - **Effort**: `[M]`

---

- [ ] **T-008** `[FR-017]` `[NFR-004]` `[P]` Create `installer/projection.ts`
  - **Phase**: 2
  - **Files**:
    - `installer/projection.ts` (new)
    - `tests/unit/projection.test.ts` (new)
  - **Description**: Implement `buildInstallPlan(platforms, canonicalRoot, manifest): InstallPlan`
    that walks `.opencode/{agents,commands,skills}/` (canonical source), and
    for each detected platform uses its `PlatformDescriptor.layout` to compute
    the full list of `InstallOperation` entries (create/update/skip/backup).
    The unit test feeds a known canonical input and asserts the exact
    `InstallPlan` output — this becomes the FR-017 projection correctness check.
  - **Dependencies**: T-003, T-007
  - **Effort**: `[M]`

---

- [ ] **T-009** `[FR-014]` `[P]` Create `installer/drift.ts` + `installer/backup.ts`
  - **Phase**: 2
  - **Files**:
    - `installer/drift.ts` (new)
    - `installer/backup.ts` (new)
    - `tests/unit/drift.test.ts` (new)
  - **Description**: `drift.ts` compares the SHA-256 of every existing
    installed file against the checksum stored in `InstallManifest` and
    classifies each as `unchanged`, `drift` (FORGE-authored content changed by
    user), or `user-created` (file not in manifest). `backup.ts` implements
    the default non-interactive behavior: copy drifted files to
    `.forge/.backups/<ISO-timestamp>/<original-path>` and add the backup dir
    to `.forge/.gitignore` if not already present (RISK-007 self-healing).
    Unit test covers all three drift classifications using manifest fixtures.
  - **Dependencies**: T-003, T-007
  - **Effort**: `[M]`

---

- [ ] **T-010** `[FR-010]` `[FR-012]` Create `installer/install.ts` orchestrator
  - **Phase**: 2
  - **Files**:
    - `installer/install.ts` (new)
  - **Description**: The top-level orchestrator that chains: `detectPlatforms`
    → `buildInstallPlan` → drift check → backup drifted files →
    execute writes → write manifest → print post-install summary. Implements
    the `InstallPlan` execution loop, the `--dry-run` no-write path, and the
    `--check` exit-code-3 path (FR-013, FR-017). Post-install summary (FR-012)
    lists detected platforms, file counts per platform, MCP-server config
    location, and any backup paths prominently. Also handles exit codes 2, 4,
    5, 6, 7 from plan Section 3.1.
  - **Dependencies**: T-007, T-008, T-009
  - **Effort**: `[L]`

---

- [ ] **T-011** `[FR-010]` `[NFR-003]` Refactor `install-forge.ts` to CLI shim
  - **Phase**: 2
  - **Files**:
    - `install-forge.ts` (modify — strip from ~1360 lines to ~80)
    - `package.json` (modify — ensure `install-forge` script still works)
  - **Description**: Delete all logic currently in `install-forge.ts` that
    has been redistributed to `installer/` modules (done only after the
    regression suite is green against the new pipeline). The remaining ~80
    lines parse argv (`--dry-run`, `--check`, `--platform=`, `--interactive`,
    `--force`, `--verbose`), build the `CliOptions` object, and call
    `installer/install.ts::run(options)`. No logic lives in this shim.
    Verify the regression suite stays green immediately after this change.
  - **Dependencies**: T-010
  - **Effort**: `[M]`

---

- [ ] **T-012** `[FR-014]` `[NFR-006]` `[P]` Author ADR-006 + ADR-007; update `.gitignore`
  - **Phase**: 2
  - **Files**:
    - `.forge-meta/knowledge/adr/ADR-006-backup-location-policy.md` (new)
    - `.forge-meta/knowledge/adr/ADR-007-config-conflict-policy.md` (new)
    - `.gitignore` (modify — add `.forge/.install-manifest.json` and `.forge/.backups/`)
  - **Description**: ADR-006 records the OQ-07 resolution: backups go to
    `.forge/.backups/<timestamp>/` (inside `.forge/`, gitignored by
    convention), with `--interactive` flag available for per-file prompting.
    ADR-007 records the OQ-09 resolution: FORGE-managed keys overwrite on
    conflict; user-only keys are preserved; conflicts emit a `[WARN]` and
    list the affected keys. Both ADRs move Proposed → Accepted. The
    `.gitignore` entries ensure backups and manifests are never accidentally
    committed.
  - **Dependencies**: T-009
  - **Effort**: `[S]`

---

## Phase 3: MCP Server Extraction

> **Goal:** Move the ~1947 lines of tool logic from `.opencode/tools/*.ts`
> into a platform-agnostic `mcp-server/` package. OpenCode `.opencode/tools/*.ts`
> become thin `tool()` wrappers calling the shared core — preserving FR-009
> byte-identical output while enabling Claude Code and Codex to reach the same
> logic over MCP. Fix two known validator bugs during extraction.

---

- [ ] **T-013** `[FR-003]` `[FR-016]` Create `mcp-server/` scaffold
  - **Phase**: 3
  - **Files**:
    - `mcp-server/package.json` (new — declares `@modelcontextprotocol/sdk ^1.0`)
    - `mcp-server/tsconfig.json` (new — strict TS, Node20, ESM output)
    - `mcp-server/index.ts` (new — `Server` + `StdioServerTransport`; registers 3 tools)
  - **Description**: Bootstrap the standalone MCP server package. `index.ts`
    implements `tools/list` (returning all three tool schemas) and `tools/call`
    (dispatching to the shared cores by name). The error envelope in every
    `isError: true` response MUST match the FR-016 format:
    `[forge-mcp-server] Tool '<name>' failed: <reason> / Expected MCP server
    at: <path> / Suggested remediation: <command>`. Wire the `mcp-server`
    script in repo-root `package.json`.
  - **Dependencies**: T-006 (ADR-002 accepted), Phase 2 complete
  - **Effort**: `[M]`

---

- [ ] **T-014** `[FR-003]` `[NFR-002]` `[P]` Extract `validate-spec` core + fix bugs
  - **Phase**: 3
  - **Files**:
    - `mcp-server/src/tools/validate-spec.ts` (new)
    - `mcp-server/src/lib/spec-parse.ts` (new — shared markdown/frontmatter parser)
    - `tests/unit/validate-spec.test.ts` (new)
  - **Description**: Move the ~497-line validator logic verbatim into
    `mcp-server/src/tools/validate-spec.ts` as a pure `validateSpec(args):
    Promise<ValidateSpecResult>` function with no OpenCode imports.
    **Fix both validator bugs during extraction** (plan Section 3.2): the
    FR-regex at spec line 187 and the `\Z` anchor at line 266. Add unit
    tests that specifically cover both bugs (regression for the bugs, not just
    for the happy path). Extract shared markdown/frontmatter parsing into
    `spec-parse.ts` for reuse by T-015 and T-016.
  - **Dependencies**: T-013
  - **Effort**: `[L]`

---

- [ ] **T-015** `[FR-003]` `[P]` Extract `trace-requirements` core
  - **Phase**: 3
  - **Files**:
    - `mcp-server/src/tools/trace-requirements.ts` (new)
    - `tests/unit/trace-requirements.test.ts` (new)
  - **Description**: Move the ~444-line trace-requirements logic into a pure
    `traceRequirements(args): Promise<TraceResult>` function. Spec-id → path
    resolution, missing-file handling, and coverage classification must all be
    tested: valid spec with full coverage, missing plan/tasks files, and
    `[NOT IMPLEMENTED]` markers. Reuse `spec-parse.ts` from T-014 for
    frontmatter parsing.
  - **Dependencies**: T-013, T-014 (for `spec-parse.ts`)
  - **Effort**: `[L]`

---

- [ ] **T-016** `[FR-003]` `[P]` Extract `sprint-status` core
  - **Phase**: 3
  - **Files**:
    - `mcp-server/src/tools/sprint-status.ts` (new)
    - `tests/unit/sprint-status.test.ts` (new)
  - **Description**: Move the ~1006-line sprint-status logic into a pure
    `sprintStatus(): Promise<SprintStatusResult>` function. Multi-sprint
    aggregation, old single-file format migration, and velocity calculation
    must all be covered by tests using YAML fixture files. No OpenCode imports;
    reads `.forge/sprints/` via `node:fs/promises` only.
  - **Dependencies**: T-013, T-014 (for `spec-parse.ts`)
  - **Effort**: `[L]`

---

- [ ] **T-017** `[FR-009]` `[FR-016]` Refactor `.opencode/tools/*.ts` to thin wrappers
  - **Phase**: 3
  - **Files**:
    - `.opencode/tools/validate-spec.ts` (modify — ~497 lines → ~30 lines)
    - `.opencode/tools/trace-requirements.ts` (modify — ~444 lines → ~30 lines)
    - `.opencode/tools/sprint-status.ts` (modify — ~1006 lines → ~30 lines)
  - **Description**: Replace each tool file with a thin `tool()` wrapper
    that imports the corresponding shared core from `mcp-server/src/tools/`
    and calls it. Pattern: `import { validateSpec } from "../../mcp-server/
    src/tools/validate-spec"; export default tool({ ... execute(args) {
    return JSON.stringify(await validateSpec(args), null, 2) } })`. Run the
    regression suite immediately after each replacement — outputs must be
    byte-identical to the Phase 1 baseline.
  - **Dependencies**: T-014, T-015, T-016
  - **Effort**: `[M]`

---

- [ ] **T-018** `[FR-003]` Add `mcp.forge` to `opencode.json`; E2E smoke test
  - **Phase**: 3
  - **Files**:
    - `opencode.json` (modify — add `mcp.forge` block per plan Section 3.4)
  - **Description**: Add the `"forge": { "type": "local", "command": ["bun",
    "run", "mcp-server/index.ts"] }` entry to the `mcp` block in
    `opencode.json`. Then run a manual end-to-end smoke test: start the MCP
    server via `bun run mcp-server`, invoke `validate-spec` from an OpenCode
    session, and confirm the response matches the Phase 1 baseline. Document
    the smoke-test steps in a comment in `mcp-server/index.ts` for future
    maintainers.
  - **Dependencies**: T-013
  - **Effort**: `[S]`

---

## Phase 4: Multi-Platform Projection (Claude Code + Codex CLI)

> **Goal:** Wire Claude Code and Codex CLI adapters. Installer projects agents,
> commands, skills, configs, and project instructions into each detected
> platform's layout. MCP server config emitted to all three. Subagent dispatch
> contract documented. CI projection + equivalence gates added.

---

- [ ] **T-019** `[FR-005]` Resolve OQ-04; author ADR-005 (Codex agent format)
  - **Phase**: 4
  - **Files**:
    - `.forge-meta/knowledge/adr/ADR-005-codex-agent-format.md` (new)
  - **Description**: Verify hands-on whether the current Codex CLI version
    reads `.claude/agents/` as a fallback or requires native `.codex/agents/
    *.toml`. Per RISK-009 the recommendation is to generate TOML natively
    regardless. Research the exact TOML schema Codex expects for agent
    definitions (fields equivalent to Markdown frontmatter: name, description,
    model, system prompt). Document the findings and the decision
    (TOML-native vs fallback) in ADR-005 with clear rationale. This ADR gates
    T-021.
  - **Dependencies**: Phase 3 complete
  - **Effort**: `[M]`

---

- [ ] **T-020** `[FR-011]` `[P]` Resolve OQ-08; author ADR-004 + subagent-contract.md
  - **Phase**: 4
  - **Files**:
    - `docs/meta-development/subagent-contract.md` (new)
    - `.forge-meta/knowledge/adr/ADR-004-subagent-dispatch-contract.md` (new)
  - **Description**: Test Claude Code `@-mention` and Codex CLI worker
    primitives hands-on to determine: how parameters are passed (string vs
    structured), how results are returned, and what the max subagent depth is
    per platform. Publish the normative JSON envelope (input + output) from
    plan Section 3.3 in `subagent-contract.md`. Fill in the "TBC" cells in
    the per-platform translation table. ADR-004 records the decision.
  - **Dependencies**: Phase 3 complete
  - **Effort**: `[M]`

---

- [ ] **T-021** `[FR-002]` `[FR-005]` `[FR-006]` `[FR-007]` `[FR-008]` Create `installer/platforms/claude-code.ts`
  - **Phase**: 4
  - **Files**:
    - `installer/platforms/claude-code.ts` (new)
  - **Description**: Export the Claude Code `PlatformDescriptor` (layout:
    `.claude/{agents,commands,skills}`, config: `.claude/settings.json`,
    instructions file: `CLAUDE.md`). Implement `generateClaudeSettings
    (config: ConfigModel): object` that produces the `settings.json` schema
    from plan Section 3.4 — including `mcpServers.forge`, `hooks`
    (`PreToolUse`/`Stop`/`PostToolUse`) referencing the plugin adapter
    scripts, and the permissions block. `CLAUDE.md` emitter produces exactly
    one line: `@AGENTS.md` (FR-008). Unit test that `settings.json` output
    matches the schema and correctly merges user pre-existing keys (ADR-007).
  - **Dependencies**: T-019 (OQ-04 resolved), T-007 (config model)
  - **Effort**: `[M]`

---

- [ ] **T-022** `[FR-002]` `[FR-005]` `[FR-006]` `[FR-007]` `[P]` Create `installer/platforms/codex.ts`
  - **Phase**: 4
  - **Files**:
    - `installer/platforms/codex.ts` (new)
  - **Description**: Export the Codex CLI `PlatformDescriptor` (layout:
    `.codex/{agents,commands}`, skills: `.agents/skills/`, config:
    `.codex/config.toml`, instructions file: none — `AGENTS.md` is native).
    Implement `generateCodexConfig(config: ConfigModel): string` that emits
    the TOML config via `smol-toml` (plan Section 3.4). If ADR-005 mandates
    TOML agent files, implement `markdownToToml(source: string): string` that
    deterministically converts Markdown + YAML frontmatter to Codex agent
    TOML format. Unit tests: TOML output round-trips through `smol-toml`,
    `config.toml` contains the `mcp.forge` block.
  - **Dependencies**: T-019 (OQ-04 resolved), T-007 (config model)
  - **Effort**: `[M]`

---

- [ ] **T-023** `[FR-001]` `[FR-006]` `[FR-007]` `[FR-008]` Wire multi-platform projection in `installer/install.ts`
  - **Phase**: 4
  - **Files**:
    - `installer/install.ts` (modify — add Claude Code + Codex detection branches)
    - `installer/projection.ts` (modify — handle content transforms per platform)
  - **Description**: Wire the two new platform adapters into the
    `install.ts` orchestrator: when `.claude/` or `.codex/` are detected,
    `buildInstallPlan` now returns operations for those targets too. Handle
    content transforms in `projection.ts`: `as-is` byte copy for `.md` agent/
    command/skill files, `markdown-to-toml` for Codex agents (if ADR-005
    mandates it), and `config-merge` for platform config files. `CLAUDE.md`
    emitter produces `@AGENTS.md`. Run the regression suite — OpenCode path
    must still be byte-identical.
  - **Dependencies**: T-021, T-022
  - **Effort**: `[M]`

---

- [ ] **T-024** `[FR-017]` `[P]` Create projection fixtures + FR-017 CI gate
  - **Phase**: 4
  - **Files**:
    - `tests/regression/projection-fixtures/opencode-only/` (new)
    - `tests/regression/projection-fixtures/claude-only/` (new)
    - `tests/regression/projection-fixtures/codex-only/` (new)
    - `tests/regression/projection-fixtures/multi/` (new — all three platforms)
    - `.github/workflows/ci.yml` (modify — add `--dry-run --check` step per fixture)
  - **Description**: Create four minimal fixture project trees (one per
    detection scenario). Run `install-forge --dry-run --check` against each
    and commit the output as a checked-in snapshot. The CI step re-runs
    `--dry-run --check` and asserts zero diff against the snapshot (exit code
    0). Any new agent/command/skill addition that forgets a platform
    projection will fail CI immediately (RISK-003 mitigation).
  - **Dependencies**: T-023
  - **Effort**: `[M]`

---

- [ ] **T-025** `[FR-018]` `[P]` Create `tests/regression/projection-equivalence.test.ts`
  - **Phase**: 4
  - **Files**:
    - `tests/regression/projection-equivalence.test.ts` (new)
  - **Description**: For each canonical agent/command/skill file in
    `.opencode/`, assert that after install, the SHA-256 of the file at each
    platform's target path equals the SHA-256 of the canonical source (or, for
    Codex TOML projection, that the conversion is deterministic and matches a
    recorded build manifest entry). Uses the `multi/` fixture from T-024.
    This test is the automated enforcement of FR-018 — any content divergence
    between platform projections fails CI.
  - **Dependencies**: T-023, T-024
  - **Effort**: `[M]`

---

- [ ] **T-026** `[FR-019]` `[FR-011]` `[P]` Create meta-development docs
  - **Phase**: 4
  - **Files**:
    - `docs/meta-development/platform-deviations.md` (new — initial entries)
    - `docs/meta-development/architecture.md` (new — cross-platform architecture)
  - **Description**: `platform-deviations.md` catalogs every observed
    per-platform quirk discovered during T-019 and T-020 (Codex agent format,
    Claude Code hook vocabulary differences, subagent depth limits). Each
    entry must include: platform, observed behavior, FORGE workaround, and
    discovery date. `architecture.md` renders the plan Section 1.1 diagram
    plus the component design from Section 4 for a maintainer audience —
    explaining the projection model, MCP server role, and plugin adapter
    pattern. Update the PR template to require a `platform-deviations.md`
    entry when a new deviation is introduced.
  - **Dependencies**: T-019, T-020
  - **Effort**: `[M]`

---

- [ ] **T-027** `[NFR-002]` `[P]` Update `README.md` + `AGENTS.md`
  - **Phase**: 4
  - **Files**:
    - `README.md` (modify — replace installation section)
    - `AGENTS.md` (modify — add supported runtimes line)
  - **Description**: Replace the README installation section with a
    multi-platform install table (OpenCode / Claude Code / Codex CLI) and a
    "Supported platforms" matrix. Add a single "Supported runtimes" line to
    the `AGENTS.md` header listing all three platforms. Content changes only
    — no instructional or governance text is modified. The regression suite
    must still pass (no agent/command/skill content touched).
  - **Dependencies**: T-023
  - **Effort**: `[S]`

---

## Phase 5: Plugin Adapters + Cross-Platform Testing Hardening

> **Goal:** Project the three OpenCode plugins to Claude Code and Codex CLI
> via the shared-core pattern. Add cross-platform integration tests. Verify all
> error messages match FR-016 format. Run the OS matrix. Tag FORGE 2.0.

---

- [ ] **T-028** `[FR-004]` Resolve OQ-03; split all 3 plugins into core + bindings
  - **Phase**: 5
  - **Files**:
    - `.opencode/plugins/shared/session-knowledge-core.ts` (new)
    - `.opencode/plugins/shared/session-knowledge.opencode.ts` (new)
    - `.opencode/plugins/shared/session-knowledge.claude.ts` (new)
    - `.opencode/plugins/shared/session-knowledge.codex.ts` (new, or omitted if OQ-03 finds no equivalent)
    - `.opencode/plugins/shared/pre-commit-gate-core.ts` (new)
    - `.opencode/plugins/shared/pre-commit-gate.opencode.ts` (new)
    - `.opencode/plugins/shared/pre-commit-gate.claude.ts` (new)
    - `.opencode/plugins/shared/pre-commit-gate.codex.ts` (new, or omitted)
    - `.opencode/plugins/shared/spec-watcher-core.ts` (new)
    - `.opencode/plugins/shared/spec-watcher.opencode.ts` (new)
    - `.opencode/plugins/shared/spec-watcher.claude.ts` (new)
    - `.opencode/plugins/shared/spec-watcher.codex.ts` (new, or omitted)
  - **Description**: First, verify the plugin event mapping table from plan
    Section 4.3 hands-on (OQ-03): confirm `session.idle` → `Stop/SubagentStop`
    on Claude Code, `tool.execute.before` → `PreToolUse` matcher `Bash`, etc.
    Document graceful-degradation cases where no Codex equivalent exists.
    Then extract each plugin's logic into a pure `*-core.ts` (no platform
    imports), with `.opencode.ts` binding the existing OpenCode Plugin events,
    `.claude.ts` as an executable hook script reading JSON from stdin per
    Claude Code's hook protocol, and `.codex.ts` (where applicable) for
    Codex. Each core file must have unit tests using synthetic message
    fixtures.
  - **Dependencies**: T-026 (platform-deviations.md), Phase 4 complete
  - **Effort**: `[L]`

---

- [ ] **T-029** `[FR-004]` `[FR-009]` Update `.opencode/plugins/*.ts` + wire hooks into adapters
  - **Phase**: 5
  - **Files**:
    - `.opencode/plugins/session-knowledge.ts` (modify — re-export `shared/session-knowledge.opencode.ts`)
    - `.opencode/plugins/pre-commit-gate.ts` (modify — re-export `shared/pre-commit-gate.opencode.ts`)
    - `.opencode/plugins/spec-watcher.ts` (modify — re-export `shared/spec-watcher.opencode.ts`)
    - `installer/platforms/claude-code.ts` (modify — emit `hooks` entries referencing `.claude.ts` scripts)
    - `installer/platforms/codex.ts` (modify — emit hook entries for supported events)
  - **Description**: Convert each existing `.opencode/plugins/*.ts` to a
    re-export of its `shared/<name>.opencode.ts` counterpart so the existing
    `opencode.json` plugin loading path continues to work (FR-009 — no path
    changes for OpenCode users). Update the two platform adapters to emit
    hook entries in their respective config formats pointing at the
    per-platform binding scripts. Run the regression suite — OpenCode plugin
    behavior must be byte-identical to the Phase 1 baseline.
  - **Dependencies**: T-028
  - **Effort**: `[M]`

---

- [ ] **T-030** `[FR-004]` `[FR-016]` `[NFR-009]` `[P]` Add cross-platform integration + plugin tests
  - **Phase**: 5
  - **Files**:
    - `tests/integration/claude-code-install.test.ts` (new)
    - `tests/integration/codex-install.test.ts` (new)
    - `tests/integration/plugin-behavior.test.ts` (new)
    - `tests/integration/mcp-error-handling.test.ts` (new)
  - **Description**: Write integration tests for the four scenarios from plan
    Section 9.3: fresh install on `.claude/`-only project, fresh install on
    `.codex/`-only project, multi-platform install with equivalence check,
    and MCP server killed mid-session returning a FR-016 structured error.
    Plugin behavior tests simulate a session event (hook stdin payload) and
    assert the expected side effect (appended decision log, blocked commit,
    watcher notification). These are nightly CI jobs, not per-PR.
  - **Dependencies**: T-029
  - **Effort**: `[M]`

---

- [ ] **T-031** `[NFR-001]` `[NFR-009]` `[P]` OS matrix CI + performance audit
  - **Phase**: 5
  - **Files**:
    - `.github/workflows/os-matrix.yml` (new — macOS x64, macOS arm64, Linux x64, Linux arm64, WSL2)
  - **Description**: Create a GitHub Actions workflow that runs the full test
    suite (unit + regression + projection + equivalence) on all 5 target
    OS/arch combinations (NFR-009). Add installer self-instrumentation timing
    (`Date.now()` at start and end of `install.ts::run()`) and log the
    wall-clock duration at INFO level. Verify P95 < 10s and P50 < 4s on a
    representative fixture project (NFR-001). Document any OS-specific
    deviations in `platform-deviations.md`.
  - **Dependencies**: T-030
  - **Effort**: `[M]`

---

- [ ] **T-032** `[FR-001]` `[NFR-002]` Final regression + release prep; tag FORGE 2.0
  - **Phase**: 5
  - **Files**:
    - `CHANGELOG.md` (modify — add FORGE 2.0 entry)
    - `package.json` (modify — bump version to `2.0.0`)
    - `mcp-server/package.json` (modify — set version to `2.0.0`)
  - **Description**: Run the complete test matrix one final time: unit +
    regression + projection + equivalence + integration + OS matrix. Confirm
    all FR-001..FR-019 covered (automated where possible, manual checklist for
    the rest). Write the CHANGELOG entry: "OpenCode users require no action;
    new platforms are available via `bun run install-forge`." Bump both
    package versions to `2.0.0` and create the git tag `v2.0.0`. Verify
    `install-forge --dry-run` on an OpenCode-only project still shows
    byte-identical output per NFR-002.
  - **Dependencies**: T-031
  - **Effort**: `[M]`

---

## Summary

| Metric                   | Value                                                    |
| ------------------------ | -------------------------------------------------------- |
| Total tasks              | 32                                                       |
| Total phases             | 5                                                        |
| Parallelizable tasks     | 15 (`[P]` tagged)                                        |
| Critical path length     | T-001 → T-002 → T-003 → T-007 → T-010 → T-011 → T-013 → T-014 → T-017 → T-023 → T-024 → T-028 → T-029 → T-030 → T-031 → T-032 |
| Requirements covered     | FR-001..FR-019, NFR-001..NFR-009 (all 28)                |
| Estimated total effort   | 4S + 13M + 5L = ~42–72h                                  |
| Hard blocker             | T-001 baseline must land before any other task           |

### Phase effort distribution

| Phase | Tasks | S  | M  | L  | Notes                              |
| ----- | ----- | -- | -- | -- | ---------------------------------- |
| 1     | 6     | 4  | 2  | 0  | Baseline + scaffold                |
| 2     | 6     | 1  | 4  | 1  | Installer refactor                 |
| 3     | 6     | 1  | 2  | 3  | MCP extraction (heaviest L-count)  |
| 4     | 9     | 1  | 7  | 1  | Multi-platform wiring              |
| 5     | 5     | 0  | 3  | 2  | Plugins + hardening + release      |

---

## Requirement Coverage Matrix

| Requirement | Tasks                          |
| ----------- | ------------------------------ |
| FR-001      | T-004, T-023                   |
| FR-002      | T-007, T-021, T-022            |
| FR-003      | T-013, T-014, T-015, T-016, T-018 |
| FR-004      | T-028, T-029, T-030            |
| FR-005      | T-019, T-022, T-023            |
| FR-006      | T-021, T-022, T-023            |
| FR-007      | T-021, T-022, T-023            |
| FR-008      | T-021, T-023                   |
| FR-009      | T-001, T-002, T-017, T-029     |
| FR-010      | T-010, T-011                   |
| FR-011      | T-020, T-026                   |
| FR-012      | T-010                          |
| FR-013      | T-010, T-011                   |
| FR-014      | T-009, T-010, T-012            |
| FR-015      | T-004, T-010                   |
| FR-016      | T-013, T-017, T-030            |
| FR-017      | T-008, T-024                   |
| FR-018      | T-025                          |
| FR-019      | T-026                          |
| NFR-001     | T-031                          |
| NFR-002     | T-001, T-002, T-017, T-032     |
| NFR-003     | T-011                          |
| NFR-004     | T-006, T-008                   |
| NFR-005     | T-021 (CLAUDE.md = @AGENTS.md) |
| NFR-006     | T-007                          |
| NFR-007     | T-005                          |
| NFR-008     | T-010 (CWD-scoped writes only) |
| NFR-009     | T-031                          |

---

## Cross-References

| Document          | Path                                                      |
| ----------------- | --------------------------------------------------------- |
| Spec              | `.forge-meta/specs/001-cross-platform/spec.md`            |
| Plan              | `.forge-meta/specs/001-cross-platform/plan.md`            |
| Constitution      | `.forge-meta/constitution.md`                             |
| ADR-001 (accepted)| `.forge-meta/knowledge/adr/ADR-001-cross-platform-strategy.md` |
| ADR-002..007      | `.forge-meta/knowledge/adr/` (authored in Phases 1, 2, 4) |
