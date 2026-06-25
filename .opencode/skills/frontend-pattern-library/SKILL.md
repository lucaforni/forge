---
name: frontend-pattern-library
description: Integrates the FORGE Frontend Pattern Library into UX design and implementation workflows. Guides selection of the right UI pattern based on feature requirements, loads design tokens + stack decisions, and provides template references for code generation.
license: MIT
compatibility: opencode
metadata:
  audience: forge-ux, forge (Build)
  workflow: forge
---

## Purpose

Bridge the gap between UX specification and frontend implementation by providing
a shared vocabulary of **17 UI patterns** for React + shadcn/ui + Tailwind.
forge-ux referenzia pattern per nome nella design-spec. Build carica il pattern
e lo usa come reference strutturale per generare codice consistente.

## When to Load

Caricare QUESTO skill PRIMA di `/forge-ux` quando:
- La feature ha **user-facing UI** web
- Lo stack è React + shadcn/ui + Tailwind (o compatibile)

Caricare DOPO `context-chain` e PRIMA di `ux-design`.

## Workflow

### 1. Load Foundation Documents

Leggere questi file (esistenza verificata, silent if missing):

```
.forge/frontend/stack-decisions.md    — Stack, framework, convenzioni
.forge/frontend/design-system.md      — Token, component inventory, regole d'oro
```

### 2. Load Pattern Index

Leggere `.forge/frontend/patterns/index.md` — contiene:

- **Decision Tree**: albero navigabile per selezionare il pattern giusto
- **Pattern Matrix**: tutti i pattern con severità, dipendenze, stati coperti
- **Pattern Selection by Use Case**: tabella situazione → pattern primario/secondario
- **Pattern Selection by Data Volume**: guida per scegliere in base ai volumi

### 3. Select Pattern Using Decision Tree

Dato il requisito UI, navigare l'albero decisionale:

```
L'utente deve VISUALIZZARE dati?
  ├── Tabellari, 10+ record, filtrabili? → Pattern: DATA TABLE
  ├── Metriche, trend, KPI?              → Pattern: DASHBOARD + KPI CARD  
  ├── Lista + dettaglio?                 → Pattern: MASTER-DETAIL
  ├── Ricerca + risultati?               → Pattern: SEARCH + RESULTS
  └── Feed continuo?                     → Pattern: INFINITE SCROLL

L'utente deve INSERIRE dati?
  ├── Form singolo?                      → Pattern: FORM + VALIDATION
  ├── Multi-step?                        → Pattern: WIZARD
  └── Impostazioni?                      → Pattern: SETTINGS PANEL

L'utente deve CONFERMARE / INTERAGIRE?
  ├── Conferma azione?                   → Pattern: MODAL FLOW
  ├── Azione distruttiva?                → Pattern: CONFIRMATION FLOW
  ├── Pannello laterale?                 → Pattern: DRAWER / SHEET
  └── Navigazione rapida?                → Pattern: COMMAND PALETTE

L'utente riceve FEEDBACK?
  ├── Notifica temporanea?               → Pattern: NOTIFICATION
  ├── Errore con recupero?               → Pattern: ERROR RECOVERY
  └── Stato transitorio?                 → Pattern: LOADING SKELETON

Nessun dato?                             → Pattern: EMPTY STATE (sempre)
```

### 4. Load Selected Pattern

Caricare `.forge/frontend/patterns/pattern-[nome].md`

Il pattern contiene 9 sezioni obbligatorie:
1. **Quando Usare** — condizioni precise di utilizzo
2. **Componenti shadcn/ui** — quali componenti e varianti
3. **Composizione JSX** — struttura layout
4. **State Machine** — loading, empty, error, edge cases in formato YAML
5. **Data Flow** — React Query keys, URL params, cache strategy
6. **TypeScript Types** — Props, data interfaces
7. **Accessibilità** — ARIA, keyboard, screen reader flow
8. **Responsive** — breakpoint behavior
9. **QA Checklist** — punti verificabili dal reviewer

### 5. Load Design System (if needed per componenti specifici)

Dal `design-system.md`:
- Token semantici per colori, spacing, typography
- Component inventory con varianti e quando usarli
- Regole di composizione componenti

## Output per forge-ux

Nella design-spec, INCLUDE:

```
### Pattern Reference
Pattern: DATA TABLE
Source: .forge/frontend/patterns/pattern-data-table.md

Selected by: Elenco ordini con 20+ record, filtri per status, 
             ordinamento per data, paginazione server-side

Template: .forge/frontend/patterns/templates/data-table.tsx

Stati da implementare:
  - loading (skeleton table)
  - populated (ordinato per data desc)
  - empty (first-visit: "Nessun ordine" + CTA)
  - filtered-empty (filtri attivi: "Cancella filtri")
  - error (retry button)
  - refetching (dati precedenti visibili)

QA Checklist (da validare in review):
  - Sorting: click header cicla asc/desc
  - Pagination: page in URL
  - Filtri: URL si aggiorna
  - Empty states: first-visit vs filtered
```

## Output per Build (implementazione)

Quando Build riceve una design-spec con Pattern Reference:

1. Caricare il file del pattern → capire struttura, stati, data flow
2. Caricare il template se esiste → usare come base strutturale
3. Adattare al contesto specifico (colonne, filtri, azioni)
4. Implementare TUTTI gli stati documentati (loading, empty, error, edge cases)
5. Seguire design token per colori/spacing
6. Verificare contro QA checklist del pattern

## Reference Files

Pattern index:       `.forge/frontend/patterns/index.md`
Design system:       `.forge/frontend/design-system.md`
Stack decisions:     `.forge/frontend/stack-decisions.md`
QA template:         `.forge/frontend/qa-checklist-template.md`
Patterns dir:        `.forge/frontend/patterns/`
Templates dir:       `.forge/frontend/patterns/templates/`
