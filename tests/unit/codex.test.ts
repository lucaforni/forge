/**
 * tests/unit/codex.test.ts — Unit tests for installer/platforms/codex.ts
 */

import { describe, it, expect } from "vitest"
import { generateCodexConfig, generateCodexAgentToml } from "../../installer/platforms/codex"
import { buildDefaultConfig } from "../../installer/config"

describe("generateCodexConfig", () => {
  it("generates valid TOML with MCP server config", () => {
    const config = buildDefaultConfig("/test")
    const toml = generateCodexConfig(config)

    expect(toml).toContain("[mcp_servers]")
    expect(toml).toContain("forge-mcp-server")
    expect(toml).toContain(".forge/mcp-server/index.ts")
  })

  it("returns empty string when no MCP servers", () => {
    const config = buildDefaultConfig("/test")
    config.mcpServers = []
    const toml = generateCodexConfig(config)
    expect(toml.trim()).toBe("")
  })
})

describe("generateCodexAgentToml", () => {
  it("generates TOML with name and description", () => {
    const toml = generateCodexAgentToml("forge-pm", "FORGE product manager")
    expect(toml).toContain('name = "forge-pm"')
    expect(toml).toContain('description = "FORGE product manager"')
  })

  it("includes system_prompt path when provided", () => {
    const toml = generateCodexAgentToml("forge-pm", "PM", ".opencode/agents/forge-pm.md")
    expect(toml).toContain("system_prompt")
    expect(toml).toContain(".opencode/agents/forge-pm.md")
  })

  it("escapes special characters in strings", () => {
    const toml = generateCodexAgentToml('forge-test', 'description with "quotes" and \\backslashes')
    expect(toml).toContain('\\"')
    expect(toml).toContain("\\\\")
  })
})
