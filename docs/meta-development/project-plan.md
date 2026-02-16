# FORGE Project Plan

**Framework for Orchestrated Requirements, Governance & Engineering**

> An agentic software development system for OpenCode that combines the best of
> BMAD Method and Speckit into a unified, enterprise-grade methodology.

| Field          | Value                                    |
| -------------- | ---------------------------------------- |
| Version        | 1.0.0-draft                              |
| Status         | Planning                                 |
| Created        | 2026-02-12                               |
| Platform       | [OpenCode](https://opencode.ai)          |
| License        | MIT                                      |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Methodology Synthesis](#4-methodology-synthesis)
5. [System Architecture](#5-system-architecture)
6. [Component Inventory](#6-component-inventory)
7. [Multi-Track Workflow System](#7-multi-track-workflow-system)
8. [Agent Architecture](#8-agent-architecture)
9. [Document Chain & Templates](#9-document-chain--templates)
10. [Commands](#10-commands)
11. [Skills](#11-skills)
12. [Custom Tools](#12-custom-tools)
13. [Plugins](#13-plugins)
14. [Rules & Governance](#14-rules--governance)
15. [MCP Integrations](#15-mcp-integrations)
16. [Model Strategy](#16-model-strategy)
17. [Directory Structure](#17-directory-structure)
18. [Implementation Phases](#18-implementation-phases)
19. [Deliverables Checklist](#19-deliverables-checklist)
20. [Risk Register](#20-risk-register)
21. [Success Criteria](#21-success-criteria)

---

## 1. Executive Summary

FORGE is a structured agentic development system built on top of OpenCode. It
provides a complete software development lifecycle managed by specialized AI
agents, governed by a project constitution, and tracked through a progressive
document chain.

FORGE takes the **progressive context engineering** and **specialized agent
roles** from the BMAD Method, the **constitutional governance** and
**cross-artifact validation** from Speckit, and adds **persistent knowledge
management**, **CI/CD gate automation**, and **native OpenCode integration**
across all platform features: agents, subagents, skills, tools, commands, rules,
plugins, MCP servers, and model configuration.

The system adapts its ceremony level to task complexity through five workflow
tracks (Hotfix, Quick, Feature, Epic, Product), ensuring that a one-line bug fix
does not require the same planning depth as a new platform.

### Key Numbers

| Component         | Count |
| ----------------- | ----- |
| Primary agents    | 3     |
| Subagents         | 6     |
| Skills            | 7     |
| Slash commands    | 19    |
| Document templates| 8     |
| Custom tools      | 3     |
| Plugins           | 3     |
| Workflow tracks   | 5     |

---

## 2. Problem Statement

### 2.1 The Context Gap

AI coding agents produce significantly better results when given well-structured
context about requirements, architecture, and conventions. Without it, agents
across different sessions make independent, potentially conflicting decisions
(one uses REST, another GraphQL; one chooses Prisma, another Drizzle).

### 2.2 The Ceremony Trap

Too much process kills velocity. Too little kills quality. Most methodologies
offer a single workflow depth: either everything gets a full PRD and
architecture review, or nothing does. Teams need a system that right-sizes
ceremony to complexity.

### 2.3 The Knowledge Loss Problem

Decisions made in one AI session are lost when the session ends. Architectural
rationale, lessons learned from failures, and convention choices evaporate
between sessions. New sessions repeat mistakes or contradict prior decisions.

### 2.4 The Consistency Problem in Teams

In teams of 15+ developers, each person's AI sessions produce code with
subtly different patterns, naming conventions, and architectural approaches.
Without a shared governance framework, entropy increases with every commit.

### 2.5 What Exists Today

| Solution   | Strengths                                      | Gaps                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------- |
| **BMAD**   | Agent roles, progressive docs, adversarial review, multi-track | Single-model personas, no real multi-agent, heavy ceremony, no governance framework |
| **Speckit**| Constitution, cross-validation, traceability, clean structure | Single workflow depth, no agent specialization, no knowledge persistence, weak brownfield support |
| **Neither**| --                                              | Native OpenCode integration, persistent knowledge base, CI/CD gates, plugin automation |

FORGE addresses all five problems by synthesizing the best of both
methodologies and adding what neither provides.

---

## 3. Goals & Non-Goals

### 3.1 Goals

| ID   | Goal                                                                                   | Priority |
| ---- | -------------------------------------------------------------------------------------- | -------- |
| G1   | Provide structured, repeatable workflows for enterprise software development           | Critical |
| G2   | Adapt ceremony depth to task complexity (5 tracks)                                     | Critical |
| G3   | Maintain a persistent knowledge base (ADRs, decisions, lessons) across sessions        | High     |
| G4   | Enforce architectural consistency via constitutional governance                        | High     |
| G5   | Ensure bidirectional traceability: requirements -> plan -> tasks -> code -> tests       | High     |
| G6   | Support both greenfield and brownfield projects                                        | High     |
| G7   | Integrate with team workflows (multi-developer, sprint ceremonies, PR process)          | High     |
| G8   | Leverage ALL OpenCode features natively (agents, skills, tools, commands, plugins, MCP) | High     |
| G9   | Produce adversarial, high-quality code reviews that must find real issues               | Medium   |
| G10  | Automate consistency validation between artifacts (spec vs plan vs code)                | Medium   |
| G11  | Be stack-agnostic while providing excellent defaults for TypeScript/Node.js and Python  | Medium   |

### 3.2 Non-Goals

| ID   | Non-Goal                                                                              | Rationale |
| ---- | ------------------------------------------------------------------------------------- | --------- |
| NG1  | Replace human judgment in architectural decisions                                     | Agents guide; humans decide |
| NG2  | Full spec-as-source (generate all code from specs, humans never touch code)           | Impractical with current LLM reliability |
| NG3  | Build a standalone tool or SaaS product                                               | FORGE is an OpenCode configuration, not a separate product |
| NG4  | Support non-OpenCode AI coding tools                                                  | Deep integration with OpenCode features is a core design choice |
| NG5  | Provide domain-specific templates (medical, fintech, gaming)                          | The customization guide explains how to add these |

---

## 4. Methodology Synthesis

### 4.1 What We Take from BMAD

| Element                     | BMAD Concept                           | FORGE Adaptation                                              |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Specialized agent roles     | 9 named personas (Mary, John, Winston...)| 6 subagents with distinct models and tool permissions          |
| Progressive context chain   | Each phase feeds the next              | Same principle, enforced via context-chain skill               |
| Multi-track workflow        | Quick Flow / BMad Method / Enterprise  | 5 tracks: Hotfix / Quick / Feature / Epic / Product           |
| Adversarial review          | "No looks good allowed"               | adversarial-review skill with mandatory issue finding          |
| Advanced elicitation        | Named reasoning methods (Pre-mortem, Red Team...) | advanced-elicitation skill available to PM and Architect       |
| Scope detection             | Quick Flow detects when work is too large | scope-detection skill with structured complexity assessment    |
| Sprint management           | Sprint status YAML, story files        | Preserved with sprint-status.yaml and story templates          |
| Code review protocol        | Structured adversarial review          | Dual review: AI adversarial + human approval                  |

### 4.2 What We Take from Speckit

| Element                     | Speckit Concept                        | FORGE Adaptation                                              |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Constitutional governance   | 9 Articles of Development             | Customizable constitution with amendment log                   |
| Numbered specs per feature  | `specs/NNN-short-name/`               | Same structure under `.forge/specs/`                           |
| Cross-artifact validation   | `/speckit.analyze`                     | `/forge-analyze` command + forge-reviewer subagent             |
| Clarification phase         | `[NEEDS CLARIFICATION]` markers       | Preserved in spec template + `/forge-clarify` command          |
| Parallelism markers         | `[P]` on parallelizable tasks         | Preserved in tasks template                                    |
| Bidirectional traceability  | Req -> Plan -> Tasks -> Code          | Extended with `trace-requirements` custom tool                 |
| Separation of what/how      | Spec (what) vs Plan (how)             | Preserved as separate documents                                |

### 4.3 What Is Original to FORGE

| Element                     | Description                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| 5 workflow tracks           | Hotfix and Feature tracks added between Quick and Epic                       |
| Persistent knowledge base   | ADRs + Decision Log + Lessons Learned survive across sessions                |
| Session knowledge plugin    | Automatic extraction of decisions and lessons at session end                  |
| CI/CD gate plugins          | Pre-commit validation of spec-code consistency                               |
| Spec watcher plugin         | Real-time consistency monitoring when specs are edited                        |
| Native OpenCode integration | Uses agents, subagents, skills, tools, commands, plugins, MCP, and models    |
| Brownfield analysis skill   | Structured approach for analyzing and onboarding existing codebases          |
| Model differentiation       | Opus 4.6 for deep reasoning (PM, Architect, Reviewer), Sonnet 4.5 for speed (others) |
| Dual review process         | AI adversarial review + human review gate, not just one or the other         |

### 4.4 What We Deliberately Exclude

| Excluded Element           | Source   | Reason                                                           |
| -------------------------- | -------- | ---------------------------------------------------------------- |
| Party Mode (multi-persona) | BMAD     | OpenCode has real subagents; simulating multiple personas in one session is unnecessary |
| Agent trigger codes        | BMAD     | OpenCode has slash commands; single-letter codes add cognitive overhead |
| Fresh chat requirement     | BMAD     | OpenCode handles context management natively (compaction, session navigation) |
| Shell scripts for setup    | Speckit  | OpenCode has `/forge-init` command and plugins for automation     |
| Per-branch specs           | Speckit  | Specs live in `.forge/` and are committed; branching is handled by git |
| UX Designer persona        | BMAD     | Can be added via customization if needed; not in core set         |
| Technical Writer persona   | BMAD     | Documentation is a cross-cutting concern handled by all agents    |

---

## 5. System Architecture

### 5.1 Architecture Overview

```
+------------------------------------------------------------------+
|                         USER INTERACTION                          |
|  /forge-*  commands  |  @forge-*  mentions  |  Tab agent switch   |
+------------------------------------------------------------------+
          |                      |                      |
          v                      v                      v
+------------------------------------------------------------------+
|                      PRIMARY AGENTS                               |
|  +----------+  +----------+  +----------+                        |
|  |  Build   |  |   Plan   |  |  Forge   |  <-- Orchestrator      |
|  | (default)|  | (default)|  | (new)    |                        |
|  +----------+  +----------+  +----+-----+                        |
+-----------------------------------|----- ------------------------+
                                    |
              +---------------------+---------------------+
              |                     |                     |
              v                     v                     v
+------------------------------------------------------------------+
|                        SUBAGENTS                                  |
|  +-----------+ +-----------+ +-------------+                     |
|  | forge-    | | forge-    | | forge-      |                     |
|  | analyst   | | pm        | | architect   |                     |
|  +-----------+ +-----------+ +-------------+                     |
|  +-----------+ +-----------+ +-------------+                     |
|  | forge-    | | forge-    | | forge-      |                     |
|  | scrum     | | reviewer  | | qa          |                     |
|  +-----------+ +-----------+ +-------------+                     |
+------------------------------------------------------------------+
          |              |              |              |
          v              v              v              v
+------------------------------------------------------------------+
|                     SUPPORTING SYSTEMS                            |
|                                                                  |
|  +----------+  +----------+  +----------+  +----------+         |
|  |  Skills  |  |  Tools   |  | Plugins  |  |   MCP    |         |
|  |  (7)     |  |  (3+     |  |  (3)     |  | Servers  |         |
|  |          |  |  built-  |  |          |  |          |         |
|  |          |  |  in)     |  |          |  |          |         |
|  +----------+  +----------+  +----------+  +----------+         |
+------------------------------------------------------------------+
          |              |              |              |
          v              v              v              v
+------------------------------------------------------------------+
|                     ARTIFACT LAYER                                |
|                                                                  |
|  .forge/                                                         |
|  +-- constitution.md          (governance)                       |
|  +-- knowledge/               (persistent memory)                |
|  |   +-- adr/                                                    |
|  |   +-- decision-log.md                                         |
|  |   +-- lessons-learned.md                                      |
|  +-- product/                 (product-level docs)               |
|  +-- architecture/            (technical design)                 |
|  +-- specs/                   (feature specifications)           |
|  +-- epics/                   (epic & story breakdown)           |
|  +-- sprints/                 (sprint tracking)                  |
+------------------------------------------------------------------+
```

### 5.2 Context Flow

The progressive context chain ensures each phase receives the right upstream
documents:

```
Constitution ──────────────────────────────────────────────────────>
                                                                   |
Product Brief ──> PRD ──> Architecture ──> Epics ──> Stories ──>   |
                              |                          |         |
                              v                          v         v
                    Spec ──> Plan ──> Tasks ──────> Implementation
                     ^                                     |
                     |                                     v
                     +── Clarify                      Code Review
                     +── Analyze                           |
                                                           v
                                                     Knowledge Base
                                                    (ADR, Decisions,
                                                     Lessons Learned)
```

**Context loading rules** (enforced by the `context-chain` skill):

| Phase              | Required Context                                        |
| ------------------ | ------------------------------------------------------- |
| Specify / PRD      | Constitution, existing architecture (if any)            |
| Architecture       | Constitution, PRD/brief, existing ADRs                  |
| Plan               | Constitution, spec, architecture, relevant ADRs         |
| Analyze            | Spec, plan, architecture, constitution                  |
| Tasks              | Spec, plan                                              |
| Sprint Planning    | Epics, architecture, sprint history                     |
| Story Creation     | Epic, PRD, architecture, sprint status                  |
| Implementation     | Spec or story, plan or architecture, constitution       |
| Code Review        | Spec or story, architecture, implementation diff        |
| Retrospective      | Sprint status, stories (done), decision log             |

---

## 6. Component Inventory

### 6.1 Agents (9 total)

| Agent            | Type      | Model                        | Role                                  |
| ---------------- | --------- | ---------------------------- | ------------------------------------- |
| Build            | primary   | github-copilot/claude-sonnet-4.5  | Default development agent (OpenCode built-in) |
| Plan             | primary   | github-copilot/claude-sonnet-4.5  | Analysis/planning agent (OpenCode built-in)   |
| Forge            | primary   | github-copilot/claude-sonnet-4.5  | FORGE orchestrator, workflow router           |
| forge-analyst    | subagent  | github-copilot/claude-sonnet-4.5  | Exploration, research, scope detection        |
| forge-pm         | subagent  | github-copilot/claude-opus-4.6      | Requirements, specs, PRD, user stories        |
| forge-architect  | subagent  | github-copilot/claude-opus-4.6      | Architecture, ADRs, technical planning        |
| forge-scrum      | subagent  | github-copilot/claude-sonnet-4.5  | Sprint planning, story management, tracking   |
| forge-reviewer   | subagent  | github-copilot/claude-opus-4.6      | Adversarial review, cross-artifact validation |
| forge-qa         | subagent  | github-copilot/claude-sonnet-4.5  | Test strategy, test generation, coverage      |

### 6.2 Skills (7 total)

| Skill                     | Purpose                                                 | Primary Consumers         |
| ------------------------- | ------------------------------------------------------- | ------------------------- |
| adversarial-review        | Conduct reviews that MUST find real issues               | forge-reviewer            |
| advanced-elicitation      | Structured reasoning techniques for deeper analysis      | forge-pm, forge-architect |
| scope-detection           | Assess task complexity and recommend workflow track       | Forge orchestrator        |
| test-strategy             | Adaptive testing guidance based on track scale           | forge-qa, Build           |
| brownfield-analysis       | Analyze existing codebases for onboarding                | forge-analyst             |
| constitution-compliance   | Verify decisions/code against project constitution       | forge-architect, forge-reviewer |
| context-chain             | Load correct upstream documents for each workflow phase  | All forge agents          |

### 6.3 Commands (19 total)

| Command              | Track         | Phase          | Invoked Agent     |
| -------------------- | ------------- | -------------- | ----------------- |
| `/forge-init`        | Product       | Setup          | Forge             |
| `/forge-brief`       | Epic/Product  | Analysis       | forge-analyst     |
| `/forge-specify`     | Feature+      | Specify        | forge-pm          |
| `/forge-clarify`     | Feature+      | Clarify        | forge-pm          |
| `/forge-prd`         | Epic/Product  | Planning       | forge-pm          |
| `/forge-architecture`| Epic/Product  | Solutioning    | forge-architect   |
| `/forge-plan`        | Feature+      | Planning       | forge-architect   |
| `/forge-analyze`     | Feature+      | Validation     | forge-reviewer    |
| `/forge-tasks`       | Feature+      | Breakdown      | forge-scrum       |
| `/forge-sprint`      | Epic/Product  | Sprint Mgmt    | forge-scrum       |
| `/forge-story`       | Epic/Product  | Sprint Mgmt    | forge-scrum       |
| `/forge-implement`   | All           | Implementation | Build             |
| `/forge-review`      | All           | Review         | forge-reviewer    |
| `/forge-hotfix`      | Hotfix        | All-in-one     | Build             |
| `/forge-quick`       | Quick         | All-in-one     | forge-pm -> Build |
| `/forge-adr`         | Any           | Knowledge      | forge-architect   |
| `/forge-retro`       | Epic/Product  | Retrospective  | forge-scrum       |
| `/forge-status`      | Any           | Status         | forge-scrum       |
| `/forge-help`        | Any           | Help           | Forge             |

### 6.4 Document Templates (8 total)

| Template             | File                               | Produced By       | Used In Track       |
| -------------------- | ---------------------------------- | ----------------- | ------------------- |
| Constitution         | `templates/constitution.md`        | forge-pm          | Product             |
| Product Brief        | `templates/product-brief.md`       | forge-analyst     | Epic, Product       |
| PRD                  | `templates/prd.md`                 | forge-pm          | Epic, Product       |
| Spec                 | `templates/spec.md`                | forge-pm          | Feature, Epic       |
| Architecture         | `templates/architecture.md`        | forge-architect   | Epic, Product       |
| Plan                 | `templates/plan.md`                | forge-architect   | Feature, Epic       |
| Tasks                | `templates/tasks.md`               | forge-scrum       | Quick, Feature, Epic|
| Story                | `templates/story.md`               | forge-scrum       | Epic, Product       |
| Tech Spec (light)    | `templates/tech-spec.md`           | forge-pm          | Quick               |
| ADR                  | `templates/adr.md`                 | forge-architect   | Any                 |
| Sprint Status        | `templates/sprint-status.yaml`     | forge-scrum       | Epic, Product       |

### 6.5 Custom Tools (3 total)

| Tool                | Input                    | Output                      | Purpose                         |
| ------------------- | ------------------------ | --------------------------- | ------------------------------- |
| validate-spec       | Path to spec.md          | Validation report            | Check completeness, flag gaps   |
| trace-requirements  | Spec ID or path          | Traceability matrix          | Map requirements to code/tests  |
| sprint-status       | None (reads YAML)        | Text dashboard               | Sprint progress visualization   |

### 6.6 Plugins (3 total)

| Plugin              | Events Subscribed                    | Purpose                                    |
| ------------------- | ------------------------------------ | ------------------------------------------ |
| pre-commit-gate     | `file.edited`, `session.diff`        | Validate spec-code consistency before commit|
| session-knowledge   | `session.idle`, `session.compacted`  | Extract decisions and lessons to knowledge base |
| spec-watcher        | `file.edited`                        | Monitor spec changes, flag inconsistencies  |

### 6.7 MCP Servers (1 total)

| Server  | Type  | Purpose                                                 |
| ------- | ----- | ------------------------------------------------------- |
| GitHub  | local | Issue creation, PR management, CI status, traceability  |

---

## 7. Multi-Track Workflow System

### 7.1 Track Overview

```
Complexity ──────────────────────────────────────────────> High
                                                           
  Hotfix         Quick        Feature        Epic        Product
  ──────        ──────       ─────────      ──────      ─────────
  1 file        1-5 tasks    5-20 tasks    20-50+      New product
  < 30 min      < 1 day      1-5 days      1-4 weeks   4+ weeks
                                                           
  Diagnose      Spec         Specify        Brief       Constitution
  Fix           Implement    Clarify        PRD         Brief
  Review        Review       Plan           Architect   PRD
                             Analyze        Epics       UX Spec
                             Tasks          Stories     Architect
                             Implement      Sprint      Epics
                             Review         Implement   Stories
                                            Review      Sprint
                                            Retro       Implement
                                                        Review
                                                        Retro
```

### 7.2 Track: Hotfix

**When**: Critical bug, single-file or two-file fix, under 30 minutes.

**Workflow**:
```
/forge-hotfix "description of the bug"
  1. Diagnose: Identify root cause via codebase exploration
  2. Fix: Apply minimal, targeted fix
  3. Verify: Run existing tests, confirm no regression
  4. Review: Quick self-review against constitution
  5. Output: Structured commit message with root cause and fix description
```

**Documents produced**: None. The commit message serves as documentation.

**Scope guard**: If the agent determines the fix requires more than 2 files or
architectural changes, it escalates to Quick or Feature track.

### 7.3 Track: Quick

**When**: Small bug fix or feature, 1-5 tasks, clear scope, under 1 day.

**Workflow**:
```
/forge-quick "description"
  1. Quick Spec: Conversational discovery -> tech-spec.md (lightweight)
  2. Implement: Build from spec, task by task
  3. Test: Generate tests per test-strategy skill (unit tests minimum)
  4. Review: Adversarial self-review
  5. Output: .forge/specs/NNN-name/tech-spec.md + code + tests
```

**Documents produced**: `tech-spec.md` (lightweight, single file).

**Scope guard**: If scope detection identifies > 5 tasks, escalate to Feature.

### 7.4 Track: Feature

**When**: Medium feature, 5-20 tasks, may touch multiple modules, 1-5 days.

**Workflow**:
```
/forge-specify "feature description"
  -> forge-pm creates spec.md with requirements, user stories, acceptance criteria
  
/forge-clarify
  -> forge-pm surfaces ambiguities, asks targeted questions, updates spec

/forge-plan
  -> forge-architect creates plan.md with technical approach, data model, API contracts

/forge-analyze
  -> forge-reviewer cross-validates spec vs plan vs architecture vs constitution

/forge-tasks
  -> forge-scrum generates dependency-ordered tasks.md with parallelism markers

/forge-implement
  -> Build agent implements task by task, using todowrite to track progress

/forge-review
  -> forge-reviewer conducts adversarial review
  -> Human review follows
```

**Documents produced**: `spec.md`, `plan.md`, `tasks.md` (plus optional ADRs).

### 7.5 Track: Epic

**When**: Complex feature or feature set, 20-50+ tasks, multi-week effort.

**Workflow**:
```
/forge-brief
  -> forge-analyst creates product brief with vision and scope assessment

/forge-prd
  -> forge-pm creates full PRD with personas, requirements, metrics, risks

/forge-architecture
  -> forge-architect creates architecture.md with ADRs for key decisions

/forge-analyze
  -> forge-reviewer validates cohesion across PRD + architecture

[Then, for each epic:]

/forge-sprint
  -> forge-scrum initializes sprint, selects stories from backlog

/forge-story
  -> forge-scrum prepares next story with implementation guidance

/forge-implement
  -> Build agent implements the story

/forge-review
  -> Dual review (AI adversarial + human)

/forge-retro
  -> forge-scrum conducts sprint retrospective -> lessons learned
```

**Documents produced**: `brief.md`, `prd.md`, `architecture.md`, `epic-NN/*.md`,
`story-NNN.md`, `sprint-status.yaml`, ADRs.

### 7.6 Track: Product

**When**: New product or platform, greenfield, 4+ weeks.

**Workflow**: Same as Epic, plus:

```
/forge-init
  -> Sets up .forge/ directory structure
  -> Creates constitution.md through guided discovery
  -> Generates AGENTS.md from project scan
  -> Configures opencode.json with FORGE defaults
```

And an additional UX spec phase after PRD if the product has a user interface.

### 7.7 Scope Detection Algorithm

The `scope-detection` skill evaluates:

| Factor               | Hotfix (1) | Quick (2) | Feature (3) | Epic (4) | Product (5) |
| -------------------- | ---------- | --------- | ----------- | -------- | ----------- |
| Files affected        | 1-2        | 2-5       | 5-15        | 15-50    | 50+         |
| Estimated tasks       | 1          | 2-5       | 5-20        | 20-50    | 50+         |
| New dependencies      | 0          | 0-1       | 1-3         | 3+       | Stack decision |
| Schema changes        | No         | Minor     | Moderate    | Significant | Full design |
| API surface changes   | No         | No        | Yes         | Yes      | Yes         |
| Cross-module impact   | No         | No        | Maybe       | Yes      | Yes         |
| Needs new patterns    | No         | No        | Maybe       | Likely   | Yes         |

The skill outputs a structured JSON with the recommended track and the reasoning
behind the recommendation. The user always has the final say.

---

## 8. Agent Architecture

### 8.1 Design Principles

1. **Real subagents, not personas**: Unlike BMAD's persona switching within a
   single LLM session, FORGE uses OpenCode's native subagent system. Each
   subagent is a separate invocation with its own system prompt, model, and tool
   permissions.

2. **Model differentiation by cognitive demand**: Tasks requiring deep
   reasoning (architecture, requirements analysis, adversarial review) use
   Claude Opus 4.6. Tasks requiring speed and good-enough reasoning (analysis,
   sprint management, test generation) use Claude Sonnet 4.5. Both models
   are provided via GitHub Copilot.

3. **Minimal tool permissions**: Each agent gets only the tools it needs.
   The analyst cannot write files. The reviewer cannot edit code. This prevents
   agents from overstepping their role.

4. **Skill-based expertise**: Instead of encoding all expertise in the system
   prompt (which wastes context window), agents load skills on demand. A
   reviewer loads `adversarial-review` only when reviewing; an architect loads
   `constitution-compliance` only when making decisions.

### 8.2 Agent: Forge (Orchestrator)

**Mode**: Primary
**Model**: github-copilot/claude-sonnet-4.5
**Purpose**: Entry point for all FORGE workflows. Routes to the correct track,
invokes the right subagents, and ensures context is properly chained.

**Key behaviors**:
- Assesses complexity and recommends a track before starting
- Loads upstream documents and passes them to subagents
- Summarizes each phase's output and suggests the next step
- Never implements code directly (delegates to Build or subagents)

**Tools**: task, skill, read, glob, grep, question, write, edit, todowrite, todoread

### 8.3 Agent: forge-analyst

**Mode**: Subagent
**Model**: github-copilot/claude-sonnet-4.5
**Purpose**: Exploration, research, scope detection, brownfield analysis.

**Key behaviors**:
- Explores codebases without modifying them (read-only)
- Produces product briefs for Epic/Product tracks
- Assesses existing codebase structure for brownfield projects
- Uses `scope-detection` and `brownfield-analysis` skills

**Tools**: read, grep, glob, webfetch, websearch, skill

### 8.4 Agent: forge-pm

**Mode**: Subagent
**Model**: github-copilot/claude-opus-4.6
**Purpose**: Requirements definition, specification creation, PRD authoring.

**Key behaviors**:
- Engages users in structured requirements discovery
- Uses `advanced-elicitation` skill for deeper analysis
- Produces specs with `[NEEDS CLARIFICATION]` markers for ambiguities
- Validates specs against constitution using `constitution-compliance` skill
- Writes specs, PRDs, and tech-specs to `.forge/` directory

**Tools**: read, write, edit, glob, grep, skill, question

### 8.5 Agent: forge-architect

**Mode**: Subagent
**Model**: github-copilot/claude-opus-4.6
**Purpose**: Technical architecture, ADR creation, planning.

**Key behaviors**:
- Makes architectural decisions explicit with rationale
- Produces ADRs for significant decisions
- Creates technical plans with data models, API contracts, component design
- Checks existing ADRs before making new decisions (avoids contradictions)
- Uses `constitution-compliance` and `advanced-elicitation` skills

**Tools**: read, write, edit, glob, grep, skill, question, webfetch

### 8.6 Agent: forge-scrum

**Mode**: Subagent
**Model**: github-copilot/claude-sonnet-4.5
**Purpose**: Sprint planning, story management, progress tracking, retrospectives.

**Key behaviors**:
- Breaks specs into dependency-ordered tasks with parallelism markers
- Manages sprint-status.yaml
- Creates story files with acceptance criteria and implementation guidance
- Conducts retrospectives and records lessons learned
- Tracks velocity across sprints

**Tools**: read, write, edit, glob, grep, skill

### 8.7 Agent: forge-reviewer

**Mode**: Subagent
**Model**: github-copilot/claude-opus-4.6
**Purpose**: Adversarial code review, spec validation, cross-artifact analysis.

**Key behaviors**:
- MUST find issues (no "looks good" allowed)
- Reviews across 5 dimensions: correctness, security, performance, maintainability, constitution compliance
- Cross-validates consistency between spec, plan, architecture, and code
- Outputs structured issue reports with severity, file, line, suggestion
- Uses `adversarial-review` and `constitution-compliance` skills

**Tools**: read, glob, grep, skill, bash (restricted to read-only commands)

### 8.8 Agent: forge-qa

**Mode**: Subagent
**Model**: github-copilot/claude-sonnet-4.5
**Purpose**: Test strategy definition, test generation, coverage analysis.

**Key behaviors**:
- Determines appropriate test depth based on track (Hotfix = regression only,
  Quick = unit, Feature = unit + integration, Epic+ = unit + integration + e2e)
- Generates test files following project conventions
- Analyzes coverage gaps
- Uses `test-strategy` skill

**Tools**: read, write, edit, glob, grep, bash, skill

---

## 9. Document Chain & Templates

### 9.1 Document Hierarchy

```
constitution.md                     (immutable governance - Product track only)
  |
  +-- product/brief.md             (strategic vision - Epic/Product)
  |     |
  |     +-- product/prd.md         (full requirements - Epic/Product)
  |     |     |
  |     |     +-- product/ux-spec.md  (UX design - Product, optional)
  |     |
  |     +-- architecture/architecture.md  (technical design - Epic/Product)
  |           |
  |           +-- knowledge/adr/*.md      (decision records - any track)
  |
  +-- specs/NNN-name/              (per-feature specs - Feature/Epic)
  |     +-- spec.md                (requirements)
  |     +-- plan.md                (technical plan)
  |     +-- tasks.md               (ordered task list)
  |
  +-- specs/NNN-name/              (lightweight specs - Quick track)
  |     +-- tech-spec.md           (combined spec + tasks)
  |
  +-- epics/epic-NN-name/          (epic breakdown - Epic/Product)
  |     +-- epic.md                (epic description)
  |     +-- story-NNN-slug.md      (individual stories)
  |
  +-- sprints/                     (sprint tracking - Epic/Product)
  |     +-- sprint-status.yaml     (current state)
  |     +-- retrospectives/*.md    (sprint retros)
  |
  +-- knowledge/                   (persistent memory - all tracks)
        +-- adr/*.md               (architectural decision records)
        +-- decision-log.md        (session-extracted decisions)
        +-- lessons-learned.md     (post-mortem insights)
```

### 9.2 Template Specifications

Each template is defined in `.opencode/templates/` and includes:

- **Required fields**: Fields that MUST be filled before the document is
  considered complete.
- **Validation rules**: What `validate-spec` checks for (e.g., every user story
  must have acceptance criteria).
- **Constitution compliance section**: Every document that makes or implies
  technical decisions must include a constitution compliance check.
- **Cross-reference fields**: Links to upstream and downstream documents for
  traceability.

Full template contents are specified in the implementation phases below and
delivered as part of Phase 3.

---

## 10. Commands

### 10.1 Command Design Principles

1. **Predictable naming**: All FORGE commands use the `forge-` prefix.
2. **Self-documenting**: Each command explains what it does and what inputs
   it needs via the `question` tool.
3. **Context-aware**: Commands load the `context-chain` skill to determine
   which upstream documents to include.
4. **Scope-guarded**: Commands that start a workflow check whether the user
   is in the right track and suggest alternatives if not.
5. **Idempotent where possible**: Running `/forge-status` or `/forge-analyze`
   multiple times produces consistent results without side effects.

### 10.2 Command Specifications

Each command is defined as a markdown file in `.opencode/commands/` with:

```yaml
---
description: "Brief description shown in autocomplete"
agent: "which agent handles this"     # optional, defaults to forge
subtask: true/false                   # optional, force subagent execution
model: "provider/model-id"           # optional, override model
---

[Template content with $ARGUMENTS, $1, $2, @file references, !`shell` injections]
```

### 10.3 Command Flow Diagrams

**Feature Track** (most common workflow):

```
 /forge-specify         /forge-clarify         /forge-plan
 "add user auth"        (review spec)          (technical plan)
       |                      |                      |
       v                      v                      v
  [forge-pm]  --------> [forge-pm]  --------> [forge-architect]
       |                      |                      |
       v                      v                      v
  spec.md               spec.md (updated)      plan.md + ADRs
                                                     |
                                                     v
 /forge-analyze         /forge-tasks           /forge-implement
 (validate all)         (task breakdown)       (build it)
       |                      |                      |
       v                      v                      v
  [forge-reviewer]      [forge-scrum]          [Build agent]
       |                      |                      |
       v                      v                      v
  Consistency report    tasks.md               Working code + tests
                                                     |
                                                     v
                                               /forge-review
                                               (adversarial review)
                                                     |
                                                     v
                                               [forge-reviewer]
                                                     |
                                                     v
                                               Issue report ->
                                               Human review ->
                                               Merge
```

---

## 11. Skills

### 11.1 Skill Design Principles

1. **On-demand loading**: Skills are loaded via the `skill` tool only when
   needed. This conserves context window.
2. **Composable**: Agents can load multiple skills in a single session.
3. **Overridable**: Project-level skills override global skills of the same name.
4. **Self-contained**: Each skill includes all instructions needed; it does not
   depend on other skills being loaded simultaneously.

### 11.2 Skill Specifications

#### adversarial-review

**Purpose**: Instruct the agent to conduct reviews that MUST find real issues.

**Contents**:
- 5 review dimensions (correctness, security, performance, maintainability, constitution)
- Structured output format (severity, dimension, file, line, issue, suggestion)
- Minimum issue count requirement (at least 3)
- Anti-sycophancy instructions
- Escalation criteria for blocking vs non-blocking issues

#### advanced-elicitation

**Purpose**: Structured second-pass analysis using named reasoning techniques.

**Contents**:
- 6 techniques: Pre-mortem Analysis, First Principles Thinking, Red Team/Blue
  Team, Socratic Questioning, Constraint Removal, Inversion Analysis
- Selection guidance: which technique fits which situation
- Instructions: after initial output, suggest 3 relevant techniques and let the
  user choose

#### scope-detection

**Purpose**: Assess task complexity and recommend a workflow track.

**Contents**:
- 7-factor evaluation matrix (files, tasks, dependencies, schema, API, cross-module, patterns)
- Scoring algorithm
- Structured JSON output format
- Escalation/de-escalation guidance
- Instruction to always present recommendation with reasoning to the user

#### test-strategy

**Purpose**: Adaptive testing guidance based on track scale.

**Contents**:
- Track-specific test requirements:
  - Hotfix: regression test for the bug only
  - Quick: unit tests for new/changed code
  - Feature: unit + integration tests
  - Epic/Product: unit + integration + e2e + performance benchmarks
- Framework-specific guidance (Jest/Vitest for TS, pytest for Python)
- Coverage threshold guidance
- Test naming conventions
- Mocking strategy

#### brownfield-analysis

**Purpose**: Structured approach for analyzing existing codebases.

**Contents**:
- Dependency mapping protocol
- Architecture discovery steps
- Tech debt assessment framework
- Integration point identification
- Convention extraction (naming, structure, patterns)
- Output: structured report suitable for constitution bootstrapping

#### constitution-compliance

**Purpose**: Verify decisions and code against the project constitution.

**Contents**:
- Article-by-article verification checklist
- Compliance report format
- Handling constitutional amendments
- Tension resolution when a decision conflicts with multiple articles

#### context-chain

**Purpose**: Determine and load correct upstream documents for current phase.

**Contents**:
- Phase-to-document mapping table
- File path resolution logic
- Handling missing documents (warn but don't block)
- Context window budget guidance (how much of each doc to include)

---

## 12. Custom Tools

### 12.1 validate-spec

**File**: `.opencode/tools/validate-spec.ts`

**Input**: `{ specPath: string }` (path to a spec.md or tech-spec.md)

**Output**: Structured validation report with:
- Completeness score (0-100%)
- List of empty required fields
- Count of `[NEEDS CLARIFICATION]` markers
- User stories without acceptance criteria
- Non-functional requirements without measurable metrics
- Missing constitution compliance section
- Missing cross-references to upstream documents

**Usage**: Invoked by `/forge-analyze` and by the `pre-commit-gate` plugin.

### 12.2 trace-requirements

**File**: `.opencode/tools/trace-requirements.ts`

**Input**: `{ specId: string }` or `{ specPath: string }`

**Output**: Traceability matrix:
```
Requirement FR-001 -> Plan Section 3.2 -> Task 2.1 -> src/auth/login.ts -> src/auth/__tests__/login.test.ts
Requirement FR-002 -> Plan Section 3.3 -> Task 3.1 -> [NOT IMPLEMENTED]
Requirement NFR-001 -> [NO TASK] -> [NOT IMPLEMENTED]
```

**Usage**: Invoked by `/forge-analyze` and on-demand by any agent.

### 12.3 sprint-status

**File**: `.opencode/tools/sprint-status.ts`

**Input**: None (reads `.forge/sprints/sprint-status.yaml`)

**Output**: Text dashboard:
```
Sprint 3 | Goal: Complete OAuth2 integration
Progress: ████████░░ 8/10 stories (80%)
Velocity: 34 pts (avg: 28 pts)

  Done (8):     E01-S001 Login [5pt] ✓
                E01-S002 Register [8pt] ✓
                ...
  In Progress:  E01-S009 Token Refresh [5pt]
  Blocked:      E01-S010 SSO Integration [8pt] - waiting on IdP config
```

**Usage**: Invoked by `/forge-status` and `/forge-sprint`.

---

## 13. Plugins

### 13.1 pre-commit-gate

**File**: `.opencode/plugins/pre-commit-gate.ts`

**Events**: `file.edited`, `session.diff`

**Behavior**:
1. When files are edited, identify which spec/story they relate to (via
   `tasks.md` file path mappings)
2. Before session produces a diff suitable for committing:
   - Check that related tasks in `tasks.md` are marked complete
   - Check that tests exist for new/modified source files
   - Check that no `[NEEDS CLARIFICATION]` markers exist in related specs
   - Check that the spec's constitution compliance section is verified
3. If violations found: show toast notification with specific issues
4. Does NOT block the commit (advisory only), but provides a clear signal

### 13.2 session-knowledge

**File**: `.opencode/plugins/session-knowledge.ts`

**Events**: `session.idle`, `experimental.session.compacting`

**Behavior**:
1. On `session.idle` (session ends or goes idle):
   - Scan the conversation for architectural decisions, technology choices,
     pattern selections
   - Append structured entries to `.forge/knowledge/decision-log.md`
   - If the session involved errors, rollbacks, or significant debugging,
     extract lessons and append to `.forge/knowledge/lessons-learned.md`
2. On `experimental.session.compacting` (context compaction):
   - Inject the last 10 decisions from `decision-log.md` as context
   - Inject the last 5 lessons from `lessons-learned.md` as context
   - This ensures persistent knowledge survives context compaction

### 13.3 spec-watcher

**File**: `.opencode/plugins/spec-watcher.ts`

**Events**: `file.edited`

**Behavior**:
1. When a file in `.forge/specs/` is modified, check if a corresponding
   `plan.md` and/or `tasks.md` exists
2. If they exist, perform a lightweight consistency check:
   - Did the spec add new requirements not covered in the plan?
   - Did the spec remove requirements that the plan still references?
3. If inconsistencies detected: show toast suggesting `/forge-analyze`

---

## 14. Rules & Governance

### 14.1 AGENTS.md

Generated by `/forge-init`, the project-level `AGENTS.md` contains:

- Project overview and purpose
- Technology stack and versions
- Code conventions (naming, file structure, import ordering)
- Git workflow (branch naming: `feat/`, `fix/`, `hotfix/`; commit format:
  conventional commits; PR template reference)
- Testing requirements (minimum coverage, required test types)
- Reference to constitution: "All architectural decisions must comply with
  `.forge/constitution.md`"
- Reference to knowledge base: "Before making architectural decisions, check
  `.forge/knowledge/adr/` for existing decisions"
- Reference to decision log: "Key decisions are recorded in
  `.forge/knowledge/decision-log.md`"

### 14.2 Constitution

The constitution (`.forge/constitution.md`) is the highest-authority governance
document. It is created during `/forge-init` for Product track projects and
can be added to any project at any time via `/forge-init --constitution`.

**Key properties**:
- Immutable except through formal amendment process
- All agents reference it for decision validation
- Changes require explicit rationale and are logged in the Amendments Log
- Loaded as instruction via `opencode.json` so it is always in context

### 14.3 Knowledge Base

The persistent knowledge base (`.forge/knowledge/`) accumulates over time:

| Artifact             | Source                                      | Purpose                            |
| -------------------- | ------------------------------------------- | ---------------------------------- |
| `adr/*.md`           | Created by `/forge-adr` or forge-architect  | Record significant decisions       |
| `decision-log.md`    | Auto-extracted by session-knowledge plugin  | Capture session-level decisions    |
| `lessons-learned.md` | Auto-extracted + `/forge-retro` output      | Prevent repeating mistakes         |

### 14.4 Instructions Configuration

```json
{
  "instructions": [
    ".forge/constitution.md",
    ".forge/knowledge/decision-log.md"
  ]
}
```

This ensures the constitution and recent decisions are always loaded into the
agent's context, regardless of which agent or command is invoked.

---

## 15. MCP Integrations

### 15.1 GitHub MCP Server

**Configuration**:
```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  }
}
```

**Use cases**:
- `/forge-sprint`: Create GitHub issues from stories
- `/forge-review`: Create PR with body generated from spec/story
- `/forge-status`: Read CI/CD check status
- `/forge-implement`: Link commits to issues via conventional commit refs
- `/forge-adr`: Link ADRs to relevant issues/PRs

### 15.2 Future MCP Integrations (not in scope, documented for customization)

| Server          | Purpose                                      |
| --------------- | -------------------------------------------- |
| Jira/Linear     | External project management sync             |
| Supabase/DB     | Schema introspection for brownfield analysis |
| Sentry          | Error context for hotfix diagnosis           |
| Figma           | UX spec integration                          |

---

## 16. Model Strategy

### 16.1 Model Assignment

| Agent / Role        | Model                       | Rationale                               |
| ------------------- | --------------------------- | --------------------------------------- |
| Forge orchestrator  | github-copilot/claude-sonnet-4.5 | Fast routing, moderate reasoning        |
| forge-analyst       | github-copilot/claude-sonnet-4.5 | Exploration speed, good synthesis        |
| forge-pm            | github-copilot/claude-opus-4.6     | Deep requirements analysis              |
| forge-architect     | github-copilot/claude-opus-4.6     | Complex technical reasoning             |
| forge-scrum         | github-copilot/claude-sonnet-4.5 | Structured breakdown, speed             |
| forge-reviewer      | github-copilot/claude-opus-4.6     | Thorough adversarial analysis           |
| forge-qa            | github-copilot/claude-sonnet-4.5 | Test generation, speed                  |
| Build (default)     | github-copilot/claude-sonnet-4.5 | Implementation speed, cost efficiency   |

### 16.2 Thinking Budget Configuration

```json
{
  "provider": {
    "github-copilot": {
      "models": {
        "claude-opus-4.6": {
          "options": {
            "thinking": { "budgetTokens": 16000 }
          }
        },
        "claude-sonnet-4.5": {
          "options": {
            "thinking": { "budgetTokens": 8000 }
          }
        }
      }
    }
  }
}
```

### 16.3 Cost Optimization

- Opus 4.6 is used only for 3 agents (PM, Architect, Reviewer) that require deep
  reasoning and produce high-impact artifacts.
- Sonnet 4.5 is used for 4 agents (Analyst, Scrum, QA, Orchestrator) and all
  implementation work, keeping costs manageable.
- Both models are provided via GitHub Copilot.
- Skills are loaded on-demand to minimize context window consumption.
- The `context-chain` skill includes guidance on how much of each upstream
  document to include, preventing unnecessary token usage.

---

## 17. Directory Structure

### 17.1 FORGE System Files (`.opencode/`)

```
.opencode/
├── agents/
│   ├── forge.md                    # Orchestrator agent
│   ├── forge-analyst.md            # Exploration & research
│   ├── forge-pm.md                 # Product management
│   ├── forge-architect.md          # Architecture & ADRs
│   ├── forge-scrum.md              # Sprint & story management
│   ├── forge-reviewer.md           # Adversarial review
│   └── forge-qa.md                 # Testing strategy
├── commands/
│   ├── forge-init.md               # Initialize project
│   ├── forge-brief.md              # Create product brief
│   ├── forge-specify.md            # Create feature spec
│   ├── forge-clarify.md            # Clarify spec ambiguities
│   ├── forge-prd.md                # Create PRD
│   ├── forge-architecture.md       # Create architecture doc
│   ├── forge-plan.md               # Create technical plan
│   ├── forge-analyze.md            # Cross-artifact validation
│   ├── forge-tasks.md              # Generate task breakdown
│   ├── forge-sprint.md             # Sprint planning
│   ├── forge-story.md              # Prepare story for implementation
│   ├── forge-implement.md          # Implement from spec/story
│   ├── forge-review.md             # Adversarial code review
│   ├── forge-hotfix.md             # Hotfix workflow
│   ├── forge-quick.md              # Quick track workflow
│   ├── forge-adr.md                # Create/update ADR
│   ├── forge-retro.md              # Sprint retrospective
│   ├── forge-status.md             # Sprint status dashboard
│   └── forge-help.md               # Context-aware help
├── skills/
│   ├── adversarial-review/
│   │   └── SKILL.md
│   ├── advanced-elicitation/
│   │   └── SKILL.md
│   ├── scope-detection/
│   │   └── SKILL.md
│   ├── test-strategy/
│   │   └── SKILL.md
│   ├── brownfield-analysis/
│   │   └── SKILL.md
│   ├── constitution-compliance/
│   │   └── SKILL.md
│   └── context-chain/
│       └── SKILL.md
├── tools/
│   ├── validate-spec.ts
│   ├── trace-requirements.ts
│   └── sprint-status.ts
├── plugins/
│   ├── pre-commit-gate.ts
│   ├── session-knowledge.ts
│   └── spec-watcher.ts
├── templates/
│   ├── constitution.md
│   ├── product-brief.md
│   ├── prd.md
│   ├── spec.md
│   ├── tech-spec.md
│   ├── architecture.md
│   ├── plan.md
│   ├── tasks.md
│   ├── story.md
│   ├── adr.md
│   ├── ux-spec.md
│   └── sprint-status.yaml
└── docs/
    ├── FORGE-PROJECT-PLAN.md       # This document
    ├── FORGE-GUIDE.md              # Usage guide with examples
    ├── FORGE-PHILOSOPHY.md         # Philosophy & benefits
    ├── FORGE-DECISIONS.md          # Design decisions & comparisons
    └── FORGE-CUSTOMIZATION.md      # Customization guide
```

### 17.2 Project Artifact Output (`.forge/`)

```
.forge/
├── constitution.md
├── knowledge/
│   ├── adr/
│   │   ├── 001-database-choice.md
│   │   ├── 002-auth-strategy.md
│   │   └── ...
│   ├── decision-log.md
│   └── lessons-learned.md
├── product/
│   ├── brief.md
│   ├── prd.md
│   └── ux-spec.md
├── architecture/
│   ├── architecture.md
│   └── diagrams/
├── specs/
│   ├── 001-user-authentication/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   └── tasks.md
│   ├── 002-payment-processing/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   └── tasks.md
│   └── ...
├── epics/
│   ├── epic-01-core-auth/
│   │   ├── epic.md
│   │   ├── story-001-login.md
│   │   ├── story-002-registration.md
│   │   └── ...
│   └── ...
└── sprints/
    ├── sprint-status.yaml
    └── retrospectives/
        ├── sprint-01-retro.md
        └── ...
```

---

## 18. Implementation Phases

### Phase 0: Documentation (Days 1-3)

**Objective**: Create the four foundational documents that serve as both user
guides and internal specifications for implementation.

| #   | Deliverable                | Description                                               |
| --- | -------------------------- | --------------------------------------------------------- |
| 0.1 | `FORGE-GUIDE.md`           | Complete usage guide with examples for all 5 tracks, team workflows, command reference, brownfield onboarding |
| 0.2 | `FORGE-PHILOSOPHY.md`      | Philosophy, core principles, benefits by audience (dev, team, enterprise), when NOT to use FORGE |
| 0.3 | `FORGE-DECISIONS.md`       | Every design decision with rationale, BMAD vs Speckit vs FORGE comparison tables, what was excluded and why |
| 0.4 | `FORGE-CUSTOMIZATION.md`   | How to customize every aspect: agents, commands, skills, templates, constitution, tracks, models, plugins, MCP |

**Exit criteria**: All 4 documents written, reviewed for completeness and
internal consistency.

### Phase 1: Foundation (Day 4)

**Objective**: Set up the project structure, configuration, and governance base.

| #   | Deliverable                | Description                                               |
| --- | -------------------------- | --------------------------------------------------------- |
| 1.1 | Directory structure        | Create `.opencode/` and `.forge/` directory trees          |
| 1.2 | `opencode.json`            | Full configuration with model strategy, permissions, MCP, instructions |
| 1.3 | `AGENTS.md`                | Project rules template with FORGE-specific sections        |
| 1.4 | `.forge/constitution.md`   | Initial constitution template (to be customized per project) |
| 1.5 | `.forge/knowledge/`        | Initialize decision-log.md and lessons-learned.md          |

**Exit criteria**: Running `opencode` in the project directory loads the
configuration without errors.

### Phase 2: Core Agents (Days 5-6)

**Objective**: Implement the 4 highest-priority agents.

| #   | Deliverable                | Description                                               |
| --- | -------------------------- | --------------------------------------------------------- |
| 2.1 | `agents/forge.md`          | Orchestrator with track selection, context loading, subagent routing |
| 2.2 | `agents/forge-pm.md`       | Product manager with requirements discovery, spec/PRD authoring |
| 2.3 | `agents/forge-architect.md`| Architect with ADR creation, technical planning, constitution checks |
| 2.4 | `agents/forge-reviewer.md` | Reviewer with adversarial review protocol, cross-validation |

**Exit criteria**: Each agent responds correctly to a test prompt with
appropriate behavior and tool usage.

### Phase 3: Document Templates (Day 7)

**Objective**: Create all document templates.

| #   | Deliverable                | Description                                               |
| --- | -------------------------- | --------------------------------------------------------- |
| 3.1 | `templates/constitution.md`| 9 articles with placeholders and amendment log             |
| 3.2 | `templates/product-brief.md`| Vision, problem, scope, stakeholders                      |
| 3.3 | `templates/prd.md`         | Full PRD with personas, requirements, metrics, risks       |
| 3.4 | `templates/spec.md`        | Feature spec with user stories, acceptance criteria, NFRs  |
| 3.5 | `templates/tech-spec.md`   | Lightweight spec for Quick track                           |
| 3.6 | `templates/architecture.md`| System design, patterns, component diagram, ADR refs       |
| 3.7 | `templates/plan.md`        | Technical plan with data model, API, file map              |
| 3.8 | `templates/tasks.md`       | Ordered tasks with parallelism markers and story refs      |
| 3.9 | `templates/story.md`       | Story with acceptance criteria, tasks, DoD                 |
| 3.10| `templates/adr.md`         | Decision record with options, consequences, compliance     |
| 3.11| `templates/sprint-status.yaml` | Sprint tracking template                              |

**Exit criteria**: Each template is syntactically valid, contains all required
sections, and cross-references are consistent.

### Phase 4: Commands (Days 8-9)

**Objective**: Implement all 19 slash commands.

| #   | Deliverable                | Description                                               |
| --- | -------------------------- | --------------------------------------------------------- |
| 4.1 | Workflow commands (12)     | forge-init, forge-brief, forge-specify, forge-clarify, forge-prd, forge-architecture, forge-plan, forge-analyze, forge-tasks, forge-sprint, forge-story, forge-implement |
| 4.2 | Review commands (1)        | forge-review                                               |
| 4.3 | Track shortcuts (2)        | forge-hotfix, forge-quick                                  |
| 4.4 | Knowledge commands (1)     | forge-adr                                                  |
| 4.5 | Management commands (3)    | forge-retro, forge-status, forge-help                      |

**Exit criteria**: Each command triggers the correct agent, loads appropriate
context, and produces the expected output type.

### Phase 5: Skills (Days 10-11)

**Objective**: Implement all 7 skills.

| #   | Deliverable                         | Description                                    |
| --- | ----------------------------------- | ---------------------------------------------- |
| 5.1 | `skills/adversarial-review/`        | Review protocol with 5 dimensions              |
| 5.2 | `skills/advanced-elicitation/`      | 6 reasoning techniques                         |
| 5.3 | `skills/scope-detection/`           | 7-factor complexity assessment                 |
| 5.4 | `skills/test-strategy/`             | Track-adaptive testing guidance                |
| 5.5 | `skills/brownfield-analysis/`       | Existing codebase analysis protocol            |
| 5.6 | `skills/constitution-compliance/`   | Article-by-article verification                |
| 5.7 | `skills/context-chain/`             | Phase-to-document mapping                      |

**Exit criteria**: Each skill loads correctly via the `skill` tool and provides
relevant, actionable instructions.

### Phase 6: Support Agents (Day 12)

**Objective**: Implement the 3 remaining subagents.

| #   | Deliverable                | Description                                               |
| --- | -------------------------- | --------------------------------------------------------- |
| 6.1 | `agents/forge-analyst.md`  | Exploration, research, scope detection, brownfield analysis |
| 6.2 | `agents/forge-scrum.md`    | Sprint planning, story management, retrospectives          |
| 6.3 | `agents/forge-qa.md`       | Test strategy, generation, coverage analysis               |

**Exit criteria**: Each agent works correctly when invoked by commands and by
the orchestrator.

### Phase 7: Custom Tools (Days 13-14)

**Objective**: Implement the 3 custom TypeScript tools.

| #   | Deliverable                | Description                                               |
| --- | -------------------------- | --------------------------------------------------------- |
| 7.1 | `tools/validate-spec.ts`   | Spec completeness validation with structured report        |
| 7.2 | `tools/trace-requirements.ts` | Requirement traceability matrix generation              |
| 7.3 | `tools/sprint-status.ts`   | Sprint dashboard rendering from YAML                      |

**Exit criteria**: Each tool executes successfully, handles edge cases (missing
files, empty specs), and produces correctly formatted output.

### Phase 8: Plugins (Days 15-16)

**Objective**: Implement the 3 event-driven plugins.

| #   | Deliverable                    | Description                                           |
| --- | ------------------------------ | ----------------------------------------------------- |
| 8.1 | `plugins/pre-commit-gate.ts`   | Advisory validation of spec-code consistency           |
| 8.2 | `plugins/session-knowledge.ts` | Automatic decision and lesson extraction               |
| 8.3 | `plugins/spec-watcher.ts`      | Real-time spec change consistency monitoring           |

**Exit criteria**: Each plugin responds to its subscribed events correctly
and produces appropriate toast notifications or file updates.

### Phase 9: MCP Integration (Day 16)

**Objective**: Configure and test GitHub MCP server integration.

| #   | Deliverable                | Description                                               |
| --- | -------------------------- | --------------------------------------------------------- |
| 9.1 | GitHub MCP config          | Configuration in opencode.json with token handling         |
| 9.2 | Integration documentation  | How agents use GitHub tools (issue creation, PR management) |

**Exit criteria**: Agents can successfully create issues, read CI status, and
create PRs via MCP tools.

### Phase 10: Testing & Refinement (Days 17-19)

**Objective**: End-to-end validation on a real project.

| #   | Deliverable                | Description                                               |
| --- | -------------------------- | --------------------------------------------------------- |
| 10.1| Hotfix track test          | Execute full hotfix workflow on a real bug                 |
| 10.2| Quick track test           | Execute full quick workflow on a small feature             |
| 10.3| Feature track test         | Execute full feature workflow end-to-end                   |
| 10.4| Epic track test            | Execute epic workflow through at least 1 sprint            |
| 10.5| Prompt tuning              | Refine agent prompts based on test results                 |
| 10.6| Edge case handling         | Test: missing files, empty specs, conflicting ADRs, brownfield |
| 10.7| Team workflow test         | Test multi-developer scenario with shared .forge/ artifacts |

**Exit criteria**: All 5 tracks complete successfully end-to-end. Agent outputs
are consistent, relevant, and correctly formatted. No broken cross-references.

---

## 19. Deliverables Checklist

### Documentation (Phase 0)

- [ ] `FORGE-PROJECT-PLAN.md` - This document
- [ ] `FORGE-GUIDE.md` - Usage guide with examples
- [ ] `FORGE-PHILOSOPHY.md` - Philosophy and benefits
- [ ] `FORGE-DECISIONS.md` - Design decisions and comparisons
- [ ] `FORGE-CUSTOMIZATION.md` - Customization guide

### Configuration (Phase 1)

- [ ] `opencode.json` - Full configuration
- [ ] `AGENTS.md` - Project rules template
- [ ] `.forge/` directory structure initialized
- [ ] `.forge/constitution.md` - Template
- [ ] `.forge/knowledge/decision-log.md` - Initialized
- [ ] `.forge/knowledge/lessons-learned.md` - Initialized

### Agents (Phases 2 & 6)

- [ ] `agents/forge.md` - Orchestrator
- [ ] `agents/forge-analyst.md` - Exploration & research
- [ ] `agents/forge-pm.md` - Product management
- [ ] `agents/forge-architect.md` - Architecture & ADRs
- [ ] `agents/forge-scrum.md` - Sprint management
- [ ] `agents/forge-reviewer.md` - Adversarial review
- [ ] `agents/forge-qa.md` - Testing strategy

### Templates (Phase 3)

- [ ] `templates/constitution.md`
- [ ] `templates/product-brief.md`
- [ ] `templates/prd.md`
- [ ] `templates/spec.md`
- [ ] `templates/tech-spec.md`
- [ ] `templates/architecture.md`
- [ ] `templates/plan.md`
- [ ] `templates/tasks.md`
- [ ] `templates/story.md`
- [ ] `templates/adr.md`
- [ ] `templates/sprint-status.yaml`

### Commands (Phase 4)

- [ ] `commands/forge-init.md`
- [ ] `commands/forge-brief.md`
- [ ] `commands/forge-specify.md`
- [ ] `commands/forge-clarify.md`
- [ ] `commands/forge-prd.md`
- [ ] `commands/forge-architecture.md`
- [ ] `commands/forge-plan.md`
- [ ] `commands/forge-analyze.md`
- [ ] `commands/forge-tasks.md`
- [ ] `commands/forge-sprint.md`
- [ ] `commands/forge-story.md`
- [ ] `commands/forge-implement.md`
- [ ] `commands/forge-review.md`
- [ ] `commands/forge-hotfix.md`
- [ ] `commands/forge-quick.md`
- [ ] `commands/forge-adr.md`
- [ ] `commands/forge-retro.md`
- [ ] `commands/forge-status.md`
- [ ] `commands/forge-help.md`

### Skills (Phase 5)

- [ ] `skills/adversarial-review/SKILL.md`
- [ ] `skills/advanced-elicitation/SKILL.md`
- [ ] `skills/scope-detection/SKILL.md`
- [ ] `skills/test-strategy/SKILL.md`
- [ ] `skills/brownfield-analysis/SKILL.md`
- [ ] `skills/constitution-compliance/SKILL.md`
- [ ] `skills/context-chain/SKILL.md`

### Tools (Phase 7)

- [ ] `tools/validate-spec.ts`
- [ ] `tools/trace-requirements.ts`
- [ ] `tools/sprint-status.ts`

### Plugins (Phase 8)

- [ ] `plugins/pre-commit-gate.ts`
- [ ] `plugins/session-knowledge.ts`
- [ ] `plugins/spec-watcher.ts`

### MCP (Phase 9)

- [ ] GitHub MCP server configured and tested

---

## 20. Risk Register

| ID   | Risk                                              | Impact | Likelihood | Mitigation                                         |
| ---- | ------------------------------------------------- | ------ | ---------- | -------------------------------------------------- |
| R1   | Agent prompts produce inconsistent output quality | High   | Medium     | Extensive prompt tuning in Phase 10; structured output formats in templates |
| R2   | Context window exhaustion with large documents     | High   | Medium     | context-chain skill limits what's loaded; compaction handles overflow |
| R3   | Adversarial review finds false positives           | Medium | High       | Require minimum severity thresholds; human review filters false positives |
| R4   | Constitution becomes stale or ignored              | Medium | Medium     | constitution-compliance skill loaded by reviewer; amendments logged |
| R5   | Plugin system limitations in OpenCode              | Medium | Low        | Monitor OpenCode plugin API evolution; fallback to commands for critical features |
| R6   | Team adoption resistance (too much process)        | High   | Medium     | Multi-track system lets teams start with Quick/Feature and scale up; clear ROI documentation |
| R7   | Cost of Opus for 3 agents may be prohibitive       | Medium | Low        | All Opus agents can be overridden to Sonnet via customization; documented in FORGE-CUSTOMIZATION.md |
| R8   | Session-knowledge plugin extracts irrelevant info  | Low    | Medium     | Conservative extraction rules; human review of decision-log.md |
| R9   | Spec-code traceability breaks with refactoring     | Medium | Medium     | trace-requirements tool highlights broken links; forge-analyze catches them |
| R10  | Brownfield analysis overwhelms context window      | Medium | Medium     | brownfield-analysis skill uses staged approach; analyze modules independently |

---

## 21. Success Criteria

### 21.1 Functional Criteria

| Criterion                                                    | Measurement                    |
| ------------------------------------------------------------ | ------------------------------ |
| All 5 workflow tracks complete successfully end-to-end        | Manual test per track          |
| Agents produce correctly formatted documents from templates   | Template compliance check      |
| Cross-artifact validation catches intentional inconsistencies | Inject 5 known issues, verify detection |
| Adversarial review finds real issues in generated code        | Review 3 implementations, verify issue quality |
| Knowledge base persists across sessions                       | Create decision, close session, verify in new session |
| Pre-commit gate fires on spec-code mismatch                   | Modify code without updating spec, verify warning |
| Scope detection recommends correct track                      | Test with 5 scenarios of varying complexity |

### 21.2 Quality Criteria

| Criterion                                                    | Target                          |
| ------------------------------------------------------------ | ------------------------------- |
| Agent response relevance (does it do what the command asks?)  | > 90% on first attempt          |
| Document completeness (are all template sections filled?)     | 100% for required fields        |
| Context loading accuracy (are the right documents loaded?)    | 100% per context-chain mapping  |
| False positive rate in adversarial review                     | < 30% of reported issues        |
| User intervention rate (how often must the user correct the agent?) | < 20% of workflow steps   |

### 21.3 Adoption Criteria

| Criterion                                                    | Target                          |
| ------------------------------------------------------------ | ------------------------------- |
| Time to first productive workflow (Quick track)               | < 15 minutes from installation  |
| Time to understand the system (read guide + first workflow)   | < 1 hour                        |
| Commands discoverable without documentation                   | > 80% via `/forge-help`         |

---

## Appendix A: Glossary

| Term                | Definition                                                      |
| ------------------- | --------------------------------------------------------------- |
| **FORGE**           | Framework for Orchestrated Requirements, Governance & Engineering |
| **Track**           | A workflow path calibrated to task complexity (Hotfix through Product) |
| **Constitution**    | Immutable project governance document defining principles, standards, and constraints |
| **ADR**             | Architecture Decision Record - documents a significant technical decision with context and consequences |
| **Progressive Context Chain** | The principle that each phase's output document becomes input context for the next phase |
| **Adversarial Review** | A review protocol where the reviewer MUST find issues; "looks good" is not acceptable |
| **Scope Detection** | Automated assessment of task complexity to recommend the appropriate workflow track |
| **Knowledge Base**  | Persistent store of ADRs, decisions, and lessons learned that survives across sessions |
| **Spec**            | A structured feature specification document (what to build and why) |
| **Plan**            | A structured technical plan document (how to build it)          |
| **Elicitation**     | Structured reasoning techniques applied after initial analysis to deepen understanding |

## Appendix B: Related Documents

| Document                  | Purpose                                         | Status  |
| ------------------------- | ----------------------------------------------- | ------- |
| `FORGE-GUIDE.md`          | How to use FORGE (all workflows, team usage)    | Planned |
| `FORGE-PHILOSOPHY.md`     | Why FORGE exists (principles, benefits)         | Planned |
| `FORGE-DECISIONS.md`      | Design decisions (BMAD vs Speckit comparisons)  | Planned |
| `FORGE-CUSTOMIZATION.md`  | How to customize FORGE                          | Planned |

## Appendix C: References

| Source                                                              | Relevance                         |
| ------------------------------------------------------------------- | --------------------------------- |
| [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD)        | Primary methodology source        |
| [Speckit](https://github.com/github/spec-kit)                      | Primary methodology source        |
| [OpenCode Documentation](https://opencode.ai/docs)                 | Platform capabilities reference   |
| [Martin Fowler - Spec-Driven Development](https://martinfowler.com) | Methodology analysis              |
