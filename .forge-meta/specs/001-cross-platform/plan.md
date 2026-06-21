# Plan: 001 - Cross-Platform Support (Claude Code & Codex CLI)

> Technical implementation plan for the Epic-track cross-platform port.
> Created by `forge-architect` via `/forge-plan`. Implements
> [spec.md](./spec.md) under the strategy ratified in
> [ADR-001](../../knowledge/adr/ADR-001-cross-platform-strategy.md).

| Field   | Value                       |
| ------- | --------------------------- |
| Status  | Draft                       |
| Author  | forge-architect             |
| Date    | 2026-06-21                  |
| Track   | Epic                        |
| Spec    | [`./spec.md`](./spec.md)    |
| ADR     | [`ADR-001`](../../knowledge/adr/ADR-001-cross-platform-strategy.md) |
| Scope   | Meta-development (FORGE itself); paths are relative to repo root `/Users/luca/dev/opencode/forge/`, **not** the `dev/` sandbox. |

---

## 1. Overview

This plan operationalizes [ADR-001](../../knowledge/adr/ADR-001-cross-platform-strategy.md):
a **single-source-of-truth + per-platform projection** architecture that
lets FORGE install and run natively on OpenCode, Claude Code, and
Codex CLI without forking content. The plan covers:

1. **Installer refactor** — decompose the monolithic `install-forge.ts`
   (1360 lines) into a platform-agnostic core (`installer/`) plus three
   per-platform adapters (`installer/platforms/{opencode,claude-code,codex}.ts`).
2. **MCP server extraction** — move the heavy logic from the three
   `.opencode/tools/*.ts` files (~1947 lines) into a platform-agnostic
   core (`mcp-server/src/tools/`), exposed as a single MCP server
   (`mcp-server/index.ts`) reachable from all three platforms. OpenCode
   `tool()` wrappers remain as thin shims that call the same core
   (preserves FR-009 byte-identical OpenCode behavior during transition).
3. **Plugin adapter pattern** — split each plugin into a
   platform-agnostic core (`.opencode/plugins/shared/*-core.ts`) and a
   per-platform binding. OpenCode gets its existing event bindings;
   Claude Code gets `.claude/settings.json` `hooks` entries that shell
   out to small adapter scripts; Codex CLI gets `.codex/config.toml`
   hooks (subject to OQ-04 verification).
4. **Projection generation** — agent/command/skill `.md` files are
   copied (with frontmatter rewriting where required) into each detected
   platform's expected location. SHA-256 equivalence is enforced by CI
   (FR-018). `CLAUDE.md` is a 1-line `@AGENTS.md` import (FR-008).
5. **Regression harness** — a baseline snapshot of OpenCode behavior is
   captured **before** any refactor begins and re-verified at the end of
   every implementation phase. This is the structural mitigation for
   RISK-001 and the enforcement mechanism for NFR-002.

The plan is decomposed into five **implementation phases** that map
1-to-1 to the Stories already outlined for `/forge-tasks` consumption
(Story 0 — Constitution amendment — has been completed on 2026-06-21
per the amendments log; Phase 1 below begins with the regression
baseline capture).

### 1.1 Architecture diagram (text)

```
              ┌─────────────────────────────────────────────────────┐
              │              Single Source of Truth                  │
              │            (canonical content artifacts)             │
              │  .opencode/agents/*.md      (9 files)                │
              │  .opencode/commands/*.md    (24 files)               │
              │  .opencode/skills/*/SKILL.md (12 dirs)               │
              │  AGENTS.md                  (project instructions)   │
              └─────────────────────────────────────────────────────┘
                                     │
                                     ▼
              ┌─────────────────────────────────────────────────────┐
              │            installer/ (platform-agnostic)            │
              │  detect.ts    types.ts    config.ts    install.ts    │
              └─────────────────────────────────────────────────────┘
                                     │
                       ┌─────────────┼─────────────┐
                       ▼             ▼             ▼
              ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
              │ opencode.ts │ │claude-code.ts│ │  codex.ts   │
              │  (adapter)  │ │  (adapter)  │ │  (adapter)  │
              └─────────────┘ └─────────────┘ └─────────────┘
                       │             │             │
                       ▼             ▼             ▼
              .opencode/       .claude/         .codex/
              opencode.json    settings.json    config.toml
              + tools/         + hooks/         + ../AGENTS.md
              + plugins/       + CLAUDE.md      + ../.agents/skills/

                                     │
                                     ▼
              ┌─────────────────────────────────────────────────────┐
              │   mcp-server/ (single MCP server, all 3 platforms)   │
              │  index.ts (StdioServerTransport)                     │
              │  src/tools/{validate-spec,trace-requirements,        │
              │             sprint-status}.ts (shared core)          │
              └─────────────────────────────────────────────────────┘

              ┌─────────────────────────────────────────────────────┐
              │       Plugin adapter pattern (per behavior)          │
              │  shared/<name>-core.ts ◄── all platforms call this   │
              │   ├─ <name>.opencode.ts   (OpenCode Plugin hooks)    │
              │   ├─ <name>.claude.ts     (Claude Code hooks runner) │
              │   └─ <name>.codex.ts      (Codex CLI hooks runner)   │
              └─────────────────────────────────────────────────────┘
```

### 1.2 What this plan does NOT do

- Write implementation code (delegated to `/forge-implement`).
- Define tasks (delegated to `forge-scrum` via `/forge-tasks`).
- Resolve open questions from the spec — **OQ-01..OQ-10** are addressed
  here only where the answer is architecturally forced (OQ-05, OQ-07 are
  already resolved by spec FR refinements). The rest are surfaced in
  Section 14 of this plan as decisions that must be confirmed by the
  human owner before `/forge-tasks`.

---

## 2. Data Model

This is tooling, not a database-backed application. There are **no
persistent data tables**. The installer maintains in-memory data
structures and writes a single manifest file. The MCP server is
stateless.

### 2.1 Internal Data Structures (TypeScript)

Defined in `installer/types.ts`. These are the four core types
referenced throughout this plan.

```typescript
// installer/types.ts

/** Identifier of a supported platform. */
export type Platform = "opencode" | "claude-code" | "codex";

/**
 * Static metadata describing how a platform expects FORGE to be laid out.
 * One instance per platform; defined as a constant in
 * installer/platforms/<platform>.ts.
 */
export interface PlatformDescriptor {
  /** Unique platform identifier. */
  id: Platform;

  /** Human-readable name for CLI output. */
  displayName: string;

  /** Probe paths — presence of ANY of these marks the platform detected. */
  detectionPaths: string[];      // e.g. [".claude", ".claude/settings.json"]

  /** Where each artifact class is projected on this platform. */
  layout: {
    agents:   string;            // e.g. ".claude/agents"
    commands: string;            // e.g. ".claude/commands"
    skills:   string;            // e.g. ".claude/skills"
    config:   string;            // root config file path
    instructionsFile?: string;   // e.g. "CLAUDE.md" or undefined if AGENTS.md
  };

  /** Config-file format the adapter must produce. */
  configFormat: "json" | "toml";

  /** Subagent dispatch model — informs the runtime contract (FR-011). */
  subagentDispatch: "task-tool" | "at-mention" | "worker-spawn";

  /** Hook/event vocabulary supported by the platform (for FR-004). */
  hookEvents: ReadonlyArray<HookEvent>;
}

export type HookEvent =
  | "pre-tool-use"
  | "post-tool-use"
  | "session-stop"
  | "subagent-stop"
  | "user-prompt-submit"
  | "notification";

/** A single planned write operation. Stored in InstallPlan. */
export interface InstallOperation {
  platform: Platform;
  kind: "agent" | "command" | "skill" | "config" | "instructions" | "plugin-binding";
  sourcePath: string;            // canonical .opencode/... path
  targetPath: string;            // destination on this platform
  contentTransform?: "as-is" | "frontmatter-rewrite" | "markdown-to-toml" | "config-merge";
  expectedSha256: string;        // checksum of canonical content (FR-018)
  reason: "create" | "update" | "skip-unchanged" | "skip-user-edit" | "backup-then-create";
}

/** Pre-execution plan; printed verbatim under `--dry-run`. */
export interface InstallPlan {
  detectedPlatforms: Platform[];
  operations: InstallOperation[];
  warnings: string[];            // conflicts, unknown drift, etc.
  refusalReason?: string;        // populated when planning concluded the run must abort
}

/** Post-execution result; emitted to stdout summary and persisted. */
export interface InstallResult {
  plan: InstallPlan;
  written: InstallOperation[];
  skipped: InstallOperation[];
  backedUp: { original: string; backup: string }[];
  errors: { op: InstallOperation; error: string }[];
  durationMs: number;
  manifestPath: string;          // path to InstallManifest written on disk
}

/** Durable record of the most recent install — enables idempotency (NFR-006). */
export interface InstallManifest {
  version: 1;
  forgeVersion: string;          // from package.json
  installedAt: string;           // ISO 8601
  platforms: Platform[];
  files: Record<string, {        // keyed by absolute target path
    sha256: string;
    sourceSha256: string;        // checksum of canonical source at install time
    platform: Platform;
    kind: InstallOperation["kind"];
  }>;
}
```

