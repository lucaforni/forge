/**
 * tests/smoke/nim.ts — Shared helper for NVIDIA-NIM smoke tests (level 3).
 *
 * Zero-dependency (node builtins only). Everything degrades to "skip":
 * without NVIDIA_API_KEY (or without the harness CLI) callers must skip,
 * never fail — so plain `npm test` and fork PRs stay green.
 */

import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

export const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
// gpt-oss-120b: 20b emits tool calls as TEXT (not function calls) inside
// opencode's loop; 120b is the same family, far more capable, still cheap.
// qwen2.5-coder-32b is EOL; deepseek-v4-flash hung. See nim-pilot.ts.
export const NIM_DEFAULT_MODEL = "openai/gpt-oss-120b"

export interface NimConfig {
  apiKey: string
  baseUrl: string
  model: string
}

/** Read NIM config from env. Returns null when unavailable (→ skip). */
export function nimConfig(): NimConfig | null {
  const apiKey = process.env.NVIDIA_API_KEY?.trim()
  if (!apiKey) return null
  return {
    apiKey,
    baseUrl: process.env.NIM_BASE_URL?.trim() || NIM_BASE_URL,
    model: process.env.NIM_SMOKE_MODEL?.trim() || NIM_DEFAULT_MODEL,
  }
}

/** Human-readable reason when smoke cannot run (null = ready). */
export function smokeBlockers(cli: "opencode" | "codex"): string | null {
  if (!nimConfig()) return "set NVIDIA_API_KEY to run NIM smoke tests"
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
