/**
 * installer/model-config.ts — Automatic model reconfiguration (011).
 *
 * Single testable home for provider-preset resolution, policy→tier mapping,
 * managed-key merge, cost hints and the free-model privacy gate. Two thin
 * surfaces delegate here: the `/forge-model-configure` slash command and the
 * `install-forge.ts --reconfigure` alias (ADR-005).
 *
 * Design rules (spec 011, plan §4.1):
 * - Static only: no network calls, no per-task model switching (Flow C is out).
 * - Reconfigure is an explicit user rewrite: `mergeManagedKeys` MUST NOT route
 *   through `generateOpenCodeConfig` seed-once gating (plan §4.1a).
 * - `MODEL_MANAGED_KEYS` is command-owned and deliberately distinct from the
 *   installer's `FORGE_MANAGED_KEYS` (plan §2.5). Intersection is exactly
 *   `{agents}` — see the two-list invariant test.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { execFileSync } from "node:child_process"

import { stripJsonComments } from "./config"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Policies accepted by `--policy`. No hidden default (fail-closed, exit 2). */
export const POLICIES = ["quality", "speed", "cheap"] as const
export type Policy = (typeof POLICIES)[number]

/**
 * Keys this command owns inside `opencode.json`. Everything else is
 * user-owned and preserved byte-identical.
 */
export const MODEL_MANAGED_KEYS = ["model", "providers", "agents"] as const

/** One tier inside a provider preset (`reasoning` / `execution` / `peer`). */
export interface PresetTier {
  model: string
  agents: string[]
}

/** A single provider preset (shape mirrors `.opencode/templates/presets.json`). */
export interface ProviderPreset {
  name: string
  description: string
  defaultModel: string
  providers: Record<string, { models: Record<string, unknown> }>
  agentModels: {
    reasoning: PresetTier
    execution: PresetTier
    peer?: PresetTier
  }
  alternatives: {
    reasoning: string[]
    execution: string[]
    peer?: string[]
  }
}

/** Where the presets came from (FR-006 resolution order). */
export type PresetSource = "project" | "fallback" | "none"

export interface ResolveResult {
  presets: Record<string, ProviderPreset>
  source: PresetSource
  warnings: string[]
}

/** Tier → selected model ref (`provider/model`). */
export interface TierSelection {
  reasoning: string
  execution: string
  peer?: string
}

/** Built `opencode.json` managed section. */
export interface ManagedKeys {
  model: string
  providers: Record<string, { models: Record<string, unknown> }>
  agents: Record<string, { model: string }>
}

/** Usage error (exit 2): bad flag values, unknown provider/policy. */
export class UsageError extends Error {
  readonly exitCode = 2 as const
}

/** Injectable process runner for tests (`detectRepoVisibility`). */
export type ExecFn = (cmd: string, args: string[], cwd: string) => string

/** Injectable clock for deterministic backup names in tests. */
export type NowFn = () => Date

// ---------------------------------------------------------------------------
// 2.1 — resolvePresets
// ---------------------------------------------------------------------------

function parsePresetsFile(path: string): Record<string, ProviderPreset> | null {
  if (!existsSync(path)) return null
  try {
    const parsed = JSON.parse(stripJsonComments(readFileSync(path, "utf-8"))) as {
      presets?: Record<string, ProviderPreset>
    }
    if (!parsed || typeof parsed !== "object" || !parsed.presets) return null
    return parsed.presets
  } catch {
    return null
  }
}

/**
 * Resolve provider presets: `.forge/presets.json` (user-tuned, create-once)
 * wins over the shipped fallback `.forge/templates/presets.json`.
 * Missing/corrupt everywhere → empty set + `Standalone — not chained` warning.
 * Never touches the network (NFR-005).
 */
export function resolvePresets(projectRoot: string): ResolveResult {
  const warnings: string[] = []

  const project = parsePresetsFile(join(projectRoot, ".forge", "presets.json"))
  if (project) return { presets: project, source: "project", warnings }

  const fallback = parsePresetsFile(join(projectRoot, ".forge", "templates", "presets.json"))
  if (fallback) {
    warnings.push("Standalone — not chained: using built-in preset fallback (.forge/presets.json missing or unreadable).")
    return { presets: fallback, source: "fallback", warnings }
  }

  warnings.push("Standalone — not chained: no presets found (.forge/presets.json and fallback both missing or unreadable).")
  return { presets: {}, source: "none", warnings }
}

