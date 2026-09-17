# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

Only supported releases (`2.x`) receive security fixes.
Earlier versions are EOL — please upgrade to the latest minor/patch.

## Reporting a Vulnerability

**Do NOT open public issues for vulnerabilities.**

Use GitHub's private reporting:

👉 https://github.com/lucaforni/forge/security/advisories/new
(Private Vulnerability Reporting)

Where possible, please include:

- A description of the impact and an exploitation scenario
- Steps to reproduce / a minimal PoC
- Affected versions and reference commits
- Any mitigations or suggested fixes

### Response SLA

- **Acknowledgement of receipt**: within 72 hours
- **Initial assessment** (severity + plan): within 7 days
- **Fix + advisory**: proportional to severity (Critical/High prioritised)

We will keep you updated through the private advisory thread.

## Disclosure Policy

- Coordinated disclosure: we publish a GitHub Security Advisory only once a
  fix is available.
- We credit you as the reporter (unless you ask us not to).
- We ask that you do not publicly disclose details or exploits until the
  advisory is published.

## Scope

- ✅ Code in this repository (`forge`), GitHub Actions workflows, the
  installer, and the MCP server
- ⛔ Projects generated *with* FORGE, social accounts, and the maintainer's
  personal infrastructure

## No Bug Bounty

There is currently no paid bug bounty programme.

## Operational References

Protections active on this repository (verified 2026-09-09 via API):
Dependabot alerts + security updates, secret scanning + push protection,
and Private Vulnerability Reporting. CodeQL (security-extended) and OSSF
Scorecard activate on the first push of their workflows to `main`.

> Forking or starting a new repository? Enable the same protections under
> Settings → Code security, or via `gh api` (see the decision log).
