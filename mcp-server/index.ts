#!/usr/bin/env node
/**
 * forge-mcp-server — FORGE MCP server entry point.
 *
 * Exposes validate-spec, trace-requirements, and sprint-status as MCP tools
 * for Claude Code, Codex CLI, and OpenCode (via MCP config).
 *
 * Uses stdio transport — compatible with all MCP clients.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

// ---------------------------------------------------------------------------
// Tool Registrations
// ---------------------------------------------------------------------------

// Tools are imported lazily to keep startup fast
type ToolFunction = (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>

const toolRegistry: Record<string, { name: string; description: string; inputSchema: Record<string, unknown>; handler: ToolFunction }> = {}

// ---------------------------------------------------------------------------
// Tool: validate-spec
// ---------------------------------------------------------------------------

toolRegistry["validate-spec"] = {
  name: "validate-spec",
  description: "Validate a FORGE spec.md or tech-spec.md for completeness. Checks: empty required fields, [NEEDS CLARIFICATION] markers, user stories without acceptance criteria, NFRs without metrics, missing constitution compliance, missing cross-references. Returns a structured validation report with a completeness score 0-100%.",
  inputSchema: {
    type: "object",
    properties: {
      specPath: {
        type: "string",
        description: "Path to the spec.md or tech-spec.md file to validate (relative to project root or absolute)",
      },
    },
    required: ["specPath"],
  },
  handler: async (args) => {
    try {
      const { specPath } = args as { specPath: string }
      if (!specPath) throw new Error("specPath is required")

      // Dynamic import to avoid loading all tools at startup
      const { validateSpec } = await import("./src/tools/validate-spec.js")
      const result = await validateSpec(specPath)

      return {
        content: [{ type: "text", text: formatValidateSpecResult(result) }],
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `[forge-mcp-server] Tool 'validate-spec' failed: ${(err as Error).message}` }],
        isError: true,
      }
    }
  },
}

// ---------------------------------------------------------------------------
// Tool: trace-requirements
// ---------------------------------------------------------------------------

toolRegistry["trace-requirements"] = {
  name: "trace-requirements",
  description: "Trace requirements from a FORGE spec through plan, tasks, source files, and test files. Returns a traceability matrix showing coverage and gaps ([NOT IMPLEMENTED], [NO TASK], etc.).",
  inputSchema: {
    type: "object",
    properties: {
      specId: {
        type: "string",
        description: "Spec ID (e.g., '001') — will search .forge/specs/ for matching directory",
      },
      specPath: {
        type: "string",
        description: "Direct path to spec.md file (relative to project root or absolute)",
      },
    },
  },
  handler: async (args) => {
    try {
      const { specId, specPath } = args as { specId?: string; specPath?: string }
      if (!specId && !specPath) throw new Error("Either specId or specPath is required")

      const { traceRequirements } = await import("./src/tools/trace-requirements.js")
      const result = await traceRequirements({ specId, specPath })

      return {
        content: [{ type: "text", text: formatTraceResult(result) }],
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `[forge-mcp-server] Tool 'trace-requirements' failed: ${(err as Error).message}` }],
        isError: true,
      }
    }
  },
}

// ---------------------------------------------------------------------------
// Tool: sprint-status
// ---------------------------------------------------------------------------

toolRegistry["sprint-status"] = {
  name: "sprint-status",
  description: "Display the FORGE sprint status dashboard with multi-sprint support. Reads sprint files from .forge/sprints/active/ and renders an aggregate dashboard showing all active sprints with progress bars, story lists, and velocity metrics. Supports automatic migration from old single-file format.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    try {
      const { getSprintStatus } = await import("./src/tools/sprint-status.js")
      const result = await getSprintStatus()

      return {
        content: [{ type: "text", text: result }],
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `[forge-mcp-server] Tool 'sprint-status' failed: ${(err as Error).message}` }],
        isError: true,
      }
    }
  },
}

// ---------------------------------------------------------------------------
// Server Setup
// ---------------------------------------------------------------------------

const server = new Server(
  {
    name: "forge-mcp-server",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

// Handle tool list request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(toolRegistry).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }
})

// Handle tool call request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name
  const args = request.params.arguments ?? {}

  const tool = toolRegistry[toolName]
  if (!tool) {
    return {
      content: [{ type: "text", text: `[forge-mcp-server] Unknown tool: '${toolName}'` }],
      isError: true,
    }
  }

  return tool.handler(args as Record<string, unknown>)
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("[forge-mcp-server] Server running on stdio transport")
}

main().catch((err) => {
  console.error("[forge-mcp-server] Fatal error:", err)
  process.exit(1)
})

// ---------------------------------------------------------------------------
// Formatting Helpers (used by all tools)
// ---------------------------------------------------------------------------

function formatValidateSpecResult(result: any): string {
  const lines: string[] = []
  lines.push(`Validation Report: ${result.specPath || "unknown"}`)
  lines.push(`Completeness: ${result.completeness ?? "N/A"}%`)
  lines.push("")

  if (result.emptyRequiredFields?.length) {
    lines.push(`⚠ Empty Required Fields (${result.emptyRequiredFields.length}):`)
    for (const f of result.emptyRequiredFields) lines.push(`  - ${f}`)
    lines.push("")
  }

  if (result.needsClarification?.length) {
    lines.push(`❓ [NEEDS CLARIFICATION] markers (${result.needsClarification.length}):`)
    for (const n of result.needsClarification) lines.push(`  - ${n}`)
    lines.push("")
  }

  if (result.storiesWithoutCriteria?.length) {
    lines.push(`⚠ Stories without acceptance criteria (${result.storiesWithoutCriteria.length}):`)
    for (const s of result.storiesWithoutCriteria) lines.push(`  - ${s}`)
    lines.push("")
  }

  if (result.nfrsWithoutMetrics?.length) {
    lines.push(`⚠ NFRs without measurable metrics (${result.nfrsWithoutMetrics.length}):`)
    for (const n of result.nfrsWithoutMetrics) lines.push(`  - ${n}`)
    lines.push("")
  }

  if (result.missingSections?.length) {
    lines.push(`⚠ Missing sections (${result.missingSections.length}):`)
    for (const s of result.missingSections) lines.push(`  - ${s}`)
    lines.push("")
  }

  lines.push(`Issues: ${result.critical ?? 0} critical, ${result.warnings ?? 0} warnings, ${result.info ?? 0} info`)
  return lines.join("\n")
}

function formatTraceResult(result: any): string {
  const lines: string[] = []
  lines.push("Requirements Traceability Matrix")
  lines.push("=".repeat(40))
  lines.push("")

  if (result.requirements?.length) {
    for (const req of result.requirements) {
      const status = req.sourceFiles?.length
        ? req.testFiles?.length
          ? "[COVERED]"
          : "[NO TESTS]"
        : "[NOT IMPLEMENTED]"
      lines.push(`${status} ${req.id || "unknown"}: ${req.description || "N/A"}`)
      if (req.sourceFiles?.length) lines.push(`  Source: ${req.sourceFiles.join(", ")}`)
      if (req.testFiles?.length) lines.push(`  Tests:  ${req.testFiles.join(", ")}`)
      lines.push("")
    }
  }

  if (result.gaps?.length) {
    lines.push("Gaps:")
    for (const gap of result.gaps) {
      lines.push(`  - ${gap}`)
    }
  }

  return lines.join("\n")
}
