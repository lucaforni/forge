# Project Rules

> This file is automatically loaded by OpenCode. It defines project-wide
> conventions, standards, and references that all agents must follow.

---

## Project Overview

This repository **is** FORGE — the Framework for Orchestrated Requirements,
Governance & Engineering. It is a methodology framework for AI-assisted
software development, distributed to user projects by an installer.

Because this is meta-development, two rule sets apply:

| Scope | Governed by |
|---|---|
| This repository | [`.forge-meta/constitution.md`](.forge-meta/constitution.md) |
| Projects installed *with* FORGE | `.opencode/templates/constitution.md` |

> **Distribution boundary.** `.opencode-meta/`, `.forge-meta/`,
> `docs/meta-development/` and this repo's `opencode.json` are **never**
> distributed to user projects (constitution Art. 2.3).

---

## Technology Stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Runtime | Node.js | 20+ | CI matrix: 20 / 22 / 24 |
| Language | TypeScript | `^7` (root), `^5` (`mcp-server/`) | Strict mode. Split toolchain is known debt (#74) |
| Execution | tsx | `^4` | Sources ship untranspiled; no build step |
| Testing | Vitest | `^5` | `vitest.config.ts` (unit) + `vitest.smoke.config.ts` (level-3) |
| Protocol | `@modelcontextprotocol/sdk` | `^1` | Runtime dep of `mcp-server/` only |
| Documentation | Markdown | CommonMark | The framework itself is Markdown |
| Linter | — | — | **Not configured.** Do not assume ESLint exists |
| Formatter | — | — | **Not configured.** Do not assume Prettier exists |

There is no framework, ORM or database — FORGE is a file-based
orchestration framework.

---

## Code Conventions

### Naming

- **Files**: kebab-case (`user-service.ts`, `auth-middleware.ts`)
- **Classes**: PascalCase (`UserService`, `AuthMiddleware`)
- **Functions/methods**: camelCase (`getUserById`, `validateToken`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Types/Interfaces**: PascalCase, no `I` prefix (`User`, `AuthConfig`)
- **Enums**: PascalCase with PascalCase members (`UserRole.Admin`)

### File Structure

```
forge/
├── .opencode/              # The framework — DISTRIBUTED
│   ├── agents/             #   9 subagent definitions
│   ├── commands/           #   24 slash commands
│   ├── skills/             #   13 reusable skills
│   ├── templates/          #   Document templates
│   ├── tools/              #   OpenCode-native tools (not yet distributed, #56)
│   └── plugins/            #   Event hooks (not yet distributed, #56)
├── .opencode-meta/         # Meta-dev agent overrides — NOT distributed
├── .forge-meta/            # FORGE's own governance — NOT distributed
├── .forge/                 # FORGE's own dogfooding artifacts
├── docs/meta-development/  # Dev docs — NOT distributed
├── installer/              # Cross-platform install pipeline (zero runtime deps)
├── mcp-server/             # Shared MCP tools — DISTRIBUTED to .forge/mcp-server/
├── frontend/               # Pattern library — DISTRIBUTED to .forge/frontend/
└── tests/                  # unit/ (always) + smoke/ (weekly, needs API keys)
```

### Import Ordering

1. Node.js built-in modules
2. External dependencies (npm packages)
3. Internal modules (absolute imports)
4. Relative imports
5. Type-only imports

Use a blank line between each group.

---

## Git Workflow

### Branch Naming

| Type    | Pattern                     | Example                        |
| ------- | --------------------------- | ------------------------------ |
| Feature | `feat/<spec-id>-<slug>`     | `feat/001-user-authentication` |
| Fix     | `fix/<spec-id>-<slug>`      | `fix/001-login-validation`     |
| Hotfix  | `hotfix/<slug>`             | `hotfix/crash-on-empty-input`  |
| Epic    | `epic/<epic-id>-<slug>`     | `epic/E01-core-auth`           |

### Commit Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`

### Pull Requests

- All PRs require AI adversarial review (`/forge-review`) before human review
- PR description must reference the spec ID or story ID
- All CI checks must pass before merge

---

## Testing Requirements

Coverage scope is `installer/**` + `mcp-server/src/**` (see
`vitest.config.ts`). Thresholds are staged — see constitution Art. 4.1.

| Metric | Baseline | Next gate | Target |
| --- | --- | --- | --- |
| Line coverage | not measured (#61) | 50% | 80% |
| Branch coverage | not measured (#61) | 40% | 60% |
| Critical paths | 100% | 100% | 100% |

> **Do not cite a coverage number as satisfied until
> `npm run test:coverage` actually runs in CI.** Declaring a threshold that
> is not enforced is itself a constitution violation (Art. 4.4).

Commands:

```bash
npm test                                  # unit tests (fast: sub-second)
npx tsc --noEmit -p tsconfig.json         # typecheck
```

### Required Test Types

- **Unit tests**: All business logic, utilities, and pure functions
- **Integration tests**: API endpoints, database operations, external services
- **Edge cases**: Null/undefined inputs, empty collections, boundary values
- **Error paths**: All error handling branches must be tested

---

## FORGE Governance

### Constitution

All architectural and design decisions must comply with
[`.forge-meta/constitution.md`](.forge-meta/constitution.md) — **5 articles**
(Core Principles, Technology Stack, Architecture Patterns, Quality
Standards, Naming & Conventions).

> The 9-article layout referenced by some agents and skills belongs to the
> **user-project template**, not to this repository. Do not map "Article 5"
> to Security here — Article 5 is Naming & Conventions (#74).

### Knowledge Base

Before making architectural decisions, check existing decisions:
- **ADRs**: `.forge-meta/knowledge/adr/` -- formal architectural decision records
- **Decision Log**: `.forge-meta/knowledge/decision-log.md` -- session-level decisions
- **Dogfooding artifacts**: `.forge/knowledge/` -- decisions from FORGE's own feature work

### Review Standards

All code changes go through a dual review process:
1. **AI adversarial review**: `/forge-review` runs `forge-reviewer` **and**
   `forge-reviewer-peer` in parallel across **7 dimensions** — correctness,
   security, performance, maintainability, constitution compliance,
   test-spec coherence, and UX quality. Invoking `forge-reviewer` alone
   bypasses dual-model review and violates governance.
2. **Human review**: A team member reviews the code and the AI review findings

Severity scale is **CRITICAL / WARNING / INFO**. CRITICAL consensus
findings block the merge.

### Spec-Code Traceability

- Every implementation must trace back to a spec (`NNN-slug/spec.md`) or
  story (`story-NNN-slug.md`)
- Task completion is tracked in `NNN-slug/tasks.md` — **tasks must actually
  be checked off**; an abandoned tracking artifact is worse than none
- Unspecified changes are only permitted in the Hotfix track
- This rule applies to FORGE's own development. If a change is urgent
  enough to skip the process, it is urgent enough to be recorded as a
  Hotfix with a one-line rationale.

---

## Language

**All distributed and public-facing artifacts MUST be in English**
(constitution Art. 5.2): agents, commands, skills, templates, `frontend/`
code templates, `README`, `SECURITY.md`, GitHub issue/PR templates, and any
user-visible string.

---

## Environment

| Variable | Required for | Notes |
| --- | --- | --- |
| `GITHUB_TOKEN` | GitHub MCP server | Personal access token |
| `OPENCODE_ZEN_API_KEY` | Level-3 smoke tests | Optional — smokes skip without it |

See `.env.example`. Never commit real values.
