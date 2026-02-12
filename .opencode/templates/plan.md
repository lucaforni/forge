# Plan: [NNN] - [Feature Name]

> Technical implementation plan for the Feature or Epic track.
> Created by the `forge-architect` agent via `/forge-plan`.

| Field   | Value             |
| ------- | ----------------- |
| Status  | Draft             |
| Author  | forge-architect   |
| Date    | YYYY-MM-DD        |
| Track   | Feature           |
| Spec    | <!-- Link to spec --> |

---

## 1. Overview

<!-- Brief summary of what this plan covers and the approach -->

## 2. Data Model

### 2.1 New Tables

#### [table_name]

| Column           | Type          | Constraints              | Notes         |
| ---------------- | ------------- | ------------------------ | ------------- |
|                  |               |                          |               |

### 2.2 Modified Tables

#### [table_name]

| Column           | Change        | Before         | After          |
| ---------------- | ------------- | -------------- | -------------- |
|                  |               |                |                |

### 2.3 Indexes

| Table            | Index Name                 | Columns              | Type    |
| ---------------- | -------------------------- | -------------------- | ------- |
|                  |                            |                      |         |

### 2.4 Migrations

<!-- Ordered list of migration steps -->

1. 
2. 

## 3. API Endpoints

### 3.1 [METHOD] [/path]

- **Description**: 
- **Auth**: <!-- Required / Public -->
- **Rate Limit**: <!-- If applicable -->
- **Request**:
  ```json
  {
  }
  ```
- **Response (200)**:
  ```json
  {
  }
  ```
- **Error Responses**:
  | Status | Code              | When                            |
  | ------ | ----------------- | ------------------------------- |
  | 400    |                   |                                 |
  | 401    |                   |                                 |
  | 404    |                   |                                 |

<!-- Repeat for each endpoint -->

## 4. Component Design

### 4.1 [Component/Class Name]

- **Purpose**: 
- **Location**: `src/...`
- **Responsibilities**:
  - 
- **Dependencies**:
  - 
- **Key Methods**:
  | Method               | Parameters           | Returns        | Description    |
  | -------------------- | -------------------- | -------------- | -------------- |
  |                      |                      |                |                |

<!-- Repeat for each component -->

## 5. File Map

| Path                                    | Action   | Purpose                        |
| --------------------------------------- | -------- | ------------------------------ |
| `src/...`                               | Create   |                                |
| `src/...`                               | Modify   |                                |
| `test/...`                              | Create   |                                |

## 6. Dependencies

### 6.1 New Dependencies

| Package              | Version  | Purpose                        |
| -------------------- | -------- | ------------------------------ |
|                      |          |                                |

### 6.2 Internal Dependencies

<!-- Which existing modules does this feature depend on? -->

- 

## 7. Testing Strategy

### 7.1 Unit Tests

| Component            | Test Focus                           |
| -------------------- | ------------------------------------ |
|                      |                                      |

### 7.2 Integration Tests

| Scenario             | Dependencies                         |
| -------------------- | ------------------------------------ |
|                      |                                      |

## 8. Architectural Decisions

| ADR     | Decision                             | Status    |
| ------- | ------------------------------------ | --------- |
|         |                                      |           |

## 9. Requirement Traceability

| Requirement | Plan Section           | Implementation Path          |
| ----------- | ---------------------- | ---------------------------- |
| FR-001      |                        |                              |
| FR-002      |                        |                              |
| NFR-001     |                        |                              |

## 10. Constitution Compliance

| Article | Status | Notes                                     |
| ------- | ------ | ----------------------------------------- |
| Art. 1  |        |                                           |
| Art. 2  |        |                                           |
| Art. 3  |        |                                           |
| Art. 4  |        |                                           |
| Art. 5  |        |                                           |
| Art. 6  |        |                                           |
| Art. 7  |        |                                           |
| Art. 8  |        |                                           |
| Art. 9  |        |                                           |

---

## Cross-References

| Document             | Path                                           |
| -------------------- | ---------------------------------------------- |
| Spec                 | `.forge/specs/NNN-slug/spec.md`                |
| Architecture         | `.forge/architecture/architecture.md`          |
| Tasks                | <!-- Created by /forge-tasks -->               |
| Constitution         | `.forge/constitution.md`                       |
| ADRs                 | `.forge/knowledge/adr/`                        |
