/**
 * tests/unit/config.test.ts — Unit tests for installer/config.ts
 */

import { describe, it, expect } from "vitest"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  buildDefaultConfig,
  mergeConfig,
  defaultAgentConfigs,
  defaultMcpServerConfig,
  readExistingJsonConfig,
  stripJsonComments,
  DEFAULT_MODEL,
} from "../../installer/config"

describe("buildDefaultConfig", () => {
  it("includes all 9 FORGE agents", () => {
    const config = buildDefaultConfig("/test")
    expect(config.agents.length).toBe(9)
    expect(config.agents.map((a) => a.name)).toContain("forge-pm")
    expect(config.agents.map((a) => a.name)).toContain("forge-reviewer")
  })

  it("includes MCP server config", () => {
    const config = buildDefaultConfig("/test")
    expect(config.mcpServers.length).toBe(1)
    expect(config.mcpServers[0].name).toBe("forge-mcp-server")
  })
})

describe("defaultAgentConfigs", () => {
  it("returns all expected agents", () => {
    const agents = defaultAgentConfigs()
    const names = agents.map((a) => a.name)
    expect(names).toContain("forge")
    expect(names).toContain("forge-pm")
    expect(names).toContain("forge-architect")
    expect(names).toContain("forge-analyst")
    expect(names).toContain("forge-scrum")
    expect(names).toContain("forge-reviewer")
    expect(names).toContain("forge-reviewer-peer")
    expect(names).toContain("forge-qa")
    expect(names).toContain("forge-ux")
  })
})

