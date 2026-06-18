# FORGE Installer Scripts

This directory contains scripts for installing and updating FORGE in other projects.

## Files

- **`install-forge.ts`** - Main TypeScript installation script with full features
- **`install.sh`** - Bash wrapper for quick remote installation
- **`INSTALL.md`** - Comprehensive installation guide and documentation

## Quick Start

### Install FORGE in a Project (Interactive)

```bash
cd /path/to/forge
npx tsx install-forge.ts /path/to/your/project
# → Select your model provider interactively
```

### Install with Specific Provider

```bash
# OpenCode Anthropic (curated Claude models)
npx tsx install-forge.ts /path/to/your/project --provider opencode-anthropic

# OpenCode DeepSeek (cost-effective)
npx tsx install-forge.ts /path/to/your/project --provider opencode-deepseek

# OpenCode Free (zero-cost)
npx tsx install-forge.ts /path/to/your/project --provider opencode-free

# GitHub Copilot (default)
npx tsx install-forge.ts /path/to/your/project --provider github-copilot

# OpenAI
npx tsx install-forge.ts /path/to/your/project --provider openai

# Non-interactive (uses github-copilot defaults)
npx tsx install-forge.ts /path/to/your/project --non-interactive
```

### Update FORGE in a Project

```bash
# Standard update (preserves model config)
npx tsx install-forge.ts /path/to/your/project --update

# Update and reconfigure models
npx tsx install-forge.ts /path/to/your/project --update --reconfigure
```

## Features

✅ **Multi-Provider Support (NEW)**
- Interactive model provider selection during install
- Support for GitHub Copilot, OpenCode Zen (Anthropic / DeepSeek / Free), OpenAI, and Google
- Automatic agent-to-model tier assignment (reasoning vs execution)
- Non-interactive mode for CI/CD pipelines
- Model reconfiguration during updates (`--reconfigure`)

✅ **Fresh Installation**
- Copies all FORGE components (.opencode/ and .forge/)
- Creates directory structure
- Installs npm dependencies
- Provides template files (constitution, AGENTS.md)

✅ **Safe Updates**
- Protects user-created files (constitution, specs, knowledge, etc.)
- Creates timestamped backups before overwriting
- Preserves project customizations
- Only updates core FORGE components

✅ **Smart Validation**
- Checks if FORGE is already installed
- Validates source and target directories
- Verifies prerequisites (Node.js, Git)
- Provides actionable error messages

## Protected Files (Never Overwritten)

The update mode protects these files:
- `.forge/constitution.md` - Project constitution
- `.forge/specs/**` - All specifications
- `.forge/knowledge/**` - Decision logs, ADRs, lessons learned
- `.forge/epics/**` - Epic documents
- `.forge/sprints/**` - Sprint tracking
- `.forge/product/**` - Product documents
- `AGENTS.md` - Project conventions
- `CONTRIBUTING.md` - Contribution guide

## What Gets Updated

During an update, these are refreshed:
- `.opencode/agents/` - FORGE agents
- `.opencode/commands/` - Slash commands
- `.opencode/skills/` - Reusable skills
- `.opencode/plugins/` - Event-driven plugins
- `.opencode/tools/` - Custom tools
- `.opencode/templates/` - Document templates
- `.opencode/docs/` - Documentation
- `.opencode/package.json` - Dependencies

## Smart Configuration Merging

**NEW:** `opencode.json` is now **intelligently merged** during updates!

When you update FORGE, your customizations in `opencode.json` are preserved:
- ✅ Your custom model selections are kept
- ✅ Your agent overrides remain intact
- ✅ Your custom permissions stay
- ✅ New FORGE configuration keys are added automatically
- ✅ A backup is created before merging

Example merge output:
```
ℹ Merging configuration files...
  → opencode.json (merging with existing)
    + Added: agent.forge-qa
    + Added: permission.bash.pytest *
    ✓ Merged successfully
```

See `.opencode/docs/UPDATING-FORGE.md` for detailed merge behavior and examples.

## Backup System

Before overwriting any existing file, a timestamped backup is created:

```
file.md → file.md.backup-2026-02-14T16-46-44-678Z
```

To restore from backup:
```bash
cp file.md.backup-2026-02-14T16-46-44-678Z file.md
```

## Testing

Test installation locally:

```bash
# Create test project
mkdir -p /tmp/forge-test-project
cd /tmp/forge-test-project
git init

# Run installation
cd /path/to/forge
npx tsx install-forge.ts /tmp/forge-test-project

# Verify installation
ls -la /tmp/forge-test-project/.opencode
ls -la /tmp/forge-test-project/.forge

# Test update
echo "# Custom Constitution" > /tmp/forge-test-project/.forge/constitution.md
npx tsx install-forge.ts /tmp/forge-test-project --update

# Verify protection
cat /tmp/forge-test-project/.forge/constitution.md
# Should still show "# Custom Constitution"
```

## Development

To modify the installer:

1. Edit `install-forge.ts`
2. Test with a sample project
3. Update `INSTALL.md` with any new features
4. Commit changes

### Adding Protected Patterns

Edit the `PROTECTED_PATTERNS` array:

```typescript
const PROTECTED_PATTERNS = [
  '.forge/constitution.md',
  '.forge/specs/**',
  // Add your patterns here
];
```

### Adding Components to Install

Edit the `DIRECTORIES_TO_COPY` array:

```typescript
const DIRECTORIES_TO_COPY = [
  { source: '.opencode/agents', target: '.opencode/agents' },
  // Add your directories here
];
```

## Troubleshooting

See `INSTALL.md` for comprehensive troubleshooting guide.

Common issues:
- **"Source directory not found"** - Run from FORGE repository root
- **"FORGE is already installed"** - Use `--update` flag
- **"npm install failed"** - Run manually in `.opencode/` directory

## License

Part of the FORGE methodology. See main LICENSE file.
