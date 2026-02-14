# Decision Log

> This file captures session-level decisions made during FORGE development. The
> `session-knowledge` plugin auto-appends entries when sessions end. Important
> decisions should be promoted to formal ADRs in `.forge/knowledge/adr/`.
>
> **Format**: Each entry records the date, session context, and decisions made.
>
> **Maintenance**: Weekly review. Promote significant decisions to ADRs.
> Archive stale entries.

---

## 2026-02-14: Workspace Separation Pattern

**Context**: Developing FORGE using FORGE itself creates meta-circular conflicts
between templates (in `.opencode/templates/`) and generated specs.

**Decision**: Use dedicated `dev/` workspace with separate `.forge/` directory
for FORGE-on-FORGE development.

**Rationale**:
- Prevents accidental modification of templates during spec generation
- Separates "FORGE source code" from "specs for developing FORGE"
- Allows clean separation of concerns
- Enables clear path conventions (all paths relative to `dev/`)

**Alternatives Considered**:
1. Ignore patterns (`.forgeignore`) - Requires custom logic, error-prone
2. Dual constitution naming - Non-standard, confusing for contributors
3. No separation - High risk of template corruption

**Implementation**:
```
forge/
├── .opencode/          # FORGE source code
├── .forge/             # Template configuration for users
└── dev/                # Development workspace
    └── .forge/         # Specs for FORGE features
```

**Status**: Implemented

---

## 2026-02-14: Path Explicitness (Option A)

**Context**: Agents need clear instructions on where to write implementation
files during FORGE meta-development.

**Decision**: All specs include explicit "Implementation Targets" tables with
relative paths from `dev/` working directory.

**Rationale**:
- Eliminates ambiguity in file placement
- Makes specs reviewable by humans
- Prevents agents from inferring wrong paths
- Documents intentional file structure

**Format**:
```markdown
## Implementation Targets

### Files to Create
| Path | Type | Description |
|------|------|-------------|
| `../.opencode/commands/forge-x.md` | Command | Main implementation |

### Files to Modify
| Path | Section/Line | Change Description |
|------|--------------|---------------------|
| `../.opencode/docs/FORGE-GUIDE.md` | Section 4.4 | Add docs |
```

**Alternatives Considered**:
1. Implicit path inference - Risk of wrong placement
2. Config file with path mappings - Extra complexity
3. Absolute paths - Not portable across machines

**Status**: In implementation (templates being updated)

---

<!-- Future decisions will be appended below -->
