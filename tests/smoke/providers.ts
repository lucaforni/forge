/**
 * tests/smoke/providers.ts — Smoke-test provider selection (level 3).
 *
 * Two supported backends, chosen via SMOKE_PROVIDER (default: "zen"):
 *
 *   zen — OpenCode Zen gateway (https://opencode.ai/zen/v1), models tested by
 *         the opencode team for tool-calling. Key: OPENCODE_ZEN_API_KEY.
 *         Default model: deepseek-v4-flash-free (free tier).
 *   nim — NVIDIA NIM (https://integrate.api.nvidia.com/v1). Key: NVIDIA_API_KEY.
 *         Kept as fallback; NIM proved flaky (EOL models, entitlement issues).
 *
 * Zero-dependency (node builtins only). Missing key/CLI → callers skip, never fail.
 */

import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

export interface SmokeProvider {
  /** "zen" | "nim" — also used as the opencode provider id. */
  id: string
  /** Base URL (client appends /chat/completions or /responses). */
  baseUrl: string
  /** Env var holding the key (referenced, never printed). */
  apiKeyEnv: string
  apiKey: string
  model: string
}

const ZEN_BASE_URL = "https://opencode.ai/zen/v1"
const ZEN_DEFAULT_MODEL = "deepseek-v4-flash-free"
const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
const NIM_DEFAULT_MODEL = "meta/llama-3.3-70b-instruct"

/** Read provider config from env. Null when unusable (→ skip). */
export function smokeProvider(): SmokeProvider | null {
  const which = (process.env.SMOKE_PROVIDER?.trim() || "zen").toLowerCase()
  if (which === "nim") {
    const apiKey = process.env.NVIDIA_API_KEY?.trim()
    if (!apiKey) return null
    return {
      id: "nim",
      baseUrl: process.env.NIM_BASE_URL?.trim() || NIM_BASE_URL,
      apiKeyEnv: "NVIDIA_API_KEY",
      apiKey,
      model: process.env.NIM_SMOKE_MODEL?.trim() || NIM_DEFAULT_MODEL,
    }
  }
  const apiKey = process.env.OPENCODE_ZEN_API_KEY?.trim()
  if (!apiKey) return null
  return {
    id: "zen",
    baseUrl: ZEN_BASE_URL,
    apiKeyEnv: "OPENCODE_ZEN_API_KEY",
    apiKey,
    model: process.env.ZEN_SMOKE_MODEL?.trim() || ZEN_DEFAULT_MODEL,
  }
}

/** Human-readable reason when smoke cannot run (null = ready). */
export function smokeBlockers(cli: "opencode" | "codex"): string | null {
  if (!smokeProvider()) {
    return "set OPENCODE_ZEN_API_KEY (or SMOKE_PROVIDER=nim + NVIDIA_API_KEY) to run smoke tests"
  }
  if (!findCli(cli)) return `${cli} CLI not installed`
  return null
}

/** Locate a CLI on PATH. Returns absolute path or null. */
export function findCli(name: string): string | null {
  const pathEnv = process.env.PATH ?? ""
  const sep = process.platform === "win32" ? ";" : ":"
  const exts = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""]
  for (const dir of pathEnv.split(sep)) {
    if (!dir) continue
    for (const ext of exts) {
      const candidate = join(dir, name + ext)
      const probe = spawnSync(candidate, ["--version"], { stdio: "ignore", timeout: 15000 })
      if (!probe.error || (probe.error as NodeJS.ErrnoException).code !== "ENOENT") {
        return candidate
      }
    }
  }
  return null
}

/** Fresh isolated HOME dir (prevents touching the user's real configs). */
export function makeTempHome(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

// ---------------------------------------------------------------------------
// Transient-aware runner: free tiers hiccup ("high demand", 429/5xx). Retry
// ONCE on transient-looking failures so CI doesn't go red on capacity blips.
// Deterministic failures (auth, config, assertion content) never retry.
// ---------------------------------------------------------------------------

const TRANSIENT_RE =
  /high demand|temporar|rate.?limit|429|\b5\d\d\b|econn|etimedout|overloaded|capacity|reconnecting/i

export interface HarnessRun {
  status: number | null
  out: string
  attempts: number
}

export function runHarness(
  label: string,
  cli: string,
  args: string[],
  opts: { cwd: string; env: Record<string, string | undefined>; timeoutMs?: number },
): HarnessRun {
  const timeout = opts.timeoutMs ?? 300_000
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = spawnSync(cli, args, {
      cwd: opts.cwd,
      timeout,
      encoding: "utf-8",
      // stdin ignored: a permission prompt must fail fast, never hang.
      stdio: ["ignore", "pipe", "pipe"],
      env: opts.env as Record<string, string>,
    })
    const out = `${res.stdout ?? ""}\n${res.stderr ?? ""}`
    if (res.status === 0) return { status: 0, out, attempts: attempt }
    if (attempt === 1 && TRANSIENT_RE.test(out)) {
      console.info(`[smoke:${label}] transient failure (attempt 1), retrying in 30s…`)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30_000)
      continue
    }
    return { status: res.status, out, attempts: attempt }
  }
  throw new Error("unreachable")
}
