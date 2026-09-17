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
| FR-007 | No devDependency exists solely to support code that never runs | ✅ 9 removed |

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
| Tests | 135 | 192 |
| `tsc` errors | 16 | **0** |
| Line coverage | not measurable | **91.2%** |
| Branch coverage | not measurable | **84.6%** |
| CI checks enforcing the constitution | 0 | 5 |
| Phantom devDependencies | 9 | 0 |
