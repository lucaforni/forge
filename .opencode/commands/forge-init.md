---
description: "Initialize FORGE for a new or existing project"
agent: forge
---

# FORGE Project Initialization

You are handling `/forge-init` for the project. This sets up the FORGE
methodology for a new or existing codebase.

## Arguments

The user may provide: $ARGUMENTS

If no arguments are provided, run full interactive initialization.
If `--constitution` is provided, only set up the constitution.

## Initialization Steps

### Step 1: Detect Project State

Check what already exists:

1. Does `.forge/constitution.md` exist and has it been customized (not just
   the template)?
2. Does `.forge/` directory structure exist with all required subdirectories?
3. Does `opencode.json` exist with FORGE configuration?
4. Does `AGENTS.md` exist?
5. Is this a brownfield project (existing source code)?

Report findings to the user before proceeding.

### Step 2: Directory Structure

Verify or create the complete `.forge/` directory tree:

```
.forge/
  constitution.md
  knowledge/
    adr/
    decision-log.md
    lessons-learned.md
  product/
  architecture/
    diagrams/
  specs/
  epics/
  sprints/
    retrospectives/
```

### Step 3: Constitution Setup

If the constitution has not been customized:

1. Read the template from `.opencode/templates/constitution.md`.
2. Walk the user through each of the 9 Articles using the `question` tool:
   - Article 1: Core Principles
   - Article 2: Technology Stack
   - Article 3: Architecture Patterns
   - Article 4: Quality Standards
   - Article 5: Security
   - Article 6: Error Handling
   - Article 7: Naming & Conventions
   - Article 8: Testing Standards
   - Article 9: Operational Requirements
3. For each article, ask what values apply to their project.
4. Write the customized constitution to `.forge/constitution.md`.

### Step 4: Configuration Verification

Verify `opencode.json` contains:
- Model strategy with GitHub Copilot provider
- FORGE agents referenced
- MCP configuration for GitHub (if GITHUB_TOKEN is available)
- Instructions array pointing to constitution and decision-log

### Step 5: AGENTS.md Verification

Verify `AGENTS.md` contains:
- Project overview
- Technology stack
- Code conventions
- Git workflow
- Testing requirements
- FORGE governance references

### Step 6: Brownfield Assessment

If existing source code is detected:
1. Ask the user if they want a brownfield analysis.
2. If yes, suggest running `/forge-brief` with the `brownfield-analysis` skill.
3. This will produce a report of existing architecture, conventions, and
   tech debt that can inform the constitution.

### Step 7: Readiness Report

Present a structured readiness report:

```
FORGE Readiness Report
======================
Directory structure:  [OK/MISSING]
Constitution:         [OK/TEMPLATE ONLY/MISSING]
Configuration:        [OK/INCOMPLETE]
AGENTS.md:            [OK/MISSING]
Knowledge base:       [OK/MISSING]
Brownfield analysis:  [DONE/SKIPPED/N/A]

Recommended next step: [/forge-brief | /forge-specify | /forge-quick]
```
