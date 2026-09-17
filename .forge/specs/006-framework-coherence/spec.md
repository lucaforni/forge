# Tech Spec 006 — Framework Coherence (Phase 3A)

| Field | Value |
|---|---|
| **ID** | 006-framework-coherence |
| **Track** | Feature |
| **Status** | Implemented |
| **Created** | 2026-09-17 |
| **Upstream** | 2026-09 audit; issues #63, #64, #65, #67, #72 |

---

## Problem

Five audit findings share one root cause: the framework contradicts itself
across files that must agree. Each is small; together they erode trust in
exactly the artifacts (review verdicts, sprint state, CLI behaviour) where
precision matters most.

| Issue | Contradiction |
|---|---|
| #63 | The skill that *defines* the review protocol scores HIGH/MEDIUM/LOW; all six consumers score CRITICAL/WARNING/INFO. The mapping is never stated. |
| #64 | Minimum-issue thresholds read ≥3, ≥5 and "at least 3"; dimensions read 5, 6 and 7; UX is Dimension 6 in one file and 7 everywhere else. |
| #65 | `forge-status`, `forge-retro`, `forge-story` read the legacy single-file `sprint-status.yaml` that `forge-sprint` no longer writes. Retro filenames disagree three ways. |
| #67 | `forge.md` says both "delegate to Build" and "You (Forge)" implement. No `forge-build.md` exists. The framework is ambiguous about who writes code. |
| #72 | Unknown `--flags` warn and continue, and the stray value is swallowed as the target path (`--provider openai` installs into `./openai`). `--update` is a documented no-op. `--platform=bogus` crashes downstream. |

Out of scope: #68 (tool consolidation), #70/#71 (platform projections),
#73 (token budget), #74 residuals. Those are redesign; this is alignment.

---

## Decisions

### D-1 — One severity scale: CRITICAL / WARNING / INFO

Six of seven consumers already use it. `adversarial-review/SKILL.md` is the
outlier and is updated. Gate logic, stated once in the skill:
**NEEDS CHANGES = ≥1 CRITICAL**; CRITICAL consensus findings block the merge.

### D-2 — Two thresholds at two levels, stated explicitly

- **Per reviewer** (`adversarial-review` skill): ≥3 issues across the core
  dimensions. This is what each of the two reviewers owes.
- **Combined synthesis** (`forge-review.md`): ≥5 issues in the merged
  output, the anti-sycophancy meta-rule for the dual run.

Both numbers survive, each with a defined scope and a cross-reference to
the other. What disappears is the unexplained coexistence.

### D-3 — Seven dimensions, UX is 7

`ux-review/SKILL.md` is renumbered 6→7 and its summary lists all seven
(including Test-Spec Coherence, which it omitted).

### D-4 — The orchestrator implements; there is no Build agent

The routing table already assigns `/forge-implement`, `/forge-hotfix` and
`/forge-quick` to "You (Forge)" in three places against one "Delegate to
Build" line. The fiction is removed, not the routing: all "Build agent"
handoff language becomes "Forge (implementation)". No new agent is defined —
inventing `forge-build.md` would add a ninth routing target to fix a
wording bug.

### D-5 — The CLI fails loudly on usage errors (exit 4)

Unknown `--flags`, a second positional argument, and an invalid
`--platform=` value now print an error plus a help hint and exit **4**
(2 = no platform detected, 3 = check failed; 4 was unused). The old
behaviour — warn, continue, and silently reinterpret the input — is what
turned `--provider openai` into a directory named `openai`.

`--update` becomes real with minimal semantics: it requires an existing
install (manifest or pre-2.0 tree) and fails otherwise. `--interactive`
stays accepted-but-unimplemented, and now says so once, plainly, instead of
"showing diff (future)" per file.

---

## Tasks