### 2.2 Persisted artifacts

| Entity            | Persistence                              | Lifetime           |
| ----------------- | ---------------------------------------- | ------------------ |
| `InstallManifest` | `.forge/.install-manifest.json` (JSON)   | Until next install |
| Drift backups     | `.forge/.backups/<ISO-timestamp>/...`    | User-managed       |
| MCP server logs   | stderr only (no file)                    | Per process        |

`.forge/.install-manifest.json` and `.forge/.backups/` MUST be listed in
`.forge/.gitignore`. The installer writes this `.gitignore` entry on
first run if absent (resolves OQ-07 / RISK-007).

### 2.3 Migrations

There is no DB migration. The migration semantics are:

1. **Pre-cross-platform installs** — no `InstallManifest` exists. The
   installer treats every `.opencode/` file as "unknown drift" against a
   pristine baseline. To avoid spurious drift warnings on upgrade, Phase
   1 (Section 8) emits a one-time **synthesis pass**: it computes
   checksums of the existing `.opencode/` tree against the canonical
   source and, if they match the shipped baseline, writes the manifest
   as if the cross-platform installer had placed them. If they differ,
   the user is warned per FR-014.
2. **`.opencode/`-only existing users** — manifest synthesis above
   covers them. No file is moved; no `.claude/` or `.codex/` is created
   unless those directories already exist (FR-001).

---

## 3. Contract Surfaces

> This project has no HTTP API. It has **four** machine-readable
> contracts that must be stable across platforms. Each is normative.

### 3.1 CLI surface — `install-forge`

The only human-facing entry point. Implemented in `install-forge.ts`
(the existing file, refactored to be a thin shim over `installer/`).

| Flag                       | Default        | Effect                                                                                                             |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `--dry-run`                | off            | Compute and print the `InstallPlan`; perform no writes. (FR-013)                                                   |
| `--check`                  | off            | Implies `--dry-run`. Exit non-zero if the plan contains any operation other than `skip-unchanged`. Used by CI (FR-017). |
| `--platform=<id>` (repeatable) | (auto-detect) | Restrict targets to the named platform(s). For testing/CI only; the happy path uses auto-detection (NFR-003).      |
| `--interactive`            | off            | For each drift, show unified diff + prompt `overwrite / keep / merge`. Per FR-014 / OQ-07.                          |
| `--force`                  | off            | Overwrite drift without backing up. Discouraged; emits a yellow warning when used.                                  |
| `--verbose`                | off            | Increase log level to DEBUG. (NFR-007)                                                                              |

Exit codes:

| Code | Meaning                                                              |
| ---- | -------------------------------------------------------------------- |
| 0    | Success (writes performed or `--dry-run` matched expectation).       |
| 1    | Generic error.                                                       |
| 2    | No supported platform detected (FR-015).                             |
| 3    | `--check` found a planned operation (CI failure signal — FR-017).    |
| 4    | Drift detected and not resolvable (interactive mode declined or non-interactive disabled). |
| 5    | Permission denied writing to target (Edge Case 7).                   |
| 6    | Disk full / OS error (Edge Case 12).                                 |
| 7    | Pre-existing config keys conflict and cannot be auto-merged (Edge Case 11 / OQ-09). |

### 3.2 MCP protocol contract — `forge-mcp-server`

The MCP server is a long-lived stdio process spawned by each platform's
MCP client. It exposes three tools and zero resources/prompts in v1.

**Server identity (returned in `initialize`):**

```json
{
  "name": "forge-mcp-server",
  "version": "<from mcp-server/package.json>",
  "capabilities": { "tools": {} }
}
```

**Tools registered (`tools/list` response):**

| Tool name              | Description                                       | Input schema                                          |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `validate-spec`        | Validate a spec.md or tech-spec.md.               | `{ specPath: string }` (one of `specPath`, `specId`)  |
| `trace-requirements`   | Trace requirements from spec → plan → tasks → code → tests. | `{ specId?: string, specPath?: string }`        |
| `sprint-status`        | Render the FORGE sprint status dashboard.         | `{}` (no inputs)                                      |

Each tool's input/output schema MUST equal the schema of the
corresponding current `.opencode/tools/*.ts` tool (preserves US-003 /
NFR-002 byte-identical OpenCode behavior). The validator must therefore
fix the two bugs documented in spec Section 13.0 (validator findings —
line 187 FR regex and line 266 `\Z` anchor) **during extraction**, not
after, to avoid two refactor passes.

**Error envelope:** all tool errors return MCP `isError: true` with a
human-readable `content[0].text` matching FR-016 format:

```
[forge-mcp-server] Tool '<name>' failed: <reason>
Expected MCP server at: <stdio path or command>
Suggested remediation: <command>
```

### 3.3 Subagent dispatch contract (RISK-004, FR-011, OQ-08)

This contract is normative and lives at
`docs/meta-development/subagent-contract.md` (created in Phase 4 below).
It must hold across all three platforms.

**Envelope (input)** — passed from orchestrator to subagent:

```json
{
  "version": 1,
  "subagent": "forge-pm",
  "phase": "specify",
  "args": {
    "spec_id": "001",
    "track": "Epic"
  },
  "context": {
    "cwd": "/abs/path",
    "constitution_path": ".forge-meta/constitution.md"
  }
}
```

**Envelope (output)** — returned from subagent to orchestrator:

```json
{
  "version": 1,
  "subagent": "forge-pm",
  "status": "ok" | "error" | "partial",
  "result": { /* structured payload, schema per-phase */ },
  "artifacts": [ { "path": "...", "kind": "spec" } ],
  "messages": [ { "level": "info" | "warn" | "error", "text": "..." } ]
}
```

**Per-platform translation:**

| Platform     | Input envelope                                          | Output envelope                                          | Max depth |
| ------------ | ------------------------------------------------------- | -------------------------------------------------------- | --------- |
| OpenCode     | passed via `task` tool's `prompt` (JSON.stringify)      | parsed from final assistant message (JSON code block)    | 3         |
| Claude Code  | passed via `@<agent>` mention prefix + JSON code block  | parsed from final assistant message (JSON code block)    | 2 (TBC)   |
| Codex CLI    | passed via worker spawn args (TBC per OQ-04)            | parsed from worker stdout (JSON line)                    | TBC       |

The "TBC" cells are the open subset of OQ-08 — resolved during Phase 4
implementation by hand-testing each platform's primitive and recording
findings in the deviation log (FR-019). Adapter layer
(`installer/platforms/<platform>.ts`) carries the translation glue.

### 3.4 Platform config schemas

Each platform's root config is generated from a shared internal model.
The model lives in `installer/config.ts`. Output schemas:

**OpenCode (`opencode.json`)** — strict superset of current file; adds
one new key:

```jsonc
{
  // existing keys preserved verbatim (model, default_agent, provider, agent, permission, instructions)
  "mcp": {
    // existing "github" entry preserved
    "forge": {
      "type": "local",
      "command": ["bun", "run", "mcp-server/index.ts"]
    }
  }
}
```

**Claude Code (`.claude/settings.json`)** — generated fresh:

