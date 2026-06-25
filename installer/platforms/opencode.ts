/**
 * installer/platforms/opencode.ts — OpenCode platform adapter.
 *
 * Defines the OpenCode PlatformDescriptor and config generation logic.
 * This is the reference platform — all others mirror its structure.
 */

import type { PlatformDescriptor, ForgeConfigModel } from "../types"

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

export const OPENCODE_DESCRIPTOR: PlatformDescriptor = {
  id: "opencode",
  label: "OpenCode",
  rootDir: ".opencode",
  configFile: "opencode.json",
  agentsDir: ".opencode/agents",
  commandsDir: ".opencode/commands",
  skillsDir: ".opencode/skills",
  hooksDir: ".opencode/plugins",
  projectInstructions: "AGENTS.md",
  mcpConfigTarget: "mcp",
}

// ---------------------------------------------------------------------------
// Config Generation
// ---------------------------------------------------------------------------

/**
 * Generate the platform-specific opencode.json content from the internal model.
 * Produces a JSON string matching the OpenCode schema.
 */
export function generateOpenCodeConfig(model: ForgeConfigModel): string {
  const config: Record<string, unknown> = {
    $schema: "https://opencode.ai/config.json",
    default_agent: "forge",
  }

  // Agent definitions
  if (model.agents.length > 0) {
    const agentConfig: Record<string, Record<string, unknown>> = {}
    for (const agent of model.agents) {
      const entry: Record<string, unknown> = {}
      if (agent.model) entry.model = agent.model
      if (agent.path) entry.path = agent.path
      agentConfig[agent.name] = entry
    }
    config.agent = agentConfig
  }

  // MCP servers
  if (model.mcpServers.length > 0) {
    const mcpConfig: Record<string, unknown> = {}
    for (const server of model.mcpServers) {
      mcpConfig[server.name] = {
        type: "local",
        command: server.command,
        ...(server.env ? { environment: server.env } : {}),
      }
    }
    config.mcp = mcpConfig
  }

  return JSON.stringify(config, null, 2)
}
