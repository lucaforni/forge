# Tech Spec 005 — CI Quality Gates

| Field | Value |
|---|---|
| **ID** | 005-ci-quality-gates |
| **Track** | Feature |
| **Status** | Complete |
| **Created** | 2026-09-17 |
| **Upstream** | 2026-09 audit; issues #60, #61, #69, #74 |

---

## Problem

Constitution Art. 4.4 requires every mechanically checkable article to have
a CI check. None existed.

- `tsc --noEmit` exited 1 and **no workflow ran it**. `npm run lint` and
  `npm run build` were `--if-present` no-ops for scripts that do not exist.
- The 80% coverage gate had **never been evaluated**: `@vitest/coverage-v8`
  was not installed, and `npm test` does not pass `--coverage`.
- `mcp-server/` declared runtime dependencies with **no lockfile**, so
  `npm ci` was impossible and end users resolved unpinned versions.
- `install.sh` and `update-multiple-projects.sh` were never linted.

## Requirements

| ID | Requirement | Status |
|---|---|---|
| FR-001 | `tsc --noEmit` exits 0 across installer, mcp-server and tests | ✅ |
| FR-002 | CI runs typecheck, tests and a coverage gate | ✅ |
| FR-003 | Coverage is measurable and the threshold matches what CI runs | ✅ 91.2% / gate 85% |
| FR-004 | `mcp-server/` has a committed lockfile and `npm ci` succeeds | ✅ |
| FR-005 | Shell scripts users execute are linted | ✅ `shell` job |
| FR-006 | The frontend test situation is resolved explicitly, not left ambiguous | ✅ scoped out by design, documented |
| FR-007 | No devDependency exists solely to support code that never runs | ✅ 10 removed |
| FR-008 | Coverage scope includes the shipped MCP entry point, not a curated subset | ✅ `mcp-server/index.ts` added |

## Tasks

- [x] T-001 Commit `mcp-server/package-lock.json`; verify `npm ci`
- [x] T-002 Fix the 16 remaining `tsc` errors
- [x] T-003 Add `@vitest/coverage-v8`; add `typecheck` / `test:coverage` / `test:smoke` scripts
- [x] T-004 Test the three MCP tools (were at 0%)
- [x] T-005 Test `installer/install.ts` control-flow branches
- [x] T-006 Set thresholds from the real measurement; wire the `coverage` job
- [x] T-007 Add `shell` job; fix what it exposes
- [x] T-008 Remove the 9 phantom devDependencies; document the frontend test scope
- [x] T-009 Amend constitution Art. 4.1 and 4.4 with measured reality
- [x] T-010 Adversarial review
- [x] T-011 Resolve review findings (4 CRITICAL, 7 WARNING)

## Bugs found by writing the tests

Untested code was broken code. Four real defects surfaced:

| Bug | Impact |
|---|---|
| `extractSections` ended a section at any deeper heading | FORGE's own spec template puts `### US-001:` under `## User Stories`, so **every correctly formatted spec was reported as missing its User Stories section** |
| `validate-spec` used `!sectionBody` to detect a missing section | An empty section was reported as *missing*; `emptyRequiredFields` was unreachable dead code, so the tool's advertised missing-vs-empty distinction never worked |
| `findTaskItems` required `**T-001**` | Matches **none** of the three task formats FORGE emits, so the traceability matrix always reported zero task coverage |
| `sprint-status` filtered `.json` and called `JSON.parse` | Every FORGE sprint file is YAML — the tool returned "no sprints found" on every real project (#69) |

Plus, in shell: `((FAILED++))` under `set -e` aborts the batch updater on the
first skipped project, because incrementing from 0 returns a non-zero status.
shellcheck does not flag this at default severity; it was found by running it.

## Results

| Metric | Before | After |
|---|--:|--:|
| Tests | 135 | **214** |
| `tsc` errors | 16 | **0** |
| Line coverage | not measurable | **89.1%** |
| Branch coverage | not measurable | **84.2%** |
| CI checks enforcing the constitution | 0 | 4 enforced + 1 partial |
| Phantom devDependencies | 10 | 0 |

## Review Outcome

The dual-model review returned **NEEDS CHANGES** with 13 findings, 4 of them
CRITICAL. All are resolved.

| Finding | Resolution |
|---|---|
| **CRITICAL** — `extractSections` treated a `#` inside a fenced code block as a heading. A spec containing a ```` ```bash ```` example registered a bogus section and truncated the real one. The rewrite made it worse, because closing a level now pops every open ancestor. | Fence state is tracked (backticks and tildes, runs of 3+). Two tests added. |
| **CRITICAL** — a YAML block scalar (`goal: \|`) stored the literal marker, so the dashboard printed `Sprint 1: \|` with no warning. | Block scalars are consumed, including the folded and chomping variants. Parsing resumes correctly after the block. |
| **CRITICAL** — `mcp-server/index.ts` (260 lines, the shipped entry point) was outside the coverage scope, so the 91.2% figure measured a curated subset. | Added to the scope. Importing it used to spawn a stdio transport, so an entry-point guard was added and the formatters exported and tested. The honest number is 89.1%. |
| **CRITICAL** — an unquoted `#` truncated the value. | Verified against a real YAML parser: this **is** YAML semantics, and PyYAML behaves identically. Not a defect. The template now states that values containing `#` must be quoted, and a test documents both branches. |
| **WARNING** — tab indentation silently mis-nested the document. | Rejected outright; the caller renders a per-file warning. |
| **WARNING** — `findTaskItems` stripped every `` `[...]` `` group globally, mangling legitimate text mid-description. | Anchored to leading groups. Test asserts a mid-description `` `[login]` `` survives. |
| **WARNING** — `reqId` was interpolated into a `RegExp` unescaped. | Escaped. |
| **WARNING** — three tests were tautological (`typeof x === "string"`, `coverage ∈ [0,100]`). | Replaced with exact assertions — which immediately exposed the bug below. |
| **CRITICAL (found by strengthening a test)** — `traceRequirements` hardcoded `process.cwd()`, so it scanned the FORGE repo instead of the project under test and **reported 100% coverage for a fixture with no source files at all**. The source/test discovery walk was entirely untested. | `projectRoot` is now a parameter. Four tests cover discovery, the NO TESTS branch, and the node_modules/dotfile exclusions. |
| **INFO** — `vite` was as phantom as the 9 removed devDependencies. | Removed; vitest supplies its own. |
