# Updating FORGE

This guide explains how to safely update your FORGE installation while
preserving your customizations.

---

## Quick Update

To update FORGE in your project:

```bash
# From the FORGE repository
cd /path/to/forge
./install.sh /path/to/your-project --update

# Or using the TypeScript installer directly
npx tsx install-forge.ts /path/to/your-project --update
```

---

## What Gets Updated

### ✅ Always Updated (FORGE Framework)

These files are always updated to get the latest FORGE improvements:

- `.opencode/agents/` — All FORGE agent definitions
- `.opencode/commands/` — Slash commands
- `.opencode/skills/` — Specialized skills
- `.opencode/plugins/` — Runtime plugins
- `.opencode/tools/` — Custom tools
- `.opencode/templates/` — Document templates
- `.opencode/docs/` — FORGE documentation
- `.opencode/package.json` — Plugin dependencies

### 🔒 Never Overwritten (Your Work)

These files are **protected** and will never be overwritten during updates:

- `.forge/constitution.md` — Your project constitution
- `.forge/specs/**` — All your specifications
- `.forge/knowledge/**` — ADRs, decision log, lessons learned
- `.forge/epics/**` — Epic definitions
- `.forge/sprints/**` — Sprint data
- `.forge/product/**` — Product briefs
- `AGENTS.md` — Your project conventions
- `CONTRIBUTING.md` — Your contribution guide

### 🔄 Intelligently Merged

These files are **merged** to preserve your customizations:

- `opencode.json` — Configuration file (see below)

---

## How opencode.json Merging Works

When you update FORGE, the installer performs an **intelligent merge** of
`opencode.json`:

### 1. Backup Created

First, your current `opencode.json` is backed up:

```
opencode.json.backup-2026-02-15T10-30-45-123Z
```

### 2. Smart Merge

The merge preserves your customizations while adding new keys from the template:

| Scenario | Behavior | Example |
|----------|----------|---------|
| **Key exists in both** | Your value is kept | You set `"model": "opus"`, stays `"opus"` |
| **New key in template** | Added to your config | New FORGE agent added automatically |
| **Key only in yours** | Kept as-is | Your custom permissions remain |
| **Nested objects** | Recursively merged | Agent configs merged per-agent |
| **Arrays** | Your array kept | Your `instructions` list unchanged |

### 3. Output

The installer shows what was added:

```
ℹ Merging configuration files...
  → opencode.json (merging with existing)
    + Added: agent.forge-qa
    + Added: permission.bash.pytest *
    ✓ Merged successfully. Review changes and restore comments if needed.
```

---

## Example: Merge Behavior

### Before Update

Your customized `opencode.json`:

```json
{
  "model": "github-copilot/claude-opus-4.6",  // You changed this
  
  "agent": {
    "forge-reviewer": {
      "model": "github-copilot/claude-opus-4.6"
    }
    // You removed forge-pm and forge-architect overrides
  },
  
  "permission": {
    "bash": {
      "docker *": "allow",  // You added this
      "git *": "allow",
      "*": "ask"
    }
  }
}
```

### After Update

FORGE template adds a new agent and permission:

```json
{
  "model": "github-copilot/claude-opus-4.6",  // ✓ Your value kept
  
  "agent": {
    "forge-reviewer": {
      "model": "github-copilot/claude-opus-4.6"  // ✓ Kept
    },
    "forge-qa": {
      "model": "github-copilot/claude-sonnet-4.5"  // ✓ Added (new)
    }
  },
  
  "permission": {
    "bash": {
      "docker *": "allow",    // ✓ Your custom kept
      "pytest *": "allow",    // ✓ Added (new from template)
      "git *": "allow",
      "*": "ask"
    }
  }
}
```

---

## After Update Checklist

1. **Review Changes**

   ```bash
   cd /path/to/your-project
   git diff opencode.json
   ```

2. **Check Backup**

   If something went wrong, restore from backup:

   ```bash
   cp opencode.json.backup-* opencode.json
   ```

3. **Test Configuration**

   ```bash
   opencode
   # Try: /forge-help
   ```

4. **Commit Changes**

   ```bash
   git add .opencode/ opencode.json
   git commit -m "chore: update FORGE to v1.x.x"
   ```

---

## Manual Merge (If Needed)

If the automatic merge fails or produces unexpected results:

1. **Restore Backup**

   ```bash
   cp opencode.json.backup-TIMESTAMP opencode.json
   ```

2. **Compare Template**

   ```bash
   # View the new template
   cat /path/to/forge/opencode.json
   
   # Compare with yours
   diff opencode.json /path/to/forge/opencode.json
   ```

3. **Manually Add New Keys**

   Open both files and manually copy any new sections you need.

---

## Troubleshooting

### Comments in opencode.json

**Issue**: JSON comments are lost during merge.

**Solution**: The installer warns you if comments were detected. After merge,
manually restore important comments from the backup file.

### Merge Conflicts

**Issue**: Automatic merge fails due to JSON parse errors.

**Solution**: The installer falls back to copying the template and creating a
backup. Check the backup file and manually re-apply your customizations.

### Unexpected Agent Behavior

**Issue**: Agent behaves differently after update.

**Solution**: Check if FORGE made breaking changes:

```bash
cat .opencode/CHANGELOG.md  # If exists
git log --all --oneline --grep="BREAKING"
```

Review your agent overrides in `opencode.json` and adjust if needed.

---

## Version Compatibility

| Your FORGE | Update To | Safe? | Notes |
|------------|-----------|-------|-------|
| 1.0.x      | 1.1.x     | ✅ Yes | Patch/minor updates always safe |
| 1.0.x      | 2.0.x     | ⚠️ Check | Review CHANGELOG for breaking changes |
| < 1.0      | 1.0.x     | ❌ Manual | Pre-1.0 requires manual migration |

---

## Best Practices

### 1. Update Regularly

Stay within 2-3 minor versions of the latest release to minimize merge
complexity.

### 2. Document Customizations

Add comments in `opencode.json` explaining why you customized certain values:

```json
{
  "model": "github-copilot/claude-opus-4.6",
  // ^^^ Using Opus by default because our codebase is complex and
  // requires deeper reasoning for most tasks
  
  "agent": {
    "forge-pm": {
      "model": "github-copilot/claude-sonnet-4.5"
      // ^^^ PM tasks are straightforward, Sonnet is fast enough
    }
  }
}
```

### 3. Test Before Commit

After updating, run a full workflow to ensure everything works:

```bash
opencode
# Try a full workflow: /forge-specify -> /forge-plan -> /forge-implement
```

### 4. Keep Backups Temporarily

Don't delete backup files immediately. Keep them for a few days until you're
confident the update is stable.

---

## Emergency Rollback

If the update breaks your workflow:

1. **Rollback Files**

   ```bash
   git checkout HEAD -- .opencode/ opencode.json
   ```

2. **Report Issue**

   Open an issue in the FORGE repository with:
   - Your `opencode.json.backup-*` file
   - Error messages or unexpected behavior
   - FORGE version you were updating from/to

3. **Wait for Fix**

   The FORGE team will provide a fix or migration guide.

---

## Questions?

- Check `.opencode/docs/FORGE-GUIDE.md` for more details
- Run `/forge-help` in OpenCode for command reference
- Review `.opencode/docs/ARCHITECTURE.md` for system design
