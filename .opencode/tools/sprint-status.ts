import { tool } from "@opencode-ai/plugin"
import { readFile, readdir, mkdir, writeFile, rename } from "node:fs/promises"
import { resolve, join } from "node:path"

/**
 * sprint-status — Multi-sprint dashboard with automatic archiving
 * 
 * Reads sprint files from .forge/sprints/active/ and renders an aggregate
 * dashboard showing all active sprints. Supports migration from old single-file
 * format to new directory-based structure.
 * 
 * Features:
 * - Multiple concurrent active sprints
 * - Automatic archive to completed/ on sprint close
 * - Backward-compatible migration from old sprint-status.yaml format
 * - Aggregate dashboard with velocity trend
 */

// ---------------------------------------------------------------------------
// Type Definitions (Task 2.1)
// ---------------------------------------------------------------------------

type StoryStatus = "pending" | "in_progress" | "done" | "blocked" | "carried_over"

interface Story {
  id: string
  title: string
  status: StoryStatus
  points: number
  blocked_reason?: string
}

interface SprintFile {
  version: number
  sprint: {
    number: number
    goal: string
    start_date: string
    end_date: string
    closed_date?: string              // Only in completed sprints
    story_count?: number              // Only in completed sprints
    stories_completed?: number        // Only in completed sprints
    stories_carried_over?: number     // Only in completed sprints
    stories: Story[]
    velocity: {
      planned: number
      completed: number
    }
    retro?: string                    // Only in completed sprints
  }
}

interface SequenceFile {
  version: number
  next_sprint_number: number
  project: string
}

type MigrationState =
  | { type: "new_format"; activePath: string }
  | { type: "old_format"; oldPath: string; data: LegacySprintData }
  | { type: "template_only" }
  | { type: "no_data" }
  | { type: "conflict"; activePath: string; oldPath: string }

interface MigrationResult {
  success: boolean
  migratedActive: number
  migratedCompleted: number
  warnings: string[]
}

// Legacy format types (for migration)
interface LegacyStory {
  id: string
  title: string
  status: string
  points: number
  blocked_reason?: string
}

interface LegacySprint {
  number: number
  goal: string
  start_date: string
  end_date: string
  stories: LegacyStory[]
  velocity: {
    planned: number
    completed: number
  }
}

interface LegacyPreviousSprint {
  number: number
  goal: string
  velocity: {
    planned: number
    completed: number
  }
  retro?: string
  end_date?: string
}

interface LegacySprintData {
  project: string
  current_sprint: LegacySprint
  previous_sprints: LegacyPreviousSprint[]
}

// ---------------------------------------------------------------------------
// YAML Parser for New Format (Tasks 2.3, 2.4)
// ---------------------------------------------------------------------------

