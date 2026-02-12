import { tool } from "@opencode-ai/plugin"
import { readFile } from "node:fs/promises"
import { resolve, basename, dirname } from "node:path"

/**
 * validate-spec — Validates a spec.md or tech-spec.md for completeness.
 *
 * Checks: empty required fields, [NEEDS CLARIFICATION] markers, user stories
 * without acceptance criteria, NFRs without metrics, missing constitution
 * compliance, missing cross-references.
 *
 * Returns a structured validation report with a completeness score 0-100%.
 */

// ---------------------------------------------------------------------------
// Section definitions for spec.md
// ---------------------------------------------------------------------------
const SPEC_REQUIRED_SECTIONS = [
  "Overview",
  "Problem Statement",
  "User Stories",
  "Functional Requirements",
  "Non-Functional Requirements",
  "Edge Cases",
  "Data Requirements",
  "Out of Scope",
  "Constitution Compliance",
  "Cross-References",
]

// Section definitions for tech-spec.md (Quick track — lighter)
const TECH_SPEC_REQUIRED_SECTIONS = [
  "Overview",
  "Requirements",
  "Tasks",
  "Acceptance Criteria",
  "Cross-References",
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Issue {
  severity: "CRITICAL" | "WARNING" | "INFO"
  category: string
  message: string
}

function extractSections(content: string): Map<string, string> {
  const sections = new Map<string, string>()
  const lines = content.split("\n")
  let currentSection = ""
  let currentBody: string[] = []

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,3}\s+(?:\d+\.\s*)?(.+)/)
    if (headerMatch) {
      if (currentSection) {
        sections.set(currentSection, currentBody.join("\n").trim())
      }
      currentSection = headerMatch[1].trim()
      currentBody = []
    } else {
      currentBody.push(line)
    }
  }
  if (currentSection) {
    sections.set(currentSection, currentBody.join("\n").trim())
  }
  return sections
}

function isSectionEmpty(body: string): boolean {
  // Remove comments, template placeholders, empty table rows, and whitespace
  const cleaned = body
    .replace(/<!--.*?-->/gs, "")
    .replace(/\|[\s\-|]*\|/g, "")
    .replace(/^\s*[-*]\s*$/gm, "")
    .trim()
  return cleaned.length === 0
}

function countPattern(content: string, pattern: RegExp): number {
  const matches = content.match(pattern)
  return matches ? matches.length : 0
}

function checkUserStories(content: string): Issue[] {
  const issues: Issue[] = []
  // Find user story blocks (### US-NNN: ...)
  const storyPattern = /###\s+US-\d{3}:\s*(.+)/g
  let match: RegExpExecArray | null

  while ((match = storyPattern.exec(content)) !== null) {
    const storyTitle = match[1].trim()
    // Find the text between this story header and the next ### header
    const startIdx = match.index + match[0].length
    const nextHeader = content.indexOf("\n###", startIdx)
    const nextSection = content.indexOf("\n## ", startIdx)
    const endIdx = Math.min(
      nextHeader === -1 ? content.length : nextHeader,
      nextSection === -1 ? content.length : nextSection,
    )
    const storyBody = content.slice(startIdx, endIdx)

    // Check for placeholder title
    if (storyTitle === "[Title]" || storyTitle.startsWith("[")) {
      issues.push({
        severity: "WARNING",
        category: "User Stories",
        message: `Story "${storyTitle}" has a placeholder title`,
      })
    }

    // Check for acceptance criteria
    if (!/Acceptance Criteria/i.test(storyBody)) {
      issues.push({
        severity: "CRITICAL",
        category: "User Stories",
        message: `Story "${storyTitle}" is missing acceptance criteria`,
      })
    } else {
      // Check that criteria have actual content (not just template)
      const criteriaLines = storyBody
        .split("\n")
        .filter((l) => l.match(/^-\s+Given/i))
      const templateCriteria = criteriaLines.filter((l) =>
        l.includes("[precondition]"),
      )
      if (
        criteriaLines.length === 0 ||
        templateCriteria.length === criteriaLines.length
      ) {
        issues.push({
          severity: "WARNING",
          category: "User Stories",
          message: `Story "${storyTitle}" has only template acceptance criteria`,
        })
      }
    }
  }

  return issues
}

