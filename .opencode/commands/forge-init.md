---
description: "Initialize FORGE for a new or existing project"
agent: forge
---

# FORGE Project Initialization

Set up FORGE methodology for new or existing codebases.

## Arguments

`$ARGUMENTS`:
- empty → full interactive init
- `--constitution` → constitution only

## Steps

### 1. Detect Project State

- `.forge/constitution.md` exists and customized (not template)?
- `.forge/` tree with all subdirs?
- `opencode.json` has FORGE config?
- `AGENTS.md` present?
- Brownfield (existing source)?

Report findings before proceeding.

### 2. Directory Structure

The installer scaffolds this tree. Verify it, and create anything missing:

```
.forge/
  constitution.md            # user-owned — never overwritten by an update
  templates/                 # document templates used by the commands
  docs/                      # methodology documentation
  frontend/                  # pattern library (patterns, design system)
  mcp-server/                # shared MCP tools
  knowledge/
    adr/
    decision-log.md
    lessons-learned.md
  product/
  specs/
  epics/
  sprints/
    active/                  # sprint-NNN.yaml, one file per active sprint
    completed/
    retrospectives/
    sprint-sequence.yaml
```

`AGENTS.md` sits at the project root, not inside `.forge/`.

### 3. Constitution Setup

If not customized:
1. Read `.forge/templates/constitution.md`.
2. Walk the user through each Article present in that template via the
   `question` tool. **Do not assume a fixed article count** — read the
   headings from the template and use those. The shipped user template has
   9 articles (Core Principles, Technology Stack, Architecture Patterns,
   Quality, Security, Error Handling, Naming, Testing, Operational), but a
   project may amend it.
3. Write the customized constitution to `.forge/constitution.md`.
4. Confirm the platform config loads it — for OpenCode, `opencode.json`
   must contain:
   ```json
   "instructions": [".forge/constitution.md", ".forge/knowledge/decision-log.md"]
   ```
   Without this the constitution never enters model context and every
   compliance check is vacuous.

### 4. Configuration Verification

`opencode.json` must contain:
- Model strategy with GitHub Copilot provider
- FORGE agents referenced
- MCP config for GitHub (if `GITHUB_TOKEN` available)
- Instructions array → constitution and decision-log

### 5. AGENTS.md Verification

Must contain: project overview · tech stack · code conventions · git workflow · testing · FORGE governance refs.

### 6. Brownfield Assessment

If existing code: ask about brownfield analysis. If yes, suggest `/forge-brief` with `brownfield-analysis` skill.

### 7. Readiness Report

```
FORGE Readiness Report
======================
Directory structure:  [OK/MISSING]
Constitution:         [OK/TEMPLATE ONLY/MISSING]
Configuration:        [OK/INCOMPLETE]
AGENTS.md:            [OK/MISSING]
Knowledge base:       [OK/MISSING]
Brownfield analysis:  [DONE/SKIPPED/N/A]

Recommended next: [/forge-brief | /forge-specify | /forge-quick]
```
