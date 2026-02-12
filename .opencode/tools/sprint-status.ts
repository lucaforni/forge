import { tool } from "@opencode-ai/plugin"
import { readFile } from "node:fs/promises"
import { resolve, join } from "node:path"

/**
 * sprint-status — Reads .forge/sprints/sprint-status.yaml and renders
 * a text dashboard with progress bar, story list, and velocity metrics.
 */

// ---------------------------------------------------------------------------
// Simple YAML parser for sprint-status.yaml
// We parse only the known structure to avoid needing a full YAML library.
// ---------------------------------------------------------------------------

interface Story {
  id: string
  title: string
  status: string
  points: number
  blocked_reason?: string
}

interface Sprint {
  number: number
  goal: string
  start_date: string
  end_date: string
  stories: Story[]
  velocity: {
    planned: number
    completed: number
  }
}

interface PreviousSprint {
  number: number
  goal: string
  velocity: {
    planned: number
    completed: number
  }
  retro?: string
}

interface SprintData {
  project: string
  current_sprint: Sprint
  previous_sprints: PreviousSprint[]
}

function parseYaml(content: string): SprintData {
  // Remove comment-only lines but preserve inline values
  const lines = content.split("\n")

  const data: SprintData = {
    project: "",
    current_sprint: {
      number: 0,
      goal: "",
      start_date: "",
      end_date: "",
      stories: [],
      velocity: { planned: 0, completed: 0 },
    },
    previous_sprints: [],
  }

  let context: "root" | "current_sprint" | "stories" | "story" | "velocity" | "previous" | "prev_sprint" | "prev_velocity" = "root"
  let currentStory: Partial<Story> = {}
  let currentPrev: Partial<PreviousSprint> = {}

  for (const rawLine of lines) {
    // Skip comment-only lines
    if (/^\s*#/.test(rawLine)) continue
    const line = rawLine.replace(/#.*$/, "").trimEnd()
    if (!line.trim()) continue

    const indent = line.length - line.trimStart().length

    // Parse key: value
    const kvMatch = line.match(/^(\s*)([^:]+):\s*(.*)/)
    if (!kvMatch) {
      // List item: - key: value
      const listMatch = line.match(/^(\s*)-\s+(.*)/)
      if (listMatch) {
        const listIndent = listMatch[1].length
        const listContent = listMatch[2]
        // Parse inline key: value from list item
        const inlineKv = listContent.match(/^([^:]+):\s*(.*)/)
        if (inlineKv) {
          const key = inlineKv[1].trim()
          const val = cleanValue(inlineKv[2])

          if (context === "stories" || context === "story") {
            // Start of a new story
            if (key === "id") {
              if (currentStory.id) {
                data.current_sprint.stories.push(currentStory as Story)
              }
              currentStory = {
                id: val,
                title: "",
                status: "pending",
                points: 0,
              }
              context = "story"
            }
          } else if (context === "previous" || context === "prev_sprint") {
            if (key === "number") {
              if (currentPrev.number !== undefined) {
                data.previous_sprints.push(currentPrev as PreviousSprint)
              }
              currentPrev = {
                number: parseInt(val) || 0,
                goal: "",
                velocity: { planned: 0, completed: 0 },
              }
              context = "prev_sprint"
            }
          }
        }
        continue
      }
      continue
    }

    const key = kvMatch[2].trim()
    const val = cleanValue(kvMatch[3])

    // Root level
    if (indent === 0) {
      if (key === "project") {
        data.project = val
      } else if (key === "current_sprint") {
        context = "current_sprint"
      } else if (key === "previous_sprints") {
        // Finish any open story
        if (currentStory.id) {
          data.current_sprint.stories.push(currentStory as Story)
          currentStory = {}
        }
        context = "previous"
      }
      continue
    }

    // Current sprint fields
    if (context === "current_sprint" || context === "stories" || context === "story" || context === "velocity") {
      if (indent === 2) {
        if (key === "number") {
          data.current_sprint.number = parseInt(val) || 0
        } else if (key === "goal") {
          data.current_sprint.goal = val
        } else if (key === "start_date") {
          data.current_sprint.start_date = val
        } else if (key === "end_date") {
          data.current_sprint.end_date = val
        } else if (key === "stories") {
          context = "stories"
        } else if (key === "velocity") {
          context = "velocity"
        }
      } else if (context === "velocity" && indent === 4) {
        if (key === "planned") {
          data.current_sprint.velocity.planned = parseInt(val) || 0
        } else if (key === "completed") {
          data.current_sprint.velocity.completed = parseInt(val) || 0
        }
      } else if (context === "story" && indent >= 6) {
        if (key === "title") currentStory.title = val
        else if (key === "status") currentStory.status = val
        else if (key === "points") currentStory.points = parseInt(val) || 0
        else if (key === "blocked_reason") currentStory.blocked_reason = val
      }
    }

    // Previous sprint fields
    if (context === "prev_sprint" || context === "prev_velocity") {
      if (indent >= 4 && indent < 6) {
        if (key === "goal") currentPrev.goal = val
        else if (key === "velocity") context = "prev_velocity"
        else if (key === "retro") currentPrev.retro = val
      } else if (context === "prev_velocity" && indent >= 6) {
        if (key === "planned") {
          if (!currentPrev.velocity) currentPrev.velocity = { planned: 0, completed: 0 }
          currentPrev.velocity.planned = parseInt(val) || 0
        } else if (key === "completed") {
          if (!currentPrev.velocity) currentPrev.velocity = { planned: 0, completed: 0 }
          currentPrev.velocity.completed = parseInt(val) || 0
        }
      }
    }
  }

  // Flush last open objects
  if (currentStory.id) {
    data.current_sprint.stories.push(currentStory as Story)
  }
  if (currentPrev.number !== undefined) {
    data.previous_sprints.push(currentPrev as PreviousSprint)
  }

  return data
}

function cleanValue(val: string): string {
  return val
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim()
}

// ---------------------------------------------------------------------------
// Dashboard rendering
// ---------------------------------------------------------------------------

function renderProgressBar(
  completed: number,
  total: number,
  width: number = 20,
): string {
  if (total === 0) return "░".repeat(width) + " 0/0 (0%)"
  const ratio = Math.min(completed / total, 1)
  const filled = Math.round(ratio * width)
  const empty = width - filled
  const pct = Math.round(ratio * 100)
  return (
    "█".repeat(filled) +
    "░".repeat(empty) +
    ` ${completed}/${total} stories (${pct}%)`
  )
}

function renderDashboard(data: SprintData): string {
  const sprint = data.current_sprint
  const stories = sprint.stories

  // Group stories by status
  const done = stories.filter((s) => s.status === "done")
  const inProgress = stories.filter((s) => s.status === "in_progress")
  const blocked = stories.filter((s) => s.status === "blocked")
  const pending = stories.filter((s) => s.status === "pending")

  // Calculate points
  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0)
  const donePoints = done.reduce((sum, s) => sum + s.points, 0)

  // Average velocity from previous sprints
  let avgVelocity = 0
  if (data.previous_sprints.length > 0) {
    const totalPrevCompleted = data.previous_sprints.reduce(
      (sum, s) => sum + (s.velocity?.completed || 0),
      0,
    )
    avgVelocity = Math.round(
      totalPrevCompleted / data.previous_sprints.length,
    )
  }

  // Build output
  let output = ""

  // Header
  output += `Sprint ${sprint.number}`
  if (sprint.goal) output += ` | Goal: ${sprint.goal}`
  output += `\n`

  if (data.project) {
    output += `Project: ${data.project}\n`
  }

  if (sprint.start_date && sprint.end_date) {
    output += `Period: ${sprint.start_date} — ${sprint.end_date}\n`
  }
  output += `\n`

  // Progress bar
  output += `Progress: ${renderProgressBar(done.length, stories.length)}\n`
  output += `Points:   ${donePoints}/${totalPoints} pts`
  if (avgVelocity > 0) {
    output += ` (avg velocity: ${avgVelocity} pts)`
  }
  output += `\n`

  // Velocity
  if (sprint.velocity.planned > 0) {
    output += `Velocity: ${sprint.velocity.completed}/${sprint.velocity.planned} pts planned\n`
  }
  output += `\n`

  // Story lists
  if (done.length > 0) {
    output += `Done (${done.length}):\n`
    for (const s of done) {
      output += `  [done]      ${s.id} ${s.title} [${s.points}pt]\n`
    }
    output += `\n`
  }

  if (inProgress.length > 0) {
    output += `In Progress (${inProgress.length}):\n`
    for (const s of inProgress) {
      output += `  [active]    ${s.id} ${s.title} [${s.points}pt]\n`
    }
    output += `\n`
  }

  if (blocked.length > 0) {
    output += `Blocked (${blocked.length}):\n`
    for (const s of blocked) {
      const reason = s.blocked_reason
        ? ` — ${s.blocked_reason}`
        : ""
      output += `  [BLOCKED]   ${s.id} ${s.title} [${s.points}pt]${reason}\n`
    }
    output += `\n`
  }

  if (pending.length > 0) {
    output += `Pending (${pending.length}):\n`
    for (const s of pending) {
      output += `  [pending]   ${s.id} ${s.title} [${s.points}pt]\n`
    }
    output += `\n`
  }

  if (stories.length === 0) {
    output += `No stories in current sprint.\n\n`
  }

  // Previous sprints summary
  if (data.previous_sprints.length > 0) {
    output += `--- Previous Sprints ---\n\n`
    for (const prev of data.previous_sprints) {
      const pctComplete =
        prev.velocity.planned > 0
          ? Math.round(
              (prev.velocity.completed / prev.velocity.planned) * 100,
            )
          : 0
      output += `  Sprint ${prev.number}: ${prev.velocity.completed}/${prev.velocity.planned} pts (${pctComplete}%)`
      if (prev.goal) output += ` — ${prev.goal}`
      output += `\n`
    }
  }

  return output
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export default tool({
  description:
    "Display the FORGE sprint status dashboard. Reads .forge/sprints/sprint-status.yaml " +
    "and renders a text dashboard with progress bar, story list by status, " +
    "and velocity metrics.",
  args: {},
  async execute(_args, context) {
    const rootDir = context.worktree || context.directory
    const statusPath = join(rootDir, ".forge", "sprints", "sprint-status.yaml")

    let content: string
    try {
      content = await readFile(statusPath, "utf-8")
    } catch {
      return (
        `No sprint status file found at .forge/sprints/sprint-status.yaml\n\n` +
        `Run /forge-sprint to initialize sprint planning.`
      )
    }

    // Check if the file is just the template (no real data)
    if (content.includes("[Project Name]") && content.includes("[Sprint goal]")) {
      return (
        `Sprint status file exists but contains only template data.\n\n` +
        `Run /forge-sprint to set up your first sprint.`
      )
    }

    try {
      const data = parseYaml(content)
      return renderDashboard(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return `ERROR: Failed to parse sprint-status.yaml: ${message}`
    }
  },
})
