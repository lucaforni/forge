# FORGE Documentation

**Framework for Orchestrated Requirements, Governance & Engineering**

This directory contains essential FORGE documentation distributed with every installation.

## Quick Start

1. **Initialize your project**: `/forge-init`
2. **Review FORGE commands**: `/forge-help`
3. **Customize your project**:
   - Edit `.forge/constitution.md` with your project's principles
   - Edit `AGENTS.md` with your project's conventions

## Available Documentation

### For FORGE Users (Distributed)

- **[FORGE-GUIDE.md](./FORGE-GUIDE.md)** - Complete usage guide
- **[FORGE-CUSTOMIZATION.md](./FORGE-CUSTOMIZATION.md)** - Customization guide
- **[UPDATING-FORGE.md](./UPDATING-FORGE.md)** - Update instructions

### For FORGE Developers (Not Distributed)

The following docs are only available in the FORGE source repository:
- **Project Plan** - `docs/meta-development/project-plan.md`
- **Design Decisions** - `docs/meta-development/design-decisions.md`
- **Philosophy** - `docs/meta-development/philosophy.md`

## Commands Quick Reference

| Command | Purpose | Track |
|---------|---------|-------|
| `/forge-hotfix` | Quick bug fix | Hotfix |
| `/forge-quick` | Small feature | Quick |
| `/forge-specify` | Create feature spec | Feature+ |
| `/forge-plan` | Create technical plan | Feature+ |
| `/forge-implement` | Build implementation | All |
| `/forge-review` | Adversarial code review | All |
| `/forge-test` | Generate tests | All |

For a complete list, run `/forge-help`.

## Getting Help

- Run `/forge-help` for interactive guidance
- Read the complete guide: `.opencode/docs/FORGE-GUIDE.md`
- Check the constitution: `.forge/constitution.md`
- Review project conventions: `AGENTS.md`

## Support

For questions, issues, or contributions, visit the FORGE repository.
