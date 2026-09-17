/**
 * tests/unit/spec-parse.test.ts — Unit tests for mcp-server/src/lib/spec-parse.ts
 */

import { describe, it, expect } from "vitest"
import {
  parseFrontmatter,
  getFrontmatterField,
  extractSections,
  isSectionEmpty,
  countPattern,
  findPattern,
  extractRequirementIds,
} from "../../mcp-server/src/lib/spec-parse"

describe("parseFrontmatter", () => {
  it("splits frontmatter and body", () => {
    const { frontmatter, body } = parseFrontmatter("---\ntitle: Hi\n---\nBody text\n")
    expect(frontmatter).toBe("title: Hi")
    expect(body).toBe("Body text\n")
  })

  it("returns null frontmatter when absent", () => {
    const { frontmatter, body } = parseFrontmatter("# No frontmatter\n")
    expect(frontmatter).toBeNull()
    expect(body).toBe("# No frontmatter\n")
  })

  it("handles CRLF line endings", () => {
    const { frontmatter, body } = parseFrontmatter("---\r\ntitle: Hi\r\n---\r\nBody\r\n")
    expect(frontmatter).toBe("title: Hi")
    expect(body).toBe("Body\r\n")
  })
})

describe("getFrontmatterField", () => {
  it("extracts a simple key", () => {
    expect(getFrontmatterField("title: Hi\nversion: 2", "title")).toBe("Hi")
  })

  it("returns null for missing keys", () => {
    expect(getFrontmatterField("title: Hi", "nope")).toBeNull()
  })
})

describe("extractSections", () => {
  it("maps h1-h3 headings to trimmed bodies", () => {
    const sections = extractSections("# Alpha\nhello\n## Beta\nworld\n")
    expect(sections.get("Beta")).toBe("world")
    // A heading's body runs until the next heading of the same or higher
    // level, so a parent keeps its subsections.
    expect(sections.get("Alpha")).toContain("hello")
    expect(sections.get("Alpha")).toContain("## Beta")
  })

  it("strips numeric prefixes from headings", () => {
    const sections = extractSections("## 1. Scope\ntext\n")
    expect(sections.get("Scope")).toBe("text")
  })

  it("ignores h4+ headings (treated as body text)", () => {
    const sections = extractSections("# A\n#### deep\ntext\n")
    expect(sections.get("A")).toContain("#### deep")
  })

  it("closes a section at the next heading of the same level", () => {
    const sections = extractSections("## One\na\n## Two\nb\n")
    expect(sections.get("One")).toBe("a")
    expect(sections.get("Two")).toBe("b")
  })

  it("keeps a parent section non-empty when it only holds subsections", () => {
    // FORGE's spec template puts `### US-001:` directly under
    // `## User Stories`. Treating the `###` as a terminator left the parent
    // empty, and every correctly formatted spec was reported as missing its
    // User Stories section.
    const sections = extractSections("## User Stories\n\n### US-001: Login\nAs a user...\n")
    expect(sections.has("User Stories")).toBe(true)
    expect(isSectionEmpty(sections.get("User Stories") ?? "")).toBe(false)
    expect(sections.get("US-001: Login")).toContain("As a user")
  })

  it("registers a present-but-empty section rather than omitting it", () => {
    // The caller distinguishes "missing" from "empty"; that requires the
    // key to exist even when the body is blank.
    const sections = extractSections("## Edge Cases\n\n## Next\nx\n")
    expect(sections.has("Edge Cases")).toBe(true)
    expect(isSectionEmpty(sections.get("Edge Cases") ?? "")).toBe(true)
  })

  it("handles a deeper heading following a shallower one", () => {
    const sections = extractSections("### Deep\na\n## Shallow\nb\n")
    expect(sections.get("Deep")).toBe("a")
    expect(sections.get("Shallow")).toBe("b")
  })
})

describe("isSectionEmpty", () => {
  it("treats empty and whitespace-only as empty", () => {
    expect(isSectionEmpty("")).toBe(true)
    expect(isSectionEmpty("  \n\t ")).toBe(true)
  })

  it("strips plain HTML comments", () => {
    expect(isSectionEmpty("<!-- hello -->")).toBe(true)
    expect(isSectionEmpty("<!---->")).toBe(true)
  })

  it("strips nested comments without residue (security fix)", () => {
    expect(isSectionEmpty("<!-- <!-- -->")).toBe(true)
  })

  it("honors the --!> closer and drops unterminated tails", () => {
    expect(isSectionEmpty("<!-- x --!>")).toBe(true)
    expect(isSectionEmpty("<!--")).toBe(true)
  })

  it("keeps real text outside comments", () => {
    expect(isSectionEmpty("Hello world")).toBe(false)
    expect(isSectionEmpty("Hello <!-- x -->")).toBe(false)
    expect(isSectionEmpty("x <!-- unterminated")).toBe(false)
  })

  it("strips table separators and bare bullets", () => {
    expect(isSectionEmpty("| --- |")).toBe(true)
    expect(isSectionEmpty("- ")).toBe(true)
  })
})

describe("countPattern", () => {
  it("counts matches with a global regex", () => {
    expect(countPattern("aaa", /a/g)).toBe(3)
  })

  it("returns 0 without match", () => {
    expect(countPattern("bbb", /a/g)).toBe(0)
  })
})

describe("findPattern", () => {
  it("collects capture group 1 across matches", () => {
    expect(findPattern("a1 a2", /a(\d)/g)).toEqual(["1", "2"])
  })

  it("falls back to full match without groups", () => {
    expect(findPattern("ab cd", /\w+/g)).toEqual(["ab", "cd"])
  })

  it("returns empty array without match", () => {
    expect(findPattern("xyz", /a(\d)/g)).toEqual([])
  })
})

describe("extractRequirementIds", () => {
  it("extracts FR-NNN and NFR-NNN ids", () => {
    expect(extractRequirementIds("See FR-001 and NFR-042.")).toEqual(
      new Set(["FR-001", "NFR-042"]),
    )
  })

  it("dedupes and ignores malformed ids", () => {
    expect(extractRequirementIds("FR-001 FR-001 FR-1 FR-0001")).toEqual(new Set(["FR-001"]))
  })

  it("returns empty set without ids", () => {
    expect(extractRequirementIds("no requirements here")).toEqual(new Set())
  })
})
