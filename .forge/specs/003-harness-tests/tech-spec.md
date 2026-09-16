# Tech Spec — Harness tests (livelli 1+2+3, provider NVIDIA NIM)

**Track**: Feature-lite (Quick bordo)
**ID**: 003-harness-tests
**Date**: 2026-09-15
**Status**: implementing

## Obiettivo

Copertura test per FORGE su tre livelli. Primario: opencode. Smoke anche su
codex; claude-code e pi pianificati dopo. Provider default: **OpenCode Zen**
(`https://opencode.ai/zen/v1`, modelli verificati dal team opencode,
free tier disponibile); fallback NVIDIA NIM (`nim-pilot.ts` per validarlo).

Modello smoke default (Zen): `muse-spark-1.3-contributor-free` via native `opencode/` provider (free, verified in TUI).

## Livello 1 — unit (vitest, CI su ogni PR, zero secret)

| File | Copre |
|---|---|
| `tests/unit/spec-parse.test.ts` | `mcp-server/src/lib/spec-parse.ts` (frontmatter, sezioni, isSectionEmpty incl. commenti annidati/`--!>`/non terminati, pattern, requirement IDs) |
| `tests/unit/backup.test.ts` | `installer/backup.ts` (backupDirPath, backupFile, backupDriftedFiles, ensureBackupGitignore incl. idempotenza) |

## Livello 2 — proiezione cross-platform (vitest, CI, zero secret)

| File | Copre |
|---|---|
| `tests/unit/platforms.test.ts` | Descriptor opencode/claude-code/codex (id, dir, configFile), `generateClaudeCodeConfig` (JSON valido, mapping mcpServers stdio+args+env), `generateClaudeMd` (importa AGENTS.md) |

## Livello 3 — smoke su CLI reali (solo con `NVIDIA_API_KEY`, mai su PR)

| File | Ruolo |
|---|---|
| `tests/smoke/providers.ts` | Helper zero-dep: `smokeProvider()` (Zen default via `OPENCODE_ZEN_API_KEY`, NIM fallback via `NVIDIA_API_KEY`), skip helpers, CLI finder, temp HOME |
| `tests/smoke/nim-pilot.ts` | Script standalone (`npx tsx`): valida key NIM, `/v1/models`, chat con tool-call obbligatoria e volontaria (anche sotto carico), `/v1/responses` |
| `tests/smoke/opencode.smoke.test.ts` | Skip se no key/CLI; HOME isolata + fixture + `opencode run` su prompt con tool-call attesa |
| `tests/smoke/codex.smoke.test.ts` | Skip se no key/CLI; `CODEX_HOME` isolata + `config.toml` provider nim + `codex exec` |
| `vitest.smoke.config.ts` | Config separata (include `tests/smoke/**/*.test.ts`); `vitest.config.ts` esclude `tests/smoke/**` |
| `.env.example` | Nomi variabili (`NVIDIA_API_KEY`, `NIM_SMOKE_MODEL`), valori finti |
| `.github/workflows/smoke.yml` | Trigger: `schedule` settimanale + `workflow_dispatch` (mai PR); `environment: smoke`; secret `NVIDIA_API_KEY`; modello economico, timeout lunghi |

## API key — gestione decisa

- Zen (default): `OPENCODE_ZEN_API_KEY` (da opencode.ai/auth). NIM fallback:
  `NVIDIA_API_KEY` (NGC personal key). Locale via export/`.env` (gitignored);
  CI via Environment `smoke` (da creare con i secret).
- Mai nei file: config committate senza secret; log senza key.
- Senza key/CLI: skip, non fail. PR da fork: smoke mai triggerato.

## Criteri di accettazione

- AC1: `npm test` verde con i nuovi unit (inclusi livelli 1+2).
- AC2: senza `NVIDIA_API_KEY`, la suite smoke skippa tutto in <30s.
- AC3: `nim-pilot.ts` con key valida → 4/4 check (modelli, chat, tool-call, responses).
- AC4: `smoke.yml` non gira su PR (solo schedule/dispatch); usa `environment: smoke`.
- AC5: zero nuove dipendenze runtime/dev (policy repo).

## Fuori scope (follow-up)

- Smoke claude-code e pi (pianificare dopo opencode+codex verdi).
- Rendere eseguibili i template `frontend/` (deciso: restano esempi).