// ---------------------------------------------------------------------------
// 2.2 — selectTierModels
// ---------------------------------------------------------------------------

function isPolicy(value: string): value is Policy {
  return (POLICIES as readonly string[]).includes(value)
}

/**
 * Map `--policy` to tier models (spec FR-003, plan §3 matrix):
 * - quality → strongest reasoning (`alternatives.reasoning[0]`)
 * - speed   → fastest execution (`alternatives.execution[0]`)
 * - cheap   → cheapest execution: prefer a `-free` model in
 *   `alternatives.execution`, else `agentModels.execution.model` (may be paid —
 *   the cost hint must then say "cheap resolved to paid", never claim free).
 * Reasoning/execution tiers not targeted by the policy keep their preset
 * defaults. Unknown policy → UsageError (exit 2) listing valid values.
 */
export function selectTierModels(preset: ProviderPreset, policy: string): TierSelection {
  if (!isPolicy(policy)) {
    throw new UsageError(`Unknown --policy "${policy}". Valid values: ${POLICIES.join(" | ")}.`)
  }

  const reasoningDefault = preset.agentModels.reasoning.model
  const executionDefault = preset.agentModels.execution.model
  const peerDefault = preset.agentModels.peer?.model

  // Tiers not targeted by the policy keep their preset defaults.
  let reasoning = reasoningDefault
  let execution = executionDefault

  if (policy === "quality") {
    reasoning = preset.alternatives.reasoning[0] ?? reasoningDefault
  } else if (policy === "speed") {
    execution = preset.alternatives.execution[0] ?? executionDefault
  } else {
    const free = preset.alternatives.execution.find((m) => m.endsWith("-free"))
    execution = free ?? executionDefault
  }

  const selection: TierSelection = { reasoning, execution }
  const peer = preset.alternatives.peer?.[0] ?? peerDefault
  if (peer) selection.peer = peer
  return selection
}

// ---------------------------------------------------------------------------
// 2.3 — buildManagedKeys
// ---------------------------------------------------------------------------

/** Split a `provider/bare` ref. Bare ids (no prefix) yield provider undefined. */
export function parseModelRef(ref: string): { provider?: string; bare: string } {
  const slash = ref.indexOf("/")
  if (slash < 0) return { bare: ref }
  return { provider: ref.slice(0, slash), bare: ref.slice(slash + 1) }
}

/** Model family = first `-`-separated segment of the bare model id. */
export function modelFamily(ref: string): string {
  return parseModelRef(ref).bare.split("-")[0]
}

/** True when the selection contains a `-free` model (privacy-relevant). */
export function selectionHasFree(selection: TierSelection): boolean {
  return [selection.reasoning, selection.execution, selection.peer].some(
    (m) => !!m && isFree(m),
  )
}

/**
 * Build the managed section: reasoning agents (`forge-pm`, `forge-architect`,
 * `forge-reviewer`, `forge-ux`) → reasoning model; execution agents
 * (`forge`, `forge-scrum`, `forge-qa`, `forge-analyst`) → execution model;
 * `forge-reviewer-peer` → peer model. Top-level `model` (default for agents
 * without override) is the execution model. Key insertion order is fixed
 * (tier order, then preset agent order) for snapshot determinism (NFR-004).
 */
export function buildManagedKeys(preset: ProviderPreset, selection: TierSelection): ManagedKeys {
  const agents: Record<string, { model: string }> = {}
  for (const name of preset.agentModels.reasoning.agents) agents[name] = { model: selection.reasoning }
  for (const name of preset.agentModels.execution.agents) agents[name] = { model: selection.execution }
  if (selection.peer && preset.agentModels.peer) {
    for (const name of preset.agentModels.peer.agents) agents[name] = { model: selection.peer }
  }

  // Structured clone of the preset providers block (available-model set).
  const providers = JSON.parse(JSON.stringify(preset.providers)) as ManagedKeys["providers"]

  return { model: selection.execution, providers, agents }
}

// ---------------------------------------------------------------------------
// 2.4 — checkAvailability (Avviso e stop, no silent downgrade)
// ---------------------------------------------------------------------------

export interface Availability {
  ok: boolean
  missing: string[]
  hint: string
}

