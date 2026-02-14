# Lessons Learned

> This document captures insights, mistakes, and improvements discovered during
> FORGE development. The goal is to learn from failures and continuously improve
> the methodology.
>
> **Format**: Each entry describes what happened, why it failed, and how we fixed it.
>
> **Maintenance**: Review before starting new features. Update during retrospectives.

---

## 2026-02-14: Meta-Circular Template Risk

**What Happened**: During planning for FORGE-on-FORGE development, identified
risk of agents modifying templates when generating specs.

**Why It's a Problem**:
- Templates are shared infrastructure used by all FORGE users
- Corrupted templates break FORGE for all future projects
- Hard to detect until damage is done

**How We Fixed It**:
- Created separate `dev/` workspace for FORGE development
- All paths in specs are explicit and relative to `dev/`
- Templates remain in `../.opencode/templates/` (separate from working dir)
- Constitution explicitly protects template stability

**Lesson**: When building meta-tools (tools that build themselves), physical
separation of "source code" and "development artifacts" is critical.

**Applies To**: Any system where configuration/templates are also development
targets.

---

## 2026-02-14: Path Verification Prevents Implementation Errors

**What Happened**: During end-to-end testing of the meta-development workflow,
created a test spec for adding `.forge-version` file. Initial spec referenced
`../.opencode/slashcommands/forge-init.ts` which didn't exist.

**Why It Failed**:
- Assumed FORGE used TypeScript files for commands (common pattern)
- Didn't verify actual directory structure before writing spec
- Spec would have caused implementation to fail or create wrong files

**How We Fixed It**:
- Manually tested path resolution from `dev/` working directory
- Discovered FORGE uses `../.opencode/commands/forge-init.md` (Markdown, not TypeScript)
- Updated spec with correct path
- Verified all paths with `test -f` commands

**Key Discovery**: FORGE commands are **Markdown instruction files**, not
executable scripts. Commands live in `.opencode/commands/`, not `.opencode/slashcommands/`.

**Lesson**: Always verify paths exist before including them in specs. Use
`ls`, `test -f`, or `find` from the working directory to confirm path correctness.
A few seconds of validation prevents hours of debugging during implementation.

**Prevention**:
- Added path verification section to validation checklist (CHECKLIST.md)
- Example spec (002-forge-version-file) demonstrates path testing
- Path resolution table in spec includes "Exists?" column to force verification

**Applies To**: All FORGE meta-development specs. Contributors should test
paths from `dev/` before finalizing specs.

---

<!-- Future lessons will be appended below -->
