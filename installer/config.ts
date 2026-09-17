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
 * Strip `//` and block comments from a JSONC document, and remove trailing
 * commas.
 *
 * OpenCode accepts JSONC, and FORGE's own `opencode.json` uses comments, so
 * a plain `JSON.parse` would classify a perfectly valid user config as
 * malformed and overwrite it.
 *
 * Both transformations are **string-aware**. A naive trailing-comma regex
 * over the whole document silently deletes commas inside legitimate string
 * values — `{"a":"hello, }"}` became `{"a":"hello }"}` — which corrupts user
 * data without ever failing to parse. The tokenizer therefore records which
 * output characters came from inside a string literal, and the comma pass
 * only ever touches characters outside one.
 */
export function stripJsonComments(input: string): string {
  const out: string[] = []
  /** `true` where the corresponding `out` character came from a string literal. */
  const inStringMask: boolean[] = []

  let inString = false
  let inLineComment = false
  let inBlockComment = false
  let escaped = false

  const push = (ch: string, fromString: boolean) => {
    out.push(ch)
    inStringMask.push(fromString)
  }

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false
        push(ch, false)
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
      // The closing quote itself is structural, but marking it as
      // in-string is harmless: the comma pass only inspects `,`, whitespace
      // and closing brackets.
      push(ch, true)
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === '"') inString = false
      continue
    }

    if (ch === '"') {
      inString = true
      push(ch, false)
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

    push(ch, false)
  }

  // An unterminated string or block comment means the document is not
  // recoverable. Return it as-is so the caller's JSON.parse fails and the
  // file is classified malformed (backed up, then replaced) rather than
  // silently reinterpreted.
  if (inString || inBlockComment) return input

  return removeTrailingCommas(out, inStringMask)
}

/**
 * Drop commas that are immediately followed by `}` or `]`, considering only
 * characters that are outside string literals.
 */
function removeTrailingCommas(chars: string[], inStringMask: boolean[]): string {
  const drop = new Set<number>()

  for (let i = 0; i < chars.length; i++) {
    if (inStringMask[i] || chars[i] !== ",") continue

    // Look ahead past whitespace that is also outside a string.
    let j = i + 1
    while (j < chars.length && !inStringMask[j] && /\s/.test(chars[j])) j++

    if (j < chars.length && !inStringMask[j] && (chars[j] === "}" || chars[j] === "]")) {
      drop.add(i)
    }
  }

  if (drop.size === 0) return chars.join("")
  return chars.filter((_, i) => !drop.has(i)).join("")
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
