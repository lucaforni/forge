# FORGE Project Constitution

> This document defines the non-negotiable principles, standards, and
> constraints for **the FORGE project itself** (meta-development).
> This is NOT the template - this is FORGE's own constitution.
>
> **This document is immutable.** Changes are made only through the formal
> amendment process documented at the bottom.

---

## Article 1: Core Principles

### 1.1 Mission
FORGE is a methodology framework for AI-assisted software development that provides:
- Structured workflows with 5 complexity tracks (Hotfix, Quick, Feature, Epic, Product)
- Governance through constitution and knowledge base
- Orchestrated subagents with specialized roles
- Bidirectional traceability from requirements to code

### 1.2 Non-Negotiable Principles
- **Multi-platform**: FORGE runs natively on OpenCode, Claude Code, and Codex CLI — canonical artifacts are platform-agnostic markup projected to each runtime's native layout
- **Agent-first design**: All workflows route through specialized subagents
- **Constitution as law**: All decisions must comply with project constitution
- **Document precision**: All specs must be machine-parseable for future automation
- **Zero breaking changes without migration**: Users must never lose data during updates

### 1.3 User Experience Standards
- All slash commands must complete in < 30 seconds for typical use cases
- Error messages must be actionable
- Documentation must be embedded in the project root for offline access

---

## Article 2: Technology Stack

### 2.1 Approved Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Runtime | Node.js | 20+ | Required by all target platforms |
| Language | TypeScript | 5+ | Type safety for tools |
| Packaging | Bun/NPM | Latest | Fast installs |
| Documentation | Markdown | CommonMark | Universal format |

> **Note (2026-09-17):** the root workspace currently pins TypeScript `^7`
> while `mcp-server/` pins `^5`. Both satisfy "5+", but the split toolchain
> is technical debt — see issue #74.

### 2.2 Dependency Policy
- **The installer layer (`installer/`, `install-forge.ts`) MUST have zero
  runtime dependencies** — Node builtins only. This is the part users
  execute before anything is installed, so it must never require a fetch.
- **Distributed runtime components MAY declare runtime dependencies**, but
  each one requires an explicit justification and a committed lockfile.
  Current approved set:

  | Component | Dependency | Justification |
  |---|---|---|
  | `mcp-server/` | `@modelcontextprotocol/sdk` | Protocol implementation; no viable builtin |
  | `mcp-server/` | `tsx` | Sources ship untranspiled; removable by adding a build step |
  | `.opencode/` | `@opencode-ai/plugin` | Platform SDK for tools and plugins |

- Anything not in the table above goes in `devDependencies`.
- Every component that declares runtime dependencies MUST commit a lockfile
  and be registered in `.github/dependabot.yml`.

### 2.3 Distribution Policy
**NEVER distribute these to user projects:**
- `.opencode-meta/` — Meta-development agent versions
- `.forge-meta/` — FORGE's own constitution and specs
- `docs/meta-development/` — FORGE development documentation
- `opencode.json` from FORGE repo (has meta agent config)

---

## Article 3: Architecture Patterns

### 3.1 System Architecture
File-based orchestration framework with platform-projection:
- Agent definitions in platform agents dir (e.g., `.opencode/agents/`, `.claude/agents/`)
- Commands in platform commands dir (e.g., `.opencode/commands/`, `.claude/commands/`)
- Skills in platform skills dir (e.g., `.opencode/skills/`, `.claude/skills/`)
- User artifacts in `.forge/`
- Shared MCP server in repo root for cross-platform custom tools

### 3.2 Code Organization
```
forge/
├── .opencode/              # Framework (DISTRIBUTED)
├── .opencode-meta/         # Meta-dev (NOT distributed)
├── .forge-meta/            # FORGE governance (NOT distributed)
└── docs/meta-development/  # Dev docs (NOT distributed)
```

---

## Article 4: Quality Standards

### 4.1 Test Coverage

Coverage is defined over `installer/**` and `mcp-server/src/**` (the
`include` scope in `vitest.config.ts`).

| Milestone | Line | Branch | Function | Status |
|---|--:|--:|--:|---|
| **Enforced gate** | 85% | 78% | 82% | `vitest.config.ts` + `coverage` job in CI |
| **Measured 2026-09-17** | 91.2% | 84.6% | 87.6% | `npm run test:coverage` |

Rules:
- The threshold in `vitest.config.ts` MUST match the gate actually run in
  CI. A declared-but-unenforced threshold is a constitutional violation in
  itself.
- The gate sits below the current measurement so an ordinary refactor does
  not break the build, and above it enough that coverage cannot silently
  decay. Raise it when the measurement moves up durably; never lower it
  without an amendment entry.