- [x] T-001 `[S]` `[#63]` Rewrite the Severity section of `adversarial-review/SKILL.md` to CRITICAL/WARNING/INFO; align summary format and verdict rules
- [x] T-002 `[S]` `[#64]` Scope the two thresholds explicitly in both files with cross-references; fix `FORGE-GUIDE.md` and `FORGE-CUSTOMIZATION.md` (5→7 dimensions)
- [x] T-003 `[S]` `[#64]` Renumber `ux-review` 6→7; fix its summary to list all seven dimensions
- [x] T-004 `[M]` `[#65]` Migrate `forge-status`, `forge-retro`, `forge-story` context loading to `sprints/active/` + `completed/`; fix the story-update step
- [x] T-005 `[S]` `[#65]` One retro filename: `sprint-NN-retro.md` (fix `forge-sprint.md:139`)
- [x] T-006 `[M]` `[#67]` Remove the Build-agent fiction across `forge.md`, `forge-pm.md`, `forge-scrum.md`, `forge-architect.md`, `forge-ux.md`, two skill frontmatters/bodies, and `.opencode-meta/`
- [x] T-007 `[M]` `[#72]` `install-forge.ts`: unknown flags, duplicate positionals and invalid `--platform=` fail with exit 4; `--update` requires an existing install
- [x] T-008 `[S]` `[#72]` `--interactive` warns once honestly; help text documents `--update` semantics and exit codes
- [x] T-009 `[M]` Unit tests for the CLI parser (export `parseArgs`); a coherence test asserting one severity vocabulary, one dimension count and no `.opencode/templates` regressions
- [x] T-010 `[S]` Adversarial review; resolve CRITICAL findings
- [x] T-012 `[M]` Resolve peer-review findings (scope was narrower than claimed)
- [x] T-011 `[S]` Fix the test-harness self-install: importing `install-forge.ts` ran `main()`

## Review Outcome

The primary reviewer was quota-exhausted, so the peer reviewer carried the
review alone — and returned 16 findings, 3 CRITICAL. The most important one
was methodological: the new coherence test scanned only agents/commands/
skills and passed while docs/, templates/ and .opencode-meta/ still taught
the old severity scale, named a Build agent, and used the dead `dev/`
paths. A passing test that cannot see the violation is worse than no test.

| Finding | Resolution |
|---|---|
| **CRITICAL** — `--check` probed the target for `.opencode/` instead of the source. A valid fresh target failed exit 3; any directory with a stray `.opencode/` passed without the source ever being verified. | The check now runs the real cataloguing code against the source tree. |
| **CRITICAL** — coherence scan false-green on docs/templates/meta (old severity examples, Build-agent prose, `../.opencode/` paths, a dead 320-line presets chapter describing the v1 engine). | All fixed; scan expanded to every shipped directory plus meta, sharing the installer's own exclusion set so the two cannot drift. |
| **CRITICAL** — entry guard compared URL strings, so a symlinked invocation silently skipped `main()` and exited 0 having done nothing. | Real-path comparison. Verified through an actual symlink. |
| **WARNING** — `--interactive` warned only inside the backup branch, i.e. never on a clean run. | Warns once, unconditionally. |
| **WARNING** — empty `.forge/` counted as a previous install, so `--update` succeeded on fresh targets; corrupt manifest was the mirror bug. | Synthesis now requires evidence directories; the corrupt-manifest path warns and re-synthesises. |
| **WARNING** — `story.md` template pointed every new story at the legacy sprint file; the contract test's `sprints/` exclusion hid it. | Template fixed; exclusion narrowed to the three runtime directories. |
| **WARNING** — retro width NN vs NNN undefined (`001`→`01`?). | NNN everywhere, matching the sprint files. |

## Earlier Finding

Writing the CLI tests exposed a serious harness bug: `install-forge.ts`
executed `main()` unconditionally at module load, so importing it for
`parseArgs` tests ran a **full install into the repository itself** — target
defaulting to the test runner's cwd — on every suite execution. It rewrote
the repo's own `opencode.json` (comments stripped by the JSON round-trip)
and materialised `.forge/docs`, `.forge/frontend`, `.forge/templates` and a
74 MB `.forge/mcp-server/node_modules`. The damage was reverted from git;
the entry point is now guarded (the same pattern `mcp-server/index.ts`
already used), with a regression test asserting the install markers stay
absent. This is the same side-effect-on-import class the Phase 2 review
flagged in `mcp-server/index.ts` — it existed in the shim too.

## Acceptance Criteria

- [x] AC-1 — No HIGH/MEDIUM/LOW severity language remains in framework files (test-enforced)
- [x] AC-2 — Every review-threshold statement carries its scope (per-reviewer vs combined)
- [x] AC-3 — `forge-status`, `forge-retro`, `forge-story` read the directories `forge-sprint` writes
- [x] AC-4 — Zero references to a "Build agent" as a routing target (test-enforced)
- [x] AC-5 — `install-forge.ts --provider openai /tmp/x` exits 4 without writing anything
- [x] AC-6 — `npm test` green (235 tests); `tsc` clean; coverage gate holds (88.6% lines)
