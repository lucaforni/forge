# Project Constitution

> This document defines the non-negotiable principles, standards, and
> constraints for this project. All agents, all code, and all decisions
> must comply with these articles.
>
> **This document is immutable.** Changes are made only through the formal
> amendment process documented at the bottom.

---

## Article 1: Core Principles

<!-- CUSTOMIZE: Define your project's non-negotiable principles -->

### 1.1 Mission
<!-- What is this project's primary purpose? -->

### 1.2 Non-Negotiable Principles
<!-- List principles that must never be violated -->
<!-- Examples:
- Security first: no feature ships without security review
- API-first design: all functionality exposed through versioned APIs
- Accessibility as a feature: WCAG 2.1 AA compliance required
- Zero-downtime deployments: all changes must be backward compatible
-->

### 1.3 User Experience Standards
<!-- Minimum UX quality bar -->
<!-- Examples:
- All user-facing errors must have actionable messages
- Page load time < 2 seconds on 3G connections
- All forms must have client-side validation
-->

---

## Article 2: Technology Stack

<!-- CUSTOMIZE: Define approved technologies -->

### 2.1 Approved Stack

| Layer           | Technology   | Version   | Rationale               |
| --------------- | ------------ | --------- | ----------------------- |
| Runtime         |              |           |                         |
| Language        |              |           |                         |
| Framework       |              |           |                         |
| Database        |              |           |                         |
| ORM             |              |           |                         |
| Cache           |              |           |                         |
| Queue           |              |           |                         |
| Testing         |              |           |                         |
| CI/CD           |              |           |                         |

### 2.2 Dependency Policy
<!-- Rules for adding new dependencies -->
<!-- Examples:
- New npm packages must have >1000 weekly downloads
- No packages with known critical vulnerabilities
- Prefer packages with TypeScript type definitions
- Maximum 3 direct dependencies per feature module
-->

### 2.3 Technology Changes
Any change to the approved stack requires:
1. An ADR documenting the decision (via `/forge-adr`)
2. A constitutional amendment (see Amendments Log below)
3. Approval from the tech lead

---

## Article 3: Architecture Patterns

<!-- CUSTOMIZE: Define your architecture standards -->

### 3.1 System Architecture
<!-- High-level architecture pattern -->
<!-- Examples: Monolith, Microservices, Modular Monolith, Serverless -->

### 3.2 Code Organization
<!-- How code should be structured -->
<!-- Examples:
- Feature-based module organization
- Layered architecture (controller -> service -> repository)
- Domain-driven design bounded contexts
-->

### 3.3 Data Patterns
<!-- Data access and management patterns -->
<!-- Examples:
- Repository pattern for all database access
- No direct database queries in controllers or handlers
- All queries must be parameterized (no string concatenation)
-->

### 3.4 API Standards
<!-- API design standards -->
<!-- Examples:
- RESTful endpoints with consistent naming
- All endpoints versioned (v1, v2)
- Pagination required for all list endpoints (max 100 items)
- Standard error response format: { error: { code, message, details } }
-->

---

## Article 4: Quality Standards

<!-- CUSTOMIZE: Define quality thresholds -->

### 4.1 Test Coverage
<!-- Minimum test coverage requirements -->
<!-- Examples:
- Minimum 70% line coverage for all new code
- Minimum 80% branch coverage for security-critical code
- 100% coverage on error handling paths
-->

### 4.2 Code Review
- All code must pass adversarial AI review before human review
- All HIGH severity findings must be resolved before merge
- All MEDIUM severity findings must have documented justification if not fixed

### 4.3 Performance Targets
<!-- Define performance SLAs -->
<!-- Examples:
- P95 response time < 200ms for API endpoints
- P99 response time < 500ms for API endpoints
- Database queries < 50ms (P95)
-->

### 4.4 Technical Debt
<!-- How to manage technical debt -->
<!-- Examples:
- No TODO comments without a linked issue/spec
- Technical debt items tracked in .forge/knowledge/decision-log.md
- Debt reduction allocated 20% of each sprint
-->

---

## Article 5: Security

<!-- CUSTOMIZE: Define security requirements -->

### 5.1 Authentication & Authorization
<!-- Auth requirements -->
<!-- Examples:
- All endpoints require authentication unless explicitly public
- Role-based access control (RBAC) for all protected resources
- Session tokens expire after 24 hours of inactivity
- Multi-factor authentication for admin operations
-->

