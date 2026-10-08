# ADR-005: Reconfiguration surface — slash command + shared `installer/model-config.ts` lib (no skill)

## Status

**Accepted** · 2026-10-06 (accepted 2026-10-08) · Spec 011-model-configure
· Reviewer: `.forge/specs/011-model-configure/analysis.md`

## Context

`/forge-model-configure` has two separable parts: (a) the **invocation
surface** and (b) the **testable logic** (preset resolution, policy→tier map,
merge/backup/idempotency, cost hint, privacy gate). The spec leaves the logic
home as an explicit architect decision (§12: "Skill or lib —
`installer/model-config.ts` if skill rejected in plan"). Options:

**Surface:**
- **S1. Slash command** (`.opencode/commands/forge-model-configure.md`) that
  drives the shared lib — consistent with every other FORGE workflow entry.
- **S2. Installer flag only** (`install-forge.ts --reconfigure`) — already
  mentioned in the template comment but currently unwired.

**Logic home:**
- **L1. `installer/model-config.ts`** — a TypeScript module next to
  `config.ts`/`projection.ts`, unit-testable under the existing Vitest scope
  (`installer/**`).
- **L2. A skill** (`.opencode/skills/model-routing/SKILL.md`) — prose
  instructions the agent executes.

## Decision

**Surface = S1 + keep S2 as an alias.** Ship the command
`.opencode/commands/forge-model-configure.md` as the primary entry (mirrors
`forge-quick.md`: frontmatter `agent: forge`, Arguments, Process, exit-code
reporting). Keep `install-forge.ts --reconfigure` working as a thin alias that
calls the same lib, and update the template comment to point at the command
(spec §12 modified components).

**Logic home = L1 (`installer/model-config.ts`), skill rejected.** The
operation is deterministic file I/O (JSON parse, key-scoped merge, timestamped
backup, byte-identical snapshot) with hard exit-code and idempotency contracts
(FR-002, FR-004, FR-005, FR-007, FR-008; NFR-003, NFR-004). That is exactly
what a unit-testable module guarantees and a prose skill cannot: a skill would
make determinism and "zero silent overwrite" unverifiable and non-reproducible.
`installer/**` is already inside the coverage gate, so the logic inherits the
85/78/80 thresholds for free.

The command file stays thin: parse args → call `installer/model-config.ts` →
render output blocks. All branching logic (policy matrix, gates, merge) lives
in the lib.

**Managed-key ownership (two-list contract, B-1).** `installer/model-config.ts`
declares and owns its own managed set,
`MODEL_MANAGED_KEYS = ["model","providers","agents"]`. This is **deliberately
distinct** from the installer's `FORGE_MANAGED_KEYS`
(`["$schema","default_agent","instructions","agents","mcp","subagent_depth"]`,
`installer/platforms/opencode.ts:52-59`) — not a reuse or alias. The two lists
serve different lifecycles: `FORGE_MANAGED_KEYS` governs install/update seed-once
generation (where `model` is seed-once, never rewritten), while
`MODEL_MANAGED_KEYS` governs a user-invoked rewrite (where `model` **is**
rewritten on every differing apply). Their only intersection is `agents`
(installer regenerates the agent block structurally; reconfigure rewrites only
the per-agent `model` field). A unit test asserts this relationship so the two
cannot drift silently (plan §2.5, §8.1). Consequently `mergeManagedKeys` MUST
NOT route through `generateOpenCodeConfig`'s seed-once path, or `model` rewrites
would silently no-op (plan §4.1a).

Rejected: **L2 (skill)** — violates the determinism/snapshot NFRs and sits
outside the coverage gate. **S2-only** — no `--list`/`--dry-run`/`--policy`
discoverability as a FORGE workflow, inconsistent with the command-per-workflow
pattern.

## Consequences

- **Positive:** deterministic, unit + snapshot tested; reuses
  `stripJsonComments`/`readExistingJsonConfig` from `config.ts`; one logic home,
  two thin front doors (command + `--reconfigure`).
- **Negative:** command and installer flag must stay in sync — mitigated by both
  delegating to the single lib (no duplicated logic).
- **Neutral:** the command file is distributed via the normal command
  projection; the lib is installer-internal (runs from the FORGE source / the
  `install-forge.ts` entry), not projected into `.forge/`.

## Constitution Alignment

- **Art. 4 (Quality Standards):** testability is the deciding factor; logic
  lands inside the enforced coverage scope.
- **Art. 3 (Architecture Patterns):** installer stays the owner of generated
  config; no new runtime surface.
- **Art. 5 (Naming & Conventions):** kebab-case command + file, camelCase
  functions, English-only strings.
- Supports FR-002/004/005/007/008; NFR-003/004.
