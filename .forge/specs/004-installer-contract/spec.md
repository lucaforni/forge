# Spec 004 — Installer Contract Completeness

| Field | Value |
|---|---|
| **ID** | 004-installer-contract |
| **Track** | Feature |
| **Status** | In Progress |
| **Created** | 2026-09-17 |
| **Upstream** | 2026-09 project audit; issues #56, #57 |
| **Constitution** | `.forge-meta/constitution.md` (5 articles) |

---

## Problem

The installer projects three directories:

```ts
// installer/projection.ts:38
const CANONICAL_DIRS = ["agents", "commands", "skills"] as const
```

Its documentation and its own agents assume seven. The gap breaks FORGE in
two structural ways:

1. **12 of 24 commands reference `.opencode/templates/…`**, which is never
   installed. On Claude Code and Codex the path is doubly wrong — those
   projects have no `.opencode/` at all.
2. **The generated `opencode.json` omits `instructions`**, so
   `.forge/constitution.md` never enters model context. FORGE's governance
   pillar does not engage in any user project. `.forge/constitution.md` is
   not created either.

## Goal

A fresh install must produce **every path that any shipped agent, command or
skill references**, and that invariant must be enforced by a test rather than
by documentation.

## Non-Goals

- Fixing the Claude Code / Codex frontmatter projection (#70, #71)
- Consolidating the duplicated tools (#68)
- Adding CI quality gates (#60, #61) — Phase 2

---

## Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| **FR-001** | Document templates install to `.forge/templates/` — platform-neutral, identical on all three platforms | Contract test asserts all 20 templates present |
| **FR-002** | Every agent/command/skill reference to `.opencode/templates/` is rewritten to `.forge/templates/` | Grep test: zero `.opencode/templates` refs in distributed files |
| **FR-003** | Methodology docs install to `.forge/docs/`; meta-development docs are excluded | Contract test asserts user docs present, internal reports absent |
| **FR-004** | OpenCode plugins install to `.opencode/plugins/` with a `package.json` declaring `@opencode-ai/plugin` | Contract test asserts 3 plugins + manifest |
| **FR-005** | `.forge/` is scaffolded: `constitution.md`, `specs/`, `knowledge/adr/`, `epics/`, `sprints/{active,completed,retrospectives}/`, `product/` | Contract test asserts directory tree |
| **FR-006** | `AGENTS.md` is created at project root when absent | Contract test |
| **FR-007** | User-owned files (`constitution.md`, `AGENTS.md`) are **created once, never overwritten** on update | Idempotency test: modify, reinstall, assert unchanged |
| **FR-008** | Generated `opencode.json` includes `instructions`, `permission`, `model`, `provider`, `agent`, `mcp` | Unit test on `generateOpenCodeConfig` |
| **FR-009** | An existing `opencode.json` is **merged**, not clobbered: unknown user keys are preserved, FORGE-managed keys win | Unit test with a user config containing custom keys |
| **FR-010** | Before overwriting any pre-existing config, a backup is written under `.forge/.backups/<timestamp>/` | Contract test |
| **FR-011** | `forge-reviewer-peer` receives a different-family model so dual-model review is genuinely diverse (#66) | Unit test on generated config |
| **FR-012** | A contract test asserts that **every path referenced by a distributed artifact exists after install** | The test itself |

## Non-Functional Requirements

| ID | Requirement | Metric |
|---|---|---|
| **NFR-001** | Installer remains dependency-free (constitution Art. 2.2) | No new imports outside `node:*` |
| **NFR-002** | Install of the full catalogue completes in < 10s excluding `npm install` | Measured in contract test |
| **NFR-003** | Install is idempotent — a second run produces zero writes | Manifest checksum equality |
| **NFR-004** | `tsc --noEmit` does not regress | Error count ≤ current baseline (20) |

---

## Design Decisions

### D-1 — Templates and docs go to `.forge/`, not per-platform

`.forge/` is the platform-neutral user data directory. Placing templates
there means one path works identically on OpenCode, Claude Code and Codex,
and the 12 broken commands are fixed for all three platforms at once.

The alternative — `.opencode/templates/` plus `.claude/templates/` plus
`.codex/templates/` — triplicates content and leaves the hardcoded
`.opencode/` path wrong on two platforms out of three.

### D-2 — `tools/` is deliberately NOT distributed

`.opencode/tools/` duplicates `mcp-server/src/tools/` with **divergent
algorithms** (#68): the two `validate-spec` implementations return different
scores for the same input, and the HTML-comment security fix exists in only
one copy. Constitution Art. 3.1 designates the shared MCP server as the
cross-platform tool surface, and it is already installed.

Shipping both would distribute a known-inconsistent pair. Deferred to #68,
which must consolidate to one implementation first.

### D-3 — Plugins are OpenCode-only

The three plugins import `@opencode-ai/plugin`. They are projected only to
the OpenCode platform, together with a minimal `.opencode/package.json`.
Claude Code hooks are a separate projection problem (#71).

### D-4 — `user-template` category is reused for scaffolding

`projection.ts` already has a `user-template` category meaning *create once,
never overwrite*. `constitution.md` and `AGENTS.md` use it, so FR-007 needs
no new mechanism.

---

## Edge Cases

| # | Case | Expected |
|---|---|---|
| E-1 | Target already has `opencode.json` with custom `model` and unknown keys | Merged; unknown keys preserved; backup written |
| E-2 | Target already has `AGENTS.md` | Left untouched |
| E-3 | Target already has `.forge/constitution.md`, edited | Left untouched |
| E-4 | Target has `.forge/` but no platform dir | Still exits 2 — unchanged behaviour |
| E-5 | Second install with no source change | Zero writes; all ops `skip` |
| E-6 | `opencode.json` exists but is malformed JSON | Backup, warn, replace with generated config |
| E-7 | Claude Code / Codex only | `.forge/templates/` + `.forge/docs/` still installed; plugins skipped |
| E-8 | Template directory missing from source | Install proceeds; contract test fails loudly in CI |

---

## Acceptance Criteria

- [ ] AC-1 — Fresh install into an empty `.opencode/` project yields every path referenced by any distributed artifact
- [ ] AC-2 — Zero `.opencode/templates` references remain in `.opencode/{agents,commands,skills}/`
- [ ] AC-3 — Generated `opencode.json` loads the constitution via `instructions`
- [ ] AC-4 — Re-running the installer preserves a modified `constitution.md`, `AGENTS.md` and `opencode.json`
- [ ] AC-5 — Contract test fails if a new artifact references an uninstalled path
- [ ] AC-6 — `npm test` green; `tsc` error count does not increase
- [ ] AC-7 — Adversarial review passes with CRITICAL findings resolved
