# Pre-Flight Checks Implementation Guide

> Practical guide for implementing automatic pre-flight checks in FORGE
> orchestrator and subagents.

---

## Overview

Pre-flight checks are lightweight validations run before major FORGE commands
to detect issues that could impact performance or workflow.

**Primary Check:** Decision log size monitoring with automatic archive suggestion

---

## Implementation in Orchestrator

### Step 1: Detect Command Type

When a command is invoked, determine if it requires pre-flight checks:

```python
# Commands that need checks
NEEDS_CHECKS = [
  '/forge-specify',
  '/forge-plan', 
  '/forge-implement',
  '/forge-prd',
  '/forge-architecture',
  '/forge-sprint'
]

# Commands that skip checks
SKIP_CHECKS = [
  '/forge-init',           # Would fail, creates structure
  '/forge-help',           # Informational only
  '/forge-archive-decisions',  # Circular dependency
  '/forge-validate-decisions', # Standalone
  '/forge-quick',          # Fast track option
  '/forge-hotfix'          # Urgent track option
]
```

### Step 2: Execute Checks

Use Bash tool to run checks:

```bash
# Check 1: Decision log exists and get size
if [ -f .forge/knowledge/decision-log.md ]; then
  lines=$(wc -l < .forge/knowledge/decision-log.md)
  chars=$(wc -c < .forge/knowledge/decision-log.md)
  tokens=$((chars / 4))
else
  lines=0
  tokens=0
fi

# Check 2: Load threshold from config (or use default)
threshold=500
if [ -f .forge/config.yml ]; then
  # Try to extract max_lines from config
  threshold=$(grep -A2 "decision_log:" .forge/config.yml | grep "max_lines:" | awk '{print $2}' || echo "500")
fi

# Check 3: Compare and output result
if [ $lines -gt $threshold ]; then
  echo "WARN|$lines|$tokens|$threshold"
else
  echo "OK|$lines|$tokens|$threshold"
fi
```

### Step 3: Parse Results and Display

Parse the output from bash command:

```
If output starts with "WARN":
  - Extract values: lines, tokens, threshold
  - Calculate excess: lines / threshold
  - Display formatted warning
  - Suggest /forge-archive-decisions
  - Estimate space savings (typically 70-85%)
  - Continue with command execution

If output starts with "OK":
  - Show brief success: "✅ Pre-flight checks passed"
  - Continue with command execution
  
If bash command fails:
  - Log warning about check failure
  - Continue anyway (non-blocking)
```

---

## Example Implementation (Pseudo-code)

```python
def run_pre_flight_checks():
    """Run pre-flight checks before major commands."""
    
    # Execute check script
    result = bash("""
        if [ -f .forge/knowledge/decision-log.md ]; then
          lines=$(wc -l < .forge/knowledge/decision-log.md)
          chars=$(wc -c < .forge/knowledge/decision-log.md)
          tokens=$((chars / 4))
        else
          lines=0
          tokens=0
        fi
        
        threshold=500
        if [ -f .forge/config.yml ]; then
          cfg_threshold=$(grep -A2 "decision_log:" .forge/config.yml | grep "max_lines:" | awk '{print $2}')
          if [ -n "$cfg_threshold" ]; then
            threshold=$cfg_threshold
          fi
        fi
        
        if [ $lines -gt $threshold ]; then
          echo "WARN|$lines|$tokens|$threshold"
        else
          echo "OK|$lines|$tokens|$threshold"
        fi
    """)
    
    # Parse result
    status, lines, tokens, threshold = result.strip().split('|')
    
    if status == "WARN":
        # Display warning
        excess_factor = int(lines) / int(threshold)
        print(f"""
⚠️  Pre-flight check warning

Decision Log Size:
   Current: {lines} lines (~{tokens} tokens)
   Threshold: {threshold} lines
   Status: ⚠️  EXCEEDED ({excess_factor:.1f}x over limit)

Impact:
   - Slower context loading
   - Frequent context compaction
   - Reduced space for specs/plans

Recommended Action:
   /forge-archive-decisions

Preview impact:
   /forge-archive-decisions --dry-run

Estimated after archiviation:
   ~{int(lines) * 0.15} lines (~{int(tokens) * 0.15} tokens)
   {100 - 15}% reduction 🎉

Continuing with command...
""")
    
    elif status == "OK":
        print("✅ Pre-flight checks passed")
    
    # Always continue (non-blocking)
    return True
```

---

## Actual Implementation Using OpenCode Tools

Since we're in OpenCode environment, here's the real implementation:

```markdown
## Before Executing Workflow Command

Before invoking subagents for major workflow commands, run this check:

1. Use Bash tool to check decision log size:
   ```bash
   # Get decision log stats
   if [ -f .forge/knowledge/decision-log.md ]; then
     lines=$(wc -l < .forge/knowledge/decision-log.md)
     chars=$(wc -c < .forge/knowledge/decision-log.md)
     tokens=$((chars / 4))
     
     # Load threshold (default: 500)
     threshold=500
     if [ -f .forge/config.yml ]; then
       cfg_val=$(grep "max_lines:" .forge/config.yml | head -1 | awk '{print $2}')
       [ -n "$cfg_val" ] && threshold=$cfg_val
     fi
     
     echo "$lines|$tokens|$threshold"
   else
     echo "0|0|500"
   fi
   ```

2. Parse output:
   - Split by pipe: lines, tokens, threshold
   - Compare lines > threshold
   
3. If exceeded:
   - Display warning message with current size
   - Suggest: /forge-archive-decisions --dry-run
   - Estimate savings: ~85% reduction typical
   - Continue with command

4. If OK:
   - Show: "✅ Pre-flight checks passed"
   - Continue with command

**Example warning message:**

```
⚠️  Decision log size warning

