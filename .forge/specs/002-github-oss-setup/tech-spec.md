# Tech Spec — Setup Classico Progetto OpenSource GitHub

**Track**: Quick
**Repo**: `lucaforni/forge`
**ID**: 002-github-oss-setup
**Date**: 2026-09-09
**Status**: approved → implementing

---

## Obiettivo

Portare il repository `lucaforni/forge` allo standard classico di un progetto
opensource GitHub: CI multi-versione Node, community health files completi,
automazione dipendenze (Dependabot) e scanner di sicurezza (CodeQL + OSSF Scorecard).

## Decisioni utente

- CI matrix: Node 20.x, 22.x, 24.x (utente ha indicato "24" → incluse LTS attive + current)
- Security: Full — CodeQL + OSSF Scorecard + istruzioni per secret scanning / push protection
- Templates: Full classico (bug + feature + config + PR template + CODEOWNERS + FUNDING + SECURITY.md)

## Implementation Targets

| # | Path | Tipo |
|---|------|------|
| 1 | `.github/workflows/ci.yml` | Create |
| 2 | `.github/workflows/codeql.yml` | Create |
| 3 | `.github/workflows/scorecard.yml` | Create |
| 4 | `.github/dependabot.yml` | Create |
| 5 | `.github/ISSUE_TEMPLATE/bug_report.yml` | Create |
| 6 | `.github/ISSUE_TEMPLATE/feature_request.yml` | Create |
| 7 | `.github/ISSUE_TEMPLATE/config.yml` | Create |
| 8 | `.github/PULL_REQUEST_TEMPLATE.md` | Create |
| 9 | `.github/CODEOWNERS` | Create |
| 10 | `.github/FUNDING.yml` | Create |
| 11 | `SECURITY.md` | Create |
| 12 | `CODE_OF_CONDUCT.md` | Edit (fix email enforcement mancante) |

## Criteri di accettazione

- AC1: CI gira su Node 20.x, 22.x, 24.x e passa verde su push/PR verso `main`.
- AC2: Dependabot apre PR raggruppate weekly per `npm` e `github-actions`.
- AC3: CodeQL pubblica risultati in Security → Code scanning senza errori.
- AC4: Scorecard pubblica SARIF in Security.
- AC5: "New Issue" mostra solo bug/feature + link security/discussions (no blank issue).
- AC6: PR pre-compilata da template; CODEOWNERS assegna review a `@lucaforni`.
- AC7: `SECURITY.md` rilevato come Security policy.
- AC8: `CODE_OF_CONDUCT.md` senza placeholder email.

## Note sicurezza (non versionabili)

Secret scanning, push protection, Dependabot alerts/security updates, Private
Vulnerability Reporting e branch protection vanno abilitati via UI o `gh api`
(Settings → Code security). Vedi report finale per i comandi.
