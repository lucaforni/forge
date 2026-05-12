---
name: brownfield-analysis
description: Structured approach for analyzing existing codebases including architecture discovery, dependency mapping, convention extraction, and tech debt assessment
license: MIT
compatibility: opencode
metadata:
  audience: forge-analyst
  workflow: forge
---

## Purpose

Analyze an existing (brownfield) codebase: architecture, conventions, dependencies, tech debt. This informs the constitution, architecture docs, and onboarding to FORGE.

## Analysis Protocol

Execute in order. For large codebases, prioritize most important areas first.

### Step 1: Project Structure

1. Identify source root (src/, app/, lib/).
2. Map top-level directories + purposes.
3. Identify config files + their roles.
4. Locate test directories + test config.
5. Identify build/deploy config.
6. Locate documentation.

**Output**: directory tree with annotations.

### Step 2: Technology Stack

Identify:
1. **Runtime**: Node.js, Python versions.
2. **Language**: TS/JS config (tsconfig, strict mode).
3. **Framework**: Express, Fastify, Next.js, Django, FastAPI, etc.
4. **Database**: type, ORM/query builder, migration tool.
5. **Testing**: runner, assertion library, mocking.
6. **Linting/Formatting**: ESLint, Prettier, ruff, etc.
7. **CI/CD**: GitHub Actions, GitLab CI, etc.
8. **Infrastructure**: Docker, Kubernetes, serverless, etc.

**Source**: `package.json`, `requirements.txt`, `pyproject.toml`, config files.

**Output**: stack table for constitution Article 2.

### Step 3: Architecture Discovery

1. **App architecture**: monolith, microservices, modular monolith?
2. **Layer pattern**: MVC, clean, hexagonal, none?
3. **Data flow**: request lifecycle entry → response.
4. **Module boundaries**: feature/domain separation.
5. **Shared code**: organization of common functionality.
6. **API patterns**: REST, GraphQL, gRPC? Versioned?

**Method**: read entry points, routing files; follow request path through middleware → controllers → services → data access.

**Output**: architecture description for architecture.md.

### Step 4: Convention Extraction

Identify:
1. **Naming**: files (kebab/camel?), classes, functions, constants, variables.
2. **File structure**: module organization. One class per file?
3. **Import ordering**: consistent pattern?
4. **Error handling**: how errors are created, thrown, caught.
5. **Logging**: logger + format.
6. **Configuration**: env vars, config files, feature flags.
7. **Type patterns**: interface vs type? enums vs unions? generics usage?

**Method**: sample 5-10 representative files across modules.

**Output**: convention list for constitution Article 7 + AGENTS.md.

### Step 5: Dependency Mapping

1. **External**: key packages + versions.
2. **Internal**: module dependency graph.
3. **Circular**: identify any circular import chains.
4. **Outdated**: major version gaps from latest.
5. **Security**: known vulns (if audit tools configured).

**Method**: read manifests, scan imports.

**Output**: dependency report with risk highlights.

### Step 6: Integration Points

Find all external integrations:
1. APIs consumed.
2. APIs exposed.
3. Databases (connection strings, multiple DBs).
4. Message queues (Kafka, RabbitMQ, SQS).
5. File storage (S3, local fs).
6. Auth providers (OAuth, SAML).

**Output**: integration map.

### Step 7: Tech Debt Assessment

| Category | Indicators |
|----------|-----------|
| Code quality | Large files (>500 lines), deep nesting, duplication |
| Test coverage | Missing test dirs, low coverage config |
| Type safety | `any` frequency, strict mode disabled |
| Error handling | Unhandled promises, empty catch blocks |
| Security | Hardcoded secrets, outdated auth patterns |
| Documentation | Missing README, no API docs, stale comments |
| Build/deploy | Manual steps, no CI/CD, slow builds |
| Dependencies | Outdated packages, abandoned libraries |

**Scale per category**:
- **Low**: good practices, minor issues.
- **Medium**: issues to address in 1-3 months.
- **High**: significant issues causing active problems.
- **Critical**: blocks development or immediate risk.

**Output**: tech debt table with remediation priority.

## Report Format

```markdown
# Brownfield Analysis Report

## Project Overview
[What the project does]

## Technology Stack
[Table of technologies]

## Architecture
[Architectural patterns]

## Conventions
[Coding conventions discovered]

## Integration Points
[External integrations map]

## Dependencies
[Key dependency analysis]

## Tech Debt Assessment
[Category-by-category]

## Recommendations
1. [Constitution customization]
2. [Architecture doc priorities]
3. [Tech debt remediation order]
4. [Testing gaps to address first]
```

## Constitution Bootstrapping

Map findings to constitution articles:
- Step 2 → Article 2 (Technology Stack).
- Step 3 → Article 3 (Architecture Patterns).
- Step 4 → Article 7 (Naming & Conventions).
- Step 7 → Article 4 (Quality Standards).
- Security findings → Article 5 (Security).
- Error patterns → Article 6 (Error Handling).
- Test patterns → Article 8 (Testing Standards).

This lets `/forge-init` pre-populate the constitution with existing conventions rather than starting from scratch.
