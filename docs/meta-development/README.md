# FORGE Meta-Development Documentation

This directory contains documentation **for developing FORGE itself**, not for using FORGE.

## Purpose

These documents are for FORGE contributors and maintainers:
- Project roadmap and planning
- Design decisions and comparisons with other methodologies
- Philosophy and principles behind FORGE
- Migration guides for internal changes

## Contents

- **project-plan.md** - FORGE development roadmap (was FORGE-PROJECT-PLAN.md)
- **design-decisions.md** - Comparison with BMAD & Speckit, rationale for choices (was FORGE-DECISIONS.md)
- **philosophy.md** - Core philosophy behind FORGE (was FORGE-PHILOSOPHY.md)
- **migration-sprint-format.md** - Migration guide for sprint format changes

## NOT Distributed

**This directory is NEVER copied to user projects.** These files would add ~8000 tokens of overhead to every user session with information irrelevant to using FORGE.

## For FORGE Users

User-facing documentation is in `.opencode/docs/`:
- **FORGE-GUIDE.md** - Complete user guide
- **FORGE-CUSTOMIZATION.md** - Customization guide
- **UPDATING-FORGE.md** - Update instructions

## Token Savings

By keeping meta-development docs separate, we save **~8,000 tokens per session** for user projects.

| File | Lines | Tokens | Impact |
|------|-------|--------|--------|
| project-plan.md | 1638 | ~5000 | Meta-dev only |
| design-decisions.md | 785 | ~2500 | Meta-dev only |
| philosophy.md | 544 | ~1500 | Meta-dev only |
| **Total saved** | **2967** | **~9000** | Per user session |
