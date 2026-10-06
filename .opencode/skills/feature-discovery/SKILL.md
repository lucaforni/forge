---
name: feature-discovery
description: Convergent discovery workshop that turns feature requests into scoped, testable requirements with assumption log and scope line
license: MIT
compatibility: opencode
metadata:
  audience: forge-pm forge-analyst
  workflow: forge
---

## Purpose

Converge a fuzzy feature request into scoped, testable requirements: personas + jobs-to-be-done, happy paths, edge cases, measurable NFR targets, an explicit in/out scope line, and an assumption log where every high-impact unvalidated item becomes `[NEEDS CLARIFICATION]`. Workshop-guided in structure, Socratic-challenger in tone — the output feeds `/forge-specify` with minimal rework.

## When to Use

- Request names a feature but users, flows, edges, or constraints are unclear.
- User says "define the feature", "scope this", "what should v1 include?".
- Invoked standalone or inline inside `/forge-specify` (before drafting the spec).
- Suggested by the orchestrator when a feature request lacks users or evidence.

## When NOT to Use

- Input is still a pile of unranked ideas — use `idea-exploration` first.
- Spec FR IDs exist and the task is sequencing/milestones — use `interactive-planning`.
- User says "skip discovery". User asks for code or architecture decisions (redirect: `/forge-implement`, `/forge-architecture`).

## Phased Workshop Process

Run in order. Progress indicator per phase: `Phase X/5 — <goal> (~<time-box>) · exit gate: <condition>`.

### Phase 1/5 — Users & JTBD

Goal: who is this for and what job does it do for them.
Time-box: 3-4 min. Exit gate: 1-3 personas + JTBD statements, or `skip`.
Questions cover: primary/secondary users, job-to-be-done ("when … I want … so I can …"), non-users, who is harmed or burdened.

### Phase 2/5 — Happy-path flows

Goal: the golden path as numbered steps.
Time-box: 3-4 min. Exit gate: >= 1 end-to-end flow with trigger + outcome, or `skip`.
Each flow: trigger, steps (actor → action → feedback), success outcome. No edge cases here — park them explicitly ("parking lot").

### Phase 3/5 — Edge cases & failure modes

Goal: what breaks, empties, denies, or confuses.
Time-box: 4-5 min. Exit gate: edge-case table with >= 5 rows, or `skip`.
Use inversion: "what would guarantee this feature fails?" Cover error, empty, permission-denied, offline/slow, double-submit, conflicting input, abuse. Each row maps to an FR-candidate ID or `→ new FR`.

### Phase 4/5 — Constraints & NFR targets

Goal: measurable non-functional boundaries.
Time-box: 2-3 min. Exit gate: every claimed NFR has metric + target + how to verify, or marked `[NEEDS CLARIFICATION]`.
Cover performance, scale/volume, security/privacy, accessibility, platforms. Vague adjectives ("fast", "secure") are rejected until quantified.

### Phase 5/5 — Scope line

Goal: explicit in / out / future + assumption log sign-off.
Time-box: 3 min. Exit gate: scope line complete + assumption log reviewed, or `done`.
Force cuts: propose a v1 cut and ask accept/reject. Every deferred item gets a rationale. Every high-impact unvalidated assumption becomes `[NEEDS CLARIFICATION]` with an owner.

## Interaction Model

1. **Rounds, not dumps.** Minimum 3 `question`-tool rounds: round 1 = users/flows (Phases 1-2), round 2 = edge cases/NFRs (Phases 3-4), round 3 = scope cuts (Phase 5). Maximum 5 questions per round, grouped by theme, one-line context each. Prefer 2-4 choice options + implicit free-text; mark best practice `(Recommended)`.
2. **Synthesis + 1 challenge between rounds (strict order).** After every round, FIRST write in chat: (a) synthesis <= 5 bullets in the user's words, (b) exactly one Socratic challenge. ONLY THEN invoke the `question` tool for the next round. Never invoke `question` twice without visible synthesis + challenge in between. If you catch yourself skipping this, stop and emit synthesis + challenge before continuing.
3. **Session controls:** `skip` → next phase; `done` → close with partial Discovery Brief labeled `Partial — stopped by user`; `deeper` → one extra challenge round on the current phase.
4. **Soft force-converge.** If ~4 rounds pass without convergence, propose best-guess scope line + assumption log and ask accept / reject / adjust.
5. **Thin-answer rule.** One-word answers → one clarifying follow-up per round, then continue with `[Assumed: ...]` flags.
6. **Progress indicator:** `Phase X/5 — <goal> (~<time-box>) · exit gate: <condition>`.
7. **Token discipline.** First question within ~30s; no heavy upstream reads before interacting.

