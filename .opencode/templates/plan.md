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

> **Note**: All paths are relative to the working directory (typically project root or `dev/` for FORGE meta-development).

### Files to Create

| Path | Purpose | Estimated Size |
|------|---------|----------------|
| `path/to/new/file.ext` | [Purpose of this file] | [S/M/L] |
| <!-- Add more files as needed --> | | |

### Files to Modify

| Path | Section/Lines | Change Description | Estimated Effort |
|------|---------------|---------------------|------------------|
| `path/to/existing/file.ext` | Lines XXX-YYY or Section N.N | [What needs to change and why] | [S/M/L] |
| <!-- Add more files as needed --> | | | |

### Files to Delete (if any)

| Path | Reason | Migration Notes |
|------|--------|-----------------|
| `path/to/deprecated/file.ext` | [Why removing] | [How to migrate users] |
| <!-- Add more files as needed --> | | |

### Files to Reference (Read-only)

| Path | Purpose |
|------|---------|
| `.forge/constitution.md` | Validate architectural decisions |
| <!-- Add more files as needed --> | |

## 6. Dependencies

### 6.1 New Dependencies

| Package              | Version  | Purpose                        |
| -------------------- | -------- | ------------------------------ |
|                      |          |                                |

### 6.2 Internal Dependencies

<!-- Which existing modules does this feature depend on? -->

- 

## 7. Implementation Phases

> **Note**: Phases define the order of implementation. Each phase lists specific files to create/modify with explicit paths.

### Phase 1: [Phase Name]

**Objective**: [What this phase accomplishes]

**Files to Create**:
- `path/to/file1.ext`
  - Purpose: [Brief description]
  - Dependencies: [None / Phase X completion]
  - Estimated effort: [Time estimate]

**Files to Modify**:
- `path/to/existing/file.ext`
  - Section/Lines: [Section N.N or Lines XXX-YYY]
  - Change: [What needs to change]
  - Estimated effort: [Time estimate]

**Tasks**:
1. [ ] [Specific task description with file reference]
2. [ ] [Specific task description with file reference]

### Phase 2: [Phase Name]

**Objective**: [What this phase accomplishes]

**Files to Create**:
- `path/to/file2.ext`
  - Purpose: [Brief description]
  - Dependencies: [Phase 1 completion]
  - Estimated effort: [Time estimate]

**Files to Modify**:
- `path/to/existing/file2.ext`
  - Section/Lines: [Section N.N or Lines XXX-YYY]
  - Change: [What needs to change]
  - Estimated effort: [Time estimate]

**Tasks**:
1. [ ] [Specific task description with file reference]
2. [ ] [Specific task description with file reference]

<!-- Add more phases as needed -->

## 8. Testing Strategy

### 8.1 Unit Tests

| Component            | Test Focus                           |
| -------------------- | ------------------------------------ |
|                      |                                      |

### 8.2 Integration Tests

| Scenario             | Dependencies                         |
| -------------------- | ------------------------------------ |
|                      |                                      |

## 9. Architectural Decisions

| ADR     | Decision                             | Status    |
| ------- | ------------------------------------ | --------- |
|         |                                      |           |

## 10. Requirement Traceability

| Requirement | Plan Section           | Implementation Path          |
| ----------- | ---------------------- | ---------------------------- |
| FR-001      |                        |                              |
| FR-002      |                        |                              |
| NFR-001     |                        |                              |

## 11. Constitution Compliance

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
