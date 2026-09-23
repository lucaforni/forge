/**
 * spec-watcher/shared — Pure spec-consistency helpers.
 *
 * Zero plugin-SDK imports: shared by the server entry (`index.ts`) and the
 * CLI entry (`tui.ts`), and unit-testable without OpenCode.
 */

import { readFile, access } from "node:fs/promises"
import { join, relative, basename } from "node:path"

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Requirement extraction
// ---------------------------------------------------------------------------

/** Extract requirement IDs (FR-NNN, NFR-NNN) from a document. */
export function extractRequirementIds(content: string): Set<string> {
  const ids = new Set<string>()
  const pattern = /\b((?:FR|NFR)-\d{3})\b/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(content)) !== null) {
    ids.add(match[1])
  }
  return ids
}

/**
 * Find the spec directory from a file path within .forge/specs/.
 * e.g., .forge/specs/001-auth/spec.md -> .forge/specs/001-auth/
 */
export function getSpecDir(filePath: string, rootDir: string): string | null {
  const relPath = relative(rootDir, filePath)

  // Must be inside .forge/specs/
  if (!relPath.startsWith(".forge/specs/") && !relPath.startsWith(".forge\\specs\\")) {
    return null
  }

  // The spec directory is the first directory level after .forge/specs/
  const parts = relPath.split(/[/\\]/)
  if (parts.length < 4) return null // .forge/specs/NNN-slug/file.md

  return join(rootDir, parts[0], parts[1], parts[2])
}

/** True when an edited path is a spec document worth checking. */
export function isWatchedSpecFile(rootDir: string, filePath: string): boolean {
  const relPath = relative(rootDir, filePath)
  if (!relPath.startsWith(".forge/specs/") && !relPath.startsWith(".forge\\specs\\")) {
    return false
  }
  return basename(filePath).endsWith(".md")
}

// ---------------------------------------------------------------------------
// Consistency check
// ---------------------------------------------------------------------------

export interface ConsistencyIssue {
  type: "new_requirement" | "removed_requirement" | "missing_document"
  message: string
}

export async function checkSpecConsistency(
  specDir: string,
  specContent: string,
): Promise<ConsistencyIssue[]> {
  const issues: ConsistencyIssue[] = []
  const specReqIds = extractRequirementIds(specContent)
  if (specReqIds.size === 0) return [] // No requirements to check

  // Check plan.md
  const planPath = join(specDir, "plan.md")
  const hasPlan = await fileExists(planPath)

  if (!hasPlan) {
    issues.push({
      type: "missing_document",
      message: "No plan.md found for this spec — run /forge-plan to create one",
    })
  } else {
    try {
      const planContent = await readFile(planPath, "utf-8")
      const planReqIds = extractRequirementIds(planContent)

      // Check for new requirements in spec not in plan
      for (const id of specReqIds) {
        if (!planReqIds.has(id)) {
          issues.push({
            type: "new_requirement",
            message: `${id} is in spec but not referenced in plan.md`,
          })
        }
      }

      // Check for removed requirements (in plan but not in spec)
      for (const id of planReqIds) {
        if (!specReqIds.has(id)) {
          issues.push({
            type: "removed_requirement",
            message: `${id} is referenced in plan.md but no longer in spec`,
          })
        }
      }
    } catch {
      // Plan read failed, skip
    }
  }

  // Check tasks.md
  const tasksPath = join(specDir, "tasks.md")
  const hasTasks = await fileExists(tasksPath)

  if (!hasTasks && hasPlan) {
    issues.push({
      type: "missing_document",
      message: "No tasks.md found — run /forge-tasks to create task breakdown",
    })
  } else if (hasTasks) {
    try {
      const tasksContent = await readFile(tasksPath, "utf-8")
      const tasksReqIds = extractRequirementIds(tasksContent)

      // Check for requirements in spec not covered by tasks
      for (const id of specReqIds) {
        if (!tasksReqIds.has(id)) {
          issues.push({
            type: "new_requirement",
            message: `${id} is in spec but has no task in tasks.md`,
          })
        }
      }
    } catch {
      // Tasks read failed, skip
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Message shaping
// ---------------------------------------------------------------------------

/** Render the advisory toast body. Returns null when consistent. */
export function formatWatcherMessage(
  specDirName: string,
  issues: ConsistencyIssue[],
): string | null {
  if (issues.length === 0) return null

  const newReqs = issues.filter((i) => i.type === "new_requirement")
  const removedReqs = issues.filter((i) => i.type === "removed_requirement")
  const missingDocs = issues.filter((i) => i.type === "missing_document")

  const lines: string[] = [`FORGE Spec Watcher (${specDirName}):`]

  if (newReqs.length > 0) {
    lines.push(`  ${newReqs.length} new requirement(s) not in downstream docs`)
  }
  if (removedReqs.length > 0) {
    lines.push(
      `  ${removedReqs.length} requirement(s) removed but still referenced`,
    )
  }
  if (missingDocs.length > 0) {
    for (const doc of missingDocs) {
      lines.push(`  ${doc.message}`)
    }
  }

  lines.push("Run /forge-analyze to validate consistency.")
  return lines.join("\n")
}
