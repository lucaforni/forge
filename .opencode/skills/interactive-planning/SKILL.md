---
name: interactive-planning
description: Commitment and sequencing workshop that turns specs and constraints into milestones, trade-offs, risks, and deferred-item rationale
license: MIT
compatibility: opencode
metadata:
  audience: forge-pm forge-architect
  workflow: forge
---

## Purpose

Turn a scoped spec plus real constraints (time, team, tech) into a committable Interaction Plan: phased milestones traced to FR IDs, dependency map, risk→mitigation links, an explicit trade-off round with before/after scope table, and a deferred-item list with rationale plus owners for every `[NEEDS CLARIFICATION]`. Workshop-guided, Socratic-challenger, and a strict separate input to `/forge-plan` — it never writes `plan.md` directly.

## When to Use

- Spec FR IDs exist but sequencing, milestones, cuts, or risks are open.
- User says "plan this", "sequence the work", "what fits in 2 weeks?", "what do we cut?".
- Inline before `/forge-plan`, or standalone to re-plan when constraints change.
- Suggested by the orchestrator when a spec plus a constraint ("halve the time", "solo dev") is present.

## When NOT to Use

- No spec or discovery brief yet — run `feature-discovery` (or `idea-exploration`) first.
- The task is architecture decisions or ADRs — that is `/forge-architecture` (this skill flags `→ architect decision`, never invents).
- Code, tasks breakdown, or test writing (`/forge-tasks`, `/forge-implement`, `/forge-test`).

## Phased Workshop Process

Progress indicator per phase: `Phase X/4 — <goal> (~<time-box>) · exit gate: <condition>`.

### Phase 1/4 — Constraints & sequencing inputs

Goal: freeze the planning box (time, team, tech, dependencies, hard dates).
Time-box: 2-3 min. Exit gate: constraints table complete, or `skip`.
Capture: deadline + why it matters, team capacity, tech/stack limits, external dependencies, must-haves vs nice-to-haves. Challenge every "must" with: "what happens if this slips a week?"

### Phase 2/4 — Slice & sequence

Goal: vertical slices ordered by value and dependency.
Time-box: 4-5 min. Exit gate: milestone table with FR-ID traceability, or `skip`.
Rules: slices must be demoable; each milestone lists scope (FR IDs), depends-on, effort (S/M/L). No milestone without FR trace. Surface dependency inversions immediately.

### Phase 3/4 — Risk & cut workshop

Goal: pre-mortem light + constraint-removal re-plan + mandatory trade-off round.
Time-box: 4-5 min. Exit gate: risk→mitigation map + before/after scope table, or `skip`.
Mandatory trade-off round: ask "if we halve <time/team>, what do we cut?" and produce:

| Scope item (FR IDs) | Before | After (halved) | Preserved value |
| ------------------- | ------ | -------------- | --------------- |
|                     | In v1  | Deferred / cut | Why core still holds |

Plus pre-mortem light: "it is 3 months later and milestones slipped — most likely reason?" Each top risk gets a mitigation or an explicit accepted-risk flag.

### Phase 4/4 — Commitment

Goal: signed-off deferred list + owners for open items.
Time-box: 2-3 min. Exit gate: deferred rationale + `[NEEDS CLARIFICATION]` owners, or `done`.
Every deferred item: rationale + revisit-when. Every open item: owner + next action. End with a one-paragraph commitment statement the user can accept/reject.

### Commitment refusal → accepted-risk template

If the user rejects slicing and holds "tutto insieme o niente" despite the trade-off round, do NOT silently comply and do NOT force-slice. Record both explicitly:

```markdown
Decision: A (sliced M1/M2/M3, M1 shippable alone) vs B (tutto insieme, single milestone)
- Trade-off: A ships value at ~half time; B risks 0 shippable if the box slips.
- Recommendation: A, because <one-line reason referencing user's constraint>.
- User pick: B (recorded) + accepted-risk: <what slips first if the box slips>.
```

Then produce the milestone table in sliced form anyway (as recommendation) and add: `Commitment status: B chosen — accepted-risk: <risk> (owner: user)`. Phase exit is allowed with this block; never drop the disagreement.

## Interaction Model

