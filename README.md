# FORGE

**Framework for Orchestrated Requirements, Governance & Engineering**

> A structured, enterprise-grade agentic development methodology for OpenCode that adapts ceremony to complexity through progressive context engineering and constitutional governance.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode](https://img.shields.io/badge/OpenCode-Compatible-green.svg)](https://opencode.ai)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](CHANGELOG.md)

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

Seven purpose-built agents handle different phases:

- **forge-pm** - Product Manager: Requirements, PRDs, clarification
- **forge-architect** - Solution Architect: Technical design, ADRs
- **forge-scrum** - Scrum Master: Sprint planning, task breakdown
- **forge-analyst** - Business Analyst: Codebase exploration, product briefs
- **forge-reviewer** - Adversarial Reviewer: Find real issues, not praise
- **forge-qa** - QA Engineer: Test strategy, coverage analysis
- **forge** (orchestrator) - Routes to the right agent based on complexity

### 📋 Document Chain Pattern

Progressive context engineering through structured documents:

```
Constitution → Brief → PRD → Spec → Architecture → Plan → Tasks → Code → Tests
     ↓            ↓      ↓      ↓         ↓          ↓       ↓      ↓      ↓
  Principles   Vision  What   Why      How        Steps  Action  Build  Verify
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

### 🧠 Persistent Knowledge Management

Knowledge that survives sessions:

- **Decision Log** - Session-level decisions auto-captured
- **ADRs** - Formal Architecture Decision Records
- **Lessons Learned** - Mistakes and insights from retrospectives
- **Sprint History** - Progress tracking and velocity metrics

---

## 🚀 Quick Start

### Installation

Install FORGE in your project with one command:

```bash
# Clone FORGE
git clone https://github.com/lucaforni/forge.git

# Install in your project
npx tsx forge/install-forge.ts /path/to/your/project

# Start using FORGE
cd /path/to/your/project
opencode
```

### First Steps

1. **Customize your constitution:**
   ```bash
   # Edit your project principles
   code .forge/constitution.md
   ```

2. **Set project conventions:**
   ```bash
   # Define naming, git workflow, etc.
   code AGENTS.md
   ```

3. **Start building:**
   ```bash
   # In OpenCode
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
| [**FORGE-PHILOSOPHY.md**](.opencode/docs/FORGE-PHILOSOPHY.md) | Principles and rationale |
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

/forge-plan
# Creates architecture.md and plan.md

/forge-analyze
# Validates spec-plan consistency

/forge-tasks
# Breaks down into actionable tasks

/forge-implement
# Builds the feature

/forge-review
# Adversarial review across 5 dimensions

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
├── .opencode/                  # FORGE system (installed)
│   ├── agents/                 # Specialized AI agents
│   ├── commands/               # Slash commands
│   ├── skills/                 # Reusable logic
│   ├── plugins/                # Event-driven automation
│   ├── tools/                  # Custom tools
│   ├── templates/              # Document templates
│   └── docs/                   # Methodology documentation
│
├── .forge/                     # Your project data
│   ├── constitution.md         # 📝 Your project principles
│   ├── specs/                  # Feature specifications
│   │   └── 001-feature/
│   │       ├── spec.md         # Requirements
│   │       ├── architecture.md # Technical design
│   │       ├── plan.md         # Implementation plan
│   │       └── tasks.md        # Task breakdown
│   ├── knowledge/
│   │   ├── adr/                # Architecture decisions
│   │   ├── decision-log.md     # Session decisions
│   │   └── lessons-learned.md  # Retrospective insights
│   ├── epics/                  # Epic documents
│   ├── sprints/                # Sprint tracking
│   │   ├── sprint-001.yaml     # Active sprint
│   │   └── archive/            # Completed sprints
│   └── product/                # Product brief & roadmap
│
└── AGENTS.md                   # 📝 Your project conventions
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
Architecture     → Constitution, PRD, existing ADRs
Implementation   → Spec, plan, architecture, constitution
Review           → Spec, architecture, diff, constitution
```

Budget-aware loading prevents context window overflow.

### Adversarial Review

The `forge-reviewer` agent **must find at least 3 real issues** across 5 dimensions:

1. **Correctness** - Logic errors, edge cases, assumptions
2. **Security** - Vulnerabilities, injection risks, data leaks
3. **Performance** - Bottlenecks, inefficient algorithms, resource usage
4. **Maintainability** - Complexity, documentation, extensibility
5. **Constitution Compliance** - Adherence to project principles

Anti-sycophancy rules prevent generic praise.

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

FORGE includes custom OpenCode tools:

- **trace-requirements** - Trace spec requirements to implementation
- **validate-spec** - Check spec completeness and quality
- **sprint-status** - Visual sprint dashboard

Plugins provide automation:

- **session-knowledge** - Auto-capture decisions when sessions end
- **spec-watcher** - Detect spec changes and suggest updates
- **pre-commit-gate** - Validate compliance before commits

---

## 📈 Metrics & Quality

FORGE enforces quality through:

- **Test Coverage Thresholds** - Defined in constitution (typically 70%+ line, 60%+ branch)
- **Review Gates** - AI adversarial review before human review
- **Constitution Compliance** - All decisions validated against principles
- **Traceability** - Every line of code traces to a spec or story

---

## 🌟 Success Stories

> "FORGE transformed how we build features. The constitutional governance ensures our microservices stay consistent, and the adversarial review catches issues we would have missed."  
> — Development Team Lead

> "Epic workflow with sprint management is perfect for our quarterly planning. Knowledge persistence means new team members can see why decisions were made."  
> — Engineering Manager

---

## 🗺️ Roadmap

- [ ] GitHub Actions integration for CI/CD
- [ ] VS Code extension for quick command access
- [ ] Spec templates for common feature types
- [ ] Analytics dashboard for velocity and quality metrics
- [ ] Multi-repo support for monorepo workflows
- [ ] Export to Jira/Linear/Asana

See [FORGE-PROJECT-PLAN.md](.opencode/docs/FORGE-PROJECT-PLAN.md) for full roadmap.

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

FORGE is built on top of [OpenCode](https://opencode.ai), the AI-native development environment.

Special thanks to the OpenCode team for creating a platform that makes agent-driven development possible.

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
