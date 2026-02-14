# FORGE Development Workspace

> This directory is for **developing FORGE using FORGE itself** (meta-development).

## Quick Start

```bash
cd forge/dev
opencode
```

Once in OpenCode, you can use FORGE commands to develop FORGE features:

```
> /forge-quick "Add /forge-doctor health check command"
> /forge-specify "Add continuous testing skill"
```

## Why This Directory Exists

FORGE is a methodology for developing software. To develop FORGE itself using
FORGE, we need to separate:

- **FORGE source code**: Lives in `../.opencode/`
- **Specs for FORGE development**: Live in `./.forge/` (this workspace)

Without this separation, agents could accidentally modify templates when
generating specs, breaking FORGE for all users.

## Directory Structure

```
dev/
├── .forge/                          # FORGE-on-FORGE governance
│   ├── constitution.md              # Rules for developing FORGE
│   ├── specs/                       # Specs for FORGE features
│   │   └── NNN-slug/
│   │       ├── spec.md              # Feature requirements
│   │       ├── architecture.md      # Technical design
│   │       ├── plan.md              # Implementation plan
│   │       └── tasks.md             # Task breakdown
│   ├── epics/                       # Multi-feature initiatives
│   ├── sprints/                     # Sprint planning (if using Epic track)
│   ├── architecture/                # Global architecture docs
│   └── knowledge/
│       ├── decision-log.md          # Session-level decisions
│       ├── lessons-learned.md       # Insights from failures
│       └── adr/                     # Architectural Decision Records
└── README.md                        # This file
```

## Path Conventions

All paths in specs are **relative to this `dev/` directory**:

| Target | Path |
|--------|------|
| FORGE commands | `../.opencode/commands/forge-*.md` |
| FORGE agents | `../.opencode/agents/forge-*.md` |
| FORGE docs | `../.opencode/docs/*.md` |
| Dev specs | `./.forge/specs/NNN-slug/` |
| Dev constitution | `./.forge/constitution.md` |

## Workflow Example

### Adding a New Command (Quick Track)

```
# 1. Start OpenCode from dev/
cd forge/dev
opencode

# 2. Create spec
> /forge-quick "Add /forge-validate command to check project structure"

# Output: ./.forge/specs/001-forge-validate/tech-spec.md
#         (includes path table: ../.opencode/commands/forge-validate.md)

# 3. Implementation happens automatically
# Writes to: ../.opencode/commands/forge-validate.md

# 4. Review
> /forge-review ./.forge/specs/001-forge-validate/

# 5. Commit
$ git add .
$ git commit -m "feat(commands): add forge-validate (#001)"
```

### Adding a New Agent (Feature Track)

```
# 1. Create detailed spec
> /forge-specify "Add forge-tester agent for automated test generation"

# 2. Design architecture
> /forge-architecture ./.forge/specs/002-forge-tester/spec.md

# 3. Create implementation plan
> /forge-plan ./.forge/specs/002-forge-tester/

# 4. Generate task list
> /forge-tasks ./.forge/specs/002-forge-tester/

# 5. Implement
> /forge-implement ./.forge/specs/002-forge-tester/

# 6. Review
> /forge-review ./.forge/specs/002-forge-tester/

# 7. Commit
$ git add .
$ git commit -m "feat(agents): add forge-tester agent (#002)"
```

## Constitution

The constitution for developing FORGE is in `./.forge/constitution.md`.

Key differences from typical projects:
- **Stack**: Markdown, YAML, OpenCode (not application code)
- **Architecture**: Agent orchestration, plugin system
- **Testing**: Dogfooding (use FORGE to build FORGE)
- **Security**: Template injection, prompt security

## Documentation

For complete meta-development guide, see:
- **FORGE-GUIDE.md Section 8**: Meta-development workflow
- **CONTRIBUTING.md**: How to contribute to FORGE
- **./.forge/constitution.md**: Development governance

## Common Pitfalls

| Mistake | Solution |
|---------|----------|
| Working from `forge/` root | Always `cd forge/dev` first |
| Path confusion | Check spec for explicit path tables |
| Modifying templates directly | Create spec first, list template in "Files to Modify" |
| Skipping dogfooding | Use your feature to build another feature |

## Questions?

- Read FORGE-GUIDE.md Section 8
- Check existing specs in `.forge/specs/`
- Open GitHub issue or discussion
