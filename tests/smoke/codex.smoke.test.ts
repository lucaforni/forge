/**
 * tests/smoke/codex.smoke.test.ts — Level 3 smoke: real `codex exec` against NVIDIA NIM.
 *
 * Skips (never fails) without NVIDIA_API_KEY or without the codex CLI.
 * Uses an isolated CODEX_HOME so the user's real ~/.codex is untouched.
 * NOTE: wire_api = "chat" (not "responses"): NIM's Responses endpoint strictly
 * validates tools and rejects Codex's namespace/sub-agent tools. Chat sends
 * plain function tools, which NIM accepts.
 */

import { describe, it, expect, beforeAll } from "vitest"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { nimConfig, smokeBlockers, findCli, makeTempHome } from "./nim"

const MARKER = "SMOKE-MARKER-7429"
const blocker = smokeBlockers("codex")
if (blocker) console.info(`[smoke:codex] skipped — ${blocker}.`)

describe.skipIf(!!blocker)("codex + NIM smoke", () => {
  const cfg = nimConfig()!
  const codexHome = makeTempHome("forge-smoke-codex-")
  const project = join(codexHome, "proj")
  let cli: string

  beforeAll(() => {
    cli = findCli("codex")!
    mkdirSync(project, { recursive: true })
    writeFileSync(join(project, "data.txt"), `${MARKER}\nsecond line\n`, "utf-8")
    writeFileSync(
      join(codexHome, "config.toml"),
      [
        `model = "${cfg.model}"`,
        `model_provider = "nim"`,
        `approval_policy = "never"`,
        `sandbox_mode = "read-only"`,
        ``,
        `[model_providers.nim]`,
        `name = "NVIDIA NIM"`,
        `base_url = "${cfg.baseUrl}"`,
        `env_key = "NVIDIA_API_KEY"`,
        // NOTE: "responses" is rejected by NIM (strict tool validation chokes on
        // Codex's namespace/sub-agent tools). "chat" sends plain function tools.
        `wire_api = "chat"`,
        ``,
      ].join("\n"),
      "utf-8",
    )
    return () => rmSync(codexHome, { recursive: true, force: true })
  })

  // KNOWN INCOMPATIBILITY (2026-09-15, codex 0.154.0): NIM's /v1/responses
  // endpoint strictly validates tools and rejects Codex's namespace/sub-agent
  // tools (18 validation errors), while `wire_api = "chat"` is rejected
  // client-side ("no longer supported"). No wire option works today.
  // it.fails pins this: suite stays green on the fast deterministic rejection,
  // and flips red if it ever unexpectedly passes (then re-enable the test).
  it.fails(
    "reads a project file through tools and echoes its first line",
    () => {
      const res = spawnSync(
        cli,
        [
          "exec",
          "--skip-git-repo-check",
          "Read data.txt in the current directory and reply with ONLY its first line. Use tools, do not guess.",
        ],
        {
          cwd: project,
          timeout: 300_000,
          encoding: "utf-8",
          env: { ...process.env, CODEX_HOME: codexHome, NVIDIA_API_KEY: cfg.apiKey, CI: "true" },
        },
      )
      const out = `${res.stdout ?? ""}\n${res.stderr ?? ""}`
      if (res.status !== 0 || !out.includes(MARKER)) {
        console.error(`[smoke:codex] harness output (first 4000 chars):\n${out.slice(0, 4000)}`)
      }
      expect({ status: res.status, out }).toMatchObject({ status: 0 })
      expect(out).toContain(MARKER)
    },
    300_000,
  )
})