function presetModelIds(preset: ProviderPreset): Set<string> {
  const ids = new Set<string>()
  for (const [provider, cfg] of Object.entries(preset.providers)) {
    for (const bare of Object.keys(cfg.models)) ids.add(`${provider}/${bare}`)
  }
  return ids
}

/**
 * Every selected tier model must exist in the preset's provider model list.
 * On miss: `ok:false` + missing refs + a fallback hint naming in-preset
 * alternatives (other `--policy` values resolving to available models).
 * The caller aborts (exit 1) without writing.
 */
export function checkAvailability(preset: ProviderPreset, selection: TierSelection): Availability {
  const ids = presetModelIds(preset)
  const missing = [selection.reasoning, selection.execution, selection.peer].filter(
    (m): m is string => !!m && !ids.has(m),
  )
  if (missing.length === 0) return { ok: true, missing: [], hint: "" }

  const usable = [...preset.alternatives.reasoning, ...preset.alternatives.execution].filter((m) => ids.has(m))
  const hint =
    `Models not available on this provider/account: ${missing.join(", ")}. ` +
    (usable.length > 0
      ? `In-preset alternatives: ${usable.join(", ")} — retry with a --policy resolving to one of these, or pick another --provider.`
      : `No in-preset alternative resolves — pick another --provider.`)
  return { ok: false, missing, hint }
}

// ---------------------------------------------------------------------------
// 2.5 — mergeManagedKeys (explicit rewrite; never via generateOpenCodeConfig)
// ---------------------------------------------------------------------------

export interface MergeResult {
  next: Record<string, unknown>
  changed: boolean
  preservedKeys: string[]
}

/**
 * Replace ONLY `MODEL_MANAGED_KEYS`; every other key is preserved
 * byte-identical (same position, same value). Inside `agents`, only each
 * entry's `model` field is rewritten — other entry fields (e.g. `path`)
 * survive, entries absent from the built map are left untouched, and new
 * preset agents are added. `changed` is false when the merge is a no-op
 * (idempotency, FR-008).
 */
export function mergeManagedKeys(
  existing: Record<string, unknown>,
  built: ManagedKeys,
): MergeResult {
  const preservedKeys = Object.keys(existing).filter(
    (k) => !(MODEL_MANAGED_KEYS as readonly string[]).includes(k),
  )

  const existingAgents =
    existing["agents"] && typeof existing["agents"] === "object" && !Array.isArray(existing["agents"])
      ? (existing["agents"] as Record<string, Record<string, unknown>>)
      : {}
  const mergedAgents: Record<string, unknown> = { ...existingAgents }
  for (const [name, entry] of Object.entries(built.agents)) {
    const prev = mergedAgents[name]
    mergedAgents[name] =
      prev && typeof prev === "object" && !Array.isArray(prev)
        ? { ...(prev as Record<string, unknown>), model: entry.model }
        : { model: entry.model }
  }

  const next: Record<string, unknown> = {
    ...existing,
    model: built.model,
    providers: built.providers,
    agents: mergedAgents,
  }

  return { next, changed: JSON.stringify(next) !== JSON.stringify(existing), preservedKeys }
}

// ---------------------------------------------------------------------------
// 2.6 — backup + write
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return n.toString().padStart(2, "0")
}

