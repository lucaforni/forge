# Contributing to FORGE

Thank you for contributing to FORGE! This guide explains the meta-development
workflow for developing FORGE using FORGE itself.

---

## Prerequisites

- [OpenCode](https://opencode.ai) installed and configured
- A GitHub Copilot subscription (this repo targets Claude Opus 4.7, with Sonnet 4.6 as the default)
- Familiarity with FORGE methodology (read [FORGE-GUIDE.md](.opencode/docs/FORGE-GUIDE.md))
- Understanding of the meta-development pattern (see Section 8 of FORGE-GUIDE.md)

---

## Development Workspace

> [!WARNING]
> **This section is out of date and is being rewritten — see
> [#74](https://github.com/lucaforni/forge/issues/74).**
>
> `dev/` was added to `.gitignore` on 2026-09-15. Work done there is
> **silently untracked**, and the workspace itself has been frozen since
> 2026-02-14. Real development now happens at the repository root, governed
> by [`.forge-meta/constitution.md`](.forge-meta/constitution.md), with
> artifacts in `.forge-meta/specs/` and `.forge/`.
>
> Until this guide is rewritten:
> - run `opencode` from the **repository root**, not `dev/`
> - read `.forge-meta/constitution.md`, not `dev/.forge/constitution.md`
> - use repo-root-relative paths (`.opencode/…`), not `../.opencode/…`

<details>
<summary>Legacy <code>dev/</code> workflow (historical)</summary>

All FORGE development used to happen in the `dev/` workspace to avoid
meta-circular conflicts between templates and generated specs.

```bash
git clone <repo>
cd forge/dev
opencode
```

**Why `dev/`?** This separated "FORGE source code" from "specs for developing
FORGE", preventing accidental modification of templates during spec generation.

### Legacy path conventions

**All paths in `dev/` specs were relative to `forge/dev/`**:

| Target | Path from `dev/` |
|--------|------------------|
| FORGE source code | `../.opencode/[type]/[file]` |
| Dev specs | `./.forge/specs/NNN-slug/` |
| Dev constitution | `./.forge/constitution.md` |

</details>

---

## Path Conventions

All paths are relative to the **repository root**:

| Target | Path |
|--------|------|
| Framework source (distributed) | `.opencode/{agents,commands,skills,templates}/` |
| Meta-development agent overrides | `.opencode-meta/agents/` |
| FORGE's own governance | `.forge-meta/{constitution.md,specs/,knowledge/}` |
| FORGE's own dogfooding artifacts | `.forge/{specs,epics,sprints,knowledge}/` |
| Developer documentation | `docs/meta-development/` |

> `../.opencode/…` is a **`dev/`-era convention**. It must never appear in a
> distributed file — in an installed project it escapes the project root
> entirely (constitution Art. 2.3 / 4.3).

---

## Workflow by Track

### Hotfix Track (<5 min)

For critical bugs, typos, urgent fixes:

```bash
# From forge/dev/ in OpenCode
> /forge-hotfix "Fix typo in FORGE-GUIDE.md line 142"
```

**Output**:
- Direct fix to `../.opencode/docs/FORGE-GUIDE.md`
- No formal spec document
- Commit immediately

**Branch naming**: `hotfix/[slug]` (e.g., `hotfix/guide-typo`)

### Quick Track (<1 hour)

For small features, simple commands, minor improvements:

```bash
> /forge-quick "Add /forge-validate command to check .forge/ structure"
```

**Workflow**:
1. PM agent creates `tech-spec.md` with path tables
2. Implementation happens based on explicit paths in spec
3. Self-review with `/forge-review`
4. Commit spec + implementation

**Output**:
- `./.forge/specs/NNN-slug/tech-spec.md` (with "Implementation Targets" table)
- Implementation files in `../.opencode/[type]/`

**Branch naming**: `feat/NNN-slug` (e.g., `feat/001-forge-validate`)

### Feature Track (1-3 days)

For new agents, complex skills, major refactors:

```bash
# Step 1: Create spec (with "Implementation Scope" section)
> /forge-specify "Add continuous testing skill"
# Output: ./.forge/specs/NNN-continuous-testing/spec.md

# Step 2: Design architecture (with "Component Layout")
> /forge-architecture ./.forge/specs/NNN-continuous-testing/spec.md
# Output: ./.forge/specs/NNN-continuous-testing/architecture.md

# Step 3: Create implementation plan (with "File Map" + "Implementation Phases")
> /forge-plan ./.forge/specs/NNN-continuous-testing/
# Output: ./.forge/specs/NNN-continuous-testing/plan.md

# Step 4: Generate task list (each task has explicit "File" field)
> /forge-tasks ./.forge/specs/NNN-continuous-testing/
# Output: ./.forge/specs/NNN-continuous-testing/tasks.md

# Step 5: Implement (follows explicit paths from tasks)
> /forge-implement ./.forge/specs/NNN-continuous-testing/

# Step 6: Adversarial review (finds minimum 3 real issues)
> /forge-review ./.forge/specs/NNN-continuous-testing/

# Step 7: Address issues and finalize
```

**Branch naming**: `feat/NNN-slug` (e.g., `feat/002-continuous-testing`)

### Epic Track (1-2 weeks)

For multi-feature initiatives:

```bash
# Step 1: Create product brief
> /forge-brief "Complete requirements traceability system"
# Output: ./.forge/epics/E01-traceability/product-brief.md

# Step 2: Detailed PRD
> /forge-prd ./.forge/epics/E01-traceability/product-brief.md
# Output: ./.forge/epics/E01-traceability/prd.md

# Step 3: Sprint planning
> /forge-sprint plan E01-traceability

# Step 4: Break into stories
> /forge-story "As a developer, I want to trace requirements to code"
# Output: ./.forge/epics/E01-traceability/story-NNN-slug.md

# Step 5: Each story becomes a Feature track
```

**Branch naming**: `epic/ENN-slug` (e.g., `epic/E01-traceability`)

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/NNN-slug` | `feat/001-forge-validate` |
| Fix | `fix/NNN-slug` | `fix/001-path-resolution` |
| Hotfix | `hotfix/slug` | `hotfix/guide-typo` |
| Epic | `epic/ENN-slug` | `epic/E01-traceability` |

Where:
- `NNN` = Zero-padded 3-digit spec ID (001, 002, 003, ...)
- `ENN` = Epic ID (E01, E02, ...)
- `slug` = Kebab-case descriptor (max 50 chars)

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description> (#spec-id)

Examples:
feat(commands): add forge-validate command (#001)
fix(agents): correct path resolution in forge-pm (#002)
docs(guide): add meta-development section
refactor(orchestrator): improve context loading (#005)
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

**Scopes**: `commands`, `agents`, `skills`, `tools`, `docs`, `templates`, `plugins`

---

## Pull Request Requirements

**All PRs must include**:

- [ ] Spec reference (link to `.forge/specs/NNN-slug/` or state "Hotfix track")
- [ ] All tasks marked complete in `tasks.md` (Feature track)
- [ ] Adversarial review passed with `/forge-review` output (Feature/Epic)
- [ ] Documentation updated (`FORGE-GUIDE.md` or relevant docs)
- [ ] Dogfooding test completed (description of how feature was used)
- [ ] Path tables in spec are complete and accurate

### PR Description Template

```markdown
## Summary
[Brief description of the change]

## Spec Reference
- **Spec**: `.forge/specs/NNN-slug/` or "Hotfix track"
- **Track**: Quick / Feature / Epic / Hotfix

## Implementation
- [ ] Files created: `../.opencode/commands/forge-x.md`
- [ ] Files modified: `../.opencode/docs/FORGE-GUIDE.md`
- [ ] Tests added/updated: N/A or describe

## Review
- [ ] Adversarial review passed (attach `/forge-review` output)
- [ ] Constitution compliance verified (Article references)
- [ ] Dogfooding tested: [Describe how you used the feature]

## Documentation
- [ ] FORGE-GUIDE.md updated (Section reference)
- [ ] Command reference updated (if applicable)
- [ ] Examples added and tested

## Path Verification
- [ ] All paths in spec use relative notation (`../` or `./`)
- [ ] All modification points specify section/line numbers
- [ ] Implementation matches paths specified in spec
```

---

## Dogfooding Principle

**Every FORGE feature must be tested by using FORGE itself**.

### The Test

1. **Develop the feature using FORGE** (create spec, architecture, plan, implement)
2. **Use the new feature to develop another FORGE feature** (meta-testing)
3. **Document any friction** in `./.forge/knowledge/lessons-learned.md`

### Example

You add a new `/forge-test` command:

1. Develop it using Feature track → spec, architecture, plan, tasks, implement
2. **After implementation**, use `/forge-test` to test another FORGE feature
3. If you discover friction (e.g., "doesn't auto-detect test framework"), document it
4. Create follow-up spec to improve based on dogfooding feedback

This ensures FORGE features are practical and actually useful, not just theoretically correct.

---

## Constitution Compliance

All architectural decisions must comply with
[`.forge-meta/constitution.md`](.forge-meta/constitution.md) — FORGE's own
constitution, which has **5 articles**:

| Article | Focus |
|---------|-------|
| Article 1 | Core principles (multi-platform, agent-first, constitution as law) |
| Article 2 | Technology stack, dependency policy, distribution policy |
| Article 3 | Architecture patterns (file-based orchestration, platform projection) |
| Article 4 | Quality standards (coverage, token budgets, enforceability) |
| Article 5 | Naming conventions and language |

> **Do not map "Article 5" to Security here.** The 9-article layout
> (Security, Error Handling, Testing, Operations…) belongs to the
> **user-project template** at `.opencode/templates/constitution.md`, not to
> this repository.

Before finalizing any spec, run a constitution compliance check:
```
> Load constitution-compliance skill and verify against .forge-meta/constitution.md
```

---

## Review Process

### Adversarial Review (Required for Feature/Epic)

Before submitting a PR, run:
```
> /forge-review .forge/specs/NNN-slug/
```

`/forge-review` runs **`forge-reviewer` and `forge-reviewer-peer` in
parallel**. Invoking `forge-reviewer` alone bypasses dual-model review and
violates governance.

The combined review covers **7 dimensions**:
1. **Correctness**: Logic errors, edge cases, assumptions
2. **Security**: Template injection, prompt injection, data leakage
3. **Performance**: Context window usage, agent response time
4. **Maintainability**: Complexity, documentation, extensibility
5. **Constitution Compliance**: Adherence to constitution articles
6. **Test-Spec Coherence**: Do the tests actually verify the spec?
7. **UX Quality**: Usability, accessibility (WCAG 2.1 AA), design consistency

Severity is **CRITICAL / WARNING / INFO**.

**Action**: Fix all CRITICAL findings before the PR. Document WARNING
findings that are intentionally left open, with a rationale.

### Human Review

After adversarial review passes, a team member reviews:
- Code changes match spec requirements
- Path tables in spec are accurate
- Documentation is complete
- Dogfooding test description is believable

---

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Working from `forge/` root | Always `cd forge/dev` before `opencode` |
| Path confusion | Check spec for explicit path tables |
| Modifying templates directly | Create spec first, list template in "Files to Modify" |
| Skipping architecture phase | FORGE features need architecture too |
| Not dogfooding | Use your feature to develop another feature |
| Absolute paths in spec | Use relative paths: `../` for FORGE source, `./` for dev |
| Missing path tables | Every spec needs "Implementation Targets" or "Implementation Scope" |
| Forgetting section/line numbers | Modifications must specify location (e.g., "Section 4.4" or "Lines 42-58") |

---

## Development Setup Checklist

Before starting work on FORGE:

- [ ] Clone repository
- [ ] `cd forge/dev`
- [ ] Read `dev/README.md`
- [ ] Read `dev/.forge/constitution.md` (especially Articles 1, 3, 7, 10)
- [ ] Review existing specs in `dev/.forge/specs/` for examples
- [ ] Understand path conventions (Section 8.5 of FORGE-GUIDE.md)
- [ ] Start OpenCode from `dev/` directory: `opencode`

---

## Getting Help

- **Documentation**: Read [FORGE-GUIDE.md Section 8](.opencode/docs/FORGE-GUIDE.md#8-developing-forge-itself-meta-development)
- **Examples**: Check `dev/.forge/specs/` for existing specs with path tables
- **Constitution**: Read `dev/.forge/constitution.md` for governance rules
- **Issues**: Open a GitHub issue with `[meta-development]` tag
- **Discussions**: Use GitHub Discussions for architecture questions

---

## Quick Start

```bash
# 1. Clone and enter dev workspace
git clone <repo>
cd forge/dev
opencode

# 2. Choose a feature from the backlog or propose new
# 3. Start with appropriate track command
> /forge-quick "Add X feature"  # or /forge-specify for larger features

# 4. Follow the workflow to completion
# 5. Run adversarial review
> /forge-review ./.forge/specs/NNN-slug/

# 6. Submit PR with spec reference and dogfooding description
```

---

Thank you for contributing to FORGE! Your work helps make structured AI-driven
software development better for everyone. 🚀
