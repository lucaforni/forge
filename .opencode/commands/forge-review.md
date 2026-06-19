---
description: "Dual-model adversarial code review: forge-reviewer + forge-reviewer-peer, synthesized"
subtask: true
---

# Dual-Model Adversarial Code Review

Runs two **independent** adversarial reviews in parallel — `forge-reviewer` and `forge-reviewer-peer` — then synthesizes findings.

## Arguments

`$ARGUMENTS` — optional scope:
- spec/story ID → review that implementation
- file path or glob → review those files
- `--diff` → review current git diff
- empty → review most recent changes (`git diff`)

## Phase 1: Parallel Reviews

Spawn both tasks **concurrently** via Task tool. Pass `$ARGUMENTS` unchanged.

### Task A — forge-reviewer

Invoke with scope: `$ARGUMENTS`. Agent loads spec/story, architecture, constitution; reviews changed files across 7 dimensions (Correctness, Security, Performance, Maintainability, Constitution, Test-Spec Coherence, UX Quality if UI changed); returns full structured findings.

### Task B — forge-reviewer-peer

Same 7-dimension review, independently, with no knowledge of Task A.

> Do NOT wait for Task A before launching Task B. Run both in parallel.

## Phase 2: Synthesis

1. **Label** every finding: `[A]` (forge-reviewer) or `[B]` (forge-reviewer-peer).
2. **Consensus**: same file + same root cause → merge as `[CONSENSUS]`, elevate to highest severity.
3. **Unique findings**: preserve — they're the value of dual review.
4. **Sort**: CONSENSUS first, then severity (CRITICAL → WARNING → INFO), then dimension.

## Output Format

```
FORGE Dual-Model Code Review
=============================
Scope:   [spec/story/files]
Date:    YYYY-MM-DD
Models:  Task A — forge-reviewer
         Task B — forge-reviewer-peer
Dimensions: Correctness · Security · Performance · Maintainability ·
            Constitution · Test-Spec Coherence[· UX Quality]

Issues Found: N total (X consensus · Y A-only · Z B-only)
─────────────────────────────────────────────────────────────────

[CONSENSUS][CRITICAL] CORRECTNESS - src/auth/login.ts:42
  Issue: Missing null check on user lookup result.
  Impact: Unhandled TypeError if user not found — crashes endpoint.
  Suggestion: Add null check, return 401 before accessing user fields.
  Reported by: A + B

[A][WARNING] TEST-SPEC COHERENCE - tests/auth/login.test.ts
  Issue: AC-3 (rate limiting after 5 failed attempts) has no test.
  Impact: Rate limiting may silently break.
  Suggestion: Add test "should return 429 after 5 failed login attempts".

[B][WARNING] SECURITY - src/api/users.ts:15
  Issue: User email returned without explicit DTO.
  Impact: PII leakage.
  Suggestion: Add response DTO mapping only safe fields.

─────────────────────────────────────────────────────────────────
Summary:
  CONSENSUS: N  (highest confidence)
  A only: N
  B only: N
  Severity:  CRITICAL N | WARNING N | INFO N

Verdict: [NEEDS CHANGES / APPROVED WITH NOTES]
```

## Anti-Sycophancy Rules

- Combined output MUST surface ≥5 issues. Fewer → flag meta-warning (shallow review).
- Do NOT discard single-model findings — they're blind-spot insurance.
- CRITICAL consensus findings MUST be addressed before merge.

After synthesis, remind user: **human review is the second gate**.
