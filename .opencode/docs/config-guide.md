# FORGE Configuration Guide

> Complete guide for configuring FORGE behavior via `.forge/config.yml`

---

## Setup

1. Copy the template to your project:
   ```bash
   cp .opencode/templates/forge-config.yml .forge/config.yml
   ```

2. Customize for your team

3. Commit to version control

---

## Configuration Sections

### 1. Knowledge Management

Controls decision log archiviation and validation behavior.

```yaml
knowledge:
  decision_log:
    max_lines: 500                    # When to trigger archiviation
    keep_recent: 30                   # How many entries to keep
    critical_tags:                    # Tags that prevent archiviation
      - critical
      - constitutional
```

**Key Settings:**

- `max_lines` / `max_tokens`: Thresholds that trigger auto-archive suggestion
- `keep_recent`: Number of most recent entries always kept (default: 30)
- `critical_tags`: Entries with these tags are never archived
- `auto_archive`: If true, FORGE suggests archiving when threshold hit

**Tuning for Your Team:**

| Team Size | Velocity | Recommended max_lines |
|-----------|----------|----------------------|
| 1-3       | Low      | 500                  |
| 4-10      | Medium   | 300                  |
| 10+       | High     | 200                  |

High-velocity teams should use lower thresholds to keep context manageable.

---

### 2. Workflow Configuration

Defines thresholds for automatic track recommendation and sprint settings.

```yaml
workflow:
  scope_detection:
    feature:
      max_files: 20
      max_tasks: 20
      max_duration_days: 5
```

See `.opencode/skills/scope-detection/SKILL.md` for how these thresholds
are used in complexity assessment.

---

### 3. Code Quality

Sets test coverage targets and review requirements.

```yaml
quality:
  testing:
    coverage:
      minimum_line: 70          # CI fails below this
      target_line: 85           # Aspire to this
```

Used by `/forge-test` and the forge-qa agent.

---

### 4. Documentation

Controls ADR and spec numbering formats.

```yaml
documentation:
  adr:
    numbering_format: "ADR-{seq:04d}"    # ADR-0001, ADR-0042
  specs:
    numbering_format: "{seq:03d}-{slug}" # 042-auth-system
```

---

### 5. Context Management

Manages token budget allocation across FORGE phases.

```yaml
context:
  token_budget:
    max_per_phase: 50000
    decision_log: 20000
```

If `decision_log` budget is exceeded, archiviation is recommended.

---

### 6. Team Configuration

Defines team members for mentions and notifications.

```yaml
team:
  members:
    - github: alice
      role: tech_lead
      focus: [backend, architecture]
```

Used for @mentions in decision log and spec assignments.

---

### 7. CI/CD Integration

Hooks for automated checks.

```yaml
ci:
  pre_commit:
    - validate_decisions
  pr_checks:
    - ai_adversarial_review
```

Can be integrated with git hooks or GitHub Actions.

---

## Command-Line Overrides

Most commands accept flags to override config values:

```bash
# Override keep_recent
/forge-archive-decisions --keep 50

# Override strict mode
/forge-validate-decisions --strict
```

---

## Validation

Validate your configuration:

```bash
/forge-validate-config
```

Checks for:
- Valid YAML syntax
- Required fields present
- Sensible value ranges
- File paths exist

---

## Best Practices

1. **Start with template defaults** - they're tuned for most teams
2. **Adjust `max_lines` based on team size and velocity**
3. **Add custom `critical_tags`** for your domain (e.g., `compliance`, `legal`)
4. **Review quarterly** - adjust thresholds as team grows
5. **Keep in sync with constitution** - config should align with principles

---

## Example: High-Velocity Team

For teams with 400%+ efficiency (like yours!):

```yaml
knowledge:
  decision_log:
    max_lines: 300              # Lower threshold
    max_tokens: 15000
    keep_recent: 20             # Shorter history
    auto_archive: true          # Auto-suggest frequently
    
    critical_tags:
      - critical
      - constitutional
      - breaking-change
      - compliance              # Custom tag
      - customer-facing         # Custom tag
```

---

## Example: Regulated Industry

For teams with compliance requirements:

```yaml
knowledge:
  decision_log:
    max_lines: 500
    keep_recent: 50             # Keep more history
    
    critical_tags:
      - critical
      - constitutional
      - compliance
      - audit-trail
      - legal
      - security-critical
    
    validation:
      require_status: true
      require_tags: true        # Enforce tagging
      require_context: true     # Enforce documentation

quality:
  testing:
    coverage:
      minimum_line: 85          # Strict requirements
      target_line: 95
      critical_paths: 100
  
  review:
    ai_review_required: true
    human_review_required: true
    min_issues_to_find: 5       # Thorough review
```

---

## Troubleshooting

### "Config file not found"

Create `.forge/config.yml` from template, or FORGE will use defaults.

### "Invalid YAML syntax"

Run: `/forge-validate-config` for detailed error messages.

### "Token budget exceeded even after archiviation"

Lower `context.token_budget.decision_log` or decrease `keep_recent`.

---

## Related Documentation

- Decision Archiviation: `.opencode/docs/knowledge-management.md`
- Scope Detection: `.opencode/skills/scope-detection/SKILL.md`
- Context Chaining: `.opencode/skills/context-chain/SKILL.md`
