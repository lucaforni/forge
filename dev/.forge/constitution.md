# FORGE Development Constitution

> This document defines the non-negotiable principles, standards, and
> constraints for **developing FORGE itself**. This is the meta-constitution
> that governs how we build and evolve the FORGE methodology.
>
> **This document is immutable.** Changes are made only through the formal
> amendment process documented at the bottom.

---

## Article 1: Core Principles

### 1.1 Mission

To create and maintain a structured, enterprise-grade agentic development
methodology for OpenCode that:
- Provides progressive context engineering through document chains
- Adapts ceremony to complexity through multi-track workflows
- Enforces architectural consistency through constitutional governance
- Enables persistent knowledge management across sessions

### 1.2 Non-Negotiable Principles

1. **Dogfooding First**: Every FORGE feature must be developed using FORGE itself
2. **Template Integrity**: Templates must remain stable; breaking changes require versioning
3. **Path Explicitness**: All specs must include explicit relative paths for implementation
4. **Constitution Compliance**: All architectural decisions must align with this constitution
5. **Adversarial Quality**: All features undergo mandatory adversarial review
6. **Documentation Parity**: Code and documentation are released together, never separately

### 1.3 User Experience Standards

- All slash commands respond within 30 seconds or show progress indicator
- Error messages include actionable next steps and examples
- Documentation examples are tested and known to work
- Breaking changes to templates or agents require migration guide

---

## Article 2: Technology Stack

### 2.1 Approved Stack

| Layer           | Technology        | Version  | Rationale                        |
| --------------- | ----------------- | -------- | -------------------------------- |
| Platform        | OpenCode          | Latest   | Target platform                  |
| Agent Language  | Markdown          | CommonMark | OpenCode agent definition format |
| Config Language | YAML              | 1.2      | Human-readable structured data   |
| Documentation   | Markdown          | GFM      | GitHub Flavored Markdown         |
| Templates       | Markdown          | GFM      | Consistent with documentation    |
| Tools (optional)| TypeScript        | 5+       | If custom tools needed           |
| Plugins (optional)| TypeScript      | 5+       | If custom plugins needed         |

### 2.2 Dependency Policy

FORGE is dependency-free by design (pure Markdown + YAML configuration).

If considering dependencies:
- Must be OpenCode built-in capabilities only
- No external npm packages unless absolutely critical
- Prefer Markdown/YAML solutions over code solutions
- Any exception requires ADR approval

### 2.3 Technology Changes

Any change to the approved stack requires:
1. An ADR documenting the decision (via `/forge-adr`)
2. A constitutional amendment (see Amendments Log below)
3. Impact analysis on existing FORGE users
4. Migration guide for breaking changes

---

## Article 3: Architecture Patterns

### 3.1 System Architecture

**Pattern**: Agent-Orchestrated Plugin System

- **Core**: Orchestrator agent (`forge.md`) routes to specialized subagents
- **Subagents**: PM, Architect, Scrum Master, Analyst, Reviewer, QA
- **Skills**: Reusable logic loaded on-demand (scope-detection, adversarial-review, etc.)
- **Commands**: User-facing slash commands that invoke agents
- **Tools**: Custom OpenCode tools for specialized operations (trace, validate, etc.)
- **Plugins**: Event-driven automation (session-knowledge, spec-validator, etc.)

### 3.2 Code Organization

```
.opencode/
├── agents/           # Agent definitions (forge.md, forge-pm.md, etc.)
├── commands/         # Slash commands (forge-specify.md, forge-implement.md, etc.)
├── skills/           # Reusable skills (scope-detection, adversarial-review, etc.)
├── tools/            # Custom tools (trace-requirements, validate-spec, etc.)
├── plugins/          # Event-driven plugins (session-knowledge, etc.)
├── templates/        # Document templates (spec.md, architecture.md, etc.)
└── docs/             # User documentation (FORGE-GUIDE.md, etc.)
```

