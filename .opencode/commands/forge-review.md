---
description: "Dual-model adversarial code review: Claude Opus 4.6 + GPT-5.3-Codex, synthesized"
subtask: true
---

# Dual-Model Adversarial Code Review

You are the FORGE orchestrator handling `/forge-review`. This command runs two
**independent** adversarial reviews in parallel — one with Claude Opus 4.6
(`forge-reviewer`) and one with GPT-5.3-Codex (`forge-reviewer-codex`) — then
synthesizes their findings into a single authoritative report.

## Arguments

Optional scope: $ARGUMENTS

- If a spec ID or story ID is provided, review the implementation for that
  spec/story.
- If a file path or glob pattern is provided, review those specific files.
- If `--diff` is provided, review only the current git diff.
- If no argument, review the most recent changes (via `git diff`).

## Phase 1: Parallel Reviews

Spawn both review tasks **concurrently** using the Task tool. Pass the
original `$ARGUMENTS` unchanged to each agent.

### Task A — forge-reviewer (Claude Opus 4.6)

Invoke the `forge-reviewer` agent with scope: $ARGUMENTS

The agent will:
1. Load the relevant spec/story, architecture, and constitution.
2. Review all changed files across 7 dimensions (Correctness, Security,
   Performance, Maintainability, Constitution, Test-Spec Coherence, and
   UX Quality if UI changes are present).
3. Return its full structured findings report.

### Task B — forge-reviewer-codex (GPT-5.3-Codex)

Invoke the `forge-reviewer-codex` agent with scope: $ARGUMENTS

The agent will perform the same 7-dimension adversarial review independently,
with no knowledge of Task A's findings.

> Do NOT wait for Task A before launching Task B. Run both in parallel.

## Phase 2: Synthesis

Once both reviews complete, merge their findings:

1. **Label** every finding: `[OPUS]` for Task A, `[CODEX]` for Task B.
2. **Consensus**: If both models report the same underlying issue (same file,
   same root cause, even if described differently), merge into a single entry
   tagged `[CONSENSUS]` and elevate to the highest severity between the two.
3. **Unique findings**: Preserve findings reported by only one model — they
   represent the independent perspective of each reviewer.
4. **Sort** the final list: CONSENSUS first (highest confidence), then by
   severity (CRITICAL → WARNING → INFO), then by dimension.

## Synthesis Output Format

```
FORGE Dual-Model Code Review
=============================
Scope:   [spec/story/files reviewed]
Date:    YYYY-MM-DD
Models:  Claude Opus 4.6 (forge-reviewer)
         GPT-5.3-Codex (forge-reviewer-codex)
Dimensions: Correctness · Security · Performance · Maintainability ·
            Constitution · Test-Spec Coherence[· UX Quality]

Issues Found: N total  (X consensus · Y opus-only · Z codex-only)
─────────────────────────────────────────────────────────────────

[CONSENSUS][CRITICAL] CORRECTNESS - src/auth/login.ts:42
  Issue: Missing null check on user lookup result.
  Impact: Unhandled TypeError if user is not found — crashes the endpoint.
  Suggestion: Add explicit null check and return 401 before accessing user fields.
  Reported by: OPUS + CODEX

[OPUS][WARNING] TEST-SPEC COHERENCE - tests/auth/login.test.ts
  Issue: Acceptance criterion AC-3 (rate limiting after 5 failed attempts)
         has no corresponding test.
  Impact: Rate limiting may be silently broken without any regression signal.
  Suggestion: Add test: "should return 429 after 5 failed login attempts".

[CODEX][WARNING] SECURITY - src/api/users.ts:15
  Issue: User email is returned in all API responses without an explicit DTO.
  Impact: PII leakage to unintended consumers.
  Suggestion: Add a response DTO that maps only safe fields.

[CONSENSUS][INFO] MAINTAINABILITY - src/services/payment.ts:88
  Issue: Function `processPayment` is 120 lines.
  Impact: Difficult to test and maintain independently.
  Suggestion: Extract `validatePaymentInput()` and `notifyPaymentComplete()`.
  Reported by: OPUS + CODEX

─────────────────────────────────────────────────────────────────
Summary:
  CONSENSUS: N  (flagged by both models — highest confidence)
  OPUS only: N
  CODEX only: N

  Severity:  CRITICAL N | WARNING N | INFO N

Verdict: [NEEDS CHANGES / APPROVED WITH NOTES]
```

## Anti-Sycophancy Rules

- Combined, the two models MUST surface at least 5 issues. If synthesis
  produces fewer, flag a meta-warning that one or both reviews were shallow.
- Do NOT discard a finding just because only one model reported it — unique
  findings are valuable and represent blind spots of the other model.
- Consensus findings carry the highest confidence and MUST be addressed
  before merge if CRITICAL.

After presenting the synthesis, remind the user that **human review is the
second gate** before merging.
