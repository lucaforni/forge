# ADR-006: Privacy gate — repo-visibility heuristic fails closed

## Status

**Accepted** · 2026-10-06 (accepted 2026-10-08) · Spec 011-model-configure
· Reviewer: `.forge/specs/011-model-configure/analysis.md`

## Context

v1 ships a **warn + confirm** privacy gate (not a hard block — discovery
conflict resolved 2026-10-06): free Zen models (`-free`) are allowed, but on a
**private** repository the command must stop and require explicit confirmation
(`--allow-free-private` / `--yes`, or an interactive prompt) before writing
(FR-007, US-003, edge case 4). This needs a repo-visibility signal, and there
is no fully reliable offline way to know whether a repo is private:

- `git remote get-url origin` tells us a remote exists, not its visibility.
- `gh repo view --json isPrivate` is authoritative but needs network + `gh` +
  auth — none guaranteed (NFR-005 offline-first).
- A repo may have **no remote at all** (local-only), which is ambiguous: could
  be unpublished private work.

Options for the undetectable case:
- **H1. Fail closed** — treat "cannot confirm public" as **private**, require
  confirm.
- **H2. Fail open** — treat undetectable as public, apply free model silently.

## Decision

**Heuristic, best-effort, failing CLOSED (H1).** Resolution order:

1. If `gh repo view --json isPrivate` succeeds (network available) → use its
   boolean authoritatively.
2. Else inspect the git remote URL as a weak signal (best-effort only; never
   decisive on its own for "public").
3. **If visibility cannot be positively established as public → treat as
   private** and trigger the confirm gate. The output states the assumption
   verbatim: *"Repository visibility could not be confirmed; assuming private
   (privacy-safe default). Re-run with `--allow-free-private` to proceed."*

Non-interactive mode (CI / no TTY) with the gate triggered and no confirm flag
→ **hard stop, exit 1**, printing the exact flag to re-run with (NFR-006).

Rejected **H2 (fail open):** a single wrong "public" guess leaks private source
to a free model that may retain/train on it — an irreversible privacy harm the
discovery decision explicitly guards against. A false "private" only costs one
extra confirm, which is recoverable.

## Consequences

- **Positive:** privacy-safe by construction; honours offline-first (works with
  no network, no `gh`); every abort is actionable.
- **Negative:** users on genuinely public repos with no detectable remote get
  an extra confirm — accepted cost; `--allow-free-private`/`--yes` dismisses it.
- **Neutral:** heuristic is intentionally coarse in v1; the full opt-in / per-
  repo allowlist is deferred to Future (spec §10), and `--allow-free-private`
  is reserved now but only used as a confirm in v1.

## Constitution Alignment

- **Art. 1 (Core Principles):** safety-first, no silent risky action, actionable
  messages.
- **Art. 4 (Quality Standards):** heuristic + gate are unit-tested (private →
  stop, confirm → proceed, undetectable → stop) with network stubbed off.
- Supports FR-007; NFR-005, NFR-006; edge case 4.
