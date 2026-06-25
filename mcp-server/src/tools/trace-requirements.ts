/**
 * mcp-server/src/tools/trace-requirements.ts — Requirements traceability logic.
 *
 * Pure function extracted from .opencode/tools/trace-requirements.ts.
 * Traces FR/NFR requirements from a spec through plan, tasks, source files, and test files.
 */

import { readFile, readdir, access } from "node:fs/promises"
import { resolve, join, relative } from "node:path"
import { extractRequirementIds } from "../lib/spec-parse"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TraceOptions {
  specId?: string
  specPath?: string
}

export interface RequirementTrace {
  id: string
  description: string
  planSections: string[]
  taskItems: string[]
  sourceFiles: string[]
  testFiles: string[]
}

export interface TraceResult {
  specId: string
  requirements: RequirementTrace[]
  gaps: string[]
  coverage: number
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function traceRequirements(options: TraceOptions): Promise<TraceResult> {
  const projectRoot = process.cwd()
  let specDir: string | null = null
  let specId = options.specId || ""

  if (options.specPath) {
    const absSpecPath = resolve(options.specPath)
    specDir = resolve(join(absSpecPath, ".."))
    specId = specId || basenameNoExt(absSpecPath)
  } else if (specId) {
    specDir = await findSpecDir(projectRoot, specId)
  } else {
    throw new Error("Either specId or specPath is required")
  }

  if (!specDir) {
    throw new Error(`Spec directory not found for ID: ${specId}`)
  }

  // Read spec
  const specPath = join(specDir, "spec.md")
  let specContent: string
  try {
    specContent = await readFile(specPath, "utf-8")
  } catch {
    throw new Error(`Spec file not found: ${specPath}`)
  }

  // Extract requirement IDs
  const reqIds = extractRequirementIds(specContent)
  const requirements: RequirementTrace[] = []
  const gaps: string[] = []

  // Read plan (if exists)
  let planContent = ""
  const planPath = join(specDir, "plan.md")
  try {
    planContent = await readFile(planPath, "utf-8")
  } catch {
    // no plan — skip
  }

  // Read tasks (if exists)
  let tasksContent = ""
  const tasksPath = join(specDir, "tasks.md")
  try {
    tasksContent = await readFile(tasksPath, "utf-8")
  } catch {
    // no tasks — skip
  }

  // For each requirement, try to trace it
  for (const reqId of reqIds) {
    const trace: RequirementTrace = {
      id: reqId,
      description: extractReqDescription(specContent, reqId),
      planSections: [],
      taskItems: [],
      sourceFiles: [],
      testFiles: [],
    }

    // Trace to plan
    if (planContent && planContent.includes(reqId)) {
      trace.planSections = findPlanSections(planContent, reqId)
    }

    // Trace to tasks
    if (tasksContent && tasksContent.includes(reqId)) {
      trace.taskItems = findTaskItems(tasksContent, reqId)
    }

    // Try to find source files (convention: req ID in imports or comments)
    const sourceDir = join(projectRoot, "src")
    trace.sourceFiles = await findFilesReferencing(sourceDir, reqId, [".ts", ".tsx", ".js", ".jsx"])

    // Try to find test files
    const testDir = join(projectRoot, "tests")
    trace.testFiles = await findFilesReferencing(testDir, reqId, [".test.ts", ".test.tsx", ".spec.ts"])

    // Check gaps
    if (trace.sourceFiles.length === 0) {
      gaps.push(`${reqId}: [NOT IMPLEMENTED] — no source files reference this requirement`)
    } else if (trace.testFiles.length === 0) {
      gaps.push(`${reqId}: [NO TESTS] — source files exist but no tests reference this requirement`)
    }

    requirements.push(trace)
  }

  // Coverage
  const implemented = requirements.filter((r) => r.sourceFiles.length > 0).length
  const tested = requirements.filter((r) => r.testFiles.length > 0).length
  const coverage = requirements.length > 0 ? Math.round((tested / requirements.length) * 100) : 0

  return {
    specId,
    requirements,
    gaps,
    coverage,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findSpecDir(projectRoot: string, specId: string): Promise<string | null> {
  const specsDir = join(projectRoot, ".forge", "specs")
  let entries: string[]
  try {
    entries = await readdir(specsDir)
  } catch {
    return null
  }

  for (const entry of entries) {
    if (entry.startsWith(`${specId}-`)) {
      return join(specsDir, entry)
    }
  }
  return null
}

function extractReqDescription(content: string, reqId: string): string {
  const pattern = new RegExp(`\\|\\s*${reqId}\\s*\\|\\s*([^|]+?)\\s*\\|`)
  const match = content.match(pattern)
  return match ? match[1].trim() : `Requirement ${reqId}`
}

function findPlanSections(planContent: string, reqId: string): string[] {
  const sections: string[] = []
  const lines = planContent.split("\n")
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(reqId)) {
      // Find the nearest heading
      for (let j = i; j >= 0; j--) {
        const headingMatch = lines[j].match(/^#{2,3}\s+(.+)/)
        if (headingMatch) {
          sections.push(headingMatch[1].trim())
          break
        }
      }
    }
  }
  return [...new Set(sections)]
}

function findTaskItems(tasksContent: string, reqId: string): string[] {
  const items: string[] = []
  const lines = tasksContent.split("\n")
  for (const line of lines) {
    if (line.includes(reqId)) {
      const taskMatch = line.match(/\[.\]\s+\*\*(T-\d+)\*\*\s+(.+)/)
      if (taskMatch) {
        items.push(`${taskMatch[1]}: ${taskMatch[2].trim()}`)
      }
    }
  }
  return items
}

async function findFilesReferencing(
  rootDir: string,
  pattern: string,
  extensions: string[],
): Promise<string[]> {
  const results: string[] = []
  try {
    await access(rootDir)
  } catch {
    return results
  }

  async function walk(dir: string): Promise<void> {
    let entries: string[]
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        await walk(fullPath)
      } else if (entry.isFile()) {
        const ext = extensions.find((e) => entry.name.endsWith(e))
        if (ext) {
          try {
            const content = await readFile(fullPath, "utf-8")
            if (content.includes(pattern)) {
              results.push(fullPath)
            }
          } catch {
            // skip unreadable files
          }
        }
      }
    }
  }

  await walk(rootDir)
  return results
}

function basenameNoExt(filePath: string): string {
  const basename = filePath.split("/").pop()?.split("\\").pop() ?? ""
  return basename.replace(/\.[^.]+$/, "")
}
