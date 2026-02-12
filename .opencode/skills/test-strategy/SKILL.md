---
name: test-strategy
description: Adaptive testing guidance based on FORGE workflow track with framework-specific recommendations and coverage targets
license: MIT
compatibility: opencode
metadata:
  audience: forge-qa build
  workflow: forge
---

## Purpose

You are now applying the FORGE adaptive testing strategy. Test depth and
requirements scale with the workflow track. Use this skill to determine
what tests to write and how thorough they should be.

## Track-Specific Test Requirements

### Hotfix Track

**Scope**: Regression test for the specific bug only.

- Write 1 test that reproduces the bug (should fail without fix, pass with).
- Run existing test suite to verify no regressions.
- Do NOT add comprehensive test coverage for the fix area.
- Time budget for tests: < 15 minutes.

### Quick Track

**Scope**: Unit tests for new and changed code.

- Unit tests for all new functions/methods.
- Update existing tests if behavior changed.
- Coverage target: 70% of new/changed lines.
- Test happy path + 1-2 most important error cases.
- Time budget for tests: < 1 hour.

### Feature Track

**Scope**: Unit tests + integration tests.

- Unit tests for all new functions/methods (same as Quick).
- Integration tests for API endpoints / service interactions.
- Test all error paths defined in the spec.
- Test all acceptance criteria from user stories.
- Coverage target: 80% of new/changed lines.
- Time budget for tests: proportional to implementation.

### Epic / Product Track

**Scope**: Unit + integration + E2E + performance benchmarks.

- Everything from Feature track, plus:
- End-to-end tests for critical user journeys.
- Performance benchmarks for NFR targets.
- Load test specifications (if applicable).
- Security-specific test cases (auth bypass, injection).
- Coverage target: 85% of new/changed lines.

## Framework-Specific Guidance

### TypeScript / JavaScript (Vitest or Jest)

```typescript
// Naming convention: describe blocks mirror module structure
describe("UserService", () => {
  describe("createUser", () => {
    it("should create a user with valid input", async () => {
      // Arrange - set up test data and mocks
      // Act - call the function
      // Assert - verify the result
    });

    it("should throw ValidationError for duplicate email", async () => {
      // Test error paths explicitly
    });
  });
});
```

**Mocking strategy**:
- Mock external services (HTTP, database, file system).
- Do NOT mock the module under test.
- Use dependency injection for testability.
- Prefer `vi.spyOn()` / `jest.spyOn()` over full mocks when possible.
- Reset mocks between tests (`beforeEach` / `afterEach`).

**File naming**: `*.test.ts` or `*.spec.ts` next to the source file or in
`__tests__/` directory (follow project convention from AGENTS.md).

### Python (pytest)

```python
# Naming convention: test_ prefix for files and functions
class TestUserService:
    def test_create_user_with_valid_input(self, db_session):
        """Should create a user with valid input."""
        # Arrange
        # Act
        # Assert

    def test_create_user_duplicate_email_raises(self, db_session):
        """Should raise ValueError for duplicate email."""
        with pytest.raises(ValueError, match="duplicate"):
            # Act
```

**Mocking strategy**:
- Use `pytest-mock` (`mocker` fixture) for mocking.
- Use `conftest.py` for shared fixtures.
- Prefer `monkeypatch` for environment and attribute mocking.

**File naming**: `test_*.py` in `tests/` directory mirroring `src/` structure.

## Test Naming Conventions

Follow this pattern for test names:
- **Format**: `should [expected behavior] when [condition]`
- **Examples**:
  - `should return 401 when token is expired`
  - `should create user when input is valid`
  - `should throw ValidationError when email is empty`

## Coverage Guidance

| Metric         | Hotfix | Quick | Feature | Epic/Product |
| -------------- | ------ | ----- | ------- | ------------ |
| Line coverage  | N/A    | 70%   | 80%     | 85%          |
| Branch coverage| N/A    | 50%   | 65%     | 75%          |
| Critical paths | 100%   | 100%  | 100%    | 100%         |

**Critical paths** (always 100% coverage):
- Authentication and authorization checks
- Payment and financial operations
- Data validation and sanitization
- Error handling in external service calls

## What NOT to Test

- Framework internals (Express routing, ORM query building)
- Third-party library behavior
- Simple getter/setter methods with no logic
- Configuration constants
- Type definitions

## Test Organization

```
tests/
  unit/                  # Pure function tests, no I/O
    services/
    utils/
  integration/           # Tests with real or mock I/O
    api/
    database/
  e2e/                   # Full user journey tests
  fixtures/              # Shared test data
  helpers/               # Test utilities
```
