/**
 * tests/unit/platforms.test.ts — Cross-platform descriptor + config tests.
 *
 * Level 2 of the harness-test strategy: verifies that FORGE projects onto
 * each supported harness layout (opencode, claude-code, codex) without
 * touching real CLIs or networks.
 */

import { describe, it, expect } from "vitest"
import { OPENCODE_DESCRIPTOR } from "../../installer/platforms/opencode"
import {
  CLAUDE_CODE_DESCRIPTOR,
  generateClaudeCodeConfig,
  generateClaudeMd,
} from "../../installer/platforms/claude-code"
import { CODEX_DESCRIPTOR } from "../../installer/platforms/codex"
import { buildDefaultConfig } from "../../installer/config"

describe("platform descriptors", () => {
  it("opencode points at .opencode/ with AGENTS.md", () => {
    expect(OPENCODE_DESCRIPTOR.id).toBe("opencode")
    expect(OPENCODE_DESCRIPTOR.rootDir).toBe(".opencode")
    expect(OPENCODE_DESCRIPTOR.configFile).toBe("opencode.json")
    expect(OPENCODE_DESCRIPTOR.agentsDir).toBe(".opencode/agents")
    expect(OPENCODE_DESCRIPTOR.commandsDir).toBe(".opencode/commands")
    expect(OPENCODE_DESCRIPTOR.projectInstructions).toBe("AGENTS.md")
  })

  it("claude-code points at .claude/ with CLAUDE.md", () => {
    expect(CLAUDE_CODE_DESCRIPTOR.id).toBe("claude-code")
    expect(CLAUDE_CODE_DESCRIPTOR.rootDir).toBe(".claude")
    expect(CLAUDE_CODE_DESCRIPTOR.configFile).toBe(".claude/settings.json")
    expect(CLAUDE_CODE_DESCRIPTOR.agentsDir).toBe(".claude/agents")
    expect(CLAUDE_CODE_DESCRIPTOR.commandsDir).toBe(".claude/commands")
    expect(CLAUDE_CODE_DESCRIPTOR.projectInstructions).toBe("CLAUDE.md")
    expect(CLAUDE_CODE_DESCRIPTOR.mcpConfigTarget).toBe("mcpServers")
  })

  it("codex points at .codex/ with AGENTS.md natively", () => {
    expect(CODEX_DESCRIPTOR.id).toBe("codex")
    expect(CODEX_DESCRIPTOR.rootDir).toBe(".codex")
    expect(CODEX_DESCRIPTOR.configFile).toBe(".codex/config.toml")
    expect(CODEX_DESCRIPTOR.projectInstructions).toBe("AGENTS.md")
    expect(CODEX_DESCRIPTOR.mcpConfigTarget).toBe("mcp_servers")
  })

  it("all descriptors have distinct roots and config files", () => {
    const ds = [OPENCODE_DESCRIPTOR, CLAUDE_CODE_DESCRIPTOR, CODEX_DESCRIPTOR]
    expect(new Set(ds.map((d) => d.id)).size).toBe(3)
    expect(new Set(ds.map((d) => d.rootDir)).size).toBe(3)
    expect(new Set(ds.map((d) => d.configFile)).size).toBe(3)
  })
})

describe("generateClaudeCodeConfig", () => {
  it("emits valid JSON with stdio mcpServers mapping", () => {
    const settings = JSON.parse(generateClaudeCodeConfig(buildDefaultConfig("/proj")))
    expect(settings.mcpServers["forge-mcp-server"].type).toBe("stdio")
    expect(settings.mcpServers["forge-mcp-server"].command).toBe("node")
    expect(settings.mcpServers["forge-mcp-server"].args).toContain(
      ".forge/mcp-server/index.ts",
    )
  })

  it("maps multi-word commands to command + args", () => {
    const model = buildDefaultConfig("/proj")
    model.mcpServers = [
      { name: "s", command: ["npx", "-y", "pkg", "run"], env: { K: "V" } },
    ]
    const settings = JSON.parse(generateClaudeCodeConfig(model))
    expect(settings.mcpServers.s).toMatchObject({
      type: "stdio",
      command: "npx",
      args: ["-y", "pkg", "run"],
      env: { K: "V" },
    })
  })

  it("emits empty object without MCP servers", () => {
    const model = buildDefaultConfig("/proj")
    model.mcpServers = []
    expect(generateClaudeCodeConfig(model).trim()).toBe("{}")
  })
})

describe("generateClaudeMd", () => {
  it("imports the canonical AGENTS.md", () => {
    expect(generateClaudeMd()).toContain("@AGENTS.md")
  })
})