Current: 1247 lines (~50k tokens)
Threshold: 500 lines
Status: EXCEEDED (2.5x over limit)

Recommended: /forge-archive-decisions --dry-run

Continuing...
```

Keep it concise - this is a warning, not an error.
```

---

## Testing the Implementation

### Test Case 1: Small Decision Log (< 500 lines)

```bash
# Create small test file
echo "# Decision Log" > .forge/knowledge/decision-log.md
for i in {1..100}; do
  echo "## 2026-02-17 | Test $i" >> .forge/knowledge/decision-log.md
  echo "**Status:** \`completed\`" >> .forge/knowledge/decision-log.md
  echo "---" >> .forge/knowledge/decision-log.md
done

# Run check
/forge-specify
```

**Expected output:**
```
✅ Pre-flight checks passed

Creating specification...
```

---

### Test Case 2: Large Decision Log (> 500 lines)

```bash
# Create large test file
for i in {1..600}; do
  echo "## 2026-02-17 | Test $i" >> .forge/knowledge/decision-log.md
  echo "**Status:** \`completed\`" >> .forge/knowledge/decision-log.md
  echo "---" >> .forge/knowledge/decision-log.md
done

# Run check
/forge-specify
```

**Expected output:**
```
⚠️  Decision log size warning

Current: 1800 lines (~72k tokens)
Threshold: 500 lines
Status: EXCEEDED (3.6x over limit)

Recommended: /forge-archive-decisions --dry-run

Continuing with specification...

Creating specification for...
```

---

### Test Case 3: Custom Threshold in Config

```bash
# Create config with custom threshold
cat > .forge/config.yml << EOF
knowledge:
  decision_log:
    max_lines: 300
    keep_recent: 20
EOF

# Create file with 400 lines (exceeds 300)
# Should trigger warning
```

---

## Configuration

Users can configure pre-flight checks in `.forge/config.yml`:

```yaml
pre_flight_checks:
  enabled: true                     # Master switch (default: true)
  
  decision_log:
    enabled: true                   # Check size (default: true)
    warn_at_lines: 500              # Warning threshold
    warn_at_tokens: 20000           # Alternative threshold
    
  show_success_message: false       # Only show if issues (default: false)
```

If `enabled: false`, skip all checks.
If `show_success_message: false`, only show warnings/errors (silent success).

---

## Integration Checklist

- [x] Created pre-flight-checks skill documentation
- [x] Added instructions to forge.md orchestrator
- [x] Documented implementation approach
- [ ] Test with small decision log
- [ ] Test with large decision log (> threshold)
- [ ] Test with custom config threshold
- [ ] Test --skip-checks flag
- [ ] Update user docs with examples

---

## User Documentation Update

Add section to `.opencode/docs/knowledge-management.md`:

```markdown
## Automatic Size Monitoring

FORGE automatically monitors decision log size and suggests archiviation
when thresholds are exceeded.

**How it works:**
1. Before major commands (/forge-specify, /forge-plan, etc.), FORGE checks
   decision log size
2. If size exceeds 500 lines (or your configured threshold), a warning is
   displayed with recommended action
3. You can continue working immediately - the warning is non-blocking
4. Run /forge-archive-decisions when convenient

**Configure threshold:**
Edit `.forge/config.yml`:
```yaml
knowledge:
  decision_log:
    max_lines: 300    # Lower for high-velocity teams
```

**Skip checks for urgent work:**
```bash
/forge-specify --skip-checks
```
```

---

## Performance Impact

**Check execution time:** ~50ms
- wc -l: ~10ms
- wc -c: ~10ms
- grep config: ~20ms
- awk parsing: ~10ms

**Acceptable overhead:** < 100ms added to command execution
**User experience:** Imperceptible delay, valuable warning

---

## Future Enhancements

### 1. Caching

Cache check results for 60 seconds to avoid redundant checks:

```bash
cache_file=".forge/.cache/last_check"
cache_max_age=60

if [ -f "$cache_file" ]; then
  age=$(($(date +%s) - $(stat -f %m "$cache_file")))
  if [ $age -lt $cache_max_age ]; then
    cat "$cache_file"
    exit 0
  fi
fi

# Run actual check
result="..."
echo "$result" | tee "$cache_file"
```

### 2. Smart Suggestions

Based on log size, suggest different actions:

- 500-1000 lines: "Consider archiving soon"
- 1000-2000 lines: "Recommend archiving"  
- 2000+ lines: "**Strongly recommend** archiving - impacting performance"

### 3. Auto-Archive Mode

Optionally auto-archive with confirmation:

```yaml
knowledge:
  decision_log:
    auto_archive_mode: prompt    # Options: never, prompt, always
```

If `prompt`, ask user:
```
⚠️  Decision log exceeded threshold (1247 lines)

Archive now? [Y/n/preview]
```

---

## Related Files

- **Skill:** `.opencode/skills/pre-flight-checks/SKILL.md`
- **Orchestrator:** `.opencode/agents/forge.md`
- **Archive Command:** `.opencode/commands/forge-archive-decisions.md`
- **Knowledge Management:** `.opencode/docs/knowledge-management.md`