```jsonc
{
  "$schema": "https://...",
  "mcpServers": {
    "forge": {
      "type": "stdio",
      "command": "bun",
      "args": ["run", "mcp-server/index.ts"]
    }
  },
  "hooks": {
    "PreToolUse":  [{ "matcher": "Bash", "hooks": [{ "type": "command", "command": "bun run .opencode/plugins/shared/pre-commit-gate.claude.ts" }] }],
    "Stop":        [{ "hooks": [{ "type": "command", "command": "bun run .opencode/plugins/shared/session-knowledge.claude.ts" }] }],
    "PostToolUse": [{ "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "bun run .opencode/plugins/shared/spec-watcher.claude.ts" }] }]
  },
  "permissions": {
    // mirror of OpenCode permission policy translated to Claude Code's vocabulary
  }
}
```

**Codex CLI (`.codex/config.toml`)** — generated fresh; final schema
pending OQ-04 verification but anchored to:

```toml
# Generated by FORGE installer — do not edit.

[mcp.forge]
command = "bun"
args = ["run", "mcp-server/index.ts"]

[[hooks]]
event = "<TBC>"
command = "bun run .opencode/plugins/shared/<name>.codex.ts"
```

The platform adapter is the **only** site that knows the exact key
names; the shared installer core operates on the abstract `HookEvent`
union (Section 2.1).

---

## 4. Component Design

### 4.1 Installer core (`installer/`)

| Module                       | Responsibility                                                              | Lines (est.) |
| ---------------------------- | --------------------------------------------------------------------------- | ------------ |
| `installer/types.ts`         | Shared TypeScript types (Section 2.1).                                      | ~120         |
| `installer/detect.ts`        | Probe `.opencode/`, `.claude/`, `.codex/`; return `Platform[]` (FR-001).    | ~80          |
| `installer/config.ts`        | Build internal config model; merge with user keys (OQ-09 policy).           | ~200         |
| `installer/manifest.ts`      | Read/write `.forge/.install-manifest.json`; idempotency check (NFR-006).    | ~120         |
| `installer/projection.ts`    | Walk canonical artifacts; compute targets via `PlatformDescriptor.layout`.  | ~180         |
| `installer/drift.ts`         | Compare existing files to manifest; classify (`unchanged`/`drift`/`user`).  | ~150         |
| `installer/backup.ts`        | Create `.forge/.backups/<ts>/...`; update `.gitignore` (RISK-007).          | ~80          |
| `installer/install.ts`       | Orchestrate: detect → plan → execute → manifest → summary.                  | ~250         |
| `installer/log.ts`           | INFO/WARN/ERR formatter with `[OK]`/`[SKIP]`/`[ERR]` prefixes (NFR-007).    | ~60          |
| `install-forge.ts` (root)    | Thin CLI shim: argv parse → call `installer/install.ts`.                    | ~80          |

Each `installer/platforms/<id>.ts` exports a single `PlatformDescriptor`
constant **plus** any per-platform helpers (e.g.
`generateClaudeSettings(config: ConfigModel): object`,
`generateCodexConfig(config: ConfigModel): string`). Adapter modules
MUST NOT contain core logic — they are pure config/path declarations
with at most a config-emitter function.

### 4.2 MCP server (`mcp-server/`)

| File                                              | Responsibility                                                  |
| ------------------------------------------------- | --------------------------------------------------------------- |
| `mcp-server/package.json`                         | Standalone package declaring `@modelcontextprotocol/sdk` dep.   |
| `mcp-server/tsconfig.json`                        | Strict TS, Node20 module resolution, ESM output.                |
| `mcp-server/index.ts`                             | Entry: `Server` + `StdioServerTransport`; registers 3 tools.    |
| `mcp-server/src/tools/validate-spec.ts`           | Core logic moved from `.opencode/tools/validate-spec.ts`.       |
| `mcp-server/src/tools/trace-requirements.ts`      | Core logic moved from `.opencode/tools/trace-requirements.ts`.  |
| `mcp-server/src/tools/sprint-status.ts`           | Core logic moved from `.opencode/tools/sprint-status.ts`.       |
| `mcp-server/src/lib/<helpers>.ts`                 | Shared parsing/formatting helpers across the 3 tools.           |

**Extraction pattern** — each tool's logic is split into:

```typescript
// mcp-server/src/tools/validate-spec.ts
export interface ValidateSpecArgs { specPath: string }
export interface ValidateSpecResult { score: number; issues: Issue[]; ... }

export async function validateSpec(args: ValidateSpecArgs): Promise<ValidateSpecResult> {
  // ... pure function; reads files via node:fs/promises; no OpenCode imports
}
```

**OpenCode bridge** (preserves backward compat during transition;
deleted in a later release once MCP is the universal path):

```typescript
// .opencode/tools/validate-spec.ts (after refactor)
import { tool } from "@opencode-ai/plugin"
import { validateSpec } from "../../mcp-server/src/tools/validate-spec"

export default tool({
  description: "...",
  args: { specPath: tool.schema.string() },
  async execute(args) {
    const result = await validateSpec(args)
    return JSON.stringify(result, null, 2)
  },
})
```

**MCP registration** (`mcp-server/index.ts`):

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { validateSpec } from "./src/tools/validate-spec.js"
// ... etc

const server = new Server({ name: "forge-mcp-server", version: "..." }, { capabilities: { tools: {} } })

server.setRequestHandler(/* tools/list */, async () => ({
  tools: [
    { name: "validate-spec", description: "...", inputSchema: { /* json schema */ } },
    // ...
  ],
}))

server.setRequestHandler(/* tools/call */, async (req) => {
  switch (req.params.name) {
    case "validate-spec": return wrap(await validateSpec(req.params.arguments))
    // ...
    default: return { isError: true, content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }] }
  }
})

