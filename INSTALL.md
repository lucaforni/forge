# FORGE Installation Guide (v2.0.0)

This guide explains how to install or update FORGE in your project.
**FORGE 2.0 targets OpenCode, Claude Code, and Codex CLI** — the installer
auto-detects your platform.

> [!IMPORTANT]
> **Platform support is uneven today.** OpenCode is the reference platform
> and is the only one that is fully exercised. Claude Code and Codex CLI
> projections are incomplete — see
> [#70](https://github.com/lucaforni/forge/issues/70) and
> [#71](https://github.com/lucaforni/forge/issues/71) before relying on them.

---

## Quick Install

> [!IMPORTANT]
> **Prerequisite:** the target project must already contain `.opencode/`,
> `.claude/` or `.codex/`. The installer probes for these to detect your
> runtime; with none present it exits with code 2
> (`No supported platform detected`). Create the directory first, or pass
> `--platform` to skip detection.

### Option 1: Direct Install (Recommended)

```bash
cd /path/to/forge

# The target needs a platform directory — create it if this is a new project:
mkdir -p /path/to/your/project/.opencode

npx tsx install-forge.ts /path/to/your/project
```

The installer auto-detects which platforms to install for by probing for
`.opencode/`, `.claude/`, and `.codex/` directories.

### Option 2: Force a Specific Platform

```bash
# Install only for Claude Code (even if other platforms detected)
npx tsx install-forge.ts /path/to/your/project --platform=claude-code

# Install for multiple specific platforms
npx tsx install-forge.ts /path/to/your/project --platform=opencode,codex
```

### Option 3: Remote Install

```bash
curl -fsSL https://raw.githubusercontent.com/lucaforni/forge/main/install.sh | bash -s -- /path/to/your/project
```

### Option 4: Manual Download

```bash
git clone https://github.com/lucaforni/forge.git
cd forge
npx tsx install-forge.ts /path/to/your/project
```

---

## Cross-Platform Installation

FORGE 2.0 auto-detects your platform by checking for these directories:

| Platform | Detection | Install Target |
|----------|-----------|----------------|
| **OpenCode** | `.opencode/` exists | `.opencode/{agents,commands,skills,tools,plugins}/` |
| **Claude Code** | `.claude/` exists | `.claude/{agents,commands,skills,hooks}/` |
| **Codex CLI** | `.codex/` exists | `.codex/{agents,commands}/` + `.agents/skills/` |

If **multiple** platform directories are detected, FORGE installs to **all of them**
from the single canonical source. If **none** are detected, the installer exits
with a message asking you to create one of the platform directories.

### What Gets Installed Per Platform

> [!NOTE]
> Rows marked ❌ are deliberately not distributed; the reason is given
> inline. Everything else is installed and verified by the installer
> contract test (`tests/unit/contract.test.ts`), which fails CI if an
> artifact ever references a path the installer does not create.

#### OpenCode

| Path | Contents | Status |
|---|---|:--:|
| `.opencode/agents/` | 9 FORGE subagents | ✅ |
| `.opencode/commands/` | 24 slash commands (`/forge-*`) | ✅ |
| `.opencode/skills/` | 13 reusable skills | ✅ |
| `.opencode/plugins/` | 3 event-driven plugins | ✅ |
| `.opencode/package.json` | Declares `@opencode-ai/plugin` for the plugins | ✅ |
| `.opencode/tools/` | 3 custom tools (OpenCode SDK) | ❌ superseded by the MCP server; the two implementations diverged — [#68](https://github.com/lucaforni/forge/issues/68) |
| `.forge/templates/` | Document templates (18) | ✅ platform-neutral |
| `.forge/docs/` | Methodology documentation | ✅ platform-neutral |
| `opencode.json` | Platform config | ✅ includes `instructions`, `permission`, `model`, `agent`, `mcp`; an existing file is **merged and backed up**, never clobbered |

#### Claude Code

| Path | Contents | Status |
|---|---|:--:|
| `.claude/agents/` | Same 9 subagents | ⚠️ copied with OpenCode frontmatter; missing `name:` — [#71](https://github.com/lucaforni/forge/issues/71) |
| `.claude/commands/` | Same 24 slash commands | ⚠️ `agent:` routing is not honoured by Claude Code — [#71](https://github.com/lucaforni/forge/issues/71) |
| `.claude/skills/` | Same 13 skills | ✅ |
| `.forge/templates/`, `.forge/docs/` | Templates and docs | ✅ platform-neutral |
| `.claude/hooks/` | Adapted hook-based automation | ❌ [#71](https://github.com/lucaforni/forge/issues/71) |
| `.claude/settings.json` | Claude Code config with MCP server reference | ⚠️ MCP only |
| `CLAUDE.md` | Project instructions (imports `AGENTS.md`) | ⚠️ imports a file that is not created — [#56](https://github.com/lucaforni/forge/issues/56) |

#### Codex CLI

| Path | Contents | Status |
|---|---|:--:|
| `.codex/agents/` | Codex-native agent definitions | ❌ raw Markdown; TOML generator is never called — [#70](https://github.com/lucaforni/forge/issues/70) |
| `.codex/commands/` | Same 24 slash commands | ⚠️ Codex reads prompts from a different directory — [#70](https://github.com/lucaforni/forge/issues/70) |
| `.agents/skills/` | Same 13 skills | ❌ lands in `.codex/.agents/skills/` — [#70](https://github.com/lucaforni/forge/issues/70) |
| `.codex/config.toml` | Codex CLI config with MCP server reference | ⚠️ MCP only |
| `.forge/templates/`, `.forge/docs/` | Templates and docs | ✅ platform-neutral |
| `AGENTS.md` | Project instructions (native format) | ✅ created once, never overwritten |

#### All Platforms

| Path | Contents | Status |
|---|---|:--:|
| `.forge/mcp-server/` | Shared MCP server for custom tools | ✅ |
| `.forge/frontend/` | Frontend pattern library | ✅ |
| `.forge/templates/` | 18 document templates used by the commands | ✅ |
| `.forge/docs/` | Methodology documentation | ✅ |
| `.forge/{specs,architecture,epics,product}/` | Working directories | ✅ scaffolded |
| `.forge/knowledge/adr/` | Architecture decision records | ✅ scaffolded |
| `.forge/sprints/{active,completed,retrospectives}/` | Sprint tracking | ✅ scaffolded |
| `.forge/constitution.md` | Project constitution | ✅ created once, never overwritten |
| `AGENTS.md` | Project conventions | ✅ created once, never overwritten |

> **Templates and docs are platform-neutral.** They live under `.forge/`, not
> under a platform directory, so the single path every command uses resolves
> identically on OpenCode, Claude Code and Codex.

---

## Installation Options

### Fresh Installation

```bash
npx tsx install-forge.ts /path/to/your/project
```

### Preview Without Installing

```bash
npx tsx install-forge.ts /path/to/your/project --dry-run
# Shows what would be installed without writing any files
```

### Verify Projection Correctness

```bash
npx tsx install-forge.ts /path/to/your/project --check
# Verifies the install plan is coherent and exits
```

### Update Existing Installation

Updates FORGE while preserving your project files:

```bash
npx tsx install-forge.ts /path/to/your/project --update
```

> [!NOTE]
> Without `--update`, fresh install and update are auto-detected from the
> manifest. With `--update`, the installer refuses a target that has no
> previous installation instead of silently performing a fresh one.

**Files the installer does not write:**
- `.forge/constitution.md` — Your project constitution
- `.forge/specs/**` — All specifications
- `.forge/knowledge/**` — Decision logs, ADRs, lessons learned
- `.forge/epics/**` — Epic documents
- `.forge/sprints/**` — Sprint documents
- `.forge/product/**` — Product documents
- `AGENTS.md` — Your project conventions
- `CONTRIBUTING.md` — Your contribution guide

`.forge/constitution.md` and `AGENTS.md` are created on a fresh install and
carry the `user-template` category: the installer writes them once and
never touches them again. This is verified by an idempotency test.

**`opencode.json` is merged, not replaced.** Unknown keys, a custom `model`,
your own agents and your own MCP servers are all preserved; only the
FORGE-managed keys (`$schema`, `default_agent`, `instructions`, and the
FORGE agent entries) are refreshed. An existing `permission` block is never
rewritten. The previous file is backed up to `.forge/.backups/<timestamp>/`
before any write.

**What gets updated (per platform):**
- All agents, commands, skills (to each platform's location)
- MCP server (`.forge/mcp-server/`)
- Platform config files (opencode.json / settings.json / config.toml)

**Backups:**
Before overwriting any drifted file, a timestamped backup is created inside
`.forge/.backups/<timestamp>/`. Backups are gitignored by default.

---

## Prerequisites

FORGE requires:
- **Node.js 20+** - Runtime for TypeScript scripts (CI matrix: 20 / 22 / 24)
- **Git** - For cloning the repository
- **npx** - Included with Node.js

Verify prerequisites:
```bash
node -v   # Should be v20.0.0 or higher
git --version
npx -v
```

---

## Post-Installation

### 1. Customize Your Project

After fresh installation, customize these files:

**`.forge/constitution.md`** - Define your project's principles:
```bash
# Edit the constitution
code .forge/constitution.md

# Follow the template comments marked with <!-- CUSTOMIZE: ... -->
```

**`AGENTS.md`** - Define your project's conventions:
```bash
# Edit project conventions
code AGENTS.md

# Fill in your tech stack, naming conventions, git workflow, etc.
```

### 2. Initialize Git (if needed)

If your project isn't already a git repository:

```bash
cd /path/to/your/project
git init
git add .
git commit -m "chore: add FORGE methodology"
```

### 3. Start Using FORGE

```bash
cd /path/to/your/project
opencode
```

Try these commands:
- `/forge-help` - Show all available commands
- `/forge-brief` - Start with a product brief (for new projects)
- `/forge-specify` - Create a feature specification
- `/forge-quick` - Quick workflow for small tasks

### 4. Learn More

Read the documentation:
- `.opencode/docs/FORGE-GUIDE.md` - Complete methodology guide
- `.opencode/docs/FORGE-PHILOSOPHY.md` - Principles and rationale
- `.opencode/docs/FORGE-CUSTOMIZATION.md` - Advanced customization

---

## Troubleshooting

### "Source directory not found" Error

The script expects to be run from the FORGE repository root:

```bash
cd /path/to/forge  # Must be in FORGE repo
npx tsx install-forge.ts /path/to/target/project
```

### "FORGE is already installed" Error

Use `--update` flag to update:

```bash
npx tsx install-forge.ts /path/to/your/project --update
```

### npm Install Failed

If npm dependencies fail to install, run manually:

```bash
cd /path/to/your/project/.opencode
npm install
```

### Permission Denied

Make sure you have write permissions to the target directory:

```bash
ls -la /path/to/your/project
```

### Restore from Backup

Before overwriting a drifted file, the installer copies it to
`.forge/.backups/<ISO-timestamp>/<original-path>` (see
`installer/backup.ts`). To restore:

```bash
# List backup sets, newest last
ls -1 /path/to/your/project/.forge/.backups/

# Inspect one set — paths inside mirror the project layout
find /path/to/your/project/.forge/.backups/2026-09-17T120000/ -type f

# Restore a single file
cp /path/to/your/project/.forge/.backups/2026-09-17T120000/.opencode/agents/forge.md \
   /path/to/your/project/.opencode/agents/forge.md
```

---

## Uninstalling FORGE

To remove FORGE from your project:

```bash
cd /path/to/your/project

# Remove FORGE files (keeps your specs and knowledge)
rm -rf .opencode/

# Optional: Remove .forge/ if you want to delete all specs/knowledge
# rm -rf .forge/

# Optional: Remove project conventions
# rm AGENTS.md
```

**Warning**: This deletes all FORGE agents, commands, and tools. Your specifications and knowledge base in `.forge/` are preserved unless explicitly deleted.

---

## Updating FORGE Source

To get the latest FORGE version:

```bash
cd /path/to/forge
git pull origin main

# Then update your projects
npx tsx install-forge.ts /path/to/your/project --update
```

---

## Advanced Usage

### Scripted Multi-Project Updates

Update FORGE in multiple projects:

```bash
#!/bin/bash
# update-all-projects.sh

PROJECTS=(
  "/path/to/project-1"
  "/path/to/project-2"
  "/path/to/project-3"
)

cd /path/to/forge

for project in "${PROJECTS[@]}"; do
  echo "Updating $project..."
  npx tsx install-forge.ts "$project" --update
done
```

### Custom Protected Patterns

Edit `install-forge.ts` to add custom protected patterns:

```typescript
const PROTECTED_PATTERNS = [
  '.forge/constitution.md',
  '.forge/specs/**',
  '.forge/knowledge/**',
  'AGENTS.md',
  'custom-file.md',  // Add your custom patterns
];
```

### Dry Run Mode

To see what would be changed without writing any files, use the `--dry-run` flag (see [Preview Without Installing](#preview-without-installing)). To verify that the install plan is coherent without writing, use `--check`.

---

## Support

- **Documentation**: `.opencode/docs/FORGE-GUIDE.md`
- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join the community discussions

---

## License

FORGE is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