function checkNFRs(content: string): Issue[] {
  const issues: Issue[] = []
  // Find NFR rows in the table: | NFR-NNN | Category | Requirement | Target |
  const nfrPattern = /\|\s*(NFR-\d{3})\s*\|\s*(\S.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/g
  let match: RegExpExecArray | null

  while ((match = nfrPattern.exec(content)) !== null) {
    const [, id, , requirement, target] = match
    const reqClean = requirement.trim()
    const targetClean = target.trim()

    if (!reqClean) {
      issues.push({
        severity: "WARNING",
        category: "Non-Functional Requirements",
        message: `${id} has no requirement description`,
      })
    }
    if (!targetClean) {
      issues.push({
        severity: "WARNING",
        category: "Non-Functional Requirements",
        message: `${id} has no measurable target/metric`,
      })
    } else if (!/\d/.test(targetClean)) {
      issues.push({
        severity: "INFO",
        category: "Non-Functional Requirements",
        message: `${id} target "${targetClean}" may not be measurable (no numeric value found)`,
      })
    }
  }

  return issues
}

function checkFRs(content: string): Issue[] {
  const issues: Issue[] = []
  // Find FR rows: | FR-NNN | Requirement | Priority | Story Ref |
  const frPattern =
    /\|\s*(FR-\d{3})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/g
  let match: RegExpExecArray | null

  while ((match = frPattern.exec(content)) !== null) {
    const [, id, requirement, priority, storyRef] = match
    if (!requirement.trim()) {
      issues.push({
        severity: "CRITICAL",
        category: "Functional Requirements",
        message: `${id} has no requirement description`,
      })
    }
    if (!priority.trim()) {
      issues.push({
        severity: "WARNING",
        category: "Functional Requirements",
        message: `${id} has no priority set`,
      })
    }
    if (!storyRef.trim()) {
      issues.push({
        severity: "INFO",
        category: "Functional Requirements",
        message: `${id} has no story reference for traceability`,
      })
    }
  }

  return issues
}

function checkConstitutionCompliance(content: string): Issue[] {
  const issues: Issue[] = []
  // Look for the Constitution Compliance section with article rows
  const complianceSection = content.match(
    /## \d*\.?\s*Constitution Compliance([\s\S]*?)(?=\n## |\n---|\Z)/,
  )
  if (!complianceSection) {
    issues.push({
      severity: "CRITICAL",
      category: "Constitution Compliance",
      message: "Missing Constitution Compliance section entirely",
    })
    return issues
  }

  // Check each article row: | Art. N | Status | Notes |
  const articlePattern =
    /\|\s*Art\.\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/g
  let match: RegExpExecArray | null
  let articlesFound = 0

  while ((match = articlePattern.exec(complianceSection[1])) !== null) {
    articlesFound++
    const [, artNum, status] = match
    if (!status.trim()) {
      issues.push({
        severity: "WARNING",
        category: "Constitution Compliance",
        message: `Article ${artNum} has no compliance status`,
      })
    }
  }

  if (articlesFound === 0) {
    issues.push({
      severity: "WARNING",
      category: "Constitution Compliance",
      message:
        "Constitution Compliance section exists but has no article entries",
    })
  }

  return issues
}

function checkCrossReferences(content: string): Issue[] {
  const issues: Issue[] = []
  const crossRefSection = content.match(
    /## \s*Cross-References([\s\S]*?)(?=\n## |\Z)/,
  )
  if (!crossRefSection) {
    issues.push({
      severity: "WARNING",
      category: "Cross-References",
      message: "Missing Cross-References section",
    })
    return issues
  }

  // Check for required references
  const body = crossRefSection[1]
  if (!/constitution/i.test(body)) {
    issues.push({
      severity: "INFO",
      category: "Cross-References",
      message: "No reference to constitution.md",
    })
  }
  if (!/architecture/i.test(body)) {
    issues.push({
      severity: "INFO",
      category: "Cross-References",
      message: "No reference to architecture document",
    })
  }

  return issues
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export default tool({
  description:
    "Validate a FORGE spec.md or tech-spec.md for completeness. " +
    "Returns a structured report with completeness score (0-100%), " +
    "empty required fields, [NEEDS CLARIFICATION] count, stories without " +
    "acceptance criteria, NFRs without metrics, and missing sections.",
  args: {
    specPath: tool.schema
      .string()
      .describe(
        "Path to the spec.md or tech-spec.md file to validate (relative to project root or absolute)",
      ),
  },
  async execute(args, context) {
    const rootDir = context.worktree || context.directory
    const specPath = resolve(rootDir, args.specPath)
    const fileName = basename(specPath)

    // Read the spec file
    let content: string
    try {
      content = await readFile(specPath, "utf-8")
    } catch {
      return `ERROR: Could not read spec file at ${specPath}`
    }

    // Determine spec type
    const isTechSpec = fileName.includes("tech-spec")
    const requiredSections = isTechSpec
      ? TECH_SPEC_REQUIRED_SECTIONS
      : SPEC_REQUIRED_SECTIONS

    const issues: Issue[] = []
    const sections = extractSections(content)

    // -----------------------------------------------------------------------
    // 1. Check required sections exist and are not empty
    // -----------------------------------------------------------------------
    let sectionsPresent = 0
    for (const section of requiredSections) {
      const found = Array.from(sections.entries()).find(
        ([key]) => key.toLowerCase().includes(section.toLowerCase()),
      )
      if (!found) {
        issues.push({
          severity: "CRITICAL",
          category: "Missing Sections",
          message: `Required section "${section}" not found`,
        })
      } else if (isSectionEmpty(found[1])) {
        issues.push({
          severity: "WARNING",
          category: "Empty Sections",
          message: `Section "${found[0]}" is empty or contains only template placeholders`,
        })
      } else {
        sectionsPresent++
      }
    }

    // -----------------------------------------------------------------------
    // 2. Count [NEEDS CLARIFICATION] markers
    // -----------------------------------------------------------------------
    const clarificationCount = countPattern(
      content,
      /\[NEEDS CLARIFICATION\]/gi,
    )
    if (clarificationCount > 0) {
      issues.push({
        severity: "WARNING",
        category: "Unresolved Questions",
        message: `Found ${clarificationCount} [NEEDS CLARIFICATION] marker(s) — resolve before implementation`,
      })
    }

    // -----------------------------------------------------------------------
    // 3. Full spec checks (not applicable to tech-spec)
    // -----------------------------------------------------------------------
    if (!isTechSpec) {
      issues.push(...checkUserStories(content))
      issues.push(...checkNFRs(content))
      issues.push(...checkFRs(content))
      issues.push(...checkConstitutionCompliance(content))
      issues.push(...checkCrossReferences(content))
    } else {
      // Tech-spec: check acceptance criteria exist
      const acSection = Array.from(sections.entries()).find(([key]) =>
        key.toLowerCase().includes("acceptance criteria"),
      )
      if (!acSection || isSectionEmpty(acSection[1])) {
        issues.push({
          severity: "CRITICAL",
          category: "Acceptance Criteria",
          message:
            "Tech spec has no acceptance criteria — required for Quick track",
        })
      }
      issues.push(...checkCrossReferences(content))
    }

    // -----------------------------------------------------------------------
    // 4. Check metadata fields
    // -----------------------------------------------------------------------
    const metadataFields = ["Status", "Author", "Date", "Track", "Spec ID"]
    for (const field of metadataFields) {
      const pattern = new RegExp(
        `\\|\\s*${field}\\s*\\|\\s*(.*?)\\s*\\|`,
      )
      const match = content.match(pattern)
      if (!match) {
        issues.push({
          severity: "INFO",
          category: "Metadata",
          message: `Metadata field "${field}" not found`,
        })
      } else {
        const value = match[1].trim()
        if (
          !value ||
          value === "YYYY-MM-DD" ||
          value === "NNN" ||
          value.startsWith("<!--")
        ) {
          issues.push({
            severity: "WARNING",
            category: "Metadata",
            message: `Metadata field "${field}" has a placeholder value: "${value}"`,
          })
        }
      }
    }

    // -----------------------------------------------------------------------
    // 5. Calculate completeness score
    // -----------------------------------------------------------------------
    const criticalCount = issues.filter(
      (i) => i.severity === "CRITICAL",
    ).length
    const warningCount = issues.filter(
      (i) => i.severity === "WARNING",
    ).length
    const infoCount = issues.filter((i) => i.severity === "INFO").length

    // Scoring: start at 100, deduct for issues
    // CRITICAL: -15 each, WARNING: -5 each, INFO: -1 each
    const rawScore = Math.max(
      0,
      100 - criticalCount * 15 - warningCount * 5 - infoCount * 1,
    )
    const score = Math.min(100, rawScore)

    // -----------------------------------------------------------------------
    // 6. Format output
    // -----------------------------------------------------------------------
    const specType = isTechSpec ? "Tech Spec" : "Spec"
    const relativePath = args.specPath

    let output = `# Validation Report: ${specType}\n\n`
    output += `**File**: ${relativePath}\n`
    output += `**Completeness Score**: ${score}%\n`
    output += `**Issues**: ${criticalCount} critical, ${warningCount} warnings, ${infoCount} info\n`
    output += `**[NEEDS CLARIFICATION]**: ${clarificationCount} marker(s)\n`
    output += `**Sections**: ${sectionsPresent}/${requiredSections.length} populated\n\n`

    if (score === 100) {
      output += `> PASS — Spec is complete and ready for implementation.\n\n`
    } else if (score >= 70) {
      output += `> NEEDS WORK — Spec has issues that should be addressed before implementation.\n\n`
    } else {
      output += `> NOT READY — Spec has significant gaps. Address critical issues first.\n\n`
    }

    if (issues.length > 0) {
      output += `## Issues\n\n`

      // Group by severity
      for (const severity of ["CRITICAL", "WARNING", "INFO"] as const) {
        const sevIssues = issues.filter((i) => i.severity === severity)
        if (sevIssues.length === 0) continue

        const icon =
          severity === "CRITICAL"
            ? "[X]"
            : severity === "WARNING"
              ? "[!]"
              : "[i]"
        output += `### ${severity} (${sevIssues.length})\n\n`
        for (const issue of sevIssues) {
          output += `- ${icon} **${issue.category}**: ${issue.message}\n`
        }
        output += `\n`
      }
    }

    return output
  },
})
