---
description: "Generate tests, analyze coverage, and validate test quality for a spec or story"
agent: forge-qa
subtask: true
---

# Test Generation & Coverage Analysis

Handle `/forge-test` to generate tests, analyze coverage, and ensure depth matches the workflow track.

## Arguments

Optional scope: $ARGUMENTS

- Spec ID (e.g., `001`) → tests for that spec's implementation.
- Story ID → tests for that story's scope.
- File path/glob → tests for those files.
- `--coverage` → run test suite with coverage, report gaps.
- `--strategy` → output test strategy without generating tests.
- None → detect current spec/story context.

## Context Loading

1. Load `context-chain` skill.
2. `.forge/specs/NNN-slug/spec.md` — requirement IDs (FR-NNN, NFR-NNN, AC).
3. `.forge/specs/NNN-slug/plan.md` — file map, API contracts, data model.
4. `.forge/constitution.md` + `constitution-compliance` skill — Article 8 (Testing).
5. Existing test files — project conventions.

## Workflow

### 1. Determine Test Strategy

Load `test-strategy` skill. Identify track. Apply depth:

| Track        | Required Tests                        |
| ------------ | ------------------------------------- |
| Hotfix       | 1 regression test for the fix         |
| Quick        | Unit tests for changed logic          |
| Feature      | Unit + integration tests              |
| Epic/Product | Unit + integration + E2E for critical |

### 2. Map Requirements to Test Cases

Per FR/AC: identify source file(s), then design cases for:
- Happy path
- Error paths (invalid input, missing data, permission denied)
- Edge cases (empty collections, boundaries, null/undefined)

For each NFR with a metric (e.g., "response < 200ms"): note if perf test needed.

### 3. Generate Tests

1. Detect framework (`package.json`/`pyproject.toml`/existing tests).
2. Follow existing naming + directory conventions.
3. AAA pattern (Arrange-Act-Assert).
4. Descriptive names: `should [behavior] when [condition]`.
5. Add traceability comments:
   ```
   // Covers: FR-001 - User can register with email and password
   ```

### 4. Run and Validate

Run tests. If fail: diagnose test bug vs code bug.
- **Test bug**: fix the test.
- **Code bug**: report clearly — do NOT modify source code.

Run coverage if applicable.

### 5. Coverage Report

| Metric          | Quick | Feature | Epic/Product |
| --------------- | ----- | ------- | ------------ |
| Line coverage   | 70%   | 80%     | 85%          |
| Branch coverage | 50%   | 65%     | 75%          |
| Critical paths  | 100%  | 100%    | 100%         |

List gaps with file paths and uncovered lines/branches.

## Output Format

```
FORGE Test Report
=================
Scope: [spec/story/files]
Track: [Hotfix/Quick/Feature/Epic/Product]
Date: YYYY-MM-DD

Test Strategy:
  Test depth: [unit / unit+integration / unit+integration+e2e]
  Framework: [vitest/jest/pytest/etc.]

Tests Generated: N
  Unit: N
  Integration: N
  E2E: N

Coverage:
  Lines: XX% (target: XX%)
  Branches: XX% (target: XX%)
  Critical paths: XX% (target: 100%)

Gaps:
  - src/services/payment.ts:42-58 (uncovered error handling)
  - src/api/users.ts:validateInput (0% branch coverage)

Requirements Traceability:
  FR-001: ✓ covered (3 tests)
  FR-002: ✓ covered (2 tests)
  FR-003: ✗ NOT covered
  NFR-001: ✓ covered (performance test)
```

## Constraints

- Do NOT modify source code. Test code only.
- ALWAYS run tests after generating to verify pass.
- If target coverage unachievable: explain and list specific remaining gaps.
