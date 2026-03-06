---
name: pre-flight-checks
description: Automatic health checks run before major FORGE commands to detect issues and warn about common problems
license: MIT
compatibility: opencode
metadata:
  audience: forge-orchestrator
  workflow: forge
---

## Purpose

Lightweight checks to ensure optimal FORGE operation before executing major
workflow commands. Three checks: decision log size, config validation,
directory structure. All non-blocking warnings except missing `.forge/`.

---

## Check 1: Decision Log Size

**Goal:** Warn when decision log exceeds thresholds; suggest archiviation.

**Logic:**
1. Count lines in `.forge/knowledge/decision-log.md` (skip if missing)
2. Estimate tokens: `chars / 4`
3. Load thresholds from `.forge/config.yml` or use defaults (`max_lines: 500`, `max_tokens: 20000`)
4. If exceeded → display warning; otherwise → silent

**Output — below threshold:**
```
✅ Pre-flight checks passed
```

**Output — above threshold:**
```
⚠️  Pre-flight check warning

Decision Log Size:
   Current: 1247 lines (~50k tokens)
   Threshold: 500 lines or 20k tokens
   Status: ⚠️  EXCEEDED (2.5x over)

Recommended Action:
   /forge-archive-decisions --dry-run

Continuing with command...
```

**Configuration** (`.forge/config.yml`):
```yaml
knowledge:
  decision_log:
    max_lines: 500
    max_tokens: 20000
    auto_suggest_archive: true
```

If `auto_suggest_archive: false`, skip this check.

---

## Check 2: Directory Structure

**Goal:** Ensure `.forge/` exists; block commands that require initialization.

**Logic:**
1. If `.forge/` missing → ERROR, block execution, suggest `/forge-init`
2. If `.forge/knowledge/` missing → create it silently
3. Command-specific dirs (e.g., `/forge-sprint` needs `.forge/sprints/`) → warn if missing

**Output — missing `.forge/`:**
```
❌ Pre-flight check failed

FORGE is not initialized in this project.

Run: /forge-init

Command aborted.
```

**Output — missing knowledge dir (auto-created):**
```
✅ Pre-flight checks passed
   - Created .forge/knowledge/ (was missing)
```

---

## Check 3: Config Validation

Validate `.forge/config.yml` syntax if it exists. If file is absent, skip.
If invalid YAML, display warning and use defaults — do not block execution.

```
⚠️  Invalid configuration detected
    File: .forge/config.yml
    Error: Line 23: unexpected character

    Run: /forge-validate-config

    Using default settings for now...
```

---

## Error Handling

All checks are non-blocking warnings **except** missing `.forge/` which blocks
initialization-required commands. If a check fails to run, log a warning but
continue with command execution.

```
⚠️  Could not check decision log size
    File: .forge/knowledge/decision-log.md
    Error: Permission denied

    Continuing anyway...
```

---

## Skip Override

Users can bypass checks for urgent work:

```
/forge-specify --skip-checks
/forge-specify --skip-decision-log-check
```

Parse these flags in orchestrator and skip accordingly.