/** `opencode.json.bak.<YYYYMMDD-HHMMSS>` (local time). Clock injectable. */
export function backupName(now: Date = new Date()): string {
  return `opencode.json.bak.${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

/**
 * Copy the current config to a timestamped backup. Call exactly once per
 * differing apply, never on no-op (FR-008). Returns the backup path.
 */
export function writeBackup(projectRoot: string, now: NowFn = () => new Date()): string {
  const backupPath = join(projectRoot, backupName(now()))
  writeFileSync(backupPath, readFileSync(join(projectRoot, "opencode.json"), "utf-8"), "utf-8")
  return backupPath
}

// ---------------------------------------------------------------------------
// 2.7 — computeCostHint
// ---------------------------------------------------------------------------

export interface CostRow {
  tier: "reasoning" | "execution" | "peer"
  model: string
  free: boolean
  strength: "strong" | "cheap"
}

export interface CostHint {
  rows: CostRow[]
  /** True when a slot moves free → paid vs the previous config. */
  paidUpgrade: boolean
  /** True when `--policy cheap` resolved to a paid execution model. */
  cheapResolvedPaid: boolean
}

function isFree(ref: string): boolean {
  return parseModelRef(ref).bare.endsWith("-free")
}

function prevModelForTier(prev: Record<string, unknown>, tier: CostRow["tier"]): string | undefined {
  const agents =
    prev["agents"] && typeof prev["agents"] === "object" && !Array.isArray(prev["agents"])
      ? (prev["agents"] as Record<string, { model?: unknown }>)
      : {}
  const first =
    tier === "reasoning"
      ? ["forge-pm", "forge-architect", "forge-reviewer", "forge-ux"]
      : tier === "execution"
        ? ["forge", "forge-scrum", "forge-qa", "forge-analyst"]
        : ["forge-reviewer-peer"]
  for (const name of first) {
    const m = agents[name]?.model
    if (typeof m === "string") return m
  }
  return undefined
}

/**
 * Per-tier free/paid + strong/cheap rows. `paidUpgrade` fires when any slot
 * moves free → paid. When `cheap` resolves to a paid model the hint says so
 * explicitly (`cheapResolvedPaid`) — never claim free.
 */
export function computeCostHint(
  selection: TierSelection,
  prev: Record<string, unknown>,
  policy: Policy,
): CostHint {
  const rows: CostRow[] = [
    { tier: "reasoning", model: selection.reasoning, free: isFree(selection.reasoning), strength: "strong" },
    { tier: "execution", model: selection.execution, free: isFree(selection.execution), strength: "cheap" },
  ]
  if (selection.peer) {
    rows.push({ tier: "peer", model: selection.peer, free: isFree(selection.peer), strength: "strong" })
  }

  let paidUpgrade = false
  for (const row of rows) {
    const prevModel = prevModelForTier(prev, row.tier)
    if (prevModel && isFree(prevModel) && !row.free) paidUpgrade = true
  }

  return { rows, paidUpgrade, cheapResolvedPaid: policy === "cheap" && !isFree(selection.execution) }
}

// ---------------------------------------------------------------------------
// 2.8 — detectRepoVisibility (best-effort; unknown ⇒ private)
// ---------------------------------------------------------------------------

export type Visibility = "public" | "private" | "unknown"

const defaultExec: ExecFn = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf-8", timeout: 10000, stdio: ["ignore", "pipe", "pipe"] }).trim()

/**
 * Best-effort repo visibility: `gh repo view --json isPrivate` first, then
 * `git remote` presence. Anything undetectable (offline, no gh, no remote,
 * any error) returns `unknown`, which the privacy gate treats as private
 * (fail-closed, ADR-006). No network beyond what gh/git already do (NFR-005:
 * this command itself initiates no HTTP).
 */
export function detectRepoVisibility(projectRoot: string, exec: ExecFn = defaultExec): Visibility {
  try {
    const out = exec("gh", ["repo", "view", "--json", "isPrivate", "--jq", ".isPrivate"], projectRoot)
    if (out === "true") return "private"
    if (out === "false") return "public"
  } catch {
    // fall through to git
  }
  try {
    const remote = exec("git", ["remote", "-v"], projectRoot)
    if (remote.trim() !== "") return "unknown"
  } catch {
    // no git either
  }
  return "unknown"
}

// ---------------------------------------------------------------------------
// 2.9 — evaluatePrivacyGate
// ---------------------------------------------------------------------------

export interface PrivacyGate {
  blocked: boolean
  /** Always rendered when a `-free` model is selected (FR-007). */
  notice: string | null
  blockReason: string
}

const PRIVACY_NOTICE =
  "Privacy trade-off: `-free` Zen models may retain or train on submitted code. " +
  "Avoid them for private or sensitive repositories."

/**
 * `-free` selected → notice always. Private/unknown repo without
 * `--allow-free-private` (or `--yes`, which implies it) → block; the reason
 * names the exact flag to re-run with. Non-interactive callers fail closed.
 * Non-`-free` tiers → gate suppressed entirely (no notice, never blocked).
 */
export function evaluatePrivacyGate(
  selection: TierSelection,
  visibility: Visibility,
  opts: { allowFreePrivate?: boolean; yes?: boolean },
): PrivacyGate {
  const freeSelected = [selection.reasoning, selection.execution, selection.peer].some(
    (m) => !!m && isFree(m),
  )
  if (!freeSelected) return { blocked: false, notice: null, blockReason: "" }

  if (visibility !== "public" && !opts.allowFreePrivate && !opts.yes) {
    return {
      blocked: true,
      notice: PRIVACY_NOTICE,
      blockReason:
        "Refusing to apply a `-free` model to a private (or undetectable) repository. " +
        "Re-run with --allow-free-private (or --yes) to confirm.",
    }
  }
  return { blocked: false, notice: PRIVACY_NOTICE, blockReason: "" }
}

// ---------------------------------------------------------------------------
// 2.10 — applyReconfigure orchestration + rendering + exit codes
// ---------------------------------------------------------------------------

export interface ApplyOptions {
  projectRoot: string
  /** Required in apply mode; omitted in `--list` mode. */
  provider?: string
  /** REQUIRED (fail-closed): omitting is a usage error, never defaulted. */
  policy?: string
  list?: boolean
  dryRun?: boolean
  yes?: boolean
  allowFreePrivate?: boolean
  exec?: ExecFn
  now?: NowFn
}

export interface ApplyResult {
  exitCode: 0 | 1 | 2
  output: string
  changed: boolean
  backupPath?: string
}

function tierTable(selection: TierSelection, preset: ProviderPreset): string[] {
  const lines = [
    `reasoning   → ${selection.reasoning}  (agents: ${preset.agentModels.reasoning.agents.join(", ")})`,
    `execution   → ${selection.execution}  (agents: ${preset.agentModels.execution.agents.join(", ")})`,
  ]
  if (selection.peer && preset.agentModels.peer) {
    lines.push(`peer        → ${selection.peer}  (agents: ${preset.agentModels.peer.agents.join(", ")})`)
  }
  return lines
}

function renderCost(hint: CostHint): string[] {
  const lines = hint.rows.map(
    (r) => `- ${r.tier}: ${r.model} [${r.free ? "free" : "paid"}, ${r.strength}]`,
  )
  if (hint.cheapResolvedPaid) {
    lines.push("NOTE: --policy cheap resolved to a PAID execution model (no -free model in this preset).")
  }
  if (hint.paidUpgrade) {
    lines.push("COST: this apply upgrades a slot from free to PAID. Re-run with --yes to confirm.")
  }
  return lines
}

function readExistingConfig(projectRoot: string): { data: Record<string, unknown>; existed: boolean } {
  const path = join(projectRoot, "opencode.json")
  if (!existsSync(path)) return { data: {}, existed: false }
  try {
    const parsed = JSON.parse(stripJsonComments(readFileSync(path, "utf-8"))) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { data: parsed as Record<string, unknown>, existed: true }
    }
  } catch {
    // fall through: treat as empty and let the write replace it
  }
  return { data: {}, existed: true }
}

/**
 * Full order: resolve → select → build → availability → cost → privacy →
 * merge → (dry-run | backup+write | unchanged). Exit 0 applied/unchanged/
 * dry-run/list · 1 abort (availability miss, gate decline, no presets) ·
 * 2 usage (unknown provider/policy, missing required flag).
 */
export function applyReconfigure(opts: ApplyOptions): ApplyResult {
  const exec = opts.exec ?? defaultExec
  const now = opts.now ?? (() => new Date())

  const { presets, source, warnings } = resolvePresets(opts.projectRoot)
  const head = [...warnings]

  if (opts.list) {
    const lines = ["Available provider presets:"]
    for (const [id, p] of Object.entries(presets)) {
      lines.push(`- ${id}: ${p.name} — default ${p.defaultModel}`)
      lines.push(`    reasoning: ${p.agentModels.reasoning.model} | execution: ${p.agentModels.execution.model}` +
        (p.agentModels.peer ? ` | peer: ${p.agentModels.peer.model}` : ""))
    }
    if (Object.keys(presets).length === 0) {
      return { exitCode: 1, output: [...head, "No presets available. Reinstall FORGE to restore them."].join("\n"), changed: false }
    }
    return { exitCode: 0, output: [...head, ...lines].join("\n"), changed: false }
  }

  if (!opts.provider) {
    throw new UsageError(`Missing --provider. Valid values: ${Object.keys(presets).join(" | ") || "(none — no presets found)"}.`)
  }
  if (!opts.policy) {
    throw new UsageError(`Missing --policy (required, no default). Valid values: ${POLICIES.join(" | ")}.`)
  }

  const preset = presets[opts.provider]
  if (!preset) {
    throw new UsageError(
      `Unknown --provider "${opts.provider}". Valid values: ${Object.keys(presets).join(" | ") || "(none — no presets found; reinstall FORGE to restore them)"}.`,
    )
  }

  let selection: TierSelection
  selection = selectTierModels(preset, opts.policy)
  const built = buildManagedKeys(preset, selection)

  // Availability is a validation error: it aborts even in --dry-run, because
  // a selection referencing undeclared models has no meaningful preview.
  // Consent gates below (privacy, paid-upgrade) are previewed, not enforced,
  // under --dry-run (FR-009).
  const availability = checkAvailability(preset, selection)
  if (!availability.ok) {
    return { exitCode: 1, output: [...head, availability.hint, "No files written."].join("\n"), changed: false }
  }

  const { data: existing, existed } = readExistingConfig(opts.projectRoot)
  const cost = computeCostHint(selection, existing, opts.policy as Policy)
  // The gh/git subprocess only runs when a -free model is selected — its
  // result feeds nothing else (WARNING: unconditional subprocess).
  const visibility = selectionHasFree(selection) ? detectRepoVisibility(opts.projectRoot, exec) : "public"
  const gate = evaluatePrivacyGate(selection, visibility, { allowFreePrivate: opts.allowFreePrivate, yes: opts.yes })

  const { next, changed, preservedKeys } = mergeManagedKeys(existing, built)

  // (a) resolved preset + policy
  const out = [
    ...head,
    `Preset: ${opts.provider} (${preset.name}) — policy: ${opts.policy} [source: ${source}]`,
    ...tierTable(selection, preset),
    ...renderCost(cost),
  ]
  // (d) privacy notice
  if (gate.notice) out.push(`PRIVACY: ${gate.notice}`)
  if (visibility === "unknown") out.push("Repo visibility undetectable — treated as private (fail-closed).")

  // --dry-run previews everything (including would-block consent gates) and
  // exits 0 without writing (FR-009). It never aborts on consent gates.
  if (opts.dryRun) {
    if (gate.blocked) out.push(`DRY-RUN: would block here: ${gate.blockReason}`)
    if (cost.paidUpgrade && !opts.yes) out.push("DRY-RUN: would require --yes for the paid upgrade above.")
    const diffed = MODEL_MANAGED_KEYS.filter(
      (k) => JSON.stringify((existing as Record<string, unknown>)[k]) !== JSON.stringify((next as Record<string, unknown>)[k]),
    )
    return {
      exitCode: 0,
      output: [...out, `Dry-run: would rewrite [${diffed.join(", ")}], preserve ${preservedKeys.length} other key(s). No files written.`].join("\n"),
      changed: false,
    }
  }

  if (gate.blocked) {
    return { exitCode: 1, output: [...head, gate.notice!, gate.blockReason, "No files written."].join("\n"), changed: false }
  }
  if (cost.paidUpgrade && !opts.yes) {
    return {
      exitCode: 1,
      output: [...head, ...renderCost(cost), "No files written."].join("\n"),
      changed: false,
    }
  }

  if (!changed) {
    return { exitCode: 0, output: [...out, "Unchanged: opencode.json already matches. No backup written."].join("\n"), changed: false }
  }

  // (e) backup + write — exactly one backup per differing apply, none on no-op.
  let backupPath: string | undefined
  if (existed) {
    backupPath = writeBackup(opts.projectRoot, now)
    out.push(`Backup: ${backupPath} — preserved keys: ${preservedKeys.length} (${preservedKeys.join(", ") || "none"}).`)
  } else {
    out.push(`Created new opencode.json (no prior file, no backup needed).`)
  }
  writeFileSync(join(opts.projectRoot, "opencode.json"), JSON.stringify(next, null, 2) + "\n", "utf-8")
  // (f) next step
  out.push(`Next: verify with your provider's model list, then re-run your FORGE command.`)

  return { exitCode: 0, output: out.join("\n"), changed: true, backupPath }
}

/** Wrap `applyReconfigure`, mapping usage errors to exit code 2. */
export function runReconfigure(opts: ApplyOptions): ApplyResult {
  try {
    return applyReconfigure(opts)
  } catch (e) {
    if (e instanceof UsageError) return { exitCode: 2, output: e.message, changed: false }
    throw e
  }
}
