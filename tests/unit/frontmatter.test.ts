/**
 * tests/unit/frontmatter.test.ts — Frontmatter projection engine.
 *
 * Byte-copying OpenCode frontmatter onto Claude Code and Codex ships keys
 * those platforms do not understand while omitting keys they require.
 * These tests pin the parse/drop/serialize contract the platform
 * projections build on.
 */

import { describe, it, expect } from "vitest"

import {
  parseFrontmatter,
  serializeFrontmatter,
  frontmatterValue,
  renderProjected,
} from "../../installer/frontmatter"

const REVIEWER = `---
description: "FORGE adversarial reviewer: finds real issues"
mode: subagent
permission:
  read: allow
  bash:
    "git diff *": allow
    "*": deny
---

Body text here.
`

describe("parseFrontmatter", () => {
  it("splits top-level keys from nested blocks", () => {
    const { entries, bodyStart } = parseFrontmatter(REVIEWER)
    expect(entries.map((e) => e.key)).toEqual(["description", "mode", "permission"])
    expect(bodyStart).toBeGreaterThan(0)
  })

  it("keeps nested lines attached to their key", () => {
    const { entries } = parseFrontmatter(REVIEWER)
    const perm = entries.find((e) => e.key === "permission")!
    expect(perm.lines.length).toBeGreaterThan(1)
    expect(perm.lines.join("\n")).toContain('"*": deny')
  })

  it("returns no entries for a file without frontmatter", () => {
    const { entries, bodyStart } = parseFrontmatter("# Just a body\n")
    expect(entries).toEqual([])
    expect(bodyStart).toBeNull()
  })

  it("treats an unterminated block as no frontmatter", () => {
    const { entries } = parseFrontmatter("---\ndescription: x\nBody without closer.\n")
    expect(entries).toEqual([])
  })
})

describe("frontmatterValue", () => {
  it("unquotes double-quoted values containing colons", () => {
    const { entries } = parseFrontmatter('---\ndescription: "a: b"\n---\n')
    expect(frontmatterValue(entries, "description")).toBe("a: b")
  })

  it("returns undefined for missing keys and nested blocks", () => {
    const { entries } = parseFrontmatter(REVIEWER)
    expect(frontmatterValue(entries, "agent")).toBeUndefined()
    expect(frontmatterValue(entries, "permission")).toBeUndefined()
  })
})

describe("renderProjected", () => {
  it("drops keys and keeps everything else byte-identical", () => {
    const { entries } = parseFrontmatter(REVIEWER)
    const kept = entries.filter((e) => e.key !== "mode" && e.key !== "permission")
    const out = renderProjected(REVIEWER, kept)
    expect(out).toContain('description: "FORGE adversarial reviewer: finds real issues"')
    expect(out).not.toContain("mode:")
    expect(out).not.toContain('"*": deny')
    expect(out).toContain("Body text here.")
  })

  it("omits the block entirely when nothing remains", () => {
    const out = renderProjected(REVIEWER, [])
    expect(out).not.toContain("---")
    expect(out).toContain("Body text here.")
  })

  it("passes through files without frontmatter unchanged", () => {
    expect(renderProjected("# Body\n", [])).toBe("# Body\n")
  })
})

describe("serializeFrontmatter", () => {
  it("round-trips a parsed block", () => {
    const { entries } = parseFrontmatter(REVIEWER)
    const out = serializeFrontmatter(entries)
    expect(parseFrontmatter(out + "\nbody\n").entries.map((e) => e.key))
      .toEqual(["description", "mode", "permission"])
  })
})
