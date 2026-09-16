/**
 * tests/smoke/codex.smoke.test.ts — Level 3 smoke: real `codex exec` against
 * the configured provider (default OpenCode Zen, fallback NVIDIA NIM).
 *
 * Skips (never fails) without provider key or without the codex CLI.
 * Uses an isolated CODEX_HOME so the user's real ~/.codex is untouched.
 * NOTE: codex 0.154 requires wire_api = "responses". Whether the provider's
 * Responses endpoint accepts Codex's namespace/sub-agent tools is verified
 * live — see history in providers.ts docs / PRs.
 */

import { describe, it, expect, beforeAll } from "vitest"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { smokeProvider, smokeBlockers, findCli, makeTempHome, runHarness } from "./providers"

const MARKER = "SMOKE-MARKER-7429"
const blocker = smokeBlockers("codex")
// Zen free tier is locked to the opencode client ("can only be used in
// OpenCode") — codex runs against it fail by design. Force them only with an
// unrestricted setup: SMOKE_CODEX=1 (e.g. paid Zen model). NIM fallback stays live.
const zenParked = smokeProvider()?.id === "zen" && !process.env.SMOKE_CODEX
if (zenParked) {
  console.info("[smoke:codex] skipped — Zen free tier works only inside opencode; set SMOKE_CODEX=1 to force.")
}

describe.skipIf(!!blocker || zenParked)(`codex + ${process.env.SMOKE_PROVIDER || "zen"} smoke`, () => {
  const cfg = smokeProvider()!
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
        `model_provider = "${cfg.id}"`,
        `approval_policy = "never"`,
        `sandbox_mode = "read-only"`,
        ``,
        `[model_providers.${cfg.id}]`,
        `name = "${cfg.id === "zen" ? "OpenCode Zen" : "NVIDIA NIM"}"`,
        `base_url = "${cfg.baseUrl}"`,
        `env_key = "${cfg.apiKeyEnv}"`,
        // codex 0.154+ accepts only "responses" here.
        `wire_api = "responses"`,
        ``,
      ].join("\n"),
      "utf-8",
    )
    return () => rmSync(codexHome, { recursive: true, force: true })
  })

  it(
    "reads a project file through tools and echoes its first line",
    () => {
      const { status, out } = runHarness("codex", cli, [
        "exec",
        "--skip-git-repo-check",
        "Read data.txt in the current directory and reply with ONLY its first line. Use tools, do not guess.",
      ], {
        cwd: project,
        env: { ...process.env, CODEX_HOME: codexHome, [cfg.apiKeyEnv]: cfg.apiKey, CI: "true" },
      })
      if (status !== 0 || !out.includes(MARKER)) {
        console.error(`[smoke:codex] harness output (first 4000 chars):\n${out.slice(0, 4000)}`)
      }
      expect({ status, out }).toMatchObject({ status: 0 })
      expect(out).toContain(MARKER)
    },
    600_000,
  )
})
