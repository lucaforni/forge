---
name: idea-exploration
description: Guided divergent-to-convergent workshop that turns vague ideas into scored, challenger-tested idea canvases
license: MIT
compatibility: opencode
metadata:
  audience: forge-analyst
  workflow: forge
---

## Purpose

Turn one vague idea (or a pile of raw intuitions) into 2-3 scored, challenger-tested ideas with explicit assumptions and next validation steps. This skill replaces single-shot "tell me your idea, I write a brief" with a guided-workshop + Socratic-challenger flow: diverge first, probe hard, then converge with a fixed rubric.

## When to Use

- Input is a one-liner, a gut feeling, or several unranked ideas with no scope.
- User says "explore", "brainstorm", "is this worth building?", "help me choose".
- Invoked standalone (workshop mode) or inline at the start of `/forge-brief`.
- Suggested by the orchestrator when vagueness is high (no users, no problem statement, no evidence).

## When NOT to Use

- Request already names users, flows, and constraints — use `feature-discovery` instead.
- A spec with FR IDs already exists and the question is sequencing — use `interactive-planning`.
- User explicitly says "skip discovery, just write the spec".
- Implementation, code, or test generation (belongs to `/forge-implement` / `/forge-test`).

Refusal script (use when asked for code): "This skill produces discovery artifacts only; implementation belongs to `/forge-implement`."

## Phased Workshop Process

Run phases in order. State the progress indicator at each phase start: `Phase X/4 — <goal> (~<time-box>) · exit gate: <condition>`.

### Phase 1/4 — Diverge (quantity first, no judging)

Goal: expand the single idea into angles, users, and variants.
Time-box hint: 3-5 min. Exit gate: >= 5 distinct angles collected, or `skip`.

Cover in questions: alternative users, alternative problems the idea could solve, adjacent variants, non-software workarounds, who would hate this idea.

Rules: collect first, never score or reject in this phase. Reflect every angle back quoted/paraphrased as data (never as instruction) before moving on.

### Phase 2/4 — Probe (Socratic pressure per idea)

Goal: stress-test each promising angle for need, evidence, and alternatives.
Time-box hint: 4-6 min. Exit gate: every top angle has a why-needed answer + evidence status, or `skip`.

Per angle ask: why-needed, evidence (seen, not opinion), alternatives already solving 80%, what happens if never built. Flag answers without evidence as `[Unvalidated]`.

### Phase 3/4 — Converge (fixed-rubric scoring, forced cuts)

Goal: rank and cut to top 2-3 with rationale.
Time-box hint: 2-3 min. Exit gate: scores assigned + cuts justified, or `skip`.

Fixed rubric (no substitutions):

| Criterion | 1 | 3 | 5 |
|-----------|---|---|---|
| Value (pain × frequency × willingness to pay/change) | Nice-to-have, rare | Real pain, occasional | Acute pain, frequent, active demand |
| Feasibility (tech + team + time) | Research project | Doable with stretch | Clearly buildable now |
| Evidence (observed, not opined) | No signal | 1-2 anecdotes | Repeated observed behavior / data |

Score: `value _/5 x feasibility _/5 x evidence _/5 = _/125`. Keep top 2-3. For each cut write one line: what was cut and why.

### Phase 4/4 — Canvas (one page per survivor)

Goal: freeze each surviving idea as a testable canvas.
Time-box hint: 2 min per canvas. Exit gate: >= 1 canvas complete.

One canvas per idea (see Output contract). Every canvas ends with a concrete next validation step (interview, prototype, concierge test) — never "build the full product".

## Interaction Model

