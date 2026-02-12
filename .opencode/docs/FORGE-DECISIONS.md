# FORGE Design Decisions

**Framework for Orchestrated Requirements, Governance & Engineering**

> Every design decision in FORGE, with rationale, alternatives considered,
> and detailed comparisons with BMAD Method and Speckit.

| Field   | Value      |
| ------- | ---------- |
| Version | 1.0.0      |
| Updated | 2026-02-12 |

---

## Table of Contents

1. [Methodology Comparison Matrix](#1-methodology-comparison-matrix)
2. [Decision Record](#2-decision-record)
3. [What We Took from BMAD](#3-what-we-took-from-bmad)
4. [What We Took from Speckit](#4-what-we-took-from-speckit)
5. [What We Rejected](#5-what-we-rejected)
6. [What Is Original to FORGE](#6-what-is-original-to-forge)

---

## 1. Methodology Comparison Matrix

### 1.1 Overall Feature Comparison

| Feature                          | BMAD                    | Speckit                   | FORGE                      |
| -------------------------------- | ----------------------- | ------------------------- | -------------------------- |
| **Agent System**                 | 9 persona prompts       | None (agent-agnostic)     | 7 real OpenCode subagents  |
| **Workflow Tracks**              | 3 (Quick/Standard/Enterprise) | 1 (universal)        | 5 (Hotfix/Quick/Feature/Epic/Product) |
| **Governance Framework**         | project-context.md      | Constitution (9 articles) | Constitution + ADRs + knowledge base |
| **Cross-Artifact Validation**    | Implementation readiness check | /speckit.analyze    | /forge-analyze + trace-requirements tool |
| **Review Process**               | Adversarial code review | None built-in             | Adversarial AI + human review |
| **Elicitation Techniques**       | 6 named methods         | None                      | 6 named methods (via skill) |
| **Scope Detection**              | Quick Flow escalation   | None                      | 7-factor assessment + auto-recommendation |
| **Sprint Management**            | YAML status + ceremonies| None                      | YAML status + ceremonies + velocity tracking |
| **Knowledge Persistence**        | None (fresh chat)       | Per-branch specs          | ADRs + decision log + lessons learned |
| **Brownfield Support**           | Limited                 | Limited                   | Structured analysis skill |
| **Traceability**                 | Stories -> code          | Requirements -> code      | Bidirectional with custom tool |
| **Parallelism Markers**          | No                      | Yes ([P] tags)            | Yes ([P] tags)             |
| **Clarification Phase**          | No (part of PRD flow)   | Yes ([NEEDS CLARIFICATION])| Yes ([NEEDS CLARIFICATION]) |
| **CI/CD Integration**            | None                    | None                      | Pre-commit gate plugin |
| **Platform**                     | IDE-agnostic            | Agent-agnostic (18+)      | OpenCode-native            |
| **Community**                    | 35k stars, active       | 69k stars, active         | New                        |

### 1.2 Document Chain Comparison

| Document Type       | BMAD                     | Speckit                   | FORGE                      |
| ------------------- | ------------------------ | ------------------------- | -------------------------- |
| Governance          | project-context.md       | constitution.md           | constitution.md            |
| Vision              | brainstorming-report.md  | --                        | brief.md                   |
| Requirements        | PRD.md                   | spec.md                   | prd.md (Epic+) or spec.md (Feature) |
| UX Design           | ux-spec.md (optional)    | --                        | ux-spec.md (optional)      |
| Architecture        | architecture.md + ADRs   | plan.md (combined)        | architecture.md + ADRs (separated) |
| Technical Plan      | (in architecture)        | plan.md + data-model.md   | plan.md (per spec)         |
| Task Breakdown      | story files              | tasks.md                  | tasks.md + story files     |
| Sprint Tracking     | sprint-status.yaml       | --                        | sprint-status.yaml         |
| Decisions           | (in architecture)        | --                        | adr/*.md + decision-log.md |
| Lessons Learned     | --                       | --                        | lessons-learned.md         |
| Retrospectives      | --                       | --                        | sprint-NN-retro.md         |

### 1.3 Agent Roles Comparison

| Role              | BMAD Agent          | Speckit            | FORGE Agent          |
| ----------------- | ------------------- | ------------------ | -------------------- |
| Orchestrator      | BMad Master         | --                 | Forge                |
| Analyst           | Mary (Analyst)      | --                 | forge-analyst        |
| Product Manager   | John (PM)           | User + /specify    | forge-pm             |
| Architect         | Winston (Architect) | User + /plan       | forge-architect      |
| Scrum Master      | Bob (Scrum Master)  | --                 | forge-scrum          |
| Developer         | Amelia (Developer)  | Agent + /implement | Build (OpenCode default) |
| Reviewer          | (in code review)    | /analyze           | forge-reviewer       |
| QA                | Quinn (QA)          | --                 | forge-qa             |
| UX Designer       | Sally (UX)          | --                 | -- (excluded)        |
| Tech Writer       | Paige (Writer)      | --                 | -- (excluded)        |
| Quick Dev         | Barry (Quick Flow)  | --                 | -- (merged into orchestrator) |

### 1.4 Workflow Phase Comparison

| Phase             | BMAD                        | Speckit                  | FORGE                         |
| ----------------- | --------------------------- | ------------------------ | ----------------------------- |
| Setup             | Install prompts             | /speckit.constitution    | /forge-init                   |
| Analysis          | Brainstorm + Research       | --                       | /forge-brief                  |
| Requirements      | Create PRD                  | /speckit.specify         | /forge-specify or /forge-prd  |
| Clarification     | (during PRD creation)       | /speckit.clarify         | /forge-clarify                |
| Architecture      | Create Architecture + ADRs  | /speckit.plan            | /forge-architecture + /forge-plan |
| Validation        | Implementation Readiness    | /speckit.analyze         | /forge-analyze                |
| Task Breakdown    | Create Epics & Stories      | /speckit.tasks           | /forge-tasks                  |
| Sprint Planning   | Sprint Planning             | --                       | /forge-sprint                 |
| Story Preparation | Create Story                | --                       | /forge-story                  |
| Implementation    | Dev Story                   | /speckit.implement       | /forge-implement              |
| Review            | Code Review                 | --                       | /forge-review                 |
| Retrospective     | Epic Retrospective          | --                       | /forge-retro                  |
| Shortcuts         | Quick Spec + Quick Dev      | --                       | /forge-hotfix + /forge-quick  |
| Help              | /bmad-help                  | --                       | /forge-help                   |

---

## 2. Decision Record

### D1: Five Tracks Instead of Three (BMAD) or One (Speckit)

**Context**: BMAD provides three tracks (Quick Flow, BMad Method, Enterprise).
Speckit provides a single universal workflow. Both have gaps.

**Options considered**:

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A: 3 tracks (BMAD style) | Quick / Standard / Enterprise | Proven model, clear boundaries | No track for critical 1-file hotfixes; Feature and Epic too similar |
| B: 1 track (Speckit style) | Universal workflow, skip phases as needed | Simple mental model | Overhead for small tasks; user must decide what to skip |
| C: 5 tracks | Hotfix / Quick / Feature / Epic / Product | Right-sized for each complexity level | More tracks to learn |

**Decision**: Option C (5 tracks).

**Rationale**:
- BMAD's Quick Flow starts at "1-15 stories" -- this is too broad. A 1-file
  hotfix is fundamentally different from a 15-story feature.
- Speckit's single workflow forces users to mentally skip phases, which leads
  to inconsistency ("should I skip clarify for this? what about analyze?").
- The Hotfix track (no docs, just fix + test + structured commit) fills a
  genuine gap. Developers fix critical bugs daily; they need a workflow that
  doesn't slow them down.
- The Feature track (between Quick and Epic) handles the most common case:
  medium features that need specs and plans but not full PRDs and sprint
  management.

**Consequences**:
- Positive: Every common task size has an appropriate track
- Negative: Users need to learn 5 tracks (mitigated by scope-detection skill)
- Neutral: Track selection is recommended by AI, so cognitive overhead is low

---

### D2: Constitutional Governance (Speckit) Over project-context.md (BMAD)

**Context**: BMAD uses a `project-context.md` file for project rules and
conventions. Speckit uses a formal `constitution.md` with 9 articles.

**Options considered**:

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A: project-context.md (BMAD) | Informal rules document | Simple, flexible, low overhead | No structure, easily ignored, no amendment process |
| B: constitution.md (Speckit) | Formal governance with articles | Authoritative, structured, auditable | Higher ceremony, may feel heavy for small projects |
| C: AGENTS.md + constitution.md | OpenCode's AGENTS.md for conventions, constitution for governance | Best of both: lightweight conventions + formal governance | Two files to maintain |

**Decision**: Option C (both).

**Rationale**:
- AGENTS.md is OpenCode's native mechanism for project rules. It is always
  loaded. It is the right place for coding conventions, naming rules, and
  file structure guidelines.
- The constitution is for higher-level governance: approved technologies,
  mandated patterns, quality thresholds, security requirements. These are
  not conventions; they are constraints.
- The amendment log in the constitution provides an audit trail that
  AGENTS.md cannot.
- For small projects, the constitution is optional. AGENTS.md alone is
  sufficient.

**Consequences**:
- Positive: Enterprise teams get formal governance with audit trail
- Positive: Small projects can skip the constitution and use only AGENTS.md
- Negative: Two governance files to maintain (mitigated by clear scope separation)

---

### D3: Numbered Specs Per Feature (Speckit) + Stories Per Epic (BMAD)

**Context**: Speckit organizes artifacts as numbered specs per feature
(`specs/001-name/`). BMAD organizes artifacts as stories within epics
(`epics/epic-name/story-slug.md`). These are different organizational models.

**Options considered**:

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A: Numbered specs only (Speckit) | All work tracked as numbered specs | Clean, sequential, easy to reference | No concept of epics/stories; poor fit for sprint management |
| B: Epics and stories only (BMAD) | All work organized into epics with stories | Good for sprint management and agile teams | No clean per-feature organization; stories scattered across epics |
| C: Hybrid | Specs for Feature track, Epics+Stories for Epic/Product track | Each track uses the best organizational model for its scale | Two organizational models to understand |

**Decision**: Option C (hybrid).

**Rationale**:
- Feature track (5-20 tasks): A single spec with a plan and task list is the
  right granularity. Breaking it into epics and stories is overkill.
- Epic/Product track (20-50+ tasks): Multiple features need to be organized
  into epics with individual stories for sprint management. A single spec
  cannot capture this complexity.
- The numbered spec system (`001-`, `002-`) provides clean, sequential
  organization that is easy to reference and browse.
- Stories within epics provide the backlog management that sprint-based
  teams need.

**Consequences**:
- Positive: Feature-track developers get clean, simple organization
- Positive: Epic-track teams get full agile organization
- Negative: Developers need to understand both models (mitigated by track-specific commands)

---

### D4: Adversarial Review (BMAD) + Cross-Artifact Validation (Speckit)

**Context**: BMAD provides adversarial code review (must find issues). Speckit
provides `/speckit.analyze` for cross-artifact consistency checking. These are
complementary, not competing, features.

**Options considered**:

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A: Adversarial review only | Code review that must find issues | Catches code-level problems | Doesn't catch spec-plan inconsistencies |
| B: Cross-artifact validation only | Consistency checking between documents | Catches planning issues | Doesn't catch code-level problems |
| C: Both | Adversarial review for code + cross-validation for artifacts | Comprehensive quality gates | More review overhead |

**Decision**: Option C (both).

**Rationale**:
- They operate at different levels. Cross-artifact validation catches
  inconsistencies between spec, plan, and architecture BEFORE implementation.
  Adversarial code review catches issues in the implementation AFTER it is
  written.
- Cross-validation prevents building the wrong thing. Adversarial review
  prevents building the right thing badly.
- The overhead is acceptable because both are automated. The developer
  runs a command and gets a report.

**Consequences**:
- Positive: Quality gates at both the planning and implementation levels
- Positive: Issues caught earlier are cheaper to fix
- Negative: More review output to process (mitigated by structured severity levels)

---

### D5: Real Subagents (OpenCode) Over Persona Switching (BMAD)

**Context**: BMAD implements agent specialization by switching "personas"
within a single LLM session. The same model acts as Mary (Analyst), then
John (PM), then Winston (Architect) by changing the system prompt context.
OpenCode provides real subagents: separate invocations with independent
system prompts, models, and tool permissions.

**Options considered**:

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A: Persona switching (BMAD) | Same model, different prompts per role | Simple, no infrastructure needed | All roles share context window; can't use different models; roles bleed into each other |
| B: Real subagents (OpenCode) | Separate model invocations per role | Independent context, different models per role, real tool isolation | Orchestration complexity; context must be passed explicitly |
| C: Party Mode (BMAD) | Multiple personas in one session | Fun for brainstorming | Not real multi-agent; pure theater |

**Decision**: Option B (real subagents).

**Rationale**:
- OpenCode natively supports subagents. Using persona switching when real
  subagents are available would be ignoring the platform's most powerful
  feature.
- Real subagents enable **model differentiation**: Claude Opus 4.6 for deep
  reasoning (PM, Architect, Reviewer) and Claude Sonnet 4.5 for speed (Analyst,
  Scrum, QA). Persona switching uses the same model for everything.
- Real subagents have **tool isolation**. The analyst cannot write files.
  The reviewer cannot edit code. With persona switching, all "personas"
  share the same tool permissions.
- Real subagents have **independent context windows**. The architect's
  context is not polluted by the PM's requirements discovery conversation.
  Each subagent gets its own full context budget for its specific task.

**Consequences**:
- Positive: Better output quality (right model for each task)
- Positive: Real security boundaries (tool isolation per role)
- Positive: No context window competition between roles
- Negative: Context must be passed explicitly between agents (addressed by context-chain skill)
- Negative: More configuration files (7 agent definitions vs BMAD's prompt files)

---

### D6: Model Differentiation (Opus 4.6 for Deep Reasoning, Sonnet 4.5 for Speed)

**Context**: Not all agent roles require the same level of reasoning. Some
tasks (architecture decisions, adversarial review) benefit from deeper
thinking. Others (sprint management, test generation) benefit from speed.

**Options considered**:

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A: Same model everywhere | Claude Sonnet 4.5 for all agents | Simple configuration, lower cost | Architecture and review quality may suffer |
| B: Opus everywhere | Claude Opus 4.6 for all agents | Maximum reasoning quality everywhere | Expensive, slow for routine tasks |
| C: Mixed | Opus 4.6 for PM/Architect/Reviewer, Sonnet 4.5 for others | Right-sized reasoning for each role | More complex model configuration |

**Decision**: Option C (mixed).

**Rationale**:
- PM (forge-pm): Writes PRDs and specs that determine what the entire team
  builds. A poorly specified requirement costs days of rework. Opus 4.6's deeper
  reasoning is worth the cost.
- Architect (forge-architect): Makes technical decisions that affect the
  entire project lifecycle. A bad architecture decision can take weeks to
  undo. Opus 4.6's reasoning is critical.
- Reviewer (forge-reviewer): Must find real issues, not just rubber-stamp.
  Adversarial review requires deep analysis of code against spec against
  architecture. Opus 4.6's thoroughness is essential.
- Analyst (forge-analyst): Explores and summarizes. Good pattern matching
  and speed matter more than deep reasoning. Sonnet 4.5 is sufficient.
- Scrum (forge-scrum): Breaks specs into tasks and manages sprint state.
  This is structured, formulaic work. Sonnet 4.5 handles it well.
- QA (forge-qa): Generates tests from specs and plans. Test generation
  benefits from speed. Sonnet 4.5 is appropriate.

All models are provided via GitHub Copilot.

**Consequences**:
- Positive: High-impact decisions get the best reasoning available
- Positive: Routine tasks are fast and cost-effective
- Negative: Higher token usage for PM, Architect, and Reviewer invocations
- Neutral: Users can override model assignments per agent via customization

---

### D7: Persistent Knowledge Base (Original to FORGE)

**Context**: Neither BMAD nor Speckit provides a persistent knowledge
management system. BMAD requires fresh chats for every workflow (knowledge
dies with the session). Speckit creates per-branch specs that don't persist
across features.

**Options considered**:

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A: No knowledge persistence | Fresh context every session (BMAD approach) | Simple, no maintenance | Knowledge loss, repeated mistakes, contradictory decisions |
| B: ADRs only | Manually created decision records | Captures important decisions | Misses session-level insights; requires discipline |
| C: Full knowledge base | ADRs + automated decision log + lessons learned | Comprehensive knowledge capture with minimal friction | More files to maintain; automated extraction may be noisy |

**Decision**: Option C (full knowledge base).

**Rationale**:
- ADRs alone require developers to remember to create them. In practice,
  many decisions go unrecorded because the developer didn't think it was
  "important enough" at the time.
- The automated decision log (via session-knowledge plugin) captures
  decisions without developer effort. It errs on the side of capturing too
  much, which is better than capturing too little.
- Lessons learned from retrospectives and debugging sessions are some of
  the most valuable knowledge an organization can have, and they are
  almost never recorded systematically.
- The knowledge base is loaded into agent context via instructions, ensuring
  that past knowledge influences present decisions.

**Consequences**:
- Positive: Knowledge compounds over the project lifetime
- Positive: New team members onboard faster
- Positive: Audit trail for compliance
- Negative: Decision log needs periodic curation (false positives, noise)
- Negative: Knowledge base files consume context window

---

### D8: CI/CD Gate Plugins (Original to FORGE)

**Context**: Neither BMAD nor Speckit integrates with CI/CD pipelines or
provides automated consistency checks at commit time.

**Options considered**:

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A: No CI/CD integration | Consistency is a manual concern | No additional complexity | Inconsistencies slip through |
| B: External CI checks | GitHub Actions or similar for spec validation | Runs on every PR | Complex setup, outside OpenCode |
| C: OpenCode plugins | Event-driven checks within OpenCode sessions | Immediate feedback, no external setup | Only runs when using OpenCode |

**Decision**: Option C (OpenCode plugins), with Option B as a documented
future enhancement.

**Rationale**:
- OpenCode's plugin system provides event hooks (`file.edited`,
  `session.diff`) that enable real-time feedback without external CI
  configuration.
- The pre-commit gate plugin runs inside the developer's session, where they
  can immediately address any issues. A CI check that runs after push is too
  late -- the developer has already context-switched.
- OpenCode plugins require zero external infrastructure. No GitHub Actions,
  no CI configuration, no pipeline management.
- The trade-off is that the gate only runs when using OpenCode. Developers
  who commit outside of OpenCode bypass the gate. This is acceptable for
  an advisory (non-blocking) gate.

**Consequences**:
- Positive: Immediate feedback within the development session
- Positive: Zero external infrastructure required
- Positive: Advisory, not blocking (respects developer autonomy)
- Negative: Only runs within OpenCode sessions
- Negative: Plugin API maturity depends on OpenCode's evolution

---

### D9: Skills Over Hardcoded Prompts

**Context**: Agent expertise can be embedded in the system prompt (always
loaded) or in skills (loaded on demand via the `skill` tool).

**Options considered**:

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A: All in system prompt | Embed all expertise in agent definition | Always available | Wastes context window; makes prompts enormous |
| B: All in skills | Keep agent prompts minimal; load skills as needed | Maximizes context budget | Agent must know when to load which skill |
| C: Core in prompt, specialized in skills | Agent prompt defines role and behavior; skills provide specialized techniques | Balanced context usage | Must decide what's core vs specialized |

**Decision**: Option C (core in prompt, specialized in skills).

**Rationale**:
- Agent system prompts should define WHO the agent is and WHAT it does.
  They should not contain detailed procedural instructions for every possible
  task.
- Skills are loaded on demand, so their content only consumes context window
  when it is needed. The adversarial-review skill is only loaded during
  code reviews, not during implementation.
- This mirrors how human expertise works: a reviewer knows they are a
  reviewer (core identity), but they consult a checklist (skill) when
  performing a specific type of review.
- OpenCode's skill system supports this natively with the `skill` tool.
  Skills are auto-discovered from `.opencode/skills/` directories.

**Consequences**:
- Positive: Agent prompts stay concise (better for context window)
- Positive: Skills are reusable across agents
- Positive: Skills can be customized without modifying agent definitions
- Negative: Agents must be instructed to load appropriate skills

---

### D10: What We Deliberately Excluded

#### D10.1: Party Mode (BMAD)

**What it is**: BMAD's Party Mode brings multiple agent personas into a
single session. A "BMad Master" orchestrates, and different personas respond
in character, agree, disagree, and build on each other.

**Why excluded**: OpenCode has real subagents. Simulating multiple personas
in a single LLM session is artificial and wastes context window. The
interaction between agents in Party Mode is theater, not genuine
multi-agent collaboration. Real subagents provide actual model isolation,
tool permission boundaries, and independent context windows.

**Alternative in FORGE**: If you need collaborative analysis, invoke multiple
subagents sequentially. The architect's output becomes the reviewer's input.
The interaction is sequential but genuine.

#### D10.2: Agent Trigger Codes (BMAD)

**What it is**: BMAD agents present menus with single-letter trigger codes
(e.g., `CP` for Create PRD, `VP` for Validate PRD).

**Why excluded**: OpenCode has slash commands with autocomplete. Trigger
codes are a workaround for the lack of a proper command system. `/forge-prd`
is more discoverable and self-documenting than `CP`.

#### D10.3: Fresh Chat Requirement (BMAD)

**What it is**: BMAD strongly recommends starting a new chat session for
every workflow to prevent context window pollution.

**Why excluded**: OpenCode handles context management natively via compaction,
session navigation, and configurable token budgets. The `session-knowledge`
plugin ensures that important information survives context compaction.
Starting fresh is still recommended for long workflows, but it is not a
rigid requirement.

#### D10.4: Shell Scripts (Speckit)

**What it is**: Speckit uses shell scripts (`create-new-feature.sh`,
`setup-plan.sh`) for workflow automation.

**Why excluded**: OpenCode commands and plugins replace shell scripts with a
native, integrated experience. `/forge-init` is more powerful than a shell
script because it can interact with the user, analyze the codebase, and make
context-aware decisions.

#### D10.5: UX Designer Agent (BMAD)

**What it is**: BMAD includes Sally, a UX Designer persona.

**Why excluded**: UX design is important but specialized. Including it in
the core FORGE system adds complexity for projects that don't have a user
interface (APIs, CLIs, libraries, infrastructure). The `FORGE-CUSTOMIZATION.md`
guide explains how to add a UX agent if needed. The Product track supports
an optional UX spec without a dedicated agent.

#### D10.6: Technical Writer Agent (BMAD)

**What it is**: BMAD includes Paige, a Technical Writer persona.

**Why excluded**: In FORGE, documentation is a cross-cutting concern. Every
agent produces documentation as part of its workflow (the PM writes specs,
the architect writes ADRs, the scrum master writes retrospectives). A
separate writer agent would duplicate effort and create ownership ambiguity
("who maintains this document?"). If a project needs dedicated documentation
work, a custom agent can be added via the customization guide.

#### D10.7: Per-Branch Specs (Speckit)

**What it is**: Speckit creates specs on feature branches, making them
branch-scoped artifacts.

**Why excluded**: In FORGE, specs are project-level artifacts committed to
the `.forge/` directory. They persist across branches and serve as historical
records. A spec for a feature should survive even after the feature branch is
merged, because it documents WHAT was built and WHY -- which is useful for
future maintenance, onboarding, and auditing.

---

## 3. What We Took from BMAD

### 3.1 Specialized Agent Roles

**BMAD concept**: Nine named agents with distinct personas (Mary the Analyst,
John the PM, Winston the Architect, etc.).

**Why we took it**: Agent specialization is BMAD's strongest contribution.
A PM agent with PM-specific instructions produces better requirements than
a generic agent. An architect agent with architecture-specific training
makes better technical decisions.

**How FORGE adapts it**: We use OpenCode's native subagent system instead of
persona switching. We reduced from 9 agents to 7 by merging roles (Quick Flow
Dev -> Build agent, UX Designer -> optional, Tech Writer -> cross-cutting).
We assign different models to different roles based on cognitive demand.

### 3.2 Progressive Context Chain

**BMAD concept**: Each phase produces documents that become context for the
next phase.

**Why we took it**: This is the most practically valuable idea in BMAD. It
directly addresses the Context Gap problem. An implementation agent with a
spec, plan, and architecture document produces dramatically better code
than one with just a verbal description.

**How FORGE adapts it**: We formalize the context chain in the `context-chain`
skill with an explicit mapping of which documents each phase requires. BMAD
leaves this somewhat implicit; FORGE makes it a first-class concern.

### 3.3 Multi-Track Workflow

**BMAD concept**: Three planning tracks (Quick Flow, BMad Method, Enterprise)
calibrated to project complexity.

**Why we took it**: The insight that not all work deserves the same level of
ceremony is crucial. It prevents both over-engineering (full PRD for a bug
fix) and under-engineering (no architecture for a new platform).

**How FORGE adapts it**: We expanded from 3 tracks to 5, adding Hotfix
(for zero-ceremony critical fixes) and Feature (filling the gap between
Quick and Epic). We added scope detection to recommend the appropriate track.

### 3.4 Adversarial Review

**BMAD concept**: Code reviews where the reviewer MUST find issues. "No
looks good allowed."

**Why we took it**: AI agents are sycophantic by default. When asked to
review code, they tend to praise it and find only trivial issues. BMAD's
adversarial approach forces genuine, critical analysis.

**How FORGE adapts it**: We implement it as a skill (`adversarial-review`)
rather than embedding it in the agent prompt. This keeps the reviewer
agent's base prompt concise. We add structured output format (severity,
dimension, file, line, suggestion) and a dual review process (AI + human).

### 3.5 Advanced Elicitation

**BMAD concept**: After generating initial content, agents offer a
structured second pass using named reasoning methods (Pre-mortem, First
Principles, Red Team, Socratic Questioning, Constraint Removal, Inversion).

**Why we took it**: This is a genuinely useful technique for improving the
depth of AI analysis. A first-pass spec that then undergoes a Pre-mortem
analysis ("imagine this failed in production -- what went wrong?") produces
materially better requirements.

**How FORGE adapts it**: We implement it as a skill (`advanced-elicitation`)
available to PM and Architect agents. The skill suggests 3 relevant
techniques based on the current context and lets the user choose.

### 3.6 Sprint Management

**BMAD concept**: Sprint status tracking via YAML files, story preparation
workflows, sprint retrospectives.

**Why we took it**: For Epic and Product tracks with multi-week timelines,
sprint management is essential. BMAD's YAML-based approach is lightweight
and version-controllable (unlike web-based project management tools).

**How FORGE adapts it**: We preserve the sprint-status.yaml format, add
velocity tracking across sprints, and integrate retrospective outputs into
the knowledge base (lessons learned).

---

## 4. What We Took from Speckit

### 4.1 Constitutional Governance

**Speckit concept**: A `constitution.md` with 9 articles defining immutable
project principles (Library-First, Test-First, Simplicity Gates, etc.).

**Why we took it**: The constitution concept is Speckit's strongest
contribution. It provides a governance framework that goes beyond coding
conventions to define architectural constraints, quality thresholds, and
operational requirements. This is exactly what enterprise teams need.

**How FORGE adapts it**: We make the constitution customizable (not fixed to
9 specific articles) and add an amendment log for audit trail. We load it as
an OpenCode instruction so it is always in context. We make it optional for
Quick and Feature tracks.

### 4.2 Numbered Specs Per Feature

**Speckit concept**: Organize specs as `specs/001-feature-name/` with
sequential numbering.

**Why we took it**: Sequential numbering provides a clean, browsable
organization. It is easy to reference ("see spec 003") and easy to see the
chronological evolution of the project.

**How FORGE adapts it**: We use the same structure under `.forge/specs/`.
For Epic/Product tracks, we add an `epics/` directory alongside specs for
agile story management.

### 4.3 Cross-Artifact Validation

**Speckit concept**: `/speckit.analyze` checks consistency between spec,
plan, and other artifacts.

**Why we took it**: Inconsistency between documents is a real and common
problem. A spec that says "support 10,000 concurrent users" paired with
a plan that uses an in-memory database is internally contradictory. Catching
this before implementation saves days of rework.

**How FORGE adapts it**: We implement it as `/forge-analyze` using the
`forge-reviewer` subagent with the `constitution-compliance` skill. We add
the `trace-requirements` custom tool for automated traceability checking.

### 4.4 Clarification Phase

**Speckit concept**: A dedicated clarification phase that surfaces
ambiguities with `[NEEDS CLARIFICATION]` markers.

**Why we took it**: Ambiguous requirements are the #1 cause of rework.
Making ambiguity surfacing a first-class workflow phase (not just part of
spec creation) forces teams to confront uncertainty before implementation.

**How FORGE adapts it**: We implement it as `/forge-clarify` using the
`forge-pm` subagent. The command scans the spec for `[NEEDS CLARIFICATION]`
markers and asks the user targeted questions to resolve them.

### 4.5 Parallelism Markers

**Speckit concept**: Tasks marked with `[P]` can be executed in parallel.

**Why we took it**: Explicit parallelism information helps both AI agents
and human developers plan their work. When 3 tasks are parallelizable, a
team of 3 developers can work on them simultaneously.

**How FORGE adapts it**: We preserve the `[P]` marker convention in the
tasks template. The `forge-scrum` agent marks parallelizable tasks when
generating task breakdowns.

### 4.6 Separation of Spec and Plan

**Speckit concept**: Spec defines WHAT and WHY. Plan defines HOW.

**Why we took it**: This separation prevents premature technical decisions
from contaminating requirements, and prevents requirements from being
influenced by implementation convenience. A PM should define what the user
needs without worrying about database schemas. An architect should design
the technical solution without adding new requirements.

**How FORGE adapts it**: We maintain separate `spec.md` and `plan.md` files
per feature. The spec is authored by `forge-pm`; the plan is authored by
`forge-architect`. Different agents, different concerns.

---

## 5. What We Rejected

See [Decision D10](#d10-what-we-deliberately-excluded) for the complete list
of excluded features with detailed rationale for each:

| Excluded Feature     | Source  | TL;DR Reason                              |
| -------------------- | ------- | ----------------------------------------- |
| Party Mode           | BMAD    | Real subagents > simulated personas       |
| Agent trigger codes  | BMAD    | Slash commands > letter codes             |
| Fresh chat requirement | BMAD  | OpenCode handles context management       |
| Shell scripts        | Speckit | OpenCode commands > shell scripts         |
| UX Designer agent    | BMAD    | Optional, not core                        |
| Technical Writer     | BMAD    | Documentation is cross-cutting            |
| Per-branch specs     | Speckit | Specs should persist as project history   |

---

## 6. What Is Original to FORGE

### 6.1 Five-Track Adaptive Workflow

Neither BMAD (3 tracks) nor Speckit (1 track) provides the full range.
FORGE's 5 tracks ensure that every common task size -- from a one-line
hotfix to a new product -- has an appropriately-sized workflow.

### 6.2 Persistent Knowledge Base

Neither methodology persists knowledge across sessions. FORGE's combination
of manually-created ADRs, automatically-extracted decision logs, and
retrospective-derived lessons learned creates a growing institutional memory.

### 6.3 Session Knowledge Plugin

Automatic extraction of decisions and lessons from sessions is unique to
FORGE. It leverages OpenCode's plugin event system to capture knowledge
without developer effort.

### 6.4 Pre-Commit Gate Plugin

Neither methodology integrates with the commit process. FORGE's advisory
gate catches spec-code inconsistencies at the moment of highest developer
attention (right before committing).

### 6.5 Spec Watcher Plugin

Real-time monitoring of spec changes for consistency with downstream
documents. Neither methodology provides this.

### 6.6 Model Differentiation by Cognitive Demand

Neither BMAD nor Speckit considers model selection. FORGE assigns Opus 4.6 to
high-impact roles (PM, Architect, Reviewer) and Sonnet 4.5 to speed-sensitive
roles (Analyst, Scrum, QA), optimizing for both quality and cost. Both models
are provided via GitHub Copilot.

### 6.7 Brownfield Analysis Skill

Neither methodology provides structured guidance for onboarding existing
codebases. FORGE's `brownfield-analysis` skill gives the analyst agent a
systematic protocol for analyzing existing code, detecting patterns, and
bootstrapping governance documents.

### 6.8 Native OpenCode Integration

Both BMAD and Speckit are designed to be IDE/agent-agnostic, which means
they cannot leverage platform-specific features. FORGE is designed
exclusively for OpenCode, which means it uses real subagents (not personas),
real skills (not prompt sections), real commands (not trigger codes), real
plugins (not shell scripts), and real tool permissions (not honor-system
instructions).

This platform-specificity is a trade-off: FORGE only works with OpenCode.
But the depth of integration produces a significantly better experience than
a generic methodology adapted to any platform.

---

## Summary

FORGE's design decisions follow a consistent philosophy: **take the best
proven ideas from BMAD and Speckit, reject what doesn't work for OpenCode,
and add what neither provides**.

The 10 key decisions boil down to three meta-principles:

1. **Use the platform**: OpenCode has subagents, skills, tools, commands,
   plugins, and MCP servers. Use them all instead of simulating them with
   prompts and shell scripts.

2. **Right-size everything**: Five tracks instead of three or one. Opus 4.6 for
   deep thinking, Sonnet 4.5 for speed. Core in prompts, specialized in skills.
   Constitution for governance, AGENTS.md for conventions.

3. **Persist everything**: Knowledge base, decision logs, lessons learned,
   ADRs, retrospectives. If it was worth discussing, it is worth recording.
