/**
 * mcp-server/src/tools/validate-spec.ts — Spec validation logic.
 *
 * Pure function extracted from .opencode/tools/validate-spec.ts.
 * Validates a FORGE spec.md or tech-spec.md for completeness.
 */

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseFrontmatter, extractSections, isSectionEmpty, countPattern, findPattern } from "../lib/spec-parse"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  specPath: string
  completeness: number
  emptyRequiredFields: string[]
  needsClarification: string[]
  storiesWithoutCriteria: string[]
  nfrsWithoutMetrics: string[]
  missingSections: string[]
  critical: number
  warnings: number
  info: number
}

// ---------------------------------------------------------------------------
// Config
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

const TECH_SPEC_REQUIRED_SECTIONS = [
  "Overview",
  "Requirements",
  "Tasks",
  "Acceptance Criteria",
  "Cross-References",
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function validateSpec(specPath: string): Promise<ValidationResult> {
  const absPath = resolve(specPath)
  const content = await readFile(absPath, "utf-8")
  const { frontmatter, body } = parseFrontmatter(content)
  const sections = extractSections(body)

  // Determine type
  const isTechSpec = body.includes("## Tasks") || basenameNoExt(specPath) === "tech-spec"
  const requiredSections = isTechSpec ? TECH_SPEC_REQUIRED_SECTIONS : SPEC_REQUIRED_SECTIONS

  const emptyRequiredFields: string[] = []
  const needsClarification: string[] = []
  const storiesWithoutCriteria: string[] = []
  const nfrsWithoutMetrics: string[] = []
  const missingSections: string[] = []

  // Check required sections
  for (const sectionName of requiredSections) {
    const sectionBody = sections.get(sectionName)
    if (!sectionBody) {
      missingSections.push(sectionName)
      continue
    }
    if (isSectionEmpty(sectionBody)) {
      emptyRequiredFields.push(sectionName)
    }
  }

  // Check for [NEEDS CLARIFICATION] markers
  const clarificationMarkers = findPattern(content, /\[NEEDS CLARIFICATION\]\s*(.*)/g)
  needsClarification.push(...clarificationMarkers)

  // Check user stories for acceptance criteria
  if (!isTechSpec) {
    const storyPattern = /###\s+US-\d{3}:\s*(.+)/g
    let match: RegExpExecArray | null
    while ((match = storyPattern.exec(content)) !== null) {
      const storyTitle = match[1].trim()
      const startIdx = match.index + match[0].length
      // Find the next section or story header after this story
      const storyEnd = content.indexOf("\n## ", startIdx)
      const nextStoryEnd = content.indexOf("\n### US-", startIdx + 1)
      const endIdx = nextStoryEnd === -1
        ? (storyEnd === -1 ? content.length : storyEnd)
        : (storyEnd === -1 ? nextStoryEnd : Math.min(nextStoryEnd, storyEnd))
      const storyBody = content.slice(startIdx, endIdx === -1 ? content.length : endIdx)

      const hasCriteria = /acceptance\s*criteria|\*\*AC\*\*|Scenario:|Given/.test(storyBody)
      if (!hasCriteria) {
        storiesWithoutCriteria.push(storyTitle)
      }
    }
  }

  // Check NFRs for metrics
  // NFR rows: | ID | Category | Requirement | Target/Metric |
  // Match the full row after the NFR ID to check all cells
  const nfrPattern = /\|\s*(NFR-\d{3})\s*\|([^\n]+)/g
  let nfrMatch: RegExpExecArray | null
  while ((nfrMatch = nfrPattern.exec(content)) !== null) {
    const nfrId = nfrMatch[1].trim()
    const nfrRow = nfrMatch[2] // everything after the ID column
    // Check if any cell in the row contains a measurable metric
    const hasMetric = /\d+\s*(ms|s|%|req\/s|rps|concurrent|MB|GB|KB|hour|day|week|month)/i.test(nfrRow)
    if (!hasMetric) {
      nfrsWithoutMetrics.push(nfrId)
    }
  }

  // Compute completeness
  const totalChecks = requiredSections.length + Math.max(needsClarification.length, 1)
  const passedChecks = requiredSections.length - missingSections.length - emptyRequiredFields.length
  const clarificationPenalty = Math.min(needsClarification.length * 5, 30) // up to 30% penalty
  const completeness = Math.max(0, Math.min(100, Math.round((passedChecks / requiredSections.length) * 100 - clarificationPenalty)))

  return {
    specPath: absPath,
    completeness,
    emptyRequiredFields,
    needsClarification,
    storiesWithoutCriteria,
    nfrsWithoutMetrics,
    missingSections,
    critical: emptyRequiredFields.length + missingSections.length,
    warnings: storiesWithoutCriteria.length + nfrsWithoutMetrics.length,
    info: needsClarification.length,
  }
}

function basenameNoExt(filePath: string): string {
  const basename = filePath.split("/").pop()?.split("\\").pop() ?? ""
  return basename.replace(/\.[^.]+$/, "")
}
