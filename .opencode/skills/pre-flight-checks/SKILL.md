# Pre-Flight Checks Skill

> **Purpose:** Automatic health checks run before executing FORGE commands to
> detect and warn about common issues that could impact workflow performance.
>
> **When to use:** Automatically loaded at the start of major FORGE workflow
> commands (specify, plan, implement, etc.).

---

## Overview

This skill performs lightweight checks to ensure optimal FORGE operation:

1. **Decision log size check** - Warns if exceeding threshold
2. **Config validation** - Verifies `.forge/config.yml` is valid (if exists)
3. **Directory structure** - Ensures `.forge/` directories exist

These checks take < 1 second and provide actionable warnings without blocking
execution.

---

## Check 1: Decision Log Size

### Purpose

Detect when decision log exceeds configured thresholds and suggest archiviation.

### Logic

```
1. Check if .forge/knowledge/decision-log.md exists
2. If exists:
   a. Count lines
   b. Estimate tokens (~4 chars = 1 token)
   c. Load config thresholds (or use defaults)
   d. Compare against thresholds
3. If exceeded:
   - Display warning with current size
   - Suggest running /forge-archive-decisions
   - Show estimated space savings
```

### Implementation

```bash
# Check decision log size
wc -l .forge/knowledge/decision-log.md

# Load config (or use defaults)
max_lines=${config.knowledge.decision_log.max_lines:-500}
max_tokens=${config.knowledge.decision_log.max_tokens:-20000}

# Estimate tokens
chars=$(wc -c < .forge/knowledge/decision-log.md)
est_tokens=$((chars / 4))

# Compare and warn
if [ $lines -gt $max_lines ] || [ $est_tokens -gt $max_tokens ]; then
  echo "⚠️  Decision log is large ($lines lines, ~${est_tokens}k tokens)"
  echo "    Threshold: $max_lines lines or ${max_tokens}k tokens"
  echo "    This may slow down context loading."
  echo ""
  echo "    💡 Suggested action:"
  echo "       /forge-archive-decisions"
  echo ""
  echo "    Preview first: /forge-archive-decisions --dry-run"
fi
```

### Output Examples

**Below threshold:**
```
✅ Pre-flight checks passed
   - Decision log: 287 lines (~11k tokens) ✓
```

**Above threshold:**
```
⚠️  Pre-flight check warning

Decision Log Size:
   Current: 3521 lines (~141k tokens)
   Threshold: 500 lines or 20k tokens
   Status: ⚠️  EXCEEDED (7x over limit)

Impact:
   - Slower context loading
   - Frequent context compaction
   - Reduced space for specs/plans

Recommended Action:
   /forge-archive-decisions

Preview impact:
   /forge-archive-decisions --dry-run

Estimated after archiviation:
   ~300 lines (~15k tokens) - 85% reduction
```

### Configuration

Read from `.forge/config.yml`:

```yaml
knowledge:
  decision_log:
    max_lines: 500
    max_tokens: 20000
    auto_suggest_archive: true    # Enable/disable this check
```

If `auto_suggest_archive: false`, skip this check.

---

## Check 2: Config Validation (Future)

### Purpose

Validate `.forge/config.yml` syntax and values if it exists.

### Logic

```
1. Check if .forge/config.yml exists
2. If exists:
   a. Parse YAML (check syntax)
   b. Verify required fields
   c. Check value ranges are sensible
3. If invalid:
   - Display specific error
   - Suggest fix or running /forge-validate-config
```

**Note:** This check is optional and only runs if config file exists.
Not implemented in v1 (future enhancement).

---

## Check 3: Directory Structure

### Purpose

Ensure `.forge/` directory structure exists for current track.

### Logic

```
1. Check if .forge/ exists (if not, suggest /forge-init)
2. Check if .forge/knowledge/ exists (create if missing)
3. For specific commands, check required directories:
   - /forge-specify requires .forge/
   - /forge-sprint requires .forge/sprints/
```

### Output

**Missing .forge/:**
```
❌ Pre-flight check failed

FORGE not initialized in this project.

Run: /forge-init
```

**Missing knowledge directory:**
```
✅ Pre-flight checks passed
   - Created .forge/knowledge/ (was missing)
```

---

## Integration Points

### Commands That Run Pre-Flight Checks

**Always run:**
- `/forge-specify`
- `/forge-plan`
- `/forge-implement`
- `/forge-prd`
- `/forge-architecture`
- `/forge-sprint`

**Never run:**
- `/forge-init` (checks would fail, init creates structure)
- `/forge-help` (no need, informational only)
- `/forge-archive-decisions` (would be circular)
- `/forge-validate-decisions` (standalone validation)

**Optional (user can skip):**
- `/forge-quick` (fast track, minimal overhead)
- `/forge-hotfix` (urgent, skip checks)

### How to Invoke

The FORGE orchestrator automatically runs this skill:

