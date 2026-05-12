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

Lightweight checks before major workflow commands. Three checks: decision log
size, directory structure, config validation. All non-blocking warnings
**except** missing `.forge/` which blocks init-required commands.

---

## Check 1: Decision Log Size

**Goal**: warn when `.forge/knowledge/decision-log.md` exceeds thresholds; suggest archiving.

**Logic**:
1. Count lines (skip if missing). Estimate tokens: `chars / 4`.
2. Load thresholds from `.forge/config.yml` or use defaults (`max_lines: 500`, `max_tokens: 20000`).
3. If exceeded → warning; else → silent.

**Output — below threshold**:
```
✅ Pre-flight checks passed
```

**Output — above threshold**:
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

**Config** (`.forge/config.yml`):
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

**Goal**: ensure `.forge/` exists; block init-required commands.

**Logic**:
1. `.forge/` missing → ERROR, block, suggest `/forge-init`.
2. `.forge/knowledge/` missing → create silently.
3. Command-specific dirs (e.g., `/forge-sprint` needs `.forge/sprints/`) → warn if missing.

**Output — missing `.forge/`**:
```
❌ Pre-flight check failed

FORGE is not initialized in this project.

Run: /forge-init

Command aborted.
```

**Output — knowledge dir auto-created**:
```
✅ Pre-flight checks passed
   - Created .forge/knowledge/ (was missing)
```

---

## Check 3: Config Validation

Validate `.forge/config.yml` syntax if present. If absent, skip. If invalid YAML,
warn and use defaults — do not block.

```
⚠️  Invalid configuration detected
    File: .forge/config.yml
    Error: Line 23: unexpected character

    Run: /forge-validate-config

    Using default settings for now...
```

---

## Error Handling

All checks non-blocking except missing `.forge/`. If a check itself fails, log
a warning and continue.

```
⚠️  Could not check decision log size
    File: .forge/knowledge/decision-log.md
    Error: Permission denied

    Continuing anyway...
```

---

## Skip Override

Bypass for urgent work:

```
/forge-specify --skip-checks
/forge-specify --skip-decision-log-check
```

Parse these flags in orchestrator and skip accordingly.