## Socratic Challenge Moves

Quota: >= 3 per session, phrased as questions on the user's words.

1. **Why-needed:** "If we never build <feature>, what breaks for <persona> — in their words?"
2. **Evidence:** "What observed behavior (not opinion) shows <persona> struggles with this today?"
3. **Consequence-of-not-doing:** "If v1 excludes <scope item>, who notices and what do they do instead?"
4. **Alternatives:** "What manual process or existing tool covers 80% of this JTBD?"
5. **Inversion:** "What would guarantee users abandon this feature on first use?"
6. **Pre-mortem light:** "Six months post-launch this feature is dead code. Most likely cause?"

## Conflict Protocol

When answers contradict (across rounds, stakeholders, or vs. upstream docs): never silently resolve. Surface as:

```markdown
Decision: A (<source/round>) vs B (<source/round>)
- Trade-off:
- Recommendation: <option> because <reason>
- Awaiting: user pick
```

Block phase exit until the conflict is picked or explicitly deferred with an owner.

## Entry / Exit / Inputs / Token Budget

- **Entry:** feature request text + (optionally) idea canvases from `idea-exploration`.
- **Inputs via `context-chain`:** constitution (full), spec draft if any (full), idea canvases + architecture (key sections). Missing docs → warn once, mark output `Standalone — not chained`.
- **Exit:** complete Discovery Brief (see Output contract), or `Partial — stopped by user` + Open Questions.
- **Handoff:** brief feeds `/forge-specify` directly (FR-candidates become spec FRs).
- **Token budget:** file <= 3,000 tokens. Sessions: <= 5 questions/round, <= 5 synthesis bullets. Transcripts live externally (see References).

## Output Contract

Discovery Brief section set (all required):

1. **Personas + JTBD** (1-3, with job statements).
2. **Happy-path flows** (numbered trigger → steps → outcome).
3. **Edge-case table:**

| Case | Trigger | Expected behavior | FR-candidate |
| ---- | ------- | ----------------- | ------------ |
|      |         |                   |              |

4. **FR-candidate list** with IDs (`FR-FD-001…`), each testable.
5. **NFR targets** (metric + target + verification method).
6. **Scope line:** In / Out / Future lists (explicit out-of-scope required).
7. **Assumption log** (fixed schema):

| Assumption | Evidence | Validation status (validated/unvalidated) | Impact if wrong |
| ---------- | -------- | ----------------------------------------- | --------------- |
|            |          |                                           |                 |

Rule: every high-impact unvalidated assumption MUST also appear under Open Questions as `[NEEDS CLARIFICATION]` with an owner.

## Invocation Modes

- **Standalone:** full 5-phase workshop ending in a Discovery Brief file/section.
- **Inline (`/forge-specify`):** PM loads this skill before drafting. Phases 1-2 may compress into round 1 when time-pressed; Phases 3-5 never skipped. Mark compressed runs `Compressed — inline mode`.
- **Skip fallback:** on refusal, emit a thin brief (`Thin — discovery skipped`) with everything substantive as `[NEEDS CLARIFICATION]`.

## References

- Technique source (link, do not copy): `advanced-elicitation` — Inversion Analysis (edge cases), Socratic Questioning, Pre-mortem Analysis.
- Inputs: `context-chain`. Prior phase: `idea-exploration` (idea canvases as input).
- External examples: `dev/.forge/specs/011-interactive-discovery-skills/examples/feature-discovery-transcript.md`.