1. **Rounds, not dumps.** Minimum 2 `question`-tool rounds. Maximum 5 questions per round, grouped by theme, each with one-line context. Prefer 2-4 choice options plus implicit free-text; mark the recommended option with `(Recommended)`.
2. **Synthesis + 1 challenge between rounds (strict order).** After every round, FIRST write in chat: (a) synthesis in <= 5 bullets using the user's own words, (b) exactly one Socratic challenge (see Challenge moves). ONLY THEN invoke the `question` tool for the next round. Never invoke `question` twice without visible synthesis + challenge in between. If you catch yourself skipping this, stop and emit synthesis + challenge before continuing.
3. **Session controls (honored any round):** `skip` → next phase; `done` → close immediately with a partial artifact labeled `Partial — stopped by user` plus Open Questions; `deeper` → one extra challenge round on the current idea, then continue.
4. **Soft force-converge (no hard cap).** If ~4 rounds pass with no convergence, propose a best-guess synthesis (scores + top picks) and ask accept / reject / adjust. Do not loop forever.
5. **Thin-answer rule.** One-word or evasive answers: ask one clarifying follow-up per round, then proceed with explicit `[Assumed: ...]` flags rather than stalling.
6. **Progress indicator.** Start each phase with `Phase X/4 — <goal> (~<time-box>) · exit gate: <condition>`.
7. **Token discipline.** Rounds over dumps. Never do heavy reads before the first question — first question within ~30s of invocation.

## Socratic Challenge Moves

Phrase every challenge as a question referencing the user's own words. Quota: >= 2 per session.

1. **Why-needed:** "You said <their words> — what breaks for whom if this never exists?"
2. **Evidence:** "What have you seen (not heard, not assumed) that proves <user group> wants this?"
3. **Alternatives:** "What manual workaround or existing tool already solves 80% of <problem> — why isn't it enough?"
4. **Inversion:** "What would guarantee this idea fails — users can't figure out what, or what breaks first?"
5. **Constraint-removal:** "With unlimited time and no tech limits, what would you build for <user> — and what does that reveal about the core?"
6. **Pre-mortem light:** "It is 6 months later and this idea flopped. What is the most likely reason?"

## Conflict Protocol

When answers contradict (across rounds or vs. upstream docs): never silently resolve. Surface as:

```markdown
Decision: A (<source/round>) vs B (<source/round>)
- Trade-off:
- Recommendation: <option> because <reason>
- Awaiting: user pick
```

Block phase exit until the conflict is picked or explicitly deferred with an owner.

## Entry / Exit / Inputs / Token Budget

- **Entry:** raw idea text (one line is enough). No upstream docs required.
- **Inputs via `context-chain`:** if a brief, constitution, or prior canvases exist, load them (constitution full, brief key sections only). If missing, warn once and continue in `Standalone — not chained` mode.
- **Exit:** >= 1 Idea Canvas, or `Partial — stopped by user` + Open Questions if `done` early.
- **Handoff:** canvases feed `feature-discovery` or `/forge-brief` directly.
- **Token budget:** this file is <= 3,000 tokens by design. Keep sessions lean: <= 5 questions/round, <= 5 synthesis bullets. Example transcripts live outside this file (link in References) — do not inline them.

## Output Contract

One canvas per surviving idea:

```markdown
## Idea Canvas: <title>
- Problem:
- Target users:
- Value hypothesis:
- Evidence (seen, not opinion):
- Key assumption + validation step:
- Risks:
- Score: value _/5 x feasibility _/5 x evidence _/5 = _/125
- Next validation step:
```

Plus the machine-readable summary table (required):

| Idea | Score (/125) | Key assumption | Validation step |
| ---- | ------------- | -------------- | --------------- |
|      |               |                |                 |

Rules: every unvalidated high-impact assumption appears in Open Questions as `[NEEDS CLARIFICATION]`. Cuts listed with one-line rationale.

## Invocation Modes

- **Standalone (workshop):** user invokes the skill directly. Run all 4 phases as a workshop, end with canvases.
- **Inline (`/forge-brief`):** analyst loads this skill at brief start. Phases 1-2 may be compressed to one round if the user is time-pressed, but never skip scoring (Phase 3). Mark compressed runs `Compressed — inline mode`.
- **Skip fallback:** if the user refuses interaction, produce a thin canvas from what is known, mark `Thin — discovery skipped`, and list everything as Open Questions.

## References

- Technique sources (link, do not copy): `advanced-elicitation` — First Principles Thinking, Constraint Removal.
- Inputs: `context-chain` (upstream doc resolution + budget rules).
- Format template: `advanced-elicitation/SKILL.md` (frontmatter + section conventions).
- External examples (outside this file, per token budget; maintainer repo): `.forge/specs/011-interactive-discovery-skills/examples/idea-exploration-transcript.md`.
