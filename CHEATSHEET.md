# FORGE Cheatsheet

Quick reference for FORGE methodology commands, workflows, and conventions.

---

## 🚀 Quick Start

```bash
# Install FORGE in your project
npx tsx /path/to/forge/install-forge.ts /path/to/your/project

# Update existing installation
npx tsx /path/to/forge/install-forge.ts /path/to/your/project --update

# Start using FORGE
cd /path/to/your/project
opencode
/forge-help
```

---

## 📋 Core Commands

| Command | Track | Purpose | Output |
|---------|-------|---------|--------|
| `/forge-help` | All | Show all commands | Command list |
| `/forge-init` | All | Initialize FORGE | Validate setup |
| `/forge-specify` | Feature+ | Create specification | `spec.md` |
| `/forge-clarify` | Feature+ | Refine requirements | Updated `spec.md` |
| `/forge-ux` | Feature+ | UX/UI design phase | `design-spec.md`, `user-journey.md` |
| `/forge-wireframe` | Feature+ | Generate ASCII wireframes | Appended to `design-spec.md` |
| `/forge-plan` | Feature+ | Create implementation plan | `plan.md` |
| `/forge-analyze` | Feature+ | Review spec & plan | Consistency report |
| `/forge-tasks` | Feature+ | Break down into tasks | `tasks.md` |
| `/forge-implement` | All | Build the feature | Working code |
| `/forge-review` | All | Adversarial code review (6 dimensions) | Issue report |
| `/forge-test` | All | Generate tests | Test files |

---

## 🎯 Workflow Tracks

| Track | Scope | Time | When to Use |
|-------|-------|------|-------------|
| **Hotfix** | 1 file, urgent bug | < 30 min | Production issue, critical bug |
| **Quick** | 1-5 tasks, simple feature | < 1 day | Small enhancement, simple fix |
| **Feature** | 5-20 tasks, standard feature | 1-5 days | New feature, refactoring |
| **Epic** | 20-50 tasks, large feature | 1-4 weeks | Major feature, system redesign |
| **Product** | 50+ tasks, new product | 4+ weeks | New product, platform |

### Track Commands

```bash
# Hotfix workflow (all-in-one)
/forge-hotfix "Fix null pointer in auth handler"

# Quick workflow (minimal ceremony)
/forge-quick "Add email validation to signup form"

# Feature workflow (full ceremony)
/forge-specify "User authentication system"
/forge-clarify   # Refine requirements
/forge-ux        # UX design: personas, wireframes, a11y (for UI features)
/forge-plan      # Design solution
/forge-analyze   # Validate consistency
/forge-tasks     # Break into tasks
/forge-implement # Build feature
/forge-review    # AI review (6 dimensions: + UX quality)
/forge-test      # Generate tests

# Epic workflow (with sprint management)
/forge-brief "E-commerce platform"
/forge-prd
/forge-architecture
/forge-analyze
/forge-sprint plan
/forge-story "User registration flow"
/forge-implement
/forge-review
/forge-retro
```

---

## 📁 Directory Structure

```
your-project/
├── .opencode/               # FORGE system files (don't edit directly)
│   ├── agents/              # FORGE agents (PM, Architect, UX, etc.)
│   ├── commands/            # Slash commands
│   ├── skills/              # Reusable skills
│   ├── plugins/             # Event-driven plugins
│   ├── tools/               # Custom tools
│   ├── templates/           # Document templates
│   └── docs/                # FORGE documentation
│
├── .forge/                  # Your project's FORGE data
│   ├── constitution.md      # ⚠️ Project principles (customize this!)
│   ├── specs/               # Feature specifications
│   │   └── NNN-slug/        # Spec directory
│   │       ├── spec.md          # Requirements
│   │       ├── design-spec.md   # UX/UI design (wireframes, components, a11y)
│   │       ├── user-journey.md  # Personas & user journeys
│   │       ├── plan.md          # Implementation plan
│   │       └── tasks.md         # Task breakdown
│   ├── ux/
│   │   └── design-system.md # Shared design tokens & components
│   ├── knowledge/
│   │   ├── adr/             # Architecture Decision Records
│   │   ├── decision-log.md  # Session decisions
│   │   └── lessons-learned.md  # Retrospective insights
│   ├── epics/               # Epic documents (Epic/Product track)
│   ├── sprints/             # Sprint tracking (Epic/Product track)
│   ├── product/             # Product brief & roadmap
│   └── architecture/        # System architecture docs
│
└── AGENTS.md                # ⚠️ Project conventions (customize this!)
```

---

## 🏗️ Epic & Sprint Commands

| Command | Purpose | Output |
|---------|---------|--------|
| `/forge-brief` | Analyze codebase, create product brief | `product-brief.md` |
| `/forge-prd` | Create Product Requirements Document | `prd.md` |
| `/forge-architecture` | Design system architecture | `architecture.md`, ADRs |
| `/forge-sprint plan` | Create new sprint | `sprint-NNN.yaml` |
| `/forge-sprint start` | Begin sprint execution | Sprint status |
| `/forge-sprint close` | Complete and archive sprint | Archive to `sprints/archive/` |
| `/forge-story` | Create user story | `story-NNN-slug.md` |
| `/forge-status` | Show sprint dashboard | Dashboard view |
| `/forge-retro` | Sprint retrospective | Updated `lessons-learned.md` |

---

## 📝 Spec ID Convention

```
NNN-kebab-case-slug

Examples:
001-user-authentication
002-payment-gateway
042-api-rate-limiting
```

**Rules:**
- `NNN`: 3-digit zero-padded number (001-999)
- `slug`: kebab-case, max 50 chars, descriptive

---

## 🔍 Document Templates

