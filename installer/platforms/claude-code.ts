/**
 * installer/platforms/claude-code.ts — Claude Code platform adapter.
 *
 * Defines the Claude Code PlatformDescriptor and settings.json generation.
 */

import type { PlatformDescriptor, ForgeConfigModel, McpServerConfig } from "../types"

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

export const CLAUDE_CODE_DESCRIPTOR: PlatformDescriptor = {
  id: "claude-code",
  label: "Claude Code",
  rootDir: ".claude",
  configFile: ".claude/settings.json",
  agentsDir: ".claude/agents",
  commandsDir: ".claude/commands",
  skillsDir: ".claude/skills",
  hooksDir: ".claude/hooks",
  projectInstructions: "CLAUDE.md",
  mcpConfigTarget: "mcpServers",
}

// ---------------------------------------------------------------------------
// Config Generation
// ---------------------------------------------------------------------------

/**
 * Generate `.claude/settings.json` from the internal config model.
 * Claude Code's settings schema uses `mcpServers` for MCP configuration.
 */
export function generateClaudeCodeConfig(model: ForgeConfigModel): string {
  const settings: Record<string, unknown> = {}

  // MCP servers → mcpServers
  if (model.mcpServers.length > 0) {
    const mcpServers: Record<string, unknown> = {}
    for (const server of model.mcpServers) {
      const cfg: Record<string, unknown> = {
        type: "stdio",
        command: server.command[0],
      }
      if (server.command.length > 1) {
        cfg.args = server.command.slice(1)
      }
      if (server.env) {
        cfg.env = server.env
      }
      mcpServers[server.name] = cfg
    }
    settings.mcpServers = mcpServers
  }

  return JSON.stringify(settings, null, 2)
}

// ---------------------------------------------------------------------------
// CLAUDE.md Generator
// ---------------------------------------------------------------------------

/**
 * Generate `CLAUDE.md` content that imports the canonical `AGENTS.md`.
 * Uses Claude Code's `@AGENTS.md` import syntax (FR-008 / OQ-05 recommendation).
 */
export function generateClaudeMd(): string {
  return `<!-- FORGE: auto-generated. Edits go in AGENTS.md (canonical source). -->
@AGENTS.md
`
}
