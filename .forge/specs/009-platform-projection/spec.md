# Tech Spec 009 — Real Platform Projection (Phase 3C)

| Field | Value |
|---|---|
| **ID** | 009-platform-projection |
| **Track** | Feature |
| **Status** | Implemented |
| **Created** | 2026-09-17 |
| **Upstream** | 2026-09 audit; issues #70, #71; spec 001 FR-005/FR-006/OQ-04 |

---

## Problem

The installer byte-copies OpenCode artifacts onto Claude Code and Codex,
where their frontmatter is meaningless:

- Claude agents require `name:` and use `tools:` — ours carry `mode:`,
  `variant:` and `permission:` and **no `name:`**. Malformed or ignored.
- Claude commands have no `agent:`/`subtask:` routing — the entire
  subagent-orchestration premise collapses onto the main agent.
- Codex skills land in `.codex/.agents/skills/` instead of the
  descriptor's own `.agents/skills/` (the join defeats the mapping).
- `generateCodexAgentToml()` exists per FR-005/OQ-04 and is never called —
  Codex gets raw OpenCode Markdown instead of native TOML.

## Decisions

### D-1 — Translate, don't copy: a projection engine with a denylist

New `installer/frontmatter.ts` parses the `---` block (top-level scalar
keys; nested blocks detected by indentation). Projection drops
platform-wrong keys and keeps everything else byte-identical, so unknown
future keys pass through instead of being silently eaten:

| Artifact | Drop on Claude | Add on Claude | Drop on Codex |
|---|---|---|---|
| Agents | `mode`, `variant`, `permission` | `name:` (from filename), `tools:` (mapped allowlist, see D-2) | frontmatter entirely on the `.md` companion (it is a system prompt, not config) |
| Commands | `agent`, `subtask` | routing step (see D-3) | `agent`, `subtask` + informational note (see D-4) |
| Skills | `compatibility` (value `opencode` is false elsewhere) | — | `compatibility` |

### D-2 — Tool allowlists are mapped mechanically, restrictions disclosed

`read→Read, glob→Glob, grep→Grep, edit→Edit, write→Write, bash→Bash,
webfetch→WebFetch, task→Task, skill→Skill, todowrite/todoread→TodoWrite,
question→AskUserQuestion`. Bash command-filters and `"*": deny` (qa,
reviewer, peer) cannot be expressed in frontmatter — each such file gets a
`# NOTE` comment naming the dropped restrictions with guidance to re-apply
them in `settings.json`. Emitting the mapped list is strictly closer to
intent than omitting `tools:` (which would grant Edit/Write to reviewers
that explicitly lack them).

### D-3 — Command routing survives on Claude as a Task step

OpenCode's `agent: X` + `subtask: true` means "run in X as a subtask". The
faithful Claude translation is a Task-tool invocation of the installed
subagent — injected once, right after the title heading:

> **Execution:** Run this command via the Task tool using the `forge-pm`
> subagent (installed in `.claude/agents/`).

### D-4 — Codex commands are stripped, not rerouted

Codex has no verified subtask mechanism; inventing one is worse than
losing the routing. `agent:`/`subtask:` are dropped and a neutral note
records the design intent (`This command was designed to run in the
forge-pm subagent; on this platform it runs inline.`). Command directory
stays `.codex/commands/` per normative spec 001 FR-006 — the audit's
`prompts/` claim was unverified speculation and is refuted.

### D-5 — Codex agents ship as TOML + clean Markdown companion

Per FR-005/OQ-04 (avoid the `.claude/agents/` fallback): each agent emits
`.codex/agents/<name>.toml` (`name`, `description` from frontmatter,
`system_prompt` path to the companion) plus `.codex/agents/<name>.md`
(body verbatim, frontmatter stripped). `$ARGUMENTS` is kept everywhere:
rewriting it to unverified Codex syntax would trade a maybe for a
certainly.

### D-6 — Project-root escape for Codex skills

A projected path starting with `/` joins against the project root instead
of the platform root. `.agents/skills/...` lands at `.agents/skills/...`,
matching `CODEX_DESCRIPTOR.skillsDir`. Manifest, drift and backup already
key on absolute paths and need no change.

### Explicitly out of scope (follow-up #87)

Claude hooks wiring (would need the plugins rewritten against another
API), per-agent `model:` tiers, `$ARGUMENTS`-on-Codex verification, and
live verification on both platforms. Emitting any of these unverified
would be worse than documenting the gap.

---

## Tasks

- [x] T-001 `[M]` `installer/frontmatter.ts`: parse/drop/serialize + tool map; unit tests
- [x] T-002 `[M]` Claude projection (agents/commands/skills) wired into `buildInstallPlan`
- [x] T-003 `[M]` Codex projection (skills root-escape, agent TOML+MD, command strip) + `generateCodexAgentToml` actually called
- [x] T-004 `[S]` Fix the two `.opencode/` hard references (forge-ux pointer, archive-decisions skill path)
- [x] T-005 `[M]` Contract tests: `name:` present, no OpenCode keys, TOML exists, skills at project root
- [x] T-006 `[S]` INSTALL.md/README.md reflect the fixed state; open #87 for residuals
- [ ] T-007 `[S]` Full verification; adversarial review; resolve CRITICAL findings

## Acceptance Criteria

- [x] AC-1 — Every installed Claude agent has `name:` + `description:`, no `mode:`/`variant:`/`permission:`
- [x] AC-2 — Every installed Claude command routes to its subagent via an explicit Task step
- [x] AC-3 — Codex skills land at `.agents/skills/`, never under `.codex/`
- [x] AC-4 — Every Codex agent has a native `.toml` next to a frontmatter-free `.md`
- [x] AC-5 — OpenCode projection remains byte-identical (contract test asserts file equality)
- [x] AC-6 — `npm test` green (276 tests); `tsc` clean; coverage gate holds (88.7% lines)
