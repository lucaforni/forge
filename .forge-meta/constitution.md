# FORGE Project Constitution

> This document defines the non-negotiable principles, standards, and
> constraints for **the FORGE project itself** (meta-development).
> This is NOT the template - this is FORGE's own constitution.
>
> **This document is immutable.** Changes are made only through the formal
> amendment process documented at the bottom.

---

## Article 1: Core Principles

### 1.1 Mission
FORGE is a methodology framework for AI-assisted software development that provides:
- Structured workflows with 5 complexity tracks (Hotfix, Quick, Feature, Epic, Product)
- Governance through constitution and knowledge base
- Orchestrated subagents with specialized roles
- Bidirectional traceability from requirements to code

### 1.2 Non-Negotiable Principles
- **OpenCode-native**: FORGE is built specifically for OpenCode
- **Agent-first design**: All workflows route through specialized subagents
- **Constitution as law**: All decisions must comply with project constitution
- **Document precision**: All specs must be machine-parseable for future automation
- **Zero breaking changes without migration**: Users must never lose data during updates

### 1.3 User Experience Standards
- All slash commands must complete in < 30 seconds for typical use cases
- Error messages must be actionable
- Documentation must be embedded in \`.opencode/docs/\` for offline access

---

## Article 2: Technology Stack

### 2.1 Approved Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Runtime | Node.js | 20+ | OpenCode requirement |
| Language | TypeScript | 5+ | Type safety for tools |
| Packaging | Bun/NPM | Latest | Fast installs |
| Documentation | Markdown | CommonMark | Universal format |

### 2.2 Dependency Policy
- **Zero runtime dependencies** for core framework
- Plugin dependencies are acceptable but minimal
- All dependencies in devDependencies unless runtime-required

### 2.3 Distribution Policy
**NEVER distribute these to user projects:**
- \`.opencode-meta/\` — Meta-development agent versions
- \`.forge-meta/\` — FORGE's own constitution and specs
- \`docs/meta-development/\` — FORGE development documentation
- \`opencode.json\` from FORGE repo (has meta agent config)

---

## Article 3: Architecture Patterns

### 3.1 System Architecture
File-based orchestration framework:
- Agent definitions in \`.opencode/agents/\`
- Commands in \`.opencode/commands/\`
- Skills in \`.opencode/skills/\`
- User artifacts in \`.forge/\`

### 3.2 Code Organization
```
forge/
├── .opencode/              # Framework (DISTRIBUTED)
├── .opencode-meta/         # Meta-dev (NOT distributed)
├── .forge-meta/            # FORGE governance (NOT distributed)
└── docs/meta-development/  # Dev docs (NOT distributed)
```

---

## Article 4: Quality Standards

### 4.1 Test Coverage
- Minimum 80% coverage for custom tools
- Manual testing for all slash commands

### 4.2 Performance Targets
- Agent instructions < 5000 tokens each
- Skills < 3000 tokens each
- Total context per session < 50k tokens

### 4.3 Technical Debt
- **Meta-development instructions MUST NOT leak into distributed files**
- Regular token usage audits

---

## Article 5: Naming & Conventions

### 5.1 File Naming
- Agents: \`forge-[role].md\`
- Commands: \`forge-[action].md\`
- Skills: \`.opencode/skills/[name]/SKILL.md\`

---

## Amendments Log

| Date | Article | Change | Rationale | ADR Ref |
|------|---------|--------|-----------|---------|
| 2026-02-16 | 2.3, 4.3 | Added distribution exclusions | Prevent meta-dev overhead | N/A |
