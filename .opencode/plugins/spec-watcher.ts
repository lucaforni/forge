import type { Plugin } from "@opencode-ai/plugin"
import { readFile, access } from "node:fs/promises"
import { join, relative, dirname, basename } from "node:path"

/**
 * spec-watcher — Monitors .forge/specs/ for changes and checks consistency.
 *
 * When a spec file is modified:
 *   1. Checks if corresponding plan.md and/or tasks.md exist
 *   2. Performs lightweight consistency check:
 *      - Did the spec add new requirements not in the plan?
 *      - Did the spec remove requirements the plan still references?
 *   3. Shows toast suggesting /forge-analyze if inconsistencies detected
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Extract requirement IDs (FR-NNN, NFR-NNN) from a document.
 */
function extractRequirementIds(content: string): Set<string> {
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
function getSpecDir(filePath: string, rootDir: string): string | null {
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

interface ConsistencyIssue {
  type: "new_requirement" | "removed_requirement" | "missing_document"
  message: string
}

// Debounce: track recently checked spec dirs
const recentlyChecked = new Map<string, number>()
const DEBOUNCE_MS = 15_000

function shouldDebounce(specDir: string): boolean {
  const now = Date.now()
  const lastCheck = recentlyChecked.get(specDir)
  if (lastCheck && now - lastCheck < DEBOUNCE_MS) return true
  recentlyChecked.set(specDir, now)
  return false
}

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

export const SpecWatcher: Plugin = async ({ client, directory, worktree }) => {
  const rootDir = worktree || directory

  return {
    event: async ({ event }) => {
      if (event.type !== "file.edited") return

      const filePath = (event.properties as { file?: string })?.file
      if (!filePath) return

      // Only watch files in .forge/specs/
      const relPath = relative(rootDir, filePath)
      if (!relPath.startsWith(".forge/specs/") && !relPath.startsWith(".forge\\specs\\")) {
        return
      }

      // Only watch spec documents (not any random file)
      const fileName = basename(filePath)
      if (!fileName.endsWith(".md")) return

      // Get the spec directory
      const specDir = getSpecDir(filePath, rootDir)
      if (!specDir) return

      // Debounce
      if (shouldDebounce(specDir)) return

      const issues: ConsistencyIssue[] = []

      // Read the modified spec file
      let specContent: string
      try {
        specContent = await readFile(filePath, "utf-8")
      } catch {
        return
      }

      const specReqIds = extractRequirementIds(specContent)
      if (specReqIds.size === 0) return // No requirements to check

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

      // Show toast if issues found
      if (issues.length === 0) return

      const specDirName = basename(specDir)
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

      try {
        await client.tui.showToast({
          body: {
            message: lines.join("\n"),
            variant: "info",
          },
        })
      } catch {
        // Toast display failed — non-critical
      }
    },
  }
}
