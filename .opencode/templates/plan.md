# Plan: [NNN] - [Feature Name]

> Technical implementation plan for Feature/Epic track. Created by `forge-architect` via `/forge-plan`.

| Field | Value |
| --- | --- |
| Status | Draft |
| Author | forge-architect |
| Date | YYYY-MM-DD |
| Track | Feature |
| Spec | <!-- Link --> |

---

## 1. Overview

<!-- What this plan covers and the approach -->

## 2. Data Model

### 2.1 New Tables

#### [table_name]

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
|  |  |  |  |

### 2.2 Modified Tables

#### [table_name]

| Column | Change | Before | After |
| --- | --- | --- | --- |
|  |  |  |  |

### 2.3 Indexes

| Table | Index Name | Columns | Type |
| --- | --- | --- | --- |
|  |  |  |  |

### 2.4 Migrations

<!-- Ordered list -->
1.
2.

## 3. API Endpoints

### 3.1 [METHOD] [/path]

- **Description**:
- **Auth**: Required / Public
- **Rate Limit**:
- **Request**:
  ```json
  {}
  ```
- **Response (200)**:
  ```json
  {}
  ```
- **Errors**:
  | Status | Code | When |
  | --- | --- | --- |
  | 400 |  |  |
  | 401 |  |  |
  | 404 |  |  |

<!-- Repeat per endpoint -->

## 4. Component Design

### 4.1 [Component/Class]

- **Purpose**:
- **Location**: `src/...`
- **Responsibilities**: -
- **Dependencies**: -
- **Key Methods**:

  | Method | Parameters | Returns | Description |
  | --- | --- | --- | --- |
  |  |  |  |  |

<!-- Repeat per component -->

## 5. File Map

> All paths relative to working directory (project root or `dev/` for FORGE meta-dev).

### Files to Create

| Path | Purpose | Size |
| --- | --- | --- |
| `path/to/new/file.ext` | [Purpose] | [S/M/L] |

### Files to Modify

| Path | Section/Lines | Change | Effort |
| --- | --- | --- | --- |
| `path/to/existing/file.ext` | Lines XXX-YYY / Section N.N | [What and why] | [S/M/L] |

### Files to Delete (if any)

| Path | Reason | Migration Notes |
| --- | --- | --- |
| `path/to/deprecated.ext` | [Why] | [How to migrate] |

### Files to Reference (Read-only)

| Path | Purpose |
| --- | --- |
| `.forge/constitution.md` | Validate architectural decisions |

## 6. Dependencies

### 6.1 New

| Package | Version | Purpose |
| --- | --- | --- |
|  |  |  |

### 6.2 Internal

<!-- Existing modules depended on -->
-

## 7. Implementation Phases

> Phases define order. Each lists specific files with explicit paths.

### Phase 1: [Name]

**Objective**: [What this phase accomplishes]

**Create**:
- `path/to/file1.ext` — purpose · deps: [None / Phase X] · effort: [estimate]

**Modify**:
- `path/to/existing.ext` — Section N.N / Lines XXX-YYY · change · effort

**Tasks**:
1. [ ] [Task with file reference]
2. [ ] [Task]

### Phase 2: [Name]

**Objective**: [...]

**Create**:
- `path/to/file2.ext` — purpose · deps: Phase 1 · effort

**Modify**:
- `path/to/existing2.ext` — section · change · effort

**Tasks**:
1. [ ]
2. [ ]

<!-- Add phases as needed -->

## 8. Testing Strategy

### 8.1 Unit Tests

| Component | Test Focus |
| --- | --- |
|  |  |

### 8.2 Integration Tests

| Scenario | Dependencies |
| --- | --- |
|  |  |

## 9. Architectural Decisions

| ADR | Decision | Status |
| --- | --- | --- |
|  |  |  |

## 10. Requirement Traceability

| Requirement | Plan Section | Implementation Path |
| --- | --- | --- |
| FR-001 |  |  |
| FR-002 |  |  |
| NFR-001 |  |  |

## 11. Constitution Compliance

| Article | Status | Notes |
| --- | --- | --- |
| Art. 1 |  |  |
| Art. 2 |  |  |
| Art. 3 |  |  |
| Art. 4 |  |  |
| Art. 5 |  |  |
| Art. 6 |  |  |
| Art. 7 |  |  |
| Art. 8 |  |  |
| Art. 9 |  |  |

---

## Cross-References

| Document | Path |
| --- | --- |
| Spec | `.forge/specs/NNN-slug/spec.md` |
| Architecture | `.forge/architecture/architecture.md` |
| Tasks | <!-- Created by /forge-tasks --> |
| Constitution | `.forge/constitution.md` |
| ADRs | `.forge/knowledge/adr/` |