describe("mergeConfig", () => {
  it("keeps FORGE agents on name conflict and warns", () => {
    const forge = buildDefaultConfig("/test")
    const user = { agents: [{ name: "forge-pm", description: "user override" }] }

    const { config, warnings } = mergeConfig(forge, user)
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings[0]).toContain("forge-pm")
  })

  it("preserves user-only agents", () => {
    const forge = buildDefaultConfig("/test")
    const user = { agents: [{ name: "my-custom-agent", description: "custom" }] }

    const { config } = mergeConfig(forge, user)
    expect(config.agents.length).toBe(10)
    expect(config.agents.some((a) => a.name === "my-custom-agent")).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Spec 004 — model tiers and existing-config loading
// ---------------------------------------------------------------------------

describe("model assignment (spec 004 FR-011)", () => {
  it("gives forge-reviewer-peer a different model family from forge-reviewer", () => {
    // Running both reviewers on the same family makes the dual-model review
    // structurally redundant — it satisfies the governance rule without
    // delivering the diversity the rule exists for (#66).
    const agents = defaultAgentConfigs()
    const reviewer = agents.find((a) => a.name === "forge-reviewer")
    const peer = agents.find((a) => a.name === "forge-reviewer-peer")

    expect(reviewer?.model).toBeDefined()
    expect(peer?.model).toBeDefined()
    expect(peer!.model).not.toBe(reviewer!.model)

    const family = (m: string) => m.split("/")[1]?.split("-")[0]
    expect(family(peer!.model!)).not.toBe(family(reviewer!.model!))
  })

  it("assigns a reasoning model to the reasoning-tier agents", () => {
    const byName = new Map(defaultAgentConfigs().map((a) => [a.name, a]))
    for (const name of ["forge-pm", "forge-architect", "forge-reviewer", "forge-ux"]) {
      expect(byName.get(name)?.model, `${name} should have an explicit model`).toBeDefined()
    }
  })

  it("provides a default model for agents without an override", () => {
    expect(buildDefaultConfig("/test").defaultModel).toBe(DEFAULT_MODEL)
  })
})

describe("readExistingJsonConfig", () => {
  function withFile(content: string | null, fn: (p: string) => void) {
    const dir = mkdtempSync(join(tmpdir(), "forge-cfg-"))
    const p = join(dir, "opencode.json")
    if (content !== null) writeFileSync(p, content, "utf-8")
    try { fn(p) } finally { rmSync(dir, { recursive: true, force: true }) }
  }

  it("reports a missing file as not existing", () => {
    withFile(null, (p) => {
      const r = readExistingJsonConfig(p)
      expect(r.existed).toBe(false)
      expect(r.malformed).toBe(false)
    })
  })

  it("parses a plain JSON config", () => {
    withFile('{"model":"custom/model"}', (p) => {
      const r = readExistingJsonConfig(p)
      expect(r.existed).toBe(true)
      expect(r.malformed).toBe(false)
      expect(r.data?.model).toBe("custom/model")
    })
  })

  it("parses JSONC — OpenCode configs legitimately contain comments", () => {
    // A plain JSON.parse would classify this valid config as malformed and
    // overwrite the user's file.
    withFile(`{
  // the default model
  "model": "custom/model", /* inline */
  "agent": { "forge": {} },
}`, (p) => {
      const r = readExistingJsonConfig(p)
      expect(r.malformed).toBe(false)
      expect(r.data?.model).toBe("custom/model")
    })
  })

  it("does not strip a // sequence inside a string value", () => {
    withFile('{"url":"https://example.com/x"}', (p) => {
      const r = readExistingJsonConfig(p)
      expect(r.malformed).toBe(false)
      expect(r.data?.url).toBe("https://example.com/x")
    })
  })

  it("flags genuinely malformed content instead of silently discarding it", () => {
    withFile("{ this is not json", (p) => {
      const r = readExistingJsonConfig(p)
      expect(r.existed).toBe(true)
      expect(r.malformed).toBe(true)
    })
  })

  it("treats an empty file as an empty object", () => {
    withFile("   \n", (p) => {
      const r = readExistingJsonConfig(p)
      expect(r.malformed).toBe(false)
      expect(r.data).toEqual({})
    })
  })

  it("rejects a top-level array", () => {
    withFile("[1,2,3]", (p) => {
      expect(readExistingJsonConfig(p).malformed).toBe(true)
    })
  })
})

describe("stripJsonComments — adversarial inputs", () => {
  /**
   * A naive `/,(\s*[}\]])/g` pass over the whole document deletes commas
   * that live inside legitimate string values. The corrupted document still
   * parses, so the damage is silent and gets written straight back to the
   * user's config.
   */
  const roundTrips: Array<[name: string, input: string]> = [
    ["comma before brace inside a string", '{"a":"hello, }"}'],
    ["comma before bracket inside a string", '{"a":"x, ]"}'],
    ["escaped quote then comma-brace", '{"a":"he said \\"hi\\", }"}'],
    ["block-comment terminator inside a string", '{"a":"x */ y"}'],
    ["line-comment marker inside a string", '{"url":"https://example.com/a"}'],
    ["trailing backslash in a string", '{"a":"c:\\\\","b":2}'],
    ["newline escape before comma-brace", '{"a":"line\\n, }"}'],
  ]

  for (const [name, input] of roundTrips) {
    it(`preserves the value exactly — ${name}`, () => {
      const out = stripJsonComments(input)
      expect(JSON.parse(out)).toEqual(JSON.parse(input))
    })
  }

  const trailingCommas: Array<[name: string, input: string, expected: unknown]> = [
    ["object", '{"a":1,}', { a: 1 }],
    ["array", '{"a":[1,2,]}', { a: [1, 2] }],
    ["nested", '{"a":{"b":[1,],},}', { a: { b: [1] } }],
    ["after a line comment", '{"a":1, // note\n}', { a: 1 }],
    ["after a block comment", '{"a":1, /* note */ }', { a: 1 }],
  ]

  for (const [name, input, expected] of trailingCommas) {
    it(`removes a trailing comma — ${name}`, () => {
      expect(JSON.parse(stripJsonComments(input))).toEqual(expected)
    })
  }

  it("leaves an unterminated block comment unparseable rather than guessing", () => {
    // Recovering here would mean silently reinterpreting a broken file.
    // Failing to parse routes it to backup-then-replace instead.
    expect(() => JSON.parse(stripJsonComments('{"a":1 /* oops'))).toThrow()
  })

  it("leaves an unterminated string unparseable rather than guessing", () => {
    expect(() => JSON.parse(stripJsonComments('{"a":"oops'))).toThrow()
  })
})
