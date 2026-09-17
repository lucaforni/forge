# Tasks — 004 Installer Contract Completeness

| Field | Value |
|---|---|
| **Spec** | [`spec.md`](spec.md) |
| **Status** | Complete |
| **Track** | Feature |

Sizing: `[S]` <30min · `[M]` 30min–2h · `[L]` 2–4h · `[P]` parallelizable

---

## Phase 1 — Projection

- [x] T-001 `[M]` `[FR-001]` `[FR-003]` `[FR-004]` Extend `installer/projection.ts`: catalog `templates/` → `.forge/templates/`, `docs/` → `.forge/docs/`, `plugins/` → `.opencode/plugins/` (OpenCode only)
      → `installer/projection.ts`
- [x] T-002 `[S]` `[FR-003]` Exclude meta-development reports from the distributed docs set
      → `installer/projection.ts`
- [x] T-003 `[M]` `[FR-005]` `[FR-006]` `[FR-007]` Scaffold `.forge/` tree + `constitution.md` + `AGENTS.md` as `user-template` (create once)
      → `installer/projection.ts`
- [x] T-004 `[S]` `[FR-004]` Emit `.opencode/package.json` declaring `@opencode-ai/plugin`
      → `installer/projection.ts`

## Phase 2 — Config generation

- [x] T-005 `[M]` `[FR-008]` `[FR-011]` Restore `instructions`, `permission`, `model`, `provider` in `generateOpenCodeConfig`; assign peer reviewer a different-family model
      → `installer/platforms/opencode.ts`, `installer/config.ts`
- [x] T-006 `[M]` `[FR-009]` `[FR-010]` `[E-1]` `[E-6]` Merge existing `opencode.json` instead of clobbering; back up first; tolerate malformed JSON
      → `installer/install.ts`, `installer/config.ts`

## Phase 3 — Reference rewrite

- [x] T-007 `[M]` `[FR-002]` `[P]` Rewrite `.opencode/templates/` → `.forge/templates/` across all agents, commands and skills
      → `.opencode/{agents,commands,skills}/**`
- [x] T-008 `[S]` `[FR-002]` `[P]` Remove the `../.opencode/` meta-dev leak from `forge-sprint.md` (constitution Art. 2.3/4.3)
      → `.opencode/commands/forge-sprint.md`
- [x] T-009 `[S]` `[P]` Repoint `forge-help.md` to relocated docs and add the 5 missing commands
      → `.opencode/commands/forge-help.md`

## Phase 4 — Tests

- [x] T-010 `[L]` `[FR-012]` `[AC-1]` `[AC-5]` Installer contract test: install into a temp fixture, assert every referenced path exists
      → `tests/unit/contract.test.ts`
- [x] T-011 `[M]` `[FR-008]` `[FR-009]` `[FR-011]` Unit tests for config generation and merging
      → `tests/unit/config.test.ts`, `tests/unit/platforms.test.ts`
- [x] T-012 `[M]` `[FR-007]` `[NFR-003]` `[E-2]` `[E-3]` `[E-5]` Idempotency test: modify user files, reinstall, assert preserved
      → `tests/unit/contract.test.ts`

## Phase 5 — Verification

- [x] T-013 `[S]` `[AC-6]` `npm test` green; `tsc` error count ≤ 20
- [x] T-014 `[S]` `[AC-7]` Dual-model adversarial review; resolve CRITICAL findings
- [x] T-015 `[S]` Update `INSTALL.md` / `README.md` status tables to reflect what now ships
