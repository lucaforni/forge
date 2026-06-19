# FORGE Installation Guide

This guide explains how to install or update FORGE in your project.

## Quick Install

### Option 1: Direct Install (Recommended)

If you have FORGE cloned locally:

```bash
cd /path/to/forge
npx tsx install-forge.ts /path/to/your/project
```

### Option 2: Remote Install

Install directly from GitHub:

```bash
curl -fsSL https://raw.githubusercontent.com/forniluca/forge/main/install.sh | bash -s -- /path/to/your/project
```

### Option 3: Manual Download

```bash
git clone https://github.com/forniluca/forge.git
cd forge
npx tsx install-forge.ts /path/to/your/project
```

---

## Installation Options

### Fresh Installation

Installs FORGE in a new project:

```bash
npx tsx install-forge.ts /path/to/your/project
```

**What gets installed:**
- `.opencode/agents/` - FORGE agents (PM, Architect, Reviewer, etc.)
- `.opencode/commands/` - Slash commands (/forge-specify, /forge-implement, etc.)
- `.opencode/skills/` - Reusable skills (scope detection, adversarial review, etc.)
- `.opencode/plugins/` - Event-driven plugins (session-knowledge, spec-watcher, etc.)
- `.opencode/tools/` - Custom tools (trace-requirements, validate-spec, etc.)
- `.opencode/templates/` - Document templates (spec.md, architecture.md, etc.)
- `.opencode/docs/` - Documentation (FORGE-GUIDE.md, etc.)
- `.forge/` - Directory structure (specs/, knowledge/, epics/, etc.)
- `AGENTS.md` - Project conventions template
- `.forge/constitution.md` - Project constitution template

### Update Existing Installation

Updates FORGE while preserving your project files:

```bash
npx tsx install-forge.ts /path/to/your/project --update
```

**Protected files (never overwritten):**
- `.forge/constitution.md` - Your project constitution
- `.forge/specs/**` - All specifications
- `.forge/knowledge/**` - Decision logs, ADRs, lessons learned
- `.forge/epics/**` - Epic documents
- `.forge/sprints/**` - Sprint documents
- `.forge/product/**` - Product documents
- `AGENTS.md` - Your project conventions
- `CONTRIBUTING.md` - Your contribution guide

**What gets updated:**
- All `.opencode/` components (agents, commands, skills, plugins, tools, docs)
- `.opencode/templates/` - Latest templates
- Dependencies in `.opencode/package.json`

**Backups:**
Before overwriting any file, a timestamped backup is created:
```
file.md → file.md.backup-2026-02-14T15-30-45-123Z
```

### Choosing Your Model Provider

Starting from v1.0.0, FORGE supports multiple model providers and asks you to
choose during installation.

**Interactive mode (default):**

```bash
npx tsx install-forge.ts /path/to/your/project
# → You'll be prompted to select a provider and review the configuration
```

**Non-interactive mode (use defaults):**

```bash
npx tsx install-forge.ts /path/to/your/project --non-interactive
# → Uses github-copilot with recommended defaults
```

**Specify provider explicitly:**

```bash
npx tsx install-forge.ts /path/to/your/project --provider opencode-deepseek
# → Uses OpenCode Zen (no prompts)
```

**Reconfigure provider during update:**

```bash
npx tsx install-forge.ts /path/to/your/project --update --reconfigure
# → Opens provider selection again while preserving other settings
```

**Supported providers:**

| Provider ID | Name | Model Family | Best For |
|---|---|---|---|
| `github-copilot` | GitHub Copilot | Claude (Anthropic) | Default, most users |
| `opencode-anthropic` | OpenCode Anthropic | Claude (Anthropic) via Zen | Maximum quality |
| `opencode-deepseek` | OpenCode DeepSeek | DeepSeek V4 via Zen | Cost-effective quality |
| `opencode-free` | OpenCode Free | Free-tier models via Zen | Zero-cost experimentation |
| `openai` | OpenAI | GPT / o-series | OpenAI ecosystem |
| `google` | Google | Gemini | Google ecosystem |

**Model tiers:**

FORGE assigns agents to two tiers:

| Tier | Agents | Recommended Model |
|---|---|---|
| **Reasoning** | `forge-pm`, `forge-architect`, `forge-reviewer`, `forge-ux` | Premium reasoning model (e.g., Claude Opus, o3, Gemini Pro) |
| **Execution** | `forge`, `forge-scrum`, `forge-qa`, `forge-analyst` | Standard (Sonnet / GPT-4o / Gemini Flash) |

You can override individual tier models with CLI flags:

```bash
npx tsx install-forge.ts /path/to/project \
  --provider opencode-anthropic \
  --reasoning-model opencode/claude-opus-4.6 \
  --execution-model opencode/claude-sonnet-4.6
```

---

## Prerequisites

FORGE requires:
- **Node.js 18+** - Runtime for TypeScript scripts
- **Git** - For cloning the repository
- **npx** - Included with Node.js

Verify prerequisites:
```bash
node -v   # Should be v18.0.0 or higher
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

If an update went wrong, restore from backups:

```bash
# Find backups
find /path/to/your/project -name "*.backup-*"

# Restore a file
cp file.md.backup-2026-02-14T15-30-45-123Z file.md
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

To see what would be changed without actually modifying files, add a `--dry-run` flag (requires modification of the script).

---

## Support

- **Documentation**: `.opencode/docs/FORGE-GUIDE.md`
- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join the community discussions

---

## License

FORGE is licensed under [LICENSE_TYPE]. See LICENSE file for details.
