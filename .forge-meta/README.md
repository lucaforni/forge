# FORGE Meta-Governance

This directory contains the **actual governance files for the FORGE project itself**, not templates.

## Purpose

This is FORGE's own constitution, specifications, and knowledge base used for meta-development (developing FORGE itself).

## Structure

```
.forge-meta/
├── constitution.md         # FORGE's project constitution (NOT the template)
├── specs/                  # Specifications for FORGE features
│   └── NNN-slug/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
└── knowledge/
    ├── adr/                # Architectural decisions for FORGE
    ├── decision-log.md     # Session decisions for FORGE development
    └── lessons-learned.md  # Insights from FORGE development
```

## NOT Distributed

**This directory is NEVER copied to user projects.** User projects get:
- `.forge/constitution.md` - Empty template
- `.forge/knowledge/decision-log.md` - Empty template

## Distinction

| Directory | Purpose | Distributed? |
|-----------|---------|--------------|
| `.forge/` (in repo root) | Template for user projects | ✅ Yes |
| `.forge-meta/` | FORGE's own governance | ❌ No |

## Usage

The FORGE repository's `opencode.json` loads these files:

```json
"instructions": [
  ".forge-meta/constitution.md",
  ".forge-meta/knowledge/decision-log.md"
]
```

User projects load their own `.forge/constitution.md` instead.
