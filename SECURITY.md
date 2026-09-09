# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

Ricevono fix di sicurezza solo le release supportate (`2.x`).
Le versioni precedenti sono EOL: aggiorna all'ultima minor/patch.

## Reporting a Vulnerability

**NON aprire issue pubbliche per vulnerabilità.**

Usa la segnalazione privata di GitHub:

👉 https://github.com/lucaforni/forge/security/advisories/new
(Private Vulnerability Reporting)

Includi se possibile:

- Descrizione dell'impatto e scenario di sfruttamento
- Passi per riprodurre / PoC minimale
- Versioni affette e commit di riferimento
- Eventuali mitigazioni o fix suggeriti

### SLA di risposta

- **Conferma ricezione**: entro 72 ore
- **Valutazione iniziale** (severità + piano): entro 7 giorni
- **Fix + advisory**: tempi proporzionali alla severità (Critical/High prioritari)

Ti terremo aggiornato tramite il thread privato dell'advisory.

## Disclosure Policy

- Divulgazione coordinata: pubblichiamo un GitHub Security Advisory solo dopo che il fix è disponibile.
- Ti accreditiamo come reporter (salvo tua richiesta contraria).
- Ti chiediamo di non divulgare pubblicamente dettagli o exploit fino alla pubblicazione dell'advisory.

## Scope

- ✅ Codice di questo repo (`forge`), workflow GitHub Actions, installer, MCP server
- ⛔ Progetti generati *con* FORGE, account social, infrastrutture personale del maintainer

## No Bug Bounty

Al momento non è previsto un programma di bug bounty a pagamento.

## Riferimenti operativi

Protezioni attive sul repo (verificate il 2026-09-09 via API):
Dependabot alerts + security updates, secret scanning + push protection,
Private Vulnerability Reporting. CodeQL (security-extended) e OSSF Scorecard
si attivano al primo push dei workflow su `main`.

> Fork o nuovo repo? Abilita le stesse protezioni in
> Settings → Code security, oppure via `gh api` (vedi decision-log).
