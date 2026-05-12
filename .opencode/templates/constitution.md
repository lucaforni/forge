# Project Constitution

> Non-negotiable principles, standards, and constraints. All agents, code, and
> decisions must comply.
>
> **Immutable.** Changes go through the formal amendment process at the bottom.

---

## Article 1: Core Principles

<!-- CUSTOMIZE -->

### 1.1 Mission
<!-- Primary purpose of this project -->

### 1.2 Non-Negotiable Principles
<!-- Examples:
- Security first: no feature ships without security review
- API-first: all functionality exposed via versioned APIs
- Accessibility: WCAG 2.1 AA required
- Zero-downtime deployments; changes must be backward compatible
-->

### 1.3 User Experience Standards
<!-- Examples:
- All user-facing errors have actionable messages
- Page load < 2s on 3G
- All forms have client-side validation
-->

---

## Article 2: Technology Stack

### 2.1 Approved Stack

| Layer | Technology | Version | Rationale |
| --- | --- | --- | --- |
| Runtime |  |  |  |
| Language |  |  |  |
| Framework |  |  |  |
| Database |  |  |  |
| ORM |  |  |  |
| Cache |  |  |  |
| Queue |  |  |  |
| Testing |  |  |  |
| CI/CD |  |  |  |

### 2.2 Dependency Policy
<!-- Examples:
- npm packages must have >1000 weekly downloads
- No packages with known critical vulnerabilities
- Prefer packages with TypeScript types
- Max 3 direct dependencies per feature module
-->

### 2.3 Technology Changes

Any stack change requires:
1. ADR via `/forge-adr`
2. Constitutional amendment (see Amendments Log)
3. Tech lead approval

---

## Article 3: Architecture Patterns

### 3.1 System Architecture
<!-- Monolith, Microservices, Modular Monolith, Serverless -->

### 3.2 Code Organization
<!-- Examples:
- Feature-based module organization
- Layered architecture (controller → service → repository)
- DDD bounded contexts
-->

### 3.3 Data Patterns
<!-- Examples:
- Repository pattern for all DB access
- No direct queries in controllers/handlers
- All queries parameterized (no string concatenation)
-->

### 3.4 API Standards
<!-- Examples:
- RESTful endpoints, consistent naming
- All endpoints versioned (v1, v2)
- Pagination required for list endpoints (max 100)
- Error format: { error: { code, message, details } }
-->

---

## Article 4: Quality Standards

### 4.1 Test Coverage
<!-- Examples:
- ≥70% line coverage for new code
- ≥80% branch coverage for security-critical code
- 100% coverage on error paths
-->

### 4.2 Code Review
- All code must pass adversarial AI review before human review
- All HIGH severity findings resolved before merge
- MEDIUM findings require documented justification if not fixed

### 4.3 Performance Targets
<!-- Examples:
- P95 API < 200ms · P99 < 500ms
- DB queries < 50ms (P95)
-->

### 4.4 Technical Debt
<!-- Examples:
- No TODO without a linked issue/spec
- Debt tracked in .forge/knowledge/decision-log.md
- 20% of each sprint for debt reduction
-->

---

## Article 5: Security

### 5.1 Authentication & Authorization
<!-- Examples:
- All endpoints require auth unless explicitly public
- RBAC for protected resources
- Session expiry: 24h inactivity
- MFA for admin operations
-->

### 5.2 Data Protection
<!-- Examples:
- Sensitive data encrypted at rest (AES-256)
- All transit over TLS 1.2+
- PII never in logs/errors
- Secrets never in source control
-->

### 5.3 Input Validation
<!-- Examples:
- All external input validated and sanitized
- SQL injection prevention via parameterized queries
- XSS prevention via output encoding
- CSRF protection on state-changing endpoints
-->

### 5.4 Dependency Security
<!-- Examples:
- Automated vulnerability scanning in CI
- Critical CVEs patched within 48h
- High CVEs patched within 1 week
-->

---

## Article 6: Error Handling

### 6.1 Error Classification
<!-- Examples:
- Operational (expected): handle gracefully, user-friendly messages
- Programmer (unexpected): log full context, return generic 500
- Validation: 400 with specific field errors
-->

### 6.2 Error Response Format
<!-- Examples:
- All API errors: { error: { code, message, details? } }
- No stack traces in production
- Error codes documented and stable
-->

### 6.3 Logging Standards
<!-- Examples:
- Structured JSON logging in production
- Required fields: timestamp, level, message, requestId, userId
- Levels: error (alerts), warn (investigation), info (audit), debug (dev)
- Never log: passwords, tokens, PII, credit cards
-->

---

## Article 7: Naming & Conventions

### 7.1 Code Naming

See `AGENTS.md` for full conventions. Key rules:
- Files: kebab-case
- Classes: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

### 7.2 Database Naming
<!-- Examples:
- Tables: snake_case, plural (users, order_items)
- Columns: snake_case (created_at, user_id)
- Indexes: idx_<table>_<column(s)>
- Foreign keys: fk_<table>_<referenced_table>
-->

### 7.3 API Naming
<!-- Examples:
- RESTful resources: /api/v1/users, /api/v1/users/:id/orders
- Consistent pluralization
- No verbs in URLs (use HTTP methods)
-->

---

## Article 8: Testing Standards

### 8.1 Required Test Types
<!-- Examples:
- Unit: all business logic and utilities
- Integration: all API endpoints and DB operations
- Contract: all external service integrations
- E2E: critical flows (login, checkout)
-->

### 8.2 Test Quality
<!-- Examples:
- Deterministic (no flaky tests)
- Independent (no shared state)
- Fast (unit < 100ms, integration < 1s)
- Names describe expected behavior
-->

### 8.3 Test Data
<!-- Examples:
- Use factories/fixtures
- No hardcoded IDs or timestamps
- DB tests clean up after themselves
- Never use production data
-->

---

## Article 9: Operational Requirements

<!-- Remove if project is a library with no runtime -->

### 9.1 Deployment
<!-- Examples:
- Automated deployments (no manual steps)
- Zero-downtime required
- Rollback possible within 5 min
- Feature flags for user-facing changes
-->

### 9.2 Monitoring
<!-- Examples:
- /health endpoint
- Structured logging to centralized platform
- Error rate alerting (>1%)
- Latency alerting (P95 > 500ms)
-->

### 9.3 Incident Response
<!-- Examples:
- On-call rotation in runbook
- Severity levels P1-P4
- Post-incident review for P1/P2
- Runbooks for all critical services
-->

---

## Amendments Log

> Record all changes here. Do not edit articles directly — add amendment, then update text.

| Date | Article | Change | Rationale | ADR Ref |
| --- | --- | --- | --- | --- |
<!-- Recorded by the FORGE methodology -->
