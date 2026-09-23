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
import { resolveEffect, type PermissionRule } from "./permission-effect"

/** Project rules through the resolver (base policy prepended, last-match-wins). */
function effectiveEffect(
  permissions: Array<{ action: string; resource: string; effect: string }>,
  action: string,
  resource: string,
): string {
  return resolveEffect(permissions as PermissionRule[], action, resource)
}

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

  it("keeps the V1-compat instructions key for the constitution", () => {
    // OpenCode v2 accepts but does not resolve `instructions`; governance is
    // actually loaded by the session-knowledge plugin's context hook. The key
    // is retained only for V1 compatibility (#57, spec 004 FR-008, spec 010).
    const cfg = parse(generateOpenCodeConfig(model))
    expect(cfg.instructions).toContain(".forge/constitution.md")
    expect(cfg.instructions).toContain(".forge/knowledge/decision-log.md")
  })

  it("emits default_agent, model, permissions, agents and mcp.servers (native v2)", () => {
    const cfg = parse(generateOpenCodeConfig(model))
    expect(cfg.default_agent).toBe("forge")
    expect(cfg.model).toBeDefined()
    expect(Array.isArray(cfg.permissions)).toBe(true)
    expect(cfg.agent).toBeUndefined()
    expect(Object.keys(cfg.agents)).toHaveLength(9)
    expect(cfg.mcp.servers["forge-mcp-server"]).toBeDefined()
  })

  it("orders shell rules broadest-first so exceptions win (v2 last-match-wins)", () => {
    const permissions = parse(generateOpenCodeConfig(model)).permissions
    const shellRules = permissions.filter((p: any) => p.action === "shell")
    // The catch-all `ask` must precede the specific allows. Reversed, the
    // catch-all would shadow every allow and the allowlist would be inert.
    expect(shellRules[0]).toMatchObject({ resource: "*", effect: "ask" })
    const lastShellAllow = [...shellRules].reverse().find((p: any) => p.effect === "allow")
    expect(lastShellAllow?.resource).not.toBe("*")
  })

  it("resolves the intended allowlist using last-match-wins semantics", () => {
    const permissions = parse(generateOpenCodeConfig(model)).permissions
    expect(effectiveEffect(permissions, "shell", "git status")).toBe("allow")
    expect(effectiveEffect(permissions, "shell", "git status --short")).toBe("allow")
    expect(effectiveEffect(permissions, "shell", "git branch")).toBe("allow")
    expect(effectiveEffect(permissions, "shell", "git branch --list")).toBe("allow")
    expect(effectiveEffect(permissions, "shell", "pwd")).toBe("allow")
    expect(effectiveEffect(permissions, "shell", "npm test")).toBe("allow")
    expect(effectiveEffect(permissions, "edit", "src/a.ts")).toBe("ask")
    expect(effectiveEffect(permissions, "read", "src/a.ts")).toBe("allow")
  })

  it("keeps the .env guard despite the broad read allow", () => {
    // OpenCode's base policy asks before .env reads, but project rules load
    // after it — a bare `read * allow` would silently swallow that guard.
    // The seed re-asserts it, so secrets still prompt (spec 010 review).
    const permissions = parse(generateOpenCodeConfig(model)).permissions
    expect(effectiveEffect(permissions, "read", ".env")).toBe("ask")
    expect(effectiveEffect(permissions, "read", ".env.local")).toBe("ask")
    expect(effectiveEffect(permissions, "read", "config/.env")).toBe("ask")
    expect(effectiveEffect(permissions, "read", ".env.example")).toBe("allow")
  })

  it("does not pre-approve ref-mutating git branch forms", () => {
    const permissions = parse(generateOpenCodeConfig(model)).permissions
    expect(effectiveEffect(permissions, "shell", "git branch -D feature")).toBe("ask")
    expect(effectiveEffect(permissions, "shell", "git branch -M main")).toBe("ask")
  })

  it("migrates an untouched pre-fix FORGE default to the fixed order", () => {
    // Historical record of the seed emitted before the T-020 reorder fix.
    // A byte-identical block means the user never customized it, so
    // regenerating it is a migration, not a rewrite of user content.
    const legacySeed = [
      { action: "shell", resource: "git status", effect: "allow" },
      { action: "shell", resource: "git branch", effect: "allow" },
      { action: "shell", resource: "pwd", effect: "allow" },
      { action: "shell", resource: "npm test", effect: "allow" },
      { action: "shell", resource: "*", effect: "ask" },
      { action: "read", resource: "*", effect: "allow" },
      { action: "glob", resource: "*", effect: "allow" },
      { action: "grep", resource: "*", effect: "allow" },
      { action: "skill", resource: "*", effect: "allow" },
      { action: "question", resource: "*", effect: "allow" },
      { action: "edit", resource: "*", effect: "ask" },
    ]
    const warnings: string[] = []
    const cfg = parse(generateOpenCodeConfig(model, { permissions: legacySeed }, warnings))
    const shellRules = cfg.permissions.filter((p: any) => p.action === "shell")
    expect(shellRules[0]).toMatchObject({ resource: "*", effect: "ask" })
    expect(effectiveEffect(cfg.permissions, "shell", "git status")).toBe("allow")
    expect(effectiveEffect(cfg.permissions, "read", ".env")).toBe("ask")
    expect(warnings.some((w) => w.includes('"permissions"'))).toBe(true)
  })

  it("does not pre-approve destructive shell commands", () => {
    const permissions = parse(generateOpenCodeConfig(model)).permissions
    expect(effectiveEffect(permissions, "shell", "rm -rf /")).toBe("ask")
    for (const rule of permissions) {
      if (rule.effect === "allow" && typeof rule.resource === "string") {
        expect(rule.resource.startsWith("rm "), `"${rule.resource}" must not be pre-approved`).toBe(false)
      }
    }
  })

  it("assigns the peer reviewer a different model from the reviewer", () => {
    const agents = parse(generateOpenCodeConfig(model)).agents
    expect(agents["forge-reviewer-peer"].model).not.toBe(agents["forge-reviewer"].model)
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

  it("does not rewrite an existing permission block of either shape", () => {
    // Silently narrowing or widening a user's permissions would be a
    // security regression in both directions.
    const legacyPerm = { bash: { "*": "deny" } }
    const legacy = parse(generateOpenCodeConfig(model, { permission: legacyPerm }))
    expect(legacy.permission).toEqual(legacyPerm)
    expect(legacy.permissions).toBeUndefined()

    const nativePerm = [{ action: "edit", resource: "*", effect: "deny" }]
    const native = parse(generateOpenCodeConfig(model, { permissions: nativePerm }))
    expect(native.permissions).toEqual(nativePerm)
  })

  it("migrates a legacy agent map into native agents", () => {
    const cfg = parse(generateOpenCodeConfig(model, {
      agent: { "forge-pm": { model: "user/pinned" }, "my-agent": { model: "x/y" } },
    }))
    expect(cfg.agents["forge-pm"].model).toBe("user/pinned")
    expect(cfg.agents["my-agent"]).toEqual({ model: "x/y" })
    expect(cfg.agents["forge-reviewer"]).toBeDefined()
    // Folded into `agents` — the legacy key must not linger.
    expect(cfg.agent).toBeUndefined()
  })

  it("merges native and legacy agent maps with native winning", () => {
    const cfg = parse(generateOpenCodeConfig(model, {
      agent: { "forge-pm": { model: "legacy/pinned", extra: "kept" } },
      agents: { "forge-pm": { model: "native/pinned" } },
    }))
    expect(cfg.agents["forge-pm"].model).toBe("native/pinned")
    expect(cfg.agents["forge-pm"].extra).toBe("kept")
  })

  it("preserves a user's other MCP servers and writes FORGE servers natively", () => {
    const cfg = parse(generateOpenCodeConfig(model, {
      mcp: { github: { type: "local", command: ["npx", "server-github"] } },
    }))
    expect(cfg.mcp.github).toBeDefined()
    expect(cfg.mcp.servers["forge-mcp-server"]).toBeDefined()
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

  it("warns instead of silently discarding a non-object agents block", () => {
    const warnings: string[] = []
    generateOpenCodeConfig(model, { agents: "not-an-object" }, warnings)
    expect(warnings.some((w) => w.includes('"agents"'))).toBe(true)
  })

  it("warns instead of silently discarding a non-object mcp block", () => {
    const warnings: string[] = []
    generateOpenCodeConfig(model, { mcp: ["nope"] }, warnings)
    expect(warnings.some((w) => w.includes('"mcp"'))).toBe(true)
  })
})
