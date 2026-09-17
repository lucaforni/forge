/**
 * tests/unit/platforms.test.ts — Cross-platform descriptor + config tests.
 *
 * Level 2 of the harness-test strategy: verifies that FORGE projects onto
 * each supported harness layout (opencode, claude-code, codex) without
 * touching real CLIs or networks.
 */

import { describe, it, expect } from "vitest"
import { buildDefaultConfig } from "../../installer/config"
import { OPENCODE_DESCRIPTOR, generateOpenCodeConfig } from "../../installer/platforms/opencode"
import {
  CLAUDE_CODE_DESCRIPTOR,
  generateClaudeCodeConfig,
  generateClaudeMd,
} from "../../installer/platforms/claude-code"
import { CODEX_DESCRIPTOR } from "../../installer/platforms/codex"

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

// ---------------------------------------------------------------------------
// Spec 004 — opencode.json generation and merging
// ---------------------------------------------------------------------------

describe("generateOpenCodeConfig (spec 004)", () => {
  const model = buildDefaultConfig("/test")
  const parse = (s: string) => JSON.parse(s) as Record<string, any>

  it("loads the constitution via instructions", () => {
    // This is the mechanism by which governance reaches the model. Omitting
    // it made every compliance check vacuous in user projects (#57).
    const cfg = parse(generateOpenCodeConfig(model))
    expect(cfg.instructions).toContain(".forge/constitution.md")
    expect(cfg.instructions).toContain(".forge/knowledge/decision-log.md")
  })

  it("emits default_agent, model, permission, agent and mcp", () => {
    const cfg = parse(generateOpenCodeConfig(model))
    expect(cfg.default_agent).toBe("forge")
    expect(cfg.model).toBeDefined()
    expect(cfg.permission).toBeDefined()
    expect(Object.keys(cfg.agent)).toHaveLength(9)
    expect(cfg.mcp["forge-mcp-server"]).toBeDefined()
  })

  it("does not pre-approve destructive shell commands", () => {
    const bash = parse(generateOpenCodeConfig(model)).permission.bash
    expect(bash["*"]).toBe("ask")
    for (const key of Object.keys(bash)) {
      expect(key.startsWith("rm "), `"${key}" must not be pre-approved`).toBe(false)
    }
  })

  it("assigns the peer reviewer a different model from the reviewer", () => {
    const agent = parse(generateOpenCodeConfig(model)).agent
    expect(agent["forge-reviewer-peer"].model).not.toBe(agent["forge-reviewer"].model)
  })

  it("preserves unknown user keys", () => {
    const cfg = parse(generateOpenCodeConfig(model, {
      theme: "dracula",
      custom_thing: { nested: true },
    }))
    expect(cfg.theme).toBe("dracula")
    expect(cfg.custom_thing).toEqual({ nested: true })
  })

  it("does not override a user's explicit model choice", () => {
    const cfg = parse(generateOpenCodeConfig(model, { model: "my-provider/my-model" }))
    expect(cfg.model).toBe("my-provider/my-model")
  })

  it("does not rewrite an existing permission block", () => {
    // Silently narrowing or widening a user's permissions would be a
    // security regression in both directions.
    const userPerm = { bash: { "*": "deny" } }
    const cfg = parse(generateOpenCodeConfig(model, { permission: userPerm }))
    expect(cfg.permission).toEqual(userPerm)
  })

  it("keeps a user's per-agent override while still registering FORGE agents", () => {
    const cfg = parse(generateOpenCodeConfig(model, {
      agent: { "forge-pm": { model: "user/pinned" }, "my-agent": { model: "x/y" } },
    }))
    expect(cfg.agent["forge-pm"].model).toBe("user/pinned")
    expect(cfg.agent["my-agent"]).toEqual({ model: "x/y" })
    expect(cfg.agent["forge-reviewer"]).toBeDefined()
  })

  it("preserves a user's other MCP servers", () => {
    const cfg = parse(generateOpenCodeConfig(model, {
      mcp: { github: { type: "local", command: ["npx", "server-github"] } },
    }))
    expect(cfg.mcp.github).toBeDefined()
    expect(cfg.mcp["forge-mcp-server"]).toBeDefined()
  })

  it("always refreshes FORGE-managed keys even when a config exists", () => {
    const cfg = parse(generateOpenCodeConfig(model, {
      instructions: ["stale.md"],
      default_agent: "something-else",
    }))
    expect(cfg.instructions).toContain(".forge/constitution.md")
    expect(cfg.default_agent).toBe("forge")
  })

  it("produces valid JSON ending in a newline", () => {
    const out = generateOpenCodeConfig(model)
    expect(out.endsWith("\n")).toBe(true)
    expect(() => JSON.parse(out)).not.toThrow()
  })
})

describe("generateOpenCodeConfig — user instruction files (FR-009)", () => {
  const model = buildDefaultConfig("/test")

  it("keeps a project's own instruction files alongside the FORGE ones", () => {
    // FORGE requires the constitution to be loaded. It has no business
    // deleting instruction files the project added itself.
    const cfg = JSON.parse(generateOpenCodeConfig(model, {
      instructions: [".forge/team-conventions.md", "docs/glossary.md"],
    }))
    expect(cfg.instructions).toContain(".forge/constitution.md")
    expect(cfg.instructions).toContain(".forge/knowledge/decision-log.md")
    expect(cfg.instructions).toContain(".forge/team-conventions.md")
    expect(cfg.instructions).toContain("docs/glossary.md")
  })

  it("does not duplicate an entry the user already listed", () => {
    const cfg = JSON.parse(generateOpenCodeConfig(model, {
      instructions: [".forge/constitution.md"],
    }))
    const occurrences = cfg.instructions.filter((i: string) => i === ".forge/constitution.md")
    expect(occurrences).toHaveLength(1)
  })

  it("ignores a non-array instructions value without crashing", () => {
    const cfg = JSON.parse(generateOpenCodeConfig(model, { instructions: "oops" }))
    expect(cfg.instructions).toEqual([
      ".forge/constitution.md",
      ".forge/knowledge/decision-log.md",
    ])
  })

  it("warns instead of silently discarding a non-object agent block", () => {
    const warnings: string[] = []
    generateOpenCodeConfig(model, { agent: "not-an-object" }, warnings)
    expect(warnings.some((w) => w.includes('"agent"'))).toBe(true)
  })

  it("warns instead of silently discarding a non-object mcp block", () => {
    const warnings: string[] = []
    generateOpenCodeConfig(model, { mcp: ["nope"] }, warnings)
    expect(warnings.some((w) => w.includes('"mcp"'))).toBe(true)
  })
})
