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

You are analyzing an existing (brownfield) codebase to understand its
architecture, conventions, dependencies, and technical debt. This analysis
informs the project constitution, architecture documents, and onboarding
for the FORGE methodology.

## Analysis Protocol

Execute these steps in order. For large codebases, focus on the most
important areas first and expand as needed.

### Step 1: Project Structure Analysis

Map the project's directory structure:
1. Identify the source root (src/, app/, lib/).
2. Map top-level directories and their purposes.
3. Identify configuration files and their roles.
4. Locate test directories and test configuration.
5. Identify build and deployment configuration.
6. Locate documentation.

**Output**: Directory tree with annotations.

### Step 2: Technology Stack Discovery

Identify all technologies in use:
1. **Runtime**: Node.js version, Python version, etc.
2. **Language**: TypeScript/JavaScript configuration (tsconfig, strict mode).
3. **Framework**: Express, Fastify, Next.js, Django, FastAPI, etc.
4. **Database**: Type, ORM/query builder, migration tool.
5. **Testing**: Test runner, assertion library, mocking framework.
6. **Linting/Formatting**: ESLint config, Prettier config, ruff, etc.
7. **CI/CD**: GitHub Actions, GitLab CI, etc.
8. **Infrastructure**: Docker, Kubernetes, serverless, etc.

**Source**: `package.json`, `requirements.txt`, `pyproject.toml`, config files.

**Output**: Technology stack table suitable for constitution Article 2.

### Step 3: Architecture Discovery

Understand the architectural patterns:
1. **Application architecture**: Monolith, microservices, modular monolith?
2. **Layer pattern**: MVC, clean architecture, hexagonal, none?
3. **Data flow**: Request lifecycle from entry to response.
4. **Module boundaries**: How are features/domains separated?
5. **Shared code**: How is common functionality organized?
6. **API patterns**: REST, GraphQL, gRPC? Versioned?

**Method**: Read entry points, routing files, and follow the request path
through middleware, controllers, services, and data access.

**Output**: Architecture description suitable for architecture.md.

### Step 4: Convention Extraction

Identify existing coding conventions:
1. **Naming**: File naming (kebab-case, camelCase?), class naming, function
   naming, constant naming, variable naming.
2. **File structure**: How are modules organized? One class per file?
3. **Import ordering**: Is there a consistent pattern?
4. **Error handling**: How are errors created, thrown, and caught?
5. **Logging**: What logger is used? What format?
6. **Configuration**: Environment variables, config files, feature flags?
7. **Type patterns**: Interface vs type? Enums vs unions? Generics usage?

**Method**: Sample 5-10 representative files across different modules.

**Output**: Convention list suitable for constitution Article 7 and AGENTS.md.

### Step 5: Dependency Mapping

Map internal and external dependencies:
1. **External dependencies**: List key packages with versions.
2. **Internal dependencies**: Module dependency graph (who imports whom).
3. **Circular dependencies**: Identify any circular import chains.
4. **Outdated dependencies**: Major version gaps from latest.
5. **Security**: Known vulnerabilities (if audit tools are configured).

**Method**: Read package manifests and scan import statements.

**Output**: Dependency report with risk highlights.

### Step 6: Integration Point Identification

Find all external integration points:
1. **APIs consumed**: External services called.
2. **APIs exposed**: Endpoints served.
3. **Databases**: Connection strings, multiple databases.
4. **Message queues**: Kafka, RabbitMQ, SQS, etc.
5. **File storage**: S3, local filesystem, etc.
6. **Authentication providers**: OAuth, SAML, etc.

**Output**: Integration map.

### Step 7: Tech Debt Assessment

Evaluate technical debt levels:

| Category           | Indicators to Check                                |
| ------------------ | -------------------------------------------------- |
| Code quality       | Large files (>500 lines), deep nesting, duplication|
| Test coverage      | Missing test directories, low coverage config      |
| Type safety        | `any` usage frequency, strict mode disabled        |
| Error handling     | Unhandled promises, empty catch blocks             |
| Security           | Hardcoded secrets, outdated auth patterns          |
| Documentation      | Missing README, no API docs, stale comments        |
| Build/deploy       | Manual steps, no CI/CD, slow builds                |
| Dependencies       | Outdated packages, abandoned libraries             |

**Assessment scale per category**:
- **Low**: Good practices in place, minor issues only.
- **Medium**: Some issues that should be addressed in 1-3 months.
- **High**: Significant issues causing active problems or risk.
- **Critical**: Issues that block development or pose immediate risk.

**Output**: Tech debt summary table with remediation priority.

## Report Format

Compile findings into a structured report:

```markdown
# Brownfield Analysis Report

## Project Overview
[Brief description of what the project does]

## Technology Stack
[Table of technologies discovered]

## Architecture
[Description of architectural patterns]

## Conventions
[List of coding conventions discovered]

## Integration Points
[Map of external integrations]

## Dependencies
[Key dependency analysis]

## Tech Debt Assessment
[Category-by-category assessment]

## Recommendations
1. [Constitution customization recommendations based on findings]
2. [Architecture documentation priorities]
3. [Tech debt remediation order]
4. [Testing gaps to address first]
```

## Constitution Bootstrapping

Map your findings to constitution articles:
- Step 2 findings -> Article 2 (Technology Stack)
- Step 3 findings -> Article 3 (Architecture Patterns)
- Step 4 findings -> Article 7 (Naming & Conventions)
- Step 7 findings -> Article 4 (Quality Standards)
- Security findings -> Article 5 (Security)
- Error patterns -> Article 6 (Error Handling)
- Test patterns -> Article 8 (Testing Standards)

This allows `/forge-init` to pre-populate the constitution with the
project's existing conventions rather than starting from scratch.
