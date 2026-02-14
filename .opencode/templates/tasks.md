# Tasks: [NNN] - [Feature Name]

> Ordered task breakdown with parallelism markers and requirement traceability.
> Created by the `forge-scrum` agent via `/forge-tasks`.

| Field   | Value             |
| ------- | ----------------- |
| Status  | Pending           |
| Author  | forge-scrum       |
| Date    | YYYY-MM-DD        |
| Spec    | <!-- Link to spec --> |
| Plan    | <!-- Link to plan --> |

---

## Legend

- `[FR-NNN]` -- Requirement being implemented (traceability)
- `[P]` -- Parallelizable with other `[P]` tasks in the same phase
- Status: `[ ]` pending, `[x]` done, `[-]` skipped
- **Path**: Explicit file path relative to working directory

---

## Phase 1: [Phase Name]

<!-- Group related tasks into phases. Each task should specify:
     1. Requirement traceability [FR-NNN]
     2. Parallelizability [P] if applicable
     3. File path being created/modified
     4. Clear description of what to do
-->

- [ ] **1.1** `[FR-001]` Create [component name]
  - **File**: `path/to/new/file.ext`
  - **Type**: Create new file
  - **Description**: [What this file does and its purpose]
  - **Spec Reference**: [Section in spec that defines this]
  - **Dependencies**: None
  - **Estimated**: [Time estimate]

- [ ] **1.2** `[FR-001]` `[P]` Update [component name]
  - **File**: `path/to/existing/file.ext`
  - **Type**: Modify existing
  - **Location**: Section X.Y or Lines XXX-YYY
  - **Description**: [What needs to change and why]
  - **Spec Reference**: [Section in spec]
  - **Dependencies**: Task 1.1
  - **Estimated**: [Time estimate]

- [ ] **1.3** `[FR-002]` `[P]` Add [feature/function]
  - **File**: `path/to/file.ext`
  - **Type**: Modify existing
  - **Location**: [Specific location]
  - **Description**: [What to add]
  - **Spec Reference**: [Section in spec]
  - **Dependencies**: None
  - **Estimated**: [Time estimate]

## Phase 2: [Phase Name]

- [ ] **2.1** `[FR-003]` Implement [component]
  - **File**: `path/to/file.ext`
  - **Type**: Create new file
  - **Description**: [What this implements]
  - **Spec Reference**: [Section in spec]
  - **Dependencies**: Phase 1 completion
  - **Estimated**: [Time estimate]

- [ ] **2.2** `[FR-003]` Integrate [component] with [system]
  - **File**: `path/to/integration.ext`
  - **Type**: Modify existing
  - **Location**: [Specific location]
  - **Description**: [How to integrate]
  - **Spec Reference**: [Section in spec]
  - **Dependencies**: Task 2.1
  - **Estimated**: [Time estimate]

## Phase 3: [Phase Name]

- [ ] **3.1** `[NFR-001]` Add tests for [component]
  - **File**: `path/to/test.ext`
  - **Type**: Create new file
  - **Description**: [What to test]
  - **Spec Reference**: [Section in spec]
  - **Dependencies**: Task 2.2
  - **Estimated**: [Time estimate]

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

| Metric               | Value  |
| -------------------- | ------ |
| Total tasks          |        |
| Total phases         |        |
| Parallelizable tasks |        |
| Requirements covered |        |

---

## Cross-References

| Document             | Path                                           |
| -------------------- | ---------------------------------------------- |
| Spec                 | `.forge/specs/NNN-slug/spec.md`                |
| Plan                 | `.forge/specs/NNN-slug/plan.md`                |
