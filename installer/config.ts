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
  // during installation, along with its node_modules (npm install is run
  // as a post-install step). Use node + local tsx binary to avoid any
  // dependency on globally installed tools or npx engine-strict issues.
  return {
    name: "forge-mcp-server",
    command: [
      "node",
      ".forge/mcp-server/node_modules/tsx/dist/cli.mjs",
      ".forge/mcp-server/index.ts",
    ],
  }
}

// ---------------------------------------------------------------------------
// Model tiers
// ---------------------------------------------------------------------------

/**
 * Default model assignments, mirroring the tiers in
 * `.opencode/templates/presets.json`.
 *
 * `forge-reviewer-peer` is deliberately assigned a **different model family**
 * from `forge-reviewer`. Running both reviewers on the same family makes the
 * dual-model review structurally redundant — it satisfies the governance rule
 * in `forge.md` without delivering the diversity the rule exists for (#66).
 */
export const DEFAULT_MODEL = "github-copilot/claude-sonnet-4.6"
const REASONING_MODEL = "github-copilot/claude-opus-4.7"
const PEER_REVIEW_MODEL = "github-copilot/gpt-5.3-codex"

/** Default agent configurations for the internal model. */
export function defaultAgentConfigs(): AgentConfig[] {
  return [
    { name: "forge", description: "FORGE orchestrator" },
    { name: "forge-pm", description: "FORGE product manager", model: REASONING_MODEL },
    { name: "forge-architect", description: "FORGE architect", model: REASONING_MODEL },
    { name: "forge-analyst", description: "FORGE analyst" },
    { name: "forge-scrum", description: "FORGE scrum master" },
    { name: "forge-reviewer", description: "FORGE adversarial reviewer", model: REASONING_MODEL },
    { name: "forge-reviewer-peer", description: "FORGE peer reviewer", model: PEER_REVIEW_MODEL },
    { name: "forge-qa", description: "FORGE QA engineer" },
    { name: "forge-ux", description: "FORGE UX designer", model: REASONING_MODEL },
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
    defaultModel: DEFAULT_MODEL,
  }
}

// ---------------------------------------------------------------------------
// Existing config loading
// ---------------------------------------------------------------------------

/**
 * Read and parse an existing platform config file.
 *
 * Returns `undefined` when the file is absent, and `{ malformed: true }`
 * when it exists but cannot be parsed — the caller backs it up and replaces
 * it rather than silently discarding user content (spec 004 § E-6).
 */
export function readExistingJsonConfig(
  configPath: string,
): { data?: Record<string, unknown>; malformed: boolean; existed: boolean } {
  if (!existsSync(configPath)) return { malformed: false, existed: false }

  const raw = readFileSync(configPath, "utf-8")
  if (raw.trim() === "") return { data: {}, malformed: false, existed: true }

  try {
    const parsed = JSON.parse(stripJsonComments(raw))
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { malformed: true, existed: true }
    }
    return { data: parsed as Record<string, unknown>, malformed: false, existed: true }
  } catch {
    return { malformed: true, existed: true }
  }
}

/**
 * Strip `//` and block comments from a JSONC document.
 *
 * OpenCode accepts JSONC, and FORGE's own `opencode.json` uses comments, so
 * a plain `JSON.parse` would classify a perfectly valid user config as
 * malformed and overwrite it. String literals are respected so that a `//`
 * inside a value (e.g. a URL) is never stripped.
 */
export function stripJsonComments(input: string): string {
  let out = ""
  let inString = false
  let inLineComment = false
  let inBlockComment = false
  let escaped = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false
        out += ch
      }
      continue
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false
        i++
      }
      continue
    }

    if (inString) {
      out += ch
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === '"') inString = false
      continue
    }

    if (ch === '"') {
      inString = true
      out += ch
      continue
    }
    if (ch === "/" && next === "/") {
      inLineComment = true
      i++
      continue
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true
      i++
      continue
    }

    out += ch
  }

  // Trailing commas are legal in JSONC but not in JSON.
  return out.replace(/,(\s*[}\]])/g, "$1")
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
