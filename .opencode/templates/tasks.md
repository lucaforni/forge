# Tasks: [NNN] - [Feature Name]

> Ordered task breakdown with parallelism markers and requirement traceability.
> Created by `forge-scrum` via `/forge-tasks`.

| Field   | Value       |
| ------- | ----------- |
| Status  | Pending     |
| Author  | forge-scrum |
| Date    | YYYY-MM-DD  |
| Spec    | <!-- Link --> |
| Plan    | <!-- Link --> |

---

## Legend

- `[FR-NNN]` — Requirement implemented (traceability)
- `[P]` — Parallelizable with other `[P]` tasks in the same phase
- Status: `[ ]` pending · `[x]` done · `[-]` skipped
- **File**: Explicit path relative to working directory

Each task specifies: requirement ref `[FR-NNN]`, optional `[P]`, file path,
type (Create/Modify), description, spec reference, dependencies, estimate.

---

## Phase 1: [Phase Name]

- [ ] **1.1** `[FR-001]` Create [component name]
  - **File**: `path/to/new/file.ext`
  - **Type**: Create new file
  - **Description**: [What this file does and its purpose]
  - **Spec Reference**: [Section in spec]
  - **Dependencies**: None
  - **Estimated**: [Time]

- [ ] **1.2** `[FR-001]` `[P]` Update [component name]
  - **File**: `path/to/existing/file.ext`
  - **Type**: Modify existing
  - **Location**: Section X.Y or Lines XXX-YYY
  - **Description**: [What changes and why]
  - **Spec Reference**: [Section]
  - **Dependencies**: Task 1.1
  - **Estimated**: [Time]

<!-- Add more tasks following the same structure. -->

## Phase 2: [Phase Name]

- [ ] **2.1** `[FR-003]` Implement [component]
  - **File**: `path/to/file.ext`
  - **Type**: Create new file
  - **Description**: [What this implements]
  - **Spec Reference**: [Section]
  - **Dependencies**: Phase 1 completion
  - **Estimated**: [Time]

## Phase 3: [Phase Name]

- [ ] **3.1** `[NFR-001]` Add tests for [component]
  - **File**: `path/to/test.ext`
  - **Type**: Create new file
  - **Description**: [What to test]
  - **Spec Reference**: [Section]
  - **Dependencies**: Task 2.1
  - **Estimated**: [Time]

## Phase 4: Testing & Review

- [ ] **4.1** `[NFR-002]` Run test suite
  - **Command**: `npm test` or equivalent
  - **Expected**: All tests pass
  - **Dependencies**: All previous phases

- [ ] **4.2** `[ALL]` Run `/forge-review` for adversarial review
  - **Command**: `/forge-review .forge/specs/NNN-slug/`
  - **Expected**: Address all HIGH severity findings
  - **Dependencies**: All implementation complete

- [ ] **4.3** Update documentation
  - **File**: `docs/relevant-doc.md`
  - **Type**: Modify existing
  - **Description**: Document new feature/changes
  - **Dependencies**: All implementation complete

---

## Summary

| Metric               | Value |
| -------------------- | ----- |
| Total tasks          |       |
| Total phases         |       |
| Parallelizable tasks |       |
| Requirements covered |       |

---

## Cross-References

| Document | Path                            |
| -------- | ------------------------------- |
| Spec     | `.forge/specs/NNN-slug/spec.md` |
| Plan     | `.forge/specs/NNN-slug/plan.md` |
