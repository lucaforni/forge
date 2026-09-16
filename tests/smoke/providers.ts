/**
 * tests/smoke/providers.ts — Smoke-test provider selection (level 3).
 *
 * Two supported backends, chosen via SMOKE_PROVIDER (default: "zen"):
 *
 *   zen — OpenCode Zen gateway (https://opencode.ai/zen/v1), models tested by
 *         the opencode team for tool-calling. Key: OPENCODE_ZEN_API_KEY.
 *         Default model: big-pickle (free stealth model).
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
const ZEN_DEFAULT_MODEL = "big-pickle"
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
