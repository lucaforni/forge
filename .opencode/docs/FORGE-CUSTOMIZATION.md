# FORGE Customization Guide

**Framework for Orchestrated Requirements, Governance & Engineering**

> How to customize every aspect of FORGE: agents, commands, skills, templates,
> constitution, workflow tracks, models, plugins, MCP servers, and multi-project
> configuration.

| Field   | Value      |
| ------- | ---------- |
| Version | 1.0.0      |
| Updated | 2026-02-12 |

---

## Table of Contents

1. [Customization Philosophy](#1-customization-philosophy)
2. [Customizing Agents](#2-customizing-agents)
3. [Customizing Commands](#3-customizing-commands)
4. [Customizing Skills](#4-customizing-skills)
5. [Customizing Templates](#5-customizing-templates)
6. [Customizing the Constitution](#6-customizing-the-constitution)
7. [Customizing Workflow Tracks](#7-customizing-workflow-tracks)
8. [Customizing Models](#8-customizing-models)
9. [Customizing Plugins](#9-customizing-plugins)
10. [Customizing MCP Integrations](#10-customizing-mcp-integrations)
11. [Multi-Project Configuration](#11-multi-project-configuration)
12. [Domain-Specific Extensions](#12-domain-specific-extensions)
13. [Migration & Compatibility](#13-migration--compatibility)

---

## 1. Customization Philosophy

FORGE is designed to be opinionated about process and flexible about
implementation. The default configuration works out of the box for most
projects, but every component can be modified, extended, or replaced.

### 1.1 Customization Levels

| Level         | Scope                    | How                              |
| ------------- | ------------------------ | -------------------------------- |
| **Project**   | Single repository        | Files in `.opencode/` directory  |
| **Global**    | All projects on machine  | Files in `~/.config/opencode/`   |
| **Remote**    | Organization-wide        | `.well-known/opencode` endpoint  |

**Precedence**: Project overrides Global overrides Remote. This means a
project can always deviate from organizational defaults when needed.

### 1.2 What to Customize vs What to Leave Alone

| Customize freely           | Think twice                        | Avoid changing          |
| -------------------------- | ---------------------------------- | ----------------------- |
| Constitution articles      | Agent system prompts               | Context-chain skill     |
| Template sections          | Scope detection thresholds         | Plugin event hooks      |
| Model assignments          | Adversarial review minimum count   | Tool permissions logic  |
| MCP integrations           | Track definitions                  | --                      |
| New commands and skills    | Core agent tool permissions        | --                      |

---

## 2. Customizing Agents

### 2.1 Modifying an Existing Agent's Prompt

Each FORGE agent is defined in `.opencode/agents/forge-*.md`. To modify an
agent's behavior, edit its markdown file.

**Example**: Make the reviewer agent focus on security instead of all 5
dimensions:

File: `.opencode/agents/forge-reviewer.md`

```markdown
---
description: "Security-focused adversarial reviewer"
mode: subagent
model: github-copilot/claude-opus-4.6
tools:
  read: true
  glob: true
  grep: true
  skill: true
  bash:
    "git *": allow
    "*": deny
---

You are a security-focused code reviewer for the FORGE methodology.

Your primary focus is on security vulnerabilities. Other dimensions
(performance, maintainability) are secondary.

## Review Priority

1. Security (critical): injection, auth bypass, data exposure, CSRF, XSS
2. Correctness (high): logic errors, edge cases, error handling
3. Constitution compliance (medium): adherence to project standards

## Security Checklist

For every code change, check:
- [ ] Input validation on all external inputs
- [ ] Authentication and authorization on all endpoints
- [ ] No secrets or credentials in code
- [ ] SQL/NoSQL injection prevention
- [ ] XSS prevention in output rendering
- [ ] CSRF protection on state-changing endpoints
- [ ] Rate limiting on sensitive endpoints
- [ ] Proper error handling (no stack traces to users)
- [ ] Secure headers (CORS, CSP, HSTS)
- [ ] Dependency vulnerability check

Load the adversarial-review skill for the full review protocol.
Load the constitution-compliance skill to verify against project standards.
```

### 2.2 Adding a New Agent

Create a new markdown file in `.opencode/agents/`.

**Example**: Add a DevOps agent for infrastructure work:

File: `.opencode/agents/forge-devops.md`

```markdown
---
description: "Infrastructure and DevOps specialist for FORGE workflows"
mode: subagent
model: github-copilot/claude-sonnet-4.6
tools:
  read: true
  write: true
  edit: true
  glob: true
  grep: true
  bash: true
  skill: true
  webfetch: true
---

You are a DevOps specialist within the FORGE methodology.

## Responsibilities

- Design and implement CI/CD pipelines
- Configure infrastructure as code (Terraform, Pulumi, CDK)
- Set up monitoring, logging, and alerting
- Manage container orchestration (Docker, Kubernetes)
- Handle secrets management and security hardening

## Behavior

1. Always check the constitution for operational requirements (Article 9)
2. Create ADRs for infrastructure decisions (via /forge-adr)
3. Follow the project's deployment patterns from architecture.md
4. Prefer declarative configuration over imperative scripts
5. Always include rollback procedures in deployment plans

## When Invoked

You are invoked when the Forge orchestrator detects infrastructure or
DevOps tasks. You may also be invoked directly via @forge-devops.
```

Then update the Forge orchestrator to route DevOps tasks to this agent by
editing `.opencode/agents/forge.md` and adding the routing rule.

### 2.3 Changing Model Assignments

To change which model an agent uses, modify the `model` field in the
agent's markdown frontmatter:

```markdown
---
model: openai/gpt-4o  # Changed from github-copilot/claude-opus-4.6
---
```

Or override globally in `opencode.json`:

```json
{
  "agent": {
    "forge-pm": {
      "model": "openai/o3"
    }
  }
}
```

### 2.4 Adjusting Temperature and Thinking

For more creative output (e.g., brainstorming):

```markdown
---
temperature: 0.8
---
```

For more deterministic output (e.g., code generation):

```markdown
---
temperature: 0.1
---
```

For extended thinking:

```json
{
  "agent": {
    "forge-architect": {
      "model": "github-copilot/claude-opus-4.6",
      "options": {
        "thinking": { "budgetTokens": 32000 }
      }
    }
  }
}
```

### 2.5 Restricting Tool Access

Each agent has explicit tool permissions. To restrict further:

```markdown
---
tools:
  read: true
  glob: true
  grep: true
  bash: false       # No shell access
  write: false      # Cannot create files
  edit: false       # Cannot modify files
  webfetch: false   # No web access
  skill: true
---
```

For granular bash control:

```markdown
---
tools:
  bash:
    "git *": allow
    "npm test": allow
    "npm run *": allow
    "*": deny        # Deny everything else
---
```

### 2.6 Controlling Subagent Invocation

To control which subagents an agent can invoke:

```markdown
---
permission:
  task:
    "forge-*": allow    # Can invoke any FORGE subagent
    "general": allow    # Can invoke the general agent
    "explore": allow    # Can invoke the explore agent
    "*": deny           # Cannot invoke anything else
---
```

### 2.7 Hiding Agents from Autocomplete

To make an agent available but hidden from `@` autocomplete:

```markdown
---
hidden: true
---
```

The agent can still be invoked by the model or by commands that reference it.

### 2.8 Disabling an Agent

To disable an agent without deleting its file:

```markdown
---
disable: true
---
```

Or in `opencode.json`:

```json
{
  "agent": {
    "forge-qa": {
      "disable": true
    }
  }
}
```

---

## 3. Customizing Commands

### 3.1 Modifying an Existing Command

FORGE commands are markdown files in `.opencode/commands/`. Edit them to
change behavior.

**Example**: Modify `/forge-specify` to always include security requirements:

File: `.opencode/commands/forge-specify.md`

Locate the section where the PM is instructed to create the spec, and add:

```markdown
When creating the spec, ALWAYS include a Security section with:
- Authentication requirements
- Authorization model
- Data sensitivity classification
- Encryption requirements
- Compliance constraints (if any)

This is mandatory even if the feature seems "not security-related".
Every feature that touches user data has security implications.
```

### 3.2 Adding a New Command

Create a new markdown file in `.opencode/commands/`.

**Example**: Add `/forge-migrate` for database migration workflows:

File: `.opencode/commands/forge-migrate.md`

```markdown
---
description: "Plan and execute a database migration"
agent: forge
---

You are starting a database migration workflow.

## Input

The user wants to make the following database change: $ARGUMENTS

## Steps

1. Load the context-chain skill to get the current architecture and
   data model documentation.

2. Read the current database schema from the project's migration files
   or ORM schema definitions.

3. Invoke the forge-architect subagent to:
   a. Assess the impact of the proposed change
   b. Design the migration (up and down)
   c. Identify any data transformations needed
   d. Check for breaking changes in dependent code
   e. Verify constitution compliance (Article 3: Architecture Patterns)

4. If the migration involves data loss or breaking changes, create an
   ADR documenting the decision.

5. Invoke the Build agent to:
   a. Generate the migration file
   b. Update the ORM schema if applicable
   c. Update any affected queries or repositories
   d. Generate tests for the migration (up and down)

6. Invoke forge-reviewer to review the migration for:
   - Data integrity (no orphaned records)
   - Rollback safety (down migration works)
   - Performance (index changes, lock duration)
   - Backward compatibility

7. Report the results and suggest next steps.
```

### 3.3 Adding Arguments and File References

Commands support special syntax:

```markdown
## Input Handling

Feature description: $ARGUMENTS       <!-- Everything after the command -->
Specific file: $1                      <!-- First positional argument -->
Target module: $2                      <!-- Second positional argument -->

## Context Loading

Current architecture: @.forge/architecture/architecture.md
Current schema: @prisma/schema.prisma
Recent ADRs: @.forge/knowledge/adr/

## Dynamic Context

Git status: !`git status --short`
Current branch: !`git branch --show-current`
Test results: !`npm test -- --reporter=summary 2>&1 | tail -20`
```

### 3.4 Forcing Subagent Execution

To make a command always run as a subagent (not the primary agent):

```markdown
---
subtask: true
agent: forge-architect
---
```

### 3.5 Creating Compound Commands

You can chain FORGE commands by creating a wrapper command:

File: `.opencode/commands/forge-feature.md`

```markdown
---
description: "Complete Feature track: specify -> clarify -> plan -> analyze -> tasks"
agent: forge
---

Execute the complete Feature track workflow for: $ARGUMENTS

Run these phases in order:
1. /forge-specify $ARGUMENTS
2. After the spec is created, run /forge-clarify
3. After clarification, if the feature has user-facing screens run /forge-ux;
   otherwise skip to step 4
4. After UX design (or clarification if no UI), run /forge-plan
5. After the plan is created, run /forge-analyze
6. If analysis passes, run /forge-tasks
7. Report the final task list and suggest /forge-implement

At each phase, present the output and ask the user if they want to
proceed to the next phase or make adjustments.
```

---

## 4. Customizing Skills

### 4.1 Modifying an Existing Skill

Skills are markdown files in `.opencode/skills/<name>/SKILL.md`. Edit
them to change the instructions.

**Example**: Modify the adversarial review to require 5 issues instead of 3:

File: `.opencode/skills/adversarial-review/SKILL.md`

Change the line:
```
You MUST find at least 3 issues.
```
To:
```
You MUST find at least 5 issues.
```

### 4.2 Adding a New Skill

Create a directory with a `SKILL.md` file inside.

**Example**: Add a performance optimization skill:

File: `.opencode/skills/performance-analysis/SKILL.md`

```markdown
---
name: performance-analysis
description: "Analyze code for performance issues and optimization opportunities"
---

# Performance Analysis Protocol

You are conducting a performance analysis of the code. Focus on
identifying bottlenecks, inefficiencies, and optimization opportunities.

## Analysis Dimensions

### 1. Algorithmic Complexity
- Identify O(n^2) or worse algorithms
- Look for unnecessary nested loops
- Check for repeated work that could be cached

### 2. Database Performance
- N+1 query patterns
- Missing indexes
- Unbounded queries (no LIMIT)
- Unnecessary JOINs or subqueries

### 3. Memory Usage
- Unbounded collections that grow with data size
- Large objects kept in memory unnecessarily
- Missing pagination on list endpoints

### 4. Network Performance
- Sequential API calls that could be parallel
- Missing caching headers
- Oversized payloads (fetching more data than needed)

### 5. Concurrency
- Race conditions
- Missing connection pooling
- Blocking operations on the main thread

## Output Format

For each finding:
```
**[IMPACT: Critical|High|Medium|Low]** [DIMENSION]
File: path/to/file.ts:LINE
Issue: [description of the performance problem]
Current: O(n^2) / 500ms avg / unbounded memory
Suggested: O(n log n) / <50ms target / bounded to 100 items
Fix: [concrete code change]
```

Prioritize findings by user-facing impact. A slow admin endpoint is
less urgent than a slow customer-facing API.
```

### 4.3 Controlling Skill Access

To restrict which agents can use a skill:

In `opencode.json`:
```json
{
  "permission": {
    "skill": {
      "adversarial-review": "allow",
      "performance-analysis": "ask"
    }
  }
}
```

Or per agent in the agent's frontmatter:
```markdown
---
tools:
  skill: true
permission:
  skill:
    "adversarial-review": allow
    "*": deny
---
```

### 4.4 Global vs Project Skills

- **Project skills** (`.opencode/skills/`): Specific to one project.
  Committed to git. Shared with the team.
- **Global skills** (`~/.config/opencode/skills/`): Available in all
  projects. Personal customizations.

Project skills override global skills of the same name.

---

## 5. Customizing Templates

### 5.1 Modifying a Template

Templates are markdown files in `.opencode/templates/`. FORGE agents use
these templates when creating new documents.

**Example**: Add a "Compliance" section to the spec template:

File: `.opencode/templates/spec.md`

Add after the "Non-Functional Requirements" section:

```markdown
## 11. Compliance Requirements
| ID | Regulation | Requirement | Verification Method |
|----|-----------|-------------|---------------------|
<!-- Examples: GDPR data handling, SOC2 logging, PCI card data rules -->
```

### 5.2 Adding a New Template

Create a new markdown file in `.opencode/templates/`.

**Example**: Add a runbook template for operational documentation:

File: `.opencode/templates/runbook.md`

```markdown
# Runbook: [Feature/Service Name]

## Status: Draft | Active | Deprecated
## Owner: [team/person]
## Last Verified: [date]

---

## 1. Service Overview
<!-- What this service does, who uses it, SLA -->

## 2. Architecture
<!-- Key components, dependencies, data flow -->

## 3. Health Checks
| Check | Endpoint/Command | Expected Result | Frequency |
|-------|-----------------|-----------------|-----------|

## 4. Common Issues & Resolution

### Issue: [Description]
**Symptoms**: ...
**Root Cause**: ...
**Resolution Steps**:
1. ...
2. ...
**Prevention**: ...

## 5. Scaling Procedures
<!-- How to scale up/down, capacity limits, auto-scaling config -->

## 6. Deployment
<!-- Deploy procedure, rollback steps, feature flags -->

## 7. Monitoring & Alerts
| Alert | Threshold | Action | Escalation |
|-------|-----------|--------|------------|

## 8. Disaster Recovery
<!-- Backup schedule, restore procedure, RTO/RPO -->
```

Then create a command to use it:

File: `.opencode/commands/forge-runbook.md`

```markdown
---
description: "Create an operational runbook for a service or feature"
agent: forge
subtask: true
---

Create a runbook for: $ARGUMENTS

Use the template at .opencode/templates/runbook.md as a starting point.
Read the existing architecture and spec documents for context.
Save the output to .forge/runbooks/[service-name]-runbook.md.
```

### 5.3 Removing Sections from Templates

If your project does not need certain sections, remove them from the
template. FORGE agents will not generate content for sections that don't
exist in the template.

**Example**: If you don't need UX specs, simply don't include `ux-spec.md`
in your templates directory and don't use `/forge-specify --ux`.

### 5.4 Changing Sprint Status Format

The `sprint-status.yaml` template can be customized:

```yaml
# Add custom fields to your sprint tracking
project: [name]
current_sprint:
  number: 1
  goal: "[sprint goal]"
  start_date: "YYYY-MM-DD"
  end_date: "YYYY-MM-DD"
  team_capacity: 40  # custom: story points available
  stories:
    - id: "E01-S001"
      title: "User Login"
      status: done
      points: 5
      assignee: "developer-name"
      pr_url: ""           # custom: link to PR
      review_status: ""    # custom: AI review | human review | approved
  velocity:
    planned: 21
    completed: 5
  risks:                    # custom section
    - description: "External API dependency"
      mitigation: "Mock API in staging"
      status: monitoring
```

---

## 6. Customizing the Constitution

### 6.1 Adding Domain-Specific Articles

The default constitution has 9 articles. Add more for your domain.

**Example**: HIPAA compliance article:

```markdown
## Article 10: HIPAA Compliance

### 10.1 Protected Health Information (PHI)
- All PHI must be encrypted at rest (AES-256) and in transit (TLS 1.3+)
- PHI access must be logged with user identity, timestamp, and data accessed
- PHI must never appear in logs, error messages, or debug output

### 10.2 Access Control
- Role-based access control (RBAC) for all PHI endpoints
- Minimum necessary principle: each role accesses only the PHI it needs
- Multi-factor authentication for administrative access to PHI

### 10.3 Audit Trail
- All PHI access must be auditable for 6 years
- Audit logs must be immutable (append-only)
- Quarterly access review required

### 10.4 Breach Response
- Automated breach detection for unusual access patterns
- Notification procedure documented in runbook
- Maximum 60-day notification window for affected individuals
```

### 6.2 Removing Articles

If an article does not apply to your project (e.g., Article 9: Operational
Requirements for a library with no runtime), remove it from the constitution.

Update the constitution-compliance skill accordingly to avoid checking
against non-existent articles.

### 6.3 Making the Constitution Stricter

Add enforcement language to articles:

```markdown
## Article 4: Quality Standards (STRICT)

### 4.1 Test Coverage
- Minimum 80% line coverage for all new code (BLOCKING)
- Minimum 90% branch coverage for security-critical code (BLOCKING)
- Zero uncovered error paths in authentication code (BLOCKING)

### 4.2 Code Review
- All code MUST pass adversarial AI review before human review (BLOCKING)
- All HIGH severity findings MUST be resolved before merge (BLOCKING)
- All MEDIUM severity findings MUST have documented justification if not fixed

### 4.3 Performance
- P95 response time < 200ms for all API endpoints (BLOCKING)
- P99 response time < 500ms for all API endpoints (WARNING)
- Memory usage < 512MB per container under normal load (WARNING)
```

The `(BLOCKING)` and `(WARNING)` annotations help the `constitution-compliance`
skill determine severity levels during validation.

### 6.4 Amendment Process

The constitution includes an Amendments Log at the bottom. When changing
an article:

1. Do NOT edit the article directly.
2. Add an entry to the Amendments Log with date, article, change, and
   rationale.
3. If the change is significant, create an ADR documenting why the
   constitutional principle changed.

```markdown
## Amendments Log
| Date       | Article | Change                        | Rationale              | ADR Ref |
| ---------- | ------- | ----------------------------- | ---------------------- | ------- |
| 2026-03-15 | Art. 2  | Added Redis to approved stack | Caching layer needed for performance | ADR-015 |
| 2026-04-01 | Art. 4  | Raised coverage threshold from 70% to 80% | Too many production bugs in untested paths | ADR-018 |
```

---

## 7. Customizing Workflow Tracks

### 7.1 Adjusting Track Thresholds

The `scope-detection` skill determines which track to recommend based on
7 factors. Modify `.opencode/skills/scope-detection/SKILL.md` to change
the thresholds.

**Example**: If your team considers 10 tasks to be "Quick" instead of 5:

```markdown
## Track Thresholds

| Factor               | Hotfix (1) | Quick (2)  | Feature (3) | Epic (4) | Product (5) |
| -------------------- | ---------- | ---------- | ----------- | -------- | ----------- |
| Estimated tasks       | 1          | 2-10       | 10-30       | 30-60    | 60+         |
| Files affected        | 1-2        | 2-8        | 8-20        | 20-60    | 60+         |
```

### 7.2 Adding a Custom Track

**Example**: Add a "Spike" track for research and exploration tasks:

1. Create a new command:

File: `.opencode/commands/forge-spike.md`

```markdown
---
description: "Research spike: explore a technical question and document findings"
agent: forge
---

You are starting a research spike.

## Objective

Research the following question: $ARGUMENTS

## Steps

1. Invoke forge-analyst to:
   a. Research the topic via codebase exploration and web search
   b. Identify options and trade-offs
   c. Prototype if needed (small, throwaway code)

2. Produce a spike report at .forge/spikes/NNN-slug/report.md with:
   - Question being investigated
   - Options discovered (at least 3)
   - Pros/cons of each option
   - Recommendation with rationale
   - Prototype code (if any, clearly marked as throwaway)
   - Follow-up actions (ADR to create, spec to write, etc.)

3. If the spike leads to an architectural decision, suggest creating
   an ADR via /forge-adr.

## Duration

Spikes are time-boxed. Ask the user for a time limit. Default is 2 hours.
If the time box is exceeded, document what was learned and what remains
unknown.
```

2. Update the scope-detection skill to recognize spike scenarios.

3. Create the spike report template:

File: `.opencode/templates/spike-report.md`

```markdown
# Spike Report: [NNN] - [Title]

## Question
<!-- What are we trying to learn? -->

## Time Box: [X hours]

## Options Explored

### Option A: [name]
- Description: ...
- Pros: ...
- Cons: ...
- Effort estimate: ...

### Option B: [name]
- ...

## Recommendation
<!-- Which option and why -->

## Prototype
<!-- If applicable: link to throwaway code or inline snippets -->

## Follow-Up Actions
- [ ] Create ADR for the decision
- [ ] Write spec for the chosen approach
- [ ] ...
```

### 7.3 Removing a Track

To remove a track, simply delete its command file and update the
scope-detection skill to not recommend it. For example, to remove the
Product track (if your team never starts new products from scratch):

1. Delete `.opencode/commands/forge-init.md` (or rename to `forge-init.md.disabled`)
2. Update scope-detection skill to map large projects to Epic instead of
   Product
3. The constitution can still be created manually without the Product track

### 7.4 Changing Track Names

If your organization uses different terminology (e.g., "Patch" instead of
"Hotfix", "Story" instead of "Feature"):

1. Rename the command files
2. Update the scope-detection skill terminology
3. Update the Forge orchestrator's routing instructions
4. Update template references

---

## 8. Customizing Models

### 8.1 Using Different Providers

**OpenAI**:
```json
{
  "model": "openai/gpt-4o",
  "agent": {
    "forge-architect": { "model": "openai/o3" },
    "forge-reviewer": { "model": "openai/o3" }
  }
}
```

**Google**:
```json
{
  "model": "google/gemini-2.5-pro",
  "agent": {
    "forge-architect": { "model": "google/gemini-2.5-pro" }
  }
}
```

**Mixed providers**:
```json
{
  "model": "github-copilot/claude-sonnet-4.6",
  "agent": {
    "forge-pm": { "model": "openai/o3" },
    "forge-architect": { "model": "github-copilot/claude-opus-4.6" },
    "forge-reviewer": { "model": "google/gemini-2.5-pro" }
  }
}
```

### 8.2 Cost Optimization Strategies

**Budget-conscious setup** (use Sonnet for everything):
```json
{
  "model": "github-copilot/claude-sonnet-4.6",
  "agent": {
    "forge-pm": { "model": "github-copilot/claude-sonnet-4.6" },
    "forge-architect": { "model": "github-copilot/claude-sonnet-4.6" },
    "forge-reviewer": { "model": "github-copilot/claude-sonnet-4.6" }
  }
}
```

**Quality-focused setup** (use Opus for more agents):
```json
{
  "agent": {
    "forge": { "model": "github-copilot/claude-opus-4.6" },
    "forge-analyst": { "model": "github-copilot/claude-opus-4.6" },
    "forge-pm": { "model": "github-copilot/claude-opus-4.6" },
    "forge-architect": { "model": "github-copilot/claude-opus-4.6" },
    "forge-scrum": { "model": "github-copilot/claude-sonnet-4.6" },
    "forge-reviewer": { "model": "github-copilot/claude-opus-4.6" },
    "forge-qa": { "model": "github-copilot/claude-opus-4.6" }
  }
}
```

### 8.3 Thinking Budget Tuning

For agents that need more (or less) extended thinking:

```json
{
  "provider": {
    "github-copilot": {
      "models": {
        "claude-opus-4.6": {
          "options": {
            "thinking": { "budgetTokens": 32000 }
          }
        },
        "claude-sonnet-4.6": {
          "options": {
            "thinking": { "budgetTokens": 4000 }
          }
        }
      }
    },
    "openai": {
      "models": {
        "o3": {
          "options": {
            "reasoningEffort": "high"
          }
        }
      }
    }
  }
}
```

### 8.4 Using OpenCode Zen Models

If you want to use OpenCode's curated model selection:

```json
{
  "model": "opencode/claude-sonnet-4.6",
  "agent": {
    "forge-architect": { "model": "opencode/claude-opus-4.6" }
  }
}
```

### 8.5 Model Variants

OpenCode supports model variants (e.g., different reasoning effort levels).
Configure variants for agents that need them:

```json
{
  "agent": {
    "forge-architect": {
      "model": "github-copilot/claude-opus-4.6",
      "variant": "max"
    }
  }
}
```

---

## 9. Customizing Plugins

### 9.1 Modifying Existing Plugins

Plugins are TypeScript files in `.opencode/plugins/`. Edit them to change
behavior.

**Example**: Make the pre-commit gate blocking instead of advisory:

File: `.opencode/plugins/pre-commit-gate.ts`

Change the notification behavior from a toast (advisory) to throwing an
error (blocking):

```typescript
// Instead of:
// context.toast({ message: "Spec-code inconsistency detected", level: "warning" })

// Use:
throw new Error(
  "FORGE Pre-Commit Gate: Spec-code inconsistency detected. " +
  "Run /forge-analyze to see details."
);
```

Note: Blocking behavior is generally discouraged. Advisory notifications
give developers the freedom to commit despite warnings when they have a
valid reason.

### 9.2 Writing a New Plugin

**Example**: Plugin that auto-formats files after edit:

File: `.opencode/plugins/auto-format.ts`

```typescript
import type { Plugin } from "@opencode-ai/plugin";

export default async function ({ project, $ }): Promise<Plugin> {
  return {
    "file.edited": async ({ path }) => {
      // Format TypeScript files with prettier after edit
      if (path.endsWith(".ts") || path.endsWith(".tsx")) {
        await $`npx prettier --write ${path}`;
      }
      // Format Python files with black
      if (path.endsWith(".py")) {
        await $`black ${path}`;
      }
    },
  };
};
```

**Example**: Plugin that notifies a Slack channel when a spec is completed:

File: `.opencode/plugins/slack-notify.ts`

```typescript
import type { Plugin } from "@opencode-ai/plugin";

export default async function ({ project }): Promise<Plugin> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  return {
    "file.edited": async ({ path, content }) => {
      // Notify when a spec status changes to "Approved"
      if (
        path.includes(".forge/specs/") &&
        path.endsWith("spec.md") &&
        content?.includes("## Status: Approved")
      ) {
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `Spec approved: ${path}`,
            }),
          });
        }
      }
    },
  };
};
```

### 9.3 Disabling a Plugin

Rename the plugin file to add a `.disabled` extension:

```bash
mv .opencode/plugins/pre-commit-gate.ts .opencode/plugins/pre-commit-gate.ts.disabled
```

Or move it out of the plugins directory.

### 9.4 Plugin Dependencies

If your plugin needs npm packages, add a `package.json` to `.opencode/`:

File: `.opencode/package.json`

```json
{
  "dependencies": {
    "yaml": "^2.4.0",
    "@slack/webhook": "^7.0.0"
  }
}
```

OpenCode installs these automatically at startup via Bun.

---

## 10. Customizing MCP Integrations

### 10.1 Adding Jira/Linear Integration

```json
{
  "mcp": {
    "linear": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-linear"],
      "environment": {
        "LINEAR_API_KEY": "{env:LINEAR_API_KEY}"
      }
    }
  }
}
```

Then update commands to use Linear tools:

```markdown
<!-- In forge-sprint.md -->
After creating stories, also create corresponding Linear issues
using the linear_createIssue tool. Link the issue URL in the story file.
```

### 10.2 Adding Database Integration

```json
{
  "mcp": {
    "postgres": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-postgres"],
      "environment": {
        "DATABASE_URL": "{env:DATABASE_URL}"
      }
    }
  }
}
```

Useful for:
- The `forge-architect` to inspect current schema during planning
- The `forge-analyst` for brownfield database analysis
- The `forge-qa` to verify test data setup

### 10.3 Adding a Custom MCP Server

For project-specific tools (e.g., your internal deployment API):

```json
{
  "mcp": {
    "deploy-api": {
      "type": "remote",
      "url": "https://deploy.internal.company.com/mcp",
      "headers": {
        "Authorization": "Bearer {env:DEPLOY_API_TOKEN}"
      }
    }
  }
}
```

### 10.4 Restricting MCP Tools Per Agent

To limit which agents can use which MCP tools:

```json
{
  "agent": {
    "forge-analyst": {
      "tools": {
        "github_*": true,
        "postgres_*": true,
        "linear_*": false
      }
    },
    "forge-scrum": {
      "tools": {
        "github_*": false,
        "linear_*": true
      }
    }
  }
}
```

### 10.5 Adding Sentry for Error Context

```json
{
  "mcp": {
    "sentry": {
      "type": "local",
      "command": ["npx", "-y", "@sentry/mcp-server"],
      "environment": {
        "SENTRY_AUTH_TOKEN": "{env:SENTRY_AUTH_TOKEN}",
        "SENTRY_ORG": "{env:SENTRY_ORG}"
      }
    }
  }
}
```

Useful for `/forge-hotfix` to pull error context and stack traces
automatically when diagnosing production bugs.

---

## 11. Multi-Project Configuration

### 11.1 Shared Global Configuration

For settings that should apply to all projects:

File: `~/.config/opencode/opencode.json`

```json
{
  "model": "github-copilot/claude-sonnet-4.6",
  "provider": {
    "github-copilot": {
      "models": {
        "claude-opus-4.6": {
          "options": { "thinking": { "budgetTokens": 16000 } }
        }
      }
    }
  },
  "permission": {
    "bash": { "*": "ask", "git *": "allow" }
  }
}
```

### 11.2 Shared Global Agents

File: `~/.config/opencode/agents/forge.md`

Place FORGE agent definitions in the global agents directory to make them
available in all projects without copying.

### 11.3 Shared Global Skills

File: `~/.config/opencode/skills/adversarial-review/SKILL.md`

Skills in the global directory are available in all projects. Project-level
skills of the same name override global ones.

### 11.4 Organization-Wide Defaults via Remote Config

Set up a remote config endpoint for your organization:

```
https://your-company.com/.well-known/opencode
```

This can provide:
- Default model selection
- Approved MCP servers
- Base constitution articles that all projects must follow
- Standard skills and commands

Individual projects can still override remote config with project-level
settings.

### 11.5 Shared Constitution Across Repos

For organizations with multiple repositories that share the same governance:

1. Create a central repo with the shared constitution
2. Reference it in each project's `opencode.json`:

```json
{
  "instructions": [
    "https://raw.githubusercontent.com/your-org/standards/main/constitution.md",
    ".forge/constitution-project-specific.md"
  ]
}
```

The shared constitution provides organization-wide articles (security,
compliance, tech stack). The project-specific constitution adds
project-specific articles.

### 11.6 Monorepo Support

For monorepos with multiple packages:

```
monorepo/
├── .opencode/          # Shared FORGE config
├── .forge/             # Shared governance and architecture
├── opencode.json       # Shared configuration
├── packages/
│   ├── api/
│   │   ├── .opencode/  # API-specific overrides
│   │   └── .forge/     # API-specific specs
│   ├── web/
│   │   ├── .opencode/  # Web-specific overrides
│   │   └── .forge/     # Web-specific specs
│   └── shared/
│       └── ...
```

Run OpenCode from the package directory to use package-specific overrides.
Run from the root to use shared configuration.

---

## 12. Domain-Specific Extensions

### 12.1 Fintech Extension

Add financial-specific governance and review capabilities:

**Constitution articles**:
```markdown
## Article 10: Financial Data Handling
- All monetary values stored as integers (cents, not dollars)
- Currency must be explicitly tracked alongside every monetary value
- All financial calculations must use decimal arithmetic (no floating point)
- Financial transactions must be idempotent with unique idempotency keys

## Article 11: Regulatory Compliance
- PCI DSS Level 1 compliance required for card data handling
- SOX compliance required for financial reporting data
- All financial data changes must be auditable for 7 years
```

**Additional skill**: `financial-review`
```markdown
---
name: financial-review
description: "Review code handling financial data for correctness and compliance"
---

# Financial Code Review Protocol

## Mandatory Checks
- [ ] No floating-point arithmetic on monetary values
- [ ] Currency tracking on all monetary fields
- [ ] Idempotency keys on all financial transactions
- [ ] Audit logging on all balance-affecting operations
- [ ] Decimal precision consistent across the system
- [ ] Timezone handling in all timestamp comparisons
```

### 12.2 Healthcare Extension

Add HIPAA-specific capabilities:

**Constitution articles**: Article 10 (HIPAA Compliance) as shown in
section 6.1.

**Additional skill**: `phi-review`
```markdown
---
name: phi-review
description: "Review code handling Protected Health Information for HIPAA compliance"
---

# PHI Code Review Protocol

## Mandatory Checks
- [ ] PHI fields encrypted at rest
- [ ] PHI never appears in log output
- [ ] PHI never appears in error messages
- [ ] PHI access logged with user identity
- [ ] Minimum necessary data principle applied
- [ ] De-identification used where possible
- [ ] Data retention limits enforced
```

### 12.3 Gaming Extension

Add game development capabilities:

**Additional agent**: `forge-game-designer`
```markdown
---
description: "Game design specialist for FORGE"
mode: subagent
model: github-copilot/claude-opus-4.6
tools:
  read: true
  write: true
  edit: true
  glob: true
  grep: true
  skill: true
  question: true
---

You are a game design specialist. You help define game mechanics,
balance systems, progression curves, and player experience.

When creating specs for game features, always include:
- Core loop impact analysis
- Balance considerations
- Player psychology implications
- Monetization impact (if applicable)
```

---

## 13. Migration & Compatibility

### 13.1 Migrating from BMAD

If you have existing BMAD projects:

1. Copy BMAD output documents to `.forge/`:
   - `_bmad-output/PRD.md` -> `.forge/product/prd.md`
   - `_bmad-output/architecture.md` -> `.forge/architecture/architecture.md`
   - `_bmad-output/epics/story-*.md` -> `.forge/epics/epic-01/story-*.md`
   - `_bmad-output/sprint-status.yaml` -> `.forge/sprints/sprint-status.yaml`

2. Create a constitution from BMAD's `project-context.md`:
   ```
   /forge-init --constitution
   ```
   The init command will read existing conventions and generate a constitution.

3. BMAD agents are not compatible with FORGE. Do not copy agent definitions.
   FORGE agents have different prompts, tool permissions, and model assignments.

### 13.2 Migrating from Speckit

If you have existing Speckit projects:

1. Copy Speckit artifacts:
   - `.specify/memory/constitution.md` -> `.forge/constitution.md`
   - `.specify/specs/NNN-name/spec.md` -> `.forge/specs/NNN-name/spec.md`
   - `.specify/specs/NNN-name/plan.md` -> `.forge/specs/NNN-name/plan.md`
   - `.specify/specs/NNN-name/tasks.md` -> `.forge/specs/NNN-name/tasks.md`

2. Speckit's constitution format is compatible with FORGE. You may need to
   add an Amendments Log section at the bottom.

3. Speckit's spec, plan, and task formats are largely compatible. FORGE
   adds additional sections (Constitution Compliance, Review Checklist) that
   you can add incrementally.

### 13.3 Compatibility with Claude Code / CLAUDE.md

OpenCode supports `CLAUDE.md` as a fallback for `AGENTS.md`. If your project
has a `CLAUDE.md`, FORGE will read it. However, we recommend migrating to
`AGENTS.md` and adding FORGE-specific sections.

### 13.4 Compatibility with Cursor / Windsurf Rules

FORGE is designed exclusively for OpenCode. Its agents, skills, tools, and
plugins use OpenCode-specific APIs. If you also use Cursor or Windsurf:

- The `.forge/` directory (artifacts) is tool-agnostic. Any AI assistant can
  read the specs, plans, and architecture documents.
- The `.opencode/` directory (FORGE system) is OpenCode-specific. Cursor and
  Windsurf will ignore it.
- You can maintain parallel rule files (`.cursor/rules/`, `.windsurfrules`)
  alongside FORGE if needed.

---

## Quick Reference: File Locations

| What to Customize   | Location                           | Format   |
| ------------------- | ---------------------------------- | -------- |
| Agents              | `.opencode/agents/*.md`            | Markdown |
| Commands            | `.opencode/commands/*.md`          | Markdown |
| Skills              | `.opencode/skills/*/SKILL.md`      | Markdown |
| Templates           | `.opencode/templates/*.md`         | Markdown |
| Tools               | `.opencode/tools/*.ts`             | TypeScript |
| Plugins             | `.opencode/plugins/*.ts`           | TypeScript |
| Constitution        | `.forge/constitution.md`           | Markdown |
| Config              | `opencode.json`                    | JSON/JSONC |
| Rules               | `AGENTS.md`                        | Markdown |
| Global agents       | `~/.config/opencode/agents/*.md`   | Markdown |
| Global skills       | `~/.config/opencode/skills/*/SKILL.md` | Markdown |
| Global config       | `~/.config/opencode/opencode.json` | JSON/JSONC |