1. **Rounds, not dumps.** Minimum 2 `question`-tool rounds, one of which MUST be the trade-off round (Phase 3). Maximum 5 questions per round, grouped by theme, one-line context each. Prefer 2-4 choice options + implicit free-text; mark best practice `(Recommended)`.
2. **Synthesis + 1 challenge between rounds (strict order).** After every round, FIRST write in chat: (a) synthesis <= 5 bullets in the user's words, (b) exactly one Socratic challenge. ONLY THEN invoke the `question` tool for the next round. Never invoke `question` twice without visible synthesis + challenge in between. If you catch yourself skipping this, stop and emit synthesis + challenge before continuing.
3. **Session controls:** `skip` → next phase; `done` → close with partial Interaction Plan labeled `Partial — stopped by user`; `deeper` → one extra challenge round on the current phase.
4. **Soft force-converge.** If ~4 rounds pass without convergence, propose best-guess milestones + cuts and ask accept / reject / adjust.
5. **Thin-answer rule.** One-word answers → one clarifying follow-up per round, then continue with `[Assumed: ...]` flags.
6. **Progress indicator:** `Phase X/4 — <goal> (~<time-box>) · exit gate: <condition>`.
7. **Token discipline.** First question within ~30s; no heavy spec re-reads before interacting (load FR IDs lazily per milestone).

## Socratic Challenge Moves

Quota: >= 2 per session, one of which is the trade-off round. Phrase as questions on the user's words.

1. **Why-needed:** "Which milestone delivers user value on its own — and which is just scaffolding?"
2. **Constraint-removal:** "With double the team, what would you still NOT build — and what does that say about v1?"
3. **Trade-off (mandatory):** "If we must ship in half the time, which milestone survives intact and what gets cut first?"
4. **Inversion:** "What sequencing choice would guarantee integration hell in month two?"
5. **Pre-mortem light:** "Milestones slipped 4 weeks. Was it an underestimated dependency, a missing skill, or scope creep?"
6. **Evidence:** "Which effort estimate (S/M/L) is a guess rather than based on prior work — and who can validate it?"

## Architecture Guardrail

This skill NEVER invents architecture. Any technical choice (stack, pattern, data model, API shape) is recorded as:

```markdown
- <decision needed>: → architect decision (for `/forge-architecture` or ADR)
```

Proceed with planning around the placeholder. Flagging is mandatory; inventing is a violation.

## Entry / Exit / Inputs / Token Budget

- **Entry:** spec FR IDs (or Discovery Brief FR-candidates) + constraints (time/team/tech).
- **Inputs via `context-chain`:** spec (full), constitution (full), architecture draft if any (key sections: constraints, risks). Missing docs → warn once, mark `Standalone — not chained`.
- **Exit:** complete Interaction Plan (see Output contract), or `Partial — stopped by user` + Open Questions.
- **Handoff:** Interaction Plan is a SEPARATE input to `/forge-plan` (per 2026-10-05 clarification). It never pre-fills or overwrites `plan.md` sections.
- **Token budget:** file <= 3,000 tokens. Sessions: <= 5 questions/round, <= 5 synthesis bullets. Transcripts external (see References).

## Output Contract

Interaction Plan (all sections required):

1. **Milestone table** (FR-traceable):

| Milestone | Scope (FR IDs) | Depends on | Effort |
| --------- | -------------- | ---------- | ------ |
|           |                |            |        |

2. **Dependency list** (blocking order, external deps flagged).
3. **Risk→mitigation map:**

| Risk | Likelihood | Mitigation / accepted-risk |
| ---- | ---------- | -------------------------- |
|      |            |                            |

4. **Deferred-item list with rationale:**

| Deferred | Rationale | Revisit when |
| -------- | --------- | ------------ |
|          |           |              |

5. **`[NEEDS CLARIFICATION]` owner list:**

| Item | Owner |
| ---- | ----- |
|      |       |

6. **Trade-off before/after table** (from Phase 3) + one-paragraph commitment statement.
7. **Guardrail check:** zero invented architecture; every technical open item flagged `→ architect decision`.

## Invocation Modes

- **Standalone:** full 4-phase workshop, including re-plan mode when constraints change mid-session ("halve the time" → show before/after and preserved core value).
- **Inline (`/forge-plan`):** PM/architect load this skill before drafting. Phases 1-2 may compress into round 1; Phase 3 trade-off round never skipped. Mark `Compressed — inline mode`.
- **Skip fallback:** on refusal, emit thin plan (`Thin — planning skipped`) with milestones as guesses marked `[Assumed: ...]` and everything risky as `[NEEDS CLARIFICATION]`.

## References

- Technique sources (link, do not copy): `advanced-elicitation` — Pre-mortem Analysis, Constraint Removal, Inversion Analysis.
- Inputs: `context-chain`. Prior phases: `feature-discovery` (Discovery Brief + FR-candidates as entry).
- External examples: `dev/.forge/specs/011-interactive-discovery-skills/examples/interactive-planning-transcript.md`.
