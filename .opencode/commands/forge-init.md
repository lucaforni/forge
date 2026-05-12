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

Verify or create:

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

### 3. Constitution Setup

If not customized:
1. Read `.opencode/templates/constitution.md`.
2. Walk user through 9 Articles via `question` tool:
   - 1: Core Principles · 2: Technology Stack · 3: Architecture Patterns
   - 4: Quality · 5: Security · 6: Error Handling
   - 7: Naming · 8: Testing · 9: Operational
3. Write customized constitution to `.forge/constitution.md`.

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
