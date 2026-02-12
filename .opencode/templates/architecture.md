# Architecture: [Project/Product Name]

> System architecture document for Epic or Product track projects.
> Created by the `forge-architect` agent via `/forge-architecture`.

| Field   | Value             |
| ------- | ----------------- |
| Status  | Draft             |
| Author  | forge-architect   |
| Date    | YYYY-MM-DD        |
| Track   | <!-- Epic or Product --> |

---

## 1. System Context

<!-- What is the system? What interacts with it? (users, external services, other systems) -->

### 1.1 Context Diagram

```
<!-- ASCII or textual system context diagram -->
<!-- Example:
  [User] --> [Web App] --> [API Server] --> [Database]
                                       --> [Payment Provider]
                                       --> [Email Service]
-->
```

### 1.2 External Dependencies

| System/Service       | Purpose               | Protocol      | SLA           |
| -------------------- | --------------------- | ------------- | ------------- |
|                      |                       |               |               |

## 2. Component Breakdown

### 2.1 Component Diagram

```
<!-- ASCII or textual component diagram -->
<!-- Example:
  [API Layer]
    +-- [Auth Module]
    +-- [Payment Module]
    +-- [User Module]
  [Service Layer]
    +-- [Auth Service]
    +-- [Payment Service]
    +-- [Notification Service]
  [Data Layer]
    +-- [User Repository]
    +-- [Payment Repository]
-->
```

### 2.2 Module Responsibilities

| Module               | Responsibility                        | Key Interfaces          |
| -------------------- | ------------------------------------- | ----------------------- |
|                      |                                       |                         |

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
<!-- ASCII or textual ERD -->
<!-- Example:
  users (1) --< (N) orders (1) --< (N) order_items
  orders (N) >-- (1) payment_methods
-->
```

### 3.2 Entity Definitions

#### [Entity Name]

| Column           | Type          | Constraints              | Notes         |
| ---------------- | ------------- | ------------------------ | ------------- |
|                  |               |                          |               |

<!-- Repeat for each entity -->

## 4. API Surface

### 4.1 API Overview

| Module    | Endpoint Pattern                | Auth Required  |
| --------- | ------------------------------- | -------------- |
|           |                                 |                |

### 4.2 API Standards

<!-- Reference constitution Article 3.4 for API standards -->

## 5. Integration Patterns

### 5.1 [Integration Name]

- **Service**: 
- **Pattern**: <!-- Sync REST, Async webhooks, Event-driven, etc. -->
- **Error Handling**: 
- **Retry Strategy**: 

## 6. Security Architecture

### 6.1 Authentication Flow

<!-- Describe the auth flow -->

### 6.2 Authorization Model

<!-- RBAC, ABAC, or other access control model -->

### 6.3 Data Flow Security

<!-- Where encryption is applied, where PII flows -->

## 7. Cross-Cutting Concerns

### 7.1 Logging
<!-- Reference constitution Article 6.3 -->

### 7.2 Monitoring
<!-- Reference constitution Article 9.2 -->

### 7.3 Error Handling
<!-- Reference constitution Article 6 -->

### 7.4 Caching
<!-- Caching strategy if applicable -->

## 8. Deployment Architecture

<!-- How the system is deployed -->

### 8.1 Infrastructure

```
<!-- Deployment diagram -->
```

### 8.2 Scaling Strategy

<!-- Horizontal, vertical, auto-scaling rules -->

## 9. Architectural Decisions

| ADR     | Decision                             | Status    |
| ------- | ------------------------------------ | --------- |
|         |                                      |           |

<!-- Link to full ADRs in .forge/knowledge/adr/ -->

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

| Document             | Path                                |
| -------------------- | ----------------------------------- |
| Constitution         | `.forge/constitution.md`            |
| PRD                  | `.forge/product/prd.md`             |
| Product Brief        | `.forge/product/brief.md`           |
| ADRs                 | `.forge/knowledge/adr/`             |
| Specs                | `.forge/specs/`                     |
