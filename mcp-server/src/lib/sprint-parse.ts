/**
 * mcp-server/src/lib/sprint-parse.ts — Minimal parser for FORGE sprint files.
 *
 * FORGE sprint files are YAML with a fixed, shallow schema
 * (`.opencode/templates/sprint-status.yaml`), so a targeted parser is
 * preferable to a general YAML dependency: the installer layer ships no
 * runtime dependencies, and `mcp-server/` should not grow one for a
 * four-level document.
 *
 * Anything that does not match the expected shape yields `null`, which the
 * caller renders as a per-file warning rather than failing the whole
 * dashboard.
 */

export type StoryStatus = "pending" | "in_progress" | "done" | "blocked" | "carried_over"

const STORY_STATUSES: readonly StoryStatus[] = [
  "pending",
  "in_progress",
  "done",
  "blocked",
  "carried_over",
]

export interface Story {
  id: string
  title: string
  status: StoryStatus
  points: number
  blocked_reason?: string
}

export interface SprintData {
  number: number
  goal: string
  start_date: string
  end_date: string
  stories: Story[]
  velocity: { planned: number; completed: number }
}

/** Strip a trailing `#` comment that is not inside a quoted string. */
export function stripComment(line: string): string {
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === "'" && !inDouble) inSingle = !inSingle
    else if (ch === '"' && !inSingle) inDouble = !inDouble
    else if (ch === "#" && !inSingle && !inDouble) {
      // Only treat it as a comment when it starts a token.
      if (i === 0 || /\s/.test(line[i - 1])) return line.slice(0, i)
    }
  }
  return line
}

/** Remove surrounding quotes from a scalar value. */
function unquote(value: string): string {
  const v = value.trim()
  if (v.length >= 2 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) {
    return v.slice(1, -1)
  }
  return v
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length
}

/**
 * Parse a FORGE sprint file.
 *
 * @returns the sprint data, or `null` if the document has no usable
 *          `sprint:` block.
 */
export function parseSprintFile(content: string): SprintData | null {
  const lines = content
    .split("\n")
    .map(stripComment)
    .filter((l) => l.trim() !== "")

  const sprintIdx = lines.findIndex((l) => indentOf(l) === 0 && l.trim() === "sprint:")
  if (sprintIdx === -1) return null

  const body = lines.slice(sprintIdx + 1)
  const endIdx = body.findIndex((l) => indentOf(l) === 0)
  const sprintLines = endIdx === -1 ? body : body.slice(0, endIdx)

  const scalars = new Map<string, string>()
  const stories: Story[] = []
  const velocity = { planned: 0, completed: 0 }

  let mode: "scalar" | "stories" | "velocity" = "scalar"
  let blockIndent = 0
  let current: Partial<Story> | null = null

  const flushStory = () => {
    if (current && typeof current.id === "string") {
      stories.push({
        id: current.id,
        title: current.title ?? "",
        status: STORY_STATUSES.includes(current.status as StoryStatus)
          ? (current.status as StoryStatus)
          : "pending",
        points: Number.isFinite(current.points) ? (current.points as number) : 0,
        ...(current.blocked_reason ? { blocked_reason: current.blocked_reason } : {}),
      })
    }
    current = null
  }

  for (const line of sprintLines) {
    const indent = indentOf(line)
    const trimmed = line.trim()

    if (mode !== "scalar" && indent <= blockIndent && !trimmed.startsWith("-")) {
      // Dedented out of the block.
      if (mode === "stories") flushStory()
      mode = "scalar"
    }

    if (mode === "scalar") {
      if (trimmed === "stories:") {
        mode = "stories"
        blockIndent = indent
        continue
      }
      if (trimmed === "velocity:") {
        mode = "velocity"
        blockIndent = indent
        continue
      }
      const m = trimmed.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
      if (m && m[2] !== "") scalars.set(m[1], unquote(m[2]))
      continue
    }

    if (mode === "stories") {
      if (trimmed.startsWith("- ")) {
        flushStory()
        current = {}
        const first = trimmed.slice(2).trim()
        const m = first.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
        if (m) assignStoryField(current, m[1], unquote(m[2]))
        continue
      }
      const m = trimmed.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
      if (m && current) assignStoryField(current, m[1], unquote(m[2]))
      continue
    }

    if (mode === "velocity") {
      const m = trimmed.match(/^(planned|completed):\s*(.*)$/)
      if (m) {
        const n = Number(unquote(m[2]))
        if (Number.isFinite(n)) velocity[m[1] as "planned" | "completed"] = n
      }
      continue
    }
  }
  flushStory()

  const number = Number(scalars.get("number"))

  return {
    number: Number.isFinite(number) ? number : 0,
    goal: scalars.get("goal") ?? "",
    start_date: scalars.get("start_date") ?? "",
    end_date: scalars.get("end_date") ?? "",
    stories,
    velocity,
  }
}

function assignStoryField(story: Partial<Story>, key: string, value: string): void {
  switch (key) {
    case "id":
      story.id = value
      break
    case "title":
      story.title = value
      break
    case "status":
      story.status = value as StoryStatus
      break
    case "points": {
      const n = Number(value)
      story.points = Number.isFinite(n) ? n : 0
      break
    }
    case "blocked_reason":
      if (value) story.blocked_reason = value
      break
  }
}
