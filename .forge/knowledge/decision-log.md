# Decision Log

> This file captures session-level decisions made during development. The
> `session-knowledge` plugin auto-appends entries when sessions end. Important
> decisions should be promoted to formal ADRs in `.forge/knowledge/adr/`.
>
> **Format**: Each entry records the date, session context, and decisions made.
>
> **Maintenance**: Weekly review by tech lead. Promote significant decisions
> to ADRs. Archive stale entries.

---

---

## 2026-06-24 — Epic E01: Frontend Pattern Library

**Key decisions**:

1. **Pattern come reference .md, non template obbligatorio.** I pattern specificano
   struttura, stati, data flow. Build li usa come reference per generare codice,
   non copia-incolla. Templates .tsx sono opzionali (forniti per i pattern core).

2. **State machine in YAML.** Machine-parseable format for states and transitions.
   More precise than free text.

3. **9 mandatory sections per pattern.** When to use, Components, JSX, State
   Machine, Data Flow, Types, A11y, Responsive, QA Checklist. No optional
   sections.

4. **design-system.md separato dai pattern.** Riutilizzabile da qualsiasi pattern.
   Non duplicare token in ogni pattern.

5. **QA Checklist parte integrante del pattern.** forge-reviewer carica il pattern
   e verifica la checklist. QA oggettivo, non "a occhio".

**ADR creati**: ADR-002 (Pattern Library Architecture), ADR-003 (Interaction Patterns)

**Output**: 17 pattern, 15 template, 3 foundation doc, 2 ADRs (~15k righe)