| Template | Location | Used By |
|----------|----------|---------|
| Specification | `.opencode/templates/spec.md` | `/forge-specify` |
| Tech Spec | `.opencode/templates/tech-spec.md` | `/forge-quick` |
| Design Spec | `.opencode/templates/design-spec.md` | `/forge-ux`, `/forge-wireframe` |
| User Journey | `.opencode/templates/user-journey.md` | `/forge-ux` |
| Architecture | `.opencode/templates/architecture.md` | `/forge-architecture` |
| Plan | `.opencode/templates/plan.md` | `/forge-plan` |
| Tasks | `.opencode/templates/tasks.md` | `/forge-tasks` |
| PRD | `.opencode/templates/prd.md` | `/forge-prd` |
| ADR | `.opencode/templates/adr.md` | `/forge-adr` |
| Story | `.opencode/templates/story.md` | `/forge-story` |
| Product Brief | `.opencode/templates/product-brief.md` | `/forge-brief` |

---

## 🛠️ Custom Tools

```bash
# Trace requirements from spec to code
trace-requirements <spec-path>

# Validate spec completeness
validate-spec <spec-path>

# Show sprint dashboard
sprint-status
```

---

## 🔐 Protected Files (Never Overwritten on Update)

```
.forge/constitution.md       # Your project principles
.forge/specs/**              # All specifications
.forge/knowledge/**          # Decision logs, ADRs, lessons
.forge/epics/**              # Epic documents
.forge/sprints/**            # Sprint tracking
.forge/product/**            # Product documents
AGENTS.md                    # Your project conventions
CONTRIBUTING.md              # Your contribution guide
```

---

## 📊 Workflow Cheat Matrix

| Task Type | Track | Commands |
|-----------|-------|----------|
| Bug fix (production) | Hotfix | `/forge-hotfix` → `/forge-review` |
| Small feature (< 1 day) | Quick | `/forge-quick` → `/forge-implement` → `/forge-review` |
| Standard feature | Feature | `/forge-specify` → `/forge-plan` → `/forge-tasks` → `/forge-implement` |
| Large feature (weeks) | Epic | `/forge-brief` → `/forge-prd` → `/forge-architecture` → `/forge-sprint` |
| New product/platform | Product | Full Epic + Constitution + Multi-sprint |

---

## 🎨 Common Patterns

### Create a Feature

```bash
/forge-specify "Add password reset functionality"
# Review and iterate on spec.md
/forge-clarify
# Create implementation plan
/forge-plan
# Validate everything
/forge-analyze
# Break into tasks
/forge-tasks
# Implement
/forge-implement
# Review code
/forge-review
```

### Quick Enhancement

```bash
/forge-quick "Add email validation to signup"
# Implementation happens automatically
/forge-review
```

### Emergency Hotfix

```bash
/forge-hotfix "Fix null pointer in payment handler"
# Diagnose, fix, test automatically
/forge-review
```

### Start Epic with Sprints

```bash
# Phase 1: Discovery
/forge-brief "E-commerce platform"
/forge-prd

# Phase 2: Architecture
/forge-architecture
/forge-analyze

# Phase 3: Sprint Execution
/forge-sprint plan  # Create sprint-001
/forge-story "User registration"
/forge-implement
/forge-review
/forge-story "Product catalog"
/forge-implement
/forge-review

# Phase 4: Retrospective
/forge-sprint close
/forge-retro
```

---

## 🔧 Configuration Files

### `.forge/constitution.md`
Your project's non-negotiable principles. Customize these sections:
- Core principles
- Technology stack
- Architecture patterns
- Quality standards
- Security requirements
- Testing standards

### `AGENTS.md`
Your project conventions:
- Naming conventions (files, variables, classes)
- Git workflow (branch naming, commit format)
- Code organization
- Import ordering
- Testing requirements

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `CHEATSHEET.md` | Quick reference (you're here!) |
| `.opencode/docs/FORGE-GUIDE.md` | Complete methodology guide |
| `.opencode/docs/FORGE-PHILOSOPHY.md` | Principles and rationale |
| `.opencode/docs/FORGE-CUSTOMIZATION.md` | Advanced customization |
| `INSTALL.md` | Installation guide |
| `README-INSTALLER.md` | Installer development guide |

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Command not found | Run `opencode` from project root |
| "Constitution not found" | Run `/forge-init` to setup |
| "Spec not found" | Use correct spec ID format: `NNN-slug` |
| Template outdated | Update FORGE: see `INSTALL.md` |
| Task not in spec | Add to spec first, then regenerate tasks |

---

## 💡 Pro Tips

1. **Always customize constitution first** - Run `/forge-init` and edit `.forge/constitution.md`
2. **Use appropriate track** - Don't over-engineer: Hotfix for bugs, Quick for small changes
3. **Iterate on specs** - Use `/forge-clarify` to refine requirements before implementation
4. **Review before merge** - Always run `/forge-review` before PR
5. **Keep knowledge updated** - Decision logs and lessons learned are valuable for team memory
6. **Batch updates** - Use `update-multiple-projects.sh` for managing FORGE across projects
7. **Check sprint status often** - Run `/forge-status` to track progress in Epic/Product tracks

---

## 🔗 Quick Links

- **FORGE Repository**: https://github.com/lucaforni/forge
- **Install Command**: `npx tsx /path/to/forge/install-forge.ts .`
- **Update Command**: `npx tsx /path/to/forge/install-forge.ts . --update`
- **Main Documentation**: `.opencode/docs/FORGE-GUIDE.md`

---

## 📄 License

FORGE is part of the OpenCode ecosystem. See LICENSE for details.

---

**Last Updated**: 2026-02-22  
**FORGE Version**: 1.1.0
