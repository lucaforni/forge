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

Apply the FORGE adaptive testing strategy. Test depth scales with the workflow
track. Use this skill to decide what tests to write and how thorough they should be.

## Track Requirements

| Track | Scope | Coverage | Time budget |
| ----- | ----- | -------- | ----------- |
| Hotfix | 1 regression test (fails without fix, passes with) + full suite green | N/A | < 15 min |
| Quick | Unit tests for new/changed code, happy path + 1-2 errors | 70% new lines | < 1 hour |
| Feature | Quick + integration tests (APIs, services), all spec error paths + acceptance criteria | 80% new lines | proportional |
| Epic/Product | Feature + E2E for critical journeys, NFR perf benchmarks, load specs, security tests (auth bypass, injection) | 85% new lines | — |

**Hotfix**: do NOT add comprehensive coverage for the fix area.

## Framework Guidance

### TypeScript (Vitest/Jest)

```typescript
describe("UserService", () => {
  describe("createUser", () => {
    it("should create a user with valid input", async () => {
      // Arrange / Act / Assert
    });
    it("should throw ValidationError for duplicate email", async () => {});
  });
});
```

**Mocking**:
- Mock external services (HTTP, DB, FS). Never mock the module under test.
- Use dependency injection.
- Prefer `vi.spyOn()` / `jest.spyOn()` over full mocks.
- Reset mocks in `beforeEach` / `afterEach`.

**Files**: `*.test.ts` or `*.spec.ts` next to source or in `__tests__/` (follow AGENTS.md).

### Python (pytest)

```python
class TestUserService:
    def test_create_user_with_valid_input(self, db_session):
        # Arrange / Act / Assert

    def test_create_user_duplicate_email_raises(self, db_session):
        with pytest.raises(ValueError, match="duplicate"):
            ...
```

**Mocking**: `pytest-mock` (`mocker` fixture); `conftest.py` for shared fixtures; `monkeypatch` for env/attrs.

**Files**: `test_*.py` in `tests/` mirroring `src/`.

## Test Naming

Format: `should [expected behavior] when [condition]`

Examples: `should return 401 when token is expired`, `should create user when input is valid`.

## Coverage Matrix

| Metric          | Hotfix | Quick | Feature | Epic/Product |
| --------------- | ------ | ----- | ------- | ------------ |
| Line coverage   | N/A    | 70%   | 80%     | 85%          |
| Branch coverage | N/A    | 50%   | 65%     | 75%          |
| Critical paths  | 100%   | 100%  | 100%    | 100%         |

**Critical paths** (always 100%): authn/authz, payment/financial ops, validation/sanitization, error handling in external calls.

## Do NOT Test

- Framework internals (routing, ORM query building)
- Third-party library behavior
- Trivial getters/setters with no logic
- Configuration constants and type definitions

## Test Organization

```
tests/
  unit/          # Pure functions, no I/O
  integration/   # Real or mock I/O (api/, database/)
  e2e/           # Full user journeys
  fixtures/      # Shared test data
  helpers/       # Test utilities
```