```markdown
## Pre-Flight Checks (Run Before Every Major Command)

Before executing workflow commands, run pre-flight checks:

1. Load the `pre-flight-checks` skill
2. Execute checks silently (< 1 second)
3. If warnings found, display them with suggested actions
4. If errors found (e.g., .forge/ missing), block and require fix
5. Continue with normal command execution

Example invocation:
- User runs: /forge-specify
- Orchestrator:
  a. Loads pre-flight-checks skill
  b. Checks decision log size, config, directories
  c. Displays any warnings
  d. Continues to forge-pm for specification
```

---

## Error Handling

### Check Failures

**Decision log check fails (file unreadable):**
```
⚠️  Could not check decision log size
    File: .forge/knowledge/decision-log.md
    Error: Permission denied

    Continuing anyway...
```

**Config check fails (invalid YAML):**
```
⚠️  Invalid configuration detected
    File: .forge/config.yml
    Error: Line 23: unexpected character

    Run: /forge-validate-config

    Using default settings for now...
```

### Graceful Degradation

All checks are non-blocking warnings (except missing `.forge/` which blocks
initialization-required commands). If a check fails to run, log a warning
but continue with command execution.

---

## Performance

### Targets

- **Total check time:** < 1 second
- **Decision log check:** < 100ms (simple line count)
- **Config check:** < 200ms (YAML parse)
- **Directory check:** < 50ms (stat calls)

### Implementation Notes

- Use shell commands (`wc`, `stat`) for speed
- Avoid parsing entire decision log (just count lines, estimate tokens)
- Cache config values within single command execution
- Run checks in parallel where possible

---

## Configuration Options

Add to `.forge/config.yml`:

```yaml
pre_flight_checks:
  enabled: true                     # Master switch
  
  decision_log:
    enabled: true                   # Check decision log size
    warn_at_percent: 100            # Warn at 100% of threshold
    
  config_validation:
    enabled: false                  # Validate config (future)
    
  directory_structure:
    enabled: true                   # Check .forge/ exists
    auto_create: true               # Auto-create missing directories
```

---

## User Experience

### Good Path (No Issues)

```
$ /forge-specify

✅ Pre-flight checks passed

Creating specification for feature...
```

Checks run silently, user only sees success checkmark.

---

### Warning Path (Decision Log Large)

```
$ /forge-specify

⚠️  Pre-flight check warning

Decision Log Size:
   Current: 1247 lines (~50k tokens)
   Threshold: 500 lines or 20k tokens
   Status: ⚠️  EXCEEDED (2.5x over)

Recommended Action:
   /forge-archive-decisions --dry-run

Press Enter to continue, or Ctrl+C to archive first...

Creating specification for feature...
```

User can choose to continue or fix first.

---

### Error Path (FORGE Not Initialized)

```
$ /forge-specify

❌ Pre-flight check failed

FORGE is not initialized in this project.

Required directory missing: .forge/

Run: /forge-init

Command aborted.
```

Execution blocked, user must initialize first.

---

## Skip Checks (Override)

Allow users to skip checks for urgent situations:

```bash
# Skip all checks
/forge-specify --skip-checks

# Skip specific check
/forge-specify --skip-decision-log-check
```

Add to command parsing logic in orchestrator.

---

## Future Enhancements

### 1. Smart Caching

Cache check results for 60 seconds to avoid redundant checks in rapid
command sequences.

### 2. Health Score

Aggregate checks into overall project health score:

```
🏥 Project Health: 85/100

✅ Directory structure
✅ Configuration valid
⚠️  Decision log large (impact: -10)
⚠️  3 stale pending decisions (impact: -5)
```

### 3. Historical Tracking

Track decision log growth rate:

```
📊 Decision Log Growth
   Last 7 days: +500 lines/day
   Estimated time to threshold: 2 days
   Recommended: Schedule archiviation
```

### 4. Auto-Archive Mode

If enabled in config, automatically archive when threshold hit (with
confirmation):

```yaml
knowledge:
  decision_log:
    auto_archive_mode: prompt      # Options: never, prompt, always
```

---

## Testing

### Test Scenarios

1. **Decision log below threshold** → No warning
2. **Decision log at 501 lines (threshold 500)** → Warning shown
3. **Decision log at 3500 lines** → Strong warning with estimated savings
4. **`.forge/` missing** → Error, command blocked
5. **`.forge/config.yml` invalid YAML** → Warning, use defaults
6. **All checks pass** → Silent success

### Manual Testing

```bash
# Create large decision log for testing
yes "## 2026-02-17 | Test\n**Status:** \`completed\`\n---" | head -n 1500 > .forge/knowledge/decision-log.md

# Run command
/forge-specify

# Should see warning about decision log size
```

---

## Implementation Checklist

- [x] Skill documented
- [ ] Integrate into forge.md orchestrator
- [ ] Test decision log size check
- [ ] Test directory structure check
- [ ] Test warning display format
- [ ] Test --skip-checks flag
- [ ] Update user documentation

---

## Related Documentation

- **Decision Log Management:** `.opencode/docs/knowledge-management.md`
- **Archiviation Command:** `.opencode/commands/forge-archive-decisions.md`
- **Configuration:** `.opencode/docs/config-guide.md`
