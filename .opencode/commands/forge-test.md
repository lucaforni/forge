---
description: "Generate tests, analyze coverage, and validate test quality for a spec or story"
agent: forge-qa
subtask: true
---

# Test Generation & Coverage Analysis

You are handling `/forge-test` to generate tests, analyze coverage, and ensure
testing depth matches the workflow track.

## Arguments

Optional scope: $ARGUMENTS

- If a spec ID is provided (e.g., `001`), generate tests for that spec's
  implementation at `.forge/specs/NNN-slug/`.
- If a story ID is provided, generate tests for that story's scope.
- If a file path or glob pattern is provided, generate/analyze tests for
  those specific files.
- If `--coverage` is provided, run the test suite with coverage and report
  gaps.
- If `--strategy` is provided, output the test strategy without generating
  tests.
- If no argument, detect the current spec/story context and generate tests.

## Context Loading

1. Load the `context-chain` skill.
2. Read the relevant spec: `.forge/specs/NNN-slug/spec.md` (for requirements
   IDs: FR-NNN, NFR-NNN, acceptance criteria).
3. Read the plan: `.forge/specs/NNN-slug/plan.md` (for file map, API contracts,
   data model).
4. Read `.forge/constitution.md` and load `constitution-compliance` skill to
   check Article 8 (Testing Standards).
5. Read existing test files to understand project conventions.

## Workflow

### 1. Determine Test Strategy

1. Load the `test-strategy` skill.
2. Identify the current workflow track (Hotfix, Quick, Feature, Epic, Product).
3. Determine the appropriate test depth:

| Track        | Required Tests                        |
| ------------ | ------------------------------------- |
| Hotfix       | 1 regression test for the fix         |
| Quick        | Unit tests for changed logic          |
| Feature      | Unit + integration tests              |
| Epic/Product | Unit + integration + E2E for critical |

### 2. Map Requirements to Test Cases

For each functional requirement (FR-NNN) and acceptance criterion:
1. Identify the source file(s) that implement it.
2. Design test cases covering:
   - Happy path (expected behavior).
   - Error paths (invalid input, missing data, permission denied).
   - Edge cases (empty collections, boundary values, null/undefined).
3. For each NFR with a metric (e.g., "response time < 200ms"), note whether
   it needs a performance test.

### 3. Generate Tests

1. Identify the test framework from `package.json` / `pyproject.toml` /
   existing test files.
2. Follow existing test file naming and directory conventions.
3. Write tests using Arrange-Act-Assert (AAA) pattern.
4. Name tests descriptively: `should [behavior] when [condition]`.
5. Include traceability comments linking tests to requirements:
   ```
   // Covers: FR-001 - User can register with email and password
   ```

### 4. Run and Validate

1. Run the generated tests to verify they pass.
2. If any tests fail, diagnose whether it is a test bug or a code bug:
   - **Test bug**: Fix the test.
   - **Code bug**: Report it clearly — do NOT modify source code.
3. Run coverage analysis if applicable.

### 5. Coverage Report

Report coverage against track-specific targets:

| Metric          | Quick | Feature | Epic/Product |
| --------------- | ----- | ------- | ------------ |
| Line coverage   | 70%   | 80%     | 85%          |
| Branch coverage | 50%   | 65%     | 75%          |
| Critical paths  | 100%  | 100%    | 100%         |

List any gaps explicitly with file paths and uncovered lines/branches.

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

- Do NOT modify source code. You write and modify TEST code only.
- ALWAYS run tests after generating them to verify they pass.
- If you cannot achieve the target coverage, explain why and list the
  specific gaps that remain.
