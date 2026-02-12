import type { Plugin } from "@opencode-ai/plugin"
import { readFile, readdir, access } from "node:fs/promises"
import { join, relative, dirname } from "node:path"

/**
 * pre-commit-gate — Advisory validation of spec-code consistency.
 *
 * Listens for file edits and session diffs. When source files are modified,
 * identifies the related spec/tasks and checks:
 *   1. Related tasks in tasks.md are marked complete
 *   2. Tests exist for modified source files
 *   3. No [NEEDS CLARIFICATION] markers in related specs
 *   4. Constitution compliance section is verified
 *
 * Advisory only — shows toast notifications but does NOT block commits.
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

async function findRelatedSpec(
  rootDir: string,
  filePath: string,
): Promise<{ specDir: string; specId: string } | null> {
  const specsDir = join(rootDir, ".forge", "specs")
  if (!(await fileExists(specsDir))) return null

  let entries: Awaited<ReturnType<typeof readdir>>
  try {
    entries = await readdir(specsDir, { withFileTypes: true })
  } catch {
    return null
  }

  // For each spec directory, check if the tasks.md or plan.md mentions this file
  const relPath = relative(rootDir, filePath)

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const specDir = join(specsDir, entry.name)

    // Check tasks.md
    const tasksPath = join(specDir, "tasks.md")
    if (await fileExists(tasksPath)) {
      try {
        const tasksContent = await readFile(tasksPath, "utf-8")
        if (tasksContent.includes(relPath)) {
          const specId = entry.name.split("-")[0]
          return { specDir, specId }
        }
      } catch {
        // skip
      }
    }

    // Check plan.md (File Map section)
    const planPath = join(specDir, "plan.md")
    if (await fileExists(planPath)) {
      try {
        const planContent = await readFile(planPath, "utf-8")
        if (planContent.includes(relPath)) {
          const specId = entry.name.split("-")[0]
          return { specDir, specId }
        }
      } catch {
        // skip
      }
    }
  }

  return null
}

interface GateIssue {
  severity: "error" | "warning" | "info"
  message: string
}

async function checkTaskCompletion(
  specDir: string,
  filePath: string,
  rootDir: string,
): Promise<GateIssue[]> {
  const issues: GateIssue[] = []
  const tasksPath = join(specDir, "tasks.md")

  if (!(await fileExists(tasksPath))) {
    issues.push({
      severity: "info",
      message: "No tasks.md found — cannot verify task completion",
    })
    return issues
  }

  try {
    const content = await readFile(tasksPath, "utf-8")
    const relPath = relative(rootDir, filePath)
    const lines = content.split("\n")

    for (const line of lines) {
      if (line.includes(relPath)) {
        // Check if the task is marked complete
        if (/^\s*-\s+\[\s\]/.test(line)) {
          const taskMatch = line.match(/(\d+\.\d+)/)
          const taskId = taskMatch ? taskMatch[1] : "unknown"
          issues.push({
            severity: "warning",
            message: `Task ${taskId} referencing ${relPath} is not yet marked complete`,
          })
        }
      }
    }
  } catch {
    // skip
  }

  return issues
}

async function checkTestExists(
  rootDir: string,
  filePath: string,
): Promise<GateIssue[]> {
  const issues: GateIssue[] = []
  const relPath = relative(rootDir, filePath)

  // Only check source files (not test files, configs, etc.)
  if (!relPath.startsWith("src/") || /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(relPath)) {
    return issues
  }

  // Skip non-code files
  if (!/\.(ts|js|tsx|jsx)$/.test(relPath)) {
    return issues
  }

  // Look for corresponding test files
  const testCandidates = [
    relPath.replace(/^src\//, "test/").replace(/\.(ts|js|tsx|jsx)$/, ".test.$1"),
    relPath.replace(/\.(ts|js|tsx|jsx)$/, ".test.$1"),
    relPath.replace(/^src\//, "src/__tests__/").replace(/\.(ts|js|tsx|jsx)$/, ".test.$1"),
    relPath.replace(/^src\//, "tests/").replace(/\.(ts|js|tsx|jsx)$/, ".test.$1"),
    relPath.replace(/\.(ts|js|tsx|jsx)$/, ".spec.$1"),
  ]

  let testFound = false
  for (const candidate of testCandidates) {
    if (await fileExists(join(rootDir, candidate))) {
      testFound = true
      break
    }
  }

  if (!testFound) {
    issues.push({
      severity: "warning",
      message: `No test file found for ${relPath}`,
    })
  }

  return issues
}

async function checkClarificationMarkers(
  specDir: string,
): Promise<GateIssue[]> {
  const issues: GateIssue[] = []

  // Check spec.md
  for (const fileName of ["spec.md", "tech-spec.md"]) {
    const specPath = join(specDir, fileName)
    if (await fileExists(specPath)) {
      try {
        const content = await readFile(specPath, "utf-8")
        const matches = content.match(/\[NEEDS CLARIFICATION\]/gi)
        if (matches && matches.length > 0) {
          issues.push({
            severity: "warning",
            message: `${fileName} has ${matches.length} [NEEDS CLARIFICATION] marker(s) — resolve before committing`,
          })
        }
      } catch {
        // skip
      }
    }
  }

  return issues
}

async function checkConstitutionCompliance(
  specDir: string,
): Promise<GateIssue[]> {
  const issues: GateIssue[] = []

  for (const fileName of ["spec.md", "tech-spec.md"]) {
    const specPath = join(specDir, fileName)
    if (!(await fileExists(specPath))) continue

    try {
      const content = await readFile(specPath, "utf-8")

      // Check for Constitution Compliance section
      const complianceMatch = content.match(
        /## \d*\.?\s*Constitution Compliance([\s\S]*?)(?=\n## |\Z)/,
      )
      if (!complianceMatch) {
        issues.push({
          severity: "info",
          message: `${fileName} is missing Constitution Compliance section`,
        })
        continue
      }

      // Check if any articles have empty status
      const emptyArticles = complianceMatch[1].match(
        /\|\s*Art\.\s*\d+\s*\|\s*\|\s*/g,
      )
      if (emptyArticles && emptyArticles.length > 0) {
        issues.push({
          severity: "info",
          message: `${fileName} has ${emptyArticles.length} article(s) without compliance status`,
        })
      }
    } catch {
      // skip
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Track recently checked files to avoid repeated checks in the same session
// ---------------------------------------------------------------------------
const recentlyChecked = new Set<string>()
const DEBOUNCE_MS = 30_000 // 30 seconds

function debounceFile(filePath: string): boolean {
  if (recentlyChecked.has(filePath)) return true
  recentlyChecked.add(filePath)
  setTimeout(() => recentlyChecked.delete(filePath), DEBOUNCE_MS)
  return false
}

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

export const PreCommitGate: Plugin = async ({ client, directory, worktree }) => {
  const rootDir = worktree || directory

  return {
    event: async ({ event }) => {
      // Handle file.edited events
      if (event.type === "file.edited") {
        const filePath = (event.properties as { file?: string })?.file
        if (!filePath) return

        // Debounce — skip if we just checked this file
        if (debounceFile(filePath)) return

        // Only check source files, not FORGE docs or configs
        const relPath = relative(rootDir, filePath)
        if (
          relPath.startsWith(".forge/") ||
          relPath.startsWith(".opencode/") ||
          relPath.startsWith("node_modules/")
        ) {
          return
        }

        // Find related spec
        const spec = await findRelatedSpec(rootDir, filePath)
        if (!spec) return // No spec tracking this file, skip

        // Run all checks
        const allIssues: GateIssue[] = []
        const [taskIssues, testIssues, clarifyIssues, complianceIssues] =
          await Promise.all([
            checkTaskCompletion(spec.specDir, filePath, rootDir),
            checkTestExists(rootDir, filePath),
            checkClarificationMarkers(spec.specDir),
            checkConstitutionCompliance(spec.specDir),
          ])

        allIssues.push(
          ...taskIssues,
          ...testIssues,
          ...clarifyIssues,
          ...complianceIssues,
        )

        // Show toast if there are issues
        const warnings = allIssues.filter((i) => i.severity === "warning")
        const errors = allIssues.filter((i) => i.severity === "error")

        if (errors.length > 0 || warnings.length > 0) {
          const lines: string[] = [
            `FORGE Gate (Spec ${spec.specId}):`,
          ]

          for (const issue of [...errors, ...warnings].slice(0, 5)) {
            lines.push(`  - ${issue.message}`)
          }

          const remaining =
            errors.length + warnings.length - 5
          if (remaining > 0) {
            lines.push(`  ... and ${remaining} more`)
          }

          lines.push("Run /forge-analyze for full validation.")

          try {
            await client.tui.showToast({
              body: {
                message: lines.join("\n"),
                variant: errors.length > 0 ? "error" : "info",
              },
            })
          } catch {
            // Toast display failed — non-critical
          }
        }
      }
    },
  }
}
