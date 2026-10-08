# ADR-004: Preset Home — `.forge/presets.json` with built-in fallback

## Status

**Accepted** · 2026-10-06 (accepted 2026-10-08) · Spec 011-model-configure
· Reviewer: `.forge/specs/011-model-configure/analysis.md`

## Context

`/forge-model-configure` needs a source of truth for provider presets (the
reasoning/execution/peer tier map per provider). The structured preset engine
`.opencode/templates/presets.json` already exists (6 providers) but is listed
in `EXCLUDED_TEMPLATES` (`installer/projection.ts`) and therefore never reaches
a user project — orphan #72. Three competing homes were considered for the
distributed, project-facing preset file:

- **A. `.forge/presets.json`** (per-project, versioned by the user's repo).
- **B. A global/home-directory presets file** shared across all projects.
- **C. Keep presets installer-internal** (bake values into generated config
  only; no distributed preset file).

Forces: the spec requires a resolution order `.forge/presets.json` > built-in
(FR-001, FR-006), offline-first operation (NFR-005), and determinism
(NFR-004). FORGE already projects platform-neutral templates to `.forge/` via
`FORGE_NEUTRAL_DIRS` and uses the `user-template`/`config` category split to
decide create-once vs regenerate-on-update.

## Decision

Adopt **Option A with a built-in fallback**:

1. **Resolution order:** `.forge/presets.json` (project override, versioned)
   **>** built-in `.opencode/templates/presets.json` (shipped fallback). A
   missing/corrupt project file falls back to built-in with a
   `Standalone — not chained` warning and continues (FR-001 edge case 3).
2. **Projection (dual-target, one source → two files):**
   - **Keep** `"presets.json"` in `EXCLUDED_TEMPLATES`. The existing
     `catalogNeutralArtifacts` path still emits the built-in to
     `.forge/templates/presets.json` as a `config` artifact
     (**regenerate-on-update**) — the fallback the resolver reads when the
     project file is absent.
   - **Add** a create-once `user-template` projection via a new
     `USER_TEMPLATE_FILES` set (mirroring `SCAFFOLD_FILES` /
     `catalogScaffoldArtifacts`, `installer/projection.ts:125-129, 255-275`),
     projecting `.opencode/templates/presets.json` → `.forge/presets.json` with
     an existence check, so the active project file is **created once and never
     overwritten on update** — mirroring `stack-decisions.md`/`design-system.md`
     (`USER_OWNED_FRONTEND_FILES`, `projection.ts:144, 190`).
3. **Update semantics:** the active `.forge/presets.json` is create-once
   (`user-template`); the fallback `.forge/templates/presets.json` is
   regenerate-on-update (`config`). A user's tuned presets survive FORGE
   upgrades; the shipped built-in stays current as the fallback.

> **Mechanism note (B-2, analysis.md).** An earlier draft proposed merely
> *removing* `"presets.json"` from `EXCLUDED_TEMPLATES`. That is incorrect:
> `catalogNeutralArtifacts` hardcodes `category: "config"` for every neutral
> template (`projection.ts:237`), so a bare un-exclude would (a) ship a
> regenerate-on-update file that **overwrites the user's tuned presets on every
> update**, and (b) land it at `.forge/templates/presets.json` only — **never
> creating** the active `.forge/presets.json` the resolver reads (FR-001/006).
> The `user-template` (create-once) category is applied **only** by
> `catalogScaffoldArtifacts` and `USER_OWNED_FRONTEND_FILES`, never by
> un-excluding a neutral template. The decision above therefore uses an explicit
> scaffold-style entry plus the retained exclusion — two targets from one
> source — not a single un-exclude.

Rejected: **B** (global file) — breaks per-project versioning and
reproducibility, and has no existing projection channel. **C** (installer-only)
— cannot satisfy FR-001 `--list` from a project-visible file nor let teams
version presets (discovery persona P2).

## Consequences

- **Positive:** single versioned source per project; offline by construction;
  reuses the existing neutral-projection + `user-template` machinery; fixes
  orphan #72.
- **Negative:** two files named `presets.json` now exist in a target project
  (`.forge/presets.json` active/create-once, `.forge/templates/presets.json`
  fallback/regenerated) — must be documented to avoid confusion. The projection
  is split across two code paths (neutral `config` + scaffold `user-template`),
  which the Phase-1 projection test must assert together.
- **Neutral:** resolver must tolerate both absent and malformed project files
  (handled by `readExistingJsonConfig`-style parse-or-fallback).

## Constitution Alignment

- **Art. 1 (Core Principles):** offline-first, no silent behavior — fallback is
  announced.
- **Art. 3 (Architecture Patterns):** installer remains the projection owner;
  no new distribution channel invented.
- Supports spec FR-001, FR-006; NFR-004, NFR-005.