**Naming Conventions**:
- Agents: `forge-*.md` (e.g., `forge-pm.md`, `forge-architect.md`)
- Commands: `forge-*.md` (e.g., `forge-specify.md`, `forge-implement.md`)
- Skills: `[skill-name]/SKILL.md` (e.g., `scope-detection/SKILL.md`)
- Tools: `[tool-name].ts` (e.g., `trace-requirements.ts`)

### 3.3 Data Patterns

**Document Chain Pattern**:
```
Constitution → Brief → PRD → Spec → Architecture → Plan → Tasks → Code → Tests
```

Each document:
- Is self-contained (readable standalone)
- References upstream documents explicitly
- Includes metadata (version, date, status, spec ID)
- Uses explicit relative paths for file references

**Spec Directory Pattern**:
```
.forge/specs/NNN-slug/
├── spec.md              # Requirements
├── architecture.md      # Technical design
├── plan.md              # Implementation plan
├── tasks.md             # Task breakdown
└── review.md            # Adversarial review output (optional)
```

### 3.4 Path Conventions

**All paths in specs are relative to `dev/` working directory**:

| Target                  | Path Notation                          |
| ----------------------- | -------------------------------------- |
| FORGE source code       | `../.opencode/commands/forge-x.md`     |
| Dev specs               | `./.forge/specs/NNN-slug/`             |
| Dev constitution        | `./.forge/constitution.md`             |
| Root config (template)  | `../.forge/constitution.md`            |

**Path Requirements**:
- Never use absolute paths
- Always use explicit `../` or `./` prefixes
- Include path tables in all spec documents
- Validate paths exist before implementation

---

## Article 4: Quality Standards

### 4.1 Dogfooding Requirements

Every FORGE feature must pass dogfooding validation:

1. **Primary Test**: Feature developed using FORGE workflow
2. **Secondary Test**: Feature used to develop another FORGE feature
3. **Friction Documentation**: Any issues documented in `lessons-learned.md`
4. **Iteration**: Feature improved based on dogfooding feedback

### 4.2 Review Standards

All features undergo adversarial review that must find real issues across 5 dimensions:
1. **Correctness**: Logic errors, edge cases, assumptions
2. **Security**: Template injection, prompt injection, data leakage
3. **Performance**: Context window usage, agent response time
4. **Maintainability**: Complexity, documentation, extensibility
5. **Constitution Compliance**: Adherence to this document

Minimum findings: 3 real issues (not nitpicks) before approval.

### 4.3 Documentation Standards

- Every command has usage examples in FORGE-GUIDE.md
- Every agent has clear description of role and responsibilities
- Every skill has documented inputs, outputs, and when to use
- Breaking changes include migration guide
- Examples are tested and known to work

### 4.4 Template Stability

Templates are contract between FORGE and users:
- Minor version changes: Add optional sections
- Major version changes: Remove/rename required sections
- Version documented in template frontmatter
- Migration path provided for breaking changes

---

## Article 5: Security

### 5.1 Prompt Security

- Agent prompts must not be vulnerable to prompt injection
- User input in specs is treated as data, not instructions
- Template rendering sanitizes user content
- No dynamic code execution from spec content

### 5.2 Template Injection Protection

- Templates never execute arbitrary code
- User content in templates is escaped
- File paths from specs are validated before use
- No blind write to paths from user input

### 5.3 Data Protection

- No secrets in specs, templates, or documentation
- Example data is fictional and safe to commit
- `.env` files never committed
- User project data stays in their project

### 5.4 Path Traversal Protection

- Validate all file paths before read/write
- Reject paths containing `..` that escape workspace
- Reject absolute paths to system directories
- Whitelist allowed directories for file operations

---

## Article 6: Error Handling

### 6.1 Error Messages

All error messages must:
- Explain what went wrong
- Explain why it's a problem
- Suggest actionable next steps
- Provide example of correct usage

**Example**:
```
❌ BAD: "Invalid spec path"

✅ GOOD: 
Error: Spec path not found: .forge/specs/001-feature/

The spec directory does not exist. Create it first with:
  /forge-specify "Your feature description"

Or if the spec exists elsewhere, check your working directory:
  cd dev/ && opencode
```

### 6.2 Graceful Degradation

