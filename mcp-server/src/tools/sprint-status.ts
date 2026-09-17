/**
 * mcp-server/src/tools/sprint-status.ts — Sprint status dashboard logic.
 *
 * Reads sprint files from `.forge/sprints/active/` and renders a dashboard.
 *
 * FORGE sprint files are YAML (`.opencode/templates/sprint-status.yaml`,
 * `/forge-sprint`, `skills/context-chain`). This tool previously filtered on
 * `.json` and called `JSON.parse`, so on any real project it returned
 * "No active sprint files found" and nothing else.
 */

import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"

import { parseSprintFile, type SprintData, type Story } from "../lib/sprint-parse"

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Render the sprint dashboard.
 *
 * @param projectRoot - project to read from. Defaults to the process CWD,
 *                      which is what the MCP server wants; taking it as a
 *                      parameter is what makes this testable.
 */
export async function getSprintStatus(projectRoot: string = process.cwd()): Promise<string> {
  const activeDir = join(projectRoot, ".forge", "sprints", "active")

  let entries: string[]
  try {
    entries = await readdir(activeDir)
  } catch {
    return "No active sprints found. Start one with /forge-sprint."
  }

  const sprintFiles = entries.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).sort()

  if (sprintFiles.length === 0) {
    return "No active sprints found. Start one with /forge-sprint."
  }

  const lines: string[] = []
  lines.push("FORGE Sprint Dashboard")
  lines.push("=".repeat(40))
  lines.push("")

  for (const file of sprintFiles) {
    let sprint: SprintData | null = null
    try {
      sprint = parseSprintFile(await readFile(join(activeDir, file), "utf-8"))
    } catch {
      sprint = null
    }

    // A malformed file degrades that entry only. Previously an unguarded
    // `sprint.stories.length` threw and aborted the entire dashboard.
    if (!sprint) {
      lines.push(`⚠ Could not parse: ${file}`)
      lines.push("")
      continue
    }

    lines.push(...renderSprint(sprint))
  }

  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderSprint(sprint: SprintData): string[] {
  const lines: string[] = []
  const stories = sprint.stories

  const count = (status: Story["status"]) => stories.filter((s) => s.status === status).length
  const done = count("done")
  const inProgress = count("in_progress")
  const blocked = count("blocked")
  const pending = count("pending")

  const donePoints = stories.filter((s) => s.status === "done").reduce((sum, s) => sum + s.points, 0)
  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0)

  const pct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0
  const barWidth = 30
  const filled = Math.max(0, Math.min(barWidth, Math.round((pct / 100) * barWidth)))
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled)

  lines.push(`Sprint ${sprint.number}: ${sprint.goal}`)
  lines.push("─".repeat(60))
  lines.push(`  Period:   ${sprint.start_date} → ${sprint.end_date}`)
  lines.push(`  Progress: ${bar} ${pct}%`)
  lines.push(
    `  Stories:  ${done}/${stories.length} done | ${inProgress} in progress | ` +
      `${blocked} blocked | ${pending} pending`,
  )
  lines.push(
    `  Points:   ${donePoints}/${totalPoints} ` +
      `(velocity: ${sprint.velocity.completed}/${sprint.velocity.planned})`,
  )
  lines.push("")

  if (stories.length > 0) {
    lines.push("  Stories:")
    for (const story of stories) {
      const icon =
        story.status === "done" ? "✓"
        : story.status === "in_progress" ? "→"
        : story.status === "blocked" ? "✗"
        : "○"
      const blocker = story.blocked_reason ? ` [BLOCKED: ${story.blocked_reason}]` : ""
      lines.push(`    ${icon} [${story.id}] ${story.title} (${story.points}pts)${blocker}`)
    }
    lines.push("")
  } else {
    lines.push("  No stories yet.")
    lines.push("")
  }

  return lines
}
