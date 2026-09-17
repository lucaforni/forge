/**
 * installer/platforms/claude-code.ts — Claude Code platform adapter.
 *
 * Defines the Claude Code PlatformDescriptor and settings.json generation.
 */

import type { PlatformDescriptor, ForgeConfigModel, McpServerConfig, CanonicalArtifact } from "../types"
import { parseFrontmatter, renderProjected, frontmatterValue, type FrontmatterEntry } from "../frontmatter"

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

// ---------------------------------------------------------------------------
// Artifact Projection (OpenCode -> Claude Code)
// ---------------------------------------------------------------------------

/**
 * OpenCode permission key -> Claude Code tool name. Every key observed in
 * the shipped agents is mapped; an unmapped key drops the whole `tools:`
 * line (fail open, documented in-file) rather than emitting a tool Claude
 * does not have.
 */
const TOOL_MAP: Record<string, string> = {
  read: "Read",
  glob: "Glob",
  grep: "Grep",
  edit: "Edit",
  write: "Write",
  bash: "Bash",
  webfetch: "WebFetch",
  task: "Task",
  skill: "Skill",
  todowrite: "TodoWrite",
  todoread: "TodoWrite",
  question: "AskUserQuestion",
}

/** Frontmatter keys that are meaningless on Claude Code. */
const DROPPED_AGENT_KEYS = ["mode", "variant", "permission"]
const DROPPED_COMMAND_KEYS = ["agent", "subtask"]

/**
 * Project one canonical artifact to its Claude Code form.
 *
 * - Agents gain the required `name:` (from the filename) and a `tools:`
 *   allowlist mapped from the OpenCode permission block. Bash
 *   command-filters and `"*": deny` cannot be expressed in frontmatter and
 *   are recorded in a `# NOTE` comment with guidance to re-apply them in
 *   `settings.json` — silently broadening reviewers to unrestricted Bash
 *   would be worse than documenting the delta.
 * - Commands lose `agent:`/`subtask:` (no such routing on Claude) and gain
 *   an explicit Task-tool routing step, so subagent orchestration survives
 *   instead of collapsing onto the main agent.
 * - Skills lose `compatibility: opencode`, which is false elsewhere.
 */
export function projectClaudeArtifact(artifact: CanonicalArtifact): {
  relTarget: string
  content: string
} {
  const content = artifact.content ?? ""
  const { entries } = parseFrontmatter(content)

  if (artifact.category === "agent") {
    return { relTarget: artifact.sourcePath, content: projectClaudeAgent(artifact, entries) }
  }
  if (artifact.category === "command") {
    return { relTarget: artifact.sourcePath, content: projectClaudeCommand(content, entries) }
  }
  // Skills (and anything else): drop the platform claim, keep the rest.
  const kept = entries.filter((e) => e.key !== "compatibility")
  return { relTarget: artifact.sourcePath, content: renderProjected(content, kept) }
}

function projectClaudeAgent(
  artifact: CanonicalArtifact,
  entries: FrontmatterEntry[],
): string {
  const name = artifact.sourcePath.split("/").pop()?.replace(/\.md$/, "") ?? "unknown"
  const out: FrontmatterEntry[] = [{ key: "name", lines: [`name: ${name}`] }]

  for (const entry of entries) {
    if (DROPPED_AGENT_KEYS.includes(entry.key)) continue
    out.push(entry)
  }

  const permEntry = entries.find((e) => e.key === "permission")
  if (permEntry) {
    const { tools, notes } = mapPermissionBlock(permEntry.lines.slice(1))
    if (tools.length > 0) {
      out.push({ key: "tools", lines: [`tools: ${tools.join(", ")}`] })
    }
    for (const note of notes) {
      out.push({ key: `# NOTE: ${note}`, lines: [`# NOTE: ${note}`] })
    }
  }

  return renderProjected(contentOf(artifact), out)
}

function contentOf(artifact: CanonicalArtifact): string {
  return artifact.content ?? ""
}

/**
 * Map an OpenCode permission block (lines after `permission:`) to Claude
 * tools. Returns the allowlist plus human-readable notes for everything
 * that could not be expressed.
 */
export function mapPermissionBlock(lines: string[]): { tools: string[]; notes: string[] } {
  const tools: string[] = []
  const notes: string[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    const m = line.match(/^  ([A-Za-z0-9_-]+):/)
    if (!m) continue
    const key = m[1]
    const mapped = TOOL_MAP[key]
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped)
      tools.push(mapped)
    } else if (!mapped) {
      notes.push(`unmapped OpenCode permission '${key}' — verify '${key}' coverage manually`)
    }
  }

  const nested = lines.filter((l) => /^    /.test(l))
  const restricted = nested.filter((l) => /deny|"[\w*][^"]*"\s*:/.test(l))
  if (nested.length > 0 && restricted.length > 0) {
    const examples = restricted
      .slice(0, 4)
      .map((l) => l.trim())
      .join(", ")
    notes.push(
      `original restricted bash/deny rules not expressible here (${examples}` +
        `${restricted.length > 4 ? ", …" : ""}); re-apply narrowly in settings.json if needed`,
    )
  }

  return { tools, notes }
}

function projectClaudeCommand(content: string, entries: FrontmatterEntry[]): string {
  const agentName = frontmatterValue(entries, "agent")
  const kept = entries.filter((e) => !DROPPED_COMMAND_KEYS.includes(e.key))
  let out = renderProjected(content, kept)

  if (agentName) {
    // OpenCode `agent: X` + `subtask: true` means "run in X as a subtask".
    // The faithful Claude translation is a Task-tool invocation of the
    // installed subagent — injected once, right after the title, so the
    // orchestration survives instead of collapsing onto the main agent.
    const step =
      `\n> **Execution:** Run this command via the Task tool using the ` +
      `\`${agentName}\` subagent (installed in \`.claude/agents/\`).\n`
    const lines = out.split("\n")
    const titleIdx = lines.findIndex((l) => l.startsWith("# "))
    if (titleIdx === -1) {
      out = step.trimStart() + "\n" + out
    } else {
      lines.splice(titleIdx + 1, 0, ...step.split("\n"))
      out = lines.join("\n")
    }
  }

  return out
}

/**
 * Generate `CLAUDE.md` content that imports the canonical `AGENTS.md`.
 * Uses Claude Code's `@AGENTS.md` import syntax (FR-008 / OQ-05 recommendation).
 */
export function generateClaudeMd(): string {
  return `<!-- FORGE: auto-generated. Edits go in AGENTS.md (canonical source). -->
@AGENTS.md
`
}