- Missing optional sections: Warn but continue
- Missing required sections: Error with specific list
- Corrupted YAML: Show parse error with line number
- Network issues (MCP): Fallback to local-only mode

### 6.3 Validation Timing

- **Pre-flight checks**: Validate before expensive operations
- **Incremental validation**: Check each phase before proceeding
- **Post-completion validation**: Verify output matches spec

---

## Article 7: Naming & Conventions

### 7.1 Command Naming

Pattern: `/forge-[verb]` (e.g., `/forge-specify`, `/forge-implement`)

Guidelines:
- Use clear action verbs
- Keep names short (<15 chars)
- Consistent with FORGE terminology
- No abbreviations unless universal

### 7.2 Agent Naming

Pattern: `forge-[role].md` (e.g., `forge-pm.md`, `forge-architect.md`)

Guidelines:
- Role-based naming (PM, Architect, Scrum Master, etc.)
- Singular nouns (not plural)
- No `agent` suffix (implied by location)

### 7.3 Spec ID Convention

Pattern: `NNN-kebab-case-slug`

- `NNN`: Zero-padded 3-digit number (001, 002, ..., 999)
- `slug`: Kebab-case descriptor (max 50 chars)
- Examples: `001-forge-doctor`, `002-path-validation`

### 7.4 Track Indicators

Specs include track in metadata:

```yaml
| Field | Value |
|-------|-------|
| Track | Quick |
```

Values: `Hotfix`, `Quick`, `Feature`, `Epic`, `Product`

---

## Article 8: Testing Standards

### 8.1 Test Types

| Test Type | Description | Required For |
|-----------|-------------|--------------|
| Dogfooding | Use feature to build feature | All features |
| Manual verification | Human tests example workflows | All features |
| Documentation test | Examples in docs actually work | All commands |
| Template validation | Templates parse and render | Template changes |

### 8.2 Test Coverage

- Every command has 3+ usage examples
- Every agent tested on real spec development
- Every skill tested in isolation and integration
- Every template used to generate real document

### 8.3 Regression Prevention

- Broken workflow documented in `lessons-learned.md`
- Fix includes test case to prevent recurrence
- Regression test added to documentation examples

---

## Article 9: Operational Requirements

### 9.1 Release Process

1. All features developed in `dev/` workspace
2. Specs completed and reviewed
3. Dogfooding tests passed
4. Documentation updated
5. CHANGELOG.md updated
6. Version bump in templates (if applicable)
7. Git tag with semantic version

### 9.2 Versioning

FORGE uses semantic versioning:
- **Major (X.0.0)**: Breaking changes to templates or workflow
- **Minor (1.X.0)**: New features, backward compatible
- **Patch (1.0.X)**: Bug fixes, documentation

### 9.3 Backward Compatibility

Breaking changes require:
- Migration guide in CHANGELOG
- Deprecation period (1 major version)
- Automated migration script (if possible)
- Clear communication to users

---

## Article 10: Meta-Development Rules

### 10.1 Working Directory

All FORGE development happens from `forge/dev/`:
```bash
cd forge/dev
opencode
```

This prevents meta-circular conflicts between templates and generated specs.

### 10.2 Path Explicitness

Every spec includes "Implementation Targets" table:

```markdown
## Implementation Targets

### Files to Create
| Path | Type | Description |
|------|------|-------------|
| `../.opencode/commands/forge-x.md` | Command | Main implementation |

### Files to Modify
| Path | Section/Line | Change Description |
|------|--------------|---------------------|
| `../.opencode/docs/FORGE-GUIDE.md` | Section 4.4 | Add command reference |
```

### 10.3 Constitution Amendments

Changes to this constitution require:
1. ADR documenting rationale
2. Review by all active contributors
3. Consensus approval
4. Entry in Amendments Log below

---

## Amendments Log

> All changes to this constitution must be recorded here.

| Date | Article | Change | Rationale | ADR Ref |
| ---- | ------- | ------ | --------- | ------- |
| 2026-02-14 | All | Initial constitution for FORGE meta-development | Establish governance for developing FORGE using FORGE | N/A |
