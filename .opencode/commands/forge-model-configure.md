---
description: "Reconfigure opencode.json models from a provider preset with policy routing (quality/speed/cheap)"
agent: forge
---

# Model Reconfigure

Regenerate the `model` / `providers` / `agents` sections of `opencode.json`
from a versioned provider preset. Static policy routing: reasoning agents get
the strong model, execution agents the fast/cheap one. No per-task switching.

Thin command: all branching logic lives in `installer/model-config.ts`.
This file only parses arguments, calls the lib, and reports the result.

## Arguments

`$ARGUMENTS` — flags (all `--flag` or `--flag=value` form):

| Flag | Required | Description |
| ---- | -------- | ----------- |
| `--provider=<id>` | Yes (apply mode) | Preset id — see `--list` |
| `--policy=<p>` | Yes (apply mode) | `quality` \| `speed` \| `cheap`. No default (fail-closed) |
| `--list` | No | List presets + tier table, write nothing |
| `--dry-run` | No | Print tier table + diff summary, write nothing |
| `--yes` | No | Confirm paid upgrades (and free-on-private). Required in CI |
| `--allow-free-private` | No | Confirm `-free` models on private repos |

Policy matrix: `quality` → strongest reasoning · `speed` → fastest execution ·
`cheap` → cheapest/free execution (falls back to the preset execution model
when no `-free` exists — the cost hint says "cheap resolved to paid").

## Process

### 1. List mode

If `--list` is present, call `runReconfigure({ projectRoot, list: true })`,
print `output`, and stop. Exit code from the lib.

### 2. Validate arguments

`--provider` and `--policy` are both required in apply mode. If either is
missing, report the usage error (exit 2) with the valid values — never invent
a default. Unknown `--provider` → exit 2 with the preset list.

### 3. Apply via the lib

Call `runReconfigure({ projectRoot, provider, policy, dryRun, yes, allowFreePrivate })`
from `installer/model-config.ts`. The lib enforces, in order: preset
resolution (`.forge/presets.json` > built-in fallback) → policy matrix →
availability check (miss → abort, exit 1, nothing written) → cost hint
(paid upgrade without `--yes` → abort, exit 1) → privacy gate (`-free` on a
private/undetectable repo without `--allow-free-private`/`--yes` → abort,
exit 1) → key-scoped merge (only `model`/`providers`/`agents`; everything
else byte-identical) → single timestamped backup `opencode.json.bak.<ts>`
(skipped on no-op) → write.

### 4. Report

Print the lib `output` verbatim. It already contains the six blocks:
(a) preset + policy + source · (b) tier table · (c) cost hint · (d) privacy
notice (when `-free`) · (e) backup path + preserved-keys count · (f) next step.
Then report:

```
Model Reconfigure Complete
==========================
Provider: <id> (source: project|fallback)
Policy: <policy>
Changed: yes|no
Backup: <path|none>
Exit: <code>
```

Exit codes: `0` applied / unchanged / dry-run / list (non-empty) · `1` abort
(availability miss, gate decline, paid upgrade unconfirmed, or `--list`
with no presets installed — degraded environment with reinstall hint) ·
`2` usage (missing/unknown provider or policy).

## Examples

```
/forge-model-configure --list
/forge-model-configure --provider=github-copilot --policy=quality
/forge-model-configure --provider=opencode-free --policy=cheap --dry-run
/forge-model-configure --provider=github-copilot --policy=cheap --yes
```

CLI alias (same lib, same contract):

```
npx tsx install-forge.ts . --reconfigure --provider=github-copilot --policy=quality
```

## Scope notes

- Fully dynamic per-task model switching is OUT (deferred to a follow-up
  spec). This command is manual + policy-static by design.
- The privacy hard block (`--allow-free-private` allowlist, per-repo config)
  is OUT; v1 warns + confirms (see spec 011 edge 4).
- Never edit `opencode.json` by hand here — all writes go through the lib
  (backup + idempotency guaranteed).