- `.opencode/tools/` and `.opencode/plugins/` are **out of scope** until
  they are either distributed or removed (#68).
- `frontend/**/__tests__/` ships to user projects as reference tests for the
  pattern templates. It exercises a React stack this repository does not
  contain and is out of scope by design, not by neglect.
- Manual testing for all slash commands.

### 4.2 Performance Targets
- **Agent effective context** < 5000 tokens — measured as the agent file
  **plus every skill it declares as mandatory**, not the file alone
- Skills < 3000 tokens each
- Total context per session < 50k tokens

### 4.3 Technical Debt
- **Meta-development instructions MUST NOT leak into distributed files**
- Regular token usage audits

### 4.4 Enforceability

**Every article that can be checked mechanically MUST have a corresponding
CI check.** An article without a check is a statement of intent, not a rule,
and MUST be labelled as such.

| Article | Check | Status |
|---|---|---|
| 2.2 | `npm ci` in `mcp-server/` — proves the lockfile exists and resolves | ✅ `test` job |
| 4.1 | `npm run test:coverage` | ✅ `coverage` job |
| — | typecheck: `tsc --noEmit` across installer, mcp-server and tests | ✅ `test` job |
| — | installer contract test: everything referenced by an artifact is installed | ✅ `tests/unit/contract.test.ts` |
| — | shell lint on the scripts users execute | ✅ `shell` job |
| 2.3, 4.3 | grep for `../.opencode` and `<!-- CUSTOMIZE` in distributed files | ⚠️ partial — the contract test covers `../.opencode` only |
| 4.2 | token budget script | ❌ not implemented (#73) |
| 5.2 | language check on distributed artifacts | ❌ not implemented (#62) |

An article whose row is ❌ is a statement of intent, not an enforced rule,
and must be described as such wherever it is cited.

---

## Article 5: Naming & Conventions

### 5.1 File Naming
- Agents: `forge-[role].md`
- Commands: `forge-[action].md`
- Skills: `.opencode/skills/[name]/SKILL.md` (or platform equivalent)

### 5.2 Language
- **All distributed and public-facing artifacts MUST be in English** —
  agents, commands, skills, templates, code templates, `README`,
  `SECURITY.md`, GitHub issue/PR templates, and any user-visible string.
- Internal `.forge/` working artifacts may use any language, but English is
  preferred for consistency.

**Known open violations** (grandfathered, tracked in #62 — no new ones
are permitted):

| Artifact | Status |
|---|---|
| `frontend/patterns/templates/*.tsx` | Italian UI strings and JSDoc remain |
| `.opencode/docs/automatic-monitoring-setup.md` | Fully Italian; also slated to move out of the distributed docs dir |
| `.forge/knowledge/decision-log.md`, `.forge/specs/003-harness-tests/` | Internal artifacts — permitted by the rule above |

A CI check for this article is required by Art. 4.4 and is not yet
implemented.

---

## Amendments Log

| Date | Article | Change | Rationale | ADR Ref |
|------|---------|--------|-----------|---------|
| 2026-02-16 | 2.3, 4.3 | Added distribution exclusions | Prevent meta-dev overhead | N/A |
| 2026-06-21 | 1.2, 1.3, 2.1, 3.1, 5.1 | Cross-platform amendment: replaced "OpenCode-native" with "Multi-platform", broadened architecture to platform-projection model | Port FORGE to Claude Code and Codex CLI | ADR-001 |
| 2026-09-17 | 2.2 | Replaced the blanket "zero runtime dependencies" with a scoped rule: zero for the installer layer, explicitly justified and lockfiled for distributed runtime components | The blanket claim was false — `mcp-server/` carries 2 runtime deps and `.opencode/` carries 1. A constitution that asserts falsehoods produces wrong compliance verdicts. | Audit #74 |
| 2026-09-17 | 4.1 | Replaced the unenforced flat "80% coverage" with a staged baseline → gate → target, tied to what CI actually runs | The 80% gate had never been measured (provider missing) and was unreachable (51% of scope untested) | Audit #61, #74 |
| 2026-09-17 | 4.2 | Agent budget redefined as effective context (agent file + mandatory skills) | The file-size metric was trivially satisfied by moving instructions into skills; `forge-ux` loads ~9.6k effective tokens | Audit #73 |
| 2026-09-17 | 4.4 | **New** — every mechanically checkable article requires a CI check | Unenforced articles had silently drifted from reality for 7 months | Audit #74 |
| 2026-09-17 | 5.2 | **New** — English required for all distributed and public-facing artifacts | `SECURITY.md`, GitHub templates, a distributed skill and 3 code templates had drifted to Italian | Audit #62 |
| 2026-09-17 | 4.1 | Replaced the unmeasured baseline with an enforced gate (85/78/82) and the first real measurement (91.2/84.6/87.6) | Coverage became measurable once `@vitest/coverage-v8` was installed and the MCP tools were tested; the staged plan is superseded by an actual gate | Phase 2, #61 |
| 2026-09-17 | 4.4 | Marked each check as enforced or not, per CI reality | Four of the eight checks are now wired into `ci.yml`; the remaining four must be labelled as intent | Phase 2, #60 |
