# FORGE Meta-Development Agents

This directory contains **agent definitions with meta-development instructions** that are specific to developing FORGE itself.

## Purpose

When working on FORGE (meta-development), these agent versions include:
- Path conventions for FORGE source code (`../.opencode/`)
- Component-to-path mappings for FORGE architecture
- Task specification formats with explicit file paths
- Template modification guidelines

## NOT Distributed

**This directory is NEVER copied to user projects.** The installer (`install-forge.ts`) only distributes `.opencode/`, which contains the clean, generic versions of these agents.

## Agent Files

- `forge-pm-meta.md` - PM with meta-development path conventions
- `forge-architect-meta.md` - Architect with FORGE file organization rules
- `forge-scrum-meta.md` - Scrum master with meta-specific task formats

## Usage

These meta agents are automatically loaded when working in the FORGE repository via the `opencode.json` configuration:

```json
"agent": {
  "forge-pm": {
    "path": ".opencode-meta/agents/forge-pm-meta.md"
  },
  "forge-architect": {
    "path": ".opencode-meta/agents/forge-architect-meta.md"
  },
  "forge-scrum": {
    "path": ".opencode-meta/agents/forge-scrum-meta.md"
  }
}
```

## Maintaining Separation

When making changes:
1. **Generic improvements** → Update `.opencode/agents/`
2. **Meta-dev specific** → Update `.opencode-meta/agents/`
3. Always keep the two in sync except for meta-specific sections
