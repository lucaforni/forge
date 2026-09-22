/**
 * installer/platforms/codex.ts — Codex CLI platform adapter.
 *
 * Defines the Codex CLI PlatformDescriptor and config.toml generation.
 * Implements OQ-04 resolution: generates native .codex/agents/*.toml
 * rather than relying on the .claude/agents/ fallback.
 */

import type { PlatformDescriptor, ForgeConfigModel, CanonicalArtifact } from "../types"
import { parseFrontmatter, renderProjected, frontmatterValue } from "../frontmatter"
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

// ---------------------------------------------------------------------------
// Artifact Projection (OpenCode -> Codex CLI)
// ---------------------------------------------------------------------------

/**
 * Project one canonical artifact to its Codex form. Returns a list because
 * one agent definition becomes two files (native TOML + Markdown companion).
 *
 * - Skills map to `.agents/skills/` at the PROJECT ROOT (leading `/`
 *   tells the plan builder to join against the target root instead of
 *   `.codex/`). Without this, skills land in `.codex/.agents/skills/`,
 *   which Codex does not read.
 * - Agents become `.codex/agents/<name>.toml` (native format, avoiding the
 *   `.claude/agents/` fallback per OQ-04/RISK-009) plus a frontmatter-free
 *   `.codex/agents/<name>.md` companion carrying the system prompt the TOML
 *   points at. OpenCode frontmatter keys would be meaningless inside a
 *   system prompt, so the companion ships body-only.
 * - Commands stay `.codex/commands/*.md` per normative spec 001 FR-006
 *   (the `prompts/` alternative was unverified speculation). `agent:` /
 *   `subtask:` / `subagent:` are dropped with a neutral note: Codex has no
 *   verified subtask mechanism, and inventing one would be worse than
 *   running inline.
 *   `$ARGUMENTS` is kept as-is for the same reason — rewriting it to
 *   unverified Codex syntax would trade a maybe for a certainly.
 */
export function projectCodexArtifact(artifact: CanonicalArtifact): Array<{
  relTarget: string
  content: string
}> {
  const content = artifact.content ?? ""
  const { entries } = parseFrontmatter(content)

  if (artifact.category === "skill") {
    const rel = artifact.sourcePath.replace(/^skills\//, ".agents/skills/")
    const kept = entries.filter((e) => e.key !== "compatibility")
    return [{ relTarget: `/${rel}`, content: renderProjected(content, kept) }]
  }

  if (artifact.category === "agent") {
    const name = artifact.sourcePath.split("/").pop()?.replace(/\.md$/, "") ?? "unknown"
    const description = frontmatterValue(entries, "description") ?? name
    const mdTarget = artifact.sourcePath // .codex/agents/<name>.md
    const tomlTarget = mdTarget.replace(/\.md$/, ".toml")
    return [
      { relTarget: mdTarget, content: renderProjected(content, []) },
      {
        relTarget: tomlTarget,
        content: generateCodexAgentToml(name, description, `.codex/${mdTarget}`),
      },
    ]
  }

  if (artifact.category === "command") {
    const agentName = frontmatterValue(entries, "agent")
    const kept = entries.filter((e) => e.key !== "agent" && e.key !== "subtask" && e.key !== "subagent")
    let out = renderProjected(content, kept)
    if (agentName) {
      const note =
        `\n> **Note:** This command was designed to run in the ` +
        `\`${agentName}\` subagent; on this platform it runs inline.\n`
      const lines = out.split("\n")
      const titleIdx = lines.findIndex((l) => l.startsWith("# "))
      if (titleIdx === -1) {
        out = note.trimStart() + "\n" + out
      } else {
        lines.splice(titleIdx + 1, 0, ...note.split("\n"))
        out = lines.join("\n")
      }
    }
    return [{ relTarget: artifact.sourcePath, content: out }]
  }

  return [{ relTarget: artifact.sourcePath, content }]
}

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
