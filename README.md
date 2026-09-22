# FORGE

**Framework for Orchestrated Requirements, Governance & Engineering**

> A structured, enterprise-grade agentic development methodology that adapts ceremony to complexity through progressive context engineering and constitutional governance — **for OpenCode, Claude Code, and Codex CLI**.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode](https://img.shields.io/badge/OpenCode-Compatible-green.svg)](https://opencode.ai)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-purple.svg)](https://claude.ai)
[![Codex CLI](https://img.shields.io/badge/Codex%20CLI-Compatible-gold.svg)](https://github.com/openai/codex)
[![Version](https://img.shields.io/badge/version-2.0.0-orange.svg)](CHANGELOG.md)

---

## 🎯 What is FORGE?

FORGE is a **complete AI-powered development methodology** that brings structure, consistency, and quality to software projects. It combines:

- 🏗️ **Progressive Context Engineering** - Document chains that feed AI agents with the right context at the right time
- 📏 **Multi-Track Workflows** - From 30-minute hotfixes to multi-month epics, ceremony adapts to complexity
- ⚖️ **Constitutional Governance** - Non-negotiable principles that ensure architectural consistency
- 🔍 **Adversarial Quality** - AI reviews that actively look for issues before human review
- 📚 **Persistent Knowledge** - Decision logs, ADRs, and lessons learned that survive across sessions

**FORGE is dogfooded** - it was developed using itself, ensuring every feature solves real problems.

---

## ✨ Key Features

### 🎚️ Five Workflow Tracks

Adapt your process to task complexity:

| Track | Scope | Time | Use Case |
|-------|-------|------|----------|
| **Hotfix** | 1 file, urgent | < 30 min | Production bugs |
| **Quick** | 1-5 tasks | < 1 day | Simple features |
| **Feature** | 5-20 tasks | 1-5 days | Standard features |
| **Epic** | 20-50 tasks | 1-4 weeks | Major features |
| **Product** | 50+ tasks | 4+ weeks | New products |

### 🤖 Specialized AI Agents

Nine purpose-built agents handle different phases:

- **forge-pm** - Product Manager: Requirements, PRDs, clarification
- **forge-architect** - Solution Architect: Technical design, ADRs
- **forge-ux** - UX Designer: User journeys, wireframes, accessibility, design specs
- **forge-scrum** - Scrum Master: Sprint planning, task breakdown
- **forge-analyst** - Business Analyst: Codebase exploration, product briefs
- **forge-reviewer** - Adversarial Reviewer (primary): Find real issues, not praise
- **forge-reviewer-peer** - Adversarial Reviewer (peer): Independent second opinion
- **forge-qa** - QA Engineer: Test strategy, coverage analysis
- **forge** (orchestrator) - Routes to the right agent based on complexity

> `/forge-review` always invokes **both** reviewer agents in parallel. Their
> findings are synthesised — consensus issues (flagged by both models) carry
> the highest confidence.

### 📋 Document Chain Pattern

Progressive context engineering through structured documents:

```
Constitution → Brief → PRD → Spec → Design → Architecture → Plan → Tasks → Code → Tests
     ↓            ↓      ↓      ↓       ↓          ↓          ↓       ↓      ↓      ↓
  Principles   Vision  What   Why    UX/UI      How        Steps  Action  Build  Verify
```

Each document:
- ✅ Self-contained (readable standalone)
- ✅ References upstream documents explicitly  
- ✅ Includes metadata (version, date, status, spec ID)
- ✅ Uses explicit relative paths for implementation

### 🔐 Constitutional Governance

Your `.forge/constitution.md` defines non-negotiable rules:

- Technology stack and dependency policies
- Architecture patterns and data patterns
- Quality standards and test coverage thresholds
- Security requirements and error handling
- Naming conventions and operational requirements

**All decisions must comply** - AI agents verify compliance automatically.

### 🖥️ Supported Platforms

FORGE runs natively on three AI-coding runtimes with a single shared codebase:

| Platform | Vendor | Install Location | Config File | Project Instructions |
|----------|--------|-----------------|-------------|---------------------|
| **OpenCode** | OpenCode | `.opencode/{agents,commands,skills,tools,plugins}/` | `opencode.json` | `AGENTS.md` |
| **Claude Code** | Anthropic | `.claude/{agents,commands,skills,hooks}/` | `.claude/settings.json` | `CLAUDE.md` (`@AGENTS.md`) |
| **Codex CLI** | OpenAI | `.codex/{agents,commands}/` + `.agents/skills/` | `.codex/config.toml` | `AGENTS.md` |

The installer **auto-detects** which platform(s) you're using by probing for `.opencode/`, `.claude/`, and `.codex/` directories, then projects the correct layout for each detected platform.

Custom tools (`validate-spec`, `trace-requirements`, `sprint-status`) are exposed via a **shared MCP server** that works identically on all three platforms.

---

### 🧠 Persistent Knowledge Management

Knowledge that survives sessions:

- **Decision Log** - Session-level decisions auto-captured
- **ADRs** - Formal Architecture Decision Records
- **Lessons Learned** - Mistakes and insights from retrospectives
- **Sprint History** - Progress tracking and velocity metrics

---

## 🚀 Quick Start

### Installation

> [!IMPORTANT]
> **Prerequisite — your project must already have a platform directory.**
> The installer detects your runtime by probing for `.opencode/`, `.claude/`
> or `.codex/` in the **target** project. A brand-new project has none of
> them, and the install will exit with code 2 (`No supported platform
> detected`).
>
> Create the directory for your runtime first, or pass `--platform` to
> declare it explicitly:
>
> ```bash
> mkdir -p /path/to/your/project/.opencode
> # …or skip detection entirely:
> npx tsx forge/install-forge.ts /path/to/your/project --platform=opencode
> ```

FORGE auto-detects your platform. One command works for all:

```bash
# Clone FORGE
git clone https://github.com/lucaforni/forge.git

# Install in your project (auto-detects OpenCode / Claude Code / Codex CLI)
npx tsx forge/install-forge.ts /path/to/your/project

# Or force a specific platform:
npx tsx forge/install-forge.ts /path/to/your/project --platform=claude-code

# Preview what will be installed (writes nothing):
npx tsx forge/install-forge.ts /path/to/your/project --dry-run
```

> [!NOTE]
> **OpenCode v2.** FORGE targets OpenCode v2; existing v1 `opencode.json`
> files keep working and are merged into native shape on install.
> Last v1-compatible tag: `v2.0.0-opencode-v1-last`.
>
> **Known gaps.** Platform artifacts are projected to native form, but hooks,
> model tiers and live runs on Claude Code / Codex are still open — see
> [#87](https://github.com/lucaforni/forge/issues/87).

### First Steps

1. **Customize your constitution:**
   ```bash
   # Created by the installer from the template. Follow the
   # <!-- CUSTOMIZE: ... --> markers; updates never overwrite it.
   code .forge/constitution.md
   ```

2. **Set project conventions:**
   ```bash
   # Define naming, git workflow, etc. Also created once, never overwritten.
   code AGENTS.md
   ```

3. **Start building:**
   ```bash
   # In your AI coding runtime (OpenCode / Claude Code / Codex CLI)
   /forge-help               # See all commands
   /forge-specify "Feature"  # Create a spec
   /forge-implement          # Build it
   /forge-review             # Review it
   ```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [**CHEATSHEET.md**](CHEATSHEET.md) | Quick reference for all commands |
| [**FORGE-GUIDE.md**](.opencode/docs/FORGE-GUIDE.md) | Complete methodology guide |
| [**philosophy.md**](docs/meta-development/philosophy.md) | Principles and rationale |
| [**INSTALL.md**](INSTALL.md) | Installation guide & troubleshooting |
| [**CONTRIBUTING.md**](CONTRIBUTING.md) | How to contribute to FORGE |

---

## 🎬 Usage Examples

### Quick Feature (< 1 day)

```bash
/forge-quick "Add email validation to signup form"
# Automatically creates tech-spec, implements, and tests
/forge-review
# Adversarial review finds issues
# Fix issues, commit, done!
```

### Standard Feature (1-5 days)

```bash
/forge-specify "User authentication system with OAuth"
# Creates detailed spec.md with requirements

/forge-clarify
# Refines requirements through Q&A

/forge-ux
# Designs user journeys, wireframes, accessibility spec

/forge-plan
# Creates architecture.md and plan.md

/forge-analyze
# Validates spec-plan consistency

/forge-tasks
# Breaks down into actionable tasks

/forge-implement
# Builds the feature

/forge-review
# Dual-model adversarial review across 7 dimensions (forge-reviewer + forge-reviewer-peer in parallel)

/forge-test
# Generates comprehensive tests
```

### Emergency Hotfix (< 30 min)

```bash
/forge-hotfix "Fix null pointer exception in payment handler"
# Diagnoses issue, applies fix, generates tests
# No ceremony, just results

/forge-review
# Quick review before deployment
```

### Epic with Sprints (weeks)

```bash
/forge-brief "E-commerce platform"
# Analyzes codebase, creates product brief

/forge-prd
# Creates Product Requirements Document

/forge-architecture
# Designs system architecture with ADRs

/forge-sprint plan
# Creates sprint-001 with stories

/forge-story "User registration flow"
# Creates user story

/forge-implement
# Builds the story

/forge-sprint close
# Closes sprint, archives to history

/forge-retro
# Retrospective captures lessons learned
```

---

## 🏗️ Project Structure

```
your-project/
├── .opencode/                  # FORGE system (OpenCode — installed)
│   ├── agents/                 # Specialized AI agents
│   ├── commands/               # Slash commands
│   ├── skills/                 # Reusable logic
│   ├── plugins/                # Event-driven automation
│   ├── tools/                  # Custom tools (OpenCode SDK)
│   ├── templates/              # Document templates
│   └── docs/                   # Methodology documentation
│
├── .claude/                    # FORGE for Claude Code (installed)
│   ├── agents/                 # Same agents, projected for Claude Code
│   ├── commands/               # Same commands
│   ├── skills/                 # Same skills
│   ├── hooks/                  # Hook-based automation
│   └── settings.json           # Claude Code config
│
├── .codex/                     # FORGE for Codex CLI (installed)
│   ├── agents/                 # Codex-native agent definitions
│   └── commands/               # Same commands
│
├── .agents/skills/             # Skills for Codex CLI (installed)
│
├── .forge/                     # Your project data (all platforms)
│   ├── mcp-server/             # Shared MCP server (forge-mcp-server)
│   ├── templates/              # Document templates used by the commands
│   ├── docs/                   # Methodology documentation
│   ├── frontend/               # Frontend pattern library
│   │   ├── patterns/           # 17 UI pattern specs + templates
│   │   ├── design-system.md    # Shared design tokens & components
│   │   └── stack-decisions.md  # Frontend stack rationale
│   ├── constitution.md         # 📝 Your project principles
│   ├── specs/                  # Feature specifications
│   │   └── 001-feature/
│   │       ├── spec.md         # Requirements
│   │       ├── design-spec.md  # UX/UI design (wireframes, components, a11y)
│   │       ├── user-journey.md # Personas & user journeys
│   │       ├── plan.md         # Implementation plan
│   │       └── tasks.md        # Task breakdown
│   ├── knowledge/
│   │   ├── adr/                # Architecture decisions
│   │   ├── decision-log.md     # Session decisions
│   │   └── lessons-learned.md  # Retrospective insights
│   ├── epics/                  # Epic documents
│   ├── sprints/                # Sprint tracking
│   │   ├── active/             # sprint-NNN.yaml, one per active sprint
│   │   ├── completed/          # Archived sprints
│   │   ├── retrospectives/     # Sprint retrospectives
│   │   └── sprint-sequence.yaml
│   └── product/                # Product brief & roadmap
│
├── AGENTS.md                   # 📝 Your project conventions (OpenCode + Codex)
└── CLAUDE.md                   # 📝 Claude Code instructions (@AGENTS.md import)
```

---

## 🔧 Advanced Features

### Scope Detection

FORGE automatically recommends the right track based on:

- Estimated task count
- Files affected
- New dependencies required
- Schema changes
- API surface changes
- Cross-module impact
- Need for new patterns

### Context Chaining

Each phase receives exactly the context it needs:

```
Specify Phase    → Constitution, existing architecture
UX Phase         → Spec, existing design system
Architecture     → Constitution, PRD, design spec, existing ADRs
Implementation   → Spec, design spec, plan, architecture, constitution
Review           → Spec, design spec, architecture, diff, constitution
                   (loaded by both forge-reviewer and forge-reviewer-peer independently)
```

Budget-aware loading prevents context window overflow.

### Adversarial Review

`/forge-review` runs a **dual-model** adversarial review — `forge-reviewer`
and `forge-reviewer-peer` execute **in parallel**
and independently, then the orchestrator synthesises their findings.

Each model reviews across **7 dimensions**:

1. **Correctness** - Logic errors, edge cases, assumptions
2. **Security** - Vulnerabilities, injection risks, data leaks
3. **Performance** - Bottlenecks, inefficient algorithms, resource usage
4. **Maintainability** - Complexity, documentation, extensibility
5. **Constitution Compliance** - Adherence to project principles
6. **Test-Spec Coherence** - Every acceptance criterion has a matching test
7. **UX Quality** - Accessibility (WCAG 2.1 AA), usability, consistency with design spec

The synthesis report highlights **consensus findings** (raised by both models) as
highest-confidence issues. Anti-sycophancy rules prevent generic praise.

### Sprint Management

For Epic/Product tracks:

- Multi-sprint support with automatic archiving
- Story assignment and tracking
- Velocity metrics and burndown
- Retrospectives with lessons captured
- Sprint history preserved in `sprints/archive/`

---

## 🎯 Why FORGE?

### Before FORGE

❌ AI agents forget context between sessions  
❌ No consistency in architectural decisions  
❌ Mixing urgent fixes with long-term features  
❌ Knowledge lost when agents restart  
❌ AI reviews are too positive, miss real issues  

### After FORGE

✅ **Progressive Context** - Right information at the right time  
✅ **Constitutional Consistency** - All decisions follow principles  
✅ **Adaptive Ceremony** - Hotfix to Epic, ceremony matches complexity  
✅ **Persistent Knowledge** - Decision logs, ADRs, lessons learned  
✅ **Adversarial Quality** - AI actively finds issues before humans  

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- How to set up development environment
- Code standards and conventions
- Testing requirements
- Pull request process

**FORGE is dogfooded** - all features must be developed using FORGE itself.

---

## 📊 Workflow Track Selection

```
┌─────────────────────────────────────────────────────────────┐
│  Task Complexity Assessment                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  < 3 tasks, 1-2 files, < 30 min              → Hotfix       │
│  3-5 tasks, 2-5 files, < 1 day               → Quick        │
│  5-20 tasks, 5-15 files, 1-5 days            → Feature      │
│  20-50 tasks, 15-50 files, 1-4 weeks         → Epic         │
│  50+ tasks, 50+ files, 4+ weeks, new system  → Product      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Not sure which track? Run `/forge-help` and the orchestrator will assess complexity automatically.

---

## 🛠️ Tools & Integrations

FORGE includes cross-platform tools via a shared **MCP server**:

| Tool | Description | Platform |
|------|-------------|----------|
| **validate-spec** | Check spec completeness and quality (0-100%) | All platforms via MCP |
| **trace-requirements** | Trace spec requirements to implementation | All platforms via MCP |
| **sprint-status** | Visual sprint dashboard with progress bars | All platforms via MCP |

The `forge-mcp-server` is automatically configured for each platform:
- **OpenCode**: referenced in `opencode.json` under `mcp`
- **Claude Code**: referenced in `.claude/settings.json` under `mcpServers`
- **Codex CLI**: referenced in `.codex/config.toml` under `mcp_servers`

Plugins provide automation (adapted per-platform hooks):

- **session-knowledge** - Auto-capture decisions when sessions end
- **spec-watcher** - Detect spec changes and suggest updates
- **pre-commit-gate** - Validate compliance before commits

---

## 📈 Metrics & Quality

FORGE enforces quality through:

- **Test Coverage Thresholds** - Defined in your project constitution (Art. 4.1); FORGE ships no default number
- **Review Gates** - AI adversarial review before human review
- **Constitution Compliance** - All decisions validated against principles
- **Traceability** - Every line of code traces to a spec or story

---

## 🌟 Dogfooding

FORGE is developed using FORGE. The most complete example is the
**Frontend Pattern Library** epic (`E01`), which ran the full chain —
spec → UX → design-spec → sprints → implementation → adversarial review →
ADRs → retrospective:

| Artifact | Path |
|---|---|
| Epic | [`.forge/epics/E01-frontend-pattern-library/`](.forge/epics/E01-frontend-pattern-library/) |
| Spec + design-spec | [`.forge/specs/001-elenco-ordini/`](.forge/specs/001-elenco-ordini/) |
| Adversarial review output | [`.forge/specs/review-*.md`](.forge/specs/) |
| ADRs | [`.forge/knowledge/adr/`](.forge/knowledge/adr/) |
| Retrospective | [`.forge/sprints/retrospectives/`](.forge/sprints/retrospectives/) |

> [!NOTE]
> Dogfooding is not yet uniform. The v2.0 cross-platform spec
> (`.forge-meta/specs/001-cross-platform/`) was planned with FORGE but its
> tracking artifacts were never closed out, and recent test-harness work
> bypassed the process entirely. Tracked in
> [#74](https://github.com/lucaforni/forge/issues/74).

---

## 🗺️ Roadmap

- [x] Cross-platform support (OpenCode + Claude Code + Codex CLI) — **v2.0**
- [x] MCP server for shared custom tools
- [x] Platform-aware auto-detection installer
- [ ] GitHub Actions integration for CI/CD
- [ ] VS Code extension for quick command access
- [ ] Spec templates for common feature types
- [ ] Analytics dashboard for velocity and quality metrics
- [ ] Multi-repo support for monorepo workflows
- [ ] Export to Jira/Linear/Asana

See [project-plan.md](docs/meta-development/project-plan.md) for full roadmap.

---

## 📜 License

FORGE is open source software licensed under the [MIT License](LICENSE).

---

## 🔗 Links

- **Documentation**: [.opencode/docs/FORGE-GUIDE.md](.opencode/docs/FORGE-GUIDE.md)
- **Cheatsheet**: [CHEATSHEET.md](CHEATSHEET.md)
- **Installation**: [INSTALL.md](INSTALL.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/lucaforni/forge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/lucaforni/forge/discussions)

---

## 🙏 Acknowledgments

FORGE runs on three AI-coding runtimes — [OpenCode](https://opencode.ai), [Claude Code](https://claude.ai) (Anthropic), and [Codex CLI](https://github.com/openai/codex) (OpenAI) — and their shared investment in agentic tooling and MCP made this cross-platform approach possible.

Special thanks to the OpenCode team for creating the platform that started it all.

---

<p align="center">
  <strong>Built with FORGE, for FORGE</strong><br>
  Every feature was developed using the methodology itself<br>
  <br>
  Made with ❤️ by <a href="https://github.com/lucaforni">Luca Forni</a>
</p>

---

**Ready to forge your next project?**

```bash
git clone https://github.com/lucaforni/forge.git
npx tsx forge/install-forge.ts .
opencode
/forge-help
```
