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
 * Native OpenCode v2 shapes (spec 010): `agents` (was `agent`),
 * `permissions[]` (was `permission`), `mcp.servers` (was flat `mcp`).
 *
 * `instructions` is still emitted, but only as a **V1 compatibility**
 * affordance: OpenCode v2 accepts the key and does not resolve its entries
 * (see the v2 Instructions guide). FORGE's governance therefore reaches the
 * model through the `session-knowledge` plugin's `context` hook, which
 * injects the constitution and decision log on every request. Do not remove
 * the plugin assuming `instructions` covers it.
 */
export const FORGE_MANAGED_KEYS = [
  "$schema",
  "default_agent",
  "instructions",
  "agents",
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

  // Governance: kept for V1 compatibility only. OpenCode v2 accepts this key
  // but does not resolve its entries, so governance is actually loaded by the
  // session-knowledge plugin's `context` hook (see FORGE_MANAGED_KEYS above).
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

  // Agent definitions. Native v2 key is `agents` (plural). A legacy v1
  // `agent` map is merged in — per entry, with native winning on conflict —
  // and then dropped, so regenerated files come out native while existing
  // user entries survive the move. Merge per agent so a user override of
  // one agent does not get wiped by regenerating the block.
  if (model.agents.length > 0) {
    if (existing?.agent !== undefined && !isRecord(existing.agent)) {
      warnings?.push(
        'opencode.json: "agent" was not an object and could not be merged — ' +
          "the previous value is preserved in the backup.",
      )
    }
    if (existing?.agents !== undefined && !isRecord(existing.agents)) {
      warnings?.push(
        'opencode.json: "agents" was not an object and could not be merged — ' +
          "the previous value is preserved in the backup.",
      )
    }
    const legacyAgents = isRecord(existing?.agent) ? existing.agent : {}
    const nativeAgents = isRecord(existing?.agents) ? existing.agents : {}
    const agentConfig: Record<string, Record<string, unknown>> = {}

    // Union of names; per entry the native shape wins key-by-key.
    for (const name of new Set([...Object.keys(legacyAgents), ...Object.keys(nativeAgents)])) {
      const legacyEntry = isRecord(legacyAgents[name]) ? legacyAgents[name] : {}
      const nativeEntry = isRecord(nativeAgents[name]) ? nativeAgents[name] : {}
      agentConfig[name] = { ...legacyEntry, ...nativeEntry }
    }

    for (const agent of model.agents) {
      const prior = agentConfig[agent.name] ?? {}
      const entry: Record<string, unknown> = { ...prior }
      // FORGE supplies a default model; an explicit user value wins.
      if (agent.model && prior.model === undefined) entry.model = agent.model
      if (agent.path && prior.path === undefined) entry.path = agent.path
      agentConfig[agent.name] = entry
    }

    config.agents = agentConfig
    // The legacy key has been folded into `agents` above — drop it so the
    // file is native v2. The pre-write backup preserves the original.
    delete config.agent
  }

  // Permissions — only seeded on a fresh install; never rewritten, because
  // narrowing a user's permissions silently would be a security regression.
  // Native v2 is an ordered `permissions` array (`shell` was `bash`,
  // `subagent` was `task`, `edit` covers `write`+`patch`). A legacy v1
  // `permission` block is left untouched — v2 normalizes it at load.
  if (existing?.permissions === undefined && existing?.permission === undefined) {
    config.permissions = defaultPermissions()
  }

  // MCP servers — native v2 groups them under `mcp.servers`. Flat legacy
  // entries are preserved verbatim (bounded V1/V2 mixing inside `mcp` is
  // explicitly supported by v2); FORGE servers are written natively.
  if (model.mcpServers.length > 0) {
    if (existing?.mcp !== undefined && !isRecord(existing.mcp)) {
      warnings?.push(
        'opencode.json: "mcp" was not an object and could not be merged — ' +
          "the previous value is preserved in the backup.",
      )
    }
    const existingMcp: Record<string, unknown> = isRecord(existing?.mcp)
      ? { ...existing.mcp }
      : {}
    if (existingMcp.servers !== undefined && !isRecord(existingMcp.servers)) {
      warnings?.push(
        'opencode.json: "mcp.servers" was not an object and could not be merged — ' +
          "the previous value is preserved in the backup.",
      )
    }
    const servers: Record<string, unknown> = isRecord(existingMcp.servers)
      ? { ...existingMcp.servers }
      : {}
    for (const server of model.mcpServers) {
      servers[server.name] = {
        type: "local",
        command: server.command,
        ...(server.env ? { environment: server.env } : {}),
      }
    }
    existingMcp.servers = servers
    config.mcp = existingMcp
  }

  return JSON.stringify(config, null, 2) + "\n"
}

/**
 * Default permission rules for a fresh install, native v2 shape.
 *
 * Deliberately conservative. Only commands that cannot mutate the working
 * tree are pre-approved, and each rule is anchored to a specific
 * subcommand.
 *
 * **Ordering is load-bearing.** V2 evaluates the array and the *last*
 * matching rule wins, so the broadest rule for an action must come FIRST and
 * the specific exceptions AFTER it. A previous revision had this backwards
 * (specific first, catch-all `ask` last), which made the catch-all shadow
 * every allow and left the allowlist inert — every command still prompted.
 *
 * Patterns like `npm run test*` or `find *` are NOT used: a trailing `*`
 * can absorb shell metacharacters, so `npm run test; rm -rf ~` would match
 * `npm run test*`, and `find . -exec rm {} \;` matches `find *`. A pattern
 * ending in ` *` (with a space) is safe and is the documented idiom for
 * "this command with optional arguments". Anything not listed here prompts
 * the user, which is the correct default for a tool installing into someone
 * else's repository.
 */
function defaultPermissions(): Array<Record<string, unknown>> {
  return [
    // Shell: ask by default, then narrowly pre-approve read-only commands.
    // The broad rule is first because the LAST matching rule wins.
    { action: "shell", resource: "*", effect: "ask" },
    { action: "shell", resource: "git status *", effect: "allow" },
    { action: "shell", resource: "git branch *", effect: "allow" },
    { action: "shell", resource: "pwd", effect: "allow" },
    { action: "shell", resource: "npm test *", effect: "allow" },

    // Local discovery and skill tools cannot mutate the working tree.
    { action: "read", resource: "*", effect: "allow" },
    { action: "glob", resource: "*", effect: "allow" },
    { action: "grep", resource: "*", effect: "allow" },
    { action: "skill", resource: "*", effect: "allow" },
    { action: "question", resource: "*", effect: "allow" },

    // `edit` covers the old `edit` + `write` + `patch` actions.
    { action: "edit", resource: "*", effect: "ask" },
  ]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
