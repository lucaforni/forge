# FORGE Usage Guide

**Framework for Orchestrated Requirements, Governance & Engineering**

> The complete guide to using FORGE for structured AI-driven software
> development on OpenCode.

| Field   | Value      |
| ------- | ---------- |
| Version | 1.0.0      |
| Updated | 2026-02-12 |

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Core Concepts](#2-core-concepts)
3. [Workflow Tracks](#3-workflow-tracks)
4. [Command Reference](#4-command-reference)
5. [Team Workflows](#5-team-workflows)
6. [Knowledge Base Management](#6-knowledge-base-management)
7. [Brownfield Projects](#7-brownfield-projects)
8. [Developing FORGE Itself (Meta-Development)](#8-developing-forge-itself-meta-development)
9. [Tips & Best Practices](#9-tips--best-practices)
10. [GitHub Integration (MCP)](#10-github-integration-mcp)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Quick Start

### 1.1 Prerequisites

- [OpenCode](https://opencode.ai) installed and configured
- A GitHub Copilot subscription (provides Claude Sonnet 4.5 and Claude Opus 4.6)
- A project directory (new or existing)

### 1.2 Installation

Copy the `.opencode/` directory into your project root. The directory contains
all FORGE agents, commands, skills, tools, plugins, and templates.

```bash
# Option A: Clone into an existing project
cp -r path/to/forge/.opencode/ your-project/.opencode/

# Option B: Start a new project
mkdir my-project && cd my-project
git init
cp -r path/to/forge/.opencode/ .opencode/
cp path/to/forge/opencode.json opencode.json
```

### 1.3 Verify Installation

```bash
cd your-project
opencode
```

Once inside OpenCode, verify FORGE is loaded:

```
> /forge-help
```

The Forge orchestrator should respond with a status report showing all loaded
agents, commands, and skills.

### 1.4 Your First 5-Minute Workflow (Quick Track)

This example fixes a small feature in under 5 minutes:

```
> /forge-quick "Add a health check endpoint that returns the app version"
```

FORGE will:
1. Assess complexity (should be Quick track: ~2 tasks)
2. Ask a few clarifying questions (endpoint path, response format)
3. Generate a lightweight `tech-spec.md`
4. Implement the code and tests
5. Run a self-review

**Output**: Working code + tests + `.forge/specs/001-health-check/tech-spec.md`

---

## 2. Core Concepts

### 2.1 The Progressive Context Chain

FORGE's central principle: every phase produces a document, and that document
becomes context for the next phase. This prevents agents from making
inconsistent decisions across sessions.

```
Constitution
    |
    v
Brief --> PRD --> Architecture --> Specs --> Plans --> Tasks --> Code
                       |                                         |
                       +--- ADRs --------------------------------+
                       |                                         |
                       +--- Knowledge Base <--------- Reviews ---+
```

**Why this matters**: Without structured context, an architect agent might
choose PostgreSQL while a developer agent defaults to MongoDB. With FORGE,
the architecture document explicitly records the database choice, and all
downstream agents respect it.

### 2.2 Workflow Tracks

FORGE adapts its ceremony level to task complexity:

```
Complexity ───────────────────────────────────────────> High

  Hotfix       Quick      Feature      Epic       Product
  ─────       ──────     ─────────    ──────     ─────────
  1 file      1-5 tasks  5-20 tasks   20-50+     New product
  < 30 min    < 1 day    1-5 days     1-4 weeks  4+ weeks
  No docs     Tech spec  Spec+Plan    Full chain Full chain
                                      + Sprints  + Constitution
```

You don't have to choose manually. The `scope-detection` skill analyzes your
request and recommends the right track. You always have the final say.

### 2.3 Agents

FORGE uses 7 specialized subagents, each with a distinct role and model:

| Agent           | Role                                    | When Active                   |
| --------------- | --------------------------------------- | ----------------------------- |
| Forge           | Orchestrates workflows, routes to track | Always (primary agent)        |
| forge-analyst   | Explores, researches, assesses scope    | Analysis phases               |
| forge-pm        | Defines requirements, writes specs/PRDs | Specify, Clarify, PRD phases  |
| forge-architect | Designs architecture, creates ADRs      | Architecture, Plan phases     |
| forge-scrum     | Plans sprints, manages stories          | Sprint, Story, Retro phases   |
| forge-reviewer  | Adversarial reviews (code + specs)      | Review, Analyze phases        |
| forge-qa        | Defines test strategy, generates tests  | Testing phases                |

### 2.4 The Constitution

For Product-track projects, FORGE creates a `constitution.md` -- a governance
document with immutable principles that all agents must follow. Think of it as
the project's "bill of rights" for code quality, security, architecture, and
operations.

### 2.5 The Knowledge Base

FORGE maintains a persistent knowledge base in `.forge/knowledge/`:

- **ADRs**: Architecture Decision Records for significant technical choices
- **Decision Log**: Automatically extracted decisions from each session
- **Lessons Learned**: Insights from retrospectives and debugging sessions

This knowledge persists across sessions, preventing the same mistakes or
debates from recurring.

---

## 3. Workflow Tracks

### 3.1 Hotfix Track

**When to use**: A critical bug, clearly scoped to 1-2 files, fixable in under
30 minutes. No new architecture or patterns needed.

**Example scenario**: A login endpoint returns a 500 error because of a null
pointer when the user has no profile picture.

#### Step-by-step

```
> /forge-hotfix "Login endpoint returns 500 when user has no profile picture.
  Error in src/routes/auth/login.ts - user.profilePicture.url throws on null"
```

**What happens**:

1. **Diagnose**: The Build agent examines the error location, traces the
   data flow, and identifies the root cause.

2. **Fix**: Applies a minimal, targeted fix (null check or optional chaining).

3. **Verify**: Runs existing tests to confirm no regressions. Adds a
   regression test for the specific bug.

4. **Self-review**: Quick review against the constitution (if it exists)
   to verify the fix follows project patterns.

5. **Output**: A structured commit message:
   ```
   fix(auth): handle null profilePicture in login response

   Root cause: User objects without a profile picture have
   profilePicture set to null, but the login serializer
   accessed .url without a null check.

   Fix: Added optional chaining on profilePicture access.
   Added regression test for users without profile pictures.
   ```

**Documents produced**: None. The commit message is the documentation.

**Scope guard**: If the agent determines the fix requires more than 2 files or
introduces new patterns, it will tell you:

```
This issue appears more complex than a hotfix. It requires changes to
3 files and a new error handling pattern. I recommend using the Feature
track instead:

  /forge-specify "Improve null safety in user serialization layer"

Do you want to proceed as a hotfix anyway, or switch to Feature track?
```

---

### 3.2 Quick Track

**When to use**: A small, well-defined feature or bug fix. 1-5 tasks, under
1 day of work. No significant architectural decisions needed.

**Example scenario**: Add a "forgot password" endpoint that sends a reset
email with a time-limited token.

#### Step-by-step

```
> /forge-quick "Add a forgot password feature. User submits email, receives a
  reset link with a 1-hour expiry token. Clicking the link lets them set a
  new password."
```

**What happens**:

1. **Scope detection**: The Forge orchestrator loads the `scope-detection`
   skill and evaluates complexity.

   ```
   Scope Assessment:
     Estimated tasks: 4
     Files affected: ~5
     New dependencies: 0
     Schema changes: Minor (add reset_token columns)
     Recommended track: Quick

   Proceeding with Quick track.
   ```

2. **Quick spec**: The `forge-pm` subagent engages you in brief requirements
   discovery:

   ```
   Before I write the spec, I have a few questions:

   1. Should the reset token be stored in the database or as a signed JWT?
   2. What email service are you using? (SendGrid, AWS SES, etc.)
   3. Should there be rate limiting on the reset request endpoint?
   4. After successful reset, should the user be auto-logged in?
   ```

   After your answers, it produces `.forge/specs/002-forgot-password/tech-spec.md`:

   ```markdown
   # Tech Spec: 002 - Forgot Password

   ## Overview
   Add password reset flow with email-delivered, time-limited tokens.

   ## Requirements
   - POST /auth/forgot-password accepts email, sends reset link
   - Token stored as signed JWT with 1-hour expiry
   - GET /auth/reset-password/:token validates token
   - POST /auth/reset-password/:token accepts new password
   - Rate limited to 3 requests per email per hour
   - User is NOT auto-logged in after reset

   ## Tasks
   1. Create reset token generation utility (JWT-based, 1hr expiry)
   2. Create POST /auth/forgot-password endpoint + rate limiter
   3. Create POST /auth/reset-password/:token endpoint
   4. Create email template and send via SendGrid

   ## Acceptance Criteria
   - Given a valid email, when POST /forgot-password, then a reset
     email is sent within 30 seconds
   - Given an expired token, when POST /reset-password, then a 400
     error is returned with message "Token expired"
   - Given 4 requests for the same email within 1 hour, then the 4th
     request returns 429 Too Many Requests
   ```

3. **Implement**: The Build agent implements each task, tracking progress
   with `todowrite`:
   ```
   Task 1/4: Creating reset token utility... done
   Task 2/4: Creating forgot-password endpoint... done
   Task 3/4: Creating reset-password endpoint... done
   Task 4/4: Creating email template... done
   ```

4. **Test**: The `test-strategy` skill determines that Quick track requires
   unit tests. Tests are generated for each new file.

5. **Self-review**: A quick adversarial review checks for security issues
   (since this involves auth), and flags anything it finds.

**Documents produced**: `.forge/specs/002-forgot-password/tech-spec.md`

---

### 3.3 Feature Track

**When to use**: A medium-complexity feature touching multiple modules. 5-20
tasks, 1-5 days of work. May involve data model changes, new API endpoints,
and UI components.

**Example scenario**: Add OAuth2 authentication with Google and GitHub
providers, including account linking for existing users.

#### Step-by-step

**Phase 1: Specify**

```
> /forge-specify "Add OAuth2 authentication with Google and GitHub. Support
  account linking for users who already have email/password accounts."
```

The `forge-pm` subagent conducts structured requirements discovery:

```
I'll help you specify this feature. Let me ask some questions to ensure
we cover all cases:

1. When a user signs in with OAuth and an account with that email exists,
   should we:
   a) Auto-link the accounts
   b) Ask the user to verify ownership first
   c) Create a separate account

2. Should users be able to disconnect an OAuth provider after linking?

3. Do you need to store OAuth access tokens for making API calls to
   Google/GitHub on behalf of the user, or only for authentication?

4. Should OAuth be available for both sign-up and sign-in, or sign-in only?
```

After your answers, the PM uses the `advanced-elicitation` skill:

```
I've drafted the spec. Before finalizing, I'd like to apply a deeper
analysis technique. I recommend:

1. Pre-mortem Analysis - Imagine this feature has failed in production.
   What went wrong?
2. Red Team / Blue Team - What could an attacker exploit in this flow?
3. Constraint Removal - What if we had no time constraints?

Which technique would you like to apply? (or skip)
```

You choose "Red Team":

```
Red Team Analysis:

ATTACK: Account takeover via OAuth email. Attacker creates a Google
account with victim's email (unverified on Google's side), then uses
OAuth to auto-link to victim's account.

DEFENSE: Never auto-link based on email alone. Require the user to
verify ownership of the existing account (password or email OTP) before
linking.

ATTACK: CSRF on the OAuth callback. Attacker sends a crafted callback
URL to victim.

DEFENSE: Use state parameter with CSRF token, verify on callback.

These findings are now incorporated into the spec.
```

**Output**: `.forge/specs/003-oauth2-authentication/spec.md`

**Phase 2: Clarify**

```
> /forge-clarify
```

The PM reviews the spec for `[NEEDS CLARIFICATION]` markers:

```
I found 2 areas that need clarification in spec 003:

1. [NEEDS CLARIFICATION] NFR-003: "OAuth flow should be fast"
   - What is the target latency for the complete OAuth flow?
   - Suggestion: < 3 seconds from click to authenticated session

2. [NEEDS CLARIFICATION] FR-007: "Support account linking"
   - Should linked accounts share the same user ID, or maintain
     separate auth records with a junction table?
```

After your answers, the spec is updated and all markers are resolved.

**Phase 3: Plan**

```
> /forge-plan
```

The `forge-architect` reads the spec + constitution + existing architecture
and produces a technical plan:

```
I've analyzed your spec against the existing architecture. Here's my plan:

Data Model:
  - New table: oauth_providers (user_id, provider, provider_user_id, ...)
  - New table: oauth_state (state_token, redirect_uri, expires_at)
  - Modified: users (add auth_method enum column)

API Endpoints:
  - GET  /auth/oauth/:provider        -> initiate OAuth flow
  - GET  /auth/oauth/:provider/callback -> handle callback
  - POST /auth/oauth/link             -> link provider to existing account
  - DELETE /auth/oauth/:provider      -> unlink provider

Architecture Decision:
  I'm creating an ADR for the OAuth state management approach.
  See .forge/knowledge/adr/003-oauth-state-management.md
```

**Output**: `.forge/specs/003-oauth2-authentication/plan.md` + ADR

**Phase 4: Analyze**

```
> /forge-analyze
```

The `forge-reviewer` cross-validates all artifacts:

```
Cross-Artifact Analysis Report
==============================
Spec: 003-oauth2-authentication/spec.md
Plan: 003-oauth2-authentication/plan.md
Architecture: architecture/architecture.md
Constitution: constitution.md

Results:
  [PASS] All functional requirements covered in plan
  [PASS] All acceptance criteria are testable
  [PASS] Plan is consistent with existing architecture
  [WARN] FR-005 (rate limiting) mentioned in spec but not addressed
         in plan. Suggest adding rate limiting section to plan.
  [PASS] Constitution compliance verified (all 9 articles)
  [PASS] ADR-003 referenced correctly in plan

Overall: PASS with 1 warning. Address the rate limiting gap before
proceeding to task breakdown.
```

**Phase 5: Tasks**

```
> /forge-tasks
```

The `forge-scrum` generates ordered tasks:

```
Generated 14 tasks in 4 phases:

Phase 1: Data Layer (3 tasks)
  1.1 [FR-001] Create oauth_providers migration and model
  1.2 [FR-001] Create oauth_state migration and model
  1.3 [FR-001] [P] Create OAuthProviderRepository

Phase 2: OAuth Core (4 tasks)
  2.1 [FR-002] Implement Google OAuth strategy
  2.2 [FR-003] [P] Implement GitHub OAuth strategy
  2.3 [FR-002] Create OAuth state manager (generate, validate, cleanup)
  2.4 [FR-005] Create rate limiter for OAuth endpoints

Phase 3: API Layer (4 tasks)
  3.1 [FR-002] Create GET /auth/oauth/:provider endpoint
  3.2 [FR-002] Create GET /auth/oauth/:provider/callback endpoint
  3.3 [FR-004] Create POST /auth/oauth/link endpoint
  3.4 [FR-004] Create DELETE /auth/oauth/:provider endpoint

Phase 4: Integration (3 tasks)
  4.1 [FR-006] Add OAuth options to login/register UI
  4.2 [FR-007] Implement account linking verification flow
  4.3 [NFR-001] Add OAuth flow integration tests

[P] = parallelizable with other [P] tasks in the same phase
```

**Output**: `.forge/specs/003-oauth2-authentication/tasks.md`

**Phase 6: Implement**

```
> /forge-implement
```

The Build agent reads `tasks.md` and implements task by task:

```
Starting implementation of 003-oauth2-authentication
14 tasks in 4 phases

Phase 1: Data Layer
  [1/14] Creating oauth_providers migration... done
  [2/14] Creating oauth_state migration... done
  [3/14] Creating OAuthProviderRepository... done

Phase 2: OAuth Core
  [4/14] Implementing Google OAuth strategy... done
  [5/14] Implementing GitHub OAuth strategy... done
  [6/14] Creating OAuth state manager... done
  [7/14] Creating rate limiter... done

Phase 3: API Layer
  [8/14]  Creating initiate endpoint... done
  [9/14]  Creating callback endpoint... done
  [10/14] Creating link endpoint... done
  [11/14] Creating unlink endpoint... done

Phase 4: Integration
  [12/14] Adding OAuth to UI... done
  [13/14] Implementing linking verification... done
  [14/14] Writing integration tests... done

All 14 tasks complete. Running test suite...
  42 tests passed, 0 failed.
```

**Phase 7: Review**

```
> /forge-review
```

The `forge-reviewer` conducts an adversarial review:

```
Adversarial Code Review - 003 OAuth2 Authentication
====================================================

[HIGH] SECURITY - src/routes/auth/oauth/callback.ts:47
  Issue: OAuth state token is not deleted after use. A captured state
  token could be replayed within its expiry window.
  Suggestion: Delete the state token immediately after validation,
  before processing the callback.

[MEDIUM] CORRECTNESS - src/services/oauth/google.ts:23
  Issue: The email scope is requested but email_verified is not checked.
  Google can return unverified emails, which would bypass the account
  linking security check.
  Suggestion: Add `if (!profile.email_verified) throw new Error(...)`

[MEDIUM] PERFORMANCE - src/repositories/oauth-provider.repository.ts:34
  Issue: findByProviderAndUserId query lacks a composite index.
  This will be called on every OAuth login.
  Suggestion: Add index on (provider, provider_user_id) in migration.

[LOW] MAINTAINABILITY - src/services/oauth/github.ts:15
  Issue: GitHub API base URL is hardcoded. Enterprise GitHub uses a
  different URL.
  Suggestion: Extract to configuration constant.

4 issues found. 1 high severity (blocking), 3 non-blocking.
Recommend fixing the HIGH issue before merge.
```

You fix the issues, then the code goes to human review.

**Documents produced**: `spec.md`, `plan.md`, `tasks.md`, ADR, reviewed code.

---

### 3.4 Epic Track

**When to use**: A complex feature set or major system capability. 20-50+
tasks, 1-4 weeks. Requires architecture decisions, multiple sprints, and
sprint management.

**Example scenario**: Build a complete payment processing system with Stripe
integration, subscription management, invoicing, and webhook handling.

#### Step-by-step

**Phase 1: Brief**

```
> /forge-brief "Build a payment processing system with Stripe. Need
  subscriptions (monthly/yearly), usage-based billing, invoicing,
  webhook handling, and a billing portal for customers."
```

The `forge-analyst` explores the codebase and produces a product brief:

```
I've analyzed your codebase and researched the requirements. Here's
the product brief:

Scope Assessment:
  Estimated tasks: 35-45
  Estimated duration: 3-4 weeks
  Recommended track: Epic

  Rationale: Multiple subsystems (subscriptions, billing, invoicing,
  webhooks), significant data model, external API integration,
  compliance considerations (PCI), new architectural patterns needed.
```

**Output**: `.forge/product/brief.md`

**Phase 2: PRD**

```
> /forge-prd
```

The `forge-pm` creates a comprehensive PRD:

```
Product Requirements Document created with:
  - 3 user personas (Customer, Admin, Finance)
  - 18 functional requirements across 4 modules
  - 8 non-functional requirements (security, performance, compliance)
  - 5 risks with mitigations
  - Success metrics (conversion rate, churn, payment failure rate)
```

**Output**: `.forge/product/prd.md`

**Phase 3: Architecture**

```
> /forge-architecture
```

The `forge-architect` designs the system:

```
Architecture document created with:
  - System context diagram
  - Component breakdown (4 modules)
  - Data model (7 tables)
  - Stripe integration patterns
  - Webhook processing architecture (idempotent, ordered)
  - 3 ADRs created:
    - ADR-004: Stripe as sole payment provider
    - ADR-005: Event-driven webhook processing with retry queue
    - ADR-006: PCI compliance via Stripe Elements (no card data touches server)
```

**Output**: `.forge/architecture/architecture.md` + 3 ADRs

**Phase 4: Validate**

```
> /forge-analyze
```

The reviewer validates cohesion across PRD + architecture:

```
Implementation Readiness Check
================================
  PRD <-> Architecture alignment: PASS
  All FRs have architectural coverage: PASS
  NFRs addressed in architecture: PASS
  Constitution compliance: PASS
  ADRs are consistent: PASS

  Result: READY FOR IMPLEMENTATION
```

**Phase 5: Sprint Planning**

```
> /forge-sprint
```

The `forge-scrum` initializes sprint management:

```
Sprint Planning - Payment Processing Epic
==========================================

I've broken the PRD into 3 epics:

Epic 1: Core Payments (Sprint 1-2)
  8 stories, 34 points
  - Stripe integration setup
  - Customer creation/sync
  - Payment method management
  - One-time charges

Epic 2: Subscriptions (Sprint 2-3)
  7 stories, 29 points
  - Plan management
  - Subscription lifecycle
  - Usage-based metering
  - Billing portal

Epic 3: Invoicing & Webhooks (Sprint 3-4)
  6 stories, 24 points
  - Invoice generation
  - Webhook processing
  - Retry/failure handling
  - Admin dashboard

Sprint 1 loaded with stories E01-S001 through E01-S004 (18 points).
```

**Output**: `.forge/epics/epic-01-core-payments/epic.md`, story files,
`.forge/sprints/active/sprint-NNN.yaml`

**Phase 6: Story Implementation (repeat per story)**

```
> /forge-story
```

The scrum master prepares the next story:

```
Next Story: E01-S001 - Stripe Integration Setup
Points: 5 | Priority: Critical

Description:
  As a developer, I want the Stripe SDK configured and connected
  so that all payment operations have a working foundation.

Acceptance Criteria:
  Given the app starts, when Stripe is configured,
  then API connectivity is verified on health check.

  Given a test API key, when creating a test customer,
  then Stripe returns a valid customer object.

Implementation Notes (from architecture):
  - Use stripe npm package
  - Config via STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars
  - Create src/services/stripe/client.ts singleton
  - Create src/services/stripe/types.ts for shared types
  - Add Stripe health check to existing /health endpoint

Tasks:
  1. Install and configure Stripe SDK
  2. Create Stripe client singleton with error handling
  3. Create shared Stripe types
  4. Add Stripe connectivity to health check
  5. Write unit tests for client initialization

Ready for implementation.
```

```
> /forge-implement
```

The Build agent implements the story.

```
> /forge-review
```

Adversarial review + human review.

**Phase 7: Retrospective (after each epic)**

```
> /forge-retro
```

The `forge-scrum` conducts a retrospective:

```
Sprint 2 Retrospective
========================
Velocity: 32 pts (planned: 34, previous sprint: 28)

What went well:
  - Stripe integration was straightforward due to clear ADRs
  - Task parallelism markers saved time (tasks 2.1 and 2.2 parallel)

What could improve:
  - Webhook testing required manual Stripe CLI setup not in the spec
  - OAuth PR took 2 days for human review (bottleneck)

Action items:
  - Add webhook testing setup instructions to spec template
  - Rotate PR reviewers to avoid single-person bottleneck

Lessons captured in .forge/knowledge/lessons-learned.md
```

**Documents produced**: Full chain (brief, PRD, architecture, ADRs, epics,
stories, sprint status, retrospectives).

---

### 3.5 Product Track

**When to use**: A new product or platform from scratch. Greenfield, 4+ weeks.

**Example scenario**: Build a SaaS project management tool.

#### Step-by-step

The Product track is identical to the Epic track, with two additions at the
beginning:

**Phase 0: Initialize**

```
> /forge-init
```

This command:
1. Creates the `.forge/` directory structure
2. Walks you through constitution creation:
   ```
   Let's establish the project constitution. I'll ask about each article:

   Article 1 - Core Principles:
     What are the non-negotiable principles for this project?
     (e.g., "Security first", "API-first design", "Accessibility as a feature")

   Article 2 - Technology Stack:
     What technologies are approved for this project?
     (I've detected Node.js/TypeScript from your package.json)

   ...
   ```
3. Scans the project (if it has code) and generates `AGENTS.md`
4. Initializes the knowledge base

**Phase 0.5: UX Spec (optional)**

For products with a user interface, after the PRD:

```
> /forge-specify --ux "Create UX specification for the project management tool"
```

This produces `.forge/product/ux-spec.md` with user flows, wireframe
descriptions, and interaction patterns.

The rest follows the Epic track workflow.

---

## 4. Command Reference

### 4.1 Workflow Commands

| Command | Arguments | Description |
| ------- | --------- | ----------- |
| `/forge-init` | `[--constitution]` | Initialize FORGE in a project. Use `--constitution` to add a constitution to an existing FORGE project. |
| `/forge-brief` | `"description"` | Create a product brief with vision, scope, and complexity assessment. |
| `/forge-specify` | `"description"` `[--ux]` | Create a feature specification. Use `--ux` for UX-focused specs. |
| `/forge-clarify` | `[spec-id]` | Review a spec for ambiguities and surface questions. Defaults to most recent spec. |
| `/forge-prd` | none | Create a full PRD from the product brief. |
| `/forge-architecture` | none | Create the architecture document with ADRs. |
| `/forge-plan` | `[spec-id]` | Create a technical plan for a spec. Defaults to most recent spec. |
| `/forge-analyze` | `[spec-id]` | Cross-validate spec vs plan vs architecture vs constitution. |
| `/forge-tasks` | `[spec-id]` | Generate dependency-ordered task breakdown from a spec + plan. |
| `/forge-sprint` | `[start \| close [id] \| list \| update [id]]` | Manage sprints. No args shows dashboard or starts new sprint. |
| `/forge-story` | `[story-id]` | Prepare the next story for implementation. |
| `/forge-implement` | `[spec-id \| story-id]` | Implement from a spec, story, or task list. |

### 4.2 Review Commands

| Command | Arguments | Description |
| ------- | --------- | ----------- |
| `/forge-review` | `[spec-id \| story-id]` | Adversarial code review. Reviews the most recent changes by default. |

### 4.3 Track Shortcuts

| Command | Arguments | Description |
| ------- | --------- | ----------- |
| `/forge-hotfix` | `"description"` | Complete hotfix workflow: diagnose, fix, verify, review. |
| `/forge-quick` | `"description"` | Complete quick workflow: spec, implement, test, review. |

### 4.4 Knowledge Commands

| Command | Arguments | Description |
| ------- | --------- | ----------- |
| `/forge-adr` | `"decision title"` | Create or update an Architecture Decision Record. |

### 4.5 Management Commands

| Command | Arguments | Description |
| ------- | --------- | ----------- |
| `/forge-retro` | `[sprint-number]` | Conduct a sprint or epic retrospective. |
| `/forge-status` | none | Show sprint status dashboard with progress and blockers. |
| `/forge-help` | `[topic]` | Context-aware help. Detects your current state and suggests next steps. |

---

## 5. Team Workflows

### 5.1 Roles in a FORGE Team

FORGE does not prescribe rigid human roles, but here is a practical mapping for
a team of 15+ developers:

| Role               | FORGE Responsibilities                                  |
| ------------------ | ------------------------------------------------------- |
| **Tech Lead**      | Runs `/forge-init`, creates constitution, reviews ADRs, approves architecture |
| **Product Manager**| Provides input during `/forge-specify` and `/forge-prd`, reviews specs, prioritizes epics |
| **Architect**      | Reviews `/forge-architecture` output, validates ADRs, approves plans |
| **Developers**     | Run `/forge-implement`, address review feedback, contribute to retros |
| **QA Lead**        | Reviews test strategy, validates coverage, runs `/forge-review` for test quality |
| **Scrum Master**   | Runs `/forge-sprint`, `/forge-status`, `/forge-retro`, manages sprint ceremonies |

### 5.2 Multi-Developer Feature Development

**Scenario**: Three developers working on the Payment Epic simultaneously.

```
Developer A: Epic 1, Stories S001-S004 (Core Payments)
Developer B: Epic 2, Stories S001-S003 (Subscriptions)
Developer C: Epic 3, Stories S001-S003 (Webhooks)
```

**Shared artifacts** (committed to git, shared via pull/push):
- `.forge/constitution.md` -- All developers follow the same principles
- `.forge/architecture/architecture.md` -- Consistent technical decisions
- `.forge/knowledge/adr/` -- All architects see all decisions
- `.forge/sprints/active/` -- Scrum master updates sprint files centrally
- `.forge/sprints/completed/` -- Archived sprint history for velocity tracking

**Per-developer workflow**:
1. Pull latest `.forge/` artifacts
2. Run `/forge-story` to get their next story
3. Run `/forge-implement` to build it
4. Run `/forge-review` for AI adversarial review
5. Create PR for human review
6. After merge, update active sprint file via `/forge-sprint update`

**Conflict prevention**:
- The architecture document defines module boundaries. Developer A's payment
  code does not touch Developer C's webhook code.
- ADRs prevent contradictory decisions (e.g., Developer B choosing a different
  billing library than the one in ADR-004).
- Constitution ensures consistent patterns (error handling, naming, etc.)

### 5.3 Sprint Ceremony with FORGE

**Sprint Planning** (start of sprint):
```
Scrum Master: /forge-sprint start
  -> Review velocity from completed sprints
  -> Select stories from backlog
  -> Assign to developers
  -> Creates active/sprint-NNN.yaml
  -> Commit and push
```

**Daily standup** (each developer):
```
Developer: /forge-status
  -> See their assigned stories and current status
  -> Update story status if needed
  -> Flag blockers
```

**Sprint Review** (end of sprint):
```
Scrum Master: /forge-retro
  -> Automated velocity calculation
  -> Guided retrospective (what went well, what to improve)
  -> Action items generated
  -> Lessons learned captured in knowledge base
  -> Commit and push
```

### 5.4 Code Review Flow

FORGE implements a dual-review process:

```
Developer writes code
        |
        v
  /forge-review
  (AI adversarial review)
        |
        v
  Fix blocking issues
  (HIGH severity)
        |
        v
  Create Pull Request
  (PR body auto-generated from spec/story)
        |
        v
  Human reviewer assigned
  (uses FORGE review output as starting point)
        |
        v
  Human approves or requests changes
        |
        v
  Merge to main
```

The AI review is NOT a substitute for human review. It is a first pass that
catches mechanical issues (security, performance, correctness) so that human
reviewers can focus on design, readability, and business logic.

### 5.5 Onboarding New Team Members

When a new developer joins a FORGE project:

1. **Read the constitution** (`.forge/constitution.md`): Understand the project's
   non-negotiable principles, tech stack, and quality standards.

2. **Scan recent ADRs** (`.forge/knowledge/adr/`): Understand why key decisions
   were made and what alternatives were considered.

3. **Read the architecture** (`.forge/architecture/architecture.md`): Understand
   the system design, module boundaries, and patterns.

4. **Read the decision log** (`.forge/knowledge/decision-log.md`): Understand
   recent session-level decisions.

5. **Check sprint status** (`/forge-status`): See what's in progress and
   what's coming up.

6. **Start with a Quick track story**: Pick a small story to get familiar
   with the workflow before tackling larger work.

A new developer can be productive within hours because all the context they
need is in the `.forge/` directory, not in someone's head.

### 5.6 Handling Disagreements

When team members disagree on an approach:

1. **Check the constitution**: Does it already prescribe an approach?
2. **Check existing ADRs**: Has this decision been made before?
3. **Create an ADR**: If it's a new decision, use `/forge-adr` to document
   options, trade-offs, and the final decision.
4. **Use advanced elicitation**: The `advanced-elicitation` skill can apply
   structured reasoning (Red Team, First Principles, Pre-mortem) to break
   deadlocks.

The key principle: **decisions are documented, not debated repeatedly**.

---

## 6. Knowledge Base Management

### 6.1 Architecture Decision Records (ADRs)

**When to create an ADR**:
- Choosing a database, framework, or major library
- Deciding on an API style (REST vs GraphQL vs gRPC)
- Defining a pattern (event-driven vs synchronous)
- Making a trade-off (consistency vs availability)
- Any decision you expect someone to question later

**Creating an ADR**:
```
> /forge-adr "Use PostgreSQL as primary database instead of MongoDB"
```

The `forge-architect` will guide you through:
- Context: Why is this decision needed?
- Options: What alternatives were considered?
- Decision: What was chosen and why?
- Consequences: What are the positive, negative, and neutral effects?
- Constitution alignment: Which articles does this support?

**ADR lifecycle**:
```
Proposed --> Accepted --> [Deprecated | Superseded by ADR-XXX]
```

### 6.2 Decision Log

The `session-knowledge` plugin automatically extracts decisions from each
OpenCode session and appends them to `.forge/knowledge/decision-log.md`:

```markdown
## 2026-02-15 - Session: OAuth Implementation

- Decided to use passport.js for OAuth strategy management
- Chose to store OAuth tokens encrypted at rest using AES-256
- Rate limiting set to 3 requests per email per hour for password reset
```

This is automatic. You don't need to do anything. The plugin runs when a
session ends or goes idle.

**Reviewing the decision log**: Periodically review and prune the log. Move
significant decisions to formal ADRs. Remove trivial entries.

### 6.3 Lessons Learned

Captured automatically from sessions with errors, rollbacks, or debugging,
and explicitly from retrospectives (`/forge-retro`):

```markdown
## 2026-02-20 - Sprint 2 Retrospective

- Webhook testing requires Stripe CLI running locally. Add this as a
  prerequisite in spec templates.
- Integration tests for Stripe should use the Stripe test clock feature
  for time-dependent scenarios (subscription renewals, trial expiry).
- PR review bottleneck: rotate reviewers instead of assigning to the
  most experienced person every time.
```

### 6.4 Knowledge Base Maintenance

| Task | Frequency | Who |
| ---- | --------- | --- |
| Review decision-log.md, promote important entries to ADRs | Weekly | Tech Lead |
| Archive completed/irrelevant lessons-learned entries | Per sprint | Scrum Master |
| Review ADRs for staleness (deprecated tech, changed requirements) | Monthly | Architect |
| Verify constitution is still accurate | Quarterly | Tech Lead + PM |

---

## 7. Brownfield Projects

### 7.1 Onboarding an Existing Codebase

```
> /forge-init
```

When run on a project with existing code, FORGE adapts:

1. **Codebase scan**: The `forge-analyst` uses the `brownfield-analysis` skill
   to analyze the existing codebase:
   ```
   Analyzing existing codebase...

   Project structure:
     Language: TypeScript (98%), Python (2% - scripts)
     Framework: Express.js with Prisma ORM
     Test framework: Jest (coverage: 62%)
     Lines of code: ~15,000

   Architecture patterns detected:
     - MVC with service layer
     - Repository pattern for data access
     - JWT-based authentication
     - Environment-based configuration

   Conventions detected:
     - camelCase for variables, PascalCase for classes
     - Barrel exports (index.ts) in each module
     - Tests co-located with source files (*.test.ts)

   Potential tech debt:
     - No error handling middleware (errors handled per-route)
     - Mixed async patterns (callbacks in 3 files, async/await elsewhere)
     - No API versioning
   ```

2. **Constitution generation**: Based on the analysis, FORGE generates a
   draft constitution that codifies existing conventions:
   ```
   I've generated a draft constitution based on your codebase.
   Please review and adjust:

   Article 2 - Technology Stack:
     - Runtime: Node.js 20+ with TypeScript 5+
     - Framework: Express.js
     - ORM: Prisma
     - Testing: Jest
     [Detected from package.json and codebase analysis]

   Article 3 - Architecture Patterns:
     - MVC with service layer
     - Repository pattern for data access
     [Detected from code structure]
   ```

3. **AGENTS.md generation**: Project rules are derived from existing
   `.eslintrc`, `tsconfig.json`, `prettier.config`, and code patterns.

### 7.2 Incremental Adoption

You don't have to use all tracks immediately. A recommended adoption path:

**Week 1-2**: Use only Hotfix and Quick tracks. Get comfortable with the
workflow without changing your existing process.

**Week 3-4**: Use the Feature track for one medium feature. Experience the
full spec-plan-implement-review cycle.

**Month 2**: Adopt the Epic track for a larger initiative. Start sprint
management.

**Month 3+**: Evaluate whether the Product track and full constitution
governance add value for your team.

### 7.3 Creating Specs for Existing Features

To bring existing features under FORGE management (for future maintenance):

```
> /forge-specify --existing "Document the existing authentication system"
```

The PM agent will analyze the existing code and produce a spec that describes
what already exists, rather than what should be built. This spec becomes the
baseline for future changes.

---

## 8. Developing FORGE Itself (Meta-Development)

### 8.1 The Meta-Circularity Problem

FORGE is designed to develop software projects, but FORGE itself is software.
To avoid conflicts between "FORGE as code" and "specs for developing FORGE",
we use a **workspace separation** pattern.

**The Problem**: If you develop FORGE using FORGE from the project root, agents
might accidentally modify templates when generating specs, breaking FORGE for
all users.

**The Solution**: A dedicated `dev/` workspace with its own `.forge/` directory
for FORGE-on-FORGE development.

### 8.2 Workspace Structure

```
forge/                          # Main repository
├── .opencode/                  # FORGE source code (agents, templates, etc.)
│   ├── agents/                 # Agent definitions
│   ├── commands/               # Slash commands
│   ├── skills/                 # Reusable skills
│   ├── templates/              # Document templates
│   ├── tools/                  # Custom tools
│   └── docs/                   # User documentation
├── .forge/                     # Example/template configuration for users
│   ├── constitution.md         # Template constitution
│   └── knowledge/              # Example knowledge structure
└── dev/                        # ⭐ Development workspace
    ├── .forge/                 # FORGE-on-FORGE development
    │   ├── constitution.md     # Constitution for developing FORGE
    │   ├── specs/              # Specs for new FORGE features
    │   │   └── NNN-slug/
    │   │       ├── spec.md
    │   │       ├── architecture.md
    │   │       ├── plan.md
    │   │       └── tasks.md
    │   ├── epics/              # Multi-feature FORGE initiatives
    │   ├── sprints/            # Sprint planning (if needed)
    │   └── knowledge/
    │       ├── decision-log.md
    │       ├── lessons-learned.md
    │       └── adr/
    └── README.md               # Development workspace guide
```

### 8.3 Development Workflow

#### Working on FORGE Features

When developing FORGE itself, always work from the `dev/` workspace:

```bash
cd forge/dev
opencode
```

Inside OpenCode, all FORGE commands will reference `dev/.forge/` for specs,
constitution, and knowledge base. Templates will still be loaded from
`../.opencode/templates/`, but generated files go into `dev/.forge/`.

#### Example: Adding a New Command (Quick Track)

```
# From forge/dev in OpenCode
> /forge-quick "Add /forge-validate command to check project health"
```

**What happens**:
1. PM agent creates: `dev/.forge/specs/001-forge-validate/tech-spec.md`
2. Tech spec includes path table:
   ```markdown
   ## Implementation Targets
   
   ### Files to Create
   | Path | Type | Description |
   |------|------|-------------|
   | `../.opencode/commands/forge-validate.md` | Command | Main command |
   
   ### Files to Modify
   | Path | Section/Line | Change Description |
   |------|--------------|---------------------|
   | `../.opencode/docs/FORGE-GUIDE.md` | Section 4 | Add docs |
   ```
3. Implementation agent writes to: `../.opencode/commands/forge-validate.md`
4. Review agent checks both spec and implementation
5. You commit both spec and implementation

**Output files**:
- `dev/.forge/specs/001-forge-validate/tech-spec.md` (documentation)
- `.opencode/commands/forge-validate.md` (actual code)

#### Example: Major Refactor (Feature Track)

```
> /forge-specify "Refactor agent orchestration for better context management"
```

**Full workflow**:

```
# 1. Create spec
> /forge-specify "Refactor agent orchestration"
# Output: dev/.forge/specs/002-agent-orchestration/spec.md
#         (includes "Implementation Scope" section with component paths)

# 2. Design architecture
> /forge-architecture dev/.forge/specs/002-agent-orchestration/spec.md
# Output: dev/.forge/specs/002-agent-orchestration/architecture.md
#         (includes "Component Layout" with file paths)

# 3. Create implementation plan
> /forge-plan dev/.forge/specs/002-agent-orchestration/
# Output: dev/.forge/specs/002-agent-orchestration/plan.md
#         (includes "File Map" and "Implementation Phases" with explicit paths)

# 4. Generate task list
> /forge-tasks dev/.forge/specs/002-agent-orchestration/
# Output: dev/.forge/specs/002-agent-orchestration/tasks.md
#         (each task has "File" field with explicit path)

# 5. Implement
> /forge-implement dev/.forge/specs/002-agent-orchestration/
# Reads task paths, writes to exact locations specified

# 6. Review
> /forge-review dev/.forge/specs/002-agent-orchestration/
# Finds minimum 3 real issues across 5 dimensions

# 7. Commit
$ git add .
$ git commit -m "refactor(agents): improve orchestration context (#002)"
```

### 8.4 Constitution for FORGE Development

The `dev/.forge/constitution.md` is specifically tailored for developing FORGE
itself. Key differences from a typical project constitution:

| Article               | Typical Project          | FORGE Development            |
| --------------------- | ------------------------ | ---------------------------- |
| **Technology Stack**  | Application stack        | Markdown, YAML, OpenCode SDK |
| **Architecture**      | App architecture         | Agent-based plugin system    |
| **Testing**           | Unit/integration tests   | Dogfooding (self-testing)    |
| **Security**          | App security             | Template injection, prompt security |
| **Naming**            | Code conventions         | Agent/command/skill naming   |

**Read the full constitution**: `dev/.forge/constitution.md`

### 8.5 Path Conventions

All paths in specs are **relative to the `dev/` directory**:

#### Path Notation Reference

| Target | Path from `dev/` | Resolves To |
|--------|------------------|-------------|
| FORGE command | `../.opencode/commands/forge-x.md` | `forge/.opencode/commands/forge-x.md` |
| FORGE agent | `../.opencode/agents/forge-x.md` | `forge/.opencode/agents/forge-x.md` |
| FORGE skill | `../.opencode/skills/x/SKILL.md` | `forge/.opencode/skills/x/SKILL.md` |
| FORGE doc | `../.opencode/docs/FORGE-GUIDE.md` | `forge/.opencode/docs/FORGE-GUIDE.md` |
| FORGE template | `../.opencode/templates/spec.md` | `forge/.opencode/templates/spec.md` |
| Dev spec | `./.forge/specs/001-slug/spec.md` | `forge/dev/.forge/specs/001-slug/spec.md` |
| Dev constitution | `./.forge/constitution.md` | `forge/dev/.forge/constitution.md` |
| Root template config | `../.forge/constitution.md` | `forge/.forge/constitution.md` |

#### Path Tables in Specs

Every spec document includes explicit path tables. This eliminates ambiguity
about where implementation happens.

**Example from tech-spec.md**:
```markdown
## Implementation Targets

### Files to Create
| Path | Type | Description |
|------|------|-------------|
| `../.opencode/commands/forge-doctor.md` | Command | Health check command |
| `../.opencode/tools/health-checker.ts` | Tool | Validation logic |

### Files to Modify
| Path | Section/Line | Change Description |
|------|--------------|---------------------|
| `../.opencode/docs/FORGE-GUIDE.md` | Section 4.4 | Add doctor command reference |
| `../.opencode/agents/forge.md` | Line 58 | Register new command |

### Files to Reference (Read-only)
| Path | Purpose |
|------|---------|
| `./.forge/constitution.md` | Validate command naming (Article 7.1) |
```

#### Path Validation

Before implementation, verify paths resolve correctly:

```bash
# From forge/dev/
cd dev

# Verify source path exists
ls ../.opencode/commands/           # Should list existing commands

# Verify spec path
ls ./.forge/specs/                  # Should list active specs

# Verify target directory exists
mkdir -p ../.opencode/commands/     # Ensure target exists
```

#### Common Path Mistakes

| ❌ Wrong | ✅ Correct | Issue |
|---------|-----------|-------|
| `./commands/forge-x.md` | `../.opencode/commands/forge-x.md` | Would create in `dev/commands/` |
| `.opencode/commands/forge-x.md` | `../.opencode/commands/forge-x.md` | Missing `../` prefix |
| `/Users/.../forge/.opencode/...` | `../.opencode/...` | Absolute path (not portable) |
| `commands/forge-x.md` | `../.opencode/commands/forge-x.md` | Ambiguous (bare relative) |

### 8.6 Track Selection for FORGE Features

| Feature Type               | Track   | Example                                    |
| -------------------------- | ------- | ------------------------------------------ |
| Typo in docs              | Hotfix  | Fix typo in FORGE-GUIDE.md                 |
| New simple command        | Quick   | Add `/forge-doctor` validation command     |
| New skill or agent        | Feature | Add `continuous-testing` skill             |
| Major orchestration change| Feature | Refactor context-chain loading             |
| FORGE 2.0 initiative      | Epic    | Complete GraphQL integration               |

### 8.7 Testing FORGE Changes (Dogfooding)

**Dogfooding Principle**: Every FORGE change should be tested by using FORGE itself.

#### The Dogfooding Test

1. **Develop the feature using FORGE** (create spec, architecture, plan, tasks)
2. **Use the new feature to develop another FORGE feature** (meta-testing)
3. **Document any friction** in `dev/.forge/knowledge/lessons-learned.md`

#### Example Testing Flow

```bash
# 1. Add new /forge-test command using Feature track
> /forge-specify "Add automated test generation command"
# ... follow full workflow ...

# 2. After implementing, use it to test another feature
> /forge-test dev/.forge/specs/003-new-skill/

# 3. If friction found, document it
> Note: /forge-test should auto-detect test framework from package.json
> Added to lessons-learned.md: Need to improve framework detection
```

If friction is discovered:
- Document in `dev/.forge/knowledge/lessons-learned.md`
- Create a follow-up spec to improve the feature
- Use FORGE to implement the improvement

### 8.8 Contributing to FORGE

See `CONTRIBUTING.md` in the repository root for:
- Branch naming for FORGE development
- PR requirements (must include spec reference)
- Review process (adversarial review required)
- Documentation standards

Quick overview:
- **Always work from `dev/`**: `cd dev && opencode`
- **Follow FORGE process**: Use `/forge-quick`, `/forge-specify`, etc.
- **Include spec in PR**: Link to `dev/.forge/specs/NNN-slug/`
- **Dogfooding required**: Use your feature to build another feature
- **Review required**: Run `/forge-review` before submitting PR

### 8.9 Common Pitfalls

| Pitfall                       | Solution                                      |
| ----------------------------- | --------------------------------------------- |
| Working from `forge/` root    | Always `cd forge/dev` before starting OpenCode|
| Modifying templates directly  | Create spec in `dev/.forge/specs/` first     |
| Skipping architecture phase   | FORGE features need architecture too          |
| Not dogfooding                | Use the feature to build another feature      |
| Forgetting path tables        | Every spec must have "Implementation Targets" or "Implementation Scope" |
| Using absolute paths          | Always use relative paths (`../` or `./`)     |

---

## 9. Tips & Best Practices

### 8.1 Context Management

- **Start fresh sessions for each workflow phase**. While not strictly required
  (OpenCode handles compaction), starting fresh ensures each phase gets the
  full context budget for its work.

- **Use @file references in prompts** to point agents at specific files
  when they need additional context beyond what the context-chain provides.

- **Keep constitution and ADRs concise**. These are loaded as instructions
  and consume context window in every session.

### 8.2 Spec Quality

- **Be specific in acceptance criteria**. "The login should be fast" is
  worthless. "The login endpoint must respond in < 200ms at P95" is testable.

- **Use [NEEDS CLARIFICATION] markers liberally** during the Specify phase.
  It is better to flag uncertainty explicitly than to guess.

- **Run /forge-clarify at least once** before proceeding to Plan. The
  clarification phase catches most spec issues before they become code issues.

### 8.3 Architecture

- **Create ADRs for every non-obvious decision**. If you spent more than
  5 minutes debating it, it deserves an ADR.

- **Reference ADRs in plans**. When a plan follows an ADR, link to it
  explicitly. This is bidirectional traceability in action.

- **Review ADRs when onboarding new team members**. ADRs are the fastest
  way to transfer architectural knowledge.

### 8.4 Review Process

- **Don't dismiss adversarial review findings automatically**. The reviewer
  is instructed to find issues, which means some will be false positives.
  But many will be real issues you would have missed.

- **Fix HIGH severity issues before creating a PR**. Let human reviewers
  focus on design, not mechanical issues.

- **Use the review output in PR descriptions**. Include the adversarial
  review summary so human reviewers know what was already checked.

### 8.5 Knowledge Base

- **Review the decision log weekly**. Automated extraction is imperfect.
  Some entries will be trivial; promote the important ones to ADRs.

- **Don't let lessons-learned.md grow unbounded**. Archive entries that
  are no longer relevant or that have been addressed.

### 8.6 Team Coordination

- **Commit .forge/ artifacts early and often**. These are shared project
  resources, just like code.

- **One person updates sprint files**. Concurrent edits to sprint YAML files
  in `.forge/sprints/active/` can cause merge conflicts. The scrum master
  should typically be the single writer, or coordinate sprint file updates.

- **Use feature branches for specs too**. When developing a feature, the
  spec and plan should be on the same branch as the code.

---

## 10. GitHub Integration (MCP)

FORGE integrates with GitHub via the
[Model Context Protocol](https://modelcontextprotocol.io) (MCP). The GitHub
MCP server is configured in `opencode.json` and gives FORGE agents access to
GitHub's API for issue management, pull requests, CI status, and more.

### 9.1 Setup

The MCP server is pre-configured in `opencode.json`:

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

**Requirements**:

1. Set the `GITHUB_TOKEN` environment variable with a
   [Personal Access Token](https://github.com/settings/tokens) that has
   `repo` scope (and `project` scope if using GitHub Projects).
2. Node.js 18+ installed (for `npx`).
3. The MCP server starts automatically when OpenCode launches.

### 9.2 Available GitHub Tools

Once connected, the following MCP tools become available to all agents:

| Tool                    | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `create_issue`          | Create a new issue on a repository             |
| `list_issues`           | List and filter issues                         |
| `get_issue`             | Get details of a specific issue                |
| `update_issue`          | Update issue title, body, labels, assignees    |
| `add_issue_comment`     | Add a comment to an issue                      |
| `create_pull_request`   | Create a pull request                          |
| `list_pull_requests`    | List pull requests with filters                |
| `get_pull_request`      | Get pull request details and diff              |
| `merge_pull_request`    | Merge a pull request                           |
| `get_pull_request_diff` | Get the diff for a pull request                |
| `create_branch`         | Create a new branch                            |
| `search_code`           | Search code across repositories                |
| `search_issues`         | Search issues and PRs                          |
| `get_file_contents`     | Read file contents from a repository           |
| `list_commits`          | List recent commits                            |

### 9.3 How FORGE Agents Use GitHub

Different FORGE commands leverage GitHub tools at specific workflow stages:

#### Sprint Planning (`/forge-sprint`)

The scrum master agent can create GitHub issues from sprint stories:

```
/forge-sprint start

> The agent will:
> 1. Read active sprint files from .forge/sprints/active/
> 2. Create GitHub issues for each story (with labels, assignees)
> 3. Link issues to the epic milestone (if applicable)
```

#### Code Review (`/forge-review`)

The reviewer agent can create pull requests with structured review output:

```
/forge-review src/auth/

> The agent will:
> 1. Perform adversarial review across 5 dimensions
> 2. Optionally create a PR with the review summary in the body
> 3. Add review comments to an existing PR if a PR URL is provided
```

#### Status Dashboard (`/forge-status`)

The scrum master can read CI/CD check status from GitHub:

```
/forge-status

> The agent will:
> 1. Read active sprint files from .forge/sprints/active/
> 2. Check GitHub CI status for the current branch
> 3. List any open PRs and their review status
> 4. Render a combined dashboard
```

#### Implementation (`/forge-implement`)

The build agent links commits to issues via conventional commit references:

```
/forge-implement 001-user-auth

> The agent will:
> 1. Read the spec and tasks
> 2. Implement each task
> 3. Create commits with "feat(auth): ... (closes #42)" format
> 4. The GitHub issue reference links implementation to the story
```

#### ADR Creation (`/forge-adr`)

The architect can link ADRs to relevant GitHub issues or PRs:

```
/forge-adr "Choose between REST and GraphQL for public API"

> The agent will:
> 1. Create the ADR document
> 2. Optionally reference the GitHub issue/PR that prompted the decision
> 3. Add a comment on the relevant issue linking to the ADR
```

### 9.4 Manual GitHub Tool Usage

Any FORGE agent with MCP access can use GitHub tools directly when asked.
Simply include GitHub-related instructions in your prompt:

```
@forge Create a GitHub issue for the login timeout bug we found.
Title it "Login form times out after 30 seconds on slow connections"
and label it "bug" and "priority:high".
```

```
@forge List all open PRs on this repo that are ready for review.
```

### 9.5 Extending MCP Integrations

FORGE is pre-configured for GitHub only. To add other MCP servers, see the
[Customization Guide](FORGE-CUSTOMIZATION.md#10-customizing-mcp-integrations)
for instructions on adding Jira/Linear, Sentry, Supabase, or custom MCP
servers.

### 9.6 Troubleshooting MCP

| Problem                               | Solution                                     |
| ------------------------------------- | -------------------------------------------- |
| "MCP server not connected"            | Check `GITHUB_TOKEN` is set. Run `echo $GITHUB_TOKEN` to verify. |
| "Permission denied" on GitHub API     | Ensure your token has `repo` scope. Regenerate at github.com/settings/tokens. |
| MCP tools not appearing in agent      | Restart OpenCode. MCP servers connect at startup. |
| "Rate limit exceeded"                 | GitHub API has rate limits. Wait or use a token with higher limits. |
| MCP server crashes on startup         | Run `npx -y @modelcontextprotocol/server-github` manually to see error output. |

---

## 11. Troubleshooting

### 10.1 "The agent is not following the constitution"

**Cause**: The constitution may not be loaded as an instruction.

**Fix**: Verify that `opencode.json` includes:
```json
{
  "instructions": [".forge/constitution.md"]
}
```

### 10.2 "Scope detection recommends the wrong track"

**Cause**: The initial description may be too vague or too detailed.

**Fix**: You can always override the track suggestion. The agent will ask for
confirmation before proceeding. If scope detection is consistently wrong,
review and tune the `scope-detection` skill.

### 10.3 "The adversarial review finds too many false positives"

**Cause**: The reviewer is instructed to find at least 3 issues, which can
force low-quality findings.

**Fix**: Focus on HIGH and MEDIUM severity. Ignore LOW severity if they seem
like nitpicks. If the problem persists, adjust the minimum issue count in
the `adversarial-review` skill.

### 10.4 "Cross-artifact analysis keeps finding inconsistencies"

**Cause**: Spec was updated without updating the plan, or vice versa.

**Fix**: After changing any document, run `/forge-analyze` to identify what
else needs updating. FORGE tracks cross-references but cannot auto-fix them.

### 10.5 "Sprint status YAML has merge conflicts"

**Cause**: Multiple people edited sprint files in `.forge/sprints/active/`
on different branches.

**Fix**: Designate one person (scrum master) as the sole editor of sprint
files. Others read sprint status via `/forge-status` but don't edit directly.
With multi-sprint support, consider assigning different people to manage
different sprints if needed.

### 10.6 "The knowledge base has too much noise"

**Cause**: The `session-knowledge` plugin extracts all decisions, including
trivial ones.

**Fix**: Review and prune the decision log weekly. The plugin captures broadly
to avoid missing important decisions; human curation is expected.

### 10.7 "A command is not triggering the expected agent"

**Cause**: Command file may have a typo in the `agent` frontmatter field.

**Fix**: Check `.opencode/commands/forge-[name].md` and verify the `agent`
field matches an existing agent name. Run `/forge-help` to see which agents
are loaded.

### 10.8 "I want to use FORGE but my project already has AGENTS.md"

**Cause**: Existing `AGENTS.md` may conflict with FORGE-generated rules.

**Fix**: Run `/forge-init` and it will merge your existing `AGENTS.md`
content with FORGE-specific sections. Your existing rules are preserved;
FORGE adds its sections at the end.

---

## Appendix: Quick Reference Card

```
FORGE Quick Reference
=====================

Tracks:          /forge-hotfix   Bug fix, 1 file, < 30 min
                 /forge-quick    Small feature, 1-5 tasks
                 /forge-specify  Medium feature, 5-20 tasks (start here)
                 /forge-brief    Large feature/epic, 20-50+ tasks
                 /forge-init     New product/platform

Feature Flow:    specify -> clarify -> plan -> analyze -> tasks -> implement -> review

Epic Flow:       brief -> prd -> architecture -> analyze
                 -> sprint -> story -> implement -> review -> retro

Status:          /forge-status   Sprint dashboard
                 /forge-help     Context-aware help

Knowledge:       /forge-adr      Create decision record
                 /forge-retro    Sprint retrospective

Key Files:       .forge/constitution.md         Governance
                 .forge/specs/NNN-*/spec.md     Feature specs
                 .forge/knowledge/adr/*.md      Decisions
                 .forge/sprints/active/*.yaml   Active sprints
```
