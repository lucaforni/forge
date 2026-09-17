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
// FORGE-managed config keys
// ---------------------------------------------------------------------------

/**
 * Top-level keys the installer owns. On update these are regenerated; every
 * other key in an existing `opencode.json` is preserved verbatim.
 *
 * `instructions` is the mechanism by which the constitution and decision log
 * reach the model. Omitting it — as the pre-004 installer did — silently
 * disables FORGE's governance pillar in every user project (spec 004 FR-008).
 */
export const FORGE_MANAGED_KEYS = [
  "$schema",
  "default_agent",
  "instructions",
  "agent",
  "mcp",
] as const

// ---------------------------------------------------------------------------
// Config Generation
// ---------------------------------------------------------------------------

/**
 * Generate the platform-specific opencode.json content from the internal model.
 * Produces a JSON string matching the OpenCode schema.
 *
 * @param model     - internal FORGE configuration model
 * @param existing  - parsed contents of an existing opencode.json, if any.
 *                    User-owned keys are carried through unchanged.
 */
export function generateOpenCodeConfig(
  model: ForgeConfigModel,
  existing?: Record<string, unknown>,
  warnings?: string[],
): string {
  // Start from the user's config so unknown keys survive (spec 004 FR-009).
  const config: Record<string, unknown> = { ...(existing ?? {}) }

  config.$schema = "https://opencode.ai/config.json"
  config.default_agent = "forge"

  // Governance: load the constitution and decision log into every session.
  // Merged, not replaced — a project may list its own instruction files and
  // FORGE has no business deleting them (spec 004 FR-009).
  const managedInstructions = [
    ".forge/constitution.md",
    ".forge/knowledge/decision-log.md",
  ]
  const priorInstructions = Array.isArray(existing?.instructions)
    ? existing.instructions.filter((v): v is string => typeof v === "string")
    : []
  config.instructions = [...new Set([...managedInstructions, ...priorInstructions])]

  // Model defaults — only set when the user has not chosen their own.
  if (model.defaultModel && existing?.model === undefined) {
    config.model = model.defaultModel
  }

  // Agent definitions. Merge per agent so a user override of one agent does
  // not get wiped by regenerating the block.
  if (model.agents.length > 0) {
    if (existing?.agent !== undefined && !isRecord(existing.agent)) {
      warnings?.push(
        'opencode.json: "agent" was not an object and could not be merged — ' +
          "the previous value is preserved in the backup.",
      )
    }
    const existingAgents = isRecord(existing?.agent) ? existing.agent : {}
    const agentConfig: Record<string, Record<string, unknown>> = {}

    for (const agent of model.agents) {
      const priorEntry = existingAgents[agent.name]
      const prior: Record<string, unknown> = isRecord(priorEntry) ? priorEntry : {}
      const entry: Record<string, unknown> = { ...prior }
      // FORGE supplies a default model; an explicit user value wins.
      if (agent.model && prior.model === undefined) entry.model = agent.model
      if (agent.path && prior.path === undefined) entry.path = agent.path
      agentConfig[agent.name] = entry
    }

    // Preserve any user-defined agents FORGE does not manage.
    for (const [name, entry] of Object.entries(existingAgents)) {
      if (!(name in agentConfig)) agentConfig[name] = entry as Record<string, unknown>
    }

    config.agent = agentConfig
  }

  // Permissions — only seeded on a fresh install; never rewritten, because
  // narrowing a user's permissions silently would be a security regression.
  if (existing?.permission === undefined) {
    config.permission = defaultPermissions()
  }

  // MCP servers
  if (model.mcpServers.length > 0) {
    if (existing?.mcp !== undefined && !isRecord(existing.mcp)) {
      warnings?.push(
        'opencode.json: "mcp" was not an object and could not be merged — ' +
          "the previous value is preserved in the backup.",
      )
    }
    const existingMcp = isRecord(existing?.mcp) ? existing.mcp : {}
    const mcpConfig: Record<string, unknown> = { ...existingMcp }
    for (const server of model.mcpServers) {
      mcpConfig[server.name] = {
        type: "local",
        command: server.command,
        ...(server.env ? { environment: server.env } : {}),
      }
    }
    config.mcp = mcpConfig
  }

  return JSON.stringify(config, null, 2) + "\n"
}

/**
 * Default permission block for a fresh install.
 *
 * Deliberately conservative. Only commands that cannot mutate the working
 * tree are pre-approved, and each pattern is anchored to a specific
 * subcommand.
 *
 * Patterns like `npm run test*` or `find *` are NOT used: a trailing `*`
 * can absorb shell metacharacters, so `npm run test; rm -rf ~` would match
 * `npm run test*`, and `find . -exec rm {} \;` matches `find *`. Anything
 * not listed here prompts the user, which is the correct default for a tool
 * installing into someone else's repository.
 */
function defaultPermissions(): Record<string, unknown> {
  return {
    bash: {
      "git status": "allow",
      "git branch": "allow",
      "pwd": "allow",
      "npm test": "allow",
      "*": "ask",
    },
    read: "allow",
    glob: "allow",
    grep: "allow",
    skill: "allow",
    question: "allow",
    edit: "ask",
    write: "ask",
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
