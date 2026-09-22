/**
 * pre-commit-gate/shared — Pure advisory-check helpers.
 *
 * Zero plugin-SDK imports: this module runs in both the server entry
 * (`index.ts`) and the CLI entry (`tui.ts`), and is unit-testable without
 * OpenCode. All checks are advisory — they shape messages, never block.
 */

import { readFile, readdir, access } from "node:fs/promises"
import type { Dirent } from "node:fs"
import { join, relative } from "node:path"

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
// Spec linkage
// ---------------------------------------------------------------------------

export async function findRelatedSpec(
  rootDir: string,
  filePath: string,
): Promise<{ specDir: string; specId: string } | null> {
  const specsDir = join(rootDir, ".forge", "specs")
  if (!(await fileExists(specsDir))) return null

  let entries: Dirent[]
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

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

export interface GateIssue {
  severity: "error" | "warning" | "info"
  message: string
}

export async function checkTaskCompletion(
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

export async function checkTestExists(
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

export async function checkClarificationMarkers(
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

export async function checkConstitutionCompliance(
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
// Message shaping
// ---------------------------------------------------------------------------

/** Render the advisory toast body. Max 5 findings; returns null when quiet. */
export function formatGateMessage(specId: string, allIssues: GateIssue[]): string | null {
  const warnings = allIssues.filter((i) => i.severity === "warning")
  const errors = allIssues.filter((i) => i.severity === "error")
  if (errors.length === 0 && warnings.length === 0) return null

  const lines: string[] = [`FORGE Gate (Spec ${specId}):`]
  for (const issue of [...errors, ...warnings].slice(0, 5)) {
    lines.push(`  - ${issue.message}`)
  }
  const remaining = errors.length + warnings.length - 5
  if (remaining > 0) {
    lines.push(`  ... and ${remaining} more`)
  }
  lines.push("Run /forge-analyze for full validation.")
  return lines.join("\n")
}

/** Toast variant for a set of issues. */
export function gateVariant(allIssues: GateIssue[]): "error" | "info" {
  return allIssues.some((i) => i.severity === "error") ? "error" : "info"
}

/** True when an edited path is worth checking (not FORGE internals). */
export function isCheckablePath(rootDir: string, filePath: string): boolean {
  const relPath = relative(rootDir, filePath)
  return !(
    relPath.startsWith(".forge/") ||
    relPath.startsWith(".opencode/") ||
    relPath.startsWith("node_modules/")
  )
}
