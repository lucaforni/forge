import { tool } from "@opencode-ai/plugin"
import { readFile, readdir, access } from "node:fs/promises"
import { resolve, join, relative } from "node:path"

/**
 * trace-requirements — Maps FR/NFR requirements from a spec to plan sections,
 * task items, source files, and test files.
 *
 * Returns a traceability matrix showing coverage and gaps.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequirementTrace {
  id: string
  description: string
  planSections: string[]
  taskItems: string[]
  sourceFiles: string[]
  testFiles: string[]
}

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

async function findSpecDir(
  rootDir: string,
  specId: string,
): Promise<string | null> {
  const specsDir = join(rootDir, ".forge", "specs")
  if (!(await fileExists(specsDir))) return null

  const entries = await readdir(specsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith(`${specId}-`)) {
      return join(specsDir, entry.name)
    }
  }
  // Also try exact match (just the ID)
  const exactPath = join(specsDir, specId)
  if (await fileExists(exactPath)) return exactPath

  return null
}

function extractRequirements(
  specContent: string,
): { id: string; description: string }[] {
  const requirements: { id: string; description: string }[] = []

  // Match FR rows: | FR-NNN | Description | Priority | Story Ref |
  const frPattern =
    /\|\s*(FR-\d{3})\s*\|\s*(.*?)\s*\|\s*(?:.*?)\s*\|\s*(?:.*?)\s*\|/g
  let match: RegExpExecArray | null
  while ((match = frPattern.exec(specContent)) !== null) {
    const desc = match[2].trim()
    if (desc) {
      requirements.push({ id: match[1], description: desc })
    }
  }

  // Match NFR rows: | NFR-NNN | Category | Description | Target |
  const nfrPattern =
    /\|\s*(NFR-\d{3})\s*\|\s*(?:.*?)\s*\|\s*(.*?)\s*\|\s*(?:.*?)\s*\|/g
  while ((match = nfrPattern.exec(specContent)) !== null) {
    const desc = match[2].trim()
    if (desc) {
      requirements.push({ id: match[1], description: desc })
    }
  }

  return requirements
}

function findPlanReferences(
  planContent: string,
  reqId: string,
): string[] {
  const references: string[] = []
  const lines = planContent.split("\n")

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(reqId)) {
      // Find the nearest section header above this line
      let sectionHeader = ""
      for (let j = i; j >= 0; j--) {
        const headerMatch = lines[j].match(/^(#{1,4})\s+(.+)/)
        if (headerMatch) {
          sectionHeader = headerMatch[2].trim()
          break
        }
      }
      const ref = sectionHeader
        ? `${sectionHeader} (line ${i + 1})`
        : `line ${i + 1}`
      if (!references.includes(ref)) {
        references.push(ref)
      }
    }
  }

  return references
}

function findTaskReferences(
  tasksContent: string,
  reqId: string,
): string[] {
  const references: string[] = []
  const lines = tasksContent.split("\n")

  for (const line of lines) {
    // Match task lines: - [ ] 1.1 [FR-001] ...
    // or                - [x] 2.3 [NFR-001] ...
    const taskMatch = line.match(
      /^-\s+\[[ x-]\]\s+(\d+\.\d+)\s+.*\[(\w+-\d+)\]/,
    )
    if (taskMatch && taskMatch[2] === reqId) {
      const status = line.includes("[x]")
        ? "done"
        : line.includes("[-]")
          ? "skipped"
          : "pending"
      references.push(`Task ${taskMatch[1]} (${status})`)
    }
  }

  return references
}

async function findSourceFiles(
  rootDir: string,
  planContent: string,
  reqId: string,
): Promise<string[]> {
  const sourceFiles: string[] = []

  // Strategy 1: Look at the File Map section in plan.md for paths
  // associated with this requirement via the Requirement Traceability section
  const traceSection = planContent.match(
    /## \d*\.?\s*Requirement Traceability([\s\S]*?)(?=\n## |\Z)/,
  )
  if (traceSection) {
    // | FR-001 | Plan Section | Implementation Path |
    const rowPattern = new RegExp(
      `\\|\\s*${reqId}\\s*\\|[^|]*\\|\\s*(.*?)\\s*\\|`,
    )
    const match = traceSection[1].match(rowPattern)
    if (match) {
      const implPath = match[1].trim()
      if (implPath && !implPath.startsWith("<!--")) {
        // Extract file paths (backtick-wrapped or bare)
        const paths = implPath.match(/`([^`]+)`/g)
        if (paths) {
          for (const p of paths) {
            const cleanPath = p.replace(/`/g, "")
            sourceFiles.push(cleanPath)
          }
        } else if (implPath.startsWith("src/")) {
          sourceFiles.push(implPath)
        }
      }
    }
  }

  // Strategy 2: Look at the File Map section for any file paths
  const fileMapSection = planContent.match(
    /## \d*\.?\s*File Map([\s\S]*?)(?=\n## |\Z)/,
  )
  if (fileMapSection && sourceFiles.length === 0) {
    // Extract all source file paths from the file map
    const pathPattern = /\|\s*`([^`]+)`\s*\|/g
    let match: RegExpExecArray | null
    while ((match = pathPattern.exec(fileMapSection[1])) !== null) {
      const filePath = match[1]
      if (filePath.startsWith("src/") && !filePath.includes("test")) {
        // Check if this file exists
        const fullPath = resolve(rootDir, filePath)
        if (await fileExists(fullPath)) {
          // Read the file and check if it references the requirement ID
          try {
            const fileContent = await readFile(fullPath, "utf-8")
            if (fileContent.includes(reqId)) {
              sourceFiles.push(filePath)
            }
          } catch {
            // File not readable, skip
          }
        }
      }
    }
  }

  return sourceFiles
}

async function findTestFiles(
  rootDir: string,
  sourceFiles: string[],
): Promise<string[]> {
  const testFiles: string[] = []

  for (const srcFile of sourceFiles) {
    // Common test file patterns
    const candidates = [
      srcFile.replace(/^src\//, "test/").replace(/\.ts$/, ".test.ts"),
      srcFile.replace(/^src\//, "src/").replace(/\.ts$/, ".test.ts"),
      srcFile
        .replace(/^src\//, "src/__tests__/")
        .replace(/\.ts$/, ".test.ts"),
      srcFile.replace(/^src\//, "tests/").replace(/\.ts$/, ".test.ts"),
      // JS variants
      srcFile.replace(/^src\//, "test/").replace(/\.js$/, ".test.js"),
      srcFile.replace(/^src\//, "src/").replace(/\.js$/, ".test.js"),
      // Spec variants
      srcFile.replace(/^src\//, "test/").replace(/\.ts$/, ".spec.ts"),
      srcFile.replace(/^src\//, "src/").replace(/\.ts$/, ".spec.ts"),
    ]

    for (const candidate of candidates) {
      const fullPath = resolve(rootDir, candidate)
      if (await fileExists(fullPath)) {
        testFiles.push(candidate)
      }
    }
  }

  return testFiles
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export default tool({
  description:
    "Trace requirements from a FORGE spec through plan, tasks, source files, " +
    "and test files. Returns a traceability matrix showing coverage and gaps " +
    "([NOT IMPLEMENTED], [NO TASK], etc.).",
  args: {
    specId: tool.schema
      .string()
      .optional()
      .describe(
        'Spec ID (e.g., "001") — will search .forge/specs/ for matching directory',
      ),
    specPath: tool.schema
      .string()
      .optional()
      .describe(
        "Direct path to spec.md file (relative to project root or absolute)",
      ),
  },
  async execute(args, context) {
    const rootDir = context.worktree || context.directory

    // Resolve the spec file
    let specFilePath: string
    let specDir: string

    if (args.specPath) {
      specFilePath = resolve(rootDir, args.specPath)
      specDir = resolve(specFilePath, "..")
    } else if (args.specId) {
      const dir = await findSpecDir(rootDir, args.specId)
      if (!dir) {
        return `ERROR: Could not find spec directory for ID "${args.specId}" in .forge/specs/`
      }
      specDir = dir
      specFilePath = join(dir, "spec.md")
      if (!(await fileExists(specFilePath))) {
        return `ERROR: spec.md not found in ${relative(rootDir, dir)}`
      }
    } else {
      return "ERROR: Provide either specId or specPath"
    }

    // Read spec
    let specContent: string
    try {
      specContent = await readFile(specFilePath, "utf-8")
    } catch {
      return `ERROR: Could not read spec at ${specFilePath}`
    }

    // Extract requirements
    const requirements = extractRequirements(specContent)
    if (requirements.length === 0) {
      return `No requirements (FR-NNN / NFR-NNN) found in spec.\nEnsure the spec uses the standard FORGE table format for Functional and Non-Functional Requirements.`
    }

    // Read plan.md (optional)
    const planPath = join(specDir, "plan.md")
    let planContent: string | null = null
    if (await fileExists(planPath)) {
      planContent = await readFile(planPath, "utf-8")
    }

    // Read tasks.md (optional)
    const tasksPath = join(specDir, "tasks.md")
    let tasksContent: string | null = null
    if (await fileExists(tasksPath)) {
      tasksContent = await readFile(tasksPath, "utf-8")
    }

    // Trace each requirement
    const traces: RequirementTrace[] = []

    for (const req of requirements) {
      const trace: RequirementTrace = {
        id: req.id,
        description: req.description,
        planSections: [],
        taskItems: [],
        sourceFiles: [],
        testFiles: [],
      }

      if (planContent) {
        trace.planSections = findPlanReferences(planContent, req.id)
        trace.sourceFiles = await findSourceFiles(
          rootDir,
          planContent,
          req.id,
        )
      }

      if (tasksContent) {
        trace.taskItems = findTaskReferences(tasksContent, req.id)
      }

      if (trace.sourceFiles.length > 0) {
        trace.testFiles = await findTestFiles(rootDir, trace.sourceFiles)
      }

      traces.push(trace)
    }

    // ---------------------------------------------------------------------------
    // Format output
    // ---------------------------------------------------------------------------
    const specRelPath = relative(rootDir, specFilePath)

    let output = `# Traceability Matrix\n\n`
    output += `**Spec**: ${specRelPath}\n`
    output += `**Requirements**: ${requirements.length}\n`
    output += `**Plan**: ${planContent ? "found" : "NOT FOUND"}\n`
    output += `**Tasks**: ${tasksContent ? "found" : "NOT FOUND"}\n\n`

    // Summary statistics
    const withPlan = traces.filter((t) => t.planSections.length > 0).length
    const withTasks = traces.filter((t) => t.taskItems.length > 0).length
    const withSource = traces.filter(
      (t) => t.sourceFiles.length > 0,
    ).length
    const withTests = traces.filter((t) => t.testFiles.length > 0).length

    output += `## Coverage Summary\n\n`
    output += `| Dimension      | Covered | Total | Coverage |\n`
    output += `| -------------- | ------- | ----- | -------- |\n`
    output += `| Plan sections  | ${withPlan} | ${requirements.length} | ${Math.round((withPlan / requirements.length) * 100)}% |\n`
    output += `| Task items     | ${withTasks} | ${requirements.length} | ${Math.round((withTasks / requirements.length) * 100)}% |\n`
    output += `| Source files   | ${withSource} | ${requirements.length} | ${Math.round((withSource / requirements.length) * 100)}% |\n`
    output += `| Test files     | ${withTests} | ${requirements.length} | ${Math.round((withTests / requirements.length) * 100)}% |\n\n`

    // Detailed trace for each requirement
    output += `## Detailed Traces\n\n`

    for (const trace of traces) {
      output += `### ${trace.id}: ${trace.description}\n\n`
      output += `\`\`\`\n`

      // Plan
      if (trace.planSections.length > 0) {
        output += `  Plan:   ${trace.planSections.join(", ")}\n`
      } else {
        output += `  Plan:   [NO PLAN REFERENCE]\n`
      }

      // Tasks
      if (trace.taskItems.length > 0) {
        output += `  Tasks:  ${trace.taskItems.join(", ")}\n`
      } else {
        output += `  Tasks:  [NO TASK]\n`
      }

      // Source
      if (trace.sourceFiles.length > 0) {
        output += `  Source: ${trace.sourceFiles.join(", ")}\n`
      } else {
        output += `  Source: [NOT IMPLEMENTED]\n`
      }

      // Tests
      if (trace.testFiles.length > 0) {
        output += `  Tests:  ${trace.testFiles.join(", ")}\n`
      } else if (trace.sourceFiles.length > 0) {
        output += `  Tests:  [NO TESTS]\n`
      } else {
        output += `  Tests:  [NOT APPLICABLE - no source]\n`
      }

      output += `\`\`\`\n\n`
    }

    // Gaps section
    const gaps = traces.filter(
      (t) =>
        t.planSections.length === 0 ||
        t.taskItems.length === 0 ||
        t.sourceFiles.length === 0,
    )
    if (gaps.length > 0) {
      output += `## Gaps\n\n`
      for (const gap of gaps) {
        const missing: string[] = []
        if (gap.planSections.length === 0) missing.push("plan")
        if (gap.taskItems.length === 0) missing.push("tasks")
        if (gap.sourceFiles.length === 0) missing.push("implementation")
        if (
          gap.sourceFiles.length > 0 &&
          gap.testFiles.length === 0
        )
          missing.push("tests")
        output += `- **${gap.id}**: missing ${missing.join(", ")}\n`
      }
      output += `\n`
    }

    return output
  },
})
