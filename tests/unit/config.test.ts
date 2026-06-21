/**
 * tests/unit/config.test.ts — Unit tests for installer/config.ts
 */

import { describe, it, expect } from "vitest"
import { buildDefaultConfig, mergeConfig, defaultAgentConfigs, defaultMcpServerConfig } from "../../installer/config"

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
