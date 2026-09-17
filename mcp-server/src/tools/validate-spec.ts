/**
 * mcp-server/src/tools/validate-spec.ts — Spec validation logic.
 *
 * Pure function. The OpenCode-native copy was consolidated here and removed (#68).
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
  /** FRs missing a description, priority or story reference ("FR-001: no description"). */
  frIssues: string[]
  /** Constitution article rows without a status ("Article 5: no status"). */
  constitutionIssues: string[]
  /** Thin cross-reference sections ("no mention of the constitution"). */
  crossReferenceIssues: string[]
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
  const frIssues: string[] = []
  let frMissingDescription = 0
  const constitutionIssues: string[] = []
  const crossReferenceIssues: string[] = []

  // Check required sections.
  //
  // `has` rather than truthiness: a present-but-empty section must be
  // reported as empty, not as missing. Testing `!sectionBody` collapsed the
  // two cases, which made `emptyRequiredFields` unreachable and mislabelled
  // every empty section as absent.
  for (const sectionName of requiredSections) {
    if (!sections.has(sectionName)) {
      missingSections.push(sectionName)
      continue
    }
    if (isSectionEmpty(sections.get(sectionName) ?? "")) {
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

  // Check FRs for description, priority and story reference.
  // Matches the table shapes FORGE emits (`| FR-001 | text | prio | ref |`
  // and shorter variants, with optionally bolded IDs); a row with fewer
  // cells simply has nothing to check in the missing positions.
  if (!isTechSpec) {
    const frPattern = /^\s*\|\s*\*{0,2}(FR-\d+)\*{0,2}\s*\|([^\n]*)$/gm
    let frMatch: RegExpExecArray | null
    while ((frMatch = frPattern.exec(content)) !== null) {
      const frId = frMatch[1]
      const cells = frMatch[2].split("|").map((c) => c.trim())
      const [requirement = "", priority = "", storyRef = ""] = cells
      if (!requirement) {
        frIssues.push(`${frId}: no requirement description`)
        frMissingDescription++
      } else {
        if (!priority) frIssues.push(`${frId}: no priority set`)
        if (!storyRef) frIssues.push(`${frId}: no story reference for traceability`)
      }
    }
  }

  // Check constitution article rows for a status. An absent section is
  // already reported via missingSections; only the rows are new here.
  if (!isTechSpec) {
    const complianceBody = sections.get("Constitution Compliance") ?? ""
    if (complianceBody) {
      const articlePattern = /\|\s*Art\.\s*(\d+)\s*\|([^\n]*)$/gm
      let artMatch: RegExpExecArray | null
      let articlesFound = 0
      while ((artMatch = articlePattern.exec(complianceBody)) !== null) {
        articlesFound++
        const status = (artMatch[2].split("|")[0] ?? "").trim()
        if (!status) constitutionIssues.push(`Article ${artMatch[1]}: no compliance status`)
      }
      if (articlesFound === 0) {
        constitutionIssues.push("Constitution Compliance section has no article entries")
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

  // Check cross-reference content. An absent section is already reported
  // via missingSections; only a thin section is new here.
  if (!isTechSpec) {
    const crossRefBody = sections.get("Cross-References") ?? ""
    if (crossRefBody) {
      if (!/constitution/i.test(crossRefBody)) {
        crossReferenceIssues.push("Cross-References: no mention of the constitution")
      }
      if (!/architect/i.test(crossRefBody)) {
        crossReferenceIssues.push("Cross-References: no mention of the architecture document")
      }
    }
  }

  // Compute completeness. Section-level findings set the base score; the
  // content checks ported from the OpenCode implementation (#68) penalise
  // on top, with an undescribed FR weighing most — a requirement row with
  // no requirement is not a requirement.
  const FR_DESCRIPTION_PENALTY = 10
  const CONTENT_FINDING_PENALTY = 2
  const contentPenalty =
    FR_DESCRIPTION_PENALTY * frMissingDescription +
    CONTENT_FINDING_PENALTY *
      (frIssues.length - frMissingDescription + constitutionIssues.length + crossReferenceIssues.length)
  const passedChecks = requiredSections.length - missingSections.length - emptyRequiredFields.length
  const clarificationPenalty = Math.min(needsClarification.length * 5, 30) // up to 30% penalty
  const completeness = Math.max(
    0,
    Math.min(
      100,
      Math.round((passedChecks / requiredSections.length) * 100 - clarificationPenalty - contentPenalty),
    ),
  )

  return {
    specPath: absPath,
    completeness,
    emptyRequiredFields,
    needsClarification,
    storiesWithoutCriteria,
    nfrsWithoutMetrics,
    missingSections,
    frIssues,
    constitutionIssues,
    crossReferenceIssues,
    critical: emptyRequiredFields.length + missingSections.length + frMissingDescription,
    warnings:
      storiesWithoutCriteria.length +
      nfrsWithoutMetrics.length +
      (frIssues.length - frMissingDescription) +
      constitutionIssues.length,
    info: needsClarification.length + crossReferenceIssues.length,
  }
}

function basenameNoExt(filePath: string): string {
  const basename = filePath.split("/").pop()?.split("\\").pop() ?? ""
  return basename.replace(/\.[^.]+$/, "")
}
