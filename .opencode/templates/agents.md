# Project Rules

> This file is automatically loaded by your AI coding runtime (OpenCode and
> Codex CLI read `AGENTS.md`; Claude Code imports it via `CLAUDE.md`). It
> defines project-wide conventions, standards, and references that all
> agents must follow.
>
> Every `<!-- CUSTOMIZE: ... -->` marker below is a prompt for you. Replace
> it with your project's reality — agents treat this file as fact.

---

## Project Overview

<!-- CUSTOMIZE: Replace with your project's description -->

This project uses the **FORGE methodology** (Framework for Orchestrated
Requirements, Governance & Engineering) for structured software development
with AI-assisted workflows.

---

## Technology Stack

<!-- CUSTOMIZE: Replace with your project's actual stack -->

| Layer       | Technology        | Version  | Notes                        |
| ----------- | ----------------- | -------- | ---------------------------- |
| Runtime     | Node.js           | 20+      |                              |
| Language    | TypeScript        | 5+       | Strict mode enabled          |
| Framework   |                   |          | <!-- Add your framework -->  |
| ORM         |                   |          | <!-- Add your ORM -->        |
| Database    |                   |          | <!-- Add your database -->   |
| Testing     |                   |          | <!-- Add your test runner --> |
| Linter      |                   |          | <!-- Add your linter, or delete this row --> |
| Formatter   |                   |          | <!-- Add your formatter, or delete this row --> |

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

<!-- CUSTOMIZE: Adjust to match your project's structure -->

```
src/
  modules/          # Feature modules
  shared/           # Shared utilities, types, constants
  config/           # Configuration files
  middleware/       # HTTP/framework middleware
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

<!-- CUSTOMIZE: Adjust thresholds for your project -->

| Metric           | Minimum | Target |
| ---------------- | ------- | ------ |
| Line coverage    | 70%     | 85%    |
| Branch coverage  | 60%     | 80%    |
| Critical paths   | 100%    | 100%   |

### Required Test Types

- **Unit tests**: All business logic, utilities, and pure functions
- **Integration tests**: API endpoints, database operations, external services
- **Edge cases**: Null/undefined inputs, empty collections, boundary values
- **Error paths**: All error handling branches must be tested

---

## FORGE Governance

### Constitution

All architectural and design decisions must comply with the project
constitution at `.forge/constitution.md`. The constitution defines
non-negotiable principles for technology choices, architecture patterns,
code quality, security, and operations.

Document templates live in `.forge/templates/`; the methodology guide lives
in `.forge/docs/`.

### Knowledge Base

Before making architectural decisions, check existing decisions:
- **ADRs**: `.forge/knowledge/adr/` -- formal architectural decision records
- **Decision Log**: `.forge/knowledge/decision-log.md` -- session-level decisions
- **Lessons Learned**: `.forge/knowledge/lessons-learned.md` -- past mistakes and insights

### Review Standards

All code changes go through a dual review process:
1. **AI adversarial review**: `/forge-review` runs `forge-reviewer` **and**
   `forge-reviewer-peer` in parallel across **7 dimensions** — correctness,
   security, performance, maintainability, constitution compliance,
   test-spec coherence, and UX quality. Invoking `forge-reviewer` alone
   bypasses dual-model review.
2. **Human review**: A team member reviews the code and the AI review findings

Severity is **CRITICAL / WARNING / INFO**. CRITICAL findings block the merge.

### Spec-Code Traceability

- Every implementation must trace back to a spec (`NNN-slug/spec.md`) or
  story (`story-NNN-slug.md`)
- Task completion is tracked in `NNN-slug/tasks.md`
- Unspecified changes are only permitted in the Hotfix track

---

## Environment

<!-- CUSTOMIZE: Add your project's environment variables -->

Required environment variables:
- `GITHUB_TOKEN` -- GitHub personal access token (for the GitHub MCP server)
- <!-- Add your project-specific env vars -->

---

## Language

<!-- CUSTOMIZE: Set the language for user-facing strings and documentation -->

All code comments, documentation and user-facing strings are in English.
