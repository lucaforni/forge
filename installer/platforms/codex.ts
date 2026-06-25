/**
 * installer/platforms/codex.ts — Codex CLI platform adapter.
 *
 * Defines the Codex CLI PlatformDescriptor and config.toml generation.
 * Implements OQ-04 resolution: generates native .codex/agents/*.toml
 * rather than relying on the .claude/agents/ fallback.
 */

import type { PlatformDescriptor, ForgeConfigModel } from "../types"
import { OPENCODE_DESCRIPTOR } from "./opencode"

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

export const CODEX_DESCRIPTOR: PlatformDescriptor = {
  id: "codex",
  label: "Codex CLI",
  rootDir: ".codex",
  configFile: ".codex/config.toml",
  agentsDir: ".codex/agents",
  commandsDir: ".codex/commands",
  skillsDir: ".agents/skills",     // Codex uses .agents/skills/, not .codex/skills/
  projectInstructions: "AGENTS.md", // Codex reads AGENTS.md natively
  mcpConfigTarget: "mcp_servers",
}

// ---------------------------------------------------------------------------
// Config Generation
// ---------------------------------------------------------------------------

/**
 * Generate `.codex/config.toml` from the internal config model.
 */
export function generateCodexConfig(model: ForgeConfigModel): string {
  const lines: string[] = []

  // MCP servers
  if (model.mcpServers.length > 0) {
    lines.push("[mcp_servers]")
    for (const server of model.mcpServers) {
      lines.push(`"${server.name}" = { command = "${escapeToml(server.command[0])}", args = [${server.command.slice(1).map((a) => `"${escapeToml(a)}"`).join(", ")}] }`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Codex Agent Format Generation (Markdown → TOML)
// ---------------------------------------------------------------------------

/**
 * TOML representation of a Codex subagent.
 * Based on Codex CLI's worker agent format.
 */
export interface CodexAgentToml {
  name: string
  description: string
  model?: string
  system_prompt?: string
}

/**
 * Generate a `.codex/agents/<name>.toml` file from an agent definition.
 *
 * This converts the canonical Markdown agent format to Codex's native TOML.
 * Used to avoid depending on Codex's `.claude/agents/` fallback (RISK-009).
 *
 * @param agentName - Agent name (e.g., "forge-pm")
 * @param description - Short description
 * @param systemPromptPath - Path to the system prompt file (relative to project root)
 */
export function generateCodexAgentToml(
  agentName: string,
  description: string,
  systemPromptPath?: string,
): string {
  const lines: string[] = []

  lines.push(`name = "${escapeToml(agentName)}"`)
  lines.push(`description = "${escapeToml(description)}"`)

  if (systemPromptPath) {
    lines.push(`system_prompt = { path = "${escapeToml(systemPromptPath)}" }`)
  }

  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escape a string for TOML basic strings.
 * Handles: backslash, double-quote, newline, carriage return, tab, form feed.
 */
function escapeToml(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\f/g, "\\f")
}
