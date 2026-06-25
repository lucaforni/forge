/**
 * mcp-server/src/tools/sprint-status.ts — Sprint status dashboard logic.
 *
 * Pure function extracted from .opencode/tools/sprint-status.ts.
 * Reads sprint files from .forge/sprints/active/ and renders a dashboard.
 */

import { readFile, readdir, mkdir, rename } from "node:fs/promises"
import { resolve, join } from "node:path"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StoryStatus = "pending" | "in_progress" | "done" | "blocked" | "carried_over"

interface Story {
  id: string
  title: string
  status: StoryStatus
  points: number
  blocked_reason?: string
}

interface SprintData {
  number: number
  goal: string
  start_date: string
  end_date: string
  closed_date?: string
  story_count?: number
  stories_completed?: number
  stories_carried_over?: number
  stories: Story[]
  velocity: {
    planned: number
    completed: number
  }
  retro?: string
}

interface SprintFile {
  version: number
  sprint: SprintData
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function getSprintStatus(): Promise<string> {
  const projectRoot = process.cwd()
  const activeDir = join(projectRoot, ".forge", "sprints", "active")
  const completedDir = join(projectRoot, ".forge", "sprints", "completed")

  let activeFiles: string[]
  try {
    activeFiles = await readdir(activeDir)
  } catch {
    return "No active sprints found. Start one with /forge-sprint."
  }

  activeFiles = activeFiles.filter((f) => f.endsWith(".json"))

  if (activeFiles.length === 0) {
    return "No active sprint files found (JSON format only)."
  }

  const lines: string[] = []
  lines.push("FORGE Sprint Dashboard")
  lines.push("=".repeat(40))
  lines.push("")

  for (const file of activeFiles) {
    const filePath = join(activeDir, file)
    const content = await readFile(filePath, "utf-8")

    let sprintFile: SprintFile
    try {
      sprintFile = JSON.parse(content)
    } catch {
      lines.push(`⚠ Could not parse: ${file}`)
      continue
    }

    const sprint = sprintFile.sprint
    const totalStories = sprint.stories.length
    const done = sprint.stories.filter((s) => s.status === "done").length
    const inProgress = sprint.stories.filter((s) => s.status === "in_progress").length
    const blocked = sprint.stories.filter((s) => s.status === "blocked").length
    const pending = sprint.stories.filter((s) => s.status === "pending").length

    const donePoints = sprint.stories.filter((s) => s.status === "done").reduce((sum, s) => sum + s.points, 0)
    const totalPoints = sprint.stories.reduce((sum, s) => sum + s.points, 0)

    // Progress bar
    const pct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0
    const barWidth = 30
    const filled = Math.round((pct / 100) * barWidth)
    const bar = "█".repeat(filled) + "░".repeat(barWidth - filled)

    lines.push(`Sprint ${sprint.number}: ${sprint.goal}`)
    lines.push(`${"─".repeat(60)}`)
    lines.push(`  Period:   ${sprint.start_date} → ${sprint.end_date}`)
    lines.push(`  Progress: ${bar} ${pct}%`)
    lines.push(`  Stories:  ${done}/${totalStories} done | ${inProgress} in progress | ${blocked} blocked | ${pending} pending`)
    lines.push(`  Points:   ${donePoints}/${totalPoints} (velocity: ${sprint.velocity.completed}/${sprint.velocity.planned})`)
    lines.push("")

    // Story list
    if (sprint.stories.length > 0) {
      lines.push("  Stories:")
      for (const story of sprint.stories) {
        const statusIcon = story.status === "done" ? "✓" : story.status === "in_progress" ? "→" : story.status === "blocked" ? "✗" : "○"
        const blocker = story.blocked_reason ? ` [BLOCKED: ${story.blocked_reason}]` : ""
        lines.push(`    ${statusIcon} [${story.id}] ${story.title} (${story.points}pts)${blocker}`)
      }
      lines.push("")
    }
  }

  return lines.join("\n")
}