function parseSprintYaml(content: string): SprintFile {
  const lines = content.split("\n")
  
  const data: SprintFile = {
    version: 1,
    sprint: {
      number: 0,
      goal: "",
      start_date: "",
      end_date: "",
      stories: [],
      velocity: { planned: 0, completed: 0 },
    },
  }

  let context: "root" | "sprint" | "stories" | "story" | "velocity" = "root"
  let currentStory: Partial<Story> = {}

  for (const rawLine of lines) {
    if (/^\s*#/.test(rawLine)) continue
    const line = rawLine.replace(/#.*$/, "").trimEnd()
    if (!line.trim()) continue

    const indent = line.length - line.trimStart().length

    // List item check MUST come before kv check: a line like "    - id: foo"
    // would also match the kv regex (key="    - id"), so we handle list items first.
    const listMatch = line.match(/^(\s*)-\s+(.*)/)
    if (listMatch) {
      const listContent = listMatch[2]
      const inlineKv = listContent.match(/^([^:]+):\s*(.*)/)
      if (inlineKv && (context === "stories" || context === "story")) {
        const key = inlineKv[1].trim()
        const val = cleanValue(inlineKv[2])

        if (key === "id") {
          if (currentStory.id) {
            data.sprint.stories.push(currentStory as Story)
          }
          currentStory = {
            id: val,
            title: "",
            status: "pending",
            points: 0,
          }
          context = "story"
        }
      }
      continue
    }

    const kvMatch = line.match(/^(\s*)([^:]+):\s*(.*)/)
    if (!kvMatch) continue

    const key = kvMatch[2].trim()
    const val = cleanValue(kvMatch[3])

    // Root level
    if (indent === 0) {
      if (key === "version") {
        const version = parseInt(val) || 1
        if (version !== 1) {
          console.warn(`Warning: Unknown sprint file version ${version}. Attempting best-effort parse.`)
        }
        data.version = version
      } else if (key === "sprint") {
        context = "sprint"
      }
      continue
    }

    // Sprint fields (indent 2)
    if (context === "sprint" || context === "stories" || context === "story" || context === "velocity") {
      if (indent === 2) {
        if (key === "number") data.sprint.number = parseInt(val) || 0
        else if (key === "goal") data.sprint.goal = val
        else if (key === "start_date") data.sprint.start_date = val
        else if (key === "end_date") data.sprint.end_date = val
        else if (key === "closed_date") data.sprint.closed_date = val
        else if (key === "story_count") data.sprint.story_count = parseInt(val) || 0
        else if (key === "stories_completed") data.sprint.stories_completed = parseInt(val) || 0
        else if (key === "stories_carried_over") data.sprint.stories_carried_over = parseInt(val) || 0
        else if (key === "retro") data.sprint.retro = val
        else if (key === "stories") context = "stories"
        else if (key === "velocity") context = "velocity"
      } else if (context === "velocity" && indent === 4) {
        if (key === "planned") data.sprint.velocity.planned = parseInt(val) || 0
        else if (key === "completed") data.sprint.velocity.completed = parseInt(val) || 0
      } else if (context === "story" && indent >= 6) {
        if (key === "title") currentStory.title = val
        else if (key === "status") currentStory.status = val as StoryStatus
        else if (key === "points") currentStory.points = parseInt(val) || 0
        else if (key === "blocked_reason") currentStory.blocked_reason = val
      }
    }
  }

  // Flush last story
  if (currentStory.id) {
    data.sprint.stories.push(currentStory as Story)
  }

  return data
}

function parseSequenceYaml(content: string): SequenceFile {
  const lines = content.split("\n")
  const data: SequenceFile = {
    version: 1,
    next_sprint_number: 1,
    project: "",
  }

  for (const rawLine of lines) {
    if (/^\s*#/.test(rawLine)) continue
    const line = rawLine.replace(/#.*$/, "").trimEnd()
    if (!line.trim()) continue

    const kvMatch = line.match(/^([^:]+):\s*(.*)/)
    if (!kvMatch) continue

    const key = kvMatch[1].trim()
    const val = cleanValue(kvMatch[2])

    if (key === "version") data.version = parseInt(val) || 1
    else if (key === "next_sprint_number") data.next_sprint_number = parseInt(val) || 1
    else if (key === "project") data.project = val
  }

  return data
}

// Legacy parser (Task 2.2 - renamed from parseYaml)
function parseLegacyYaml(content: string): LegacySprintData {
  const lines = content.split("\n")

  const data: LegacySprintData = {
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
  let currentStory: Partial<LegacyStory> = {}
  let currentPrev: Partial<LegacyPreviousSprint> = {}

  for (const rawLine of lines) {
    if (/^\s*#/.test(rawLine)) continue
    const line = rawLine.replace(/#.*$/, "").trimEnd()
    if (!line.trim()) continue

    const indent = line.length - line.trimStart().length
    const kvMatch = line.match(/^(\s*)([^:]+):\s*(.*)/)
    
    if (!kvMatch) {
      const listMatch = line.match(/^(\s*)-\s+(.*)/)
      if (listMatch) {
        const listContent = listMatch[2]
        const inlineKv = listContent.match(/^([^:]+):\s*(.*)/)
        if (inlineKv) {
          const key = inlineKv[1].trim()
          const val = cleanValue(inlineKv[2])

          if (context === "stories" || context === "story") {
            if (key === "id") {
              if (currentStory.id) {
                data.current_sprint.stories.push(currentStory as LegacyStory)
              }
              currentStory = { id: val, title: "", status: "pending", points: 0 }
              context = "story"
            }
          } else if (context === "previous" || context === "prev_sprint") {
            if (key === "number") {
              if (currentPrev.number !== undefined) {
                data.previous_sprints.push(currentPrev as LegacyPreviousSprint)
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

    if (indent === 0) {
      if (key === "project") data.project = val
      else if (key === "current_sprint") context = "current_sprint"
      else if (key === "previous_sprints") {
        if (currentStory.id) {
          data.current_sprint.stories.push(currentStory as LegacyStory)
          currentStory = {}
        }
        context = "previous"
      }
      continue
    }

    if (context === "current_sprint" || context === "stories" || context === "story" || context === "velocity") {
      if (indent === 2) {
        if (key === "number") data.current_sprint.number = parseInt(val) || 0
        else if (key === "goal") data.current_sprint.goal = val
        else if (key === "start_date") data.current_sprint.start_date = val
        else if (key === "end_date") data.current_sprint.end_date = val
        else if (key === "stories") context = "stories"
        else if (key === "velocity") context = "velocity"
      } else if (context === "velocity" && indent === 4) {
        if (key === "planned") data.current_sprint.velocity.planned = parseInt(val) || 0
        else if (key === "completed") data.current_sprint.velocity.completed = parseInt(val) || 0
      } else if (context === "story" && indent >= 6) {
        if (key === "title") currentStory.title = val
        else if (key === "status") currentStory.status = val
        else if (key === "points") currentStory.points = parseInt(val) || 0
        else if (key === "blocked_reason") currentStory.blocked_reason = val
      }
    }

    if (context === "prev_sprint" || context === "prev_velocity") {
      if (indent >= 4 && indent < 6) {
        if (key === "goal") currentPrev.goal = val
        else if (key === "end_date") currentPrev.end_date = val
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

  if (currentStory.id) {
    data.current_sprint.stories.push(currentStory as LegacyStory)
  }
  if (currentPrev.number !== undefined) {
    data.previous_sprints.push(currentPrev as LegacyPreviousSprint)
  }

  return data
}

function cleanValue(val: string): string {
  return val.trim().replace(/^["']|["']$/g, "").trim()
}

// ---------------------------------------------------------------------------
// Directory Reader Functions (Tasks 2.5, 2.6)
// ---------------------------------------------------------------------------

async function readActiveSprints(sprintsDir: string): Promise<SprintFile[]> {
  const activePath = join(sprintsDir, "active")
  
  try {
    const files = await readdir(activePath)
    const sprintFiles = files.filter(f => /^sprint-\d{3}\.yaml$/.test(f))
    
    const sprints: SprintFile[] = []
    const seenNumbers = new Set<number>()
    
    for (const file of sprintFiles) {
      try {
        const content = await readFile(join(activePath, file), "utf-8")
        const sprint = parseSprintYaml(content)
        
        // Detect duplicates (Edge Case #7)
        if (seenNumbers.has(sprint.sprint.number)) {
          throw new Error(
            `Error: Duplicate sprint number ${sprint.sprint.number} found in active/ directory.\n\n` +
            `Found in file: ${file}\n` +
            `This should not happen if sprint-sequence.yaml is used correctly.\n\n` +
            `To fix: Remove the duplicate sprint file or renumber it manually.`
          )
        }
        seenNumbers.add(sprint.sprint.number)
        
        sprints.push(sprint)
      } catch (err) {
        if (err instanceof Error && err.message.includes("Duplicate sprint number")) {
          throw err
        }
        console.warn(`Warning: Failed to parse ${file}: ${err}`)
      }
    }
    
    // Sort by sprint number ascending
    sprints.sort((a, b) => a.sprint.number - b.sprint.number)
    
    return sprints
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return []
    }
    throw err
  }
}

async function readCompletedSprints(sprintsDir: string, limit: number = 5): Promise<SprintFile[]> {
  const completedPath = join(sprintsDir, "completed")
  
  try {
    const files = await readdir(completedPath)
    const sprintFiles = files
      .filter(f => /^\d{4}-\d{2}-\d{2}-sprint-\d{3}(-\d+)?\.yaml$/.test(f))
      .sort()
      .reverse() // Most recent first
      .slice(0, limit)
    
    const sprints: SprintFile[] = []
    
    for (const file of sprintFiles) {
      try {
        const content = await readFile(join(completedPath, file), "utf-8")
        const sprint = parseSprintYaml(content)
        sprints.push(sprint)
      } catch (err) {
        console.warn(`Warning: Failed to parse ${file}: ${err}`)
      }
    }
    
    return sprints
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return []
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// Migration Engine (Tasks 2.7, 2.8, 2.9)
// ---------------------------------------------------------------------------

async function detectOldFormat(sprintsDir: string): Promise<MigrationState> {
  const oldPath = join(sprintsDir, "sprint-status.yaml")
  const activePath = join(sprintsDir, "active")
  
  let oldExists = false
  let activeExists = false
  let oldContent = ""
  
  try {
    oldContent = await readFile(oldPath, "utf-8")
    oldExists = true
  } catch {}
  
  try {
    await readdir(activePath)
    activeExists = true
  } catch {}
  
  // Both exist - conflict
  if (oldExists && activeExists) {
    return { type: "conflict", activePath, oldPath }
  }
  
  // Only new format exists
  if (activeExists) {
    return { type: "new_format", activePath }
  }
  
  // Only old format exists
  if (oldExists) {
    // Check if template-only
    if (oldContent.includes("[Project Name]") && oldContent.includes("[Sprint goal]")) {
      return { type: "template_only" }
    }
    
    const data = parseLegacyYaml(oldContent)
    return { type: "old_format", oldPath, data }
  }
  
  // Neither exists
  return { type: "no_data" }
}

async function migrateToNewFormat(sprintsDir: string, data: LegacySprintData): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedActive: 0,
    migratedCompleted: 0,
    warnings: [],
  }
  
  try {
    // Create directories
    const activePath = join(sprintsDir, "active")
    const completedPath = join(sprintsDir, "completed")
    
    await mkdir(activePath, { recursive: true })
    await mkdir(completedPath, { recursive: true })
    
    // Migrate current sprint
    const currentNumber = data.current_sprint.number
    const currentFile: SprintFile = {
      version: 1,
      sprint: {
        number: data.current_sprint.number,
        goal: data.current_sprint.goal,
        start_date: data.current_sprint.start_date,
        end_date: data.current_sprint.end_date,
        stories: data.current_sprint.stories.map(s => ({
          id: s.id,
          title: s.title,
          status: s.status as StoryStatus,
          points: s.points,
          blocked_reason: s.blocked_reason,
        })),
        velocity: data.current_sprint.velocity,
      },
    }
    
    const currentFilePath = join(activePath, `sprint-${String(currentNumber).padStart(3, "0")}.yaml`)
    await writeFile(currentFilePath, formatSprintYaml(currentFile), "utf-8")
    result.migratedActive = 1
    
    // Migrate previous sprints
    for (const prev of data.previous_sprints) {
      let datePrefix = prev.end_date || `unknown-${String(prev.number).padStart(3, "0")}`
      
      if (!prev.end_date) {
        result.warnings.push(
          `Sprint ${prev.number} has no end_date. Using 'unknown-${String(prev.number).padStart(3, "0")}' as filename prefix.`
        )
      }
      
      const prevFile: SprintFile = {
        version: 1,
        sprint: {
          number: prev.number,
          goal: prev.goal,
          start_date: "", // Not available in old format
          end_date: prev.end_date || "",
          closed_date: prev.end_date || "",
          story_count: 0, // Not available
          stories_completed: 0, // Would need to be calculated if stories were present
          stories_carried_over: 0,
          stories: [], // Previous sprints don't have full story data in old format
          velocity: prev.velocity,
          retro: prev.retro,
        },
      }
      
      let filename = `${datePrefix}-sprint-${String(prev.number).padStart(3, "0")}.yaml`
      let filePath = join(completedPath, filename)
      
      // Handle filename collision (Edge Case #8)
      let suffix = 2
      while (true) {
        try {
          await readFile(filePath)
          // File exists, try with suffix
          filename = `${datePrefix}-sprint-${String(prev.number).padStart(3, "0")}-${suffix}.yaml`
          filePath = join(completedPath, filename)
          suffix++
        } catch {
          // File doesn't exist, we can use this filename
          break
        }
      }
      
      await writeFile(filePath, formatSprintYaml(prevFile), "utf-8")
      result.migratedCompleted++
    }
    
    // Create sequence file
    const maxNumber = Math.max(
      currentNumber,
      ...data.previous_sprints.map(p => p.number),
      0
    )
    
    const sequenceFile: SequenceFile = {
      version: 1,
      next_sprint_number: maxNumber + 1,
      project: data.project,
    }
    
    const sequencePath = join(sprintsDir, "sprint-sequence.yaml")
    await writeFile(sequencePath, formatSequenceYaml(sequenceFile), "utf-8")
    
    // Backup old file
    const oldPath = join(sprintsDir, "sprint-status.yaml")
    const backupPath = oldPath + ".bak"
    await rename(oldPath, backupPath)
    
    result.success = true
  } catch (err) {
    result.success = false
    result.warnings.push(`Migration failed: ${err}`)
  }
  
  return result
}

async function rebuildSequenceFile(sprintsDir: string): Promise<SequenceFile> {
  const activePath = join(sprintsDir, "active")
  const completedPath = join(sprintsDir, "completed")
  
  let maxNumber = 0
  
  // Scan active directory
  try {
    const activeFiles = await readdir(activePath)
    for (const file of activeFiles) {
      const match = file.match(/sprint-(\d{3})\.yaml/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNumber) maxNumber = num
      }
    }
  } catch {}
  
  // Scan completed directory
  try {
    const completedFiles = await readdir(completedPath)
    for (const file of completedFiles) {
      const match = file.match(/sprint-(\d{3})(-\d+)?\.yaml/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNumber) maxNumber = num
      }
    }
  } catch {}
  
  const sequence: SequenceFile = {
    version: 1,
    next_sprint_number: maxNumber + 1,
    project: "[Project Name]",
  }
  
  console.warn(`Warning: sprint-sequence.yaml was missing or corrupt. Rebuilt with next sprint number ${sequence.next_sprint_number}.`)
  
  return sequence
}

// ---------------------------------------------------------------------------
// YAML Formatters (Helper functions for migration)
// ---------------------------------------------------------------------------

function formatSprintYaml(sprint: SprintFile): string {
  let output = `# Sprint ${sprint.sprint.number}\nversion: ${sprint.version}\nsprint:\n`
  output += `  number: ${sprint.sprint.number}\n`
  output += `  goal: "${sprint.sprint.goal}"\n`
  output += `  start_date: "${sprint.sprint.start_date}"\n`
  output += `  end_date: "${sprint.sprint.end_date}"\n`
  
  if (sprint.sprint.closed_date) {
    output += `  closed_date: "${sprint.sprint.closed_date}"\n`
    output += `  story_count: ${sprint.sprint.story_count || 0}\n`
    output += `  stories_completed: ${sprint.sprint.stories_completed || 0}\n`
    output += `  stories_carried_over: ${sprint.sprint.stories_carried_over || 0}\n`
  }
  
  output += `\n  stories:\n`
  for (const story of sprint.sprint.stories) {
    output += `    - id: "${story.id}"\n`
    output += `      title: "${story.title}"\n`
    output += `      status: ${story.status}\n`
    output += `      points: ${story.points}\n`
    if (story.blocked_reason) {
      output += `      blocked_reason: "${story.blocked_reason}"\n`
    }
  }
  
  output += `\n  velocity:\n`
  output += `    planned: ${sprint.sprint.velocity.planned}\n`
  output += `    completed: ${sprint.sprint.velocity.completed}\n`
  
  if (sprint.sprint.retro) {
    output += `  retro: "${sprint.sprint.retro}"\n`
  }
  
  return output
}

function formatSequenceYaml(seq: SequenceFile): string {
  return (
    `# Sprint Sequence Tracker\n` +
    `# Auto-managed by forge-scrum agent. Do not edit manually.\n\n` +
    `version: ${seq.version}\n` +
    `next_sprint_number: ${seq.next_sprint_number}\n` +
    `project: "${seq.project}"\n`
  )
}

// ---------------------------------------------------------------------------
// Dashboard Renderers (Tasks 2.10, 2.11, 2.12, 2.13)
// ---------------------------------------------------------------------------

function renderProgressBar(completed: number, total: number, width: number = 20): string {
  if (total === 0) return "░".repeat(width) + " 0/0 (0%)"
  const ratio = Math.min(completed / total, 1)
  const filled = Math.round(ratio * width)
  const empty = width - filled
  const pct = Math.round(ratio * 100)
  return "█".repeat(filled) + "░".repeat(empty) + ` ${completed}/${total} stories (${pct}%)`
}

function renderSprintSection(sprint: SprintFile): string {
  const s = sprint.sprint
  const stories = s.stories
  
  // Group stories by status
  const done = stories.filter(st => st.status === "done")
  const inProgress = stories.filter(st => st.status === "in_progress")
  const blocked = stories.filter(st => st.status === "blocked")
  const pending = stories.filter(st => st.status === "pending")
  const carriedOver = stories.filter(st => st.status === "carried_over")
  
  let output = ""
  
  // Header
  output += `Sprint ${s.number}`
  if (s.goal) output += ` | Goal: ${s.goal}`
  output += `\n`
  
  if (s.start_date && s.end_date) {
    output += `Period: ${s.start_date} — ${s.end_date}\n`
  }
  output += `\n`
  
  // Progress bar
  output += `Progress: ${renderProgressBar(done.length, stories.length)}\n`
  
  const donePoints = done.reduce((sum, st) => sum + st.points, 0)
  const totalPoints = stories.reduce((sum, st) => sum + st.points, 0)
  output += `Points:   ${donePoints}/${totalPoints} pts\n\n`
  
  // Story lists
  if (done.length > 0) {
    output += `Done (${done.length}):\n`
    for (const st of done) {
      output += `  [done]      ${st.id} ${st.title} [${st.points}pt]\n`
    }
    output += `\n`
  }
  
  if (inProgress.length > 0) {
    output += `In Progress (${inProgress.length}):\n`
    for (const st of inProgress) {
      output += `  [active]    ${st.id} ${st.title} [${st.points}pt]\n`
    }
    output += `\n`
  }
  
  if (blocked.length > 0) {
    output += `Blocked (${blocked.length}):\n`
    for (const st of blocked) {
      const reason = st.blocked_reason ? ` — ${st.blocked_reason}` : ""
      output += `  [BLOCKED]   ${st.id} ${st.title} [${st.points}pt]${reason}\n`
    }
    output += `\n`
  }
  
  if (pending.length > 0) {
    output += `Pending (${pending.length}):\n`
    for (const st of pending) {
      output += `  [pending]   ${st.id} ${st.title} [${st.points}pt]\n`
    }
    output += `\n`
  }
  
  if (carriedOver.length > 0) {
    output += `Carried Over (${carriedOver.length}):\n`
    for (const st of carriedOver) {
      output += `  [carried]   ${st.id} ${st.title} [${st.points}pt]\n`
    }
    output += `\n`
  }
  
  if (stories.length === 0) {
    output += `No stories in this sprint.\n\n`
  }
  
  return output
}

function renderVelocityTrend(completed: SprintFile[]): string {
  if (completed.length === 0) return ""
  
  let output = `--- Velocity Trend (last ${completed.length} completed) ---\n`
  
  for (const sprint of completed.reverse()) {
    const s = sprint.sprint
    const pct = s.velocity.planned > 0
      ? Math.round((s.velocity.completed / s.velocity.planned) * 100)
      : 0
    output += `  Sprint ${s.number}: ${s.velocity.completed}/${s.velocity.planned} pts (${pct}%)\n`
  }
  
  return output
}

function renderAggregateDashboard(sprints: SprintFile[], completed: SprintFile[]): string {
  let output = `=== FORGE Sprint Dashboard ===\n\n`
  
  // Warning if >5 active sprints (NFR-002)
  if (sprints.length > 5) {
    output += `⚠ ${sprints.length} active sprints detected. Consider closing completed sprints for optimal performance.\n\n`
  }
  
  // Render each active sprint
  for (let i = 0; i < sprints.length; i++) {
    output += renderSprintSection(sprints[i])
    if (i < sprints.length - 1) {
      output += `---\n\n`
    }
  }
  
  // Velocity trend
  if (completed.length > 0) {
    output += renderVelocityTrend(completed)
  }
  
  return output
}

function renderSprintList(active: SprintFile[], completed: SprintFile[]): string {
  let output = `=== FORGE Sprint List ===\n\n`
  
  if (active.length > 0) {
    output += `Active Sprints:\n`
    output += `| #   | Status | Goal                       | Period                    | Velocity   |\n`
    
    for (const sprint of active) {
      const s = sprint.sprint
      const num = String(s.number).padStart(3, "0")
      const goal = s.goal.slice(0, 27).padEnd(27)
      const period = `${s.start_date} — ${s.end_date}`
      const velocity = `${s.velocity.completed}/${s.velocity.planned} pts`
      output += `| ${num} | Active | ${goal} | ${period.padEnd(25)} | ${velocity.padEnd(10)} |\n`
    }
    output += `\n`
  }
  
  if (completed.length > 0) {
    output += `Recent Completed Sprints (last ${completed.length}):\n`
    output += `| #   | Status    | Goal                       | Closed     | Velocity   |\n`
    
    for (const sprint of completed) {
      const s = sprint.sprint
      const num = String(s.number).padStart(3, "0")
      const goal = s.goal.slice(0, 27).padEnd(27)
      const closed = s.closed_date || s.end_date || "unknown"
      const velocity = `${s.velocity.completed}/${s.velocity.planned} pts`
      output += `| ${num} | Completed | ${goal} | ${closed.padEnd(10)} | ${velocity.padEnd(10)} |\n`
    }
  }
  
  if (active.length === 0 && completed.length === 0) {
    output += `(no sprints found)\n`
  }
  
  return output
}

// ---------------------------------------------------------------------------
// Tool Definition (Task 2.14, 2.15)
// ---------------------------------------------------------------------------

export default tool({
  description:
    "Display the FORGE sprint status dashboard with multi-sprint support. " +
    "Reads sprint files from .forge/sprints/active/ and renders an aggregate dashboard " +
    "showing all active sprints with progress bars, story lists, and velocity metrics. " +
    "Supports automatic migration from old single-file format.",
  args: {},
  async execute(_args, context) {
    const rootDir = context.worktree || context.directory
    const sprintsDir = join(rootDir, ".forge", "sprints")
    
    try {
      // Detect format (Task 2.7)
      const state = await detectOldFormat(sprintsDir)
      
      switch (state.type) {
        case "new_format": {
          // Read active sprints (Task 2.5)
          const activeSprints = await readActiveSprints(sprintsDir)
          
          if (activeSprints.length === 0) {
            return (
              `No active sprints. Run /forge-sprint start to create one.\n\n` +
              `The active sprint directory exists but is empty.`
            )
          }
          
          // Read completed sprints for velocity trend (Task 2.6)
          const completedSprints = await readCompletedSprints(sprintsDir, 5)
          
          // Render aggregate dashboard (Task 2.12)
          return renderAggregateDashboard(activeSprints, completedSprints)
        }
        
        case "old_format": {
          // Return migration prompt (FR-015)
          return (
            `FORGE Sprint Format Migration\n` +
            `==============================\n\n` +
            `Detected: .forge/sprints/sprint-status.yaml (legacy single-file format)\n\n` +
            `FORGE now supports multiple concurrent sprints with automatic archiving.\n` +
            `This requires migrating to a new directory structure:\n\n` +
            `  Before: .forge/sprints/sprint-status.yaml (single file, all data)\n` +
            `  After:  .forge/sprints/active/sprint-NNN.yaml (one file per sprint)\n` +
            `          .forge/sprints/completed/YYYY-MM-DD-sprint-NNN.yaml (archives)\n\n` +
            `What will happen:\n` +
            `  - Current sprint → active/sprint-${String(state.data.current_sprint.number).padStart(3, "0")}.yaml\n` +
            `  - ${state.data.previous_sprints.length} previous sprint(s) → completed/ (summary format)\n` +
            `  - Original file renamed to sprint-status.yaml.bak\n\n` +
            `To migrate: Run /forge-sprint (the command will handle migration)\n` +
            `To continue without migrating: The old format will remain readable\n`
          )
        }
        
        case "template_only": {
          return (
            `Sprint status file exists but contains only template data.\n\n` +
            `Run /forge-sprint start to create your first sprint.`
          )
        }
        
        case "conflict": {
          return (
            `Warning: Both old format (sprint-status.yaml) and new format (active/ directory) exist.\n\n` +
            `This usually happens if migration was partially completed.\n` +
            `The tool is currently reading from the new format (active/ directory).\n\n` +
            `If you want to use the old format, remove or rename the active/ directory.\n` +
            `If you want to use the new format, rename sprint-status.yaml to sprint-status.yaml.bak`
          )
        }
        
        case "no_data": {
          return (
            `No sprint data found.\n\n` +
            `Run /forge-sprint start to initialize sprint planning with the new multi-sprint format.`
          )
        }
      }
    } catch (err: any) {
      // Filesystem error handling (NFR-006)
      if (err.code === "ENOENT") {
        return (
          `Error: Sprint directory or file not found.\n\n` +
          `The .forge/sprints/ directory structure may be incomplete.\n\n` +
          `To fix: Run /forge-sprint start to initialize the sprint system.\n` +
          `Example: /forge-sprint start`
        )
      } else if (err.code === "EACCES") {
        return (
          `Error: Permission denied accessing sprint files.\n\n` +
          `The .forge/sprints/ directory or files are not readable.\n\n` +
          `To fix: Check file permissions:\n` +
          `  chmod -R u+rw .forge/sprints/`
        )
      } else if (err.code === "EEXIST") {
        return (
          `Error: File or directory already exists.\n\n` +
          `This may indicate a conflict in the sprint directory structure.\n\n` +
          `To fix: Check for conflicting files in .forge/sprints/ and remove duplicates.`
        )
      }
      
      const message = err instanceof Error ? err.message : String(err)
      return (
        `ERROR: Failed to read sprint status.\n\n` +
        `Cause: ${message}\n\n` +
        `This may indicate a corrupted sprint file or directory structure.\n\n` +
        `To investigate: Check .forge/sprints/ directory contents\n` +
        `To retry: Ensure all sprint files are valid YAML format`
      )
    }
  },
})