await server.connect(new StdioServerTransport())
```

### 4.3 Plugin adapter pattern

Each of the three plugins is split as follows.

**Example: `session-knowledge`**

| File                                                       | Role                                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| `.opencode/plugins/shared/session-knowledge-core.ts`       | Pure functions: `extractDecisions(messages)`, `appendToLog(path, entries)`, `extractLastEntries(content, count)`. No platform imports. |
| `.opencode/plugins/shared/session-knowledge.opencode.ts`   | Imports `@opencode-ai/plugin` `Plugin`; subscribes to `session.idle` + `experimental.session.compacting`; calls into core. |
| `.opencode/plugins/shared/session-knowledge.claude.ts`     | Executable hook script; reads JSON event from stdin (Claude Code hook protocol); calls into core. |
| `.opencode/plugins/shared/session-knowledge.codex.ts`      | Executable hook script for Codex CLI; calls into core. (Schema TBC — OQ-04.) |
| `.opencode/plugins/session-knowledge.ts` (existing path)   | Re-exports `.opencode.ts` content to preserve current `opencode.json` plugin loading path. Deleted in a future release once OpenCode loads from `shared/`. |

**Graceful degradation (OQ-03):** if a target platform has no event
equivalent for a behavior, the per-platform binding file is **omitted**
(not generated). The installer logs `[SKIP] <plugin> on <platform>: no
equivalent event` at INFO. This is per FR-004's "preserving observable
effects where possible" semantics.

| Plugin                | OpenCode event                       | Claude Code event              | Codex CLI event       |
| --------------------- | ------------------------------------ | ------------------------------ | --------------------- |
| `session-knowledge`   | `session.idle` + `experimental.session.compacting` | `Stop` + `SubagentStop`        | TBC (OQ-04)           |
| `pre-commit-gate`     | `tool.execute.before` (git commit)   | `PreToolUse` matcher `Bash`    | TBC (OQ-04)           |
| `spec-watcher`        | `tool.execute.after` (Write/Edit)    | `PostToolUse` matcher `Write\|Edit` | TBC (OQ-04)      |

The Claude Code event mappings are based on the platform's published
hook vocabulary (`PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`,
`UserPromptSubmit`, `Notification`).

### 4.4 Projection generation (agents / commands / skills)

The current canonical files in `.opencode/{agents,commands,skills}/` are
already Markdown with YAML frontmatter. Projection is mostly **byte
copy** with two exceptions:

1. **Path rewriting in frontmatter** — if an agent's frontmatter
   references a path relative to `.opencode/`, the projection rewrites
   it to the target platform's path. (Today, none do — to be verified in
   Phase 1.)
2. **Codex agent format** — if OQ-04 concludes Codex needs TOML agent
   files, the projection generates `.codex/agents/<name>.toml` from the
   Markdown source via a deterministic translator
   (`installer/platforms/codex.ts::markdownToToml`). Until OQ-04 is
   resolved, Phase 2 SHALL ship `.codex/agents/<name>.md` AND
   `.claude/agents/<name>.md` (Codex fallback) and the deviation is
   logged.

Skills are nested directories; projection walks each `SKILL.md` and
copies the entire directory tree.

`CLAUDE.md` is a 1-line file: `@AGENTS.md` (Claude Code import syntax,
FR-008, RISK-005, RISK-010).

### 4.5 Project instructions (`AGENTS.md`)

Canonical at repo root. Already exists. Verified compatible with all
three platforms in Phase 1.

---

## 5. File Map

> Paths are repo-root relative.

### 5.1 Files to Create

| Path                                                       | Purpose                                                        | Size |
| ---------------------------------------------------------- | -------------------------------------------------------------- | ---- |
| `installer/types.ts`                                       | Shared types (Section 2.1).                                    | S    |
| `installer/detect.ts`                                      | Platform detection (FR-001).                                   | S    |
| `installer/config.ts`                                      | Config model + merge logic (FR-002, OQ-09).                    | M    |
| `installer/manifest.ts`                                    | Manifest I/O (NFR-006).                                        | S    |
| `installer/projection.ts`                                  | Canonical artifact → per-platform targets.                     | M    |
| `installer/drift.ts`                                       | Drift classification (FR-014).                                 | M    |
| `installer/backup.ts`                                      | Backup creator + `.gitignore` updater (RISK-007).              | S    |
| `installer/install.ts`                                     | Orchestrator (detect→plan→execute).                            | M    |
| `installer/log.ts`                                         | Structured logger (NFR-007).                                   | S    |
| `installer/platforms/opencode.ts`                          | OpenCode `PlatformDescriptor` + config emitter.                | S    |
| `installer/platforms/claude-code.ts`                       | Claude Code descriptor + `settings.json` emitter.              | M    |
| `installer/platforms/codex.ts`                             | Codex CLI descriptor + `config.toml` emitter (subject to OQ-04). | M    |
| `mcp-server/package.json`                                  | MCP server package manifest.                                   | S    |
| `mcp-server/tsconfig.json`                                 | TS config (Node20, ESM, strict).                               | S    |
| `mcp-server/index.ts`                                      | MCP entry (Server + StdioServerTransport).                     | S    |
| `mcp-server/src/tools/validate-spec.ts`                    | Validator core (extracted + bug-fixed; spec Section 13.0).     | L    |
| `mcp-server/src/tools/trace-requirements.ts`               | Traceability core.                                             | L    |
| `mcp-server/src/tools/sprint-status.ts`                    | Sprint dashboard core.                                         | L    |
| `mcp-server/src/lib/spec-parse.ts`                         | Shared markdown/frontmatter parser.                            | M    |
| `.opencode/plugins/shared/session-knowledge-core.ts`       | Plugin core (platform-agnostic).                               | M    |
| `.opencode/plugins/shared/session-knowledge.opencode.ts`   | OpenCode binding.                                              | S    |
| `.opencode/plugins/shared/session-knowledge.claude.ts`     | Claude Code hook script.                                       | S    |
| `.opencode/plugins/shared/session-knowledge.codex.ts`      | Codex CLI hook script (TBC OQ-04).                             | S    |
| `.opencode/plugins/shared/pre-commit-gate-core.ts`         | Plugin core.                                                   | M    |
| `.opencode/plugins/shared/pre-commit-gate.{opencode,claude,codex}.ts` | Per-platform bindings.                               | S each |
| `.opencode/plugins/shared/spec-watcher-core.ts`            | Plugin core.                                                   | M    |
| `.opencode/plugins/shared/spec-watcher.{opencode,claude,codex}.ts` | Per-platform bindings.                                   | S each |
| `tests/regression/baseline/`                               | Captured baseline snapshots (commit-tracked).                  | L    |
| `tests/regression/opencode-parity.test.ts`                 | Regression test runner.                                        | M    |
| `tests/regression/projection-fixtures/`                    | Per-platform fixture project trees (FR-017).                   | M    |
| `tests/regression/projection-equivalence.test.ts`          | Checksum equivalence runner (FR-018).                          | M    |
| `docs/meta-development/subagent-contract.md`               | Normative contract (FR-011, RISK-004).                         | M    |
| `docs/meta-development/platform-deviations.md`             | Deviation log (FR-019, RISK-008).                              | S init|
| `docs/meta-development/architecture.md`                    | Cross-platform architecture doc (Section 14 of spec).          | M    |
| `.forge-meta/knowledge/adr/ADR-002-mcp-sdk-dependency.md`  | Proposed (Section 11.2).                                       | S    |
| `.forge-meta/knowledge/adr/ADR-003-shared-core-pattern.md` | Proposed (Section 11.2).                                       | S    |
| `.forge-meta/knowledge/adr/ADR-004-subagent-dispatch-contract.md` | Proposed (Section 11.2).                                | M    |
| `.forge-meta/knowledge/adr/ADR-005-codex-agent-format.md`  | Proposed (Section 11.2).                                       | M    |
| `.forge-meta/knowledge/adr/ADR-006-backup-location-policy.md` | Proposed (Section 11.2).                                    | S    |
| `.forge-meta/knowledge/adr/ADR-007-config-conflict-policy.md` | Proposed (Section 11.2).                                    | S    |

Sizes: S = <120 lines, M = 120-400 lines, L = >400 lines.

### 5.2 Files to Modify

| Path                                  | Section / Lines                             | Change                                                                                                          | Effort |
| ------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ |
| `install-forge.ts`                    | All 1360 lines                              | Strip to a CLI shim (~80 lines) calling `installer/install.ts`. Old logic redistributed per File Map above.    | L      |
| `opencode.json`                       | `mcp` block                                 | Add `forge` MCP entry (Section 3.4). No other keys touched (preserves FR-009).                                  | S      |
| `.opencode/tools/validate-spec.ts`    | All 497 lines                               | Replace with thin `tool()` wrapper calling `mcp-server/src/tools/validate-spec.ts::validateSpec()`. ~30 lines.   | M      |
| `.opencode/tools/trace-requirements.ts` | All 444 lines                             | Same pattern.                                                                                                    | M      |
| `.opencode/tools/sprint-status.ts`    | All 1006 lines                              | Same pattern.                                                                                                    | M      |
| `.opencode/plugins/session-knowledge.ts` | All 290 lines                            | Replace with re-export of `shared/session-knowledge.opencode.ts`. (Existing `opencode.json` plugin loading path preserved.) | M      |
| `.opencode/plugins/pre-commit-gate.ts`| All 339 lines                               | Same pattern.                                                                                                    | M      |
| `.opencode/plugins/spec-watcher.ts`   | All 226 lines                               | Same pattern.                                                                                                    | S      |
| `AGENTS.md` (repo root)               | Header section                              | Add a "Supported runtimes" line listing OpenCode / Claude Code / Codex CLI. (No instructional content change.)   | S      |
| `README.md`                           | Installation section                        | Replace with multi-platform install table. Add a "Supported platforms" matrix.                                  | S      |
| `package.json` (repo root)            | `scripts`                                   | Add `"mcp-server": "bun run mcp-server/index.ts"`. Ensure `install-forge` script still works.                   | S      |
| `.gitignore` (repo root)              | new lines                                   | Add `.forge/.install-manifest.json`, `.forge/.backups/`. (Idempotent; installer also self-heals — Section 4.1.) | S      |

### 5.3 Files to Delete

None in this phase. The three `.opencode/tools/*.ts` files and three
`.opencode/plugins/*.ts` files are **modified to be thin shims**, not
deleted, to preserve FR-009 (byte-identical OpenCode behavior). A future
release MAY delete them once MCP is the universal path.

The 2026-02-16 amendment to constitution Art. 2.3 prohibits
distributing `installer/`, `mcp-server/`, `tests/regression/`, and
`docs/meta-development/` to user projects. The installer enforces this
by **not** copying them.

### 5.4 Files to Reference (read-only)

| Path                                                | Purpose                                                    |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `.forge-meta/constitution.md`                       | Article 1.2 (amended 2026-06-21), Art. 2-5 compliance.     |
| `.forge-meta/specs/001-cross-platform/spec.md`      | Source spec (FR-001..FR-019, NFR-001..NFR-009, RISK, OQ).  |
| `.forge-meta/knowledge/adr/ADR-001-cross-platform-strategy.md` | Strategy decision.                              |
| `.opencode/skills/constitution-compliance/SKILL.md` | Compliance check methodology used in Section 12.            |
| `.opencode/skills/context-chain/SKILL.md`           | Plan ↔ spec linkage rules.                                  |

---

## 6. Dependencies

### 6.1 New runtime dependencies

| Package                            | Version | Purpose                                          | Scope          |
| ---------------------------------- | ------- | ------------------------------------------------ | -------------- |
| `@modelcontextprotocol/sdk`        | ^1.0    | MCP server protocol implementation (FR-003).     | `mcp-server/`  |

This is the **only** new runtime dependency. It lives inside the
`mcp-server/` package, not in the FORGE repo-root `package.json` runtime
deps, which preserves the spirit of constitution Art. 2.2 ("Zero runtime
dependencies for core framework"). The MCP server is a separate
out-of-process binary, classified as a "plugin dependency" by ADR-002
(proposed — Section 11.2).

### 6.2 New devDependencies (repo root)

| Package         | Version    | Purpose                                                       |
| --------------- | ---------- | ------------------------------------------------------------- |
| `vitest`        | ^2         | Regression + projection test runner (replace ad-hoc scripts). |
| `@types/node`   | ^20        | Type defs (already present; pin to 20.x).                     |
| `smol-toml`     | ^1         | TOML emitter for `installer/platforms/codex.ts`.              |

`smol-toml` is small, zero-dep, MIT-licensed. devDep-only because the
TOML emitter runs at install time, not in the user's process.

### 6.3 Internal dependencies

The installer depends on the canonical content in
`.opencode/{agents,commands,skills}/` being present at install time
(self-installs). The MCP server depends on the spec/plan/tasks files
the user authors under `.forge/specs/` at tool-invocation time.

---

## 7. Migration & Backward Compatibility

The migration story is **the** load-bearing requirement of this plan
(US-003, NFR-002). The design choices are:

1. **No file moves, no renames.** Canonical `.opencode/` content stays
   exactly where it is. Existing OpenCode users see no path change.
2. **Manifest synthesis on first run.** Section 2.3 covers the
   one-time "we shipped before manifests existed" backfill.
3. **Opt-in MCP server.** The new `mcp.forge` block in `opencode.json`
   is the *only* observable change to an OpenCode-only project. It is
   functionally equivalent to the current `.opencode/tools/*.ts` route
   (same input → same output, byte-identical) once the MCP server is
   wired. If a user has not yet started the MCP server, the OpenCode
   `tool()` shim still calls the shared core directly (Section 4.2).
   This is the FR-016 / RISK-002 fallback.
4. **Drift handling.** Per FR-014 / OQ-07: default = non-interactive
   backup to `.forge/.backups/<ts>/`. `--interactive` flag for
   per-file prompts. Backups are inside `.forge/` (gitignored by
   convention, with installer self-healing the `.gitignore` if needed).
5. **Version label.** This release is **FORGE 2.0** (OQ-10). Rationale:
   while content is byte-identical for OpenCode users, the addition of
   Claude Code and Codex CLI support is a substantial feature
   expansion. The major-version bump signals scope to users without
   implying breakage. Constitution Art. 1.2 "zero breaking changes
   without migration" is satisfied because there *are* no breaking
   changes for the OpenCode user — the migration here is additive.

The CHANGELOG entry for 2.0 will explicitly state: **"OpenCode users
require no action; new platforms are available via `bun run install-forge`."**

---

## 8. Implementation Phases

Five phases map 1-to-1 to the stories the spec / scrum will track.
Story 0 — Constitution amendment — was **already merged** on 2026-06-21
(see constitution amendments log entry). Phase numbering below starts
at 1 to align with the surviving stories.

### Phase 1 — Regression baseline + installer core scaffold

**Objective:** Capture a complete OpenCode behavior baseline **before**
any source change. Stand up the new `installer/` directory with no
functionality cut over yet. The legacy `install-forge.ts` keeps
working.

**Critical first task:** baseline capture is non-negotiable; nothing
else in this phase begins until it lands.

**Create:**
- `tests/regression/baseline/` — snapshot files (one per FORGE command
  invocation: at minimum `/forge-status`, `/forge-help`, plus
  `validate-spec`, `trace-requirements`, `sprint-status` outputs on a
  fixture project). · effort: M · deps: None
- `tests/regression/opencode-parity.test.ts` — runs `install-forge`,
  invokes the captured commands via OpenCode harness, asserts
  byte-identical output. · effort: M · deps: baseline/
- `installer/types.ts` — Section 2.1 types. · effort: S
- `installer/detect.ts` — FR-001. · effort: S
- `installer/log.ts` — NFR-007 formatter. · effort: S
- `installer/platforms/opencode.ts` — `PlatformDescriptor` only (no
  emitter yet; current `opencode.json` stays hand-written through this
  phase). · effort: S
- `.forge-meta/knowledge/adr/ADR-002-mcp-sdk-dependency.md` —
  classifies MCP-SDK; resolves Art. 2.2 tension. · effort: S
- `.forge-meta/knowledge/adr/ADR-003-shared-core-pattern.md` —
  records the core/binding split. · effort: S

**Modify:**
- `package.json` — add `vitest`, `smol-toml`, `@types/node` pin.
  · effort: S

**Tasks:**
1. [ ] Capture baseline outputs for the regression suite on the current
   `main` branch BEFORE any other change in this phase.
2. [ ] Set up `vitest` and a CI job that runs the regression suite.
3. [ ] Create `installer/types.ts`, `installer/detect.ts`,
   `installer/log.ts` with full type coverage.
4. [ ] Author ADR-002 (MCP-SDK dependency classification) and ADR-003
   (shared-core extraction pattern); mark Proposed → Accepted after
   review.
5. [ ] Verify CI green; regression suite is the new merge gate.

**Exit criteria:** baseline locked, `installer/` directory exists,
existing OpenCode behavior unchanged, CI runs regression on every PR.

---

### Phase 2 — Installer refactor + projection plumbing

**Objective:** Move all logic from the monolithic `install-forge.ts`
into `installer/` modules. Old file becomes a CLI shim. OpenCode
install path now goes through the new pipeline but emits the same
output. Auto-detection works for `.opencode/` only.

**Create:**
- `installer/config.ts`, `installer/manifest.ts`,
  `installer/projection.ts`, `installer/drift.ts`,
  `installer/backup.ts`, `installer/install.ts`. · effort: L · deps: Phase 1
- `.forge-meta/knowledge/adr/ADR-006-backup-location-policy.md` —
  records OQ-07 resolution. · effort: S
- `.forge-meta/knowledge/adr/ADR-007-config-conflict-policy.md` —
  records OQ-09 resolution. · effort: S

**Modify:**
- `install-forge.ts` — strip to CLI shim (~80 lines). Logic moves to
  `installer/install.ts`. · effort: L
- `.gitignore` — add manifest and backups paths.

**Tasks:**
1. [ ] Implement detection (already in Phase 1), planning, drift
   classification, manifest I/O, backup creation, projection.
2. [ ] Wire `--dry-run`, `--check`, `--interactive`, `--force`,
   `--verbose`, exit-code surface (Section 3.1).
3. [ ] Cut over `install-forge.ts` to the new pipeline; delete the
   moved code only after the regression suite is still green.
4. [ ] Author ADR-006, ADR-007; resolve OQ-07, OQ-09.
5. [ ] Document the post-install summary format (FR-012).

**Exit criteria:** `install-forge --dry-run` produces a complete
`InstallPlan` for an `.opencode/`-only project; `install-forge`
without flags produces the same `.opencode/` tree as before
(checksum-verified); regression suite green.

---

### Phase 3 — MCP server extraction

**Objective:** Stand up `mcp-server/` and move tool logic into its
shared core. OpenCode `.opencode/tools/*.ts` become thin wrappers
calling the shared core directly (not yet over MCP). Validator bugs
fixed during extraction (spec Section 13.0).

**Create:**
- `mcp-server/package.json`, `mcp-server/tsconfig.json`,
  `mcp-server/index.ts`. · effort: M · deps: Phase 2
- `mcp-server/src/tools/{validate-spec,trace-requirements,sprint-status}.ts`
  — extracted shared cores. · effort: L
- `mcp-server/src/lib/spec-parse.ts` — shared parsing helpers.
  · effort: M

**Modify:**
- `.opencode/tools/{validate-spec,trace-requirements,sprint-status}.ts`
  — replace with ~30-line `tool()` wrappers importing shared cores.
  · effort: M
- `opencode.json` — add `mcp.forge` entry (Section 3.4); installer
  begins emitting this in Phase 4.

**Tasks:**
1. [ ] Add `@modelcontextprotocol/sdk` to `mcp-server/package.json`.
2. [ ] Implement `mcp-server/index.ts` with `tools/list` + `tools/call`
   handlers.
3. [ ] Move tool logic verbatim into shared cores; expose pure
   `validateSpec(args) → Promise<...>` style functions.
4. [ ] **Fix the two validator bugs** (spec Section 13.0 lines 187 and
   266) during extraction. Add unit tests covering both.
5. [ ] Verify MCP server runs end-to-end against an OpenCode client
   (manual smoke test).
6. [ ] Update `.opencode/tools/*.ts` to wrap shared cores. Regression
   suite must still pass — outputs are byte-identical.

**Exit criteria:** `bun run mcp-server/index.ts` accepts MCP requests
and returns identical output to the legacy OpenCode tools; legacy
OpenCode tools still pass regression; bundle size of the OpenCode
`tool()` wrappers shrinks by ~95%.

---

### Phase 4 — Multi-platform projection (Claude Code + Codex CLI)

**Objective:** Wire the Claude Code and Codex CLI adapters. Installer
projects content to `.claude/` and `.codex/` when detected. MCP server
config blocks emitted to all three platform configs. Project
instructions file resolved per FR-008. Subagent dispatch contract
authored and published.

**Create:**
- `installer/platforms/claude-code.ts` — descriptor + `settings.json`
  emitter. · effort: M · deps: Phase 3
- `installer/platforms/codex.ts` — descriptor + `config.toml` emitter
  (subject to OQ-04 resolution). · effort: M
- `docs/meta-development/subagent-contract.md` — normative contract
  (Section 3.3, FR-011, RISK-004). · effort: M
- `docs/meta-development/platform-deviations.md` — initial entries for
  Claude Code and Codex divergences observed. · effort: S
- `docs/meta-development/architecture.md` — cross-platform architecture
  document (renders Section 1.1 diagram + Section 4 component design
  for a maintainer audience). · effort: M
- `.forge-meta/knowledge/adr/ADR-004-subagent-dispatch-contract.md`.
  · effort: M
- `.forge-meta/knowledge/adr/ADR-005-codex-agent-format.md`.
  · effort: M
- `tests/regression/projection-fixtures/{opencode-only,claude-only,codex-only,multi}/`
  — fixture projects used by FR-017 CI gate. · effort: M
- `tests/regression/projection-equivalence.test.ts` — checksum
  equivalence (FR-018). · effort: M

**Modify:**
- `installer/install.ts` — wire detection of `.claude/` and `.codex/`;
  emit per-platform configs; handle the `CLAUDE.md → @AGENTS.md`
  import (FR-008). · effort: M
- `README.md` — multi-platform install table. · effort: S
- `AGENTS.md` — supported runtimes line. · effort: S

**Tasks:**
1. [ ] **Resolve OQ-04** (Codex agent format): hands-on verification of
   Codex CLI native agent loading; decide TOML-native vs `.claude/`
   fallback; author ADR-005 capturing the decision.
2. [ ] **Resolve OQ-08** (subagent dispatch semantics): hands-on
   testing of Claude Code `@-mention` and Codex worker primitives;
   record envelopes; author ADR-004 + subagent-contract.md.
3. [ ] Implement `claude-code.ts` adapter — `PlatformDescriptor`,
   `settings.json` emitter (Section 3.4), hook bindings.
4. [ ] Implement `codex.ts` adapter — `PlatformDescriptor`,
   `config.toml` emitter via `smol-toml`, hook bindings.
5. [ ] Wire FR-008 `CLAUDE.md → @AGENTS.md` import emission.
6. [ ] Implement FR-017 CI check (`install-forge --dry-run --check`
   against fixtures) and FR-018 checksum equivalence test.
7. [ ] Validate end-to-end on a project with all three platforms
   present; verify each `/forge-*` command works on each runtime.
8. [ ] Author initial `platform-deviations.md` entries; PR template
   updated to require additions (FR-019).

**Exit criteria:** a project with `.opencode/`, `.claude/`, `.codex/`
all installed produces functionally equivalent FORGE behavior on each
runtime; CI projection check is green; subagent contract documented
and verified per platform.

---

### Phase 5 — Plugin adapters + cross-platform testing hardening

**Objective:** Project the three OpenCode plugins to Claude Code and
(where supported) Codex CLI via the shared-core pattern. Add
cross-platform integration tests. Finalize observability and error
messaging.

**Create:**
- `.opencode/plugins/shared/<name>-core.ts` for each plugin (3 files).
  · effort: M each · deps: Phase 4
- `.opencode/plugins/shared/<name>.{opencode,claude,codex}.ts` per
  binding (up to 9 files; some omitted for OQ-03 graceful degradation).
  · effort: S each
- Tests for plugin behavior on each platform.

**Modify:**
- `.opencode/plugins/{session-knowledge,pre-commit-gate,spec-watcher}.ts`
  — convert to re-export of `shared/<name>.opencode.ts`. · effort: M
- `installer/platforms/claude-code.ts` — emit `hooks` entries
  referencing the Claude Code binding scripts.
- `installer/platforms/codex.ts` — emit hook entries (where supported
  by Codex).

**Tasks:**
1. [ ] **Resolve OQ-03** (plugin event mapping): for each plugin × each
   platform, confirm the event mapping in Section 4.3 table; document
   the graceful-degradation cases.
2. [ ] Split each plugin into core + 3 bindings.
3. [ ] Hook the bindings into platform configs via the installer.
4. [ ] Add integration tests that simulate a session and assert the
   plugin produces equivalent observable effects on each platform.
5. [ ] Run the full regression + projection + plugin test matrix in
   CI (NFR-009: macOS-x64, macOS-arm64, Linux-x64, Linux-arm64, WSL2).
6. [ ] Verify all FR-016 error messages match the standard format.
7. [ ] Tag and release `FORGE 2.0`.

**Exit criteria:** all FR-001..FR-019 covered by automated tests where
testable, manual checklist items completed for the rest; all NFRs
meet stated targets in CI measurements; release notes drafted.

---

## 9. Testing Strategy

### 9.1 Test layers

| Layer                       | Scope                                                         | Trigger        | Owner   |
| --------------------------- | ------------------------------------------------------------- | -------------- | ------- |
| Unit (installer + MCP core) | Each module's pure functions; type coverage; error paths.    | every PR       | dev     |
| Regression (OpenCode parity) | Pre-refactor snapshots vs post-refactor outputs (NFR-002).  | every PR       | CI      |
| Projection (FR-017)         | `install-forge --dry-run --check` on per-platform fixtures.  | every PR       | CI      |
| Equivalence (FR-018)        | SHA-256 of agent X across all platform projections.          | every PR       | CI      |
| Integration (per-platform)  | End-to-end command invocation on each runtime.               | nightly        | CI      |
| Plugin behavior (per-platform) | Simulated session emits expected side effects.            | nightly        | CI      |
| OS matrix (NFR-009)         | macOS x64+arm64, Linux x64+arm64, WSL2.                      | release branch | CI      |

### 9.2 Unit-test focus

| Component                                    | Test focus                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| `installer/detect.ts`                        | Returns correct `Platform[]` for each of 8 directory presence combinations.     |
| `installer/drift.ts`                         | Classifies unchanged / drift / user-edited correctly given manifest fixtures.   |
| `installer/projection.ts`                    | For a known canonical input, generates the exact expected `InstallPlan`.       |
| `installer/platforms/claude-code.ts` emitter | Generates `settings.json` matching the schema; merges existing user keys.      |
| `installer/platforms/codex.ts` emitter       | Generates `config.toml` matching schema; round-trips through `smol-toml`.       |
| `mcp-server/src/tools/validate-spec.ts`      | Includes regression tests for both bugs at spec line 187 and 266.               |
| `mcp-server/src/tools/trace-requirements.ts` | Resolves spec-id ↔ path; handles missing files; classifies coverage correctly.  |
| `mcp-server/src/tools/sprint-status.ts`      | Aggregates multi-sprint dashboard; migrates old single-file format.             |
| Plugin cores                                 | Decision/lesson extraction logic verified on synthetic message fixtures.        |

### 9.3 Integration scenarios

| Scenario                                                                     | Dependencies                            |
| ---------------------------------------------------------------------------- | --------------------------------------- |
| Fresh install on `.claude/`-only project; invoke `/forge-specify`.           | Claude Code runtime, MCP server.        |
| Fresh install on `.codex/`-only project; invoke a subagent.                  | Codex CLI runtime, MCP server.          |
| Upgrade install on `.opencode/`-only project; verify byte-identical tree.    | OpenCode runtime.                       |
| Multi-platform install; `validate-spec` returns same result on all runtimes. | All three runtimes, MCP server.         |
| MCP server killed mid-session; tool invocation returns FR-016 structured error. | All three runtimes.                  |
| Drift detected → backup created → re-run produces no spurious diffs (NFR-006). | OpenCode runtime.                     |
| `--check` against checked-in fixture matches snapshot (FR-017 CI gate).      | Fixture trees in repo.                  |

### 9.4 Coverage targets

Per constitution Art. 4.1 (80% for custom tools), the MCP server core
SHALL maintain ≥ 80% line coverage. Installer SHALL maintain ≥ 80%
line + ≥ 70% branch coverage given the breadth of edge cases (Section
6 of spec lists 15 scenarios).

---

## 10. Architectural Decisions

### 10.1 Decisions already accepted

| ADR    | Decision                                                                                                  | Status   |
| ------ | --------------------------------------------------------------------------------------------------------- | -------- |
| [ADR-001](../../knowledge/adr/ADR-001-cross-platform-strategy.md) | Single-source-of-truth + per-platform projection; MCP server for tools; constitutional amendment to Art. 1.2. | Accepted |

### 10.2 Decisions proposed by this plan

Six new ADRs are required to close the open questions and unblock
implementation. Each is a single discrete choice with at least one
competing option considered.

| ADR    | Decision needed                                            | Resolves        | Phase  |
| ------ | ---------------------------------------------------------- | --------------- | ------ |
| ADR-002 | Classify `@modelcontextprotocol/sdk` as a plugin-level dep (not core), preserving Art. 2.2 spirit. | Art. 2.2 tension (spec §13.0) | 1      |
| ADR-003 | Tool & plugin extraction pattern: pure-function core in `mcp-server/src/tools/` and `.opencode/plugins/shared/*-core.ts`, with thin per-platform bindings. | RISK-005 (content divergence), single-source enforcement | 1 |
| ADR-004 | Normative subagent dispatch contract (Section 3.3 envelope). | RISK-004, OQ-08 | 4      |
| ADR-005 | Codex CLI agent format — native TOML emission vs `.claude/` fallback. | RISK-009, OQ-04 | 4      |
| ADR-006 | Drift backups live at `.forge/.backups/<ts>/` (gitignored); installer self-heals `.gitignore`. | RISK-007, OQ-07 | 2 |
| ADR-007 | Config-key conflict policy: FORGE-managed keys overwrite, user keys preserved; conflicts produce a warning. | OQ-09          | 2 |

Phase 1 authors ADR-002 and ADR-003 first because they unblock the
extraction work. Phase 2 authors ADR-006 and ADR-007 — they are forced
choices once `installer/drift.ts` and `installer/config.ts` are
written. Phase 4 authors ADR-004 and ADR-005 — these require hands-on
testing on the target platforms.

### 10.3 Decisions deliberately deferred

| Deferred decision                                              | Why deferred                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| OQ-01 (multi-platform install policy)                          | The recommended "install to all detected with `--platform=` override" is the only architecturally-sane default; ADR not required, but the decision MUST be confirmed by the user before Phase 4. |
| OQ-02 (MCP server packaging — bundled vs npm)                  | Bundled in v1 (FORGE 2.0). NPM publish considered for 2.1+. Out of scope for this plan. |
| OQ-10 (version label)                                          | Plan recommends 2.0 (Section 7.5). Final call rests with the owner.          |

---

## 11. Requirement Traceability

Every FR-NNN and NFR-NNN in the spec maps to at least one design
element here. The reverse — every plan element traces back to a
requirement — is enforced by the `/forge-tasks` traceability check.

| Requirement | Plan section(s)                                            | Implementation surface                                                          |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| FR-001      | §1.1, §4.1 (`detect.ts`), §8 Phase 1                       | `installer/detect.ts`                                                            |
| FR-002      | §3.4, §4.1 (`config.ts`), §4.1 platform adapters           | `installer/config.ts`, `installer/platforms/*.ts`                                |
| FR-003      | §3.2, §4.2, §8 Phase 3                                     | `mcp-server/` directory                                                          |
| FR-004      | §4.3, §8 Phase 5                                           | `.opencode/plugins/shared/`                                                      |
| FR-005      | §4.4, §10.2 ADR-005, §8 Phase 4                            | `installer/projection.ts`, `installer/platforms/codex.ts`                        |
| FR-006      | §4.4, §8 Phase 4                                           | `installer/projection.ts`, all platform adapters                                 |
| FR-007      | §4.4, §8 Phase 4                                           | `installer/projection.ts`, all platform adapters                                 |
| FR-008      | §3.4 (Claude Code), §4.4, §4.5, §8 Phase 4                 | `installer/platforms/claude-code.ts` (`CLAUDE.md` emitter)                       |
| FR-009      | §7, §9.1 (regression), §8 Phase 1 baseline                 | `tests/regression/`, manifest synthesis (§2.3)                                   |
| FR-010      | §3.1 CLI, §4.1, §8 Phase 2                                 | `install-forge.ts` shim + `installer/install.ts`                                 |
| FR-011      | §3.3, §10.2 ADR-004, §8 Phase 4                            | `docs/meta-development/subagent-contract.md`, platform adapters                  |
| FR-012      | §3.1, §4.1 (`log.ts`, `install.ts`), §8 Phase 2            | `installer/install.ts` summary emitter                                           |
| FR-013      | §3.1 `--dry-run`, §8 Phase 2                               | `installer/install.ts`                                                           |
| FR-014      | §2.2, §4.1 (`drift.ts`, `backup.ts`), §10.2 ADR-006        | `installer/drift.ts`, `installer/backup.ts`                                      |
| FR-015      | §3.1 exit code 2, §8 Phase 2                               | `installer/install.ts`                                                           |
| FR-016      | §3.2 error envelope, §4.2 OpenCode fallback                | `mcp-server/index.ts`, `.opencode/tools/*.ts` shims                              |
| FR-017      | §9.1, §8 Phase 4                                           | `tests/regression/projection-fixtures/`, CI                                      |
| FR-018      | §9.1, §8 Phase 4                                           | `tests/regression/projection-equivalence.test.ts`                                |
| FR-019      | §8 Phase 4, §10.2 ADR-004/005                              | `docs/meta-development/platform-deviations.md`                                   |
| NFR-001     | §3.1 verbose mode timing instrumentation                   | `installer/install.ts` timer instrumentation                                      |
| NFR-002     | §7, §9.1 regression, §8 Phase 1 baseline                   | `tests/regression/`                                                              |
| NFR-003     | §3.1 (no required flags for happy path)                    | `installer/install.ts` arg parsing default                                       |
| NFR-004     | §4 (entire architecture)                                   | Shared cores; ≤ 20% adapter LOC measured by `cloc`                                |
| NFR-005     | §4.5 `AGENTS.md` import only; §4.4 skill projection        | `installer/platforms/claude-code.ts` (`CLAUDE.md` is `@AGENTS.md`)                |
| NFR-006     | §2.2 manifest, §4.1 (`manifest.ts`), §9.3 idempotency test | `installer/manifest.ts`                                                          |
| NFR-007     | §3.1 `--verbose`, §4.1 `log.ts`                            | `installer/log.ts`                                                               |
| NFR-008     | §3.1 exit code 5; §4.1 (`backup.ts`, `install.ts`)         | All writes scoped to CWD; no privilege escalation                                 |
| NFR-009     | §9.1 OS matrix CI, §8 Phase 5                              | CI workflow                                                                       |

---

## 12. Constitution Compliance

> Checked using `constitution-compliance` skill methodology. The FORGE
> meta-constitution has 5 articles; Articles 6-9 in the template are
> N/A for this project.

| Article | Title                  | Status        | Notes                                                                                                                                                                                                          |
| ------- | ---------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Art. 1  | Core Principles        | **COMPLIANT** | Art. 1.2 was amended on 2026-06-21 (per amendments log) to replace "OpenCode-native" with "Multi-platform". All five 1.2 sub-principles upheld: Multi-platform (this is the goal); Agent-first (subagent contract preserved in §3.3); Constitution-as-law (this plan defers to ADRs and the constitution at every fork); Document precision (machine-parseable types in §2.1, schemas in §3.2-3.4); Zero breaking changes without migration (§7). Art. 1.3 UX (< 30s, actionable errors, embedded docs) is upheld by NFR-001 / FR-012 / FR-016. |
| Art. 2  | Technology Stack       | **COMPLIANT with classified tension** | 2.1: Node 20+, TS 5+, Bun/NPM, Markdown all preserved. **2.2 tension:** the MCP server introduces `@modelcontextprotocol/sdk` as a runtime dependency. ADR-002 (proposed §10.2) classifies it as a plugin-level dependency — the MCP server is a separate out-of-process binary, not loaded into FORGE core. The "Zero runtime dependencies for core framework" wording is preserved literally because the new dep is in `mcp-server/package.json`, not in repo-root runtime deps. **2.3 distribution policy strengthened:** `installer/`, `mcp-server/`, `tests/regression/`, `docs/meta-development/` are added to the do-not-distribute set (already explicitly enumerated in §5.3). |
| Art. 3  | Architecture Patterns  | **COMPLIANT** | 3.1 file-based orchestration preserved on all 3 platforms (each platform's native layout is also file-based). 3.2 code organization: new `installer/` and `mcp-server/` directories are additive and respect the "not distributed" boundary. Per the amended Art. 3.1, MCP server lives in repo root for cross-platform reach — matches plan §4.2. |
| Art. 4  | Quality Standards      | **COMPLIANT** | 4.1: 80% coverage explicit target in §9.4 for the MCP server and installer. 4.2: token budgets preserved — `CLAUDE.md` is `@AGENTS.md` import (no content duplication, satisfies NFR-005 / RISK-010); agent files are byte-identical across projections. 4.3: meta-dev directories explicitly excluded from distribution (§5.3). |
| Art. 5  | Naming & Conventions   | **COMPLIANT** | Agent files keep `forge-[role].md`. Command files keep `forge-[action].md`. Skill dirs keep `[name]/SKILL.md`. Plugin extraction uses `<name>-core.ts` + `<name>.<platform>.ts` convention — additive, not in conflict with 5.1. |

### 12.1 Tension log

| Tension                                | Resolution                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Art. 2.2 vs new MCP-SDK dep            | ADR-002 (proposed) — classify as plugin-level, document pinning, keep MCP-server package isolated from core.        |

No silent violations.

---

## 13. UX & Output Format

CLI output during install follows §9 of the spec. Concrete examples:

**Happy path (dry-run):**

```
[forge-install] Detected platforms: opencode, claude-code

[PLAN] opencode
  [SKIP] 24 commands (unchanged)
  [SKIP]  9 agents (unchanged)
  [SKIP] 12 skills (unchanged)
  [UPD ] opencode.json (add mcp.forge entry)

[PLAN] claude-code
  [NEW ] .claude/agents/  (9 files)
  [NEW ] .claude/commands/ (24 files)
  [NEW ] .claude/skills/  (12 dirs)
  [NEW ] .claude/settings.json
  [NEW ] CLAUDE.md (1 line: @AGENTS.md)

[INFO] No write performed (--dry-run). Run without --dry-run to apply.
[INFO] Wall-clock: 1.4s
```

**Error (no platforms detected, FR-015):**

```
[ERR ] No supported platform directory found.
        Looked for: .opencode/, .claude/, .codex/
        Suggested fix: create one of these directories or initialize your IDE
                       (e.g., `mkdir .claude` for Claude Code).
[exit 2]
```

**Error (MCP server unreachable, FR-016):**

```
[forge-mcp-server] Tool 'validate-spec' failed: MCP server is not running.
Expected MCP server at: bun run mcp-server/index.ts
Suggested remediation: start the MCP server with `bun run mcp-server` from the project root.
```

---

## 14. Open Questions Carried to `/forge-tasks`

The following open questions from the spec are **architecturally
constrained** by this plan but require explicit owner confirmation
before Phase 4 begins. They are surfaced here so the scrum master and
human owner can resolve them in the tasks phase.

| OQ     | Plan recommendation                                                                                                | Phase to confirm |
| ------ | ------------------------------------------------------------------------------------------------------------------ | ---------------- |
| OQ-01  | Install to all detected platforms with `--platform=<id>` override available. (Plan §3.1 default.)                  | Phase 2          |
| OQ-02  | Bundle MCP server in repo for FORGE 2.0; defer npm-publish to 2.1+. (Plan §10.3 deferred.)                          | Phase 3          |
| OQ-03  | Map plugins to platform events per §4.3 table. Where no equivalent exists, omit binding (graceful degradation).    | Phase 5          |
| OQ-04  | Generate `.codex/agents/*.toml` natively (RISK-009 mitigation). Pre-confirmation: research the Codex agent format. | Phase 4          |
| OQ-05  | `CLAUDE.md` = 1-line `@AGENTS.md` import. (Resolved by spec FR-008.)                                                | Already resolved |
| OQ-06  | Amendment merged 2026-06-21. (Resolved.)                                                                            | Already resolved |
| OQ-07  | Backups at `.forge/.backups/<ts>/`; installer self-heals `.gitignore`. (Plan §2.2 + ADR-006.)                       | Phase 2          |
| OQ-08  | Subagent contract per §3.3 envelope. (Plan §10.2 ADR-004.)                                                          | Phase 4          |
| OQ-09  | FORGE-managed keys overwrite; user keys preserved; conflicts warn. (Plan §10.2 ADR-007.)                            | Phase 2          |
| OQ-10  | FORGE 2.0 version label. (Plan §7.5.)                                                                               | Phase 5 release  |

Two questions remain genuinely open and require user input before
their phase begins: **OQ-04** (needs Codex docs verification) and
**OQ-08** (needs hands-on platform testing). Both are Phase 4 entries.

---

## Cross-References

| Document                   | Path                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Spec                       | [`./spec.md`](./spec.md)                                                            |
| Constitution               | [`../../constitution.md`](../../constitution.md)                                    |
| ADR-001 (accepted)         | [`../../knowledge/adr/ADR-001-cross-platform-strategy.md`](../../knowledge/adr/ADR-001-cross-platform-strategy.md) |
| ADR-002..007 (proposed)    | `../../knowledge/adr/` (to be authored per Phase 1, 2, 4)                            |
| Architecture (cross-platform) | `docs/meta-development/architecture.md` (to be created in Phase 4)               |
| Subagent contract          | `docs/meta-development/subagent-contract.md` (to be created in Phase 4)              |
| Platform deviation log     | `docs/meta-development/platform-deviations.md` (to be created in Phase 4)            |
| Tasks                      | `<!-- to be created by /forge-tasks -->`                                              |
| Regression baseline        | `tests/regression/baseline/` (to be captured in Phase 1 — **first task**)            |
