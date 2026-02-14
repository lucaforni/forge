# FORGE Meta-Development Validation Checklist

> Use this checklist before starting implementation to ensure your spec has
> explicit path information and follows FORGE meta-development conventions.

---

## Pre-Implementation Validation

Complete ALL sections before beginning implementation. Check each item and note any issues.

---

## 1. Workspace Setup

- [ ] Working directory is `forge/dev/` (not `forge/` root)
- [ ] Spec is located in `dev/.forge/specs/[NNN-slug]/` or appropriate subdirectory
- [ ] All terminal commands will be run from `forge/dev/` directory

**Notes**: _____________________________________________________________________

---

## 2. Path Table Completeness

### For Tech Specs (Quick Track)

- [ ] "Implementation Targets" section is present
- [ ] "Files to Create" table has at least one entry (or explicitly marked N/A)
- [ ] "Files to Modify" table has at least one entry (or explicitly marked N/A)
- [ ] "Files to Reference" table lists all read-only dependencies

### For Full Specs (Feature/Epic Track)

- [ ] "Implementation Scope" section is present (Section 12)
- [ ] "New Components" table lists all new files with types and descriptions
- [ ] "Modified Components" table lists all files to modify with specific sections/lines
- [ ] "Documentation Updates" table lists all doc changes

### For Plans

- [ ] Section 5 "File Map" has detailed tables:
  - [ ] "Core Implementation Files"
  - [ ] "Test Files"
  - [ ] "Configuration Files"
  - [ ] "Documentation Files"
- [ ] Section 7 "Implementation Phases" breaks down by file with types (Create/Modify)

### For Tasks

- [ ] Each task has explicit fields:
  - [ ] **File**: Absolute or relative path from `dev/`
  - [ ] **Type**: Create | Modify | Delete
  - [ ] **Location**: Section/line for modifications (or N/A for new files)
  - [ ] **Description**: What to do
  - [ ] **Spec Reference**: Which section defines this
  - [ ] **Dependencies**: Task IDs (or "None")
  - [ ] **Estimated**: Time estimate

**Notes**: _____________________________________________________________________

---

## 3. Path Notation Correctness

All paths must be **relative to `forge/dev/`** (working directory):

- [ ] FORGE source code uses `../.opencode/` prefix
  - Examples: `../.opencode/agents/forge-pm.md`, `../.opencode/templates/spec.md`
- [ ] Meta-dev workspace uses `./.forge/` prefix
  - Examples: `./.forge/constitution.md`, `./.forge/specs/001-slug/`
- [ ] Root config (if any) uses `../.forge/` prefix
  - Example: `../.forge/constitution.md` (project root)
