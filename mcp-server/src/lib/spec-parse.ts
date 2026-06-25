/**
 * mcp-server/src/lib/spec-parse.ts — Shared markdown/frontmatter parser.
 *
 * Extracted from the existing .opencode/tools/ for reuse across all
 * MCP tools. Pure functions with no OpenCode imports.
 */

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

/** Parse YAML frontmatter from a markdown file. Returns the raw frontmatter string and the body. */
export function parseFrontmatter(content: string): { frontmatter: string | null; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) return { frontmatter: null, body: content }

  return {
    frontmatter: match[1],
    body: content.slice(match.index! + match[0].length),
  }
}

/** Extract a single field from raw frontmatter (simple key: value). */
export function getFrontmatterField(frontmatter: string, key: string): string | null {
  const pattern = new RegExp(`^${key}:\\s*(.+)$`, "m")
  const match = frontmatter.match(pattern)
  return match ? match[1].trim() : null
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/** Extract all markdown headings and their content. */
export function extractSections(content: string): Map<string, string> {
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

/** Check whether a section body is effectively empty (comments/whitespace only). */
export function isSectionEmpty(body: string): boolean {
  const cleaned = body
    .replace(/<!--.*?-->/gs, "")
    .replace(/\|[\s\-|]*\|/g, "")
    .replace(/^\s*[-*]\s*$/gm, "")
    .trim()
  return cleaned.length === 0
}

// ---------------------------------------------------------------------------
// Pattern Matching
// ---------------------------------------------------------------------------

/** Count occurrences of a regex pattern in a string. */
export function countPattern(content: string, pattern: RegExp): number {
  const matches = content.match(pattern)
  return matches ? matches.length : 0
}

/** Find <text> values matching a regex pattern. */
export function findPattern(content: string, pattern: RegExp): string[] {
  const results: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(content)) !== null) {
    results.push(match[1]?.trim() ?? match[0].trim())
  }
  return results
}

// ---------------------------------------------------------------------------
// Requirement IDs
// ---------------------------------------------------------------------------

/** Extract requirement IDs (FR-NNN, NFR-NNN) from content. */
export function extractRequirementIds(content: string): Set<string> {
  const ids = new Set<string>()
  const pattern = /\b((?:FR|NFR)-\d{3})\b/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(content)) !== null) {
    ids.add(match[1])
  }
  return ids
}
