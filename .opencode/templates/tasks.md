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

---

## Phase 1: [Phase Name]

<!-- Group related tasks into phases. Tasks within a phase should be
     somewhat independent. Mark parallelizable tasks with [P]. -->

- [ ] 1.1 [FR-001] [Description of task]
- [ ] 1.2 [FR-001] [P] [Description of task]
- [ ] 1.3 [FR-002] [P] [Description of task]

## Phase 2: [Phase Name]

- [ ] 2.1 [FR-003] [Description of task]
- [ ] 2.2 [FR-003] [Description of task]
- [ ] 2.3 [FR-004] [P] [Description of task]
- [ ] 2.4 [NFR-001] [P] [Description of task]

## Phase 3: [Phase Name]

- [ ] 3.1 [FR-005] [Description of task]
- [ ] 3.2 [FR-006] [Description of task]

## Phase 4: Testing & Integration

- [ ] 4.1 [NFR-002] Write unit tests for [component]
- [ ] 4.2 [NFR-002] Write integration tests for [flow]
- [ ] 4.3 Run `/forge-review` for adversarial review

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
