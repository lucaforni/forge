/**
 * installer/config.ts — FORGE configuration model builder.
 *
 * Builds the internal ForgeConfigModel from defaults and user overrides.
 * Used by platform adapters to generate platform-correct config files.
 */

import { readFileSync, existsSync } from "node:fs"
import { join, resolve } from "node:path"
import type { ForgeConfigModel, McpServerConfig, AgentConfig } from "./types"

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** Default MCP server config for the forge-mcp-server. */
export function defaultMcpServerConfig(projectRoot: string): McpServerConfig {
  // The MCP server is copied to the target project's .forge/mcp-server/
  // during installation. Reference it from there.
  return {
    name: "forge-mcp-server",
    command: ["npx", "-y", "tsx", ".forge/mcp-server/index.ts"],
  }
}

/** Default agent configurations for the internal model. */
export function defaultAgentConfigs(): AgentConfig[] {
  return [
    { name: "forge", description: "FORGE orchestrator" },
    { name: "forge-pm", description: "FORGE product manager" },
    { name: "forge-architect", description: "FORGE architect" },
    { name: "forge-analyst", description: "FORGE analyst" },
    { name: "forge-scrum", description: "FORGE scrum master" },
    { name: "forge-reviewer", description: "FORGE adversarial reviewer" },
    { name: "forge-reviewer-peer", description: "FORGE peer reviewer" },
    { name: "forge-qa", description: "FORGE QA engineer" },
    { name: "forge-ux", description: "FORGE UX designer" },
  ]
}

// ---------------------------------------------------------------------------
// Config Model Builder
// ---------------------------------------------------------------------------

/** Build the default FORGE configuration model. */
export function buildDefaultConfig(projectRoot: string): ForgeConfigModel {
  return {
    agents: defaultAgentConfigs(),
    mcpServers: [defaultMcpServerConfig(projectRoot)],
    hooks: [],
  }
}

// ---------------------------------------------------------------------------
// Config Merging (user config → FORGE config)
// ---------------------------------------------------------------------------

/**
 * Merge user-supplied config keys with FORGE defaults.
 * FORGE-managed keys win on conflict; user-only keys preserved.
 * Returns warnings for any conflicts detected.
 */
export function mergeConfig(
  forgeConfig: ForgeConfigModel,
  userConfig: Partial<ForgeConfigModel>,
): { config: ForgeConfigModel; warnings: string[] } {
  const warnings: string[] = []
  const merged: ForgeConfigModel = {
    agents: [...forgeConfig.agents],
    mcpServers: [...forgeConfig.mcpServers],
    hooks: [...forgeConfig.hooks],
  }

  // Merge agents — FORGE agents win on name conflict
  if (userConfig.agents) {
    const forgeAgentNames = new Set(merged.agents.map((a) => a.name))
    for (const userAgent of userConfig.agents) {
      if (forgeAgentNames.has(userAgent.name)) {
        warnings.push(
          `Agent "${userAgent.name}" exists in both FORGE and user config. FORGE definition kept.`,
        )
      } else {
        merged.agents.push(userAgent)
      }
    }
  }

  // Merge MCP servers — FORGE servers win on name conflict
  if (userConfig.mcpServers) {
    const forgeMcpNames = new Set(merged.mcpServers.map((m) => m.name))
    for (const userServer of userConfig.mcpServers) {
      if (forgeMcpNames.has(userServer.name)) {
        warnings.push(
          `MCP server "${userServer.name}" exists in both FORGE and user config. FORGE config kept.`,
        )
      } else {
        merged.mcpServers.push(userServer)
      }
    }
  }

  return { config: merged, warnings }
}