### 5.2 Data Protection
<!-- Data security requirements -->
<!-- Examples:
- All sensitive data encrypted at rest (AES-256)
- All data in transit over TLS 1.2+
- PII must never appear in logs or error messages
- Secrets must never be committed to source control
-->

### 5.3 Input Validation
<!-- Input handling requirements -->
<!-- Examples:
- All external input must be validated and sanitized
- SQL injection prevention via parameterized queries
- XSS prevention via output encoding
- CSRF protection on all state-changing endpoints
-->

### 5.4 Dependency Security
<!-- Supply chain security -->
<!-- Examples:
- Automated vulnerability scanning in CI pipeline
- Critical vulnerabilities must be patched within 48 hours
- High vulnerabilities must be patched within 1 week
-->

---

## Article 6: Error Handling

<!-- CUSTOMIZE: Define error handling standards -->

### 6.1 Error Classification
<!-- How errors are categorized -->
<!-- Examples:
- Operational errors (expected): handle gracefully, return user-friendly messages
- Programmer errors (unexpected): log with full context, return generic 500
- Validation errors: return 400 with specific field errors
-->

### 6.2 Error Response Format
<!-- Standardized error responses -->
<!-- Examples:
- All API errors follow: { error: { code: string, message: string, details?: object } }
- No stack traces in production responses
- Error codes must be documented and stable
-->

### 6.3 Logging Standards
<!-- What to log and how -->
<!-- Examples:
- Structured JSON logging in production
- Required fields: timestamp, level, message, requestId, userId
- Log levels: error (alerts), warn (investigation), info (audit), debug (development)
- Never log: passwords, tokens, PII, credit card numbers
-->

---

## Article 7: Naming & Conventions

<!-- CUSTOMIZE: Define naming conventions -->

### 7.1 Code Naming
<!-- Covered in AGENTS.md, reference it here or duplicate key rules -->
See `AGENTS.md` for detailed naming conventions. Key rules:
- Files: kebab-case
- Classes: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

### 7.2 Database Naming
<!-- Database object naming -->
<!-- Examples:
- Tables: snake_case, plural (users, order_items)
- Columns: snake_case (created_at, user_id)
- Indexes: idx_<table>_<column(s)>
- Foreign keys: fk_<table>_<referenced_table>
-->

### 7.3 API Naming
<!-- API endpoint naming -->
<!-- Examples:
- RESTful resource naming: /api/v1/users, /api/v1/users/:id/orders
- Consistent pluralization
- No verbs in URLs (use HTTP methods instead)
-->

---

## Article 8: Testing Standards

<!-- CUSTOMIZE: Define testing requirements -->

### 8.1 Required Test Types
<!-- What must be tested -->
<!-- Examples:
- Unit tests: all business logic and utility functions
- Integration tests: all API endpoints and database operations
- Contract tests: all external service integrations
- E2E tests: critical user flows (login, checkout, etc.)
-->

### 8.2 Test Quality
<!-- Test quality requirements -->
<!-- Examples:
- Tests must be deterministic (no flaky tests)
- Tests must be independent (no shared state between tests)
- Tests must be fast (unit < 100ms, integration < 1s)
- Test names must describe the expected behavior
-->

### 8.3 Test Data
<!-- Test data management -->
<!-- Examples:
- Use factories/fixtures for test data
- No hardcoded IDs or timestamps
- Database tests must clean up after themselves
- Never use production data in tests
-->

---

## Article 9: Operational Requirements

<!-- CUSTOMIZE: Define operational standards -->
<!-- NOTE: Remove this article if the project is a library with no runtime -->

### 9.1 Deployment
<!-- Deployment requirements -->
<!-- Examples:
- All deployments must be automated (no manual steps)
- Zero-downtime deployment required
- Rollback must be possible within 5 minutes
- Feature flags for all user-facing changes
-->

### 9.2 Monitoring
<!-- Monitoring requirements -->
<!-- Examples:
- Health check endpoint at /health
- Structured logging to centralized log platform
- Error rate alerting (> 1% triggers alert)
- Latency alerting (P95 > 500ms triggers alert)
-->

### 9.3 Incident Response
<!-- Incident handling -->
<!-- Examples:
- On-call rotation documented in runbook
- Incident severity levels defined (P1-P4)
- Post-incident review required for P1 and P2
- Runbooks maintained for all critical services
-->

---

## Amendments Log

> All changes to this constitution must be recorded here. Do not edit
> articles directly. Add an amendment entry, then update the article text.

| Date | Article | Change | Rationale | ADR Ref |
| ---- | ------- | ------ | --------- | ------- |
<!-- Amendments will be recorded here by the FORGE methodology -->
