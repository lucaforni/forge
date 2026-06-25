# FORGE Installer Scripts (v2.0.0)

This directory contains scripts for installing and updating FORGE in other projects.
**FORGE 2.0 supports OpenCode, Claude Code, and Codex CLI.**

## Files

- **`install-forge.ts`** — Main TypeScript installation script (refactored CLI shim)
- **`installer/`** — Modular installer modules (types, detect, projection, backup, etc.)
- **`mcp-server/`** — Cross-platform MCP server for custom tools
- **`install.sh`** — Bash wrapper for quick remote installation
- **`INSTALL.md`** — Comprehensive installation guide and documentation

## Quick Start

### Install FORGE in a Project (Auto-Detect)

```bash
cd /path/to/forge
npx tsx install-forge.ts /path/to/your/project
# → Auto-detects OpenCode / Claude Code / Codex CLI
# → Select your model provider interactively
```

### Platform-Specific Installation

```bash
# Force install for Claude Code only
npx tsx install-forge.ts /path/to/your/project --platform=claude-code

# Force install for Codex CLI only
npx tsx install-forge.ts /path/to/your/project --platform=codex

# Install for specific platforms only
npx tsx install-forge.ts /path/to/your/project --platform=opencode,codex
```

### Preview Without Writing

```bash
npx tsx install-forge.ts /path/to/your/project --dry-run
# Shows the full install plan without writing any files
```

### Install with Specific Provider

```bash
npx tsx install-forge.ts /path/to/your/project --provider github-copilot
npx tsx install-forge.ts /path/to/your/project --provider opencode-anthropic
npx tsx install-forge.ts /path/to/your/project --provider opencode-deepseek
npx tsx install-forge.ts /path/to/your/project --provider openai
npx tsx install-forge.ts /path/to/your/project --non-interactive
```

### Update FORGE in a Project

```bash
# Standard update (preserves model config, detects platforms)
npx tsx install-forge.ts /path/to/your/project --update
```

## New in v2.0.0

### 🔄 Cross-Platform Detection
The installer automatically detects which platforms you're using by probing
for `.opencode/`, `.claude/`, and `.codex/` directories in the project root.
If multiple are found, FORGE installs to **all of them** from a single run.

### 🏗️ Modular Installer Architecture
The monolithic `install-forge.ts` has been refactored into focused modules:

| Module | Purpose |
|--------|---------|
| `installer/types.ts` | Shared interfaces & types |
| `installer/detect.ts` | Platform detection (probes for .opencode/.claude/.codex) |
| `installer/config.ts` | Internal config model builder |
| `installer/manifest.ts` | Install manifest read/write & idempotency |
| `installer/projection.ts` | Canonical artifact catalog + install plan builder |
| `installer/drift.ts` | SHA-256 drift detection against manifest |
| `installer/backup.ts` | Drifted file backup manager (`.forge/.backups/`) |
| `installer/log.ts` | Structured logger with text prefixes |
| `installer/install.ts` | Top-level orchestrator (chains all modules) |
| `installer/platforms/` | Per-platform adapters (opencode, claude-code, codex) |

### 🖥️ MCP Server (`mcp-server/`)
Custom tools are now exposed as a shared MCP server (`forge-mcp-server`)
using `@modelcontextprotocol/sdk`, making them available on all platforms:
- `validate-spec` — Spec completeness validation
- `trace-requirements` — Requirements traceability
- `sprint-status` — Sprint dashboard

### 🔐 Drift-Aware Updates
- SHA-256 checksums in `.forge/.install-manifest.json`
- User-edited files are detected and backed up before overwriting
- Backups go to `.forge/.backups/<timestamp>/` (gitignored)
- Idempotent: re-running on unchanged project produces zero writes

## CLI Options

| Option | Description |
|--------|-------------|
| `[target]` | Project directory (default: current directory) |
| `--dry-run` | Plan without writing files |
| `--check` | Verify projection correctness |
| `--platform=<names>` | Override detection (comma-separated) |
| `--interactive` | Interactive mode for drifted files |
| `--force` | Overwrite without backup |
| `--verbose` | Detailed logging |
| `--help` | Show help |

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
