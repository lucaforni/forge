/**
 * tests/smoke/opencode.smoke.test.ts — Level 3 smoke: real `opencode run` against NVIDIA NIM.
 *
 * Skips (never fails) without NVIDIA_API_KEY or without the opencode CLI.
 * Uses an isolated HOME + fixture project so the user's real config is untouched.
 */

import { describe, it, expect, beforeAll } from "vitest"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { nimConfig, smokeBlockers, findCli, makeTempHome } from "./nim"

const MARKER = "SMOKE-MARKER-7429"
const blocker = smokeBlockers("opencode")
if (blocker) console.info(`[smoke:opencode] skipped — ${blocker}.`)

describe.skipIf(!!blocker)("opencode + NIM smoke", () => {
  const cfg = nimConfig()!
  const home = makeTempHome("forge-smoke-opencode-")
  const project = join(home, "proj")
  let cli: string

  beforeAll(() => {
    cli = findCli("opencode")!
    mkdirSync(project, { recursive: true })
    writeFileSync(join(project, "data.txt"), `${MARKER}\nsecond line\n`, "utf-8")
    writeFileSync(
      join(project, "opencode.json"),
      JSON.stringify(
        {
          model: `nim/${cfg.model}`,
          provider: {
            nim: {
              npm: "@ai-sdk/openai-compatible",
              name: "NVIDIA NIM",
              options: { baseURL: cfg.baseUrl, apiKey: "{env:NVIDIA_API_KEY}" },
              models: {
                [cfg.model]: {
                  name: "NIM smoke model",
                  modalities: { input: ["text"], output: ["text"] },
                },
              },
            },
          },
          // Least privilege: the smoke prompt only reads one file.
          permission: { read: "allow", glob: "allow", grep: "allow", "*": "deny" },
        },
        null,
        2,
      ),
      "utf-8",
    )
    return () => rmSync(home, { recursive: true, force: true })
  })

  it(
    "reads a project file through tools and echoes its first line",
    () => {
      const res = spawnSync(
        cli,
        [
          "run",
          "--dir",
          project,
          "--model",
          `nim/${cfg.model}`,
          "Read data.txt in the current directory and reply with ONLY its first line. Use tools, do not guess.",
        ],
        {
          cwd: project,
          timeout: 300_000,
          encoding: "utf-8",
          // stdin ignored: a permission prompt must fail fast, never hang
          // the full 300s waiting on an open pipe.
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, HOME: home, NVIDIA_API_KEY: cfg.apiKey, CI: "true" },
        },
      )
      const out = `${res.stdout ?? ""}\n${res.stderr ?? ""}`
      if (res.status !== 0 || !out.includes(MARKER)) {
        console.error(`[smoke:opencode] harness output (first 4000 chars):\n${out.slice(0, 4000)}`)
      }
      expect({ status: res.status, out }).toMatchObject({ status: 0 })
      expect(out).toContain(MARKER)
    },
    300_000,
  )
})