- [ ] NO paths use absolute paths like `/Users/...` or `~/...`
- [ ] NO paths accidentally point to wrong locations (e.g., `dev/.opencode/` which doesn't exist)

**Path validation**:

For each path in your tables, verify where it resolves:

| Path in spec | Resolves to | Correct? |
|--------------|-------------|----------|
| `../.opencode/lib/foo.ts` | `forge/.opencode/lib/foo.ts` | ✓ |
| `./.forge/specs/001/` | `forge/dev/.forge/specs/001/` | ✓ |
| <!-- Add your paths here --> | | |

**Notes**: _____________________________________________________________________

---

## 4. Template Modifications (Special Case)

**WARNING**: Modifying templates affects all FORGE users. Extra scrutiny required.

If your spec modifies ANY file in `../.opencode/templates/`:

- [ ] Change is documented in an ADR (use `/forge-adr`)
- [ ] Backward compatibility is maintained (existing specs still work)
- [ ] Template versioning is considered (if breaking change)
- [ ] All examples and documentation are updated to match new template
- [ ] Change is tested on both fresh init and existing projects

**Template files affected**:
- [ ] `../.opencode/templates/spec.md`
- [ ] `../.opencode/templates/tech-spec.md`
- [ ] `../.opencode/templates/plan.md`
- [ ] `../.opencode/templates/tasks.md`
- [ ] Other: _____________________________________________________

**Notes**: _____________________________________________________________________

---

## 5. Agent Instruction Modifications (Special Case)

**WARNING**: Modifying agent instructions changes AI behavior for all users.

If your spec modifies ANY file in `../.opencode/agents/`:

- [ ] Change is documented in an ADR (use `/forge-adr`)
- [ ] Impact on existing workflows is analyzed
- [ ] Examples are provided in the agent instructions
- [ ] Change is tested with multiple scenarios
- [ ] Constitution compliance section is updated if governance changes

**Agent files affected**:
- [ ] `../.opencode/agents/forge.md` (orchestrator)
- [ ] `../.opencode/agents/forge-pm.md`
- [ ] `../.opencode/agents/forge-architect.md`
- [ ] `../.opencode/agents/forge-scrum.md`
- [ ] `../.opencode/agents/forge-reviewer.md`
- [ ] `../.opencode/agents/forge-analyst.md`
- [ ] `../.opencode/agents/forge-qa.md`
- [ ] Other: _____________________________________________________

**Notes**: _____________________________________________________________________

---

## 6. Constitution Compliance

- [ ] Change complies with `./.forge/constitution.md` (meta-dev constitution)
- [ ] If modifying governance, constitutional amendment is documented
- [ ] If adding new technology/dependency, Article 2 (Technology Stack) is updated
- [ ] If changing architecture patterns, Article 3 compliance is verified
- [ ] If affecting testing, Article 4 (Quality Standards) is checked

**Relevant constitutional articles**: _________________________________________

**Notes**: _____________________________________________________________________

---

## 7. Documentation Impact

- [ ] Changes to `.opencode/docs/FORGE-GUIDE.md` are listed in path tables
- [ ] Changes to `CONTRIBUTING.md` are listed (if workflow affected)
- [ ] New features are documented with examples
- [ ] Section numbering is updated if new sections added
- [ ] Table of contents is updated if section structure changes

**Documentation files to update**:
- [ ] `../.opencode/docs/FORGE-GUIDE.md`
- [ ] `CONTRIBUTING.md`
- [ ] `README.md`
- [ ] Other: _____________________________________________________

**Notes**: _____________________________________________________________________

---

## 8. Testing Strategy

- [ ] Testing approach matches track (Hotfix/Quick/Feature/Epic)
- [ ] Test file paths are listed in "Files to Create" table
- [ ] Test coverage targets are specified (per Article 4 of constitution)
- [ ] Manual testing steps are documented (if applicable)
- [ ] Dogfooding plan is included (testing FORGE changes with FORGE itself)

**Test files to create**:
- [ ] Unit tests: ________________________________________________
- [ ] Integration tests: _________________________________________
- [ ] E2E tests (Feature/Epic only): ____________________________

**Notes**: _____________________________________________________________________

---

## 9. Cross-References

- [ ] All referenced documents are listed in "Cross-References" section
- [ ] Paths to referenced documents are correct (relative to `dev/`)
- [ ] If creating an ADR, it's referenced in the spec
- [ ] If part of an epic, epic ID is referenced
- [ ] If implementing a story, story ID is referenced

**Referenced documents**:
- [ ] Constitution: `./.forge/constitution.md`
- [ ] ADRs: `./.forge/knowledge/adr/[NNNN-slug].md`
- [ ] Epic: `./.forge/epics/[ID]-[slug]/`
- [ ] Other: _____________________________________________________

**Notes**: _____________________________________________________________________

---

## 10. Meta-Circular Conflict Check

**CRITICAL**: Verify no conflicts between templates and generated specs.

- [ ] Spec does NOT accidentally modify its own template
- [ ] If modifying `../.opencode/templates/tech-spec.md`, this spec is NOT a tech-spec (use full spec instead)
- [ ] If modifying `../.opencode/templates/spec.md`, this spec is NOT a full spec (use ADR + tech-spec instead)
- [ ] Generated files do NOT overwrite template source files
- [ ] Path tables clearly distinguish template source (`../.opencode/templates/`) from generated specs (`./.forge/specs/`)

**Conflict analysis**:

| Template modified | This spec type | Conflict? | Resolution |
|-------------------|----------------|-----------|------------|
| `tech-spec.md` | Tech spec | ✗ YES | Use full spec instead |
| `spec.md` | Full spec | ✗ YES | Use ADR + tech-spec |
| <!-- Add if applicable --> | | | |

**Notes**: _____________________________________________________________________

---

## 11. Review and Sign-off

### Self-Review

- [ ] All path tables are complete and accurate
- [ ] All paths are relative to `forge/dev/` working directory
- [ ] No absolute paths or hardcoded user directories
- [ ] No meta-circular conflicts detected
- [ ] All checklist items above are completed

### Peer Review (Optional)

- [ ] Another contributor reviewed the spec
- [ ] Reviewer verified path correctness
- [ ] Reviewer confirmed no template conflicts

**Reviewer**: ________________________________ **Date**: _______________

### Ready for Implementation

- [ ] All validation checks passed
- [ ] All issues documented in "Notes" sections
- [ ] Implementation can proceed safely

**Date validated**: _______________

---

## Troubleshooting

### Common Issues

**Issue**: Path table is empty or missing
- **Fix**: Add the "Implementation Targets" or "Implementation Scope" section with tables

**Issue**: Paths don't start with `../` or `./`
- **Fix**: Make all paths relative to `forge/dev/` working directory

**Issue**: Agent might modify wrong file
- **Fix**: Be more explicit. Use full relative path, not just filename

**Issue**: Meta-circular conflict (spec modifies its own template)
- **Fix**: Use a different spec type or create an ADR first

**Issue**: Unsure which files to modify
- **Fix**: Use `/forge-analyst` to explore codebase, or review `FORGE-GUIDE.md` Section 8.3

---

## Example: Completed Checklist

See `dev/.forge/specs/EXAMPLE-001-forge-doctor/tech-spec.md` for a complete example showing:
- ✓ All path tables filled in
- ✓ Correct relative path notation
- ✓ Clear distinction between FORGE source and dev workspace
- ✓ No meta-circular conflicts

---

**Checklist Version**: 1.0  
**Last Updated**: 2026-02-14  
**Maintained By**: FORGE meta-development team
