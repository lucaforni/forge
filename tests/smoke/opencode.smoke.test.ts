/**
 * tests/smoke/opencode.smoke.test.ts — Level 3 smoke: real `opencode run`
 * against the configured provider (default OpenCode Zen, fallback NIM).
 *
 * Skips (never fails) without provider key or without the opencode CLI.
 * Uses an isolated HOME + fixture project so the user's real config is untouched.
 */

import { describe, it, expect, beforeAll } from "vitest"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { smokeProvider, smokeBlockers, findCli, makeTempHome, runHarness } from "./providers"

const MARKER = "SMOKE-MARKER-7429"
const blocker = smokeBlockers("opencode")
if (blocker) console.info(`[smoke:opencode] skipped — ${blocker}.`)

describe.skipIf(!!blocker)(`opencode + ${process.env.SMOKE_PROVIDER || "zen"} smoke`, () => {
  const cfg = smokeProvider()!
  const home = makeTempHome("forge-smoke-opencode-")
  const project = join(home, "proj")
  let cli: string

  beforeAll(() => {
    cli = findCli("opencode")!
    mkdirSync(project, { recursive: true })
    writeFileSync(join(project, "data.txt"), `${MARKER}\nsecond line\n`, "utf-8")
    // Zen uses opencode's NATIVE provider (opencode/<model>, key via env) —
    // no custom provider block needed. NIM needs the openai-compatible block.
    const providerBlock = cfg.needsCustomProvider
      ? {
          provider: {
            [cfg.id]: {
              npm: "@ai-sdk/openai-compatible",
              name: "NVIDIA NIM",
              options: { baseURL: cfg.baseUrl, apiKey: `{env:${cfg.apiKeyEnv}}` },
              models: {
                [cfg.model]: {
                  name: "Smoke model",
                  modalities: { input: ["text"], output: ["text"] },
                },
              },
            },
          },
        }
      : {}
    writeFileSync(
      join(project, "opencode.json"),
      JSON.stringify(
        {
          model: cfg.modelRef,
          ...providerBlock,
          // Permission semantics learned the hard way:
          // - "*" deny HIDES tools from the model (calls die unexecuted);
          // - "*" ask OVERRIDES specific allows (everything prompts).
          // So: explicit read-only allows, NO wildcard key — unlisted tools
          // fall back to the default (ask → auto-deny, stdin is ignored).
          permission: {
            read: "allow",
            glob: "allow",
            grep: "allow",
            bash: {
              "sed *": "allow",
              "cat *": "allow",
              "head *": "allow",
              "ls *": "allow",
            },
          },
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
      const { status, out } = runHarness("opencode", cli, [
        "run",
        "--dir",
        project,
          "--model",
          cfg.modelRef,
        // JSON event stream: machine-readable (tool calls, errors) and free
        // of ANSI codes, so assertions and failure dumps are precise.
          "--format",
          "json",
          // Default build agent: the plan agent exposes NO tools in this CLI
          // version ("Available tools: ." — the model correctly called read but
          // the call died unexecuted). Safety comes from the permission
          // firewall in the fixture (read-only allowlist, rest denied).
          "Read data.txt in the current directory and reply with ONLY its first line. Use tools, do not guess.",
      ], {
        cwd: project,
        env: { ...process.env, HOME: home, [cfg.apiKeyEnv]: cfg.apiKey, CI: "true" },
      })
      if (status !== 0 || !out.includes(MARKER)) {
        console.error(`[smoke:opencode] harness output (first 4000 chars):\n${out.slice(0, 4000)}`)
      }
      expect({ status, out }).toMatchObject({ status: 0 })
      expect(out).toContain(MARKER)
    },
    600_000,
  )
})
